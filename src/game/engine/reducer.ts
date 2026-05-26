import { fixtureCatalog } from "../content/catalog";
import { createInitialGameState } from "./state";
import { shuffleWithRng } from "./rng";
import { getHandLimit, getPlayer } from "./selectors";
import type {
  AnimationIntent,
  CardInstanceId,
  CharacterRequirement,
  ContentCatalog,
  DeckZone,
  EngineResult,
  GameAction,
  GameEvent,
  GameState,
  PearlValue,
  PlayerId,
  PlayerState,
  RngState,
} from "./types";

function spendAction(actionsRemaining: GameState["turn"]["actionsRemaining"]) {
  if (actionsRemaining <= 0) {
    throw new Error("No actions remaining.");
  }
  return (actionsRemaining - 1) as GameState["turn"]["actionsRemaining"];
}

function assertActiveAction(state: GameState, actorId: PlayerId): void {
  if (state.turn.activePlayerId !== actorId) {
    throw new Error(`Not active player: ${actorId}`);
  }
  if (state.turn.phase !== "action") {
    throw new Error(`Cannot act during phase: ${state.turn.phase}`);
  }
  if (state.turn.actionsRemaining === 0) {
    throw new Error("No actions remaining.");
  }
}

function updatePlayer(
  state: GameState,
  playerId: PlayerId,
  update: (player: PlayerState) => PlayerState,
): PlayerState[] {
  return state.players.map((player) => (player.id === playerId ? update(player) : player));
}

function setCardOwner(
  state: GameState,
  cardIds: CardInstanceId[],
  owner: PlayerId | null,
): GameState["cardsById"] {
  const cardsById = { ...state.cardsById };
  for (const cardId of cardIds) {
    cardsById[cardId] = { ...cardsById[cardId], owner };
  }
  return cardsById;
}

function ensureDrawable(
  zone: DeckZone,
  rngState: RngState,
  needed: number,
): { zone: DeckZone; rngState: RngState } {
  if (zone.drawPile.length >= needed || zone.discardPile.length === 0) {
    return { zone, rngState };
  }
  const shuffled = shuffleWithRng(zone.discardPile, rngState);
  return {
    zone: {
      drawPile: [...zone.drawPile, ...shuffled.items],
      discardPile: [],
    },
    rngState: shuffled.state,
  };
}

function drawOne(drawPile: CardInstanceId[]): {
  cardId: CardInstanceId;
  drawPile: CardInstanceId[];
} {
  const [cardId, ...rest] = drawPile;
  if (!cardId) {
    throw new Error("Cannot draw from an empty pile.");
  }
  return { cardId, drawPile: rest };
}

function drawMany(
  drawPile: CardInstanceId[],
  count: number,
): { drawn: CardInstanceId[]; drawPile: CardInstanceId[] } {
  return {
    drawn: drawPile.slice(0, count),
    drawPile: drawPile.slice(count),
  };
}

function withSpentAction(
  state: GameState,
  actorId: PlayerId,
  events: GameEvent[],
): Pick<GameState, "turn"> & { events: GameEvent[] } {
  const actionsRemaining = spendAction(state.turn.actionsRemaining);
  return {
    turn: {
      ...state.turn,
      actionsRemaining,
    },
    events: [...events, { type: "actionSpent", playerId: actorId, actionsRemaining }],
  };
}

function result(
  state: GameState,
  events: GameEvent[],
  animations: AnimationIntent[] = [],
): EngineResult {
  return { state, events, animations };
}

