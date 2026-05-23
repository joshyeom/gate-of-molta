# MVP

This file defines the first playable version of Gate of Molta.

## MVP Goal

Create a local browser version where one player can complete a full solo game of "몰타의 관문" using documented rules, placeholder-quality visuals, and a minimal but coherent interface.

The MVP is not the final Hearthstone-like experience. It is the smallest complete loop that proves the rules engine, UI, and solo flow can work together.

## Product Scope

Included:

- New game setup
- One local solo game session
- Deterministic game state and action handling
- Board and card zones
- Player hand or available actions
- Phase/turn progression
- Legal action validation
- Win/loss resolution
- Basic event log
- Minimal card movement and reveal animation

Excluded:

- Online multiplayer
- Account system
- External database
- Full production art
- Complex sound design
- Advanced deck builder
- Multiple save slots
- Replay viewer
- Mobile-specific polish beyond basic responsive layout

## Required Rule Inputs

The MVP cannot start implementation until these are captured:

- Component list
- Setup rules
- Turn/round sequence
- Legal player actions
- Card types
- Card effect list
- Board layout
- Win/loss conditions
- Solo rules or custom automa rules

## First Screens

### Game Start

Purpose:

- Start a new local solo game.
- Choose seed or random seed if needed.
- Choose difficulty only if solo rules support it.

MVP controls:

- New game
- Continue disabled until persistence exists

### Board

Purpose:

- Show the full game state needed to make decisions.

MVP areas:

- Board/table area
- Deck
- Discard
- Player hand or action area
- Solo/system area if needed
- Phase indicator
- Action buttons
- Event log

### Card Detail

Purpose:

- Let the player inspect card text and image.

MVP behavior:

- Click or hover opens enlarged card view.
- No collection browser yet.

### Game Result

Purpose:

- Show win/loss and basic summary.

MVP behavior:

- Restart game
- Show final score only if rules define scoring

## Technical Scope

Engine:

- `GameState`
- `GameAction`
- `GameEvent`
- `AnimationIntent`
- `reduceGame`
- seeded RNG
- selectors

UI:

- React app shell
- board layout
- card component
- action controls
- event log
- simple overlay system

Testing:

- setup test
- legal/illegal action tests
- deterministic RNG test
- win/loss condition test
- at least one full simulated game path if rules allow

Persistence:

- Not required for the first MVP cut.
- Add only after the game loop is playable.

## Animation Scope

MVP animation should be minimal but intentional:

- card draw movement
- card reveal/flip
- selected card lift
- phase transition banner
- basic success/failure feedback

Do not add complex particle effects, sound timing, or cinematic sequences until the rules loop is stable.

## Acceptance Criteria

The MVP is accepted when:

- A user can start a new game in the browser.
- The app shows all information needed for legal decisions.
- Illegal actions are blocked or explained.
- The game can progress through all required phases.
- The solo/system behavior works if solo rules are required.
- The game reaches a win or loss state.
- The rules engine can be tested without rendering React.
- Refreshing the page may lose progress; that is acceptable before persistence.

## MVP Risks

- The actual rules may be too complex to model in one pass.
- Card effects may require a flexible effect system.
- Solo play may need custom design if no official solo rules exist.
- Visual polish can distract from proving the rules loop.

## Next Implementation Gate

Do not scaffold gameplay code until `rules.md` contains enough real game information to define:

- state shape
- action list
- phase list
- card schema
- win/loss conditions
