create extension if not exists pgcrypto;

create table if not exists public.commander_games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Commander Game',
  state jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commander_players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  favorite_commander text,
  background_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commander_games enable row level security;
alter table public.commander_players enable row level security;

drop policy if exists "Users can read own commander games" on public.commander_games;
create policy "Users can read own commander games"
  on public.commander_games
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own commander games" on public.commander_games;
create policy "Users can insert own commander games"
  on public.commander_games
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own commander games" on public.commander_games;
create policy "Users can update own commander games"
  on public.commander_games
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own commander games" on public.commander_games;
create policy "Users can delete own commander games"
  on public.commander_games
  for delete
  using (auth.uid() = owner_id);

drop policy if exists "Users can read own commander players" on public.commander_players;
create policy "Users can read own commander players"
  on public.commander_players
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own commander players" on public.commander_players;
create policy "Users can insert own commander players"
  on public.commander_players
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own commander players" on public.commander_players;
create policy "Users can update own commander players"
  on public.commander_players
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own commander players" on public.commander_players;
create policy "Users can delete own commander players"
  on public.commander_players
  for delete
  using (auth.uid() = owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_commander_games_updated_at on public.commander_games;
create trigger set_commander_games_updated_at
  before update on public.commander_games
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_commander_players_updated_at on public.commander_players;
create trigger set_commander_players_updated_at
  before update on public.commander_players
  for each row
  execute function public.set_updated_at();