function gainPearlFromMarket(state: GameState, action: Extract<GameAction, { type: "gainPearlFromMarket" }>) {
  assertActiveAction(state, action.actorId);

  const cardId = state.market.pearlMarket[action.marketIndex];
  if (!cardId) {
    throw new Error(`Invalid pearl market index: ${action.marketIndex}`);
  }

  const reshuffled = ensureDrawable(state.pearlDeck, state.rngState, 1);
  const deck = reshuffled.zone;
  const nextDraw = deck.drawPile.length > 0 ? drawOne(deck.drawPile) : null;
  const pearlMarket = [...state.market.pearlMarket];
  if (nextDraw) {
    pearlMarket[action.marketIndex] = nextDraw.cardId;
  } else {
    pearlMarket.splice(action.marketIndex, 1);
  }

  const events: GameEvent[] = [
    { type: "cardMoved", cardId, from: "pearlMarket", to: "pearlHand", owner: action.actorId },
  ];

  if (nextDraw) {
    events.push({ type: "marketRefilled", market: "pearl", cardIds: [nextDraw.cardId] });
  }

  const spent = withSpentAction(state, action.actorId, events);
  return result(
    {
      ...state,
      cardsById: setCardOwner(state, [cardId], action.actorId),
      players: updatePlayer(state, action.actorId, (player) => ({
        ...player,
        pearlHand: [...player.pearlHand, cardId],
      })),
      pearlDeck: {
        drawPile: nextDraw?.drawPile ?? deck.drawPile,
        discardPile: deck.discardPile,
      },
      market: {
        ...state.market,
        pearlMarket,
      },
      rngState: reshuffled.rngState,
      turn: spent.turn,
    },
    spent.events,
    [{ type: "cardMove", cardId, from: "pearlMarket", to: "pearlHand" }],
  );
}

function gainPearlFromDeck(state: GameState, action: Extract<GameAction, { type: "gainPearlFromDeck" }>) {
  assertActiveAction(state, action.actorId);

  const reshuffled = ensureDrawable(state.pearlDeck, state.rngState, 1);
  const deck = reshuffled.zone;
  const drawn = drawOne(deck.drawPile);
  const spent = withSpentAction(state, action.actorId, [
    {
      type: "cardMoved",
      cardId: drawn.cardId,
      from: "pearlDeck",
      to: "pearlHand",
      owner: action.actorId,
    },
  ]);

  return result(
    {
      ...state,
      cardsById: setCardOwner(state, [drawn.cardId], action.actorId),
      players: updatePlayer(state, action.actorId, (player) => ({
        ...player,
        pearlHand: [...player.pearlHand, drawn.cardId],
      })),
      pearlDeck: {
        drawPile: drawn.drawPile,
        discardPile: deck.discardPile,
      },
      rngState: reshuffled.rngState,
      turn: spent.turn,
    },
    spent.events,
    [{ type: "cardMove", cardId: drawn.cardId, from: "pearlDeck", to: "pearlHand" }],
  );
}

function refreshPearlMarket(
  state: GameState,
  action: Extract<GameAction, { type: "refreshPearlMarket" }>,
) {
  assertActiveAction(state, action.actorId);

  const discarded = state.market.pearlMarket;
  const intermediateZone: DeckZone = {
    drawPile: state.pearlDeck.drawPile,
    discardPile: [...state.pearlDeck.discardPile, ...discarded],
  };
  const reshuffled = ensureDrawable(intermediateZone, state.rngState, 4);
  const deck = reshuffled.zone;
  const drawn = drawMany(deck.drawPile, 4);
  const spent = withSpentAction(state, action.actorId, [
    { type: "marketRefreshed", market: "pearl", discarded },
    { type: "marketRefilled", market: "pearl", cardIds: drawn.drawn },
  ]);

  return result(
    {
      ...state,
      pearlDeck: {
        drawPile: drawn.drawPile,
        discardPile: deck.discardPile,
      },
      market: {
        ...state.market,
        pearlMarket: drawn.drawn,
      },
      rngState: reshuffled.rngState,
      turn: spent.turn,
    },
    spent.events,
    [{ type: "marketReveal", market: "pearl", cardIds: drawn.drawn }],
  );
}

function discardGateCharacter(
  state: GameState,
  actorId: PlayerId,
  discardGateCharacterId?: CardInstanceId,
): { players: PlayerState[]; discardPile: CardInstanceId[] } {
  const player = getPlayer(state, actorId);

  if (player.gateCharacters.length < 2) {
    return { players: state.players, discardPile: state.characterDeck.discardPile };
  }

  if (!discardGateCharacterId) {
    throw new Error("Gate is full; choose a gate character to discard.");
  }

  if (!player.gateCharacters.includes(discardGateCharacterId)) {
    throw new Error(`Cannot discard character not on gate: ${discardGateCharacterId}`);
  }

  return {
    players: updatePlayer(state, actorId, (candidate) => ({
      ...candidate,
      gateCharacters: candidate.gateCharacters.filter((cardId) => cardId !== discardGateCharacterId),
    })),
    discardPile: [...state.characterDeck.discardPile, discardGateCharacterId],
  };
}

