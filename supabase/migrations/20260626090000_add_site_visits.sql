create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  event_name text not null default 'page_view',
  path text not null,
  pathname text,
  search text,
  referrer text,
  referrer_host text,
  visitor_id text,
  session_id text,
  ip_hash text,
  user_agent text,
  page_title text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  msclkid text,
  screen_width integer,
  screen_height integer,
  viewport_width integer,
  viewport_height integer,
  device_pixel_ratio numeric,
  language text,
  timezone text,
  platform text,
  color_scheme text,
  connection_effective_type text,
  device_type text,
  browser_name text,
  os_name text,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.site_visits
  add column if not exists event_name text not null default 'page_view',
  add column if not exists pathname text,
  add column if not exists search text,
  add column if not exists referrer_host text,
  add column if not exists session_id text,
  add column if not exists page_title text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists fbclid text,
  add column if not exists msclkid text,
  add column if not exists screen_width integer,
  add column if not exists screen_height integer,
  add column if not exists viewport_width integer,
  add column if not exists viewport_height integer,
  add column if not exists device_pixel_ratio numeric,
  add column if not exists language text,
  add column if not exists timezone text,
  add column if not exists platform text,
  add column if not exists color_scheme text,
  add column if not exists connection_effective_type text,
  add column if not exists device_type text,
  add column if not exists browser_name text,
  add column if not exists os_name text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text;

create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);

create index if not exists site_visits_path_idx
  on public.site_visits (path);

create index if not exists site_visits_pathname_idx
  on public.site_visits (pathname);

create index if not exists site_visits_visitor_id_idx
  on public.site_visits (visitor_id);

create index if not exists site_visits_session_id_idx
  on public.site_visits (session_id);

create index if not exists site_visits_utm_source_idx
  on public.site_visits (utm_source);

create index if not exists site_visits_utm_campaign_idx
  on public.site_visits (utm_campaign);

create index if not exists site_visits_referrer_host_idx
  on public.site_visits (referrer_host);

create index if not exists site_visits_country_idx
  on public.site_visits (country);

alter table public.site_visits enable row level security;

drop policy if exists "No direct client access to site visits" on public.site_visits;
create policy "No direct client access to site visits"
  on public.site_visits
  for all
  using (false)
  with check (false);
