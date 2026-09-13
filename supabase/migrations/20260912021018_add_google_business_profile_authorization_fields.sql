-- RECONSTRUCTED, NOT RECOVERED ORIGINAL SQL. See the note at the top of
-- 20260911022159_create_website_questionnaire_schema.sql.

alter table public.website_questionnaire_submissions
  add column if not exists google_business_help text
    check (google_business_help is null or google_business_help in ('yes','no')),
  add column if not exists google_business_authorized boolean not null default false,
  add column if not exists google_business_authorized_name text,
  add column if not exists google_business_authorized_role text,
  add column if not exists google_business_authorized_at timestamptz;

comment on column public.website_questionnaire_submissions.google_business_help is
  'Client''s answer to "Do you want Secret Systems to help set up or manage your Google Business Profile?" (yes/no), from the optional Google Business Profile questionnaire section.';

comment on column public.website_questionnaire_submissions.google_business_authorized is
  'True only if the client checked the required authorization checkbox after selecting Yes. Never true by default or pre-checked.';

comment on column public.website_questionnaire_submissions.google_business_authorized_name is
  'Full name of the person giving authorization. Only meaningful when google_business_authorized is true.';

comment on column public.website_questionnaire_submissions.google_business_authorized_role is
  'Authorizing person''s role with the business. Only meaningful when google_business_authorized is true.';

comment on column public.website_questionnaire_submissions.google_business_authorized_at is
  'Timestamp the authorization checkbox was saved as checked. Null until google_business_authorized becomes true.';
