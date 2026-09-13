-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL.
--
-- This migration pre-dates the Stripe checkout work and its original
-- applied SQL text was not available in any accessible session
-- transcript, migration-history export, or backup. This file was
-- reconstructed by introspecting the LIVE Supabase schema (columns,
-- constraints, indexes, triggers) for website_questionnaire_submissions
-- and website_questionnaire_files, and represents an equivalent
-- end-state DDL, not necessarily the literal original migration text.
-- Verification that it (together with the other reconstructed
-- migrations) produces a schema matching current production is PENDING
-- until a local Supabase CLI replay has actually been run and diffed
-- against production. Do not treat this file as verified until that
-- test has passed.
--
-- If Secret Systems has access to the original migration SQL (e.g. via
-- the Supabase Dashboard's migration history, or a local backup from
-- before this reconstruction), that original text should replace this
-- file to restore full historical fidelity.

create table if not exists public.website_questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  business_name text,
  contact_name text,
  email text,
  phone text,
  answers jsonb not null default '{}',
  current_section text,
  completion_percentage integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft','submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists website_questionnaire_submissions_owner_id_idx
  on public.website_questionnaire_submissions (owner_id);

create table if not exists public.website_questionnaire_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.website_questionnaire_submissions(id) on delete cascade,
  owner_id uuid not null,
  category text not null
    check (category in ('logos','branding','photos','before_after','team','projects','videos','documents','inspiration','other')),
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists website_questionnaire_files_submission_id_idx
  on public.website_questionnaire_files (submission_id);

create index if not exists website_questionnaire_files_owner_id_idx
  on public.website_questionnaire_files (owner_id);

create or replace function public.website_questionnaire_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_website_questionnaire_updated_at on public.website_questionnaire_submissions;
create trigger trg_website_questionnaire_updated_at
  before update on public.website_questionnaire_submissions
  for each row execute function public.website_questionnaire_set_updated_at();

alter table public.website_questionnaire_submissions enable row level security;
alter table public.website_questionnaire_files enable row level security;

-- NOTE: these policies originally used bare `auth.uid()` (re-evaluated
-- per row, flagged by Supabase's auth_rls_initplan performance
-- advisory). They were rewritten to the `(select auth.uid())` initplan
-- form by 20260911022224_fix_website_questionnaire_rls_initplan.sql —
-- written here in their ORIGINAL form so that migration's DROP/CREATE
-- POLICY statements have something meaningful to change.
create policy "owner can select own submission"
  on public.website_questionnaire_submissions for select
  to authenticated
  using (owner_id = auth.uid());

create policy "owner can insert own submission"
  on public.website_questionnaire_submissions for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owner can update own draft submission"
  on public.website_questionnaire_submissions for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner can select own files"
  on public.website_questionnaire_files for select
  to authenticated
  using (owner_id = auth.uid());

create policy "owner can insert own files"
  on public.website_questionnaire_files for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owner can delete own files"
  on public.website_questionnaire_files for delete
  to authenticated
  using (owner_id = auth.uid());
