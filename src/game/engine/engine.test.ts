import { describe, expect, it } from "vitest";
import { fixtureCatalog } from "../content/catalog";
import { chooseAiAction, choosePearlsToDiscardToLimit } from "../solo/chooseAiAction";
import {
  getFixtureCharacterDeckDefinitionIds,
  getFixtureCharacterDefinitionIds,
} from "../content/characters.fixture";
import { reduceGame } from "./reducer";
import { defaultSetupOptions, STARTING_PEARL_HAND_SIZE } from "./state";
import {
  canPayRequirement,
  findPaymentForCharacter,
  getActivePlayer,
  getHandLimit,
  getLegalActions,
  getPaymentPlans,
  getPlayer,
  getPlayerPower,
  getUsableAbilityActions,
} from "./selectors";
import type {
  CardDefinitionId,
  CardInstanceId,
  GameSetupOptions,
  GameState,
  PlayerState,
} from "./types";

function start(options: Partial<GameSetupOptions> = {}): GameState {
  return reduceGame(undefined, {
    type: "startGame",
    options: {
      ...defaultSetupOptions,
      seed: "test-seed",
      startPlayer: { type: "fixedSeat", seatIndex: 0 },
      ...options,
    },
  }).state;
}

describe("engine setup", () => {
  it("creates 2 to 5 player games with one human and AI seats", () => {
    for (const totalPlayers of [2, 3, 4, 5] as const) {
      const state = start({ totalPlayers });
      expect(state.players).toHaveLength(totalPlayers);
      expect(state.players.filter((player) => player.controller.type === "human")).toHaveLength(1);
      expect(state.players.filter((player) => player.controller.type === "ai")).toHaveLength(
        totalPlayers - 1,
      );
    }
  });

  it("sets up deterministic markets from the same seed", () => {
    const left = start({ seed: "same-seed" });
    const right = start({ seed: "same-seed" });

    expect(left.market.pearlMarket).toEqual(right.market.pearlMarket);
    expect(left.market.characterMarket).toEqual(right.market.characterMarket);
    expect(left.pearlDeck.drawPile).toEqual(right.pearlDeck.drawPile);
    expect(left.characterDeck.drawPile).toEqual(right.characterDeck.drawPile);
  });

  it("creates a 4-card pearl market and 2-card character market", () => {
    const state = start();

    expect(state.market.pearlMarket).toHaveLength(4);
    expect(state.market.characterMarket).toHaveLength(2);
    expect(state.turn.actionsRemaining).toBe(3);
  });

  it("deals 5 starting pearl cards to every player", () => {
    const state = start({ totalPlayers: 4 });

    for (const player of state.players) {
      expect(player.pearlHand).toHaveLength(STARTING_PEARL_HAND_SIZE);
      for (const cardId of player.pearlHand) {
        expect(state.cardsById[cardId].owner).toBe(player.id);
      }
    }
  });

  it("creates 8 pearl cards for each value with refresh variants included", () => {
    const state = start();
    const counts = new Map<number, number>();
    const refreshDefinitionIds = new Set<CardDefinitionId>();

    for (const card of Object.values(state.cardsById)) {
      const pearl = fixtureCatalog.pearlCards[card.definitionId];
      if (!pearl) continue;
      counts.set(pearl.value, (counts.get(pearl.value) ?? 0) + 1);
      if (pearl.hasRefreshIcon === true) {
        refreshDefinitionIds.add(card.definitionId);
      }
    }

    expect([...counts.entries()].sort()).toEqual([
      [1, 8],
      [2, 8],
      [3, 8],
      [4, 8],
      [5, 8],
      [6, 8],
      [7, 8],
      [8, 8],
    ]);
    expect([...refreshDefinitionIds].sort()).toEqual([
      "pearl-3-refresh",
      "pearl-4-refresh",
      "pearl-5-refresh",
    ]);
  });

  it("uses one physical character instance per deck entry", () => {
    const state = start();
    const characterInstances = Object.values(state.cardsById).filter(
      (card) => fixtureCatalog.characterCards[card.definitionId],
    );

    expect(getFixtureCharacterDeckDefinitionIds()).toEqual(getFixtureCharacterDefinitionIds());
    expect(characterInstances).toHaveLength(getFixtureCharacterDeckDefinitionIds().length);
  });
});