function placeCharacterFromMarket(
  state: GameState,
  action: Extract<GameAction, { type: "placeCharacterFromMarket" }>,
) {
  assertActiveAction(state, action.actorId);

  const cardId = state.market.characterMarket[action.marketIndex];
  if (!cardId) {
    throw new Error(`Invalid character market index: ${action.marketIndex}`);
  }

  const discard = discardGateCharacter(state, action.actorId, action.discardGateCharacterId);
  const intermediateZone: DeckZone = {
    drawPile: state.characterDeck.drawPile,
    discardPile: discard.discardPile,
  };
  const reshuffled = ensureDrawable(intermediateZone, state.rngState, 1);
  const charDeck = reshuffled.zone;
  const nextDraw = charDeck.drawPile.length > 0 ? drawOne(charDeck.drawPile) : null;
  const characterMarket = [...state.market.characterMarket];
  if (nextDraw) {
    characterMarket[action.marketIndex] = nextDraw.cardId;
  } else {
    characterMarket.splice(action.marketIndex, 1);
  }

  const spent = withSpentAction(state, action.actorId, [
    {
      type: "cardMoved",
      cardId,
      from: "characterMarket",
      to: "gateCharacters",
      owner: action.actorId,
    },
    { type: "characterPlaced", playerId: action.actorId, cardId },
  ]);

  return result(
    {
      ...state,
      cardsById: setCardOwner(state, [cardId], action.actorId),
      players: discard.players.map((player) =>
        player.id === action.actorId
          ? { ...player, gateCharacters: [...player.gateCharacters, cardId] }
          : player,
      ),
      characterDeck: {
        drawPile: nextDraw?.drawPile ?? charDeck.drawPile,
        discardPile: charDeck.discardPile,
      },
      market: {
        ...state.market,
        characterMarket,
      },
      rngState: reshuffled.rngState,
      turn: spent.turn,
    },
    spent.events,
    [{ type: "cardMove", cardId, from: "characterMarket", to: "gateCharacters" }],
  );
}

function placeCharacterFromDeck(
  state: GameState,
  action: Extract<GameAction, { type: "placeCharacterFromDeck" }>,
) {
  assertActiveAction(state, action.actorId);

  const discard = discardGateCharacter(state, action.actorId, action.discardGateCharacterId);
  const intermediateZone: DeckZone = {
    drawPile: state.characterDeck.drawPile,
    discardPile: discard.discardPile,
  };
  const reshuffled = ensureDrawable(intermediateZone, state.rngState, 1);
  const charDeck = reshuffled.zone;
  const drawn = drawOne(charDeck.drawPile);
  const spent = withSpentAction(state, action.actorId, [
    {
      type: "cardMoved",
      cardId: drawn.cardId,
      from: "characterDeck",
      to: "gateCharacters",
      owner: action.actorId,
    },
    { type: "characterPlaced", playerId: action.actorId, cardId: drawn.cardId },
  ]);

  return result(
    {
      ...state,
      cardsById: setCardOwner(state, [drawn.cardId], action.actorId),
      players: discard.players.map((player) =>
        player.id === action.actorId
          ? { ...player, gateCharacters: [...player.gateCharacters, drawn.cardId] }
          : player,
      ),
      characterDeck: {
        drawPile: drawn.drawPile,
        discardPile: charDeck.discardPile,
      },
      rngState: reshuffled.rngState,
      turn: spent.turn,
    },
    spent.events,
    [{ type: "cardMove", cardId: drawn.cardId, from: "characterDeck", to: "gateCharacters" }],
  );
}

