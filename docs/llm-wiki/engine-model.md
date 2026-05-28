# Engine Model Draft

This page defines the first TypeScript-facing contract for setup options, game state, and game actions. It is a planning document, not implemented code yet.

## Goals

- Support 2-5 total participants with one local human and AI-controlled remaining seats.
- Keep game logic deterministic and independent from React.
- Represent duplicated cards safely through card instances.
- Keep canonical, candidate, and placeholder content visibly separated.
- Make AI use the same legal action pipeline as a human player.

## Setup Options

The first app setup should collect only options needed to create a deterministic local game.

```ts
type AiDifficulty = "easy" | "normal" | "hard" | "expert";

type StartPlayerMode =
  | { type: "seededRandom" }
  | { type: "fixedSeat"; seatIndex: number };

type GameSetupOptions = {
  totalPlayers: 2 | 3 | 4 | 5;
  humanPlayerCount: 1;
  aiDifficulty: AiDifficulty;
  seed: string;
  startPlayer: StartPlayerMode;
  contentMode: "fixture" | "verifiedOnly" | "allowCandidate";
};
```

Initial defaults:

- `totalPlayers`: `3`
- `humanPlayerCount`: `1`
- `aiDifficulty`: `"normal"`
- `seed`: generated in the browser, user-editable
- `startPlayer`: `{ type: "seededRandom" }`
- `contentMode`: `"fixture"` until verified card data exists

## Content Status

Card and rule data must carry verification status.

```ts
type ContentStatus = "verified" | "candidate" | "placeholder";
```

Rules:

- `verified`: may be used in final gameplay.
- `candidate`: may be shown in review/debug flows and fixture games, but must not silently become final behavior.
- `placeholder`: only for scaffolding and tests.

## Card Definitions And Instances

Use definitions for shared card data and instances for physical copies.

```ts
type CardDefinitionId = string;
type CardInstanceId = string;

type ContentCatalog = {
  version: string;
  pearlCards: Record<CardDefinitionId, PearlCardDefinition>;
  characterCards: Record<CardDefinitionId, CharacterCardDefinition>;
};

type CardInstance = {
  id: CardInstanceId;
  definitionId: CardDefinitionId;
  owner: PlayerId | null;
};
```

Reason:

- Pearl cards contain repeated values.
- Character cards may have duplicate candidates.
- Diamond resources appear to use drawn character cards, so the same card instance should move zones instead of being copied.

## Pearl Card Definition

```ts
type PearlValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type PearlCardDefinition = {
  id: CardDefinitionId;
  kind: "pearl";
  value: PearlValue;
  hasRefreshIcon: boolean | "unknown";
  status: ContentStatus;
};
```

Known canonical data:

- Pearl values are 1-8.
- There are 7 cards of each value.

Open data:

- Exact refresh-icon distribution.
- Whether refresh icons trigger during full pearl-market replacement.

## Character Card Definition

```ts
type CharacterRequirement =
  | { type: "exactValues"; values: PearlValue[] }
  | { type: "sum"; total: number; count?: number }
  | { type: "sequence"; count: number }
  | { type: "sameValue"; count: number }
  | { type: "odd"; count: number }
  | { type: "even"; count: number }
  | { type: "custom"; label: string; status: ContentStatus };

type AbilityTiming =
  | "onActivate"
  | "startOfTurn"
  | "duringTurn"
  | "afterActions"
  | "passive"
  | "unknown";

type CharacterAbility = {
  id: string;
  timing: AbilityTiming;
  status: ContentStatus;
  text: string;
};

type CharacterCardDefinition = {
  id: CardDefinitionId;
  kind: "character";
  name: string;
  requirement: CharacterRequirement;
  power: number | "unknown";
  diamondReward: number | "unknown";
  abilities: CharacterAbility[];
  placement: "upright" | "upsideDown" | "unknown";
  status: ContentStatus;
};
```

Implementation constraint:

