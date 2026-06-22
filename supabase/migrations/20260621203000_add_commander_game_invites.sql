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

alter table public.commander_game_invites enable row level security;

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

drop trigger if exists set_commander_game_invites_updated_at on public.commander_game_invites;
create trigger set_commander_game_invites_updated_at
  before update on public.commander_game_invites
  for each row
  execute function public.set_updated_at();
