# Architecture

## Goal

Build a static web app that lets one player play "몰타의 관문" alone with a polished, animated presentation.

The architecture should support a future online mode, but the first version must be fully local.

## Layers

```text
React UI
  renders game state
  handles pointer/keyboard input
  plays animation and sound cues

Effect Layer
  receives animation intents
  runs card motion, reveal, impact, glow, and phase timelines
  remains replaceable if the animation library changes

Game Store
  holds current game snapshot
  dispatches user/system actions
  stores animation event queue and local UI state

Pure Game Engine
  validates actions
  applies rules
  advances phases
  emits domain events and animation intents
  uses seeded randomness

Content Layer
  card definitions
  scenario/setup data
  asset manifest
  text and localization-ready labels

Persistence
  serializes snapshots to browser storage
  supports save versioning and migrations
```

## Engine Design

The engine should be written as pure TypeScript functions.

Primary concepts:

- `GameState`: full deterministic game snapshot
- `GameAction`: player, solo system, or internal action
- `GameEvent`: result events such as card drawn, card revealed, damage resolved, phase changed
- `AnimationIntent`: visual hints derived from events
- `GameSeed`: seed for deterministic random outcomes

The reducer shape should be close to:

```ts
type EngineResult = {
  state: GameState;
  events: GameEvent[];
  animations: AnimationIntent[];
};

function reduceGame(state: GameState, action: GameAction): EngineResult;
```

Rules should not import React, DOM APIs, Framer Motion, GSAP, or browser storage.

## Frontend State

Use a small app store around the engine.

The store is responsible for:

- current `GameState`
- selected card or board target
- queued animation intents
- modal/overlay state
- save/load commands
- user settings such as animation speed and sound volume

It should not duplicate rule logic.

## Animation Model

Animations should be triggered from engine events, not scattered across random UI components.

Examples:

- `CARD_DRAWN` -> move card from deck to hand
- `CARD_REVEALED` -> flip, glow, zoom, settle
- `PHASE_CHANGED` -> board pulse and phase banner
- `DAMAGE_RESOLVED` -> impact shake, number burst, health update
- `REWARD_GAINED` -> chest/card shine and collect motion

Use CSS transforms and Framer Motion for most UI-level motion. Add GSAP only when complex multi-step timelines become hard to express cleanly.

## Assets

Use local assets with explicit manifests.

```ts
type CardAsset = {
  cardId: string;
  image: string;
  thumbnail?: string;
  frame?: string;
};
```

Recommended asset folders:

```text
src/assets/cards/
src/assets/boards/
src/assets/fx/
src/assets/audio/
```

Large original art files should not be mixed with optimized runtime assets unless the project intentionally needs them.

## Solo Logic

Solo play should be modeled as an automa/system actor, not as hidden UI behavior.

The solo module should receive visible game state and produce system actions:

```ts
function chooseSoloAction(state: GameState): GameAction;
```

This keeps solo decisions testable and makes future online or replay support easier.

## Persistence

Use browser storage for local saves. This is not a backend database.

Recommended first step:

- `localStorage` for settings and one quick-save slot

Possible later step:

- IndexedDB only if save data or asset cache becomes too large

Every save should include:

- save schema version
- app version if available
- game seed
- game state snapshot
- action history if replay support is enabled

## Future Online Path

Online support should be possible if the local game already treats gameplay as ordered actions over deterministic state.

Future online architecture can reuse:

- `GameState`
- `GameAction`
- `reduceGame`
- seeded randomness
- action history

Avoid tying core rules to local-only UI assumptions.
