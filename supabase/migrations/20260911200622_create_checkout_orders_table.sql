-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL. See the note at the top of
-- 20260911022159_create_website_questionnaire_schema.sql — this file
-- reconstructs checkout_orders' ORIGINAL pre-Stripe shape (the HighLevel
-- order-intent table used by validate-checkout), as it was inspected
-- and recorded at the start of the Stripe migration work, before
-- 20260913000031_extend_checkout_orders_for_stripe.sql altered it.
--
-- Original columns: id, package (constrained to 'website' |
-- 'website_growth'), promo_applied, promo_code, business_name,
-- contact_name, email, phone, destination_key (not null), created_at.
-- A permissive "anyone can record an order intent" policy allowed the
-- browser-facing validate-checkout Edge Function's insert to succeed
-- under the anon key; that policy was later dropped by
-- 20260913000128_enable_rls_on_stripe_and_referral_tables.sql once all
-- order creation moved behind service_role Edge Functions.

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  package text not null
    check (package in ('website','website_growth')),
  promo_applied boolean not null default false,
  promo_code text,
  business_name text,
  contact_name text,
  email text,
  phone text,
  destination_key text not null,
  created_at timestamptz not null default now()
);

alter table public.checkout_orders enable row level security;

create policy "anyone can record an order intent"
  on public.checkout_orders for insert
  to anon, authenticated
  with check (true);
