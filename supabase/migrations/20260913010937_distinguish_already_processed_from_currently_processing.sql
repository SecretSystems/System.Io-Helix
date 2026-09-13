-- Previously, claim_stripe_webhook_event returned ZERO ROWS for both:
--   (a) status='processed' (a genuinely completed duplicate)
--   (b) status='processing' and non-stale (a genuinely in-flight delivery)
-- The webhook could not tell these apart and acked both with 200. That is
-- unsafe for (b): if the ORIGINAL processing attempt later fails to reach
-- "processed" (e.g. mark_processed AND mark_failed both fail), a 200 on a
-- concurrent/immediate retry would tell Stripe delivery succeeded and stop
-- future redelivery, while the ledger row never actually completes.
--
-- Fix: return one row for EVERY outcome, always distinguishing the case via
-- out_claim_result, so the caller never has to guess:
--   'new'                 -> claimed, process it
--   'retry_failed'        -> claimed, process it
--   'retry_stale'         -> claimed, process it
--   'already_processed'   -> NOT claimed, safe to ack 200 (nothing to do)
--   'currently_processing'-> NOT claimed, must NOT ack 200 (business logic
--                            has not been confirmed complete)
create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_stale_after_seconds integer default 120
)
returns table (
  out_id text,
  out_attempt_count integer,
  out_claim_result text -- 'new' | 'retry_failed' | 'retry_stale' | 'already_processed' | 'currently_processing'
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
    return query select v_row.id, v_row.attempt_count, 'already_processed'::text;
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
      return query select v_row.id, v_row.attempt_count, 'currently_processing'::text;
      return;
    end if;
  end if;
end;
$$;

comment on function public.claim_stripe_webhook_event is
  'Atomically claims a Stripe webhook event for processing. out_claim_result is always populated: new/retry_failed/retry_stale mean the caller should process the event now; already_processed means safe to ack 200 with no further action; currently_processing means the caller must NOT ack 200 (business logic completion is unconfirmed) and should return a retryable non-2xx instead.';
