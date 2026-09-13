create or replace function public.mark_stripe_webhook_event_processed(p_event_id text)
returns void
language sql
set search_path = public
as $$
  update public.stripe_webhook_events
    set status = 'processed', processed_at = now(), last_error = null
    where id = p_event_id;
$$;

create or replace function public.mark_stripe_webhook_event_failed(p_event_id text, p_error text)
returns void
language sql
set search_path = public
as $$
  update public.stripe_webhook_events
    set status = 'failed', last_error = p_error
    where id = p_event_id;
$$;