describe("basic actions", () => {
  it("lets the active player gain a pearl from the market and refills it", () => {
    const state = start();
    const active = getActivePlayer(state);
    const takenCard = state.market.pearlMarket[0];

    const next = reduceGame(state, {
      type: "gainPearlFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;

    expect(getPlayer(next, active.id).pearlHand).toContain(takenCard);
    expect(next.market.pearlMarket).toHaveLength(4);
    expect(next.turn.actionsRemaining).toBe(2);
  });

  it("refreshes open characters when a refresh pearl enters the open pearl market", () => {
    let state = start({ seed: "refresh-pearl" });
    const active = getActivePlayer(state);
    const takenPearlId = state.market.pearlMarket[0];
    const refreshPearlId = cardIdForDefinition(state, "pearl-3-refresh", [takenPearlId]);
    const oldCharacterMarket = [...state.market.characterMarket];
    const newCharacterMarket = state.characterDeck.drawPile.slice(0, 2);

    state = {
      ...state,
      cardsById: {
        ...state.cardsById,
        [refreshPearlId]: { ...state.cardsById[refreshPearlId], owner: null },
      },
      players: state.players.map((player) => ({
        ...player,
        pearlHand: player.pearlHand.filter((cardId) => cardId !== refreshPearlId),
      })),
      market: {
        pearlMarket: [
          takenPearlId,
          ...state.market.pearlMarket
            .filter((cardId) => cardId !== takenPearlId && cardId !== refreshPearlId)
            .slice(0, 3),
        ],
        characterMarket: oldCharacterMarket,
      },
      pearlDeck: {
        ...state.pearlDeck,
        drawPile: [
          refreshPearlId,
          ...state.pearlDeck.drawPile.filter((cardId) => cardId !== refreshPearlId),
        ],
      },
    };

    const result = reduceGame(state, {
      type: "gainPearlFromMarket",
      actorId: active.id,
      marketIndex: 0,
    });

    expect(result.state.market.pearlMarket[0]).toBe(refreshPearlId);
    expect(result.state.market.characterMarket).toEqual(newCharacterMarket);
    expect(result.state.characterDeck.discardPile).toEqual(
      expect.arrayContaining(oldCharacterMarket),
    );
    for (const oldCharacterId of oldCharacterMarket) {
      expect(result.state.cardsById[oldCharacterId].owner).toBeNull();
      expect(result.state.characterDeck.drawPile).not.toContain(oldCharacterId);
    }
    expect(result.events).toContainEqual({
      type: "marketRefreshed",
      market: "character",
      discarded: oldCharacterMarket,
    });
  });

  it("rejects actions by inactive players", () => {
    const state = start({ totalPlayers: 3 });
    expect(() =>
      reduceGame(state, {
        type: "gainPearlFromDeck",
        actorId: "player-2",
      }),
    ).toThrow(/Not active player/);
  });

  it("places a character from the market onto the gate", () => {
    const state = start();
    const active = getActivePlayer(state);
    const characterId = state.market.characterMarket[0];

    const next = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;

    expect(getPlayer(next, active.id).gateCharacters).toContain(characterId);
    expect(next.market.characterMarket).toHaveLength(2);
    expect(next.turn.actionsRemaining).toBe(2);
  });

  it("keeps 2 open character cards after repeated market placements", () => {
    let state = start();
    const active = getActivePlayer(state);

    for (let index = 0; index < 3; index += 1) {
      const player = getPlayer(state, active.id);
      const discardGateCharacterId =
        player.gateCharacters.length >= 2 ? player.gateCharacters[0] : undefined;

      state = reduceGame(state, {
        type: "placeCharacterFromMarket",
        actorId: active.id,
        marketIndex: 0,
        discardGateCharacterId,
      }).state;

      expect(state.market.characterMarket).toHaveLength(2);
    }
  });

  it("discards and clears owner for replaced gate characters", () => {
    let state = start();
    const active = getActivePlayer(state);

    state = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;
    state = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;

    const discardedCardId = getPlayer(state, active.id).gateCharacters[0];
    const result = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
      discardGateCharacterId: discardedCardId,
    });

    expect(result.events).toContainEqual({
      type: "characterDiscarded",
      playerId: active.id,
      cardId: discardedCardId,
    });
    expect(result.state.cardsById[discardedCardId].owner).toBeNull();
    expect(result.state.characterDeck.discardPile).toContain(discardedCardId);
    expect(getPlayer(result.state, active.id).gateCharacters).not.toContain(discardedCardId);
    expect(getPlayer(result.state, active.id).gateCharacters).toHaveLength(2);
  });

  it("requires discarding over the 5-card limit before ending the turn", () => {
    let state = start({ totalPlayers: 3 });
    const active = getActivePlayer(state);

    for (let index = 0; index < 3; index += 1) {
      state = reduceGame(state, { type: "gainPearlFromDeck", actorId: active.id }).state;
    }

    expect(state.turn.actionsRemaining).toBe(0);
    expect(getPlayer(state, active.id).pearlHand.length).toBeGreaterThan(5);

    expect(() => reduceGame(state, { type: "endTurn", actorId: active.id })).toThrow(
      /Discard to hand limit/,
    );

    const excess = getPlayer(state, active.id).pearlHand.length - 5;
    state = reduceGame(state, {
      type: "discardPearlsToLimit",
      actorId: active.id,
      pearlIds: getPlayer(state, active.id).pearlHand.slice(0, excess),
    }).state;
    state = reduceGame(state, { type: "endTurn", actorId: active.id }).state;

    expect(state.turn.activePlayerId).toBe("player-2");
    expect(state.turn.actionsRemaining).toBe(3);
  });

  it("exposes legal actions for the active player", () => {
    const state = start();
    const active = getActivePlayer(state);
    const legalActions = getLegalActions(state, active.id);

    expect(legalActions.some((action) => action.type === "gainPearlFromMarket")).toBe(true);
    expect(legalActions.some((action) => action.type === "placeCharacterFromMarket")).toBe(true);
  });

  it("exposes payable gate character activations as legal actions", () => {
    const setup = findPayableGateSetup();
    if (!setup) {
      throw new Error("Could not build payable gate character scenario.");
    }

    const legalActions = getLegalActions(setup.state, setup.actorId);
    const activation = legalActions.find(
      (action) =>
        action.type === "activateGateCharacter" &&
        action.characterInstanceId === setup.characterId,
    );

    expect(activation).toBeDefined();
    expect(canPayRequirement(setup.state, setup.actorId, setup.characterId)).toBe(true);
    expect(getPaymentPlans(setup.state, setup.actorId, setup.characterId)).toContainEqual({
      pearlIds: setup.pearlIds,
      diamondUses: [],
    });
  });

  it("uses base-rule diamonds to increase pearl values by 1 during activation", () => {
    const setup = makeDiamondPaymentSetup();
    const payment = getPaymentPlans(setup.state, setup.actorId, setup.characterId)[0];

    expect([...payment.pearlIds].sort()).toEqual(
      [setup.exactPearlId, setup.boostedPearlId].sort(),
    );
    expect(payment.diamondUses).toEqual([
      {
        diamondId: setup.diamondId,
        pearlId: expect.any(String),
        modifier: 1,
        source: "baseRule",
      },
    ]);
    expect(payment.pearlIds).toContain(payment.diamondUses[0].pearlId);

    const next = reduceGame(setup.state, {
      type: "activateGateCharacter",
      actorId: setup.actorId,
      characterInstanceId: setup.characterId,
      payment,
    }).state;
    const player = getPlayer(next, setup.actorId);

    expect(player.activatedCharacters).toContain(setup.characterId);
    expect(player.pearlHand).not.toContain(setup.exactPearlId);
    expect(player.pearlHand).not.toContain(setup.boostedPearlId);
    expect(player.diamonds).not.toContain(setup.diamondId);
    expect(next.pearlDeck.discardPile).toEqual(
      expect.arrayContaining([setup.exactPearlId, setup.boostedPearlId]),
    );
    expect(next.characterDeck.discardPile).toContain(setup.diamondId);
    expect(next.cardsById[setup.diamondId].owner).toBeNull();
  });

  it("uses activated virtual pearl effects as reusable payment values", () => {
    let state = start({ seed: "virtual-pearl" });
    const active = getActivePlayer(state);
    const virtualSourceId = cardIdForDefinition(state, "character-304-12-p0-d0", []);
    const characterId = cardIdForDefinition(state, "character-501-88-p2-d0", [virtualSourceId]);
    const pearl8Id = cardIdForDefinition(state, "pearl-8", []);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl8Id],
      gateCharacters: [characterId],
      activatedCharacters: [virtualSourceId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    expect(payment.virtualPearls).toEqual([{ sourceCharacterId: virtualSourceId, value: 8 }]);

    const next = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment,
    }).state;

    expect(getPlayer(next, active.id).activatedCharacters).toEqual(
      expect.arrayContaining([virtualSourceId, characterId]),
    );
    expect(getPlayer(next, active.id).pearlHand).not.toContain(pearl8Id);
  });

  it("does not expose newly activated passive virtual pearls until the next turn", () => {
    let state = start({ seed: "passive-virtual-next-turn" });
    const active = getActivePlayer(state);
    const virtualSourceId = cardIdForDefinition(state, "character-607-22-p1-d0", []);
    const characterId = cardIdForDefinition(state, "character-806-2-p0-d1", [virtualSourceId]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [],
      gateCharacters: [characterId],
      activatedCharacters: [virtualSourceId],
    });
    const readyPayment = getPaymentPlans(state, active.id, characterId)[0];

    const sameTurnState = {
      ...state,
      turn: { ...state.turn, activatedThisTurn: [virtualSourceId] },
    };

    expect(getPaymentPlans(sameTurnState, active.id, characterId)).toHaveLength(0);
    expect(() =>
      reduceGame(sameTurnState, {
        type: "activateGateCharacter",
        actorId: active.id,
        characterInstanceId: characterId,
        payment: readyPayment,
      }),
    ).toThrow(/not ready/);
    expect(readyPayment.virtualPearls).toEqual([{ sourceCharacterId: virtualSourceId, value: 2 }]);
  });

  it("does not allow newly activated use abilities until the next turn", () => {
    let state = start({ seed: "passive-ability-next-turn" });
    const active = getActivePlayer(state);
    const sourceId = cardIdForDefinition(state, "character-806-2-p0-d1", []);
    const pearl2Id = cardIdForDefinition(state, "pearl-2", []);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl2Id],
      gateCharacters: [],
      activatedCharacters: [sourceId],
    });
    const sameTurnState = {
      ...state,
      turn: { ...state.turn, activatedThisTurn: [sourceId] },
    };

    expect(getUsableAbilityActions(sameTurnState, active.id)).toEqual([]);
    expect(() =>
      reduceGame(sameTurnState, {
        type: "useAbility",
        actorId: active.id,
        abilityId: "character-806-2-p0-d1-effect",
        choices: { sourceCardId: sourceId, pearlId: pearl2Id },
      }),
    ).toThrow(/next turn/);
    expect(getUsableAbilityActions(state, active.id)).toContainEqual({
      type: "useAbility",
      actorId: active.id,
      abilityId: "character-806-2-p0-d1-effect",
      choices: { sourceCardId: sourceId },
    });
  });

  it("uses the 1111 engine card as any pearl value in activation combinations", () => {
    let state = start({ seed: "virtual-any-pearl" });
    const active = getActivePlayer(state);
    const virtualSourceId = cardIdForDefinition(state, "character-603-1111-p0-d0", []);
    const characterId = cardIdForDefinition(state, "character-307-7777-p4-d0", [virtualSourceId]);
    const pearl7a = cardIdForDefinition(state, "pearl-7", []);
    const pearl7b = cardIdForDefinition(state, "pearl-7", [pearl7a]);
    const pearl7c = cardIdForDefinition(state, "pearl-7", [pearl7a, pearl7b]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl7a, pearl7b, pearl7c],
      gateCharacters: [characterId],
      activatedCharacters: [virtualSourceId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    expect(payment.virtualPearls).toEqual([{ sourceCharacterId: virtualSourceId, value: 7 }]);
    expect(payment.pearlIds).toHaveLength(3);

    const next = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment,
    }).state;

    expect(getPlayer(next, active.id).activatedCharacters).toEqual(
      expect.arrayContaining([virtualSourceId, characterId]),
    );
  });

  it("prefers activated virtual pearls over spending matching hand pearls", () => {
    let state = start({ seed: "virtual-pearl-preference" });
    const active = getActivePlayer(state);
    const virtualSourceId = cardIdForDefinition(state, "character-603-1111-p0-d0", []);
    const characterId = cardIdForDefinition(state, "character-607-22-p1-d0", [virtualSourceId]);
    const pearl2a = cardIdForDefinition(state, "pearl-2", []);
    const pearl2b = cardIdForDefinition(state, "pearl-2", [pearl2a]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl2a, pearl2b],
      gateCharacters: [characterId],
      activatedCharacters: [virtualSourceId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    expect(payment.virtualPearls).toEqual([{ sourceCharacterId: virtualSourceId, value: 2 }]);
    expect(payment.pearlIds).toHaveLength(1);
  });

  it("uses the candidate diamond effect to lower pearl values by 1", () => {
    let state = start({ seed: "down-diamond" });
    const active = getActivePlayer(state);
    const sourceId = cardIdForDefinition(state, "character-401-357-p1-d1", []);
    const characterId = cardIdForDefinition(state, "character-805-77-p1-d0", [sourceId]);
    const pearl7Id = cardIdForDefinition(state, "pearl-7", []);
    const pearl8Id = cardIdForDefinition(state, "pearl-8", []);
    const diamondId = cardIdForDefinition(state, "character-302-18-p1-d0", [sourceId, characterId]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl7Id, pearl8Id],
      gateCharacters: [characterId],
      activatedCharacters: [sourceId],
      diamonds: [diamondId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    expect(payment.diamondUses).toContainEqual({
      diamondId,
      pearlId: pearl8Id,
      modifier: -1,
      source: "candidateAbility",
    });

    const next = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment,
    }).state;

    expect(getPlayer(next, active.id).activatedCharacters).toContain(characterId);
    expect(getPlayer(next, active.id).diamonds).not.toContain(diamondId);
    expect(next.characterDeck.discardPile).toContain(diamondId);
  });

  it("requires the extra spent diamond for the 222 plus diamond requirement", () => {
    let state = start({ seed: "spent-diamond-requirement" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-600-222-1-plus-diamond-p3-d0", []);
    const pearl2a = cardIdForDefinition(state, "pearl-2", []);
    const pearl2b = cardIdForDefinition(state, "pearl-2", [pearl2a]);
    const pearl2c = cardIdForDefinition(state, "pearl-2", [pearl2a, pearl2b]);
    const diamondId = cardIdForDefinition(state, "character-302-18-p1-d0", [characterId]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl2a, pearl2b, pearl2c],
      gateCharacters: [characterId],
      diamonds: [diamondId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    expect(payment.spentDiamondIds).toEqual([diamondId]);
    expect(() =>
      reduceGame(state, {
        type: "activateGateCharacter",
        actorId: active.id,
        characterInstanceId: characterId,
        payment: { pearlIds: [pearl2a, pearl2b, pearl2c], diamondUses: [] },
      }),
    ).toThrow(/satisfy requirement/);

    const next = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment,
    }).state;
    expect(getPlayer(next, active.id).activatedCharacters).toContain(characterId);
    expect(next.characterDeck.discardPile).toContain(diamondId);
  });

  it("grants immediate extra actions from activated extra-action characters", () => {
    let state = start({ seed: "extra-actions" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-701-2468-p2-d0", []);
    const pearlIds = ["pearl-2", "pearl-4", "pearl-6", "pearl-8"].map((definitionId) =>
      cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
      gateCharacters: [characterId],
    });

    const result = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment: getPaymentPlans(state, active.id, characterId)[0],
    });

    expect(result.state.turn.actionsRemaining).toBe(5);
    expect(result.events).toContainEqual({
      type: "actionBonusGranted",
      playerId: active.id,
      amount: 3,
    });
  });

  it("delays persistent action bonuses from newly activated passive cards until the next turn", () => {
    let state = start({ totalPlayers: 2, seed: "passive-actions-next-turn" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-508-45678-p1-d0", []);
    const pearlIds = ["pearl-4", "pearl-5", "pearl-6", "pearl-7", "pearl-8"].map((definitionId) =>
      cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
      gateCharacters: [characterId],
    });

    state = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment: getPaymentPlans(state, active.id, characterId)[0],
    }).state;

    expect(state.turn.actionsRemaining).toBe(2);

    state = {
      ...state,
      turn: { ...state.turn, actionsRemaining: 0 },
    };
    state = reduceGame(state, { type: "endTurn", actorId: active.id }).state;
    const opponentId = state.turn.activePlayerId;
    state = {
      ...state,
      turn: { ...state.turn, actionsRemaining: 0 },
    };
    state = reduceGame(state, { type: "endTurn", actorId: opponentId }).state;

    expect(state.turn.activePlayerId).toBe(active.id);
    expect(state.turn.actionsRemaining).toBe(4);
  });

  it("finishes the current round after 12 power and awards the highest score", () => {
    let state = start({ seed: "current-round-end-game" });
    const active = getActivePlayer(state);
    const activatedIds = [
      cardIdForDefinition(state, "character-505-8888-p5-d0", []),
      cardIdForDefinition(state, "character-503-7777-p4-d0", []),
      cardIdForDefinition(state, "character-501-88-p2-d0", []),
    ];
    const finisherId = cardIdForDefinition(state, "character-306-11-p1-d0", activatedIds);
    const pearl1a = cardIdForDefinition(state, "pearl-1", []);
    const pearl1b = cardIdForDefinition(state, "pearl-1", [pearl1a]);
    const challenger = state.players[1];
    const challengerActivatedIds = [
      cardIdForDefinition(state, "character-305-6688-p3-d0", [...activatedIds, finisherId]),
      cardIdForDefinition(state, "character-504-6688-p3-d0", [...activatedIds, finisherId]),
      cardIdForDefinition(state, "character-606-6688-p3-d0", [...activatedIds, finisherId]),
    ];
    const challengerFinisherId = cardIdForDefinition(state, "character-307-7777-p4-d0", [
      ...activatedIds,
      finisherId,
      ...challengerActivatedIds,
    ]);
    const pearl7a = cardIdForDefinition(state, "pearl-7", []);
    const pearl7b = cardIdForDefinition(state, "pearl-7", [pearl7a]);
    const pearl7c = cardIdForDefinition(state, "pearl-7", [pearl7a, pearl7b]);
    const pearl7d = cardIdForDefinition(state, "pearl-7", [pearl7a, pearl7b, pearl7c]);
    const challengerIds = [
      ...challengerActivatedIds,
      challengerFinisherId,
      pearl7a,
      pearl7b,
      pearl7c,
      pearl7d,
    ];
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl1a, pearl1b],
      gateCharacters: [finisherId],
      activatedCharacters: activatedIds,
    });
    state = {
      ...state,
      turn: { ...state.turn, actionsRemaining: 1 },
      cardsById: {
        ...state.cardsById,
        ...Object.fromEntries(
          challengerIds.map((cardId) => [
            cardId,
            { ...state.cardsById[cardId], owner: challenger.id },
          ]),
        ),
      },
      players: state.players.map((player) => {
        if (player.id === challenger.id) {
          return {
            ...player,
            pearlHand: [pearl7a, pearl7b, pearl7c, pearl7d],
            gateCharacters: [challengerFinisherId],
            activatedCharacters: challengerActivatedIds,
          };
        }
        return {
          ...player,
          pearlHand: player.pearlHand.filter((cardId) => !challengerIds.includes(cardId)),
          gateCharacters: player.gateCharacters.filter((cardId) => !challengerIds.includes(cardId)),
          activatedCharacters: player.activatedCharacters.filter(
            (cardId) => !challengerIds.includes(cardId),
          ),
          diamonds: player.diamonds.filter((cardId) => !challengerIds.includes(cardId)),
        };
      }),
      pearlDeck: removeFromDeckZone(state.pearlDeck, challengerIds),
      characterDeck: removeFromDeckZone(state.characterDeck, challengerIds),
      market: {
        pearlMarket: state.market.pearlMarket.filter((cardId) => !challengerIds.includes(cardId)),
        characterMarket: state.market.characterMarket.filter(
          (cardId) => !challengerIds.includes(cardId),
        ),
      },
    };

    state = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: finisherId,
      payment: getPaymentPlans(state, active.id, finisherId)[0],
    }).state;

    expect(state.turn.phase).toBe("action");
    expect(state.turn.endGame).toEqual({
      status: "finishCurrentRound",
      triggeredBy: active.id,
      triggeredRound: 1,
    });

    state = reduceGame(state, { type: "endTurn", actorId: active.id }).state;
    state = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: challenger.id,
      characterInstanceId: challengerFinisherId,
      payment: getPaymentPlans(state, challenger.id, challengerFinisherId)[0],
    }).state;
    expect(getPlayerPower(state, challenger.id)).toBe(13);

    state = {
      ...state,
      turn: { ...state.turn, actionsRemaining: 0 },
    };
    state = reduceGame(state, { type: "endTurn", actorId: challenger.id }).state;
    state = {
      ...state,
      turn: { ...state.turn, actionsRemaining: 0 },
    };
    const roundLastPlayerId = state.turn.activePlayerId;
    state = reduceGame(state, { type: "endTurn", actorId: state.turn.activePlayerId }).state;

    expect(state.turn.phase).toBe("gameOver");
    expect(state.turn.activePlayerId).toBe(roundLastPlayerId);
    expect(state.turn.endGame).toEqual({ status: "ended", winnerIds: [challenger.id] });
  });

  it("reclaims one just-used pearl when activating the reclaim character", () => {
    let state = start({ seed: "reclaim-pearl" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-800-345-p1-d0", []);
    const pearlIds = ["pearl-3", "pearl-4", "pearl-5"].map((definitionId) =>
      cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
      gateCharacters: [characterId],
    });

    const result = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment: getPaymentPlans(state, active.id, characterId)[0],
    });

    expect(getPlayer(result.state, active.id).pearlHand).toEqual([pearlIds[2]]);
    expect(result.state.pearlDeck.discardPile).toEqual(expect.arrayContaining(pearlIds.slice(0, 2)));
    expect(result.events).toContainEqual({
      type: "pearlsReclaimed",
      playerId: active.id,
      cardIds: [pearlIds[2]],
    });
  });

  it("honors the chosen just-used pearl for the reclaim character", () => {
    let state = start({ seed: "chosen-reclaim-pearl" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-800-345-p1-d0", []);
    const pearlIds = ["pearl-3", "pearl-4", "pearl-5"].map((definitionId) =>
      cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
      gateCharacters: [characterId],
    });

    const payment = getPaymentPlans(state, active.id, characterId)[0];
    const result = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment,
      choices: { reclaimPearlId: pearlIds[0] },
    });

    expect(getPlayer(result.state, active.id).pearlHand).toEqual([pearlIds[0]]);
    expect(result.state.pearlDeck.discardPile).toEqual(expect.arrayContaining(pearlIds.slice(1)));
  });

  it("honors the chosen opponent gate character for discard-on-activation effects", () => {
    let state = start({ totalPlayers: 3, seed: "chosen-opponent-gate-discard" });
    const active = getActivePlayer(state);
    const leftOpponent = state.players[1];
    const rightOpponent = state.players[2];
    const characterId = cardIdForDefinition(state, "character-602-three-card-sum-7-p1-d0", []);
    const pearlIds = ["pearl-1", "pearl-2", "pearl-4"].map((definitionId) =>
      cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    const strongerTargetId = cardIdForDefinition(state, "character-505-8888-p5-d0", [characterId]);
    const chosenTargetId = cardIdForDefinition(state, "character-307-7777-p4-d0", [
      characterId,
      strongerTargetId,
    ]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
      gateCharacters: [characterId],
    });
    state = {
      ...state,
      cardsById: {
        ...state.cardsById,
        [strongerTargetId]: { ...state.cardsById[strongerTargetId], owner: leftOpponent.id },
        [chosenTargetId]: { ...state.cardsById[chosenTargetId], owner: rightOpponent.id },
      },
      players: state.players.map((player) => {
        if (player.id === leftOpponent.id) {
          return { ...player, gateCharacters: [strongerTargetId] };
        }
        if (player.id === rightOpponent.id) {
          return { ...player, gateCharacters: [chosenTargetId] };
        }
        return player;
      }),
      characterDeck: removeFromDeckZone(state.characterDeck, [
        strongerTargetId,
        chosenTargetId,
      ]),
    };

    const result = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: characterId,
      payment: getPaymentPlans(state, active.id, characterId)[0],
      choices: { targetGateCharacterId: chosenTargetId },
    });

    expect(getPlayer(result.state, rightOpponent.id).gateCharacters).not.toContain(chosenTargetId);
    expect(getPlayer(result.state, leftOpponent.id).gateCharacters).toContain(strongerTargetId);
    expect(result.state.characterDeck.discardPile).toContain(chosenTargetId);
  });

  it("allows adjacent players to activate a wisp from another gate", () => {
    let state = start({ totalPlayers: 3, seed: "wisp" });
    const active = getActivePlayer(state);
    const neighbor = state.players[1];
    const wispId = cardIdForDefinition(state, "character-707-333-or-666-p3-d0", []);
    const pearl3a = cardIdForDefinition(state, "pearl-3", []);
    const pearl3b = cardIdForDefinition(state, "pearl-3", [pearl3a]);
    const pearl3c = cardIdForDefinition(state, "pearl-3", [pearl3a, pearl3b]);
    const pearlIds = [pearl3a, pearl3b, pearl3c];
    state = arrangeActivePlayerCards(state, {
      pearlHand: pearlIds,
    });
    state = {
      ...state,
      cardsById: {
        ...state.cardsById,
        [wispId]: { ...state.cardsById[wispId], owner: neighbor.id },
      },
      players: state.players.map((player) =>
        player.id === neighbor.id ? { ...player, gateCharacters: [wispId] } : player,
      ),
      characterDeck: removeFromDeckZone(state.characterDeck, [wispId]),
    };

    const payment = getPaymentPlans(state, active.id, wispId)[0];
    const next = reduceGame(state, {
      type: "activateGateCharacter",
      actorId: active.id,
      characterInstanceId: wispId,
      payment,
    }).state;

    expect(getPlayer(next, active.id).activatedCharacters).toContain(wispId);
    expect(getPlayer(next, neighbor.id).gateCharacters).not.toContain(wispId);
    expect(next.cardsById[wispId].owner).toBe(active.id);
  });

  it("plays one full automated round without breaking market or hand-limit invariants", () => {
    let state = start({ totalPlayers: 3, seed: "cycle-test" });
    const startPlayerId = state.turn.startPlayerId;
    let completedTurns = 0;

    while (!(state.turn.roundNumber === 2 && state.turn.activePlayerId === startPlayerId)) {
      state = playAutomatedTurn(state);
      completedTurns += 1;

      expect(state.market.pearlMarket).toHaveLength(4);
      expect(state.market.characterMarket.length).toBeLessThanOrEqual(2);
      for (const player of state.players) {
        expect(player.pearlHand.length).toBeLessThanOrEqual(getHandLimit(state, player.id));
      }

      if (completedTurns > state.players.length) {
        throw new Error("Automated round did not return to the start player.");
      }
    }

    expect(completedTurns).toBe(state.players.length);
    expect(state.turn.roundNumber).toBe(2);
    expect(state.turn.activePlayerId).toBe(startPlayerId);
    expect(state.turn.actionsRemaining).toBe(3);
  });

  it("plays a complete automated game to game over", () => {
    let state = start({
      totalPlayers: 3,
      seed: "full-game-history",
      startPlayer: { type: "seededRandom" },
    });
    let completedTurns = 0;

    while (state.turn.endGame.status !== "ended") {
      state = playAutomatedTurn(state);
      completedTurns += 1;

      expect(state.market.pearlMarket).toHaveLength(4);
      expect(state.market.characterMarket.length).toBeLessThanOrEqual(2);
      for (const player of state.players) {
        expect(player.pearlHand.length).toBeLessThanOrEqual(getHandLimit(state, player.id));
      }

      if (completedTurns > 100) {
        throw new Error("Automated game did not reach the end-game state.");
      }
    }

    expect(state.turn.phase).toBe("gameOver");
    expect(state.turn.endGame.status).toBe("ended");
    expect(completedTurns).toBeLessThanOrEqual(57);
    expect(Math.max(...state.players.map((player) => getPlayerPower(state, player.id)))).toBeGreaterThanOrEqual(12);
  });

  it("prefers gathering pearls over blind replacement after filling the gate", () => {
    let state = start({ seed: "cycle-history" });
    const active = getActivePlayer(state);

    state = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;
    state = reduceGame(state, {
      type: "placeCharacterFromMarket",
      actorId: active.id,
      marketIndex: 0,
    }).state;

    const action = chooseAiAction(state, active.id);
    expect(["activateGateCharacter", "gainPearlFromMarket", "refreshPearlMarket"]).toContain(
      action.type,
    );
    if (action.type === "placeCharacterFromMarket" || action.type === "placeCharacterFromDeck") {
      expect(action.discardGateCharacterId).toBeUndefined();
    }
  });

  it("discards less useful pearls before pearls needed by gate characters", () => {
    let state = start({ seed: "cycle-history" });
    const active = getActivePlayer(state);
    const characterId = cardIdForDefinition(state, "character-307-7777-p4-d0", []);
    const pearl7 = cardIdForDefinition(state, "pearl-7", []);
    const fillerPearls = ["pearl-1", "pearl-2", "pearl-3", "pearl-4", "pearl-5"].map(
      (definitionId) => cardIdForDefinition(state, definitionId as CardDefinitionId, []),
    );
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl7, ...fillerPearls],
      gateCharacters: [characterId],
    });

    const discardIds = choosePearlsToDiscardToLimit(state, active.id);
    const discardValues = discardIds.map(
      (cardId) => state.cardsById[cardId].definitionId,
    );

    expect(discardIds).toHaveLength(1);
    expect(discardValues).not.toContain("pearl-7");
  });

  it("prioritizes a payable engine card over an unpayable high-score card in the opening", () => {
    let state = start({ seed: "ai-engine-placement" });
    const active = getActivePlayer(state);
    const highScoreId = cardIdForDefinition(state, "character-307-7777-p4-d0", []);
    const engineId = cardIdForDefinition(state, "character-603-1111-p0-d0", [highScoreId]);
    const pearl1a = cardIdForDefinition(state, "pearl-1", []);
    const pearl1b = cardIdForDefinition(state, "pearl-1", [pearl1a]);
    const pearl1c = cardIdForDefinition(state, "pearl-1", [pearl1a, pearl1b]);
    const pearl1d = cardIdForDefinition(state, "pearl-1", [pearl1a, pearl1b, pearl1c]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl1a, pearl1b, pearl1c, pearl1d],
      gateCharacters: [],
      activatedCharacters: [],
      diamonds: [],
    });
    state = {
      ...state,
      cardsById: {
        ...state.cardsById,
        [highScoreId]: { ...state.cardsById[highScoreId], owner: null },
        [engineId]: { ...state.cardsById[engineId], owner: null },
      },
      characterDeck: removeFromDeckZone(state.characterDeck, [highScoreId, engineId]),
      market: {
        ...state.market,
        characterMarket: [highScoreId, engineId],
      },
    };

    const action = chooseAiAction(state, active.id);
    expect(action).toMatchObject({
      type: "placeCharacterFromMarket",
      marketIndex: 1,
    });
  });

  it("activates a flexible engine card before a high-score card while still building an engine", () => {
    let state = start({ seed: "ai-engine-activation" });
    const active = getActivePlayer(state);
    const engineId = cardIdForDefinition(state, "character-603-1111-p0-d0", []);
    const highScoreId = cardIdForDefinition(state, "character-307-7777-p4-d0", [engineId]);
    const pearl1a = cardIdForDefinition(state, "pearl-1", []);
    const pearl1b = cardIdForDefinition(state, "pearl-1", [pearl1a]);
    const pearl1c = cardIdForDefinition(state, "pearl-1", [pearl1a, pearl1b]);
    const pearl1d = cardIdForDefinition(state, "pearl-1", [pearl1a, pearl1b, pearl1c]);
    const pearl7a = cardIdForDefinition(state, "pearl-7", []);
    const pearl7b = cardIdForDefinition(state, "pearl-7", [pearl7a]);
    const pearl7c = cardIdForDefinition(state, "pearl-7", [pearl7a, pearl7b]);
    const pearl7d = cardIdForDefinition(state, "pearl-7", [pearl7a, pearl7b, pearl7c]);
    state = arrangeActivePlayerCards(state, {
      pearlHand: [pearl1a, pearl1b, pearl1c, pearl1d, pearl7a, pearl7b, pearl7c, pearl7d],
      gateCharacters: [engineId, highScoreId],
      activatedCharacters: [],
      diamonds: [],
    });

    const action = chooseAiAction(state, active.id);
    expect(action).toMatchObject({
      type: "activateGateCharacter",
      characterInstanceId: engineId,
    });
  });

  it("fills an empty gate from the character deck before taking denial pearls on expert", () => {
    let state = start({ seed: "ai-expert-empty-gate" });
    const active = getActivePlayer(state);
    const deckCharacterId = cardIdForDefinition(state, "character-406-pair-p1-d0", []);
    const opponent = state.players[1];
    const opponentTargetId = cardIdForDefinition(state, "character-307-7777-p4-d0", [
      deckCharacterId,
    ]);
    const pearl7Id = cardIdForDefinition(state, "pearl-7", []);

    state = arrangeActivePlayerCards(state, {
      pearlHand: [],
      gateCharacters: [],
      activatedCharacters: [],
      diamonds: [],
    });
    state = {
      ...state,
      setup: { ...state.setup, aiDifficulty: "expert" },
      cardsById: {
        ...state.cardsById,
        [deckCharacterId]: { ...state.cardsById[deckCharacterId], owner: null },
        [opponentTargetId]: { ...state.cardsById[opponentTargetId], owner: opponent.id },
        [pearl7Id]: { ...state.cardsById[pearl7Id], owner: null },
      },
      players: state.players.map((player) =>
        player.id === opponent.id ? { ...player, gateCharacters: [opponentTargetId] } : player,
      ),
      characterDeck: {
        ...removeFromDeckZone(state.characterDeck, [deckCharacterId, opponentTargetId]),
        drawPile: [deckCharacterId],
      },
      pearlDeck: removeFromDeckZone(state.pearlDeck, [pearl7Id]),
      market: {
        pearlMarket: [pearl7Id],
        characterMarket: [],
      },
    };

    const action = chooseAiAction(state, active.id);
    expect(action).toMatchObject({
      type: "placeCharacterFromDeck",
      actorId: active.id,
    });
  });
});

