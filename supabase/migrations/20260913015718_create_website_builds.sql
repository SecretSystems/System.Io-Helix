-- MVP migration for public.website_builds — TO BE APPLIED ONLY AFTER
-- EXPLICIT APPROVAL. This trims the previously-reviewed design to
-- exactly what's needed for one end-to-end factory run:
-- questionnaire -> build -> live URL. Deferred per explicit instruction:
-- website_build_attempts, claim_website_build / worker leasing,
-- attempt-count fencing on updates, customer-facing RLS, rebuild-of-live
-- architecture, advanced monitoring. All of those remain valid future
-- work, not abandoned — just out of scope for this pass.
--
-- Isolated from existing Stripe/referral/questionnaire work: the only
-- touch to an existing table is one additive composite UNIQUE on
-- checkout_orders (id, questionnaire_submission_id), safe because
-- checkout_orders currently has 0 live rows.

-- ============================================================
-- 1. checkout_orders: composite unique needed for the FK below
-- ============================================================
alter table public.checkout_orders
  add constraint checkout_orders_id_questionnaire_unique
  unique (id, questionnaire_submission_id);

-- ============================================================
-- 2. website_builds — canonical table, one row per questionnaire
-- ============================================================
create table public.website_builds (
  id uuid primary key default gen_random_uuid(),

  -- Canonical identity: exactly one website_builds row can ever exist
  -- per questionnaire submission. This UNIQUE constraint is the entire
  -- idempotency mechanism for create_website_build.
  questionnaire_submission_id uuid not null unique
    references public.website_questionnaire_submissions(id),

  -- Nullable: a trusted internal/admin/test trigger can start a build
  -- with no Stripe checkout order attached.
  checkout_order_id uuid,

  -- Copied from the questionnaire at creation time by the RPC (never
  -- trusted from the caller).
  owner_id uuid not null,
  business_name text,

  status text not null default 'queued'
    check (status in (
      'queued','creating_repository','repository_created',
      'preparing_client_data','copying_assets','building','testing',
      'repairing','pushing','deploying','configuring_domain',
      'live','failed','cancelled'
    )),

  current_stage text,
  last_error text,

  attempt_count integer not null default 1
    check (attempt_count >= 1),

  repository_name text,
  repository_url text,

  deployment_url text,
  production_url text,
  subdomain text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,

  -- Composite FK: if checkout_order_id is supplied, it must point to a
  -- checkout_orders row whose OWN questionnaire_submission_id matches
  -- this row's questionnaire_submission_id. Authoritative database-level
  -- protection against an order attaching to the wrong questionnaire.
  constraint website_builds_checkout_order_questionnaire_fkey
    foreign key (checkout_order_id, questionnaire_submission_id)
    references public.checkout_orders (id, questionnaire_submission_id)
);

comment on table public.website_builds is
  'Canonical one-row-per-questionnaire website build record (MVP scope). Owned by System.Io-Helix. Written only through create_website_build / update_website_build / retry_website_build (service_role only) — never directly by Site-Factory or any client.';

create index website_builds_status_idx on public.website_builds (status);
create index website_builds_checkout_order_id_idx on public.website_builds (checkout_order_id);
create index website_builds_owner_id_idx on public.website_builds (owner_id);

create or replace function public.website_builds_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_website_builds_set_updated_at
  before update on public.website_builds
  for each row execute function public.website_builds_set_updated_at();

-- ============================================================
-- 3. RLS — deny-by-default. No client-facing policies.
-- ============================================================
alter table public.website_builds enable row level security;
-- Zero policies: anon and authenticated get no INSERT/UPDATE/DELETE/SELECT.
-- Only service_role (bypasses RLS) can touch this table, via the RPCs
-- below. A future read-only "customer views their own build status"
-- policy is intentionally deferred, not implemented here.

-- ============================================================
-- 4. create_website_build — idempotent, concurrency-safe, payment-agnostic
-- ============================================================
-- The single trusted entry point for starting a build. Callable from:
--   - a trusted internal/admin/test trigger (any server-side caller
--     holding the service_role key), for the immediate MVP goal of
--     "submit a questionnaire, intentionally trigger the factory"
--   - later, the normal paid flow, once Stripe wiring calls this with
--     a checkout_order_id
-- Never exposed to the browser (RLS blocks all client roles; only
-- service_role has EXECUTE below).
create or replace function public.create_website_build(
  p_questionnaire_submission_id uuid,
  p_checkout_order_id uuid default null
)
returns public.website_builds
language plpgsql
set search_path = public
as $$
declare
  v_questionnaire public.website_questionnaire_submissions%rowtype;
  v_order public.checkout_orders%rowtype;
  v_build public.website_builds%rowtype;
