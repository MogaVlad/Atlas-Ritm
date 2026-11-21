import { describe, expect, it } from "vitest";
import { cleanAmountInput, formatLei, parseAmount } from "./format";

describe("formatLei", () => {
  it("writes 1.234,56 RON", () => {
    expect(formatLei(1234.56)).toBe("1.234,56 RON");
  });
});

describe("amount fields", () => {
  it("keep a comma or a point as the decimal separator, at most 2 decimals", () => {
    expect(cleanAmountInput("12,5")).toBe("12,5");
    expect(cleanAmountInput("12.567")).toBe("12.56");
    expect(cleanAmountInput("1,2,3")).toBe("1,23");
  });

  it("drop minus signs, letters and exponents", () => {
    expect(cleanAmountInput("-5")).toBe("5");
    expect(cleanAmountInput("1e5")).toBe("15");
    expect(cleanAmountInput("abc")).toBe("");
  });

  it("read the number the same way with a comma or a point", () => {
    expect(parseAmount("12,5")).toBe(12.5);
    expect(parseAmount("12.5")).toBe(12.5);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(",")).toBe(0);
  });
});
