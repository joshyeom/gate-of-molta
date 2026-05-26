import type { CardDefinitionId, PearlCardDefinition, PearlValue } from "../engine/types";

const PEARL_VALUES: PearlValue[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const PEARL_COPIES_PER_VALUE = 7;

export const pearlDefinitions: Record<CardDefinitionId, PearlCardDefinition> =
  Object.fromEntries(
    PEARL_VALUES.map((value) => [
      `pearl-${value}`,
      {
        id: `pearl-${value}`,
        kind: "pearl",
        value,
        hasRefreshIcon: "unknown",
        status: "verified",
      },
    ]),
  );

export function getPearlDefinitionIds(): CardDefinitionId[] {
  return PEARL_VALUES.map((value) => `pearl-${value}`);
}