function discardPearlsToLimit(
  state: GameState,
  action: Extract<GameAction, { type: "discardPearlsToLimit" }>,
) {
  const player = getPlayer(state, action.actorId);
  const handLimit = getHandLimit(state, action.actorId);

  if (new Set(action.pearlIds).size !== action.pearlIds.length) {
    throw new Error("Duplicate pearl IDs in discard.");
  }

  if (player.pearlHand.length - action.pearlIds.length > handLimit) {
    throw new Error("Not enough pearls discarded to satisfy hand limit.");
  }

  for (const pearlId of action.pearlIds) {
    if (!player.pearlHand.includes(pearlId)) {
      throw new Error(`Cannot discard pearl not in hand: ${pearlId}`);
    }
  }

  return result(
    {
      ...state,
      cardsById: setCardOwner(state, action.pearlIds, null),
      players: updatePlayer(state, action.actorId, (candidate) => ({
        ...candidate,
        pearlHand: candidate.pearlHand.filter((cardId) => !action.pearlIds.includes(cardId)),
      })),
      pearlDeck: {
        ...state.pearlDeck,
        discardPile: [...state.pearlDeck.discardPile, ...action.pearlIds],
      },
    },
    [{ type: "pearlsDiscarded", playerId: action.actorId, cardIds: action.pearlIds }],
  );
}

function activateGateCharacter(
  state: GameState,
  action: Extract<GameAction, { type: "activateGateCharacter" }>,
) {
  assertActiveAction(state, action.actorId);

  const player = getPlayer(state, action.actorId);
  if (!player.gateCharacters.includes(action.characterInstanceId)) {
    throw new Error(`Character not on gate: ${action.characterInstanceId}`);
  }

  const pearlIds = action.payment.pearlIds;
  if (pearlIds.length === 0) {
    throw new Error("Activation requires at least one pearl.");
  }
  if (new Set(pearlIds).size !== pearlIds.length) {
    throw new Error("Duplicate pearl IDs in payment.");
  }
  for (const pearlId of pearlIds) {
    if (!player.pearlHand.includes(pearlId)) {
      throw new Error(`Pearl not in hand: ${pearlId}`);
    }
  }

  const definition = fixtureCatalog.characterCards[state.cardsById[action.characterInstanceId].definitionId];
  if (!definition) {
    throw new Error(`Unknown character definition for ${action.characterInstanceId}`);
  }
  const pearlValues = pearlIds.map((id) => pearlValueOfInstance(state, id));
  if (!paymentSatisfiesRequirement(pearlValues, definition.requirement)) {
    throw new Error(
      `Payment does not satisfy requirement ${JSON.stringify(definition.requirement)}: values=${pearlValues.join(",")}`,
    );
  }

  const diamondReward =
    typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
  const diamondDraw =
    diamondReward > 0
      ? drawDiamondCards(state, diamondReward)
      : { drawn: [] as CardInstanceId[], characterDeck: state.characterDeck, rngState: state.rngState, cardsById: state.cardsById };

  const events: GameEvent[] = [
    {
      type: "cardMoved",
      cardId: action.characterInstanceId,
      from: "gateCharacters",
      to: "activatedCharacters",
      owner: action.actorId,
    },
    { type: "pearlsDiscarded", playerId: action.actorId, cardIds: pearlIds },
  ];

  const spent = withSpentAction(state, action.actorId, events);

  const cardsByIdAfterDiamonds = diamondDraw.cardsById;
  const cardsByIdFinal = setCardOwnerInMap(cardsByIdAfterDiamonds, pearlIds, null);
  const cardsByIdWithDiamonds = setCardOwnerInMap(cardsByIdFinal, diamondDraw.drawn, action.actorId);

  return result(
    {
      ...state,
      cardsById: cardsByIdWithDiamonds,
      players: updatePlayer(state, action.actorId, (candidate) => ({
        ...candidate,
        pearlHand: candidate.pearlHand.filter((cardId) => !pearlIds.includes(cardId)),
        gateCharacters: candidate.gateCharacters.filter(
          (cardId) => cardId !== action.characterInstanceId,
        ),
        activatedCharacters: [...candidate.activatedCharacters, action.characterInstanceId],
        diamonds: [...candidate.diamonds, ...diamondDraw.drawn],
      })),
      pearlDeck: {
        ...state.pearlDeck,
        discardPile: [...state.pearlDeck.discardPile, ...pearlIds],
      },
      characterDeck: diamondDraw.characterDeck,
      rngState: diamondDraw.rngState,
      turn: spent.turn,
    },
    spent.events,
    [
      {
        type: "cardMove",
        cardId: action.characterInstanceId,
        from: "gateCharacters",
        to: "activatedCharacters",
      },
    ],
  );
}

