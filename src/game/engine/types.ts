export type AiDifficulty = "easy" | "normal" | "hard" | "expert";

export type StartPlayerMode =
  | { type: "seededRandom" }
  | { type: "fixedSeat"; seatIndex: number };

export type ContentMode = "fixture" | "verifiedOnly" | "allowCandidate";

export type GameSetupOptions = {
  totalPlayers: 2 | 3 | 4 | 5;
  humanPlayerCount: 1;
  aiDifficulty: AiDifficulty;
  seed: string;
  startPlayer: StartPlayerMode;
  contentMode: ContentMode;
};

export type ContentStatus = "verified" | "candidate" | "placeholder";

export type PlayerId = string;
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type RngState = number;

export type PearlValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PearlCardDefinition = {
  id: CardDefinitionId;
  kind: "pearl";
  value: PearlValue;
  hasRefreshIcon: boolean | "unknown";
  status: ContentStatus;
};

export type CharacterRequirement =
  | { type: "exactValues"; values: PearlValue[] }
  | { type: "sum"; total: number; count?: number }
  | { type: "sequence"; count: number }
  | { type: "sameValue"; count: number }
  | { type: "odd"; count: number }
  | { type: "even"; count: number }
  | { type: "custom"; label: string; status: ContentStatus };

export type AbilityTiming =
  | "onActivate"
  | "startOfTurn"
  | "duringTurn"
  | "afterActions"
  | "passive"
  | "unknown";

export type CharacterAbility = {
  id: string;
  timing: AbilityTiming;
  status: ContentStatus;
  text: string;
};

export type CharacterCardDefinition = {
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

export type ContentCatalog = {
  version: string;
  pearlCards: Record<CardDefinitionId, PearlCardDefinition>;
  characterCards: Record<CardDefinitionId, CharacterCardDefinition>;
};

export type CardInstance = {
  id: CardInstanceId;
  definitionId: CardDefinitionId;
  owner: PlayerId | null;
};

export type PlayerController =
  | { type: "human" }
  | { type: "ai"; difficulty: AiDifficulty };

export type PlayerState = {
  id: PlayerId;
  seatIndex: number;
  controller: PlayerController;
  gateCardId: CardInstanceId;
  pearlHand: CardInstanceId[];
  gateCharacters: CardInstanceId[];
  activatedCharacters: CardInstanceId[];
  diamonds: CardInstanceId[];
};

export type DeckZone = {
  drawPile: CardInstanceId[];
  discardPile: CardInstanceId[];
};

export type MarketState = {
  pearlMarket: CardInstanceId[];
  characterMarket: CardInstanceId[];
};

export type TurnPhase =
  | "startOfTurn"
  | "action"
  | "afterActions"
  | "discardToLimit"
  | "gameOver";

export type EndGameState =
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

export type TurnState = {
  roundNumber: number;
  activePlayerId: PlayerId;
  startPlayerId: PlayerId;
  actionsRemaining: 0 | 1 | 2 | 3;
  phase: TurnPhase;
  endGame: EndGameState;
};

export type AbilityChoices = Record<
  string,
  string | number | boolean | CardInstanceId | CardInstanceId[]
>;

export type PaymentPlan = {
  pearlIds: CardInstanceId[];
  diamondUses: DiamondUse[];
};

export type DiamondUse = {
  diamondId: CardInstanceId;
  pearlId: CardInstanceId;
  modifier: 1 | -1;
  source: "baseRule" | "verifiedAbility" | "candidateAbility";
};

export type GameAction =
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
    }
  | { type: "discardPearlsToLimit"; actorId: PlayerId; pearlIds: CardInstanceId[] }
  | { type: "useAbility"; actorId: PlayerId; abilityId: string; choices: AbilityChoices }
  | { type: "endTurn"; actorId: PlayerId };

export type PendingChoice =
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

export type GameState = {
  schemaVersion: 1;
  gameId: string;
  seed: string;
  rngState: RngState;
  contentVersion: string;
  setup: GameSetupOptions;
  contentMode: ContentMode;
  players: PlayerState[];
  turn: TurnState;
  cardsById: Record<CardInstanceId, CardInstance>;
  pearlDeck: DeckZone;
  characterDeck: DeckZone;
  market: MarketState;
  pending: PendingChoice | null;
};

export type GameEvent =
  | { type: "gameStarted"; gameId: string; seed: string }
  | { type: "turnStarted"; playerId: PlayerId; roundNumber: number }
  | { type: "actionSpent"; playerId: PlayerId; actionsRemaining: number }
  | {
      type: "cardMoved";
      cardId: CardInstanceId;
      from: string;
      to: string;
      owner: PlayerId | null;
    }
  | { type: "marketRefilled"; market: "pearl" | "character"; cardIds: CardInstanceId[] }
  | { type: "marketRefreshed"; market: "pearl"; discarded: CardInstanceId[] }
  | { type: "characterPlaced"; playerId: PlayerId; cardId: CardInstanceId }
  | { type: "pearlsDiscarded"; playerId: PlayerId; cardIds: CardInstanceId[] };

export type AnimationIntent =
  | { type: "cardMove"; cardId: CardInstanceId; from: string; to: string }
  | { type: "marketReveal"; market: "pearl" | "character"; cardIds: CardInstanceId[] }
  | { type: "turnBanner"; playerId: PlayerId };

export type EngineResult = {
  state: GameState;
  events: GameEvent[];
  animations: AnimationIntent[];
};

export type LegalAction =
  | GameAction
  | { type: "disabled"; reason: string; actorId: PlayerId };

