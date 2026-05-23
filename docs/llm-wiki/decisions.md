# Decisions

## 2026-05-22: Frontend-only first version

The first version will run fully in the browser without a backend or external database.

Reason:

- The user wants a simple web page.
- The first target is solo play.
- All game rules, card data, assets, and logic can be packaged as static frontend resources.

Consequences:

- Local persistence uses browser storage.
- Assets must be optimized for web delivery.
- No multiplayer assumptions should leak into the first implementation.

## 2026-05-22: Separate rules engine from animation/UI

Game logic will be implemented as pure TypeScript modules separate from React and animation libraries.

Reason:

- Rules need deterministic tests.
- Animation-heavy UI should not make the engine fragile.
- Future online support will be easier if gameplay is represented as actions over state.

Consequences:

- UI components render state and dispatch actions.
- Engine emits events and animation intents.
- Animation libraries stay in the presentation/effects layer.

## 2026-05-22: Do not invent board-game rules

The exact rules of "몰타의 관문" must be captured before implementing gameplay.

Reason:

- The repository currently does not contain a rulebook, card list, or formal game model.
- Incorrect assumptions would corrupt the core engine design.

Consequences:

- Early work should focus on structure, rule capture, and prototypes.
- Any temporary mock rules must be clearly labeled as placeholders.

## 2026-05-22: Track prompt context for retrospectives

The project will keep a prompt context log in `docs/llm-wiki/prompt-context.md`.

Reason:

- The user wants to review which prompts were used during development.
- Prompt history can reveal where work slowed down, where context was missing, and which instructions produced useful outcomes.
- Future LLM sessions need not rely only on chat history.

Consequences:

- Major user prompts should be preserved in their original language.
- Each prompt entry should include intent, outcome, and bottleneck/reflection notes.
- Sensitive information should be summarized rather than copied verbatim if it appears later.

## 2026-05-22: Adopt the LLM Wiki raw-source/schema/log pattern

The project will instantiate the user-provided LLM Wiki pattern.

Reason:

- The user explicitly provided the pattern as the starting point.
- The project needs durable memory across LLM sessions.
- Raw sources, generated synthesis, and operating rules should be separated.

Consequences:

- Verbatim source material lives in `docs/llm-sources/`.
- LLM-maintained synthesis lives in `docs/llm-wiki/`.
- `docs/llm-wiki/schema.md` defines wiki operations.
- `docs/llm-wiki/index.md` is the content catalog.
- `docs/llm-wiki/log.md` is the chronological operation log.
