alter table public.commander_players
  add column if not exists moxfield_deck_url text;
