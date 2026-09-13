-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL. See the note at the top of
-- 20260911022159_create_website_questionnaire_schema.sql.
--
-- Addresses the auth_rls_initplan performance advisory: bare auth.uid()
-- calls in an RLS policy are re-evaluated once per row; wrapping in a
-- scalar subselect `(select auth.uid())` lets Postgres evaluate it once
-- per statement instead.

drop policy if exists "owner can select own submission" on public.website_questionnaire_submissions;
create policy "owner can select own submission"
  on public.website_questionnaire_submissions for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "owner can insert own submission" on public.website_questionnaire_submissions;
create policy "owner can insert own submission"
  on public.website_questionnaire_submissions for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner can update own draft submission" on public.website_questionnaire_submissions;
create policy "owner can update own draft submission"
  on public.website_questionnaire_submissions for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner can select own files" on public.website_questionnaire_files;
create policy "owner can select own files"
  on public.website_questionnaire_files for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "owner can insert own files" on public.website_questionnaire_files;
create policy "owner can insert own files"
  on public.website_questionnaire_files for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "owner can delete own files" on public.website_questionnaire_files;
create policy "owner can delete own files"
  on public.website_questionnaire_files for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "owner can upload own questionnaire files" on storage.objects;
create policy "owner can upload own questionnaire files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "owner can read own questionnaire files" on storage.objects;
create policy "owner can read own questionnaire files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "owner can delete own questionnaire files" on storage.objects;
create policy "owner can delete own questionnaire files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
