import { fixtureCatalog } from "../content/catalog";
import {
  DISCARD_OPPONENT_GATE_IDS,
  DISCARD_REDRAW_HAND_IDS,
  DOWN_DIAMOND_IDS,
  DRAW_DIAMOND_BY_TWO_IDS,
  HAND_LIMIT_BONUS_IDS,
  IMMEDIATE_EXTRA_ACTION_IDS,
  NEXT_PLAYER_ACTION_BONUS_IDS,
  ONE_AS_EIGHT_IDS,
  PEEK_CHARACTER_DECK_IDS,
  RECLAIM_USED_PEARL_IDS,
  STEAL_HAND_IDS,
  SWAP_GATE_MARKET_IDS,
  THREE_AS_ANY_IDS,
  TURN_ACTION_BONUS_IDS,
  VIRTUAL_PEARL_VALUE_BY_DEFINITION,
  WISP_IDS,
} from "../engine/abilities";
import {
  findPaymentForCharacter,
  getActivatableGateCharacters,
  getHandLimit,
  getPaymentPlans,
  getPlayer,
  getUsableAbilityActions,
} from "../engine/selectors";
import type {
  CardInstanceId,
  CharacterCardDefinition,
  GameAction,
  GameState,
  PaymentPlan,
  PearlCardDefinition,
  PearlValue,
  PlayerId,
  PlayerState,
} from "../engine/types";

const PEARL_VALUES: PearlValue[] = [1, 2, 3, 4, 5, 6, 7, 8];
type StrategyStage = "engine" | "tempo" | "endgame";

export function chooseAiAction(state: GameState, actorId: PlayerId): GameAction {
  const player = getPlayer(state, actorId);

  if (state.turn.actionsRemaining === 0) {
    const ability = chooseAbility(state, player, "afterActions");
    if (ability) {
      return ability;
    }
    return { type: "endTurn", actorId };
  }

  const startAbility = chooseAbility(state, player, "startOfTurn");
  if (startAbility) {
    return startAbility;
  }

  const activation = chooseActivation(state, player);
  if (activation) {
    return activation;
  }

  const utilityAbility = chooseAbility(state, player, "duringTurn");
  if (utilityAbility) {
    return utilityAbility;
  }

  if (player.gateCharacters.length < 2) {
    const placement = choosePlacement(state, player);
    if (placement) {
      return placement;
    }
  }

  const pearl = choosePearlGain(state, player);
  if (pearl) {
    return pearl;
  }

  if (shouldRefreshPearlMarket(state, player)) {
    return { type: "refreshPearlMarket", actorId };
  }

  if (state.pearlDeck.drawPile.length > 0 && player.pearlHand.length < 5) {
    return { type: "gainPearlFromDeck", actorId };
  }

  if (state.characterDeck.drawPile.length > 0 && player.gateCharacters.length < 2) {
    return { type: "placeCharacterFromDeck", actorId };
  }

  if (player.gateCharacters.length >= 2) {
    const replacement = choosePlacement(state, player);
    if (replacement) {
      return replacement;
    }
  }

  return { type: "refreshPearlMarket", actorId };
}

function chooseAbility(
  state: GameState,
  player: PlayerState,
  window: "startOfTurn" | "duringTurn" | "afterActions",
): GameAction | null {
  const actions = getUsableAbilityActions(state, player.id).filter(
    (action): action is Extract<GameAction, { type: "useAbility" }> => action.type === "useAbility",
  );
  if (actions.length === 0) return null;

  if (window === "afterActions") {
    return (
      actions.find(
        (action) =>
          sourceDefinitionId(state, action)?.startsWith("character-302-") &&
          shouldRedrawHandAfterActions(state, player),
      ) ?? null
    );
  }

  if (window === "startOfTurn") {
    const swap = actions.find(
      (action) =>
        sourceDefinitionId(state, action)?.startsWith("character-700-") &&
        isBeneficialSwap(state, player),
    );
    if (swap) return swap;

    return (
      actions.find((action) => sourceDefinitionId(state, action)?.startsWith("character-402-")) ??
      null
    );
  }

  return (
    actions.find(
      (action) =>
        sourceDefinitionId(state, action)?.startsWith("character-806-") &&
        shouldUsePearlTwoForDiamond(state, player),
    ) ?? null
  );
}

