# Changelog

All notable changes to Commander Control are documented here.

Commander Control follows semantic versioning:

- Major versions introduce breaking workflow, data, or deployment changes.
- Minor versions add user-visible features in a backward-compatible way.
- Patch versions fix bugs, copy, docs, or release-process issues.

## [Unreleased]

### Added

- Nothing yet.

## [0.4.0] - 2026-10-11

### Changed

- Rebuilt navigation, home, account, and game screens with a shared accessible design, beUI motion, and Aceternity components.
- Improved sign-in forms, empty states, control labels, touch targets, and reduced-motion support.
- Fixed setup and four-player tablet layouts at 1920×1080 so Commander damage remains visible.
- Preserved the latest Horde, game-mode setup, and Archenemy AI features.

### Fixed

- Prevented initial game-state hydration mismatches on setup, tablet, and TV screens.

## [0.3.1] - 2026-07-19

### Added

- Changelog and semantic version bump workflow.

## [0.3.0] - 2026-07-19

### Added

- Archenemy mode with archenemy assignment.
- Scryfall-backed scheme deck loading, shuffling, revealing, abandoning, and reshuffling.
- Planechase mode with a Scryfall-backed planar deck for planes and phenomena.
- Planar die results and automatic planeswalk on planeswalker rolls.
- Full-card scheme and plane displays across TV Display, Tablet Mode, and Control.
- Rotated Planechase card display for landscape play.
- Scheme reveal animation and Planechase portal animation.
- Homepage learning video links for Commander, Planechase, and Archenemy.

## [0.2.2] - 2026-06-25

### Changed

- Optimized tablet and TV layouts for denser four-player Commander play.

## [0.2.1] - 2026-06-22

### Added

- SEO metadata and app icon improvements.

## [0.2.0] - 2026-06-22

### Added

- Game invites.
- Saved player profile game tools.
- TV QR sharing.

## [0.1.0] - 2026-06-21

### Added

- Initial Commander Control release.
- Tablet-first Commander life tracker and control surface.
- TV display mode for table-visible life totals.
- Tablet-only play mode.
- Supabase magic-link login.
- Supabase-backed saved games and player profiles.
- Scryfall card-art search.
- Commander damage, poison, experience, energy, and treasure tracking.
- Monarch, initiative, city blessing, day/night, active player, turn timer, random player picker, and d20 roller.
