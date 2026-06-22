create extension if not exists pgcrypto with schema extensions;

create table if not exists public.commander_games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Commander Game',
  state jsonb not null,
  is_active boolean not null default true,
  display_token text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  control_token text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commander_players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  favorite_commander text,
  background_image text,
  moxfield_deck_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commander_game_invites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.commander_games(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  invited_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'added', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commander_game_invites_game_email_key
  on public.commander_game_invites (game_id, invitee_email);

create index if not exists commander_game_invites_owner_idx
  on public.commander_game_invites (owner_id);

create index if not exists commander_game_invites_invitee_email_idx
  on public.commander_game_invites (invitee_email);

create index if not exists commander_game_invites_invited_user_idx
  on public.commander_game_invites (invited_user_id);

alter table public.commander_games enable row level security;
alter table public.commander_players enable row level security;
alter table public.commander_game_invites enable row level security;

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

drop policy if exists "Owners can read game invites" on public.commander_game_invites;
create policy "Owners can read game invites"
  on public.commander_game_invites
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Invitees can read their game invites" on public.commander_game_invites;
create policy "Invitees can read their game invites"
  on public.commander_game_invites
  for select
  using (
    auth.uid() = invited_user_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = invitee_email
  );

drop policy if exists "Owners can insert game invites" on public.commander_game_invites;
create policy "Owners can insert game invites"
  on public.commander_game_invites
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update game invites" on public.commander_game_invites;
create policy "Owners can update game invites"
  on public.commander_game_invites
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete game invites" on public.commander_game_invites;
create policy "Owners can delete game invites"
  on public.commander_game_invites
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

drop trigger if exists set_commander_game_invites_updated_at on public.commander_game_invites;
create trigger set_commander_game_invites_updated_at
  before update on public.commander_game_invites
  for each row
  execute function public.set_updated_at();

create or replace function public.get_commander_game_by_token(
  requested_game_id uuid,
  access_token text
)
returns table(state jsonb)
language sql
security definer
set search_path = public
as $$
  select commander_games.state
  from public.commander_games
  where commander_games.id = requested_game_id
    and commander_games.is_active = true
    and access_token in (commander_games.display_token, commander_games.control_token)
  limit 1;
$$;

create or replace function public.update_commander_game_by_control_token(
  requested_game_id uuid,
  access_token text,
  next_state jsonb,
  next_name text
)
returns table(state jsonb)
language sql
security definer
set search_path = public
as $$
  update public.commander_games
  set
    state = next_state,
    name = coalesce(nullif(next_name, ''), public.commander_games.name)
  where public.commander_games.id = requested_game_id
    and public.commander_games.is_active = true
    and public.commander_games.control_token = access_token
  returning public.commander_games.state;
$$;

revoke all on function public.get_commander_game_by_token(uuid, text) from public;
revoke all on function public.update_commander_game_by_control_token(uuid, text, jsonb, text) from public;
grant execute on function public.get_commander_game_by_token(uuid, text) to anon, authenticated;
grant execute on function public.update_commander_game_by_control_token(uuid, text, jsonb, text) to anon, authenticated;
