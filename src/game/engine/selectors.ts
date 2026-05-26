import { fixtureCatalog } from "../content/catalog";
import type {
  CardInstanceId,
  CharacterRequirement,
  ContentCatalog,
  GameAction,
  GameState,
  LegalAction,
  PearlValue,
  PlayerId,
  PlayerState,
} from "./types";

type PearlEntry = { id: CardInstanceId; value: PearlValue };

export function getActivePlayer(state: GameState): PlayerState {
  const player = state.players.find((candidate) => candidate.id === state.turn.activePlayerId);
  if (!player) {
    throw new Error(`Missing active player: ${state.turn.activePlayerId}`);
  }
  return player;
}

export function getPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Missing player: ${playerId}`);
  }
  return player;
}

export function getPlayerPower(
  state: GameState,
  playerId: PlayerId,
  catalog: ContentCatalog = fixtureCatalog,
): number {
  const player = getPlayer(state, playerId);
  return player.activatedCharacters.reduce((total, cardId) => {
    const instance = state.cardsById[cardId];
    const definition = catalog.characterCards[instance.definitionId];
    return total + (typeof definition?.power === "number" ? definition.power : 0);
  }, 0);
}

export function getHandLimit(_state: GameState, _playerId: PlayerId): number {
  return 5;
}

export function getCardLabel(
  state: GameState,
  cardId: CardInstanceId,
  catalog: ContentCatalog = fixtureCatalog,
): string {
  const instance = state.cardsById[cardId];
  const pearl = catalog.pearlCards[instance.definitionId];
  if (pearl) {
    return `진주 ${pearl.value}`;
  }

  const character = catalog.characterCards[instance.definitionId];
  if (character) {
    return character.name;
  }

  if (instance.definitionId === "gate-card") {
    return "관문 카드";
  }

  return instance.definitionId;
}

export function getLegalActions(state: GameState, playerId: PlayerId): LegalAction[] {
  if (state.turn.phase !== "action") {
    return [{ type: "disabled", actorId: playerId, reason: "Not in action phase." }];
  }

  if (state.turn.activePlayerId !== playerId) {
    return [{ type: "disabled", actorId: playerId, reason: "Not this player's turn." }];
  }

  if (state.turn.actionsRemaining === 0) {
    return [{ type: "endTurn", actorId: playerId }];
  }

  const player = getPlayer(state, playerId);
  const actions: GameAction[] = [];

  state.market.pearlMarket.forEach((_cardId, marketIndex) => {
    actions.push({ type: "gainPearlFromMarket", actorId: playerId, marketIndex });
  });

  if (state.pearlDeck.drawPile.length > 0) {
    actions.push({ type: "gainPearlFromDeck", actorId: playerId });
  }

  actions.push({ type: "refreshPearlMarket", actorId: playerId });

  state.market.characterMarket.forEach((_cardId, marketIndex) => {
    if (player.gateCharacters.length < 2) {
      actions.push({ type: "placeCharacterFromMarket", actorId: playerId, marketIndex });
      return;
    }

    player.gateCharacters.forEach((discardGateCharacterId) => {
      actions.push({
        type: "placeCharacterFromMarket",
        actorId: playerId,
        marketIndex,
        discardGateCharacterId,
      });
    });
  });

  if (state.characterDeck.drawPile.length > 0) {
    if (player.gateCharacters.length < 2) {
      actions.push({ type: "placeCharacterFromDeck", actorId: playerId });
    } else {
      player.gateCharacters.forEach((discardGateCharacterId) => {
        actions.push({ type: "placeCharacterFromDeck", actorId: playerId, discardGateCharacterId });
      });
    }
  }

  for (const characterInstanceId of player.gateCharacters) {
    for (const payment of getPaymentPlans(state, playerId, characterInstanceId)) {
      actions.push({
        type: "activateGateCharacter",
        actorId: playerId,
        characterInstanceId,
        payment,
      });
    }
  }

  return actions;
}

export function canPayRequirement(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
): boolean {
  return getPaymentPlans(state, playerId, characterInstanceId).length > 0;
}

export function getPaymentPlans(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
) {
  const pearlIds = findPaymentForCharacter(state, playerId, characterInstanceId);
  return pearlIds ? [{ pearlIds, diamondUses: [] }] : [];
}

function getHandPearls(
  state: GameState,
  playerId: PlayerId,
  catalog: ContentCatalog,
): PearlEntry[] {
  const player = getPlayer(state, playerId);
  const entries: PearlEntry[] = [];
  for (const cardId of player.pearlHand) {
    const instance = state.cardsById[cardId];
    const pearl = catalog.pearlCards[instance.definitionId];
    if (pearl) {
      entries.push({ id: cardId, value: pearl.value });
    }
  }
  return entries;
}

function findExactValues(hand: PearlEntry[], values: PearlValue[]): CardInstanceId[] | null {
  const remaining = [...hand];
  const picked: CardInstanceId[] = [];
  for (const value of values) {
    const index = remaining.findIndex((entry) => entry.value === value);
    if (index === -1) {
      return null;
    }
    picked.push(remaining[index].id);
    remaining.splice(index, 1);
  }
  return picked;
}

function findCombinationBySum(
  hand: PearlEntry[],
  total: number,
  fixedCount: number | undefined,
): CardInstanceId[] | null {
  const sorted = [...hand].sort((left, right) => right.value - left.value);

  function search(startIndex: number, sumSoFar: number, picked: PearlEntry[]): PearlEntry[] | null {
    if (sumSoFar === total && (fixedCount === undefined || picked.length === fixedCount)) {
      return picked;
    }
    if (sumSoFar > total) {
      return null;
    }
    if (fixedCount !== undefined && picked.length >= fixedCount) {
      return null;
    }
    for (let index = startIndex; index < sorted.length; index += 1) {
      const next = search(index + 1, sumSoFar + sorted[index].value, [...picked, sorted[index]]);
      if (next) {
        return next;
      }
    }
    return null;
  }

  const result = search(0, 0, []);
  return result ? result.map((entry) => entry.id) : null;
}

function findSequence(hand: PearlEntry[], count: number): CardInstanceId[] | null {
  const byValue = new Map<PearlValue, PearlEntry>();
  for (const entry of hand) {
    if (!byValue.has(entry.value)) {
      byValue.set(entry.value, entry);
    }
  }
  for (let start = 1; start + count - 1 <= 8; start += 1) {
    const picked: PearlEntry[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      const value = (start + offset) as PearlValue;
      const entry = byValue.get(value);
      if (!entry) {
        break;
      }
      picked.push(entry);
    }
    if (picked.length === count) {
      return picked.map((entry) => entry.id);
    }
  }
  return null;
}

function findSameValue(hand: PearlEntry[], count: number): CardInstanceId[] | null {
  const buckets = new Map<PearlValue, PearlEntry[]>();
  for (const entry of hand) {
    const bucket = buckets.get(entry.value) ?? [];
    bucket.push(entry);
    buckets.set(entry.value, bucket);
  }
  for (const bucket of buckets.values()) {
    if (bucket.length >= count) {
      return bucket.slice(0, count).map((entry) => entry.id);
    }
  }
  return null;
}

function findParityCount(
  hand: PearlEntry[],
  count: number,
  parity: "odd" | "even",
): CardInstanceId[] | null {
  const matching = hand.filter((entry) =>
    parity === "odd" ? entry.value % 2 === 1 : entry.value % 2 === 0,
  );
  if (matching.length < count) {
    return null;
  }
  return matching.slice(0, count).map((entry) => entry.id);
}

export function findPaymentForCharacter(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
  catalog: ContentCatalog = fixtureCatalog,
): CardInstanceId[] | null {
  const instance = state.cardsById[characterInstanceId];
  if (!instance) {
    return null;
  }
  const definition = catalog.characterCards[instance.definitionId];
  if (!definition) {
    return null;
  }
  const requirement: CharacterRequirement = definition.requirement;
  const hand = getHandPearls(state, playerId, catalog);

  switch (requirement.type) {
    case "exactValues":
      return findExactValues(hand, requirement.values);
    case "sum":
      return findCombinationBySum(hand, requirement.total, requirement.count);
    case "sequence":
      return findSequence(hand, requirement.count);
    case "sameValue":
      return findSameValue(hand, requirement.count);
    case "odd":
      return findParityCount(hand, requirement.count, "odd");
    case "even":
      return findParityCount(hand, requirement.count, "even");
    case "custom": {
      const exact = parseExactValuesFromLabel(requirement.label);
      if (exact) {
        return findExactValues(hand, exact);
      }
      return null;
    }
  }
}

function parseExactValuesFromLabel(label: string): PearlValue[] | null {
  const trimmed = label.trim();
  if (!/^[1-8]+$/.test(trimmed)) {
    return null;
  }
  return trimmed.split("").map((digit) => Number(digit) as PearlValue);
}

export function getVisibleStateForActor(state: GameState, _playerId: PlayerId): GameState {
  return state;
}

export function getWinnerCandidates(state: GameState): PlayerState[] {
  return [...state.players].sort((left, right) => {
    const rightPower = getPlayerPower(state, right.id);
    const leftPower = getPlayerPower(state, left.id);
    if (rightPower !== leftPower) {
      return rightPower - leftPower;
    }
    return right.diamonds.length - left.diamonds.length;
  });
}

export function isGameOver(state: GameState): boolean {
  return state.turn.endGame.status === "ended";
}
