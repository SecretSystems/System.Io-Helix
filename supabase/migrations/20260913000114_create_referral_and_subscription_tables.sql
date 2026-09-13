-- Referral system + subscription mirror + webhook idempotency ledger.

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_stripe_customer_id text not null unique,
  code text not null unique,
  normalized_code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id),
  referrer_stripe_customer_id text not null,
  referred_checkout_order_id uuid unique references public.checkout_orders(id),
  referred_stripe_customer_id text,
  qualification_state text not null default 'pending'
    check (qualification_state in ('pending','qualified','disqualified')),
  hold_until timestamptz,
  disqualified_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists referrals_referred_order_unique
  on public.referrals (referred_checkout_order_id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null unique references public.referrals(id),
  reward_type text not null default 'free_maintenance_month'
    check (reward_type = 'free_maintenance_month'),
  state text not null default 'pending'
    check (state in ('pending','qualified','scheduled','applied','redeemed','cancelled')),
  unredeemable_reason text,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_settings (
  id smallint primary key default 1 check (id = 1),
  hold_period_days integer not null default 14,
  updated_at timestamptz not null default now()
);

insert into public.referral_settings (id, hold_period_days)
values (1, 14)
on conflict (id) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  checkout_order_id uuid references public.checkout_orders(id),
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  status text not null,
  product_key text not null,
  stripe_price_id text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id);

create unique index if not exists subscriptions_sub_id_product_key_key
  on public.subscriptions (stripe_subscription_id, product_key);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- Attach updated_at triggers to all new tables that carry one.
create or replace function public.referral_codes_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_referral_codes_set_updated_at on public.referral_codes;
create trigger trg_referral_codes_set_updated_at
  before update on public.referral_codes
  for each row execute function public.referral_codes_set_updated_at();

create or replace function public.referrals_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_referrals_set_updated_at on public.referrals;
create trigger trg_referrals_set_updated_at
  before update on public.referrals
  for each row execute function public.referrals_set_updated_at();

create or replace function public.referral_rewards_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_referral_rewards_set_updated_at on public.referral_rewards;
create trigger trg_referral_rewards_set_updated_at
  before update on public.referral_rewards
  for each row execute function public.referral_rewards_set_updated_at();

create or replace function public.referral_settings_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_referral_settings_set_updated_at on public.referral_settings;
create trigger trg_referral_settings_set_updated_at
  before update on public.referral_settings
  for each row execute function public.referral_settings_set_updated_at();

create or replace function public.subscriptions_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_subscriptions_set_updated_at on public.subscriptions;
create trigger trg_subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.subscriptions_set_updated_at();