describe("invariants", () => {
  function findActivatableSetup(): {
    state: GameState;
    actorId: string;
    characterId: string;
    pearlIds: string[];
  } | null {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      let state = start({ seed: `inv-${attempt}` });
      for (let step = 0; step < 80; step += 1) {
        const active = getActivePlayer(state);
        if (active.gateCharacters.length === 0) {
          if (state.turn.actionsRemaining === 0) {
            state = reduceGame(state, { type: "endTurn", actorId: active.id }).state;
            continue;
          }
          state = reduceGame(state, {
            type: "placeCharacterFromMarket",
            actorId: active.id,
            marketIndex: 0,
          }).state;
          continue;
        }
        return {
          state,
          actorId: active.id,
          characterId: active.gateCharacters[0],
          pearlIds: active.pearlHand.slice(0, 1),
        };
      }
    }
    return null;
  }

  it("rejects activation with payment that does not match the requirement", () => {
    const setup = findActivatableSetup();
    if (!setup) {
      throw new Error("Could not build activation scenario.");
    }
    expect(() =>
      reduceGame(setup.state, {
        type: "activateGateCharacter",
        actorId: setup.actorId,
        characterInstanceId: setup.characterId,
        payment: { pearlIds: setup.pearlIds, diamondUses: [] },
      }),
    ).toThrow(/satisfy requirement|requirement/);
  });

  it("rejects discardPearlsToLimit with duplicate pearl IDs", () => {
    let state = start({ totalPlayers: 3 });
    const active = getActivePlayer(state);
    for (let index = 0; index < 3; index += 1) {
      state = reduceGame(state, { type: "gainPearlFromDeck", actorId: active.id }).state;
    }
    const handFirst = getPlayer(state, active.id).pearlHand[0];
    expect(() =>
      reduceGame(state, {
        type: "discardPearlsToLimit",
        actorId: active.id,
        pearlIds: [handFirst, handFirst, handFirst],
      }),
    ).toThrow(/Duplicate pearl/);
  });

  it("rejects activation with duplicate pearl IDs in payment", () => {
    const setup = findActivatableSetup();
    if (!setup) {
      throw new Error("Could not build activation scenario.");
    }
    const dupId = setup.pearlIds[0];
    expect(() =>
      reduceGame(setup.state, {
        type: "activateGateCharacter",
        actorId: setup.actorId,
        characterInstanceId: setup.characterId,
        payment: { pearlIds: [dupId, dupId], diamondUses: [] },
      }),
    ).toThrow(/Duplicate pearl/);
  });
});

