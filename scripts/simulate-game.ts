import { reduceGame } from "../src/game/engine/reducer";
import { defaultSetupOptions } from "../src/game/engine/state";
import { getActivePlayer, getHandLimit, getPlayerPower } from "../src/game/engine/selectors";
import { chooseAiAction } from "../src/game/solo/chooseAiAction";
import type { GameAction, GameState } from "../src/game/engine/types";

function step(state: GameState): GameState {
  if (state.turn.endGame.status === "ended") return state;

  const active = getActivePlayer(state);

  if (state.turn.actionsRemaining === 0) {
    const handLimit = getHandLimit(state, active.id);
    if (active.pearlHand.length > handLimit) {
      const drop = active.pearlHand.length - handLimit;
      const action: GameAction = {
        type: "discardPearlsToLimit",
        actorId: active.id,
        pearlIds: active.pearlHand.slice(0, drop),
      };
      return reduceGame(state, action).state;
    }
    return reduceGame(state, { type: "endTurn", actorId: active.id }).state;
  }

  const action = chooseAiAction(state, active.id);
  return reduceGame(state, action).state;
}

function run() {
  const setup = {
    ...defaultSetupOptions,
    seed: "sim-" + Math.random().toString(36).slice(2, 10),
  };
  let state = reduceGame(undefined, { type: "startGame", options: setup }).state;

  const maxSteps = 5000;
  let stepCount = 0;
  let lastRound = -1;
  const traceUntilRound = 4;
  while (state.turn.endGame.status !== "ended" && stepCount < maxSteps) {
    if (state.turn.roundNumber !== lastRound) {
      const scores = state.players
        .map((p) => `${p.id}: power=${getPlayerPower(state, p.id)} dia=${p.diamonds.length}`)
        .join(" | ");
      console.log(
        `Round ${state.turn.roundNumber} | endGame=${state.turn.endGame.status} | ${scores}`,
      );
      lastRound = state.turn.roundNumber;
    }
    const prevState = state;
    state = step(state);
    if (state.turn.roundNumber <= traceUntilRound) {
      const active = getActivePlayer(prevState);
      const turnAction = state.turn.actionsRemaining < prevState.turn.actionsRemaining
        ? `actionConsumed`
        : `turnEnded/discard`;
      console.log(
        `  ${active.id} hand=${active.pearlHand.length} gate=${active.gateCharacters.length} act=${active.activatedCharacters.length} actions=${prevState.turn.actionsRemaining} → ${turnAction}`,
      );
    }
  }

  console.log("---");
  if (state.turn.endGame.status === "ended") {
    console.log(`Game ended in ${stepCount} steps, round ${state.turn.roundNumber}.`);
    console.log(`Winners: ${state.turn.endGame.winnerIds.join(", ")}`);
    for (const player of state.players) {
      console.log(
        `  ${player.id} (${player.controller.type}): power=${getPlayerPower(state, player.id)} dia=${player.diamonds.length} activated=${player.activatedCharacters.length}`,
      );
    }
  } else {
    console.log(`Did not end after ${stepCount} steps. round=${state.turn.roundNumber}`);
    console.log(`endGame=${JSON.stringify(state.turn.endGame)}`);
    console.log(
      `decks: pearl draw=${state.pearlDeck.drawPile.length} discard=${state.pearlDeck.discardPile.length} | char draw=${state.characterDeck.drawPile.length} discard=${state.characterDeck.discardPile.length}`,
    );
    console.log(
      `markets: pearl=${state.market.pearlMarket.length} char=${state.market.characterMarket.length}`,
    );
    for (const player of state.players) {
      console.log(
        `  ${player.id}: power=${getPlayerPower(state, player.id)} hand=${player.pearlHand.length} gate=${player.gateCharacters.length} activated=${player.activatedCharacters.length}`,
      );
    }
  }
}

run();
