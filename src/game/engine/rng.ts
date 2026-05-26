import type { RngState } from "./types";

const UINT32_MAX_PLUS_ONE = 4_294_967_296;

export function seedToRngState(seed: string): RngState {
  let hash = 2_166_136_261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0 || 1;
}

export function nextRng(state: RngState): { state: RngState; value: number } {
  let next = state >>> 0;
  next += 0x6d2b79f5;
  let value = Math.imul(next ^ (next >>> 15), next | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return {
    state: next >>> 0,
    value: ((value ^ (value >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE,
  };
}

export function nextInt(
  state: RngState,
  minInclusive: number,
  maxExclusive: number,
): { state: RngState; value: number } {
  const next = nextRng(state);
  const value = Math.floor(next.value * (maxExclusive - minInclusive)) + minInclusive;
  return { state: next.state, value };
}

export function shuffleWithRng<T>(
  items: readonly T[],
  initialState: RngState,
): { items: T[]; state: RngState } {
  const shuffled = [...items];
  let state = initialState;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const next = nextInt(state, 0, index + 1);
    state = next.state;
    [shuffled[index], shuffled[next.value]] = [shuffled[next.value], shuffled[index]];
  }

  return { items: shuffled, state };
}

