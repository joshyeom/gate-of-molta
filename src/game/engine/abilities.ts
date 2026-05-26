import { fixtureCatalog } from "../content/catalog";
import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  PearlValue,
  PlayerId,
} from "./types";

export const HAND_LIMIT_BONUS_IDS = new Set<CardDefinitionId>([
  "character-303-sum-10-p1-d0",
  "character-502-sum-10-p1-d0",
  "character-705-sum-10-p1-d0",
]);

export const DOWN_DIAMOND_IDS = new Set<CardDefinitionId>(["character-401-357-p1-d1"]);
export const THREE_AS_ANY_IDS = new Set<CardDefinitionId>(["character-608-333-p1-d0"]);
export const ONE_AS_EIGHT_IDS = new Set<CardDefinitionId>(["character-708-three-card-sum-10-p1-d0"]);
export const TURN_ACTION_BONUS_IDS = new Set<CardDefinitionId>(["character-508-45678-p1-d0"]);
export const NEXT_PLAYER_ACTION_BONUS_IDS = new Set<CardDefinitionId>(["character-604-two-pairs-p2-d0"]);
export const IMMEDIATE_EXTRA_ACTION_IDS = new Set<CardDefinitionId>([
  "character-701-2468-p2-d0",
  "character-702-1357-p2-d0",
]);
export const RECLAIM_USED_PEARL_IDS = new Set<CardDefinitionId>(["character-800-345-p1-d0"]);
export const STEAL_HAND_IDS = new Set<CardDefinitionId>([
  "character-507-567-p1-d0",
  "character-801-567-p1-d0",
]);
export const DISCARD_OPPONENT_GATE_IDS = new Set<CardDefinitionId>([
  "character-602-three-card-sum-7-p1-d0",
  "character-807-three-card-sum-7-p1-d0",
]);
export const DISCARD_REDRAW_HAND_IDS = new Set<CardDefinitionId>(["character-302-18-p1-d0"]);
export const PEEK_CHARACTER_DECK_IDS = new Set<CardDefinitionId>(["character-402-straight-3-p1-d0"]);
export const SWAP_GATE_MARKET_IDS = new Set<CardDefinitionId>(["character-700-straight-5-p2-d0"]);
export const DRAW_DIAMOND_BY_TWO_IDS = new Set<CardDefinitionId>(["character-806-2-p0-d1"]);
export const WISP_IDS = new Set<CardDefinitionId>([
  "character-707-333-or-666-p3-d0",
  "character-901-444-or-555-p3-d0",
]);

export const VIRTUAL_PEARL_VALUE_BY_DEFINITION: Partial<Record<CardDefinitionId, PearlValue | "any">> = {
  "character-304-12-p0-d0": 8,
  "character-306-11-p1-d0": 1,
  "character-308-55-p1-d0": 5,
  "character-400-12-p0-d0": 8,
  "character-404-33-p1-d0": 3,
  "character-500-44-p1-d0": 4,
  "character-603-1111-p0-d0": "any",
  "character-607-22-p1-d0": 2,
  "character-804-66-p1-d0": 6,
  "character-805-77-p1-d0": 7,
};

export const USE_ABILITY_DEFINITION_IDS = new Set<CardDefinitionId>([
  ...DISCARD_REDRAW_HAND_IDS,
  ...PEEK_CHARACTER_DECK_IDS,
  ...SWAP_GATE_MARKET_IDS,
  ...DRAW_DIAMOND_BY_TWO_IDS,
]);

export function getDefinitionId(state: GameState, cardId: CardInstanceId): CardDefinitionId | null {
  return state.cardsById[cardId]?.definitionId ?? null;
}

export function getCharacterPower(state: GameState, cardId: CardInstanceId): number {
  const definitionId = getDefinitionId(state, cardId);
  const definition = definitionId ? fixtureCatalog.characterCards[definitionId] : null;
  return typeof definition?.power === "number" ? definition.power : 0;
}

export function getActivatedDefinitionIds(state: GameState, playerId: PlayerId): CardDefinitionId[] {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return [];
  return player.activatedCharacters
    .map((cardId) => getDefinitionId(state, cardId))
    .filter((definitionId): definitionId is CardDefinitionId => Boolean(definitionId));
}

export function hasActivatedDefinition(
  state: GameState,
  playerId: PlayerId,
  definitionIds: Set<CardDefinitionId>,
): boolean {
  return getActivatedDefinitionIds(state, playerId).some((definitionId) =>
    definitionIds.has(definitionId),
  );
}

export function getActivatedAbilitySources(
  state: GameState,
  playerId: PlayerId,
  definitionIds: Set<CardDefinitionId>,
): CardInstanceId[] {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return [];
  return player.activatedCharacters.filter((cardId) => {
    const definitionId = getDefinitionId(state, cardId);
    return Boolean(definitionId && definitionIds.has(definitionId));
  });
}

export function isWisp(state: GameState, cardId: CardInstanceId): boolean {
  const definitionId = getDefinitionId(state, cardId);
  return Boolean(definitionId && WISP_IDS.has(definitionId));
}

export function areAdjacentSeats(state: GameState, leftPlayerId: PlayerId, rightPlayerId: PlayerId): boolean {
  const left = state.players.find((player) => player.id === leftPlayerId);
  const right = state.players.find((player) => player.id === rightPlayerId);
  if (!left || !right) return false;
  const distance = Math.abs(left.seatIndex - right.seatIndex);
  return distance === 1 || distance === state.players.length - 1;
}
