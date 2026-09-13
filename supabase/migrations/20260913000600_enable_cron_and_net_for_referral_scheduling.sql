-- Required so Postgres itself can invoke the qualify-referrals Edge
-- Function on a schedule, satisfying "no manual action once configured"
-- for the referral reward pipeline without needing an external scheduler.
create extension if not exists pg_cron;
create extension if not exists pg_net;