function setCardOwnerInMap(
  cardsById: GameState["cardsById"],
  cardIds: CardInstanceId[],
  owner: PlayerId | null,
): GameState["cardsById"] {
  if (cardIds.length === 0) return cardsById;
  const next = { ...cardsById };
  for (const id of cardIds) {
    if (next[id]) {
      next[id] = { ...next[id], owner };
    }
  }
  return next;
}

function drawDiamondCards(
  state: GameState,
  count: number,
): {
  drawn: CardInstanceId[];
  characterDeck: DeckZone;
  rngState: RngState;
  cardsById: GameState["cardsById"];
} {
  let zone: DeckZone = state.characterDeck;
  let rngState = state.rngState;
  const drawn: CardInstanceId[] = [];
  for (let index = 0; index < count; index += 1) {
    const reshuffled = ensureDrawable(zone, rngState, 1);
    zone = reshuffled.zone;
    rngState = reshuffled.rngState;
    if (zone.drawPile.length === 0) break;
    const [head, ...rest] = zone.drawPile;
    drawn.push(head);
    zone = { drawPile: rest, discardPile: zone.discardPile };
  }
  return { drawn, characterDeck: zone, rngState, cardsById: state.cardsById };
}

function pearlValueOfInstance(state: GameState, cardId: CardInstanceId): PearlValue {
  const instance = state.cardsById[cardId];
  if (!instance) {
    throw new Error(`Unknown card instance: ${cardId}`);
  }
  const pearl = fixtureCatalog.pearlCards[instance.definitionId];
  if (!pearl) {
    throw new Error(`Card is not a pearl: ${cardId}`);
  }
  return pearl.value;
}

function paymentSatisfiesRequirement(
  values: PearlValue[],
  requirement: CharacterRequirement,
): boolean {
  switch (requirement.type) {
    case "exactValues": {
      if (values.length !== requirement.values.length) return false;
      const want = [...requirement.values].sort();
      const got = [...values].sort();
      return want.every((v, i) => v === got[i]);
    }
    case "sameValue": {
      if (values.length !== requirement.count) return false;
      return values.every((v) => v === values[0]);
    }
    case "sequence": {
      if (values.length !== requirement.count) return false;
      const sorted = [...new Set(values)].sort((a, b) => a - b);
      if (sorted.length !== values.length) return false;
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i] !== sorted[i - 1] + 1) return false;
      }
      return true;
    }
    case "sum": {
      const total = values.reduce((acc, v) => acc + v, 0);
      if (total !== requirement.total) return false;
      if (typeof requirement.count === "number" && values.length !== requirement.count) {
        return false;
      }
      return true;
    }
    case "odd":
      return values.length === requirement.count && values.every((v) => v % 2 === 1);
    case "even":
      return values.length === requirement.count && values.every((v) => v % 2 === 0);
    case "custom":
      return false;
  }
}


function endTurn(state: GameState, action: Extract<GameAction, { type: "endTurn" }>) {
  if (state.turn.activePlayerId !== action.actorId) {
    throw new Error(`Not active player: ${action.actorId}`);
  }
  if (state.turn.actionsRemaining !== 0) {
    throw new Error("A turn cannot end until all 3 actions are spent.");
  }

  const player = getPlayer(state, action.actorId);
  if (player.pearlHand.length > getHandLimit(state, action.actorId)) {
    throw new Error("Discard to hand limit before ending the turn.");
  }

  const activeIndex = state.players.findIndex((candidate) => candidate.id === action.actorId);
  const nextIndex = (activeIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIndex];
  const roundNumber =
    nextPlayer.id === state.turn.startPlayerId ? state.turn.roundNumber + 1 : state.turn.roundNumber;

  const nextState: GameState = {
    ...state,
    turn: {
      ...state.turn,
      roundNumber,
      activePlayerId: nextPlayer.id,
      actionsRemaining: 3,
      phase: "action",
    },
  };

  return result(
    nextState,
    [{ type: "turnStarted", playerId: nextPlayer.id, roundNumber }],
    [{ type: "turnBanner", playerId: nextPlayer.id }],
  );
}

const END_GAME_POWER_THRESHOLD = 12;

