import { fixtureCatalog } from "../content/catalog";
import {
  areAdjacentSeats,
  DISCARD_OPPONENT_GATE_IDS,
  DISCARD_REDRAW_HAND_IDS,
  DOWN_DIAMOND_IDS,
  DRAW_DIAMOND_BY_TWO_IDS,
  getCharacterPower,
  getDefinitionId,
  IMMEDIATE_EXTRA_ACTION_IDS,
  isWisp,
  NEXT_PLAYER_ACTION_BONUS_IDS,
  ONE_AS_EIGHT_IDS,
  PEEK_CHARACTER_DECK_IDS,
  RECLAIM_USED_PEARL_IDS,
  STEAL_HAND_IDS,
  SWAP_GATE_MARKET_IDS,
  THREE_AS_ANY_IDS,
  TURN_ACTION_BONUS_IDS,
  VIRTUAL_PEARL_VALUE_BY_DEFINITION,
} from "./abilities";
import { createInitialGameState } from "./state";
import { shuffleWithRng } from "./rng";
import { getHandLimit, getPlayer, getTurnActionCount } from "./selectors";
import type {
  AnimationIntent,
  CardInstanceId,
  CardDefinitionId,
  CharacterRequirement,
  ContentCatalog,
  DeckZone,
  EngineResult,
  GameAction,
  GameEvent,
  GameState,
  PaymentPlan,
  PearlValue,
  PearlValueOverride,
  PlayerId,
  PlayerState,
  RngState,
  VirtualPearlUse,
} from "./types";