- Candidate TTS-derived effects can shape this schema but should not be enabled as final rules until verified.

## Player State

```ts
type PlayerId = string;

type PlayerController =
  | { type: "human" }
  | { type: "ai"; difficulty: AiDifficulty };

type PlayerState = {
  id: PlayerId;
  seatIndex: number;
  controller: PlayerController;
  gateCardId: CardInstanceId;
  pearlHand: CardInstanceId[];
  gateCharacters: CardInstanceId[];
  activatedCharacters: CardInstanceId[];
  diamonds: CardInstanceId[];
};
```

Invariants:

- `gateCharacters.length <= 2`, unless a verified card effect changes this.
- `pearlHand.length <= getHandLimit(state, playerId)` at the end of the player's turn.
- Activated characters and diamond resources are separate zones.
- Power should be derived by selector from activated characters, not manually duplicated in state.

## Shared Zones

```ts
type DeckZone = {
  drawPile: CardInstanceId[];
  discardPile: CardInstanceId[];
};

type MarketState = {
  pearlMarket: CardInstanceId[];
  characterMarket: CardInstanceId[];
};
```

Expected sizes:

- `pearlMarket.length === 4` after setup/refill, unless the deck is exhausted and final exhaustion behavior is defined otherwise.
- `characterMarket.length === 2` after setup/refill, unless the deck is exhausted and final exhaustion behavior is defined otherwise.

## Turn And Round State

```ts
type TurnPhase =
  | "startOfTurn"
  | "action"
  | "afterActions"
  | "discardToLimit"
  | "gameOver";

type EndGameState =
  | { status: "notTriggered" }
  | {
      status: "finishCurrentRound";
      triggeredBy: PlayerId;
      triggeredRound: number;
    }
  | {
      status: "finalRound";
      triggeredBy: PlayerId;
      finalRoundNumber: number;
    }
  | {
      status: "ended";
      winnerIds: PlayerId[];
    };

type TurnState = {
  roundNumber: number;
  activePlayerId: PlayerId;
  startPlayerId: PlayerId;
  actionsRemaining: number;
  phase: TurnPhase;
  endGame: EndGameState;
  actionBonuses: Record<PlayerId, number>;
  usedAbilityIds: string[];
  activatedThisTurn: CardInstanceId[];
};
```

Notes:

- The documented turn gives exactly 3 base actions, but prototype card effects can temporarily raise the action count.
- Blue ability windows map to `startOfTurn`, `action`, and `afterActions`.
- `activatedThisTurn` blocks newly activated blue/passive effects from payment planning, ability use, hand-limit bonuses, and persistent action bonuses until that player's next turn; red/on-activation effects still resolve immediately.
- Endgame tracking must support: trigger at 12+ power, finish the current round, then immediately rank winners.

## Game State

```ts
type GameState = {
  schemaVersion: 1;
  gameId: string;
  seed: string;
  rngState: string;
  contentVersion: string;
  setup: GameSetupOptions;
  contentMode: GameSetupOptions["contentMode"];
  players: PlayerState[];
  turn: TurnState;
  cardsById: Record<CardInstanceId, CardInstance>;
  pearlDeck: DeckZone;
  characterDeck: DeckZone;
  market: MarketState;
  pending: PendingChoice | null;
};
```

Card definitions live in the content catalog. `GameState` stores `contentVersion` plus physical card instances and zones.

`pending` is for legal choices that interrupt a simple reducer flow, such as choosing which gate character to discard when the gate is full or choosing payment details for activation.

```ts
type PendingChoice =
  | {
      type: "discardGateCharacter";
      actorId: PlayerId;
      candidates: CardInstanceId[];
      resumeAction: GameAction;
    }
  | {
      type: "choosePayment";
      actorId: PlayerId;
      characterInstanceId: CardInstanceId;
      paymentPlans: PaymentPlan[];
    }
  | {
      type: "abilityChoice";
      actorId: PlayerId;
      abilityId: string;
      prompt: string;
    };

type AbilityChoices = Record<string, string | number | boolean | CardInstanceId | CardInstanceId[]>;
```

