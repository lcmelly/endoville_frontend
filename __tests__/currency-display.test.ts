import { formatOrderMoney } from "@/lib/currency-display";
import type { Currency } from "@/lib/api/products";

const currencies: Currency[] = [
  {
    id: 1,
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    usd_rate: "1.000000",
    is_primary: true,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    usd_rate: "160.500000",
    is_primary: false,
    is_active: true,
    created_at: "2025-01-16T12:00:00Z",
    updated_at: "2025-01-16T12:00:00Z",
  },
];

describe("formatOrderMoney", () => {
  it("converts USD order amounts to KES for Kenya", () => {
    expect(
      formatOrderMoney("10.00", {
        location: "Kenya",
        currencies,
        sourceCurrencyCode: "USD",
      })
    ).toBe("KSh1605.00");
  });

  it("keeps USD amounts for USA", () => {
    expect(
      formatOrderMoney("10.00", {
        location: "USA",
        currencies,
        sourceCurrencyCode: "USD",
      })
    ).toBe("$10.00");
  });

  it("preserves explicit payment currency formatting", () => {
    expect(
      formatOrderMoney("3200.00", {
        location: "Kenya",
        currencies,
        currencyCode: "KES",
      })
    ).toBe("KSh3200.00");
  });
});
