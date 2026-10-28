select vault.create_secret(
  'https://DOMAIN-APLIKASI/api/feeds/refresh',
  'feed_refresh_url',
  'KabarTekno feed refresh endpoint'
);

select vault.create_secret(
  'SECRET-YANG-SAMA-DENGAN-FEED_REFRESH_SECRET',
  'feed_refresh_secret',
  'KabarTekno feed refresh secret'
);