## Actions

Player and AI actors should dispatch the same public actions.

```ts
type GameAction =
  | { type: "startGame"; options: GameSetupOptions }
  | { type: "gainPearlFromMarket"; actorId: PlayerId; marketIndex: number }
  | { type: "gainPearlFromDeck"; actorId: PlayerId }
  | { type: "refreshPearlMarket"; actorId: PlayerId }
  | {
      type: "placeCharacterFromMarket";
      actorId: PlayerId;
      marketIndex: number;
      discardGateCharacterId?: CardInstanceId;
    }
  | {
      type: "placeCharacterFromDeck";
      actorId: PlayerId;
      discardGateCharacterId?: CardInstanceId;
    }
  | {
      type: "activateGateCharacter";
      actorId: PlayerId;
      characterInstanceId: CardInstanceId;
      payment: PaymentPlan;
      choices?: AbilityChoices;
    }
  | { type: "discardPearlsToLimit"; actorId: PlayerId; pearlIds: CardInstanceId[] }
  | { type: "useAbility"; actorId: PlayerId; abilityId: string; choices: AbilityChoices }
  | { type: "endTurn"; actorId: PlayerId };
```

Internal engine actions may exist, but they should not be dispatched directly by UI components.

## Payment Plan

```ts
type PaymentPlan = {
  pearlIds: CardInstanceId[];
  diamondUses: DiamondUse[];
};

type DiamondUse = {
  diamondId: CardInstanceId;
  pearlId: CardInstanceId;
  modifier: 1 | -1;
  source: "baseRule" | "verifiedAbility" | "candidateAbility";
};
```

Current verified base rule:

- A diamond can increase a pearl value by 1.
- One diamond may be used per pearl card.
- A pearl value cannot be increased above 8.

Candidate caveat:

- Some candidate metadata mentions decreasing values. That must remain ability-gated and non-final until verified.

## Events And Animation Intents

The reducer should return domain events and animation intents separately.

```ts
type EngineResult = {
  state: GameState;
  events: GameEvent[];
  animations: AnimationIntent[];
};
```

Initial event categories:

- game started
- turn started
- action spent
- card moved
- market refilled
- market refreshed
- character placed
- character activated
- diamonds gained
- ability used
- pearls discarded
- endgame triggered
- game ended

Animation intents should be derived from events and remain optional for tests.

## Selectors

Core selectors needed before UI work:

- `getActivePlayer(state)`
- `getPlayerPower(state, playerId)`
- `getHandLimit(state, playerId)`
- `getLegalActions(state, playerId)`
- `canPayRequirement(state, playerId, characterInstanceId)`
- `getPaymentPlans(state, playerId, characterInstanceId)`
- `getVisibleStateForActor(state, playerId)`
- `getWinnerCandidates(state)`
- `isGameOver(state)`

AI should consume selectors rather than reimplementing rules.

## Validation Rules

Reducer validation should reject:

- Acting when not the active player.
- Acting outside the correct phase.
- Spending an action when `actionsRemaining` is 0.
- Taking a market index outside the current market.
- Placing a character on a full gate without a discard choice.
- Activating a character not on the actor's gate.
- Paying with cards the actor does not own or cannot legally use.
- Ending the turn before required discard-to-limit choices are resolved.
- Using candidate abilities in verified-only mode.

## First Implementation Slice

The first engine slice should implement only:

1. `startGame`
2. seeded deck creation and shuffle
3. market setup
4. player seat creation from 2-5 total players
5. action count tracking
6. gain pearl from market/deck
7. place character from market/deck using placeholder character definitions
8. end turn and active-player rotation
9. selectors for active player, power, hand limit, and legal basic actions

Activation and card effects should follow once payment requirements and card data are ready enough for a focused test set.
