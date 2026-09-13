-- Rework stripe_webhook_events into a proper processing state machine so
-- that a failure AFTER the event is claimed can still be retried by
-- Stripe, instead of being permanently swallowed as "duplicate".
--
-- States:
--   processing  — claimed, business logic currently running (or crashed
--                 without updating status — see stale-recovery below)
--   processed   — completed successfully, must never reprocess
--   failed      — business logic threw, safe/expected to retry
--
-- Stale "processing" rows (crashed function, no timeout callback) are
-- recovered by treating any processing row older than a threshold as
-- retryable, rather than a permanent lock.

alter table public.stripe_webhook_events
  add column if not exists status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  add column if not exists attempt_count integer not null default 1,
  add column if not exists last_error text,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.stripe_webhook_events
  alter column processed_at drop not null,
  alter column processed_at drop default;

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status);

create or replace function public.stripe_webhook_events_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stripe_webhook_events_set_updated_at on public.stripe_webhook_events;
create trigger trg_stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.stripe_webhook_events_set_updated_at();

-- Atomic claim function: inserts a new "processing" row for a brand new
-- event id, OR re-claims an existing "failed" row (incrementing
-- attempt_count), OR re-claims a "processing" row that has been stuck
-- past the stale timeout. Returns the claimed row so the caller knows
-- which branch it took. Returns zero rows if the event is already
-- "processed" or is "processing" and NOT stale (i.e. a genuine
-- concurrent/duplicate delivery that should be a no-op).
--
-- NOTE: this initial version of the function is superseded by
-- 20260913010937_distinguish_already_processed_from_currently_processing.sql,
-- which changes it to always return exactly one row (never zero) so the
-- caller can distinguish "already processed" from "genuinely in-flight"
-- without an extra query. Kept here for full migration history fidelity.
create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_stale_after_seconds integer default 120
)
returns table (
  id text,
  attempt_count integer,
  claim_result text -- 'new' | 'retry_failed' | 'retry_stale'
)
language plpgsql
set search_path = public
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
begin
  -- Try to insert a brand-new row first.
  insert into public.stripe_webhook_events (id, type, status, attempt_count, started_at)
  values (p_event_id, p_event_type, 'processing', 1, now())
  on conflict (id) do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, v_row.attempt_count, 'new'::text;
    return;
  end if;

  -- Row already existed. Lock it and inspect its state.
  select * into v_row from public.stripe_webhook_events where id = p_event_id for update;

  if v_row.status = 'processed' then
    -- Already done. No claim.
    return;
  end if;

  if v_row.status = 'failed' then
    update public.stripe_webhook_events
      set status = 'processing',
          attempt_count = v_row.attempt_count + 1,
          started_at = now(),
          last_error = null
      where id = p_event_id
      returning * into v_row;
    return query select v_row.id, v_row.attempt_count, 'retry_failed'::text;
    return;
  end if;

  if v_row.status = 'processing' then
    if v_row.started_at < now() - make_interval(secs => p_stale_after_seconds) then
      update public.stripe_webhook_events
        set attempt_count = v_row.attempt_count + 1,
            started_at = now(),
            last_error = 'recovered from stale processing state'
        where id = p_event_id
        returning * into v_row;
      return query select v_row.id, v_row.attempt_count, 'retry_stale'::text;
      return;
    else
      -- Genuinely in-flight elsewhere (or a fast duplicate delivery). No claim.
      return;
    end if;
  end if;
end;
$$;

comment on function public.claim_stripe_webhook_event is
  'Atomically claims a Stripe webhook event for processing. Returns one row if the caller should process the event (new/retry_failed/retry_stale), zero rows if it is already processed or genuinely in-flight and should be ack''d as a no-op duplicate. SUPERSEDED by the version in distinguish_already_processed_from_currently_processing.sql.';
