# Gate of Molta

Gate of Molta is a frontend-only web project for playing the board game "몰타의 관문" solo.

The first goal is a local single-player experience that runs entirely in the browser: game rules, solo algorithms, card data, image assets, animation logic, and save data all live on the client. A future online mode is possible, but the initial architecture avoids any server or database dependency.

## Product Direction

The target experience is closer to a digital collectible card game than a plain board-game helper. The game should feel immersive when played alone, with responsive card motion, dramatic reveal moments, polished board feedback, rich card images, sound-ready interaction hooks, and animation timing inspired by games like Hearthstone.

## Core Principles

- Frontend first: no backend, no external database, no required network during play.
- Rules are deterministic: the same initial seed and action list should reproduce the same game.
- Game logic is separate from UI: rules and state transitions must not depend on React components or animation libraries.
- Animation is event-driven: the rules engine emits domain changes and animation intents; the UI decides how to present them.
- Assets are local: cards, icons, boards, and visual effects are versioned with the app.
- Future online support should not require rewriting the rules engine.

## Suggested Stack

- Vite
- React
- TypeScript
- Zustand or Redux Toolkit for app-level state
- Pure TypeScript reducer/state machine for game rules
- Framer Motion for component animation
- GSAP for complex timelines if needed
- Vitest for rules and simulation tests
- Playwright for key browser flows

## Proposed Source Structure

```text
src/
  app/                    # App shell, routes, providers
  game/
    engine/               # Pure rules engine
      actions.ts          # Player/system actions
      state.ts            # Game state model
      reducer.ts          # Deterministic state transitions
      selectors.ts        # Derived state helpers
      rng.ts              # Seeded random generator
      rules/              # Rule modules by phase/card/system
    content/              # Static game data
      cards.ts
      scenarios.ts
      assets.ts
    solo/                 # Solo/automa decision logic
    save/                 # Local save/load, migrations
  ui/
    board/                # Board presentation
    cards/                # Card rendering and interactions
    hand/
    hud/
    overlays/
  effects/
    animationBus.ts       # Engine-to-UI animation events
    timelines.ts          # Shared animation sequences
    soundBus.ts           # Sound-ready event hooks
  assets/
    cards/
    boards/
    fx/
```

## Documentation

Project memory for future LLM sessions lives in `docs/llm-wiki/`.

Raw source material for the wiki lives in `docs/llm-sources/`.

Start with:

- `CLAUDE.md` for agent operating rules
- `AGENTS.md` for Codex and other agents
- `docs/llm-wiki/schema.md` for the LLM Wiki operating model
- `docs/llm-wiki/index.md` for the project map
- `docs/llm-wiki/log.md` for chronological wiki operations
- `docs/llm-wiki/architecture.md` for technical design
- `docs/llm-wiki/session-log.md` for journey records

## Current Status

This repository is in its first design session. The exact board-game rules still need to be captured before implementing the engine.
