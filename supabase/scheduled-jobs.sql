-- Supabase scheduled jobs for KabarTekno.
-- All times below are UTC (Supabase Postgres defaults to UTC).
-- Jakarta is UTC+7:
--   cleanup daily at 03:00 Jakarta = 20:00 UTC
--   feed refresh at 00:00, 04:00, ..., 20:00 Jakarta = 01,05,09,13,17,21 UTC
--
-- Before scheduling feed refresh:
-- 1. Set FEED_REFRESH_SECRET in the Next.js deployment.
-- 2. Store these values in Supabase Vault (replace the example values):
--
-- select vault.create_secret(
--   'https://<your-app-domain>/api/feeds/refresh',
--   'feed_refresh_url',
--   'KabarTekno feed refresh endpoint'
-- );
-- select vault.create_secret(
--   '<same-value-as-FEED_REFRESH_SECRET>',
--   'feed_refresh_secret',
--   'Shared secret for scheduled feed refresh'
-- );

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Make this script safe to run again after changing job definitions.
select cron.unschedule(jobid)
from cron.job
where jobname in (
  'kabar-tekno-delete-old-unsaved-news',
  'kabar-tekno-refresh-feeds'
);

select cron.schedule(
  'kabar-tekno-delete-old-unsaved-news',
  '0 20 * * *',
  $$
    delete from public.news as n
    where n.published_at < now() - interval '7 days'
      and not exists (
        select 1
        from public.bookmarks as b
        where b.news_id = n.id
      );
  $$
);

select cron.schedule(
  'kabar-tekno-refresh-feeds',
  '0 1,5,9,13,17,21 * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'feed_refresh_url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-refresh-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'feed_refresh_secret'
        )
      ),
      body := jsonb_build_object('source', 'supabase-cron')
    );
  $$
);
