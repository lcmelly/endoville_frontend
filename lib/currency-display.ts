import type { LocationOption } from "@/lib/state/location-context";
import type { Currency } from "@/lib/api/products";

/** Matches storefront product pricing by user location (see products API `currency` query). */
export function getCurrencySymbolForLocation(location: LocationOption): string {
  return location === "Kenya" ? "KSh" : "$";
}

const ISO_TO_SYMBOL: Record<string, string> = {
  KES: "KSh",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const getCurrencyByCode = (currencies: Currency[] | undefined, code: string) =>
  currencies?.find((currency) => currency.is_active && currency.code.toUpperCase() === code);

const formatNumericAmount = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : "0.00";

/**
 * Format an order amount with a currency symbol, aligned with product cards:
 * `{symbol}{amount}` (no space), same as `ProductCard` / `formatPrice`.
 *
 * Prefer `symbolOverride` from a catalog product when the line is tied to a product
 * (matches that product’s `currency_symbol` for the current location).
 * Otherwise use `currencyCode` (e.g. payment row) or fall back to the user’s location.
 */
export function formatOrderMoney(
  amount: string,
  opts: {
    location: LocationOption;
    currencies?: Currency[];
    /** ISO 4217 from API, e.g. payment `currency` */
    currencyCode?: string | null;
    /** Source currency for order amounts that need location-based conversion */
    sourceCurrencyCode?: string | null;
    /** From `Product.currency_symbol` when `item.product` is known */
    symbolOverride?: string | null;
  }
): string {
  const { location, currencies, currencyCode, sourceCurrencyCode, symbolOverride } = opts;
  const sourceCode = (currencyCode ?? sourceCurrencyCode ?? "USD").toUpperCase();

  if (!currencyCode && location === "Kenya" && sourceCode === "USD") {
    const kesCurrency = getCurrencyByCode(currencies, "KES");
    const usdAmount = Number(amount);
    const kesRate = Number(kesCurrency?.usd_rate ?? NaN);

    if (Number.isFinite(usdAmount) && Number.isFinite(kesRate)) {
      const kesSymbol = kesCurrency?.symbol || ISO_TO_SYMBOL.KES;
      return `${kesSymbol}${formatNumericAmount(usdAmount * kesRate)}`;
    }

    return `${ISO_TO_SYMBOL.USD}${amount}`;
  }

  if (symbolOverride) {
    return `${symbolOverride}${amount}`;
  }

  const code = currencyCode?.toUpperCase();
  const symbol =
    (code && ISO_TO_SYMBOL[code]) ?? getCurrencySymbolForLocation(location);
  return `${symbol}${amount}`;
}
