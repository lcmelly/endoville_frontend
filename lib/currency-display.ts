import type { LocationOption } from "@/lib/state/location-context";

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
    /** ISO 4217 from API, e.g. payment `currency` */
    currencyCode?: string | null;
    /** From `Product.currency_symbol` when `item.product` is known */
    symbolOverride?: string | null;
  }
): string {
  const { location, currencyCode, symbolOverride } = opts;
  if (symbolOverride) {
    return `${symbolOverride}${amount}`;
  }
  const code = currencyCode?.toUpperCase();
  const symbol =
    (code && ISO_TO_SYMBOL[code]) ?? getCurrencySymbolForLocation(location);
  return `${symbol}${amount}`;
}
