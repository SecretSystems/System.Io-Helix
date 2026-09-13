-- These three functions are internal payment infrastructure, called
-- only by the stripe-webhook Edge Function using the service_role
-- key. They must never be callable via the public Supabase RPC
-- surface by anon or authenticated users. All three are already
-- SECURITY INVOKER (not DEFINER) with a fixed search_path=public, so
-- they don't escalate privilege themselves -- but PUBLIC currently has
-- EXECUTE, meaning anon/authenticated could invoke them today (RLS on
-- the underlying tables happens to block writes for those roles right
-- now, but that's incidental defense-in-depth, not a guarantee, and
-- must not be the only thing standing between untrusted callers and
-- webhook-ledger internals).
revoke execute on function public.claim_stripe_webhook_event(text, text, integer) from public;
revoke execute on function public.mark_stripe_webhook_event_processed(text) from public;
revoke execute on function public.mark_stripe_webhook_event_failed(text, text) from public;

revoke execute on function public.claim_stripe_webhook_event(text, text, integer) from anon, authenticated;
revoke execute on function public.mark_stripe_webhook_event_processed(text) from anon, authenticated;
revoke execute on function public.mark_stripe_webhook_event_failed(text, text) from anon, authenticated;

-- service_role bypasses GRANT/REVOKE entirely (it has BYPASSRLS and is
-- effectively superuser-equivalent for RLS/ownership purposes in
-- Supabase), so the Edge Function (which uses SUPABASE_SERVICE_ROLE_KEY)
-- is unaffected by these revokes. Grant explicitly anyway for clarity
-- and so this doesn't silently depend only on service_role's implicit
-- bypass.
grant execute on function public.claim_stripe_webhook_event(text, text, integer) to service_role;
grant execute on function public.mark_stripe_webhook_event_processed(text) to service_role;
grant execute on function public.mark_stripe_webhook_event_failed(text, text) to service_role;
