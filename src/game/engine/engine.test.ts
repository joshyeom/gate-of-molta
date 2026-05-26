import { describe, expect, it } from "vitest";
import { reduceGame } from "./reducer";
import { defaultSetupOptions, STARTING_PEARL_HAND_SIZE } from "./state";
import { getActivePlayer, getLegalActions, getPlayer } from "./selectors";
import type { GameSetupOptions, GameState } from "./types";

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