function findPayableGateSetup(): {
  state: GameState;
  actorId: string;
  characterId: string;
  pearlIds: string[];
} | null {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = start({ seed: `payable-${attempt}` });
    const active = getActivePlayer(state);

    for (const marketIndex of [0, 1]) {
      const placed = reduceGame(state, {
        type: "placeCharacterFromMarket",
        actorId: active.id,
        marketIndex,
      }).state;
      const characterId = getPlayer(placed, active.id).gateCharacters[0];
      const pearlIds = findPaymentForCharacter(placed, active.id, characterId);
      if (pearlIds) {
        return {
          state: placed,
          actorId: active.id,
          characterId,
          pearlIds,
        };
      }
    }
  }

  return null;
}

function makeDiamondPaymentSetup(): {
  state: GameState;
  actorId: string;
  characterId: CardInstanceId;
  exactPearlId: CardInstanceId;
  boostedPearlId: CardInstanceId;
  diamondId: CardInstanceId;
} {
  const state = start({ seed: "diamond-payment" });
  const active = getActivePlayer(state);
  const exactPearlId = cardIdForDefinition(state, "pearl-1", []);
  const boostedPearlId = cardIdForDefinition(state, "pearl-1", [exactPearlId]);
  const characterId = cardIdForDefinition(state, "character-304-12-p0-d0", []);
  const diamondId = cardIdForDefinition(state, "character-302-18-p1-d0", [characterId]);

  return {
    state: {
      ...state,
      cardsById: {
        ...state.cardsById,
        [exactPearlId]: { ...state.cardsById[exactPearlId], owner: active.id },
        [boostedPearlId]: { ...state.cardsById[boostedPearlId], owner: active.id },
        [characterId]: { ...state.cardsById[characterId], owner: active.id },
        [diamondId]: { ...state.cardsById[diamondId], owner: active.id },
      },
      players: state.players.map((player) =>
        player.id === active.id
          ? {
              ...player,
              pearlHand: [exactPearlId, boostedPearlId],
              gateCharacters: [characterId],
              diamonds: [diamondId],
            }
          : player,
      ),
      pearlDeck: removeFromDeckZone(state.pearlDeck, [exactPearlId, boostedPearlId]),
      characterDeck: removeFromDeckZone(state.characterDeck, [characterId, diamondId]),
      market: {
        pearlMarket: state.market.pearlMarket.filter(
          (cardId) => cardId !== exactPearlId && cardId !== boostedPearlId,
        ),
        characterMarket: state.market.characterMarket.filter(
          (cardId) => cardId !== characterId && cardId !== diamondId,
        ),
      },
    },
    actorId: active.id,
    characterId,
    exactPearlId,
    boostedPearlId,
    diamondId,
  };
}