function shouldRedrawHandAfterActions(state: GameState, player: PlayerState): boolean {
  if (player.pearlHand.length < 3) return false;
  if (player.gateCharacters.some((cardId) => getPaymentPlans(state, player.id, cardId).length > 0)) {
    return false;
  }

  const need = pearlNeedScores(state, player);
  const usefulCards = player.pearlHand.filter((cardId) => {
    const value = pearlValueOf(state, cardId);
    return value !== null && (need[value] ?? 0) > 0;
  }).length;
  if (usefulCards <= 1 && player.pearlHand.length >= 4) return true;
  return player.pearlHand.length > getHandLimit(state, player.id);
}

function sourceDefinitionId(
  state: GameState,
  action: Extract<GameAction, { type: "useAbility" }>,
): string | null {
  const sourceCardId = action.choices.sourceCardId;
  if (typeof sourceCardId !== "string") return null;
  return state.cardsById[sourceCardId]?.definitionId ?? null;
}

function isBeneficialSwap(state: GameState, player: PlayerState): boolean {
  if (player.gateCharacters.length === 0 || state.market.characterMarket.length === 0) {
    return false;
  }
  const weakestGate = [...player.gateCharacters]
    .map((cardId) => ({ cardId, score: placementScore(state, player, cardId) }))
    .sort((left, right) => left.score - right.score)[0];
  const bestMarket = state.market.characterMarket
    .map((cardId) => ({ cardId, score: placementScore(state, player, cardId) }))
    .sort((left, right) => right.score - left.score)[0];
  return Boolean(bestMarket && weakestGate && bestMarket.score > weakestGate.score + 0.5);
}

function shouldUsePearlTwoForDiamond(state: GameState, player: PlayerState): boolean {
  const twos = player.pearlHand.filter((cardId) => pearlValueOf(state, cardId) === 2);
  if (twos.length === 0) return false;
  if (twos.length >= 2) return true;
  if (player.pearlHand.length > getHandLimit(state, player.id)) return true;
  const need = pearlNeedScores(state, player);
  return (need[2] ?? 0) <= 0;
}

export function choosePearlsToDiscardToLimit(
  state: GameState,
  actorId: PlayerId,
): CardInstanceId[] {
  const player = getPlayer(state, actorId);
  const excess = Math.max(0, player.pearlHand.length - getHandLimit(state, actorId));
  if (excess === 0) {
    return [];
  }

  const need = pearlNeedScores(state, player);
  return [...player.pearlHand]
    .sort((left, right) => pearlKeepScore(state, left, need) - pearlKeepScore(state, right, need))
    .slice(0, excess);
}

function chooseActivation(state: GameState, player: PlayerState): GameAction | null {
  type Candidate = {
    characterId: CardInstanceId;
    payment: PaymentPlan;
    score: number;
  };

  const candidates: Candidate[] = [];
  for (const characterId of getActivatableGateCharacters(state, player.id)) {
    const payment = getPaymentPlans(state, player.id, characterId)[0];
    if (!payment) continue;

    const definition = getCharacterDefinition(state, characterId);
    if (!definition) continue;

    const score = activationScore(state, player, characterId, payment);
    candidates.push({ characterId, payment, score });
  }

  if (candidates.length === 0) return null;

  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  return {
    type: "activateGateCharacter",
    actorId: player.id,
    characterInstanceId: best.characterId,
    payment: best.payment,
  };
}

