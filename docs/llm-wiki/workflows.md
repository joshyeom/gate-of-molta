# Workflows

## New Session Startup

1. Read `README.md`.
2. Read `CLAUDE.md`.
3. Read `docs/llm-wiki/schema.md`.
4. Read `docs/llm-wiki/index.md`.
5. Read the latest entries in `docs/llm-wiki/log.md`.
6. Read the latest entry in `docs/llm-wiki/session-log.md`.
7. Read the latest relevant entries in `docs/llm-wiki/prompt-context.md`.
8. Check `git status --short --branch`.

## Source Ingest

When the user provides source material:

1. Preserve the source in `docs/llm-sources/` if it should remain verbatim.
2. Extract durable claims and update relevant wiki pages.
3. Update `docs/llm-wiki/index.md`.
4. Append an entry to `docs/llm-wiki/log.md`.
5. Update `docs/llm-wiki/prompt-context.md` if the source arrived as a user prompt.
6. Flag contradictions or open questions instead of silently smoothing them over.

Do not modify raw source files during normal wiki maintenance.

## Rule Capture

Before implementing gameplay, capture:

- player setup
- board layout
- turn structure
- phases
- legal actions
- card types
- card effects
- win/loss conditions
- solo-mode rules or desired solo algorithm
- random setup or shuffle rules

Store durable rule notes in `docs/llm-wiki/rules.md`.

## Implementation Flow

1. Define types for state, actions, cards, and events.
2. Implement the smallest complete game loop.
3. Add tests for deterministic behavior.
4. Build a plain UI that can complete a game.
5. Add card assets and board visuals.
6. Add animation intents and effect timelines.
7. Add local save/load.
8. Polish responsiveness and accessibility.

## Documentation Updates

Update `session-log.md` after meaningful work.

Update `log.md` after ingests, queries that create reusable synthesis, lint passes, decisions, or implementation milestones.

Update `prompt-context.md` when a user prompt changes direction, reveals project intent, causes a blocker, or produces a decision worth reviewing later.

Update `decisions.md` when making a durable technical decision.

Update `architecture.md` when changing module boundaries or runtime assumptions.
