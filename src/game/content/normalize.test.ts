import { describe, expect, it } from "vitest";
import type { CharacterRequirement } from "../engine/types";
import { normalizeRequirement } from "./normalize";

function makeCustom(label: string): CharacterRequirement {
  return { type: "custom", label, status: "candidate" };
}

describe("normalizeRequirement", () => {
  it("converts digit string to exactValues", () => {
    expect(normalizeRequirement(makeCustom("6688"))).toEqual({
      type: "exactValues",
      values: [6, 6, 8, 8],
    });
  });

  it("converts single digit to exactValues", () => {
    expect(normalizeRequirement(makeCustom("2"))).toEqual({
      type: "exactValues",
      values: [2],
    });
  });

  it("converts 같은 카드 K장 to sameValue", () => {
    expect(normalizeRequirement(makeCustom("같은 카드 3장"))).toEqual({
      type: "sameValue",
      count: 3,
    });
  });

  it("converts 연속되는 카드 K장 to sequence", () => {
    expect(normalizeRequirement(makeCustom("연속되는 카드 5장"))).toEqual({
      type: "sequence",
      count: 5,
    });
  });

  it("converts 홀수인 카드 K장 to odd", () => {
    expect(normalizeRequirement(makeCustom("홀수인 카드 3장"))).toEqual({
      type: "odd",
      count: 3,
    });
  });

  it("converts 짝수인 카드 K장 to even", () => {
    expect(normalizeRequirement(makeCustom("짝수인 카드 3장"))).toEqual({
      type: "even",
      count: 3,
    });
  });

  it("converts 합이 N이 되는 카드 K장 to sum with count", () => {
    expect(normalizeRequirement(makeCustom("합이 10이 되는 카드 3장"))).toEqual({
      type: "sum",
      total: 10,
      count: 3,
    });
  });

  it("converts 합하면 N이 되는 카드 K장 to sum with count", () => {
    expect(normalizeRequirement(makeCustom("합하면 20이 되는 카드 3장"))).toEqual({
      type: "sum",
      total: 20,
      count: 3,
    });
  });

  it("converts 합하면 'N'이 되는 카드들 to open sum", () => {
    expect(normalizeRequirement(makeCustom("합하면 '10'이 되는 카드들"))).toEqual({
      type: "sum",
      total: 10,
    });
  });

  it("keeps unparseable label as custom", () => {
    expect(normalizeRequirement(makeCustom("222+다이아몬드 1장"))).toEqual({
      type: "custom",
      label: "222+다이아몬드 1장",
      status: "candidate",
    });
    expect(normalizeRequirement(makeCustom("333/666"))).toEqual({
      type: "custom",
      label: "333/666",
      status: "candidate",
    });
  });

  it("passes through non-custom requirements unchanged", () => {
    const exact: CharacterRequirement = { type: "exactValues", values: [1, 2] };
    expect(normalizeRequirement(exact)).toBe(exact);
  });
});
