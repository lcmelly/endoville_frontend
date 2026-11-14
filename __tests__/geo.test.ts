import {
  isAllowedCountry,
  normalizeCountryCode,
} from "@/lib/geo";

describe("geo helpers", () => {
  it("normalizes country codes", () => {
    expect(normalizeCountryCode("ke")).toBe("KE");
    expect(normalizeCountryCode(" US ")).toBe("US");
    expect(normalizeCountryCode("FRA")).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
  });

  it("allows only Kenya and the USA", () => {
    expect(isAllowedCountry("KE")).toBe(true);
    expect(isAllowedCountry("us")).toBe(true);
    expect(isAllowedCountry("FR")).toBe(false);
    expect(isAllowedCountry(null)).toBe(false);
  });
});