function activationScore(
  state: GameState,
  player: PlayerState,
  characterId: CardInstanceId,
  payment: PaymentPlan,
): number {
  const definition = getCharacterDefinition(state, characterId);
  if (!definition) return 0;

  const stage = strategyStage(state, player);
  const power = typeof definition.power === "number" ? definition.power : 0;
  const diamond = typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
  const currentPower = playerPower(state, player);
  const reachesEndGame = currentPower < 12 && currentPower + power >= 12;
  const definitionId = definition.id;

  let score =
    power * (stage === "endgame" ? 15 : 9) +
    diamond * (stage === "endgame" ? 8 : 5) +
    effectValue(state, player, definitionId, stage, "activation") -
    paymentCost(payment, stage);

  if (stage === "engine" && isEngineDefinition(definitionId)) {
    score += 16;
  }
  if (IMMEDIATE_EXTRA_ACTION_IDS.has(definitionId)) {
    score += state.turn.actionsRemaining <= 1 ? 12 : 7;
  }
  if (reachesEndGame) {
    const diamondLead = player.diamonds.length + diamond - maxOpponentDiamonds(state, player.id);
    score += diamondLead >= 0 ? 18 + diamondLead * 2 : 8 + diamondLead * 3;
  }
  if (state.turn.endGame.status !== "notTriggered") {
    score += power * 5 + diamond * 6;
  }

  return score;
}

function paymentCost(payment: PaymentPlan, stage: StrategyStage): number {
  const diamondCost = stage === "endgame" ? 4 : 2;
  return (
    payment.pearlIds.length * 0.8 +
    payment.diamondUses.length * diamondCost +
    (payment.spentDiamondIds?.length ?? 0) * (stage === "endgame" ? 5 : 2.5) -
    (payment.virtualPearls?.length ?? 0) * 0.7 -
    (payment.pearlValueOverrides?.length ?? 0) * 0.3
  );
}

function choosePlacement(state: GameState, player: PlayerState): GameAction | null {
  const marketIndexed = state.market.characterMarket
    .map((cardId, marketIndex) => ({ cardId, marketIndex }))
    .filter((entry) => Boolean(entry.cardId));

  if (marketIndexed.length === 0) return null;

  const ranked = marketIndexed
    .map((entry) => ({
      ...entry,
      score: placementScore(state, player, entry.cardId),
      payable: Boolean(findPaymentForCharacter(state, player.id, entry.cardId)),
    }))
    .sort((left, right) => right.score - left.score);

  const bestMarket = ranked[0];

  if (player.gateCharacters.length < 2) {
    if (bestMarket.score <= 0 && !bestMarket.payable) return null;
    return {
      type: "placeCharacterFromMarket",
      actorId: player.id,
      marketIndex: bestMarket.marketIndex,
    };
  }

  const gateRanked = [...player.gateCharacters]
    .map((cardId) => ({
      cardId,
      score: placementScore(state, player, cardId),
      payable: Boolean(findPaymentForCharacter(state, player.id, cardId)),
    }))
    .sort((left, right) => left.score - right.score);
  const weakestGate = gateRanked[0];
  const gateHasPayable = gateRanked.some((g) => g.payable);
  const stage = strategyStage(state, player);

  if (!gateHasPayable && bestMarket.payable) {
    return {
      type: "placeCharacterFromMarket",
      actorId: player.id,
      marketIndex: bestMarket.marketIndex,
      discardGateCharacterId: weakestGate.cardId,
    };
  }

  const replacementThreshold = weakestGate.payable && !bestMarket.payable ? 8 : stage === "engine" ? 4 : 2.5;
  if (bestMarket.score > weakestGate.score + replacementThreshold) {
    return {
      type: "placeCharacterFromMarket",
      actorId: player.id,
      marketIndex: bestMarket.marketIndex,
      discardGateCharacterId: weakestGate.cardId,
    };
  }

  return null;
}

function placementScore(state: GameState, player: PlayerState, cardId: CardInstanceId): number {
  const definition = getCharacterDefinition(state, cardId);
  if (!definition) return 0;

  const stage = strategyStage(state, player);
  const payable = getPaymentPlans(state, player.id, cardId)[0] ?? null;
  const progress = requirementProgressScore(state, player, cardId);
  const power = typeof definition.power === "number" ? definition.power : 0;
  const diamond = typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
  const requirement = requirementProfile(definition);
  const hardUnpayablePenalty =
    !payable && stage === "engine" && requirement.count >= 4 ? requirement.difficulty * 1.2 : 0;

  return (
    power * (stage === "endgame" ? 3 : 1.2) +
    diamond * (stage === "endgame" ? 2.5 : 1.2) +
    effectValue(state, player, definition.id, stage, "placement") +
    (payable ? (stage === "engine" ? 8 : 5) : 0) +
    progress -
    hardUnpayablePenalty
  );
}

