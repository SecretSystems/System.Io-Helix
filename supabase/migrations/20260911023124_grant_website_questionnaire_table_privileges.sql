-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL. See the note at the top of
-- 20260911022159_create_website_questionnaire_schema.sql.
--
-- Grants matching the live introspected privilege set: RLS policies
-- alone do not grant table-level access -- Postgres also requires the
-- underlying GRANT for the operation to even be attempted (RLS then
-- further restricts which rows are visible/writable). authenticated
-- needs SELECT/INSERT/UPDATE (submissions) and SELECT/INSERT/DELETE
-- (files, no UPDATE) to match what the RLS policies actually allow.

grant select, insert, update on public.website_questionnaire_submissions to authenticated;
grant select, insert, delete on public.website_questionnaire_files to authenticated;
