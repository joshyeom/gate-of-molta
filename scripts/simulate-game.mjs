#!/usr/bin/env node
import { mkdtemp, rm } from "node:fs/promises";
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

const seed = args.get("seed") ?? "full-game-history";
const totalPlayers = Number(args.get("players") ?? 3);
const startPlayer = args.has("start-seat")
  ? { type: "fixedSeat", seatIndex: Number(args.get("start-seat")) }
  : { type: "seededRandom" };
const maxSteps = Number(args.get("max-steps") ?? 5000);
const outputPath = args.has("output") ? path.resolve(args.get("output")) : null;
const tmp = await mkdtemp(path.join(tmpdir(), "molta-game-"));
const outfile = path.join(tmp, "game-runner.mjs");

const entry = String.raw`
import { writeFileSync } from "node:fs";
import { reduceGame } from "./src/game/engine/reducer.ts";
import { defaultSetupOptions } from "./src/game/engine/state.ts";
import { getActivePlayer, getCardLabel, getHandLimit, getPlayer, getPlayerPower } from "./src/game/engine/selectors.ts";
import { chooseAiAction, choosePearlsToDiscardToLimit } from "./src/game/solo/chooseAiAction.ts";
import { fixtureCatalog } from "./src/game/content/catalog.ts";

const seed = ${JSON.stringify(seed)};
const totalPlayers = ${JSON.stringify(totalPlayers)};
const startPlayer = ${JSON.stringify(startPlayer)};
const maxSteps = ${JSON.stringify(maxSteps)};
const outputPath = ${JSON.stringify(outputPath)};

function actorName(player) {
  return player.controller.type === "human" ? "나" : "AI " + player.seatIndex;
}

function start() {
  return reduceGame(undefined, {
    type: "startGame",
    options: {
      ...defaultSetupOptions,
      seed,
      totalPlayers,
      startPlayer,
    },
  }).state;
}

function formatRequirement(requirement) {
  switch (requirement.type) {
    case "exactValues":
      return requirement.values.join("");
    case "sum":
      return (requirement.count ? requirement.count + "장 " : "") + "합 " + requirement.total;
    case "sequence":
      return "연속 " + requirement.count + "장";
    case "sameValue":
      return "같은 값 " + requirement.count + "장";
    case "odd":
      return "홀수 " + requirement.count + "장";
    case "even":
      return "짝수 " + requirement.count + "장";
    case "custom":
      return requirement.label;
    default:
      return "조건 미확인";
  }
}

function labelCard(state, cardId) {
  const instance = state.cardsById[cardId];
  const pearl = fixtureCatalog.pearlCards[instance?.definitionId];
  if (pearl) {
    return "진주 " + pearl.value;
  }
  const character = fixtureCatalog.characterCards[instance?.definitionId];
  if (character) {
    const power = typeof character.power === "number" ? character.power : "?";
    const diamond = typeof character.diamondReward === "number" ? character.diamondReward : "?";
    return "인물(" + formatRequirement(character.requirement) + ", 점수 " + power + ", 다이아 " + diamond + ")";
  }
  return getCardLabel(state, cardId, fixtureCatalog);
}

function describePayment(state, payment) {
  const diamondByPearl = new Map(payment.diamondUses.map((use) => [use.pearlId, use.diamondId]));
  const overrideByPearl = new Map((payment.pearlValueOverrides ?? []).map((override) => [override.pearlId, override.value]));
  const pearlLabels = payment.pearlIds.map((pearlId) => {
    const base = labelCard(state, pearlId);
    const label = overrideByPearl.has(pearlId) ? base + "→" + overrideByPearl.get(pearlId) : base;
    return diamondByPearl.has(pearlId) ? label + " + 다이아" : label;
  });
  const virtualLabels = (payment.virtualPearls ?? []).map((virtualPearl) => labelCard(state, virtualPearl.sourceCharacterId) + "=진주 " + virtualPearl.value);
  const spentDiamondLabels = (payment.spentDiamondIds ?? []).map(() => "다이아 1장");
  return [...pearlLabels, ...virtualLabels, ...spentDiamondLabels];
}

function describeAction(state, action) {
  const actor = actorName(getPlayer(state, action.actorId));
  switch (action.type) {
    case "gainPearlFromMarket":
      return actor + " 시장 진주 획득: " + labelCard(state, state.market.pearlMarket[action.marketIndex]);
    case "gainPearlFromDeck":
      return actor + " 진주 더미 획득";
    case "refreshPearlMarket":
      return actor + " 진주 시장 교체";
    case "placeCharacterFromMarket":
      return actor + " 시장 인물 배치: " + labelCard(state, state.market.characterMarket[action.marketIndex]);
    case "placeCharacterFromDeck":
      return actor + " 인물 더미 배치";
    case "activateGateCharacter":
      return actor + " 인물 활성화: " + labelCard(state, action.characterInstanceId) + " / 지불 " + describePayment(state, action.payment).join(", ");
    case "useAbility":
      return actor + " 인물 효과 사용: " + labelCard(state, action.choices.sourceCardId);
    case "discardPearlsToLimit":
      return actor + " 손패 제한 정리: " + action.pearlIds.map((id) => labelCard(state, id)).join(", ");
    case "endTurn":
      return actor + " 턴 종료";
    default:
      return actor + " " + action.type;
  }
}

function describeEvent(stateBefore, event) {
  switch (event.type) {
    case "actionSpent":
      return "남은 행동 " + event.actionsRemaining;
    case "cardMoved":
      return labelCard(stateBefore, event.cardId) + " 이동: " + event.from + " -> " + event.to;
    case "marketRefilled":
      return event.market + " 시장 보충 " + event.cardIds.length + "장";
    case "marketRefreshed":
      return event.market + " 시장 교체";
    case "characterPlaced":
      return "인물 배치 완료: " + labelCard(stateBefore, event.cardId);
    case "characterDiscarded":
      return "관문 인물 버림: " + labelCard(stateBefore, event.cardId);
    case "pearlsDiscarded":
      return "진주 버림: " + event.cardIds.map((id) => labelCard(stateBefore, id)).join(", ");
    case "diamondsDiscarded":
      return "다이아 사용: " + event.cardIds.map((id) => labelCard(stateBefore, id)).join(", ");
    case "abilityUsed":
      return "효과 사용: " + labelCard(stateBefore, event.sourceCardId);
    case "actionBonusGranted":
      return "추가 행동 +" + event.amount + ": " + event.playerId;
    case "pearlsReclaimed":
      return "진주 회수: " + event.cardIds.map((id) => labelCard(stateBefore, id)).join(", ");
    case "turnStarted":
      return "턴 시작: " + event.playerId + " / 라운드 " + event.roundNumber;
    default:
      return event.type;
  }
}

function playerSummary(state, player) {
  return {
    id: player.id,
    name: actorName(player),
    hand: player.pearlHand.length,
    gate: player.gateCharacters.length,
    active: player.activatedCharacters.length,
    diamonds: player.diamonds.length,
    score: getPlayerPower(state, player.id),
  };
}

function playerDetail(state, player) {
  return {
    ...playerSummary(state, player),
    gateCards: player.gateCharacters.map((id) => labelCard(state, id)),
    activeCards: player.activatedCharacters.map((id) => labelCard(state, id)),
  };
}

function snapshot(state) {
  return {
    round: state.turn.roundNumber,
    active: state.turn.endGame.status === "ended" ? null : actorName(getActivePlayer(state)),
    actionsRemaining: state.turn.actionsRemaining,
    phase: state.turn.phase,
    endGame: state.turn.endGame,
    pearlMarket: state.market.pearlMarket.map((id) => labelCard(state, id)),
    characterMarket: state.market.characterMarket.map((id) => labelCard(state, id)),
    decks: {
      pearlDraw: state.pearlDeck.drawPile.length,
      pearlDiscard: state.pearlDeck.discardPile.length,
      characterDraw: state.characterDeck.drawPile.length,
      characterDiscard: state.characterDeck.discardPile.length,
    },
    players: state.players.map((player) => playerSummary(state, player)),
  };
}

function finalSnapshot(state) {
  return {
    ...snapshot(state),
    players: state.players.map((player) => playerDetail(state, player)),
  };
}

function applyAndRecord(state, action, turnLog) {
  const before = state;
  const result = reduceGame(state, action);
  const after = result.state;
  turnLog.actions.push({
    action: describeAction(before, action),
    events: result.events.map((event) => describeEvent(before, event)),
    after: snapshot(after),
  });
  return after;
}

let state = start();
const initial = snapshot(state);
const history = [];
const roundSummaries = [snapshot(state)];
let completedTurns = 0;
let stepCount = 0;

while (state.turn.endGame.status !== "ended" && stepCount < maxSteps) {
  const active = getActivePlayer(state);
  const turnLog = {
    round: state.turn.roundNumber,
    actor: actorName(active),
    actions: [],
  };

  while (
    state.turn.endGame.status !== "ended" &&
    state.turn.activePlayerId === active.id &&
    state.turn.actionsRemaining > 0 &&
    stepCount < maxSteps
  ) {
    const action = chooseAiAction(state, active.id);
    state = applyAndRecord(state, action, turnLog);
    stepCount += 1;
  }

  if (
    state.turn.endGame.status !== "ended" &&
    state.turn.activePlayerId === active.id &&
    state.turn.actionsRemaining === 0 &&
    stepCount < maxSteps
  ) {
    while (
      state.turn.endGame.status !== "ended" &&
      state.turn.activePlayerId === active.id &&
      state.turn.actionsRemaining === 0 &&
      stepCount < maxSteps
    ) {
      const action = chooseAiAction(state, active.id);
      if (action.type !== "useAbility") {
        break;
      }
      state = applyAndRecord(state, action, turnLog);
      stepCount += 1;
    }

    const discardIds = choosePearlsToDiscardToLimit(state, active.id);
    if (discardIds.length > 0) {
      state = applyAndRecord(
        state,
        { type: "discardPearlsToLimit", actorId: active.id, pearlIds: discardIds },
        turnLog,
      );
      stepCount += 1;
    }

    const previousRound = state.turn.roundNumber;
    state = applyAndRecord(state, { type: "endTurn", actorId: active.id }, turnLog);
    stepCount += 1;
    completedTurns += 1;
    if (state.turn.roundNumber !== previousRound || state.turn.endGame.status === "ended") {
      roundSummaries.push(snapshot(state));
    }
  }

  history.push(turnLog);
}

const report = {
  seed,
  totalPlayers,
  startPlayer,
  maxSteps,
  result: {
    ended: state.turn.endGame.status === "ended",
    steps: stepCount,
    turns: completedTurns,
    rounds: state.turn.roundNumber,
    endGame: state.turn.endGame,
    winners:
      state.turn.endGame.status === "ended"
        ? state.turn.endGame.winnerIds.map((id) => actorName(getPlayer(state, id)))
        : [],
  },
  initial,
  final: finalSnapshot(state),
  roundSummaries,
  history,
};

if (outputPath) {
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ output: outputPath, result: report.result, final: report.final }, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (state.turn.endGame.status !== "ended") {
  process.exitCode = 1;
}
`;

try {
  await build({
    stdin: {
      contents: entry,
      resolveDir: process.cwd(),
      sourcefile: "game-entry.ts",
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
