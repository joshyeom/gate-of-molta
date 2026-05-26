# Implementation Plan

This plan translates the roadmap and MVP scope into an execution order now that project roles/workstreams are defined.

## Current Premise

- The repository has project memory, rule notes, reference assets, generated replacement assets, and utility scripts.
- There is no frontend scaffold yet: no `package.json`, no `src/`, and no runnable app.
- The core multiplayer turn loop is partially captured, but card-level data and solo behavior are not complete.
- Character-card metadata exists only as a verification checklist, not canonical app content.
- Pearl-card distribution is captured as values 1-8 with 7 copies each, but refresh-symbol distribution and edge behavior still need verification.
- No official solo mode has been captured, so solo play is a custom digital adaptation unless a future source changes that.

## Guardrails

- App scaffolding, folder structure, type shells, fixture-driven UI, and deterministic engine infrastructure may begin before all card text is verified.
- Final gameplay behavior must not be implemented from unverified TTS-derived card metadata.
- Placeholder rules must be isolated in fixtures or clearly marked as non-canonical.
- Rules code stays pure TypeScript and must not import React, browser APIs, animation libraries, or storage.
- UI renders state and dispatches actions; it does not decide game rules.
- Runtime assets must come from original/approved app assets, not reference-only source crops.

## Workstreams

| Workstream | Owns | First Deliverables | Done When |
| --- | --- | --- | --- |
| Rules and content | Rule gaps, card schema, verification status | Canonical/candidate content split, open-question checklist | Engine can tell verified data from placeholders |
| Engine | State, actions, reducer, RNG, events | `GameState`, `GameAction`, setup, action validation tests | Core loop runs without React |
| UI app | Vite/React shell, board, controls | App scaffold, board zones, card detail, event log | User can operate a fixture game state |
| Solo system | Automa policy and system actions | Draft automa model, deterministic action chooser | Solo actions are generated and testable |
| Effects | Animation intents and playback | Event-to-animation queue, basic card reveal/draw cues | UI motion is driven by engine events |
| Assets | Runtime manifests and image conventions | Card asset manifest adapter, placeholder/original status fields | Card components load local approved assets |
| QA and docs | Test matrix, wiki updates, acceptance checks | Vitest suite, session/log updates | Regressions are caught outside the browser |

## Milestones

### 0. Implementation Readiness

Goal:

- Freeze the first implementation lane without pretending every rule is solved.

Deliverables:

- A content status model that distinguishes `canonical`, `candidate`, and `placeholder`.
- A short list of rule blockers that must be solved before full gameplay.
- A player-count and AI difficulty model for the first solo setup.

Exit criteria:

- The team can scaffold the app and engine foundations without embedding unverified card effects.

### 1. App Scaffold

Goal:

- Create the runnable frontend project and basic technical rails.

Deliverables:

- Vite + React + TypeScript scaffold.
- `src/game`, `src/ui`, `src/effects`, and `src/assets` folders.
- Vitest setup for rules tests.
- Basic lint/format scripts if the scaffold does not provide them.
- Placeholder board screen that renders static fixture data.

Exit criteria:

- `npm run dev` starts locally.
- `npm test` or the chosen test command runs.
- A placeholder board screen renders without gameplay logic in React components.

### 2. Engine Foundation

Goal:

- Build the deterministic rules core around the documented loop.

Deliverables:

- `GameState`, `GameAction`, `GameEvent`, and `AnimationIntent` types.
- `GameSetupOptions`, `PlayerState`, card instance zones, and selector contracts from `engine-model.md`.
- Seeded RNG and deterministic shuffle.
- Setup for decks, markets, player gates, hands, discards, actions remaining, and round state.
- Reducer support for documented basic actions:
  - gain pearl from market
  - gain pearl from deck
  - refresh pearl market
  - place character from market/deck
  - activate a gate character through a payment plan
  - discard to hand limit
  - end turn
- Tests for setup counts, action count, market refill, hand limit, gate capacity, invalid actions, and deterministic replay.

Exit criteria:

- The engine can run a limited fixture loop without React.
- Invalid actions fail predictably.
- Unverified effects are represented as unavailable/candidate data, not active rules.

### 3. Content Bridge

Goal:

- Connect local content files to the engine without locking unverified data as final.

Deliverables:

- Pearl card definitions from verified value distribution.
- Character-card schema that can represent cost requirements, power, diamonds, timing, and effect hooks.
- Candidate character manifest generated or hand-curated from verification sources with explicit status.
- Runtime asset manifest that points to approved original/generated assets only.

Exit criteria:

- The app can load card definitions and assets through typed content APIs.
- Candidate data is visibly marked in review/debug surfaces.

### 4. Plain Playable UI

Goal:

- Make the core loop operable before visual polish.

Deliverables:

- Game start screen with seed entry/random seed.
- Board screen with pearl market, character market, decks, discards, player gate, activated area, diamonds, hand, actions remaining, and event log.
- Card detail overlay.
- Legal action controls based on engine selectors.
- Minimal feedback for blocked actions.

Exit criteria:

- A user can perform the documented basic actions through the browser.
- UI components do not duplicate rule validation.

### 5. Solo V0

Goal:

- Add a deterministic solo opponent/system that makes the game playable alone.

Recommended first model:

- Simulated-player automa using the same reducer actions as a normal player.
- Configurable total player count from 2 to 5, with one human and the remaining seats controlled by AI.
- Difficulty policies from `solo-mode.md`, starting with Easy and Normal.

Reason:

- The captured game includes player-facing interactions such as hand/gate disruption and shared markets. A simulated player preserves more of that pressure than a pure score clock.

Deliverables:

- `chooseSoloAction(state, actorId)` with deterministic heuristics.
- `AiDifficulty` and setup options for total participants.
- A simple priority ladder:
  - activate a legal character if available
  - place a high-value character if gate space exists
  - gain a pearl that improves known activation options
  - refresh or draw when no constructive move exists
- Tests proving solo choices are deterministic for a seed and state.

Exit criteria:

- The player can complete a solo fixture game against the automa.
- The automa is isolated from React and can be replaced later.
- The same seed, player count, difficulty, and action history reproduce the same AI choices.

### 6. Minimal Effects

Goal:

- Add motion hooks without blocking rules progress.

Deliverables:

- Event-to-animation-intent mapping.
- Basic draw, reveal, selection, phase-change, and reward feedback.
- Reduced-motion setting or easy animation bypass.

Exit criteria:

- Major state changes have visible ceremony.
- Engine tests remain independent of animation code.

### 7. Local Persistence

Goal:

- Preserve one local session after the loop is playable.

Deliverables:

- Save schema version.
- Local quick-save snapshot with seed and game state.
- Settings persistence for animation speed/sound-ready preferences.

Exit criteria:

- A local game can be resumed after refresh.
- Save format can be migrated later.

## Rule Blockers Before Full Gameplay

- Official character names, power values, diamond rewards, and final effect text.
- Which pearl cards carry refresh symbols and whether refresh symbols trigger during manual market replacement.
- Draw pile exhaustion and reshuffle behavior.
- Further tiebreakers after diamonds.
- Exact behavior of the upside-down "도깨비불" character.
- Final solo mode policy and difficulty model.

## First Sprint Recommendation

1. Scaffold Vite + React + TypeScript with Vitest and the documented folder layout.
2. Add engine type shells, seeded RNG, setup, and fixture content with explicit placeholder status.
3. Render a plain board from engine state and add tests for setup/action validation.
4. Continue verifying card and solo rules in parallel before enabling full gameplay.
