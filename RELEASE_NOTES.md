# Commander Control v0.1.0

Initial release of Commander Control.

## Highlights

- Tablet-first Commander life tracker and control surface.
- TV display mode for large table-visible life totals.
- Tablet-only play mode with tap-to-adjust life controls.
- Supabase magic-link login.
- Supabase-backed saved game states and saved player profiles.
- Scryfall card-art search for player and game backgrounds.
- Commander damage, poison, experience, energy, and treasure tracking.
- Monarch, initiative, city blessing, day/night, active player, turn timer, random player picker, and d20 roller.
- Life gain, life loss, and poison animations.
- Fire TV Silk compatible ID generation fallback.
- Supabase migration for `commander_games` and `commander_players` with RLS policies.

## Validation

```bash
NODE_ENV=production npm run build
```

Build passes.