function arrangeActivePlayerCards(
  state: GameState,
  cards: Partial<
    Pick<PlayerState, "pearlHand" | "gateCharacters" | "activatedCharacters" | "diamonds">
  >,
): GameState {
  const active = getActivePlayer(state);
  const current = getPlayer(state, active.id);
  const nextActive = {
    ...current,
    pearlHand: cards.pearlHand ?? current.pearlHand,
    gateCharacters: cards.gateCharacters ?? current.gateCharacters,
    activatedCharacters: cards.activatedCharacters ?? current.activatedCharacters,
    diamonds: cards.diamonds ?? current.diamonds,
  };
  const ownedIds = [
    ...nextActive.pearlHand,
    ...nextActive.gateCharacters,
    ...nextActive.activatedCharacters,
    ...nextActive.diamonds,
  ];
  const cardsById = { ...state.cardsById };
  for (const cardId of ownedIds) {
    cardsById[cardId] = { ...cardsById[cardId], owner: active.id };
  }

  return {
    ...state,
    cardsById,
    players: state.players.map((player) => {
      if (player.id === active.id) {
        return nextActive;
      }
      return {
        ...player,
        pearlHand: player.pearlHand.filter((cardId) => !ownedIds.includes(cardId)),
        gateCharacters: player.gateCharacters.filter((cardId) => !ownedIds.includes(cardId)),
        activatedCharacters: player.activatedCharacters.filter((cardId) => !ownedIds.includes(cardId)),
        diamonds: player.diamonds.filter((cardId) => !ownedIds.includes(cardId)),
      };
    }),
    pearlDeck: removeFromDeckZone(state.pearlDeck, ownedIds),
    characterDeck: removeFromDeckZone(state.characterDeck, ownedIds),
    market: {
      pearlMarket: state.market.pearlMarket.filter((cardId) => !ownedIds.includes(cardId)),
      characterMarket: state.market.characterMarket.filter((cardId) => !ownedIds.includes(cardId)),
    },
  };
}

function cardIdForDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
  excluded: CardInstanceId[],
): CardInstanceId {
  const found = Object.values(state.cardsById).find(
    (card) => card.definitionId === definitionId && !excluded.includes(card.id),
  );
  if (!found) {
    throw new Error(`Missing card definition in test state: ${definitionId}`);
  }
  return found.id;
}

function removeFromDeckZone(
  zone: GameState["pearlDeck"],
  cardIds: CardInstanceId[],
): GameState["pearlDeck"] {
  return {
    drawPile: zone.drawPile.filter((cardId) => !cardIds.includes(cardId)),
    discardPile: zone.discardPile.filter((cardId) => !cardIds.includes(cardId)),
  };
}

function playAutomatedTurn(state: GameState): GameState {
  const actorId = state.turn.activePlayerId;
  let nextState = state;

  while (nextState.turn.activePlayerId === actorId && nextState.turn.actionsRemaining > 0) {
    const action = chooseAiAction(nextState, actorId);
    nextState = reduceGame(nextState, action).state;
  }

  while (nextState.turn.activePlayerId === actorId && nextState.turn.actionsRemaining === 0) {
    const action = chooseAiAction(nextState, actorId);
    if (action.type !== "useAbility") {
      break;
    }
    nextState = reduceGame(nextState, action).state;
  }

  const player = getPlayer(nextState, actorId);
  const excess = Math.max(0, player.pearlHand.length - getHandLimit(nextState, actorId));
  if (excess > 0) {
    nextState = reduceGame(nextState, {
      type: "discardPearlsToLimit",
      actorId,
      pearlIds: choosePearlsToDiscardToLimit(nextState, actorId),
    }).state;
  }

  return reduceGame(nextState, { type: "endTurn", actorId }).state;
}