function computePlayerPower(state: GameState, playerId: PlayerId, catalog: ContentCatalog): number {
  const player = getPlayer(state, playerId);
  return player.activatedCharacters.reduce((total, cardId) => {
    const instance = state.cardsById[cardId];
    const definition = catalog.characterCards[instance.definitionId];
    return total + (typeof definition?.power === "number" ? definition.power : 0);
  }, 0);
}

function applyEndGameTransitions(
  state: GameState,
  action: GameAction,
  catalog: ContentCatalog,
): GameState {
  if (state.turn.endGame.status === "ended") {
    return state;
  }

  if (state.turn.endGame.status === "notTriggered" && action.type === "activateGateCharacter") {
    const power = computePlayerPower(state, action.actorId, catalog);
    if (power >= END_GAME_POWER_THRESHOLD) {
      return {
        ...state,
        turn: {
          ...state.turn,
          endGame: {
            status: "finishCurrentRound",
            triggeredBy: action.actorId,
            triggeredRound: state.turn.roundNumber,
          },
        },
      };
    }
  }

  return state;
}

function applyEndGameOnTurnStart(state: GameState, previousRound: number): GameState {
  if (state.turn.roundNumber === previousRound) {
    return state;
  }
  const endGame = state.turn.endGame;
  if (endGame.status === "finishCurrentRound" && state.turn.roundNumber > endGame.triggeredRound) {
    return {
      ...state,
      turn: {
        ...state.turn,
        endGame: {
          status: "finalRound",
          triggeredBy: endGame.triggeredBy,
          finalRoundNumber: state.turn.roundNumber,
        },
      },
    };
  }
  if (endGame.status === "finalRound" && state.turn.roundNumber > endGame.finalRoundNumber) {
    const ranked = [...state.players].sort((left, right) => {
      const leftPower = computePlayerPower(state, left.id, fixtureCatalog);
      const rightPower = computePlayerPower(state, right.id, fixtureCatalog);
      if (rightPower !== leftPower) return rightPower - leftPower;
      return right.diamonds.length - left.diamonds.length;
    });
    const topPower = computePlayerPower(state, ranked[0].id, fixtureCatalog);
    const topDiamonds = ranked[0].diamonds.length;
    const winners = ranked.filter(
      (candidate) =>
        computePlayerPower(state, candidate.id, fixtureCatalog) === topPower &&
        candidate.diamonds.length === topDiamonds,
    );
    return {
      ...state,
      turn: {
        ...state.turn,
        phase: "gameOver",
        endGame: { status: "ended", winnerIds: winners.map((p) => p.id) },
      },
    };
  }
  return state;
}

export function reduceGame(
  state: GameState | undefined,
  action: GameAction,
  catalog: ContentCatalog = fixtureCatalog,
): EngineResult {
  if (action.type === "startGame") {
    const nextState = createInitialGameState(action.options, catalog);
    return result(nextState, [{ type: "gameStarted", gameId: nextState.gameId, seed: nextState.seed }]);
  }

  if (!state) {
    throw new Error("Game state is required for this action.");
  }

  const previousRound = state.turn.roundNumber;
  let outcome: EngineResult;
  switch (action.type) {
    case "gainPearlFromMarket":
      outcome = gainPearlFromMarket(state, action);
      break;
    case "gainPearlFromDeck":
      outcome = gainPearlFromDeck(state, action);
      break;
    case "refreshPearlMarket":
      outcome = refreshPearlMarket(state, action);
      break;
    case "placeCharacterFromMarket":
      outcome = placeCharacterFromMarket(state, action);
      break;
    case "placeCharacterFromDeck":
      outcome = placeCharacterFromDeck(state, action);
      break;
    case "discardPearlsToLimit":
      outcome = discardPearlsToLimit(state, action);
      break;
    case "endTurn":
      outcome = endTurn(state, action);
      break;
    case "activateGateCharacter":
      outcome = activateGateCharacter(state, action);
      break;
    case "useAbility":
      throw new Error("Character abilities are not implemented in the first engine slice.");
  }

  let nextState = applyEndGameTransitions(outcome.state, action, catalog);
  nextState = applyEndGameOnTurnStart(nextState, previousRound);
  return { ...outcome, state: nextState };
}

