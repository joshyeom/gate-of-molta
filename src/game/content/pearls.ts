import type { CardDefinitionId, PearlCardDefinition, PearlValue } from "../engine/types";

const PEARL_VALUES: PearlValue[] = [1, 2, 3, 4, 5, 6, 7, 8];
const REFRESH_PEARL_VALUES = new Set<PearlValue>([3, 4, 5]);

export const PEARL_COPIES_PER_VALUE = 8;

const normalPearls = PEARL_VALUES.map((value) => [
  `pearl-${value}`,
  {
    id: `pearl-${value}`,
    kind: "pearl",
    value,
    hasRefreshIcon: false,
    status: "verified",
  },
] satisfies [CardDefinitionId, PearlCardDefinition]);

const refreshPearls = [...REFRESH_PEARL_VALUES].map((value) => [
  `pearl-${value}-refresh`,
  {
    id: `pearl-${value}-refresh`,
    kind: "pearl",
    value,
    hasRefreshIcon: true,
    status: "verified",
  },
] satisfies [CardDefinitionId, PearlCardDefinition]);

export const pearlDefinitions: Record<CardDefinitionId, PearlCardDefinition> =
  Object.fromEntries([...normalPearls, ...refreshPearls]);

export function getPearlDefinitionIds(): CardDefinitionId[] {
  return Object.keys(pearlDefinitions);
}

export function getPearlDeckDefinitionIds(): CardDefinitionId[] {
  return PEARL_VALUES.flatMap((value) => {
    const normalCopyCount = PEARL_COPIES_PER_VALUE - (REFRESH_PEARL_VALUES.has(value) ? 1 : 0);
    return [
      ...Array.from({ length: normalCopyCount }, () => `pearl-${value}`),
      ...(REFRESH_PEARL_VALUES.has(value) ? [`pearl-${value}-refresh`] : []),
    ];
  });
}