function spendAction(actionsRemaining: GameState["turn"]["actionsRemaining"]) {
  if (actionsRemaining <= 0) {
    throw new Error("No actions remaining.");
  }
  return actionsRemaining - 1;
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

function isRefreshPearlCard(state: GameState, cardId: CardInstanceId): boolean {
  const definitionId = state.cardsById[cardId]?.definitionId;
  return fixtureCatalog.pearlCards[definitionId]?.hasRefreshIcon === true;
}

function refreshCharacterMarketForPearlTriggers(
  state: GameState,
  triggerPearlIds: CardInstanceId[],
): { state: GameState; events: GameEvent[]; animations: AnimationIntent[] } {
  if (!triggerPearlIds.some((cardId) => isRefreshPearlCard(state, cardId))) {
    return { state, events: [], animations: [] };
  }

  const discarded = [...state.market.characterMarket];
  const drawn = drawMany(state.characterDeck.drawPile, 2);
  const events: GameEvent[] = [
    { type: "marketRefreshed", market: "character", discarded },
    ...discarded.map((cardId) => ({
      type: "cardMoved" as const,
      cardId,
      from: "characterMarket",
      to: "characterDiscard",
      owner: null,
    })),
  ];

  if (drawn.drawn.length > 0) {
    events.push({ type: "marketRefilled", market: "character", cardIds: drawn.drawn });
  }

  return {
    state: {
      ...state,
      cardsById: setCardOwnerInMap(state.cardsById, discarded, null),
      characterDeck: {
        drawPile: drawn.drawPile,
        discardPile: [...state.characterDeck.discardPile, ...discarded],
      },
      market: {
        ...state.market,
        characterMarket: drawn.drawn,
      },
    },
    events,
    animations:
      drawn.drawn.length > 0
        ? [{ type: "marketReveal", market: "character", cardIds: drawn.drawn }]
        : [],
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
  const baseState: GameState = {
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
  };
  const characterRefresh = refreshCharacterMarketForPearlTriggers(
    baseState,
    nextDraw ? [nextDraw.cardId] : [],
  );

  return result(
    characterRefresh.state,
    [...spent.events, ...characterRefresh.events],
    [
      { type: "cardMove", cardId, from: "pearlMarket", to: "pearlHand" },
      ...characterRefresh.animations,
    ],
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

  const baseState: GameState = {
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
  };
  const characterRefresh = refreshCharacterMarketForPearlTriggers(baseState, drawn.drawn);

  return result(
    characterRefresh.state,
    [...spent.events, ...characterRefresh.events],
    [
      { type: "marketReveal", market: "pearl", cardIds: drawn.drawn },
      ...characterRefresh.animations,
    ],
  );
}

function discardGateCharacter(
  state: GameState,
  actorId: PlayerId,
  discardGateCharacterId?: CardInstanceId,
): { players: PlayerState[]; discardPile: CardInstanceId[]; discardedCardId: CardInstanceId | null } {
  const player = getPlayer(state, actorId);

  if (player.gateCharacters.length < 2) {
    return {
      players: state.players,
      discardPile: state.characterDeck.discardPile,
      discardedCardId: null,
    };
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
    discardedCardId: discardGateCharacterId,
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
  const charDeck = intermediateZone;
  const nextDraw = charDeck.drawPile.length > 0 ? drawOne(charDeck.drawPile) : null;
  const characterMarket = [...state.market.characterMarket];
  if (nextDraw) {
    characterMarket[action.marketIndex] = nextDraw.cardId;
  } else {
    characterMarket.splice(action.marketIndex, 1);
  }

  const discardEvents: GameEvent[] = discard.discardedCardId
    ? [
        {
          type: "cardMoved",
          cardId: discard.discardedCardId,
          from: "gateCharacters",
          to: "characterDiscard",
          owner: null,
        },
        {
          type: "characterDiscarded",
          playerId: action.actorId,
          cardId: discard.discardedCardId,
        },
      ]
    : [];
  const spent = withSpentAction(state, action.actorId, [
    ...discardEvents,
    {
      type: "cardMoved",
      cardId,
      from: "characterMarket",
      to: "gateCharacters",
      owner: action.actorId,
    },
    { type: "characterPlaced", playerId: action.actorId, cardId },
  ]);
  const cardsById = setCardOwnerInMap(
    setCardOwner(state, [cardId], action.actorId),
    discard.discardedCardId ? [discard.discardedCardId] : [],
    null,
  );

  return result(
    {
      ...state,
      cardsById,
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
  const charDeck = intermediateZone;
  const drawn = drawOne(charDeck.drawPile);
  const discardEvents: GameEvent[] = discard.discardedCardId
    ? [
        {
          type: "cardMoved",
          cardId: discard.discardedCardId,
          from: "gateCharacters",
          to: "characterDiscard",
          owner: null,
        },
        {
          type: "characterDiscarded",
          playerId: action.actorId,
          cardId: discard.discardedCardId,
        },
      ]
    : [];
  const spent = withSpentAction(state, action.actorId, [
    ...discardEvents,
    {
      type: "cardMoved",
      cardId: drawn.cardId,
      from: "characterDeck",
      to: "gateCharacters",
      owner: action.actorId,
    },
    { type: "characterPlaced", playerId: action.actorId, cardId: drawn.cardId },
  ]);
  const cardsById = setCardOwnerInMap(
    setCardOwner(state, [drawn.cardId], action.actorId),
    discard.discardedCardId ? [discard.discardedCardId] : [],
    null,
  );

  return result(
    {
      ...state,
      cardsById,
      players: discard.players.map((player) =>
        player.id === action.actorId
          ? { ...player, gateCharacters: [...player.gateCharacters, drawn.cardId] }
          : player,
      ),
      characterDeck: {
        drawPile: drawn.drawPile,
        discardPile: charDeck.discardPile,
      },
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
  const gateOwner = state.players.find((candidate) =>
    candidate.gateCharacters.includes(action.characterInstanceId),
  );
  if (!gateOwner) {
    throw new Error(`Character not on gate: ${action.characterInstanceId}`);
  }
  if (
    gateOwner.id !== action.actorId &&
    (!isWisp(state, action.characterInstanceId) ||
      !areAdjacentSeats(state, action.actorId, gateOwner.id))
  ) {
    throw new Error(`Character not on this player's activatable gate: ${action.characterInstanceId}`);
  }

  const pearlIds = action.payment.pearlIds;
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
  const appliedPayment = applyDiamondUsesToPayment(state, player, action.payment);
  const pearlValues = appliedPayment.pearlValues;
  if (pearlValues.length === 0) {
    throw new Error("Activation requires at least one pearl value.");
  }
  if (!paymentSatisfiesRequirement(pearlValues, definition.requirement, action.payment)) {
    throw new Error(
      `Payment does not satisfy requirement ${JSON.stringify(definition.requirement)}: values=${pearlValues.join(",")}`,
    );
  }

  const reclaimedPearlIds = RECLAIM_USED_PEARL_IDS.has(definition.id)
    ? chooseReclaimedPearls(state, pearlIds, 1)
    : [];
  const reclaimedPearlSet = new Set(reclaimedPearlIds);
  const discardedPearlIds = pearlIds.filter((pearlId) => !reclaimedPearlSet.has(pearlId));
  const characterDeckAfterPayment: DeckZone = {
    ...state.characterDeck,
    discardPile: [...state.characterDeck.discardPile, ...appliedPayment.diamondIds],
  };
  const stateAfterPayment: GameState = {
    ...state,
    cardsById: setCardOwnerInMap(state.cardsById, appliedPayment.diamondIds, null),
    characterDeck: characterDeckAfterPayment,
  };
  const diamondReward =
    typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
  const diamondDraw =
    diamondReward > 0
      ? drawDiamondCards(stateAfterPayment, diamondReward)
      : {
          drawn: [] as CardInstanceId[],
          characterDeck: stateAfterPayment.characterDeck,
          rngState: stateAfterPayment.rngState,
          cardsById: stateAfterPayment.cardsById,
        };

  const events: GameEvent[] = [
    {
      type: "cardMoved",
      cardId: action.characterInstanceId,
      from: "gateCharacters",
      to: "activatedCharacters",
      owner: action.actorId,
    },
    ...(discardedPearlIds.length > 0
      ? [{ type: "pearlsDiscarded" as const, playerId: action.actorId, cardIds: discardedPearlIds }]
      : []),
    ...(reclaimedPearlIds.length > 0
      ? [{ type: "pearlsReclaimed" as const, playerId: action.actorId, cardIds: reclaimedPearlIds }]
      : []),
    ...(appliedPayment.diamondIds.length > 0
      ? [
          {
            type: "diamondsDiscarded" as const,
            playerId: action.actorId,
            cardIds: appliedPayment.diamondIds,
          },
        ]
      : []),
    ...diamondDraw.drawn.map((cardId) => ({
      type: "cardMoved" as const,
      cardId,
      from: "characterDeck",
      to: "diamonds",
      owner: action.actorId,
    })),
  ];

  const spent = withSpentAction(state, action.actorId, events);

  const cardsByIdAfterDiamonds = diamondDraw.cardsById;
  const cardsByIdAfterPearls = setCardOwnerInMap(
    cardsByIdAfterDiamonds,
    discardedPearlIds,
    null,
  );
  const cardsByIdAfterReward = setCardOwnerInMap(
    cardsByIdAfterPearls,
    diamondDraw.drawn,
    action.actorId,
  );
  const cardsByIdFinal = setCardOwnerInMap(
    cardsByIdAfterReward,
    [action.characterInstanceId],
    action.actorId,
  );

  const baseState: GameState = {
      ...state,
      cardsById: cardsByIdFinal,
      players: state.players.map((candidate) => {
        let next = candidate;
        if (candidate.id === gateOwner.id) {
          next = {
            ...next,
            gateCharacters: next.gateCharacters.filter(
              (cardId) => cardId !== action.characterInstanceId,
            ),
          };
        }
        if (candidate.id === action.actorId) {
          next = {
            ...next,
            pearlHand: [
              ...next.pearlHand.filter((cardId) => !pearlIds.includes(cardId)),
              ...reclaimedPearlIds,
            ],
            activatedCharacters: [...next.activatedCharacters, action.characterInstanceId],
            diamonds: [
              ...next.diamonds.filter((cardId) => !appliedPayment.diamondIds.includes(cardId)),
              ...diamondDraw.drawn,
            ],
          };
        }
        return next;
      }),
      pearlDeck: {
        ...state.pearlDeck,
        discardPile: [...state.pearlDeck.discardPile, ...discardedPearlIds],
      },
      characterDeck: diamondDraw.characterDeck,
      rngState: diamondDraw.rngState,
      turn: spent.turn,
    };
  const activated = applyOnActivateEffects(
    baseState,
    action.actorId,
    definition.id,
  );

  return result(
    activated.state,
    [...spent.events, ...activated.events],
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

type AppliedPayment = {
  pearlValues: PearlValue[];
  diamondIds: CardInstanceId[];
};

function applyDiamondUsesToPayment(
  state: GameState,
  player: PlayerState,
  payment: PaymentPlan,
): AppliedPayment {
  const diamondUses = payment.diamondUses ?? [];
  const spentDiamondIds = payment.spentDiamondIds ?? [];
  const pearlValueOverrides = payment.pearlValueOverrides ?? [];
  const virtualPearls = payment.virtualPearls ?? [];
  const diamondIds = diamondUses.map((use) => use.diamondId);
  if (new Set(diamondIds).size !== diamondIds.length) {
    throw new Error("Duplicate diamond IDs in payment.");
  }
  if (new Set(spentDiamondIds).size !== spentDiamondIds.length) {
    throw new Error("Duplicate spent diamond IDs in payment.");
  }
  for (const diamondId of spentDiamondIds) {
    if (!player.diamonds.includes(diamondId)) {
      throw new Error(`Diamond not available: ${diamondId}`);
    }
    if (diamondIds.includes(diamondId)) {
      throw new Error(`Diamond cannot be used twice in one payment: ${diamondId}`);
    }
  }

  const boostedPearlIds = diamondUses.map((use) => use.pearlId);
  if (new Set(boostedPearlIds).size !== boostedPearlIds.length) {
    throw new Error("Only one diamond can be used per pearl card.");
  }
  const overridePearlIds = pearlValueOverrides.map((override) => override.pearlId);
  if (new Set(overridePearlIds).size !== overridePearlIds.length) {
    throw new Error("Only one value override can be used per pearl card.");
  }

  const paymentPearlIds = new Set(payment.pearlIds);
  const diamondUseByPearlId = new Map<CardInstanceId, PaymentPlan["diamondUses"][number]>();
  for (const use of diamondUses) {
    if (!player.diamonds.includes(use.diamondId)) {
      throw new Error(`Diamond not available: ${use.diamondId}`);
    }
    if (!paymentPearlIds.has(use.pearlId)) {
      throw new Error(`Diamond target pearl is not in payment: ${use.pearlId}`);
    }
    if (use.modifier === 1 && use.source !== "baseRule") {
      throw new Error("Increasing a pearl with a diamond must use the base rule.");
    }
    if (
      use.modifier === -1 &&
      (use.source !== "candidateAbility" || !hasActiveDefinition(player, state, DOWN_DIAMOND_IDS))
    ) {
      throw new Error("Lowering a pearl with a diamond requires the matching activated character.");
    }
    diamondUseByPearlId.set(use.pearlId, use);
  }

  const overrideByPearlId = new Map<CardInstanceId, PearlValueOverride>();
  for (const override of pearlValueOverrides) {
    if (!paymentPearlIds.has(override.pearlId)) {
      throw new Error(`Override target pearl is not in payment: ${override.pearlId}`);
    }
    if (!player.activatedCharacters.includes(override.sourceCharacterId)) {
      throw new Error(`Override source is not activated: ${override.sourceCharacterId}`);
    }
    const sourceDefinitionId = getDefinitionId(state, override.sourceCharacterId);
    const baseValue = pearlValueOfInstance(state, override.pearlId);
    if (sourceDefinitionId && THREE_AS_ANY_IDS.has(sourceDefinitionId)) {
      if (baseValue !== 3) {
        throw new Error("Only pearl 3 can be changed by this effect.");
      }
    } else if (sourceDefinitionId && ONE_AS_EIGHT_IDS.has(sourceDefinitionId)) {
      if (baseValue !== 1 || override.value !== 8) {
        throw new Error("Only pearl 1 can be used as 8 by this effect.");
      }
    } else {
      throw new Error(`Invalid pearl override source: ${override.sourceCharacterId}`);
    }
    overrideByPearlId.set(override.pearlId, override);
  }

  const pearlValues = payment.pearlIds.map((pearlId) => {
    let value = overrideByPearlId.get(pearlId)?.value ?? pearlValueOfInstance(state, pearlId);
    const diamondUse = diamondUseByPearlId.get(pearlId);
    if (!diamondUse) {
      return value;
    }
    if (diamondUse.modifier === 1 && value >= 8) {
      throw new Error("A pearl card value cannot be increased above 8.");
    }
    if (diamondUse.modifier === -1 && value <= 1) {
      throw new Error("A pearl card value cannot be lowered below 1.");
    }
    value = (value + diamondUse.modifier) as PearlValue;
    return value;
  });

  const virtualSourceIds = virtualPearls.map((virtualPearl) => virtualPearl.sourceCharacterId);
  if (new Set(virtualSourceIds).size !== virtualSourceIds.length) {
    throw new Error("Only one virtual pearl can be used from each source character.");
  }
  for (const virtualPearl of virtualPearls) {
    validateVirtualPearlUse(state, player, virtualPearl);
    pearlValues.push(virtualPearl.value);
  }

  return { pearlValues, diamondIds: [...diamondIds, ...spentDiamondIds] };
}

function chooseReclaimedPearls(
  state: GameState,
  pearlIds: CardInstanceId[],
  count: number,
): CardInstanceId[] {
  return [...pearlIds]
    .sort((left, right) => {
      const rightValue = pearlValueOfInstance(state, right);
      const leftValue = pearlValueOfInstance(state, left);
      return rightValue - leftValue || left.localeCompare(right);
    })
    .slice(0, count);
}

function hasActiveDefinition(
  player: PlayerState,
  state: GameState,
  definitionIds: Set<CardDefinitionId>,
): boolean {
  return player.activatedCharacters.some((cardId) => {
    const definitionId = getDefinitionId(state, cardId);
    return Boolean(definitionId && definitionIds.has(definitionId));
  });
}

function validateVirtualPearlUse(
  state: GameState,
  player: PlayerState,
  virtualPearl: VirtualPearlUse,
): void {
  if (!player.activatedCharacters.includes(virtualPearl.sourceCharacterId)) {
    throw new Error(`Virtual pearl source is not activated: ${virtualPearl.sourceCharacterId}`);
  }
  const sourceDefinitionId = getDefinitionId(state, virtualPearl.sourceCharacterId);
  const allowedValue =
    sourceDefinitionId ? VIRTUAL_PEARL_VALUE_BY_DEFINITION[sourceDefinitionId] : undefined;
  if (!allowedValue) {
    throw new Error(`Invalid virtual pearl source: ${virtualPearl.sourceCharacterId}`);
  }
  if (allowedValue !== "any" && allowedValue !== virtualPearl.value) {
    throw new Error(`Invalid virtual pearl value: ${virtualPearl.value}`);
  }
}

function applyOnActivateEffects(
  state: GameState,
  actorId: PlayerId,
  definitionId: CardDefinitionId,
): { state: GameState; events: GameEvent[] } {
  let nextState = state;
  const events: GameEvent[] = [];

  if (TURN_ACTION_BONUS_IDS.has(definitionId)) {
    nextState = grantImmediateActions(nextState, actorId, 1, events);
  }
  if (IMMEDIATE_EXTRA_ACTION_IDS.has(definitionId)) {
    nextState = grantImmediateActions(nextState, actorId, 3, events);
  }
  if (NEXT_PLAYER_ACTION_BONUS_IDS.has(definitionId)) {
    const nextPlayer = getNextPlayer(nextState, actorId);
    nextState = {
      ...nextState,
      turn: {
        ...nextState.turn,
        actionBonuses: {
          ...nextState.turn.actionBonuses,
          [nextPlayer.id]: (nextState.turn.actionBonuses[nextPlayer.id] ?? 0) + 1,
        },
      },
    };
    events.push({ type: "actionBonusGranted", playerId: nextPlayer.id, amount: 1 });
  }
  if (STEAL_HAND_IDS.has(definitionId)) {
    const stolen = chooseOpponentPearlToSteal(nextState, actorId);
    if (stolen) {
      nextState = {
        ...nextState,
        cardsById: setCardOwnerInMap(nextState.cardsById, [stolen.cardId], actorId),
        players: nextState.players.map((player) => {
          if (player.id === stolen.ownerId) {
            return {
              ...player,
              pearlHand: player.pearlHand.filter((cardId) => cardId !== stolen.cardId),
            };
          }
          if (player.id === actorId) {
            return { ...player, pearlHand: [...player.pearlHand, stolen.cardId] };
          }
          return player;
        }),
      };
      events.push({
        type: "cardMoved",
        cardId: stolen.cardId,
        from: "pearlHand",
        to: "pearlHand",
        owner: actorId,
      });
    }
  }
  if (DISCARD_OPPONENT_GATE_IDS.has(definitionId)) {
    const target = chooseOpponentGateCharacterToDiscard(nextState, actorId);
    if (target) {
      nextState = {
        ...nextState,
        cardsById: setCardOwnerInMap(nextState.cardsById, [target.cardId], null),
        players: nextState.players.map((player) =>
          player.id === target.ownerId
            ? {
                ...player,
                gateCharacters: player.gateCharacters.filter((cardId) => cardId !== target.cardId),
              }
            : player,
        ),
        characterDeck: {
          ...nextState.characterDeck,
          discardPile: [...nextState.characterDeck.discardPile, target.cardId],
        },
      };
      events.push(
        {
          type: "cardMoved",
          cardId: target.cardId,
          from: "gateCharacters",
          to: "characterDiscard",
          owner: null,
        },
        { type: "characterDiscarded", playerId: target.ownerId, cardId: target.cardId },
      );
    }
  }
  return { state: nextState, events };
}

function grantImmediateActions(
  state: GameState,
  playerId: PlayerId,
  amount: number,
  events: GameEvent[],
): GameState {
  events.push({ type: "actionBonusGranted", playerId, amount });
  return {
    ...state,
    turn: {
      ...state.turn,
      actionsRemaining: state.turn.actionsRemaining + amount,
    },
  };
}

function getNextPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const index = state.players.findIndex((player) => player.id === playerId);
  if (index < 0) {
    throw new Error(`Missing player: ${playerId}`);
  }
  return state.players[(index + 1) % state.players.length];
}

function chooseOpponentPearlToSteal(
  state: GameState,
  actorId: PlayerId,
): { ownerId: PlayerId; cardId: CardInstanceId } | null {
  const candidates = state.players
    .filter((player) => player.id !== actorId)
    .flatMap((player) =>
      player.pearlHand.map((cardId) => ({
        ownerId: player.id,
        cardId,
        value: pearlValueOfInstance(state, cardId),
      })),
    )
    .sort((left, right) => right.value - left.value || left.cardId.localeCompare(right.cardId));
  return candidates[0] ?? null;
}

function chooseOpponentGateCharacterToDiscard(
  state: GameState,
  actorId: PlayerId,
): { ownerId: PlayerId; cardId: CardInstanceId } | null {
  const candidates = state.players
    .filter((player) => player.id !== actorId)
    .flatMap((player) =>
      player.gateCharacters.map((cardId) => ({
        ownerId: player.id,
        cardId,
        power: getCharacterPower(state, cardId),
      })),
    )
    .sort((left, right) => right.power - left.power || left.cardId.localeCompare(right.cardId));
  return candidates[0] ?? null;
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
  const drawn: CardInstanceId[] = [];
  for (let index = 0; index < count; index += 1) {
    if (zone.drawPile.length === 0) break;
    const [head, ...rest] = zone.drawPile;
    drawn.push(head);
    zone = { drawPile: rest, discardPile: zone.discardPile };
  }
  return { drawn, characterDeck: zone, rngState: state.rngState, cardsById: state.cardsById };
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
  payment?: PaymentPlan,
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
      return customRequirementSatisfies(values, requirement.label, payment);
  }
}

function customRequirementSatisfies(
  values: PearlValue[],
  label: string,
  payment?: PaymentPlan,
): boolean {
  const trimmed = label.trim();
  if (/^[1-8]+$/.test(trimmed)) {
    return exactValuesMatch(
      values,
      trimmed.split("").map((digit) => Number(digit) as PearlValue),
    );
  }
  switch (trimmed) {
    case "합하면 '10'이 되는 카드들":
      return sumMatches(values, 10);
    case "합이 10이 되는 카드 3장":
      return values.length === 3 && sumMatches(values, 10);
    case "합하면 20이 되는 카드 3장":
      return values.length === 3 && sumMatches(values, 20);
    case "합하면 7이 되는 카드 3장":
      return values.length === 3 && sumMatches(values, 7);
    case "연속되는 카드 3장":
      return sequenceMatches(values, 3);
    case "연속되는 카드 5장":
      return sequenceMatches(values, 5);
    case "같은 카드 2장":
      return sameValueMatches(values, 2);
    case "같은 카드 3장":
      return sameValueMatches(values, 3);
    case "같은 카드 4장":
      return sameValueMatches(values, 4);
    case "홀수인 카드 3장":
      return values.length === 3 && values.every((value) => value % 2 === 1);
    case "짝수인 카드 3장":
      return values.length === 3 && values.every((value) => value % 2 === 0);
    case "333/666":
      return exactValuesMatch(values, [3, 3, 3]) || exactValuesMatch(values, [6, 6, 6]);
    case "444/555":
      return exactValuesMatch(values, [4, 4, 4]) || exactValuesMatch(values, [5, 5, 5]);
    case "222+다이아몬드 1장":
      return exactValuesMatch(values, [2, 2, 2]) && (payment?.spentDiamondIds?.length ?? 0) >= 1;
    case "같은 카드 2장 + 66":
    case "같은 카드 2장 + 6카드 2장":
      return samePairPlusSixesMatches(values);
    case "같은 카드 2장씩 두 벌":
      return twoPairsMatches(values);
    default:
      return false;
  }
}

function exactValuesMatch(values: PearlValue[], expected: PearlValue[]): boolean {
  if (values.length !== expected.length) return false;
  const want = [...expected].sort();
  const got = [...values].sort();
  return want.every((value, index) => value === got[index]);
}

function sumMatches(values: PearlValue[], total: number): boolean {
  return values.reduce((sum, value) => sum + value, 0) === total;
}

function sequenceMatches(values: PearlValue[], count: number): boolean {
  if (values.length !== count) return false;
  const sorted = [...new Set(values)].sort((left, right) => left - right);
  if (sorted.length !== values.length) return false;
  return sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
}

function sameValueMatches(values: PearlValue[], count: number): boolean {
  return values.length === count && values.every((value) => value === values[0]);
}

function samePairPlusSixesMatches(values: PearlValue[]): boolean {
  if (values.length !== 4) return false;
  const counts = countValues(values);
  const sixCount = counts.get(6) ?? 0;
  if (sixCount < 2) return false;
  return [...counts.entries()].some(([value, count]) => count >= 2 && (value !== 6 || sixCount >= 4));
}

function twoPairsMatches(values: PearlValue[]): boolean {
  if (values.length !== 4) return false;
  return [...countValues(values).values()].filter((count) => count >= 2).length >= 2;
}

function countValues(values: PearlValue[]): Map<PearlValue, number> {
  const counts = new Map<PearlValue, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function useAbility(state: GameState, action: Extract<GameAction, { type: "useAbility" }>) {
  if (state.turn.activePlayerId !== action.actorId) {
    throw new Error(`Not active player: ${action.actorId}`);
  }
  if (state.turn.phase !== "action") {
    throw new Error(`Cannot use ability during phase: ${state.turn.phase}`);
  }
  if (state.turn.usedAbilityIds.includes(action.abilityId)) {
    throw new Error(`Ability already used this turn: ${action.abilityId}`);
  }

  const player = getPlayer(state, action.actorId);
  const sourceCardId = resolveAbilitySource(state, player, action);
  const definitionId = getDefinitionId(state, sourceCardId);
  if (!definitionId) {
    throw new Error(`Unknown ability source: ${sourceCardId}`);
  }

  if (DISCARD_REDRAW_HAND_IDS.has(definitionId)) {
    return useDiscardRedrawAbility(state, action, player, sourceCardId);
  }
  if (PEEK_CHARACTER_DECK_IDS.has(definitionId)) {
    return usePeekCharacterDeckAbility(state, action, sourceCardId);
  }
  if (SWAP_GATE_MARKET_IDS.has(definitionId)) {
    return useSwapGateMarketAbility(state, action, player, sourceCardId);
  }
  if (DRAW_DIAMOND_BY_TWO_IDS.has(definitionId)) {
    return useDrawDiamondByTwoAbility(state, action, player, sourceCardId);
  }

  throw new Error(`Unsupported ability: ${action.abilityId}`);
}

function resolveAbilitySource(
  state: GameState,
  player: PlayerState,
  action: Extract<GameAction, { type: "useAbility" }>,
): CardInstanceId {
  const chosenSource = action.choices.sourceCardId;
  const sourceCardId =
    typeof chosenSource === "string"
      ? chosenSource
      : player.activatedCharacters.find((cardId) => {
          const definitionId = getDefinitionId(state, cardId);
          const definition = definitionId ? fixtureCatalog.characterCards[definitionId] : null;
          return Boolean(definition?.abilities.some((ability) => ability.id === action.abilityId));
        });

  if (!sourceCardId || !player.activatedCharacters.includes(sourceCardId)) {
    throw new Error(`Ability source is not activated: ${String(sourceCardId)}`);
  }
  const definitionId = getDefinitionId(state, sourceCardId);
  const definition = definitionId ? fixtureCatalog.characterCards[definitionId] : null;
  if (!definition?.abilities.some((ability) => ability.id === action.abilityId)) {
    throw new Error(`Ability does not belong to source: ${action.abilityId}`);
  }
  return sourceCardId;
}

function markAbilityUsed(state: GameState, abilityId: string): GameState["turn"] {
  return {
    ...state.turn,
    usedAbilityIds: [...state.turn.usedAbilityIds, abilityId],
  };
}

function abilityUsedEvent(
  action: Extract<GameAction, { type: "useAbility" }>,
  sourceCardId: CardInstanceId,
): GameEvent {
  return {
    type: "abilityUsed",
    playerId: action.actorId,
    abilityId: action.abilityId,
    sourceCardId,
  };
}

function useDiscardRedrawAbility(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
  player: PlayerState,
  sourceCardId: CardInstanceId,
) {
  if (state.turn.actionsRemaining !== 0) {
    throw new Error("This ability can only be used after all actions are spent.");
  }
  if (player.pearlHand.length === 0) {
    throw new Error("No pearls available to redraw.");
  }

  const discarded = [...player.pearlHand];
  const intermediateZone: DeckZone = {
    drawPile: state.pearlDeck.drawPile,
    discardPile: [...state.pearlDeck.discardPile, ...discarded],
  };
  const reshuffled = ensureDrawable(intermediateZone, state.rngState, discarded.length);
  const drawn = drawMany(reshuffled.zone.drawPile, discarded.length);
  const cardsAfterDiscard = setCardOwnerInMap(state.cardsById, discarded, null);
  const cardsById = setCardOwnerInMap(cardsAfterDiscard, drawn.drawn, action.actorId);

  return result(
    {
      ...state,
      cardsById,
      players: updatePlayer(state, action.actorId, (candidate) => ({
        ...candidate,
        pearlHand: drawn.drawn,
      })),
      pearlDeck: {
        drawPile: drawn.drawPile,
        discardPile: reshuffled.zone.discardPile,
      },
      rngState: reshuffled.rngState,
      turn: markAbilityUsed(state, action.abilityId),
    },
    [
      abilityUsedEvent(action, sourceCardId),
      { type: "pearlsDiscarded", playerId: action.actorId, cardIds: discarded },
      ...drawn.drawn.map((cardId) => ({
        type: "cardMoved" as const,
        cardId,
        from: "pearlDeck",
        to: "pearlHand",
        owner: action.actorId,
      })),
    ],
  );
}

function usePeekCharacterDeckAbility(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
  sourceCardId: CardInstanceId,
) {
  if (state.turn.actionsRemaining !== getTurnActionCount(state, action.actorId)) {
    throw new Error("This ability can only be used before the first action.");
  }
  return result(
    {
      ...state,
      turn: markAbilityUsed(state, action.abilityId),
    },
    [abilityUsedEvent(action, sourceCardId)],
  );
}

function useSwapGateMarketAbility(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
  player: PlayerState,
  sourceCardId: CardInstanceId,
) {
  if (state.turn.actionsRemaining !== getTurnActionCount(state, action.actorId)) {
    throw new Error("This ability can only be used before the first action.");
  }
  const gateCharacterId = resolveGateSwapCharacter(state, player, action);
  const marketIndex = resolveMarketSwapIndex(state, action);
  const marketCharacterId = state.market.characterMarket[marketIndex];
  if (!gateCharacterId || !marketCharacterId) {
    throw new Error("No valid cards to swap.");
  }

  const characterMarket = [...state.market.characterMarket];
  characterMarket[marketIndex] = gateCharacterId;

  return result(
    {
      ...state,
      cardsById: setCardOwnerInMap(
        setCardOwnerInMap(state.cardsById, [gateCharacterId], null),
        [marketCharacterId],
        action.actorId,
      ),
      players: updatePlayer(state, action.actorId, (candidate) => ({
        ...candidate,
        gateCharacters: candidate.gateCharacters.map((cardId) =>
          cardId === gateCharacterId ? marketCharacterId : cardId,
        ),
      })),
      market: {
        ...state.market,
        characterMarket,
      },
      turn: markAbilityUsed(state, action.abilityId),
    },
    [
      abilityUsedEvent(action, sourceCardId),
      {
        type: "cardMoved",
        cardId: gateCharacterId,
        from: "gateCharacters",
        to: "characterMarket",
        owner: null,
      },
      {
        type: "cardMoved",
        cardId: marketCharacterId,
        from: "characterMarket",
        to: "gateCharacters",
        owner: action.actorId,
      },
    ],
  );
}

function resolveGateSwapCharacter(
  state: GameState,
  player: PlayerState,
  action: Extract<GameAction, { type: "useAbility" }>,
): CardInstanceId | null {
  const chosen = action.choices.gateCharacterId;
  if (typeof chosen === "string" && player.gateCharacters.includes(chosen)) {
    return chosen;
  }
  return [...player.gateCharacters].sort(
    (left, right) => characterUtility(state, left) - characterUtility(state, right),
  )[0] ?? null;
}

function resolveMarketSwapIndex(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
): number {
  const chosen = action.choices.marketIndex;
  if (
    typeof chosen === "number" &&
    Number.isInteger(chosen) &&
    state.market.characterMarket[chosen]
  ) {
    return chosen;
  }
  const best = state.market.characterMarket
    .map((cardId, marketIndex) => ({ cardId, marketIndex, score: characterUtility(state, cardId) }))
    .sort((left, right) => right.score - left.score)[0];
  return best?.marketIndex ?? -1;
}

function characterUtility(state: GameState, cardId: CardInstanceId): number {
  const definitionId = getDefinitionId(state, cardId);
  const definition = definitionId ? fixtureCatalog.characterCards[definitionId] : null;
  const power = typeof definition?.power === "number" ? definition.power : 0;
  const diamond = typeof definition?.diamondReward === "number" ? definition.diamondReward : 0;
  return power * 10 + diamond * 3;
}

function useDrawDiamondByTwoAbility(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
  player: PlayerState,
  sourceCardId: CardInstanceId,
) {
  const chosenPearl = action.choices.pearlId;
  const pearlId =
    typeof chosenPearl === "string" &&
    player.pearlHand.includes(chosenPearl) &&
    pearlValueOfInstance(state, chosenPearl) === 2
      ? chosenPearl
      : player.pearlHand.find((cardId) => pearlValueOfInstance(state, cardId) === 2);
  if (!pearlId) {
    throw new Error("No pearl 2 available to discard.");
  }

  const diamondDraw = drawDiamondCards(state, 1);
  if (diamondDraw.drawn.length === 0) {
    throw new Error("No character cards available as diamonds.");
  }
  const diamondId = diamondDraw.drawn[0];

  return result(
    {
      ...state,
      cardsById: setCardOwnerInMap(
        setCardOwnerInMap(state.cardsById, [pearlId], null),
        [diamondId],
        action.actorId,
      ),
      players: updatePlayer(state, action.actorId, (candidate) => ({
        ...candidate,
        pearlHand: candidate.pearlHand.filter((cardId) => cardId !== pearlId),
        diamonds: [...candidate.diamonds, diamondId],
      })),
      pearlDeck: {
        ...state.pearlDeck,
        discardPile: [...state.pearlDeck.discardPile, pearlId],
      },
      characterDeck: diamondDraw.characterDeck,
      rngState: diamondDraw.rngState,
      turn: markAbilityUsed(state, action.abilityId),
    },
    [
      abilityUsedEvent(action, sourceCardId),
      { type: "pearlsDiscarded", playerId: action.actorId, cardIds: [pearlId] },
      {
        type: "cardMoved",
        cardId: diamondId,
        from: "characterDeck",
        to: "diamonds",
        owner: action.actorId,
      },
    ],
  );
}


function endTurn(state: GameState, action: Extract<GameAction, { type: "endTurn" }>) {
  if (state.turn.activePlayerId !== action.actorId) {
    throw new Error(`Not active player: ${action.actorId}`);
  }
  if (state.turn.actionsRemaining !== 0) {
    throw new Error("A turn cannot end until all actions are spent.");
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
  const actionBonuses = { ...state.turn.actionBonuses };
  delete actionBonuses[action.actorId];
  const stateForNextTurn = {
    ...state,
    turn: {
      ...state.turn,
      actionBonuses,
    },
  };
  const actionsRemaining = getTurnActionCount(stateForNextTurn, nextPlayer.id);

  const nextState: GameState = {
    ...state,
    turn: {
      ...state.turn,
      roundNumber,
      activePlayerId: nextPlayer.id,
      actionsRemaining,
      phase: "action",
      actionBonuses,
      usedAbilityIds: [],
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
      outcome = useAbility(state, action);
      break;
  }

  let nextState = applyEndGameTransitions(outcome.state, action, catalog);
  nextState = applyEndGameOnTurnStart(nextState, previousRound);
  return { ...outcome, state: nextState };
}