function strategyStage(state: GameState, player: PlayerState): StrategyStage {
  if (state.turn.endGame.status !== "notTriggered" || playerPower(state, player) >= 10) {
    return "endgame";
  }
  const engineCount = player.activatedCharacters.filter((cardId) => {
    const definitionId = state.cardsById[cardId]?.definitionId;
    return definitionId ? isEngineDefinition(definitionId) : false;
  }).length;
  if (engineCount >= 2 || playerPower(state, player) >= 5) {
    return "tempo";
  }
  return "engine";
}

function effectValue(
  state: GameState,
  player: PlayerState,
  definitionId: string,
  stage: StrategyStage,
  context: "placement" | "activation",
): number {
  const activationMultiplier = context === "activation" ? 1.35 : 1;
  let value = 0;

  if (TURN_ACTION_BONUS_IDS.has(definitionId)) value += stage === "endgame" ? 18 : 24;
  if (VIRTUAL_PEARL_VALUE_BY_DEFINITION[definitionId] === "any") value += stage === "engine" ? 22 : 15;
  else if (VIRTUAL_PEARL_VALUE_BY_DEFINITION[definitionId]) value += stage === "engine" ? 11 : 7;
  if (THREE_AS_ANY_IDS.has(definitionId)) value += stage === "engine" ? 18 : 12;
  if (ONE_AS_EIGHT_IDS.has(definitionId)) value += stage === "engine" ? 10 : 7;
  if (HAND_LIMIT_BONUS_IDS.has(definitionId)) value += stage === "engine" ? 9 : 5;
  if (DISCARD_REDRAW_HAND_IDS.has(definitionId)) value += stage === "engine" ? 12 : 8;
  if (DOWN_DIAMOND_IDS.has(definitionId)) value += 9 + Math.min(4, player.diamonds.length) * 1.5;
  if (DRAW_DIAMOND_BY_TWO_IDS.has(definitionId)) value += stage === "endgame" ? 8 : 10;
  if (RECLAIM_USED_PEARL_IDS.has(definitionId)) value += 8;
  if (IMMEDIATE_EXTRA_ACTION_IDS.has(definitionId)) value += stage === "engine" ? 8 : 14;
  if (NEXT_PLAYER_ACTION_BONUS_IDS.has(definitionId)) value += 5;
  if (SWAP_GATE_MARKET_IDS.has(definitionId)) value += 5;
  if (PEEK_CHARACTER_DECK_IDS.has(definitionId)) value += 2;
  if (STEAL_HAND_IDS.has(definitionId)) value += hasOpponentPearls(state, player.id) ? 7 : 3;
  if (DISCARD_OPPONENT_GATE_IDS.has(definitionId)) value += hasOpponentGateCharacters(state, player.id) ? 9 : 3;
  if (WISP_IDS.has(definitionId)) value += 4;

  return value * activationMultiplier;
}

function isEngineDefinition(definitionId: string): boolean {
  return (
    TURN_ACTION_BONUS_IDS.has(definitionId) ||
    Boolean(VIRTUAL_PEARL_VALUE_BY_DEFINITION[definitionId]) ||
    THREE_AS_ANY_IDS.has(definitionId) ||
    ONE_AS_EIGHT_IDS.has(definitionId) ||
    HAND_LIMIT_BONUS_IDS.has(definitionId) ||
    DISCARD_REDRAW_HAND_IDS.has(definitionId) ||
    DOWN_DIAMOND_IDS.has(definitionId) ||
    DRAW_DIAMOND_BY_TWO_IDS.has(definitionId) ||
    RECLAIM_USED_PEARL_IDS.has(definitionId)
  );
}

