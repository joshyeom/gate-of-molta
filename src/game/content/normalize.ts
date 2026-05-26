import type {
  CharacterCardDefinition,
  CharacterRequirement,
  ContentStatus,
  PearlValue,
} from "../engine/types";

export function normalizeRequirement(
  requirement: CharacterRequirement,
): CharacterRequirement {
  if (requirement.type !== "custom") {
    return requirement;
  }
  const parsed = parseCustomLabel(requirement.label, requirement.status);
  return parsed ?? requirement;
}

export function normalizeCharacterDefinition(
  definition: CharacterCardDefinition,
): CharacterCardDefinition {
  const next = normalizeRequirement(definition.requirement);
  if (next === definition.requirement) {
    return definition;
  }
  return { ...definition, requirement: next };
}

function parseCustomLabel(
  label: string,
  status: ContentStatus,
): CharacterRequirement | null {
  const trimmed = label.trim();

  const exactDigits = parseExactDigits(trimmed);
  if (exactDigits) {
    return { type: "exactValues", values: exactDigits };
  }

  const sameValue = matchSameValue(trimmed);
  if (sameValue) {
    return sameValue;
  }

  const sequence = matchSequence(trimmed);
  if (sequence) {
    return sequence;
  }

  const parity = matchParity(trimmed);
  if (parity) {
    return parity;
  }

  const sum = matchSum(trimmed);
  if (sum) {
    return sum;
  }

  void status;
  return null;
}

function parseExactDigits(label: string): PearlValue[] | null {
  if (!/^[1-8]+$/.test(label)) {
    return null;
  }
  return label.split("").map((digit) => Number(digit) as PearlValue);
}

function matchSameValue(label: string): CharacterRequirement | null {
  const match = /^같은\s*카드\s*(\d+)\s*장$/.exec(label);
  if (!match) {
    return null;
  }
  const count = Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  return { type: "sameValue", count };
}

function matchSequence(label: string): CharacterRequirement | null {
  const match = /^연속(?:되는)?\s*카드\s*(\d+)\s*장$/.exec(label);
  if (!match) {
    return null;
  }
  const count = Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  return { type: "sequence", count };
}

function matchParity(label: string): CharacterRequirement | null {
  const oddMatch = /^홀수인?\s*카드\s*(\d+)\s*장$/.exec(label);
  if (oddMatch) {
    return { type: "odd", count: Number(oddMatch[1]) };
  }
  const evenMatch = /^짝수인?\s*카드\s*(\d+)\s*장$/.exec(label);
  if (evenMatch) {
    return { type: "even", count: Number(evenMatch[1]) };
  }
  return null;
}

function matchSum(label: string): CharacterRequirement | null {
  const withCount = /^합(?:하면|이)\s*'?(\d+)'?(?:이\s*되는)?\s*카드\s*(\d+)\s*장$/.exec(label);
  if (withCount) {
    return {
      type: "sum",
      total: Number(withCount[1]),
      count: Number(withCount[2]),
    };
  }
  const openSum = /^합(?:하면|이)\s*'?(\d+)'?(?:이\s*되는)?\s*카드들?$/.exec(label);
  if (openSum) {
    return { type: "sum", total: Number(openSum[1]) };
  }
  return null;
}
