alter table public.commander_games
  add column if not exists display_token text not null default encode(gen_random_bytes(24), 'hex'),
  add column if not exists control_token text not null default encode(gen_random_bytes(24), 'hex');

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
