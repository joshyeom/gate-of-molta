import { fixtureCatalog } from "../content/catalog";
import {
  areAdjacentSeats,
  DISCARD_REDRAW_HAND_IDS,
  DRAW_DIAMOND_BY_TWO_IDS,
  DOWN_DIAMOND_IDS,
  getDefinitionId,
  HAND_LIMIT_BONUS_IDS,
  isWisp,
  ONE_AS_EIGHT_IDS,
  PEEK_CHARACTER_DECK_IDS,
  SWAP_GATE_MARKET_IDS,
  THREE_AS_ANY_IDS,
  TURN_ACTION_BONUS_IDS,
  USE_ABILITY_DEFINITION_IDS,
  VIRTUAL_PEARL_VALUE_BY_DEFINITION,
} from "./abilities";
import type {
  CardInstanceId,
  CharacterRequirement,
  ContentCatalog,
  DiamondUse,
  GameAction,
  GameState,
  LegalAction,
  PaymentPlan,
  PearlValue,
  PearlValueOverride,
  PlayerId,
  PlayerState,
  VirtualPearlUse,
} from "./types";

type PearlEntry = { id: CardInstanceId; value: PearlValue };
type PaymentToken = {
  key: string;
  value: PearlValue;
  pearlId?: CardInstanceId;
  diamondUse?: DiamondUse;
  spentDiamondId?: CardInstanceId;
  override?: PearlValueOverride;
  virtualPearl?: VirtualPearlUse;
  cost: number;
};

const PEARL_VALUES: PearlValue[] = [1, 2, 3, 4, 5, 6, 7, 8];
const MAX_PAYMENT_PLANS = 12;

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

export function getHandLimit(state: GameState, playerId: PlayerId): number {
  const bonus = getReadyActivatedDefinitionIds(state, playerId).filter((definitionId) =>
    HAND_LIMIT_BONUS_IDS.has(definitionId),
  ).length;
  return 5 + bonus;
}

export function getTurnActionCount(state: GameState, playerId: PlayerId): number {
  const persistent = getReadyActivatedDefinitionIds(state, playerId).filter((definitionId) =>
    hasTurnActionBonus(definitionId),
  ).length;
  return 3 + persistent + (state.turn.actionBonuses[playerId] ?? 0);
}

