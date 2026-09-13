-- Extend checkout_orders for the Stripe-based checkout flow, while
-- leaving it fully compatible with the existing HighLevel/validate-checkout
-- flow (package stays nullable-compatible, destination_key untouched here).

alter table public.checkout_orders
  drop constraint if exists checkout_orders_package_check;

alter table public.checkout_orders
  alter column package drop not null;

alter table public.checkout_orders
  add column if not exists selected_products jsonb not null default '[]',
  add column if not exists crm_selected boolean not null default false,
  add column if not exists maintenance_selected boolean not null default false,
  add column if not exists referral_code text,
  add column if not exists referrer_customer_id uuid,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists paid_at timestamptz,
  add column if not exists questionnaire_submission_id uuid references public.website_questionnaire_submissions(id),
  add column if not exists updated_at timestamptz not null default now();

alter table public.checkout_orders
  drop constraint if exists checkout_orders_payment_status_check;

alter table public.checkout_orders
  add constraint checkout_orders_payment_status_check
  check (payment_status in ('pending','processing','paid','payment_failed','refunded','canceled'));

create unique index if not exists checkout_orders_stripe_session_id_key
  on public.checkout_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists checkout_orders_stripe_customer_id_idx
  on public.checkout_orders (stripe_customer_id);

create index if not exists checkout_orders_stripe_subscription_id_idx
  on public.checkout_orders (stripe_subscription_id);

create index if not exists checkout_orders_payment_status_idx
  on public.checkout_orders (payment_status);

create index if not exists checkout_orders_referrer_customer_id_idx
  on public.checkout_orders (referrer_customer_id);

create or replace function public.checkout_orders_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_checkout_orders_set_updated_at on public.checkout_orders;
create trigger trg_checkout_orders_set_updated_at
  before update on public.checkout_orders
  for each row execute function public.checkout_orders_set_updated_at();
