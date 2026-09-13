-- Deny-by-default RLS on every new Stripe/referral table: enable RLS,
-- add zero policies. Only service_role (which bypasses RLS) may read or
-- write these tables — the browser must never touch them directly.

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.referral_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Remove the old permissive policy that allowed anyone to insert an
-- order-intent row directly from the browser. All order creation now
-- goes through the create-stripe-checkout Edge Function (service_role)
-- or the existing validate-checkout Edge Function (service_role).
drop policy if exists "anyone can record an order intent" on public.checkout_orders;