begin
  select * into v_questionnaire
    from public.website_questionnaire_submissions
    where id = p_questionnaire_submission_id;

  if not found then
    raise exception 'questionnaire_submission_id % does not exist', p_questionnaire_submission_id
      using errcode = 'foreign_key_violation';
  end if;

  if p_checkout_order_id is not null then
    select * into v_order
      from public.checkout_orders
      where id = p_checkout_order_id;

    if not found then
      raise exception 'checkout_order_id % does not exist', p_checkout_order_id
        using errcode = 'foreign_key_violation';
    end if;

    if v_order.questionnaire_submission_id is distinct from p_questionnaire_submission_id then
      raise exception 'checkout_order_id % is not linked to questionnaire_submission_id %',
        p_checkout_order_id, p_questionnaire_submission_id
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  -- Atomic idempotent create: the UNIQUE constraint on
  -- questionnaire_submission_id, not a SELECT-then-INSERT race, is what
  -- guarantees exactly one row. Two concurrent callers: one INSERT
  -- wins, the other is silently skipped by the conflict clause, and
  -- both then read back the identical row below.
  insert into public.website_builds (
    questionnaire_submission_id,
    checkout_order_id,
    owner_id,
    business_name
  )
  values (
    p_questionnaire_submission_id,
    p_checkout_order_id,
    v_questionnaire.owner_id,
    v_questionnaire.business_name
  )
  on conflict (questionnaire_submission_id) do nothing;

  select * into v_build
    from public.website_builds
    where questionnaire_submission_id = p_questionnaire_submission_id;

  -- create_website_build NEVER mutates an existing row's status: a
  -- queued/in-progress/failed/cancelled/live row is always just
  -- returned as-is. This is what makes "duplicate request after
  -- repository creation" and "duplicate request after live" both
  -- safely return the same canonical row without side effects.
  return v_build;
end;
$$;

revoke all on function public.create_website_build(uuid, uuid) from public;
revoke all on function public.create_website_build(uuid, uuid) from anon;
revoke all on function public.create_website_build(uuid, uuid) from authenticated;
grant execute on function public.create_website_build(uuid, uuid) to service_role;

-- ============================================================
-- 5. update_website_build — normal orchestration progress mechanism
-- ============================================================
-- Explicit named parameters only (no free-form column map). Enforces
-- the status lifecycle: forward progression along the agreed path,
-- any in-progress status may fail/cancel, live is immutable through
-- this RPC, and failed/cancelled cannot cross into each other or into
-- an active status (only retry_website_build can leave those states).
create or replace function public.update_website_build(
  p_website_build_id uuid,
  p_status text default null,
  p_current_stage text default null,
  p_last_error text default null,
  p_repository_name text default null,
  p_repository_url text default null,
  p_deployment_url text default null,
  p_production_url text default null,
  p_subdomain text default null
)
returns public.website_builds
language plpgsql
set search_path = public
as $$
declare
  v_build public.website_builds%rowtype;
  v_old_status text;
  v_new_status text;
