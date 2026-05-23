# CLAUDE.md

This file is the first context document for LLM agents working on Gate of Molta.

## Project Identity

Gate of Molta is a browser-based solo-play adaptation of the board game "몰타의 관문". The user wants a polished, immersive, frontend-only game that stores game data, algorithms, card assets, visual effects, and local progress on the client.

The long-term direction may include online play, but the current phase must not assume a backend or database.

## Product Goal

Build a solo board-game experience with the presentation quality of a modern digital card game. The desired feel is dramatic, animated, tactile, and visually rich rather than a static rules tracker.

Important experience targets:

- Card movement should feel physical and deliberate.
- Reveals, attacks, rewards, phase changes, and major decisions should have visible ceremony.
- The solo mode should feel like playing against a system, not like manually bookkeeping a board.
- The app should work as a simple web page and be easy to deploy as static files.

## Hard Constraints

- No backend for the initial version.
- No external database.
- All rule data, card metadata, images, and solo logic live in the frontend repository.
- Do not invent specific board-game rules. Capture them from the user or from verified source material before implementation.
- Keep the rules engine independent of React and visual animation libraries.

## Architecture Rules

- Put deterministic game behavior in `src/game/engine`.
- Put static game data in `src/game/content`.
- Put solo/automa behavior in `src/game/solo`.
- Put local save/load code in `src/game/save`.
- Put React components in `src/ui`.
- Put animation orchestration in `src/effects`.
- Engine state transitions should be testable without a browser.
- UI should render state and consume animation events; it should not decide rules.
- Prefer seeded randomness so sessions can be replayed and tested.

## Recommended Implementation Order

1. Capture the actual rules of "몰타의 관문".
2. Define the game state model and action list.
3. Implement a minimal deterministic engine with tests.
4. Build a plain but complete playable UI.
5. Add local assets and card image pipeline.
6. Add animation events and visual polish.
7. Add save/load and replay support.
8. Consider online architecture only after local play is stable.

## Documentation Rules

Keep `docs/llm-wiki/session-log.md` updated after meaningful work. Record:

- Date
- What changed
- Why it changed
- Known gaps
- Next likely task

Keep long explanations out of `README.md`; place durable design details in `docs/llm-wiki/`.

## LLM Wiki Rules

This project uses an LLM Wiki pattern.

- Raw source material lives in `docs/llm-sources/` and should not be rewritten during normal wiki maintenance.
- Generated synthesis lives in `docs/llm-wiki/`.
- Read `docs/llm-wiki/schema.md` before changing wiki structure.
- Update `docs/llm-wiki/index.md` when adding or changing wiki pages.
- Append to `docs/llm-wiki/log.md` after ingests, durable decisions, lint passes, or implementation milestones.
- Update `docs/llm-wiki/prompt-context.md` when user prompts reveal intent, create decisions, or show bottlenecks.