function playerPower(state: GameState, player: PlayerState): number {
  return player.activatedCharacters.reduce((total, cardId) => {
    const definition = getCharacterDefinition(state, cardId);
    return total + (typeof definition?.power === "number" ? definition.power : 0);
  }, 0);
}

function maxOpponentDiamonds(state: GameState, playerId: PlayerId): number {
  return Math.max(
    0,
    ...state.players
      .filter((player) => player.id !== playerId)
      .map((player) => player.diamonds.length),
  );
}

function hasOpponentPearls(state: GameState, playerId: PlayerId): boolean {
  return state.players.some((player) => player.id !== playerId && player.pearlHand.length > 0);
}

function hasOpponentGateCharacters(state: GameState, playerId: PlayerId): boolean {
  return state.players.some((player) => player.id !== playerId && player.gateCharacters.length > 0);
}

function requirementProgressScore(
  state: GameState,
  player: PlayerState,
  characterId: CardInstanceId,
): number {
  const definition = getCharacterDefinition(state, characterId);
  if (!definition) return 0;
  const profile = requirementProfile(definition);
  const need = pearlContributionByRequirement(state, characterId, handCountsForPlayer(state, player));
  const missingWeight = Object.values(need).reduce((total, value) => total + (value ?? 0), 0);
  const progress = Math.max(0, profile.count - missingWeight);
  return progress * 1.5 - Math.max(0, missingWeight - 2) * 0.7;
}

function requirementProfile(definition: CharacterCardDefinition): {
  count: number;
  difficulty: number;
} {
  const requirement = definition.requirement;
  if (requirement.type === "exactValues") {
    return { count: requirement.values.length, difficulty: requirement.values.length };
  }
  if (
    requirement.type === "sameValue" ||
    requirement.type === "sequence" ||
    requirement.type === "odd" ||
    requirement.type === "even"
  ) {
    return { count: requirement.count, difficulty: requirement.count + 1 };
  }
  if (requirement.type === "sum") {
    return { count: requirement.count ?? 3, difficulty: (requirement.count ?? 3) + 1 };
  }
  return customRequirementProfile(requirement.label);
}

function customRequirementProfile(label: string): { count: number; difficulty: number } {
  const trimmed = label.trim();
  if (/^[1-8]+$/.test(trimmed)) return { count: trimmed.length, difficulty: trimmed.length };
  if (trimmed.includes("연속되는 카드 5장")) return { count: 5, difficulty: 7 };
  if (trimmed.includes("연속되는 카드 3장")) return { count: 3, difficulty: 4 };
  if (trimmed.includes("같은 카드 4장")) return { count: 4, difficulty: 7 };
  if (trimmed.includes("같은 카드 3장")) return { count: 3, difficulty: 5 };
  if (trimmed.includes("같은 카드 2장씩 두 벌")) return { count: 4, difficulty: 6 };
  if (trimmed.includes("같은 카드 2장 + 66") || trimmed.includes("같은 카드 2장 + 6카드 2장")) {
    return { count: 4, difficulty: 6 };
  }
  if (trimmed.includes("같은 카드 2장")) return { count: 2, difficulty: 3 };
  if (trimmed.includes("합하면 20") || trimmed.includes("합이 10")) return { count: 3, difficulty: 4 };
  if (trimmed.includes("합하면 7")) return { count: 3, difficulty: 4 };
  if (trimmed.includes("합하면 '10'")) return { count: 3, difficulty: 3 };
  if (trimmed.includes("홀수") || trimmed.includes("짝수")) return { count: 3, difficulty: 4 };
  if (trimmed === "333/666" || trimmed === "444/555") return { count: 3, difficulty: 5 };
  if (trimmed === "222+다이아몬드 1장") return { count: 3, difficulty: 5 };
  return { count: 3, difficulty: 4 };
}

