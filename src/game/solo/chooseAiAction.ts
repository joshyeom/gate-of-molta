import { fixtureCatalog } from "../content/catalog";
import { findPaymentForCharacter, getPlayer } from "../engine/selectors";
import type {
  CardInstanceId,
  CharacterCardDefinition,
  GameAction,
  GameState,
  PearlCardDefinition,
  PearlValue,
  PlayerId,
  PlayerState,
} from "../engine/types";

const PEARL_VALUES: PearlValue[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function chooseAiAction(state: GameState, actorId: PlayerId): GameAction {
  if (state.turn.actionsRemaining === 0) {
    return { type: "endTurn", actorId };
  }

  const player = getPlayer(state, actorId);

  const activation = chooseActivation(state, player);
  if (activation) {
    return activation;
  }

  const placement = choosePlacement(state, player);
  if (placement) {
    return placement;
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

  if (
    state.characterDeck.drawPile.length > 0 &&
    player.gateCharacters.length === 2 &&
    !player.gateCharacters.some((cid) => findPaymentForCharacter(state, player.id, cid))
  ) {
    const weakest = [...player.gateCharacters].sort(
      (a, b) => characterValue(state, a) - characterValue(state, b),
    )[0];
    return {
      type: "placeCharacterFromDeck",
      actorId,
      discardGateCharacterId: weakest,
    };
  }

  return { type: "refreshPearlMarket", actorId };
}

function chooseActivation(state: GameState, player: PlayerState): GameAction | null {
  type Candidate = {
    characterId: CardInstanceId;
    pearlIds: CardInstanceId[];
    score: number;
  };

  const candidates: Candidate[] = [];
  for (const characterId of player.gateCharacters) {
    const pearlIds = findPaymentForCharacter(state, player.id, characterId);
    if (!pearlIds) continue;

    const definition = getCharacterDefinition(state, characterId);
    if (!definition) continue;

    const power = typeof definition.power === "number" ? definition.power : 0;
    const diamond =
      typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
    const score = power * 10 + diamond * 4;
    candidates.push({ characterId, pearlIds, score });
  }

  if (candidates.length === 0) return null;

  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  return {
    type: "activateGateCharacter",
    actorId: player.id,
    characterInstanceId: best.characterId,
    payment: { pearlIds: best.pearlIds, diamondUses: [] },
  };
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

  if (!gateHasPayable && bestMarket.payable) {
    return {
      type: "placeCharacterFromMarket",
      actorId: player.id,
      marketIndex: bestMarket.marketIndex,
      discardGateCharacterId: weakestGate.cardId,
    };
  }

  if (bestMarket.score > weakestGate.score + 0.5) {
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
  const base = characterValue(state, cardId);
  const payable = findPaymentForCharacter(state, player.id, cardId);
  const payableBonus = payable ? 2 : 0;
  return base + payableBonus;
}

function choosePearlGain(state: GameState, player: PlayerState): GameAction | null {
  if (player.pearlHand.length >= 5) return null;

  const need = pearlNeedScores(state, player);
  const marketEntries = state.market.pearlMarket
    .map((cardId, marketIndex) => ({ cardId, marketIndex }))
    .filter((entry) => Boolean(entry.cardId))
    .map((entry) => {
      const value = pearlValueOf(state, entry.cardId);
      const score = value !== null ? (need[value] ?? 0) + value * 0.1 : 0;
      return { ...entry, score };
    })
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

function pearlNeedScores(state: GameState, player: PlayerState): Partial<Record<PearlValue, number>> {
  const handCounts: Partial<Record<PearlValue, number>> = {};
  for (const cardId of player.pearlHand) {
    const value = pearlValueOf(state, cardId);
    if (value !== null) {
      handCounts[value] = (handCounts[value] ?? 0) + 1;
    }
  }

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
      return result;
  }
}

function sumOfHand(handCounts: Partial<Record<PearlValue, number>>): number {
  let total = 0;
  for (const value of PEARL_VALUES) {
    total += value * (handCounts[value] ?? 0);
  }
  return total;
}

function characterValue(state: GameState, cardId: CardInstanceId): number {
  const definition = getCharacterDefinition(state, cardId);
  if (!definition) return 0;
  const power = typeof definition.power === "number" ? definition.power : 0;
  const diamond =
    typeof definition.diamondReward === "number" ? definition.diamondReward : 0;
  return power + diamond * 0.5;
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
