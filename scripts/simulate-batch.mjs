#!/usr/bin/env node
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const [key, value] = arg.slice(2).split("=");
  args.set(key, value ?? process.argv[index + 1]);
  if (value === undefined) index += 1;
}

const games = Number(args.get("games") ?? 10);
const seedPrefix = args.get("seed-prefix") ?? "expert-batch";
const difficulty = args.get("difficulty") ?? "expert";
const totalPlayers = Number(args.get("players") ?? 3);
const maxSteps = Number(args.get("max-steps") ?? 5000);
const outputPath = args.has("output") ? path.resolve(args.get("output")) : null;
const tmp = await mkdtemp(path.join(tmpdir(), "molta-batch-"));
const outfile = path.join(tmp, "batch-runner.mjs");

const entry = String.raw`
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { reduceGame } from "./src/game/engine/reducer.ts";
import { defaultSetupOptions } from "./src/game/engine/state.ts";
import { getActivePlayer, getHandLimit, getPlayer, getPlayerPower } from "./src/game/engine/selectors.ts";
import { chooseAiAction, choosePearlsToDiscardToLimit } from "./src/game/solo/chooseAiAction.ts";
import { fixtureCatalog } from "./src/game/content/catalog.ts";

const games = ${JSON.stringify(games)};
const seedPrefix = ${JSON.stringify(seedPrefix)};
const difficulty = ${JSON.stringify(difficulty)};
const totalPlayers = ${JSON.stringify(totalPlayers)};
const maxSteps = ${JSON.stringify(maxSteps)};
const outputPath = ${JSON.stringify(outputPath)};

function start(seed) {
  return reduceGame(undefined, {
    type: "startGame",
    options: {
      ...defaultSetupOptions,
      seed,
      totalPlayers,
      aiDifficulty: difficulty,
      startPlayer: { type: "seededRandom" },
    },
  }).state;
}

function actorLabel(player) {
  return player.controller.type === "human" ? "human" : "AI " + player.seatIndex;
}

function definitionId(state, cardId) {
  return state.cardsById[cardId]?.definitionId ?? null;
}

function increment(map, key, amount = 1) {
  map[key] = (map[key] ?? 0) + amount;
}

function gateOwnerOf(state, cardId) {
  return state.players.find((player) => player.gateCharacters.includes(cardId)) ?? null;
}

function classifyAction(before, action, stats) {
  increment(stats.actionsByType, action.type);

  if (action.type === "activateGateCharacter") {
    increment(stats.activationsByDefinition, definitionId(before, action.characterInstanceId) ?? "unknown");
    if ((action.payment.virtualPearls ?? []).length > 0) stats.virtualPearlPayments += 1;
    if ((action.payment.pearlValueOverrides ?? []).length > 0) stats.pearlOverridePayments += 1;
    if (action.payment.diamondUses.length > 0) stats.diamondModifierPayments += 1;
    if ((action.payment.spentDiamondIds ?? []).length > 0) stats.spentDiamondPayments += 1;
    const gateOwner = gateOwnerOf(before, action.characterInstanceId);
    if (gateOwner && gateOwner.id !== action.actorId) stats.wispActivations += 1;
  }

  if (action.type === "placeCharacterFromMarket") {
    const cardId = before.market.characterMarket[action.marketIndex];
    const cardDefinition = cardId ? fixtureCatalog.characterCards[definitionId(before, cardId)] : null;
    if (cardDefinition) {
      const power = typeof cardDefinition.power === "number" ? cardDefinition.power : 0;
      const isAggressive =
        cardDefinition.id.includes("three-card-sum-7") ||
        cardDefinition.id.includes("333-or-666") ||
        cardDefinition.id.includes("444-or-555");
      if (power >= 3 || isAggressive) stats.contestedCharacterTakes += 1;
    }
  }
}

function classifyEvents(before, action, events, stats) {
  for (const event of events) {
    if (event.type === "abilityUsed") {
      increment(stats.abilitiesByDefinition, definitionId(before, event.sourceCardId) ?? "unknown");
    }
    if (event.type === "marketRefreshed" && event.market === "character") {
      stats.characterMarketRefreshes += 1;
    }
    if (event.type === "characterDiscarded") {
      if (event.playerId !== action.actorId) stats.opponentGateDiscards += 1;
      else stats.ownGateReplacements += 1;
    }
    if (event.type === "pearlsReclaimed") stats.pearlsReclaimed += event.cardIds.length;
    if (event.type === "diamondsDiscarded") stats.diamondsSpent += event.cardIds.length;
    if (event.type === "actionBonusGranted") stats.actionBonuses += event.amount;
  }
}

function addZone(zones, violations, cardId, zone, expectedOwner) {
  const previous = zones.get(cardId);
  if (previous) {
    violations.push("duplicate card zone: " + cardId + " in " + previous.zone + " and " + zone);
    return;
  }
  zones.set(cardId, { zone, expectedOwner });
}

function checkInvariants(state, context) {
  const violations = [];
  const zones = new Map();

  for (const cardId of state.pearlDeck.drawPile) addZone(zones, violations, cardId, "pearlDraw", null);
  for (const cardId of state.pearlDeck.discardPile) addZone(zones, violations, cardId, "pearlDiscard", null);
  for (const cardId of state.characterDeck.drawPile) addZone(zones, violations, cardId, "characterDraw", null);
  for (const cardId of state.characterDeck.discardPile) addZone(zones, violations, cardId, "characterDiscard", null);
  for (const cardId of state.market.pearlMarket) addZone(zones, violations, cardId, "pearlMarket", null);
  for (const cardId of state.market.characterMarket) addZone(zones, violations, cardId, "characterMarket", null);

  for (const player of state.players) {
    addZone(zones, violations, player.gateCardId, "gateCard:" + player.id, player.id);
    for (const cardId of player.pearlHand) addZone(zones, violations, cardId, "pearlHand:" + player.id, player.id);
    for (const cardId of player.gateCharacters) addZone(zones, violations, cardId, "gateCharacters:" + player.id, player.id);
    for (const cardId of player.activatedCharacters) addZone(zones, violations, cardId, "activatedCharacters:" + player.id, player.id);
    for (const cardId of player.diamonds) addZone(zones, violations, cardId, "diamonds:" + player.id, player.id);
  }

  for (const [cardId, card] of Object.entries(state.cardsById)) {
    const zone = zones.get(cardId);
    if (!zone) {
      violations.push("missing card zone: " + cardId);
      continue;
    }
    if (card.owner !== zone.expectedOwner) {
      violations.push(
        "owner mismatch: " + cardId + " owner=" + card.owner + " expected=" + zone.expectedOwner + " zone=" + zone.zone,
      );
    }
  }

  if (state.market.pearlMarket.length > 4) violations.push("pearl market has more than 4 cards");
  if (state.market.characterMarket.length > 2) violations.push("character market has more than 2 cards");
  if (state.turn.actionsRemaining < 0) violations.push("negative actions remaining");

  for (const player of state.players) {
    if (player.gateCharacters.length > 2) violations.push(player.id + " has more than 2 gate characters");
    if (
      player.id !== state.turn.activePlayerId &&
      state.turn.endGame.status !== "ended" &&
      player.pearlHand.length > getHandLimit(state, player.id)
    ) {
      violations.push(player.id + " exceeds hand limit outside their turn");
    }
  }

  const maxPower = Math.max(...state.players.map((player) => getPlayerPower(state, player.id)));
  if (state.turn.endGame.status === "notTriggered" && maxPower >= 12) {
    violations.push("12-point threshold reached without ending the game");
  }
  if (state.turn.endGame.status === "ended") {
    if (state.turn.phase !== "gameOver") violations.push("ended game is not in gameOver phase");
    if (state.turn.actionsRemaining !== 0) violations.push("ended game still has actions remaining");
  }

  return violations.map((message) => ({ context, message }));
}

function playerSummary(state, player) {
  return {
    id: player.id,
    label: actorLabel(player),
    score: getPlayerPower(state, player.id),
    diamonds: player.diamonds.length,
    hand: player.pearlHand.length,
    gate: player.gateCharacters.length,
    active: player.activatedCharacters.length,
  };
}

function makeStats() {
  return {
    actionsByType: {},
    activationsByDefinition: {},
    abilitiesByDefinition: {},
    virtualPearlPayments: 0,
    pearlOverridePayments: 0,
    diamondModifierPayments: 0,
    spentDiamondPayments: 0,
    wispActivations: 0,
    opponentGateDiscards: 0,
    ownGateReplacements: 0,
    contestedCharacterTakes: 0,
    characterMarketRefreshes: 0,
    pearlsReclaimed: 0,
    diamondsSpent: 0,
    actionBonuses: 0,
  };
}

function applyAction(state, action, game, label) {
  classifyAction(state, action, game.stats);
  const result = reduceGame(state, action);
  classifyEvents(state, action, result.events, game.stats);
  game.steps += 1;
  game.violations.push(...checkInvariants(result.state, label + " / " + action.type));
  return result.state;
}

function playGame(index) {
  const seed = seedPrefix + "-" + String(index + 1).padStart(2, "0");
  let state = start(seed);
  const game = {
    index: index + 1,
    seed,
    steps: 0,
    turns: 0,
    stats: makeStats(),
    violations: checkInvariants(state, "initial"),
  };

  while (state.turn.endGame.status !== "ended" && game.steps < maxSteps) {
    const active = getActivePlayer(state);
    const actorId = active.id;

    while (
      state.turn.endGame.status !== "ended" &&
      state.turn.activePlayerId === actorId &&
      state.turn.actionsRemaining > 0 &&
      game.steps < maxSteps
    ) {
      const action = chooseAiAction(state, actorId);
      state = applyAction(state, action, game, actorLabel(active));
    }

    while (
      state.turn.endGame.status !== "ended" &&
      state.turn.activePlayerId === actorId &&
      state.turn.actionsRemaining === 0 &&
      game.steps < maxSteps
    ) {
      const action = chooseAiAction(state, actorId);
      if (action.type !== "useAbility") break;
      state = applyAction(state, action, game, actorLabel(active) + " afterActions");
    }

    if (
      state.turn.endGame.status !== "ended" &&
      state.turn.activePlayerId === actorId &&
      state.turn.actionsRemaining === 0
    ) {
      const player = getPlayer(state, actorId);
      const discardIds = choosePearlsToDiscardToLimit(state, actorId);
      if (discardIds.length > 0 || player.pearlHand.length > getHandLimit(state, actorId)) {
        state = applyAction(
          state,
          { type: "discardPearlsToLimit", actorId, pearlIds: discardIds },
          game,
          actorLabel(active) + " cleanup",
        );
      }
    }

    if (
      state.turn.endGame.status !== "ended" &&
      state.turn.activePlayerId === actorId &&
      state.turn.actionsRemaining === 0 &&
      game.steps < maxSteps
    ) {
      state = applyAction(state, { type: "endTurn", actorId }, game, actorLabel(active) + " endTurn");
      game.turns += 1;
    }
  }

  if (state.turn.endGame.status !== "ended") {
    game.violations.push({
      context: "game loop",
      message: "game did not end within " + maxSteps + " steps",
    });
  }

  return {
    ...game,
    ended: state.turn.endGame.status === "ended",
    rounds: state.turn.roundNumber,
    winners:
      state.turn.endGame.status === "ended"
        ? state.turn.endGame.winnerIds.map((id) => actorLabel(getPlayer(state, id)))
        : [],
    finalPlayers: state.players.map((player) => playerSummary(state, player)),
  };
}

const results = Array.from({ length: games }, (_, index) => playGame(index));
const aggregate = {
  games,
  difficulty,
  totalPlayers,
  endedGames: results.filter((game) => game.ended).length,
  totalViolations: results.reduce((total, game) => total + game.violations.length, 0),
  winsByLabel: results.reduce((wins, game) => {
    for (const winner of game.winners) increment(wins, winner);
    return wins;
  }, {}),
  actionsByType: results.reduce((all, game) => {
    for (const [key, value] of Object.entries(game.stats.actionsByType)) increment(all, key, value);
    return all;
  }, {}),
  abilitiesByDefinition: results.reduce((all, game) => {
    for (const [key, value] of Object.entries(game.stats.abilitiesByDefinition)) increment(all, key, value);
    return all;
  }, {}),
  effectStats: results.reduce(
    (all, game) => {
      for (const key of Object.keys(all)) all[key] += game.stats[key];
      return all;
    },
    {
      virtualPearlPayments: 0,
      pearlOverridePayments: 0,
      diamondModifierPayments: 0,
      spentDiamondPayments: 0,
      wispActivations: 0,
      opponentGateDiscards: 0,
      contestedCharacterTakes: 0,
      characterMarketRefreshes: 0,
      pearlsReclaimed: 0,
      diamondsSpent: 0,
      actionBonuses: 0,
    },
  ),
};

const report = { aggregate, games: results };
if (outputPath) {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(aggregate, null, 2));
if (aggregate.totalViolations > 0 || aggregate.endedGames !== games) {
  process.exitCode = 1;
}
`;

try {
  if (outputPath) {
    await mkdir(path.dirname(outputPath), { recursive: true });
  }
  await build({
    stdin: {
      contents: entry,
      resolveDir: process.cwd(),
      sourcefile: "batch-entry.ts",
      loader: "ts",
    },
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    logLevel: "silent",
  });
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
