-- Schedule the qualify-referrals Edge Function to run hourly via pg_cron
-- + pg_net, so referral qualification and free-month reward application
-- require NO manual action once configured.
--
-- MANUAL SETUP REQUIRED (do this OUTSIDE any AI-assisted session, since a
-- secret pasted into a chat/tool-result is no longer confidential):
--
--   1. Generate a secret:            openssl rand -hex 32
--   2. Store it in Supabase Vault as a secret named: cron_invoke_secret
--      (Dashboard -> Project Settings -> Vault, or via `select
--      vault.create_secret('<value>', 'cron_invoke_secret')`)
--   3. Store the SAME value as a Supabase Edge Function secret named:
--      CRON_INVOKE_SECRET
--      (Dashboard -> Edge Functions -> Manage secrets)
--
-- The qualify-referrals function checks `Authorization: Bearer
-- ${CRON_INVOKE_SECRET}` against this value. A dedicated secret (rather
-- than the Supabase service role key) is used here so a leak of one
-- credential doesn't also expose full database admin access.
--
-- The project URL below is already public and used throughout the
-- existing codebase (ss-checkout-config.js) -- it is not a secret.

select cron.schedule(
  'qualify-referrals-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://govjiysytpxfjvfiabfo.supabase.co/functions/v1/qualify-referrals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