function choosePearlGain(state: GameState, player: PlayerState): GameAction | null {
  const need = pearlNeedScores(state, player);
  const handLimit = getHandLimit(state, player.id);
  const handFull = player.pearlHand.length >= handLimit;
  const lowestCurrentKeepScore =
    player.pearlHand.length > 0
      ? Math.min(...player.pearlHand.map((cardId) => pearlKeepScore(state, cardId, need)))
      : -Infinity;
  const marketEntries = state.market.pearlMarket
    .map((cardId, marketIndex) => ({ cardId, marketIndex }))
    .filter((entry) => Boolean(entry.cardId))
    .map((entry) => {
      const value = pearlValueOf(state, entry.cardId);
      const score = value !== null ? (need[value] ?? 0) + value * 0.1 : 0;
      return { ...entry, score };
    })
    .filter((entry) => !handFull || entry.score > lowestCurrentKeepScore)
    .sort((left, right) => right.score - left.score);

  if (marketEntries.length === 0) return null;

  const best = marketEntries[0];
  if (best.score <= 0) return null;

  return {
    type: "gainPearlFromMarket",
    actorId: player.id,
    marketIndex: best.marketIndex,
  };
}

function shouldRefreshPearlMarket(state: GameState, player: PlayerState): boolean {
  if (player.pearlHand.length >= 4) return false;
  if (player.pearlHand.length < 3) return false;
  const need = pearlNeedScores(state, player);
  for (const cardId of state.market.pearlMarket) {
    const value = pearlValueOf(state, cardId);
    if (value === null) continue;
    if ((need[value] ?? 0) > 0) {
      return false;
    }
  }
  return state.market.pearlMarket.length > 0;
}

function pearlKeepScore(
  state: GameState,
  cardId: CardInstanceId,
  need: Partial<Record<PearlValue, number>>,
): number {
  const value = pearlValueOf(state, cardId);
  if (value === null) {
    return 0;
  }
  return (need[value] ?? 0) * 100 + value * 0.1;
}

function pearlNeedScores(state: GameState, player: PlayerState): Partial<Record<PearlValue, number>> {
  const handCounts = handCountsForPlayer(state, player);

  const need: Partial<Record<PearlValue, number>> = {};
  for (const characterId of player.gateCharacters) {
    const contribution = pearlContributionByRequirement(state, characterId, handCounts);
    for (const value of PEARL_VALUES) {
      const score = contribution[value] ?? 0;
      if (score > 0) {
        need[value] = Math.max(need[value] ?? 0, score);
      }
    }
  }
  return need;
}

function handCountsForPlayer(
  state: GameState,
  player: PlayerState,
): Partial<Record<PearlValue, number>> {
  const handCounts: Partial<Record<PearlValue, number>> = {};
  for (const cardId of player.pearlHand) {
    const value = pearlValueOf(state, cardId);
    if (value !== null) {
      handCounts[value] = (handCounts[value] ?? 0) + 1;
    }
  }
  return handCounts;
}

