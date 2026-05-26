import type { CardDefinitionId, CharacterCardDefinition, ContentCatalog } from "../engine/types";
import { fixtureCharacterDefinitions } from "./characters.fixture";
import { normalizeCharacterDefinition } from "./normalize";
import { pearlDefinitions } from "./pearls";

const normalizedCharacterCards: Record<CardDefinitionId, CharacterCardDefinition> =
  Object.fromEntries(
    Object.entries(fixtureCharacterDefinitions).map(([id, definition]) => [
      id,
      normalizeCharacterDefinition(definition),
    ]),
  );

export const fixtureCatalog: ContentCatalog = {
  version: "fixture-2026-05-23",
  pearlCards: pearlDefinitions,
  characterCards: normalizedCharacterCards,
};
