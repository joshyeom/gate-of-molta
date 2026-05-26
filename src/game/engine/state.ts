import { fixtureCatalog } from "../content/catalog";
import {
  getFixtureCharacterDefinitionIds,
} from "../content/characters.fixture";
import { getPearlDefinitionIds, PEARL_COPIES_PER_VALUE } from "../content/pearls";
import { nextInt, seedToRngState, shuffleWithRng } from "./rng";
import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ContentCatalog,
  GameSetupOptions,
  GameState,
  PlayerState,
  RngState,
} from "./types";

export const defaultSetupOptions: GameSetupOptions = {
  totalPlayers: 3,
  humanPlayerCount: 1,
  aiDifficulty: "normal",
  seed: "molta-seed",
  startPlayer: { type: "seededRandom" },
  contentMode: "fixture",
};

export const STARTING_PEARL_HAND_SIZE = 5;
const FIXTURE_CHARACTER_COPIES_PER_DEFINITION = 9;

type DrawResult = {
  drawn: CardInstanceId[];
  drawPile: CardInstanceId[];
};

function drawCards(drawPile: CardInstanceId[], count: number): DrawResult {
  return {
    drawn: drawPile.slice(0, count),
    drawPile: drawPile.slice(count),
  };
}

function createCardInstance(
  definitionId: CardDefinitionId,
  instanceSuffix: string,
): CardInstance {
  return {
    id: `${definitionId}#${instanceSuffix}`,
    definitionId,
    owner: null,
  };
}

function createPearlInstances(): CardInstance[] {
  return getPearlDefinitionIds().flatMap((definitionId) =>
    Array.from({ length: PEARL_COPIES_PER_VALUE }, (_, index) =>
      createCardInstance(definitionId, String(index + 1).padStart(2, "0")),
    ),
  );
}

function createCharacterInstances(): CardInstance[] {
  return getFixtureCharacterDefinitionIds().flatMap((definitionId) =>
    Array.from({ length: FIXTURE_CHARACTER_COPIES_PER_DEFINITION }, (_, index) =>
      createCardInstance(definitionId, String(index + 1).padStart(2, "0")),
    ),
  );
}

function createGateInstance(seatIndex: number, owner: string): CardInstance {
  return {
    id: `gate#${seatIndex + 1}`,
    definitionId: "gate-card",
    owner,
  };
}

function createPlayers(options: GameSetupOptions): {
  players: PlayerState[];
  gateCards: CardInstance[];
} {
  const players: PlayerState[] = [];
  const gateCards: CardInstance[] = [];

  for (let seatIndex = 0; seatIndex < options.totalPlayers; seatIndex += 1) {
    const id = `player-${seatIndex + 1}`;
    const gateCard = createGateInstance(seatIndex, id);
    gateCards.push(gateCard);
    players.push({
      id,
      seatIndex,
      controller:
        seatIndex === 0 ? { type: "human" } : { type: "ai", difficulty: options.aiDifficulty },
      gateCardId: gateCard.id,
      pearlHand: [],
      gateCharacters: [],
      activatedCharacters: [],
      diamonds: [],
    });
  }

  return { players, gateCards };
}

function dealStartingPearls(
  players: PlayerState[],
  drawPile: CardInstanceId[],
): {
  players: PlayerState[];
  drawPile: CardInstanceId[];
  ownerByCardId: Record<CardInstanceId, string>;
} {
  let remainingDrawPile = drawPile;
  const ownerByCardId: Record<CardInstanceId, string> = {};

  const playersWithHands = players.map((player) => {
    const handDraw = drawCards(remainingDrawPile, STARTING_PEARL_HAND_SIZE);
    remainingDrawPile = handDraw.drawPile;

    for (const cardId of handDraw.drawn) {
      ownerByCardId[cardId] = player.id;
    }

    return {
      ...player,
      pearlHand: handDraw.drawn,
    };
  });

  return {
    players: playersWithHands,
    drawPile: remainingDrawPile,
    ownerByCardId,
  };
}

function resolveStartPlayerId(
  options: GameSetupOptions,
  players: PlayerState[],
  rngState: RngState,
): { playerId: string; rngState: RngState } {
  if (options.startPlayer.type === "fixedSeat") {
    const player = players[options.startPlayer.seatIndex];
    if (!player) {
      throw new Error(`Invalid start player seat: ${options.startPlayer.seatIndex}`);
    }
    return { playerId: player.id, rngState };
  }

  const next = nextInt(rngState, 0, players.length);
  return {
    playerId: players[next.value].id,
    rngState: next.state,
  };
}

export function createInitialGameState(
  options: GameSetupOptions = defaultSetupOptions,
  catalog: ContentCatalog = fixtureCatalog,
): GameState {
  if (options.humanPlayerCount !== 1) {
    throw new Error("The first implementation supports exactly one human player.");
  }

  let rngState = seedToRngState(options.seed);
  const pearlInstances = createPearlInstances();
  const characterInstances = createCharacterInstances();
  const { players, gateCards } = createPlayers(options);

  const shuffledPearls = shuffleWithRng(
    pearlInstances.map((card) => card.id),
    rngState,
  );
  rngState = shuffledPearls.state;

  const shuffledCharacters = shuffleWithRng(
    characterInstances.map((card) => card.id),
    rngState,
  );
  rngState = shuffledCharacters.state;

  const startingHands = dealStartingPearls(players, shuffledPearls.items);
  const pearlMarketDraw = drawCards(startingHands.drawPile, 4);
  const characterMarketDraw = drawCards(shuffledCharacters.items, 2);
  const startPlayer = resolveStartPlayerId(options, players, rngState);
  rngState = startPlayer.rngState;

  const cards = [...gateCards, ...pearlInstances, ...characterInstances];
  const cardsById = Object.fromEntries(
    cards.map((card) => [
      card.id,
      {
        ...card,
        owner: startingHands.ownerByCardId[card.id] ?? card.owner,
      },
    ]),
  );

  return {
    schemaVersion: 1,
    gameId: `game-${options.seed}`,
    seed: options.seed,
    rngState,
    contentVersion: catalog.version,
    setup: options,
    contentMode: options.contentMode,
    players: startingHands.players,
    turn: {
      roundNumber: 1,
      activePlayerId: startPlayer.playerId,
      startPlayerId: startPlayer.playerId,
      actionsRemaining: 3,
      phase: "action",
      endGame: { status: "notTriggered" },
    },
    cardsById,
    pearlDeck: {
      drawPile: pearlMarketDraw.drawPile,
      discardPile: [],
    },
    characterDeck: {
      drawPile: characterMarketDraw.drawPile,
      discardPile: [],
    },
    market: {
      pearlMarket: pearlMarketDraw.drawn,
      characterMarket: characterMarketDraw.drawn,
    },
    pending: null,
  };
}