function pearlContributionByRequirement(
  state: GameState,
  characterId: CardInstanceId,
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const definition = getCharacterDefinition(state, characterId);
  const result: Partial<Record<PearlValue, number>> = {};
  if (!definition) return result;
  const requirement = definition.requirement;

  switch (requirement.type) {
    case "exactValues": {
      const want: Partial<Record<PearlValue, number>> = {};
      for (const value of requirement.values) {
        want[value] = (want[value] ?? 0) + 1;
      }
      for (const value of PEARL_VALUES) {
        const missing = Math.max(0, (want[value] ?? 0) - (handCounts[value] ?? 0));
        if (missing > 0) result[value] = missing;
      }
      return result;
    }
    case "sameValue": {
      let bestProgress = 0;
      let bestValue: PearlValue | null = null;
      for (const value of PEARL_VALUES) {
        const have = handCounts[value] ?? 0;
        if (have > bestProgress) {
          bestProgress = have;
          bestValue = value;
        }
      }
      const missing = Math.max(0, requirement.count - bestProgress);
      if (missing <= 0) return result;
      if (bestValue !== null) {
        result[bestValue] = missing + 1;
      }
      for (const value of PEARL_VALUES) {
        if (value === bestValue) continue;
        result[value] = Math.max(result[value] ?? 0, 0.4);
      }
      return result;
    }
    case "sequence": {
      const have = new Set<PearlValue>();
      for (const value of PEARL_VALUES) {
        if ((handCounts[value] ?? 0) > 0) have.add(value);
      }
      for (let start = 1; start + requirement.count - 1 <= 8; start += 1) {
        const missingValues: PearlValue[] = [];
        for (let offset = 0; offset < requirement.count; offset += 1) {
          const value = (start + offset) as PearlValue;
          if (!have.has(value)) missingValues.push(value);
        }
        if (missingValues.length === 0) continue;
        const weight = Math.max(0.4, 2 - missingValues.length);
        for (const value of missingValues) {
          result[value] = Math.max(result[value] ?? 0, weight);
        }
      }
      return result;
    }
    case "sum": {
      const total = requirement.total;
      const haveSum = sumOfHand(handCounts);
      const missing = Math.max(0, total - haveSum);
      if (missing <= 0) return result;
      for (const value of PEARL_VALUES) {
        if (value <= missing) {
          result[value] = Math.max(result[value] ?? 0, 1 - Math.abs(value - missing) / 8);
        } else {
          result[value] = Math.max(result[value] ?? 0, 0.2);
        }
      }
      return result;
    }
    case "odd":
    case "even": {
      const parityMatch = (value: PearlValue) =>
        requirement.type === "odd" ? value % 2 === 1 : value % 2 === 0;
      let have = 0;
      for (const value of PEARL_VALUES) {
        if (parityMatch(value)) {
          have += handCounts[value] ?? 0;
        }
      }
      const missing = Math.max(0, requirement.count - have);
      if (missing <= 0) return result;
      for (const value of PEARL_VALUES) {
        if (parityMatch(value)) {
          result[value] = Math.max(result[value] ?? 0, missing);
        }
      }
      return result;
    }
    case "custom":
      return customPearlContribution(requirement.label, handCounts);
  }
}

function customPearlContribution(
  label: string,
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const trimmed = label.trim();
  if (/^[1-8]+$/.test(trimmed)) {
    return exactPatternContribution(
      trimmed.split("").map((digit) => Number(digit) as PearlValue),
      handCounts,
    );
  }
  if (trimmed === "333/666") {
    return bestPatternContribution(
      [
        [3, 3, 3],
        [6, 6, 6],
      ],
      handCounts,
    );
  }
  if (trimmed === "444/555") {
    return bestPatternContribution(
      [
        [4, 4, 4],
        [5, 5, 5],
      ],
      handCounts,
    );
  }
  if (trimmed === "222+다이아몬드 1장") {
    return exactPatternContribution([2, 2, 2], handCounts);
  }
  if (trimmed === "같은 카드 2장 + 66" || trimmed === "같은 카드 2장 + 6카드 2장") {
    return bestPatternContribution(
      PEARL_VALUES.map((value) => [value, value, 6, 6] as PearlValue[]),
      handCounts,
    );
  }
  if (trimmed === "같은 카드 2장씩 두 벌") {
    const patterns: PearlValue[][] = [];
    for (let left = 0; left < PEARL_VALUES.length; left += 1) {
      for (let right = left + 1; right < PEARL_VALUES.length; right += 1) {
        patterns.push([
          PEARL_VALUES[left],
          PEARL_VALUES[left],
          PEARL_VALUES[right],
          PEARL_VALUES[right],
        ]);
      }
    }
    return bestPatternContribution(patterns, handCounts);
  }
  if (trimmed === "같은 카드 2장") return sameValueContribution(2, handCounts);
  if (trimmed === "같은 카드 3장") return sameValueContribution(3, handCounts);
  if (trimmed === "같은 카드 4장") return sameValueContribution(4, handCounts);
  if (trimmed === "연속되는 카드 3장") return sequenceContribution(3, handCounts);
  if (trimmed === "연속되는 카드 5장") return sequenceContribution(5, handCounts);
  if (trimmed === "홀수인 카드 3장") return parityContribution(3, "odd", handCounts);
  if (trimmed === "짝수인 카드 3장") return parityContribution(3, "even", handCounts);
  if (trimmed === "합하면 7이 되는 카드 3장") return sumContribution(7, 3, handCounts);
  if (trimmed === "합이 10이 되는 카드 3장") return sumContribution(10, 3, handCounts);
  if (trimmed === "합하면 20이 되는 카드 3장") return sumContribution(20, 3, handCounts);
  if (trimmed === "합하면 '10'이 되는 카드들") {
    return bestPatternContribution(
      [...sumPatterns(10, 2), ...sumPatterns(10, 3), ...sumPatterns(10, 4)],
      handCounts,
    );
  }
  return {};
}

