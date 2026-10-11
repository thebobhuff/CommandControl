# Spec: Commander HORDE Mode

> **Status:** Draft
> **Date:** 2026-07-28
> **Confidence:** Medium — key questions about Moxfield parsing scope, AI automation level, and display UI remain open

## 1. Request

Add a Commander HORDE mode — a cooperative variant where 1–4 players (the Survivor team) fight against a fully automated, self-piloting Horde deck pulled from Moxfield. Players win by surviving and depleting the Horde's deck; they lose if their shared life hits zero.

## 2. Goals

- HORDE game mode with automated Horde AI (infinite mana, auto-attack, auto-cast)
- Horde deck life total (milling replaces traditional life loss)
- Survivor team setup: 1–4 players, shared life (20/player), 3-turn setup period before Horde activates
- Moxfield deck import for Horde decks
- TV display showing the Horde state (deck, graveyard, battlefield)
- Game state persistence (save/resume)

## 3. Non-goals

- Full Magic rules engine (no combat resolution, no spell targeting)
- Block/battle phase automation for survivors (manual as in normal Commander Control)
- Horde deck builder UI (import only via Moxfield URL)
- Archenemy/Planechase integration (separate modes, HORDE is standalone)

## 4. Requirements

### Functional

- HORDE mode toggle/entry point from the main app
- Horde deck import via Moxfield URL
- Horde game state: deck, graveyard, battlefield, revealed card queue
- Horde AI turn execution: reveal → cast tokens → cast spell → combat
- Survivor team state: shared life total, poison, commander damage
- 3-turn setup period before Horde starts
- Win condition: Horde deck empty + no Horde creatures on battlefield
- Lose condition: Survivor shared life = 0
- TV display: Horde battlefield, deck count, graveyard count, revealed card, survivor life
- Save/load HORDE games

### Non-functional

- Existing Supabase auth / game persistence patterns
- Scryfall API for card images
- Responsive for tablet and TV display
- No new external AI APIs (Horde AI is deterministic rule-based, no LLM needed)

## 5. User stories & acceptance criteria

- As a player, I want to start a HORDE game so that I can play co-op against an automated deck with my friends.
  - [ ] Can select HORDE mode, enter 1–4 player names, and input a Moxfield URL for the Horde deck
  - [ ] 3-turn setup period shows before Horde activates
- As a player, I want the Horde to run itself so that I can focus on surviving.
  - [ ] Horde takes its own turn automatically: reveals cards, casts tokens, casts non-token spells, attacks
  - [ ] Horde has infinite mana
- As a player, I want my team to share life so that we're truly co-op.
  - [ ] Survivor team has shared life (20 × player count)
  - [ ] Commander damage tracked per opponent
- As a player watching on TV, I want to see the Horde's state clearly so that I can follow the game.
  - [ ] TV display shows Horde deck, graveyard, battlefield, and current revealed/revealing card
- As a returning player, I want to save/resume a HORDE game so that I don't lose progress.
  - [ ] Game state persists to Supabase and can be resumed

## 6. Assumptions

- The 100-card Horde deck structure (60% tokens / 40% spells) is expected but not enforced
- Horde combat: all Horde creatures must attack each turn (Haste, "must attack if able")
- Moxfield import: we parse the public deck list page (no auth, no private decks)
- "Reveal until non-token" logic: reveal top card one by one, cast all revealed tokens, then cast the non-token spell

## 7. Constraints & dependencies

- Existing `CommanderGame` state type in `lib/commander.ts`
- Existing `game-state.ts` persistence pattern
- Existing Scryfall card image lookup
- No new external API dependencies (deterministic AI, no LLM)
- Next.js 15 App Router, Supabase auth

## 8. Open questions

- Does Moxfield have a public API or do we scrape the deck page?
- How should the Horde's "reveal until non-token" queue display on TV? Animated sequence or instant?
- Should survivors be able to manually damage the Horde (e.g. direct damage spells in play), or is all damage from combat only?
- What happens during the 3-turn setup — can the Horde deck be viewed but not interacted with?
- Is there a "start Horde turn" button, or fully automatic with an auto-timer?

## 9. Confidence assessment

- **Confidence to build to clear expectations:** Medium
- **Gaps lowering confidence:** Moxfield parsing approach not confirmed; Horde turn UI (manual trigger vs auto-timer) undefined; TV animation expectations unclear
- **What would raise it:** answers to the 4 open questions above

## 10. Sprint & wave plan

### Sprint overview
| Sprint | Goal | Acceptance criteria | Status |
|--------|------|---------------------|--------|
| 1 | Horde game state, Moxfield import, Horde AI turn, TV display | HORDE mode starts, deck imports, Horde takes automated turn, TV shows horde state | Not started |

### Sprint 1 — Core HORDE engine
**Wave 1** (no dependencies — run in parallel)
- [ ] `T1.1` **[P]** Add HORDE variant type to `CommanderGame` state +horde-specific state fields — subagent: general
- [ ] `T1.2` **[P]** Moxfield deck URL parser (fetch deck page, extract card list) — subagent: general
- [ ] `T1.3` **[P]** Horde turn AI: reveal loop, token casting, spell casting, combat assignment — subagent: general

**Wave 2** (depends on Wave 1)
- [ ] `T1.4` **[S]** HORDE mode UI: mode selector, player count, Moxfield URL input, game init (deps: T1.1) — subagent: general
- [ ] `T1.5` **[S]** Survivor team state UI: shared life, poison, commander damage (deps: T1.1) — subagent: general
- [ ] `T1.6` **[S]** TV display for HORDE: deck/grave/battlefield view, revealed card queue, survivor life (deps: T1.1, T1.3) — subagent: general

**Wave 3**
- [ ] `T1.7` **[P]** Docs: update README or in-app HORDE rules reference
- [ ] `T1.8` **[P]** Save/load HORDE game state (deps: T1.4, T1.5, T1.6) — subagent: general

## 11. Validation log
