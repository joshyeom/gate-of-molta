# Roadmap

This roadmap turns the project direction into staged work.

## Guiding Sequence

Gate of Molta should progress in this order:

1. Stabilize project memory.
2. Capture the real board-game rules.
3. Define the first playable MVP.
4. Scaffold the frontend app.
5. Build the deterministic rules engine.
6. Connect a plain playable UI.
7. Add solo/automa behavior.
8. Add local assets and visual identity.
9. Add animation and sound-ready effects.
10. Add save/load and replay support.
11. Prepare for future online support.

## Phase 0: Project Memory Baseline

Status: complete.

Goals:

- Establish README, agent docs, and LLM Wiki.
- Preserve the LLM Wiki pattern source.
- Track prompts, decisions, logs, and session history.

Exit criteria:

- Initial docs committed.
- Wiki schema/index/log structure exists.

## Phase 1: Rule Capture

Status: next.

Goals:

- Capture the actual "몰타의 관문" rules.
- Identify components, setup, turn flow, card types, card effects, and win/loss conditions.
- Decide whether solo play uses official solo rules or a custom automa.

Required inputs:

- Rulebook text or photos.
- Component photos or list.
- Card list and card effect text.
- Board layout.
- Any solo-mode reference material.

Exit criteria:

- `rules.md` is complete enough to model the game.
- Open rules questions are listed explicitly.
- Core state/action/card types can be designed without guessing.

## Phase 2: MVP Design

Status: started.

Goals:

- Define the smallest playable local version.
- Decide which features are intentionally excluded from v0.
- Establish acceptance criteria for "one complete game".

Exit criteria:

- `mvp.md` defines scope, non-scope, screens, and acceptance tests.
- MVP can be implemented without revisiting product strategy.

## Phase 3: App Scaffold

Status: pending.

Goals:

- Create Vite + React + TypeScript project.
- Add basic folders for `src/game`, `src/ui`, `src/effects`, and `src/assets`.
- Add formatting, linting, and test commands.

Exit criteria:

- `npm run dev` starts the app.
- `npm test` or equivalent runs.
- A placeholder board screen renders.

## Phase 4: Deterministic Game Engine

Status: pending.

Goals:

- Model `GameState`, `GameAction`, `GameEvent`, and `AnimationIntent`.
- Implement a reducer-style engine.
- Add seeded randomness.
- Add tests for setup, phase progression, and legal actions.

Exit criteria:

- The core loop runs without React.
- Engine tests prove deterministic behavior.
- Invalid actions are rejected predictably.

## Phase 5: Plain Playable UI

Status: pending.

Goals:

- Render board, hand, decks, discard areas, phase state, and action controls.
- Dispatch user actions to the engine.
- Show a readable event log.

Exit criteria:

- The player can complete a game with minimal visuals.
- The UI does not contain rule logic.

## Phase 6: Solo System

Status: pending.

Goals:

- Implement solo/automa decision logic as a system actor.
- Keep decisions testable and deterministic when seeded.
- Add difficulty hooks if the rules support them.

Exit criteria:

- Solo actions are generated from visible game state.
- Solo decisions can be tested without UI.

## Phase 7: Assets And Visual Identity

Status: pending.

Goals:

- Define card image dimensions.
- Add card frame, board, icon, and effect asset conventions.
- Create or import optimized local assets.

Exit criteria:

- Card rendering uses a manifest.
- Runtime assets are separated from source/original art.

## Phase 8: Immersive Animation Layer

Status: pending.

Goals:

- Add event-driven card movement, flips, reveals, phase banners, impact feedback, and reward moments.
- Keep animation code outside the rules engine.
- Add animation speed settings.

Exit criteria:

- Major game events emit visible ceremony.
- The game remains playable when animations are reduced or disabled.

## Phase 9: Local Persistence

Status: pending.

Goals:

- Save settings and quick-save snapshots in browser storage.
- Store seed and optionally action history.
- Add save schema versioning.

Exit criteria:

- A game can be closed and resumed locally.
- Save migrations have a defined path.

## Phase 10: Online Readiness

Status: future.

Goals:

- Keep state/action history suitable for remote synchronization.
- Avoid backend assumptions until local play is stable.

Exit criteria:

- Online design can reuse the local engine rather than replacing it.
