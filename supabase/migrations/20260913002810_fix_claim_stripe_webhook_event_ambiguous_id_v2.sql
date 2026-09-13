-- Fix: the function's OUT parameter "id" collided with the target
-- table's "id" column inside "returning *", causing every claim to
-- fail with "column reference id is ambiguous". Rename OUT params
-- with an out_ prefix to avoid any collision with table columns.
--
-- (This version's zero-row branches are further changed by
-- 20260913010937_distinguish_already_processed_from_currently_processing.sql
-- to always return one row instead. Kept here for migration history
-- fidelity.)
drop function if exists public.claim_stripe_webhook_event(text, text, integer);

create function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_stale_after_seconds integer default 120
)
returns table (
  out_id text,
  out_attempt_count integer,
  out_claim_result text -- 'new' | 'retry_failed' | 'retry_stale'
)
language plpgsql
set search_path = public
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
begin
  insert into public.stripe_webhook_events (id, type, status, attempt_count, started_at)
  values (p_event_id, p_event_type, 'processing', 1, now())
  on conflict (id) do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, v_row.attempt_count, 'new'::text;
    return;
  end if;

  select * into v_row from public.stripe_webhook_events where id = p_event_id for update;

  if v_row.status = 'processed' then
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
      return;
    end if;
  end if;
end;
$$;

comment on function public.claim_stripe_webhook_event is
  'Atomically claims a Stripe webhook event for processing. Returns one row if the caller should process the event (new/retry_failed/retry_stale), zero rows if it is already processed or genuinely in-flight and should be ack''d as a no-op duplicate. SUPERSEDED by the version in distinguish_already_processed_from_currently_processing.sql.';