begin
  select * into v_build from public.website_builds where id = p_website_build_id for update;
  if not found then
    raise exception 'website_build % does not exist', p_website_build_id
      using errcode = 'no_data_found';
  end if;

  v_old_status := v_build.status;
  v_new_status := coalesce(p_status, v_old_status);

  -- live is a successful terminal state: this RPC can never move a
  -- live row anywhere else. A deliberate rebuild/replacement is a
  -- separate, not-yet-designed business operation.
  if v_old_status = 'live' and p_status is not null and p_status is distinct from 'live' then
    raise exception 'cannot transition website_build % out of live via update_website_build (status=%)',
      p_website_build_id, p_status
      using errcode = 'invalid_parameter_value';
  end if;

  -- failed/cancelled are terminal for THIS RPC: same-state idempotent
  -- calls are fine, but no crossing between them and no jumping back
  -- into an active status. Only retry_website_build can leave these.
  if v_old_status in ('failed','cancelled') and p_status is not null and p_status is distinct from v_old_status then
    raise exception 'website_build % is % — use retry_website_build() to leave this state, not update_website_build() (attempted status=%)',
      p_website_build_id, v_old_status, p_status
      using errcode = 'invalid_parameter_value';
  end if;

  if p_status is not null and p_status is distinct from v_old_status then
    if not (
      p_status in ('failed','cancelled')
      or (v_old_status = 'queued' and p_status = 'creating_repository')
      or (v_old_status = 'creating_repository' and p_status = 'repository_created')
      or (v_old_status = 'repository_created' and p_status = 'preparing_client_data')
      or (v_old_status = 'preparing_client_data' and p_status = 'copying_assets')
      or (v_old_status = 'copying_assets' and p_status = 'building')
      or (v_old_status = 'building' and p_status = 'testing')
      or (v_old_status = 'testing' and p_status = 'pushing')
      or (v_old_status = 'testing' and p_status = 'repairing')
      or (v_old_status = 'repairing' and p_status = 'testing')
      or (v_old_status = 'pushing' and p_status = 'deploying')
      or (v_old_status = 'deploying' and p_status = 'configuring_domain')
      or (v_old_status = 'configuring_domain' and p_status = 'live')
    ) then
      raise exception 'invalid website_build status transition % -> %', v_old_status, p_status
        using errcode = 'invalid_parameter_value';
    end if;
  end if;

  update public.website_builds set
    status = v_new_status,
    current_stage = coalesce(p_current_stage, current_stage),
    last_error = case
      when p_last_error is not null then p_last_error
      when p_status is not null and p_status is distinct from v_old_status and p_status <> 'failed' then null
      else last_error
    end,
    repository_name = coalesce(p_repository_name, repository_name),
    repository_url = coalesce(p_repository_url, repository_url),
    deployment_url = coalesce(p_deployment_url, deployment_url),
    production_url = coalesce(p_production_url, production_url),
    subdomain = coalesce(p_subdomain, subdomain),
    -- Timestamps set ONLY on the actual transition edge, so a repeated
    -- identical request (e.g. failed -> failed, live -> live) never
    -- rewrites them.
    started_at = case
      when v_old_status = 'queued' and v_new_status = 'creating_repository' then now()
      else started_at
    end,
    completed_at = case
      when v_old_status <> 'live' and v_new_status = 'live' then now()
      else completed_at
    end
  where id = p_website_build_id
  returning * into v_build;

  return v_build;
end;
$$;

revoke all on function public.update_website_build(
  uuid, text, text, text, text, text, text, text, text
) from public;
revoke all on function public.update_website_build(
  uuid, text, text, text, text, text, text, text, text
) from anon;
revoke all on function public.update_website_build(
  uuid, text, text, text, text, text, text, text, text
) from authenticated;
grant execute on function public.update_website_build(
  uuid, text, text, text, text, text, text, text, text
) to service_role;

-- ============================================================
-- 6. retry_website_build — explicit only, concurrency-safe
-- ============================================================
create or replace function public.retry_website_build(
  p_website_build_id uuid
)
returns public.website_builds
language plpgsql
set search_path = public
as $$
declare
  v_build public.website_builds%rowtype;
begin
  -- Row lock serializes two simultaneous retry calls: the second sees
  -- the already-retried row (status now 'queued', not 'failed'/
  -- 'cancelled') and is rejected below, guaranteeing attempt_count
  -- increments exactly once regardless of race timing.
  select * into v_build
    from public.website_builds
    where id = p_website_build_id
    for update;

  if not found then
    raise exception 'website_build % does not exist', p_website_build_id
      using errcode = 'no_data_found';
  end if;

  if v_build.status not in ('failed','cancelled') then
    raise exception 'website_build % is % — retry_website_build only applies to failed or cancelled builds',
      p_website_build_id, v_build.status
      using errcode = 'invalid_parameter_value';
  end if;

  update public.website_builds set
    status = 'queued',
    attempt_count = attempt_count + 1,
    last_error = null,
    started_at = null,
    completed_at = null
    -- repository_name/repository_url, deployment_url/production_url/
    -- subdomain are DELIBERATELY NOT reset -- a build can fail after
    -- already creating a GitHub repo or Vercel deployment, and
    -- Site-Factory needs that metadata to resume/reconcile rather than
    -- orphaning it.
  where id = p_website_build_id
  returning * into v_build;

  return v_build;
end;
$$;

revoke all on function public.retry_website_build(uuid) from public;
revoke all on function public.retry_website_build(uuid) from anon;
revoke all on function public.retry_website_build(uuid) from authenticated;
grant execute on function public.retry_website_build(uuid) to service_role;