function hasTurnActionBonus(definitionId: string): boolean {
  return TURN_ACTION_BONUS_IDS.has(definitionId);
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

  const player = getPlayer(state, playerId);
  const actions: GameAction[] = [];

  for (const useAbility of getUsableAbilityActions(state, playerId)) {
    actions.push(useAbility);
  }

  if (state.turn.actionsRemaining === 0) {
    actions.push({ type: "endTurn", actorId: playerId });
    return actions;
  }

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

  for (const characterInstanceId of getActivatableGateCharacters(state, playerId)) {
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

export function getUsableAbilityActions(state: GameState, playerId: PlayerId): GameAction[] {
  const player = getPlayer(state, playerId);
  const actions: GameAction[] = [];
  for (const sourceCardId of player.activatedCharacters) {
    if (isActivatedThisTurn(state, sourceCardId)) continue;
    const definitionId = getDefinitionId(state, sourceCardId);
    const definition = definitionId ? fixtureCatalog.characterCards[definitionId] : null;
    const ability = definition?.abilities[0];
    if (!definitionId || !ability || !USE_ABILITY_DEFINITION_IDS.has(definitionId)) continue;
    if (state.turn.usedAbilityIds.includes(ability.id)) continue;
    if (!canUseAbilityNow(state, playerId, definitionId)) continue;
    actions.push({
      type: "useAbility",
      actorId: playerId,
      abilityId: ability.id,
      choices: { sourceCardId },
    });
  }
  return actions;
}

function getReadyActivatedDefinitionIds(state: GameState, playerId: PlayerId): string[] {
  const player = getPlayer(state, playerId);
  return player.activatedCharacters
    .filter((cardId) => !isActivatedThisTurn(state, cardId))
    .map((cardId) => getDefinitionId(state, cardId))
    .filter((definitionId): definitionId is string => Boolean(definitionId));
}

function getReadyActivatedAbilitySources(
  state: GameState,
  playerId: PlayerId,
  definitionIds: Set<string>,
): CardInstanceId[] {
  const player = getPlayer(state, playerId);
  return player.activatedCharacters.filter((cardId) => {
    if (isActivatedThisTurn(state, cardId)) return false;
    const definitionId = getDefinitionId(state, cardId);
    return Boolean(definitionId && definitionIds.has(definitionId));
  });
}

function isActivatedThisTurn(state: GameState, cardId: CardInstanceId): boolean {
  return state.turn.activatedThisTurn.includes(cardId);
}

function canUseAbilityNow(
  state: GameState,
  playerId: PlayerId,
  definitionId: string,
): boolean {
  const player = getPlayer(state, playerId);
  if (DISCARD_REDRAW_HAND_IDS.has(definitionId)) {
    return state.turn.actionsRemaining === 0 && player.pearlHand.length > 0;
  }
  if (DRAW_DIAMOND_BY_TWO_IDS.has(definitionId)) {
    return (
      state.characterDeck.drawPile.length > 0 &&
      player.pearlHand.some((cardId) => pearlValueOf(state, cardId) === 2)
    );
  }
  if (PEEK_CHARACTER_DECK_IDS.has(definitionId)) {
    return state.turn.actionsRemaining === getTurnActionCount(state, playerId);
  }
  if (SWAP_GATE_MARKET_IDS.has(definitionId)) {
    return (
      state.turn.actionsRemaining === getTurnActionCount(state, playerId) &&
      player.gateCharacters.length > 0 &&
      state.market.characterMarket.length > 0
    );
  }
  return false;
}

export function getActivatableGateCharacters(
  state: GameState,
  playerId: PlayerId,
): CardInstanceId[] {
  const player = getPlayer(state, playerId);
  const own = [...player.gateCharacters];
  const adjacentWisps = state.players
    .filter((candidate) => candidate.id !== playerId && areAdjacentSeats(state, playerId, candidate.id))
    .flatMap((candidate) => candidate.gateCharacters)
    .filter((cardId) => isWisp(state, cardId));
  return [...own, ...adjacentWisps];
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
  catalog: ContentCatalog = fixtureCatalog,
): PaymentPlan[] {
  return findPaymentPlansForCharacter(state, playerId, characterInstanceId, catalog);
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

export function findPaymentForCharacter(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
  catalog: ContentCatalog = fixtureCatalog,
): CardInstanceId[] | null {
  return findPaymentPlanForCharacter(state, playerId, characterInstanceId, catalog)?.pearlIds ?? null;
}

function findPaymentPlanForCharacter(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
  catalog: ContentCatalog = fixtureCatalog,
): PaymentPlan | null {
  return findPaymentPlansForCharacter(state, playerId, characterInstanceId, catalog)[0] ?? null;
}

function findPaymentPlansForCharacter(
  state: GameState,
  playerId: PlayerId,
  characterInstanceId: CardInstanceId,
  catalog: ContentCatalog = fixtureCatalog,
): PaymentPlan[] {
  const instance = state.cardsById[characterInstanceId];
  if (!instance) {
    return [];
  }
  const definition = catalog.characterCards[instance.definitionId];
  if (!definition) {
    return [];
  }
  const requirement: CharacterRequirement = definition.requirement;
  const tokens = buildPaymentTokens(state, playerId, catalog);

  switch (requirement.type) {
    case "exactValues":
      return findExactValuePlans(tokens, requirement.values);
    case "sum":
      return findSumPlans(tokens, requirement.total, requirement.count);
    case "sequence":
      return findSequencePlans(tokens, requirement.count);
    case "sameValue":
      return findSameValuePlans(tokens, requirement.count);
    case "odd":
      return findParityPlans(tokens, requirement.count, "odd");
    case "even":
      return findParityPlans(tokens, requirement.count, "even");
    case "custom":
      return findCustomPlans(state, playerId, tokens, requirement.label);
  }
}

function buildPaymentTokens(
  state: GameState,
  playerId: PlayerId,
  catalog: ContentCatalog,
): PaymentToken[] {
  const player = getPlayer(state, playerId);
  const hand = getHandPearls(state, playerId, catalog);
  const tokens: PaymentToken[] = [];
  const allowDownDiamond =
    getReadyActivatedAbilitySources(state, playerId, DOWN_DIAMOND_IDS).length > 0;
  const threeAsAnySources = getReadyActivatedAbilitySources(state, playerId, THREE_AS_ANY_IDS);
  const oneAsEightSources = getReadyActivatedAbilitySources(state, playerId, ONE_AS_EIGHT_IDS);

  for (const entry of hand) {
    tokens.push({
      key: `pearl:${entry.id}:${entry.value}`,
      pearlId: entry.id,
      value: entry.value,
      cost: 0,
    });

    if (entry.value === 3 && threeAsAnySources.length > 0) {
      for (const sourceCharacterId of threeAsAnySources) {
        for (const value of PEARL_VALUES) {
          tokens.push({
            key: `override:${entry.id}:${sourceCharacterId}:${value}`,
            pearlId: entry.id,
            value,
            override: { pearlId: entry.id, value, sourceCharacterId },
            cost: value === entry.value ? 0.1 : 1,
          });
        }
      }
    }

    if (entry.value === 1 && oneAsEightSources.length > 0) {
      for (const sourceCharacterId of oneAsEightSources) {
        tokens.push({
          key: `override:${entry.id}:${sourceCharacterId}:8`,
          pearlId: entry.id,
          value: 8,
          override: { pearlId: entry.id, value: 8, sourceCharacterId },
          cost: 1,
        });
      }
    }

    for (const diamondId of player.diamonds) {
      if (entry.value < 8) {
        tokens.push({
          key: `diamond:${entry.id}:${diamondId}:1`,
          pearlId: entry.id,
          value: (entry.value + 1) as PearlValue,
          diamondUse: {
            diamondId,
            pearlId: entry.id,
            modifier: 1,
            source: "baseRule",
          },
          cost: 2,
        });
      }
      if (allowDownDiamond && entry.value > 1) {
        tokens.push({
          key: `diamond:${entry.id}:${diamondId}:-1`,
          pearlId: entry.id,
          value: (entry.value - 1) as PearlValue,
          diamondUse: {
            diamondId,
            pearlId: entry.id,
            modifier: -1,
            source: "candidateAbility",
          },
          cost: 2,
        });
      }
    }
  }

  for (const sourceCharacterId of player.activatedCharacters) {
    if (isActivatedThisTurn(state, sourceCharacterId)) continue;
    const definitionId = getDefinitionId(state, sourceCharacterId);
    if (!definitionId) continue;
    const virtualValue = VIRTUAL_PEARL_VALUE_BY_DEFINITION[definitionId];
    if (!virtualValue) continue;
    const values = virtualValue === "any" ? PEARL_VALUES : [virtualValue];
    for (const value of values) {
      tokens.push({
        key: `virtual:${sourceCharacterId}:${value}`,
        value,
        virtualPearl: { sourceCharacterId, value },
        cost: virtualValue === "any" ? -0.8 : -1,
      });
    }
  }

  return tokens.sort((left, right) => left.cost - right.cost || left.key.localeCompare(right.key));
}

function findCustomPlan(
  state: GameState,
  playerId: PlayerId,
  tokens: PaymentToken[],
  label: string,
): PaymentPlan | null {
  return findCustomPlans(state, playerId, tokens, label)[0] ?? null;
}

function findCustomPlans(
  state: GameState,
  playerId: PlayerId,
  tokens: PaymentToken[],
  label: string,
): PaymentPlan[] {
  const trimmed = label.trim();
  const exact = parseExactValuesFromLabel(trimmed);
  if (exact) {
    return findExactValuePlans(tokens, exact);
  }

  if (trimmed === "합하면 '10'이 되는 카드들") {
    return findSumPlans(tokens, 10, undefined);
  }
  if (trimmed === "합이 10이 되는 카드 3장") {
    return findSumPlans(tokens, 10, 3);
  }
  if (trimmed === "합하면 20이 되는 카드 3장") {
    return findSumPlans(tokens, 20, 3);
  }
  if (trimmed === "합하면 7이 되는 카드 3장") {
    return findSumPlans(tokens, 7, 3);
  }
  if (trimmed === "연속되는 카드 3장") {
    return findSequencePlans(tokens, 3);
  }
  if (trimmed === "연속되는 카드 5장") {
    return findSequencePlans(tokens, 5);
  }
  if (trimmed === "같은 카드 2장") {
    return findSameValuePlans(tokens, 2);
  }
  if (trimmed === "같은 카드 3장") {
    return findSameValuePlans(tokens, 3);
  }
  if (trimmed === "같은 카드 4장") {
    return findSameValuePlans(tokens, 4);
  }
  if (trimmed === "홀수인 카드 3장") {
    return findParityPlans(tokens, 3, "odd");
  }
  if (trimmed === "짝수인 카드 3장") {
    return findParityPlans(tokens, 3, "even");
  }
  if (trimmed === "333/666") {
    return rankPaymentPlans([
      ...findExactValuePlans(tokens, [3, 3, 3]),
      ...findExactValuePlans(tokens, [6, 6, 6]),
    ]);
  }
  if (trimmed === "444/555") {
    return rankPaymentPlans([
      ...findExactValuePlans(tokens, [4, 4, 4]),
      ...findExactValuePlans(tokens, [5, 5, 5]),
    ]);
  }
  if (trimmed === "222+다이아몬드 1장") {
    const plans: PaymentPlan[] = [];
    for (const base of findExactValuePlans(tokens, [2, 2, 2])) {
      const usedDiamondIds = new Set([
        ...base.diamondUses.map((use) => use.diamondId),
        ...(base.spentDiamondIds ?? []),
      ]);
      for (const diamondId of getPlayer(state, playerId).diamonds) {
        if (!usedDiamondIds.has(diamondId)) {
          plans.push(normalizePlan({ ...base, spentDiamondIds: [diamondId] }));
        }
      }
    }
    return rankPaymentPlans(plans);
  }
  if (trimmed === "같은 카드 2장 + 66" || trimmed === "같은 카드 2장 + 6카드 2장") {
    return rankPaymentPlans(
      PEARL_VALUES.flatMap((value) => findExactValuePlans(tokens, [value, value, 6, 6])),
    );
  }
  if (trimmed === "같은 카드 2장씩 두 벌") {
    const plans: PaymentPlan[] = [];
    for (let left = 0; left < PEARL_VALUES.length; left += 1) {
      for (let right = left + 1; right < PEARL_VALUES.length; right += 1) {
        plans.push(
          ...findExactValuePlans(tokens, [
            PEARL_VALUES[left],
            PEARL_VALUES[left],
            PEARL_VALUES[right],
            PEARL_VALUES[right],
          ]),
        );
      }
    }
    return rankPaymentPlans(plans);
  }

  return [];
}

function findExactValuePlan(tokens: PaymentToken[], values: PearlValue[]): PaymentPlan | null {
  return findExactValuePlans(tokens, values)[0] ?? null;
}

function findExactValuePlans(tokens: PaymentToken[], values: PearlValue[]): PaymentPlan[] {
  const plans: PaymentPlan[] = [];

  function search(valueIndex: number, picked: PaymentToken[]): void {
    if (valueIndex === values.length) {
      plans.push(tokensToPlan(picked));
      return;
    }

    const target = values[valueIndex];
    for (const token of tokens) {
      if (token.value !== target || !canPickToken(picked, token)) continue;
      search(valueIndex + 1, [...picked, token]);
      if (plans.length >= MAX_PAYMENT_PLANS * 4) return;
    }
  }

  search(0, []);
  return rankPaymentPlans(plans);
}

function findSequencePlan(tokens: PaymentToken[], count: number): PaymentPlan | null {
  return findSequencePlans(tokens, count)[0] ?? null;
}

function findSequencePlans(tokens: PaymentToken[], count: number): PaymentPlan[] {
  const plans: PaymentPlan[] = [];
  for (let start = 1; start + count - 1 <= 8; start += 1) {
    const values = Array.from({ length: count }, (_, index) => (start + index) as PearlValue);
    plans.push(...findExactValuePlans(tokens, values));
  }
  return rankPaymentPlans(plans);
}

function findSameValuePlan(tokens: PaymentToken[], count: number): PaymentPlan | null {
  return findSameValuePlans(tokens, count)[0] ?? null;
}

function findSameValuePlans(tokens: PaymentToken[], count: number): PaymentPlan[] {
  return rankPaymentPlans(
    PEARL_VALUES.flatMap((value) =>
      findExactValuePlans(tokens, Array.from({ length: count }, () => value)),
    ),
  );
}

function findParityPlan(
  tokens: PaymentToken[],
  count: number,
  parity: "odd" | "even",
): PaymentPlan | null {
  return findParityPlans(tokens, count, parity)[0] ?? null;
}

function findParityPlans(
  tokens: PaymentToken[],
  count: number,
  parity: "odd" | "even",
): PaymentPlan[] {
  const matches = (value: PearlValue) =>
    parity === "odd" ? value % 2 === 1 : value % 2 === 0;
  const plans: PaymentPlan[] = [];

  function search(picked: PaymentToken[]): void {
    if (picked.length === count) {
      plans.push(tokensToPlan(picked));
      return;
    }
    for (const token of tokens) {
      if (!matches(token.value) || !canPickToken(picked, token)) continue;
      search([...picked, token]);
      if (plans.length >= MAX_PAYMENT_PLANS * 4) return;
    }
  }

  search([]);
  return rankPaymentPlans(plans);
}

function findSumPlan(
  tokens: PaymentToken[],
  total: number,
  fixedCount: number | undefined,
): PaymentPlan | null {
  return findSumPlans(tokens, total, fixedCount)[0] ?? null;
}

function findSumPlans(
  tokens: PaymentToken[],
  total: number,
  fixedCount: number | undefined,
): PaymentPlan[] {
  const counts =
    typeof fixedCount === "number"
      ? [fixedCount]
      : Array.from({ length: tokens.length }, (_, index) => index + 1);
  const plans: PaymentPlan[] = [];

  function search(start: number, picked: PaymentToken[], count: number): void {
    if (picked.length === count) {
      if (picked.reduce((sum, token) => sum + token.value, 0) === total) {
        plans.push(tokensToPlan(picked));
      }
      return;
    }
    for (let index = start; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (!canPickToken(picked, token)) continue;
      const next = [...picked, token];
      const sum = next.reduce((acc, item) => acc + item.value, 0);
      if (sum > total) continue;
      search(index + 1, next, count);
      if (plans.length >= MAX_PAYMENT_PLANS * 4) return;
    }
  }

  for (const count of counts) {
    search(0, [], count);
  }

  return rankPaymentPlans(plans);
}

function canPickToken(picked: PaymentToken[], token: PaymentToken): boolean {
  if (picked.some((candidate) => candidate.key === token.key)) return false;
  if (token.pearlId && picked.some((candidate) => candidate.pearlId === token.pearlId)) {
    return false;
  }
  if (
    token.virtualPearl &&
    picked.some(
      (candidate) =>
        candidate.virtualPearl?.sourceCharacterId === token.virtualPearl?.sourceCharacterId,
    )
  ) {
    return false;
  }
  const tokenDiamondId = token.diamondUse?.diamondId ?? token.spentDiamondId;
  if (
    tokenDiamondId &&
    picked.some(
      (candidate) =>
        (candidate.diamondUse?.diamondId ?? candidate.spentDiamondId) === tokenDiamondId,
    )
  ) {
    return false;
  }
  return true;
}

function tokensToPlan(tokens: PaymentToken[]): PaymentPlan {
  return normalizePlan({
    pearlIds: tokens
      .map((token) => token.pearlId)
      .filter((pearlId): pearlId is CardInstanceId => Boolean(pearlId)),
    diamondUses: tokens
      .map((token) => token.diamondUse)
      .filter((use): use is DiamondUse => Boolean(use)),
    spentDiamondIds: tokens
      .map((token) => token.spentDiamondId)
      .filter((id): id is CardInstanceId => Boolean(id)),
    pearlValueOverrides: tokens
      .map((token) => token.override)
      .filter((override): override is PearlValueOverride => Boolean(override)),
    virtualPearls: tokens
      .map((token) => token.virtualPearl)
      .filter((virtualPearl): virtualPearl is VirtualPearlUse => Boolean(virtualPearl)),
  });
}

function normalizePlan(plan: PaymentPlan): PaymentPlan {
  return {
    pearlIds: [...new Set(plan.pearlIds)],
    diamondUses: plan.diamondUses,
    ...(plan.spentDiamondIds && plan.spentDiamondIds.length > 0
      ? { spentDiamondIds: [...new Set(plan.spentDiamondIds)] }
      : {}),
    ...(plan.pearlValueOverrides && plan.pearlValueOverrides.length > 0
      ? { pearlValueOverrides: plan.pearlValueOverrides }
      : {}),
    ...(plan.virtualPearls && plan.virtualPearls.length > 0
      ? { virtualPearls: plan.virtualPearls }
      : {}),
  };
}

function findBestPlan(plans: Array<PaymentPlan | null>): PaymentPlan | null {
  return rankPaymentPlans(plans.filter((plan): plan is PaymentPlan => Boolean(plan)))[0] ?? null;
}

function rankPaymentPlans(plans: PaymentPlan[]): PaymentPlan[] {
  const unique = new Map<string, PaymentPlan>();
  for (const plan of plans.map(normalizePlan)) {
    unique.set(paymentPlanKey(plan), plan);
  }
  return [...unique.values()]
    .sort(
      (left, right) =>
        planCost(left) - planCost(right) ||
        (right.virtualPearls?.length ?? 0) - (left.virtualPearls?.length ?? 0) ||
        left.pearlIds.length - right.pearlIds.length ||
        paymentDiamondIds(left).length - paymentDiamondIds(right).length ||
        paymentPlanKey(left).localeCompare(paymentPlanKey(right)),
    )
    .slice(0, MAX_PAYMENT_PLANS);
}

function planCost(plan: PaymentPlan): number {
  return (
    plan.pearlIds.length * 100 +
    plan.diamondUses.length * 24 +
    (plan.spentDiamondIds?.length ?? 0) * 24 +
    (plan.pearlValueOverrides?.length ?? 0) * 8 -
    (plan.virtualPearls?.length ?? 0) * 18
  );
}

function paymentDiamondIds(plan: PaymentPlan): CardInstanceId[] {
  return [
    ...plan.diamondUses.map((use) => use.diamondId),
    ...(plan.spentDiamondIds ?? []),
  ];
}

function paymentPlanKey(plan: PaymentPlan): string {
  const diamondUses = [...plan.diamondUses]
    .sort((left, right) =>
      `${left.diamondId}:${left.pearlId}:${left.modifier}:${left.source}`.localeCompare(
        `${right.diamondId}:${right.pearlId}:${right.modifier}:${right.source}`,
      ),
    )
    .map((use) => `${use.diamondId}:${use.pearlId}:${use.modifier}:${use.source}`);
  const overrides = [...(plan.pearlValueOverrides ?? [])]
    .sort((left, right) =>
      `${left.sourceCharacterId}:${left.pearlId}:${left.value}`.localeCompare(
        `${right.sourceCharacterId}:${right.pearlId}:${right.value}`,
      ),
    )
    .map((override) => `${override.sourceCharacterId}:${override.pearlId}:${override.value}`);
  const virtualPearls = [...(plan.virtualPearls ?? [])]
    .sort((left, right) =>
      `${left.sourceCharacterId}:${left.value}`.localeCompare(
        `${right.sourceCharacterId}:${right.value}`,
      ),
    )
    .map((virtualPearl) => `${virtualPearl.sourceCharacterId}:${virtualPearl.value}`);
  return JSON.stringify({
    pearlIds: [...plan.pearlIds].sort(),
    diamondUses,
    spentDiamondIds: [...(plan.spentDiamondIds ?? [])].sort(),
    overrides,
    virtualPearls,
  });
}

function parseExactValuesFromLabel(label: string): PearlValue[] | null {
  const trimmed = label.trim();
  if (!/^[1-8]+$/.test(trimmed)) {
    return null;
  }
  return trimmed.split("").map((digit) => Number(digit) as PearlValue);
}

function pearlValueOf(state: GameState, cardId: CardInstanceId): PearlValue | null {
  const instance = state.cardsById[cardId];
  if (!instance) return null;
  const definition = fixtureCatalog.pearlCards[instance.definitionId];
  return definition?.value ?? null;
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
