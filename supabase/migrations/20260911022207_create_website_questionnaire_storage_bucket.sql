-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL. See the note at the top of
-- 20260911022159_create_website_questionnaire_schema.sql — this file was
-- reconstructed from live introspection of the storage.buckets row and
-- storage.objects RLS policies for the website-questionnaire-assets
-- bucket, not recovered from the original migration text.

insert into storage.buckets (id, name, public, file_size_limit)
values ('website-questionnaire-assets', 'website-questionnaire-assets', false, 52428800)
on conflict (id) do nothing;

-- Files are stored under a path prefixed with the owning user's id
-- (storage.foldername(name)[1]), so each policy scopes access to only
-- the objects whose first path segment matches the caller's auth.uid().
--
-- NOTE: written here in bare `auth.uid()` form (see the initplan note
-- in 20260911022159_create_website_questionnaire_schema.sql) — rewritten
-- to the `(select auth.uid())` initplan form by
-- 20260911022224_fix_website_questionnaire_rls_initplan.sql.
create policy "owner can upload own questionnaire files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can read own questionnaire files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner can delete own questionnaire files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'website-questionnaire-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