function exactPatternContribution(
  pattern: PearlValue[],
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const want: Partial<Record<PearlValue, number>> = {};
  for (const value of pattern) {
    want[value] = (want[value] ?? 0) + 1;
  }
  const result: Partial<Record<PearlValue, number>> = {};
  for (const value of PEARL_VALUES) {
    const missing = Math.max(0, (want[value] ?? 0) - (handCounts[value] ?? 0));
    if (missing > 0) result[value] = missing;
  }
  return result;
}

function bestPatternContribution(
  patterns: PearlValue[][],
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  return patterns
    .map((pattern) => exactPatternContribution(pattern, handCounts))
    .sort((left, right) => contributionWeight(left) - contributionWeight(right))[0] ?? {};
}

function contributionWeight(contribution: Partial<Record<PearlValue, number>>): number {
  return PEARL_VALUES.reduce((total, value) => total + (contribution[value] ?? 0), 0);
}

function sameValueContribution(
  count: number,
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const bestValue = [...PEARL_VALUES].sort(
    (left, right) => (handCounts[right] ?? 0) - (handCounts[left] ?? 0),
  )[0];
  const missing = Math.max(0, count - (handCounts[bestValue] ?? 0));
  return missing > 0 ? { [bestValue]: missing } : {};
}

function sequenceContribution(
  count: number,
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const patterns: PearlValue[][] = [];
  for (let start = 1; start + count - 1 <= 8; start += 1) {
    patterns.push(Array.from({ length: count }, (_, index) => (start + index) as PearlValue));
  }
  return bestPatternContribution(patterns, handCounts);
}

function parityContribution(
  count: number,
  parity: "odd" | "even",
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  const values = PEARL_VALUES.filter((value) =>
    parity === "odd" ? value % 2 === 1 : value % 2 === 0,
  );
  const have = values.reduce((total, value) => total + (handCounts[value] ?? 0), 0);
  const missing = Math.max(0, count - have);
  if (missing === 0) return {};
  const best = [...values].sort((left, right) => (handCounts[right] ?? 0) - (handCounts[left] ?? 0))[0];
  return { [best]: missing };
}

function sumContribution(
  total: number,
  count: number,
  handCounts: Partial<Record<PearlValue, number>>,
): Partial<Record<PearlValue, number>> {
  return bestPatternContribution(sumPatterns(total, count), handCounts);
}

function sumPatterns(total: number, count: number): PearlValue[][] {
  const patterns: PearlValue[][] = [];
  function search(start: PearlValue, picked: PearlValue[], sum: number): void {
    if (picked.length === count) {
      if (sum === total) patterns.push(picked);
      return;
    }
    for (const value of PEARL_VALUES) {
      if (value < start) continue;
      if (sum + value > total) continue;
      search(value, [...picked, value], sum + value);
    }
  }
  search(1, [], 0);
  return patterns;
}

function sumOfHand(handCounts: Partial<Record<PearlValue, number>>): number {
  let total = 0;
  for (const value of PEARL_VALUES) {
    total += value * (handCounts[value] ?? 0);
  }
  return total;
}

function getCharacterDefinition(
  state: GameState,
  cardId: CardInstanceId,
): CharacterCardDefinition | null {
  const instance = state.cardsById[cardId];
  if (!instance) return null;
  return fixtureCatalog.characterCards[instance.definitionId] ?? null;
}

function pearlValueOf(state: GameState, cardId: CardInstanceId): PearlValue | null {
  const instance = state.cardsById[cardId];
  if (!instance) return null;
  const definition: PearlCardDefinition | undefined =
    fixtureCatalog.pearlCards[instance.definitionId];
  return definition?.value ?? null;
}
