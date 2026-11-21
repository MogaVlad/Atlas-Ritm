import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ro from "@/messages/ro.json";
import { formatLei } from "./format";
import { translate } from "./i18n";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translate", () => {
  it("returns the text for each locale", () => {
    expect(translate("ro", "bank.home.balanceLabel")).toBe("Cont curent");
    expect(translate("en", "bank.home.balanceLabel")).toBe("Current account");
  });

  it("fills placeholders", () => {
    expect(translate("en", "bank.home.greeting", { name: "Andrei" })).toBe("Hi, Andrei!");
  });

  it("falls back to the key when missing", () => {
    expect(translate("ro", "bank.nope")).toBe("bank.nope");
  });

  it("ro.json and en.json have the same keys", () => {
    expect(keys(ro).sort()).toEqual(keys(en).sort());
  });
});

describe("formatLei", () => {
  it("uses the same format in RO and EN", () => {
    expect(formatLei(1234.56, "ro")).toBe("1.234,56 lei");
    expect(formatLei(1234.56, "en")).toBe("1.234,56 lei");
    expect(formatLei(4800, "ro")).toBe("4.800,00 lei");
  });
});
