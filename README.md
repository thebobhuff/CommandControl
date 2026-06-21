# Commander Control

Commander Control is a Next.js app for running Magic: The Gathering Commander games from a tablet and displaying game state on a TV. It supports local table play, TV display mode, Supabase login, saved games, saved player profiles, Scryfall card-art backgrounds, and common Commander-specific counters.

Repository: https://github.com/thebobhuff/CommandControl.git

## Features

- Tablet-first life counter and control surface.
- TV display for large, readable player boards.
- Tablet-only mode for games without a TV.
- Player names and card-art background images.
- Scryfall search for game/player background art.
- Supabase password and magic-link login.
- Password reset email delivery through Resend, Brevo, then Supabase fallback.
- Supabase-backed saved game states.
- Supabase-backed saved player profiles.
- Commander damage tracking per opponent.
- Poison, experience, energy, and treasure counters.
- Monarch, initiative, and city blessing statuses.
- Day/night state.
- Active player turn marker and turn timer.
- Random player picker and d20 roller.
- Life gain/loss and poison animations.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ShadCN-style local UI primitives
- Aceternity-inspired visual components
- Supabase Auth and Postgres
- Scryfall API
- Lucide icons

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home and mode selection |
| `/control` | Main tablet controller and setup surface |
| `/tablet` | Tablet-only play mode with large tap targets |
| `/display` | TV display view |
| `/login` | Supabase password, signup, magic-link, and reset-link login |
| `/reset-password` | Password reset form |
| `/games` | Saved Supabase games |
| `/players` | Saved player profiles |
| `/api/auth/password-reset` | Password reset email API |
| `/api/game` | Current game state API |
| `/api/games` | Saved games API |
| `/api/players` | Saved player profiles API |

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="Commander Control <no-reply@your-domain.com>"

BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=no-reply@your-domain.com
BREVO_FROM_NAME="Commander Control"
```

Run the dev server:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open:

- Tablet control: `http://<computer-ip>:3000/control`
- Tablet-only mode: `http://<computer-ip>:3000/tablet`
- TV display: `http://<computer-ip>:3000/display`

For local-only testing on the same machine:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Supabase Setup

Install the Supabase CLI if needed:

```bash
npm install -g supabase
```

Login or provide an access token:

```bash
supabase login
```

or:

```bash
export SUPABASE_ACCESS_TOKEN=your-access-token
```

Link the project:

```bash
supabase link --project-ref yvjgtlqgnqozjhksegol
```

Run migrations:

```bash
supabase db push --linked
```

The migration lives at:

```text
supabase/migrations/20260621120500_create_commander_tables.sql
```

It creates:

- `public.commander_games`
- `public.commander_players`
- Row-level security policies for each authenticated user
- `updated_at` triggers

## Supabase Auth

The app uses Supabase Auth for password login, signup, magic links, and password recovery sessions. In your Supabase dashboard, make sure your Site URL and Redirect URLs include the app URLs you use.

For local development:

```text
http://localhost:3000
http://127.0.0.1:3000
```

For LAN tablet/TV testing, add your machine IP URL if needed:

```text
http://<computer-ip>:3000
```

For production, add your deployed domain and set the same value in Vercel:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain
```

If `NEXT_PUBLIC_SITE_URL` is not set, magic links redirect back to the origin where the login form was opened. That is useful for local testing, but it means links sent from `localhost` return to `localhost`.

Password reset emails are sent by the app first. `/api/auth/password-reset` generates a Supabase recovery link with `SUPABASE_SERVICE_ROLE_KEY`, sends it through Resend first, falls back to Brevo if Resend is not configured or fails, then falls back to Supabase Auth email if app-managed delivery is unavailable. Keep the service role key server-only.

For password reset links, also add:

```text
http://localhost:3000/reset-password
http://127.0.0.1:3000/reset-password
https://your-production-domain/reset-password
```

## Scryfall

Scryfall search is used client-side for card art selection. The app stores selected Scryfall image URLs as player/game background images.

Scryfall is used in:

- `/control` player background art
- `/players` saved player profile background art

## Game State

Current game state is stored as JSON so new Commander counters can be added without a large schema migration. The app hydrates old game states with defaults.

Tracked per game:

- Starting life
- Day/night
- Active player
- Turn timer
- Random player result
- d20 result
- Player list

Tracked per player:

- Name
- Commander and partner/background commander names
- Life
- Poison
- Commander damage taken from each opponent
- Experience
- Energy
- Treasure
- Monarch
- Initiative
- City blessing
- Background image
- Background card name

## Device Workflow

Typical TV setup:

1. Start the Next.js server on the host machine.
2. Open `/control` on a tablet.
3. Open `/display` on the TV browser.
4. Use `/control` for setup and table control.

Tablet-only setup:

1. Open `/tablet`.
2. Tap the left half of a player panel to subtract 1 life.
3. Tap the right half to add 1 life.
4. Use inline controls for poison, counters, commander damage, and statuses.

## Build

Run:

```bash
NODE_ENV=production npm run build
```

Start production:

```bash
NODE_ENV=production npm run start
```

## Publishing Without Git Push

Some managed environments block writes inside `.git` or block `git push`. The repo includes a GitHub API publisher that can be run from a normal terminal:

```bash
GITHUB_TOKEN=your-personal-token python3 scripts/publish_github.py \
  --repo thebobhuff/CommandControl \
  --tag v0.1.0 \
  --release-notes RELEASE_NOTES.md
```

The token needs repository contents write access and release creation access.

## Notes

- `.env.local` is intentionally ignored and should not be committed.
- Supabase publishable keys are safe for browser use, but project-specific values should still be configured per environment.
- The current Supabase middleware may emit a Next.js Edge runtime warning from Supabase internals during build. The build still completes.
- Fire TV Silk does not support every modern browser API, so ID generation uses a compatibility fallback instead of relying only on `crypto.randomUUID()`.

## License

MIT. See [LICENSE](./LICENSE).
