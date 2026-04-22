import type { Product, ProductVariant } from "@/lib/api/products";
import type { OrderItemPayload } from "@/lib/api/orders";
import type { CartItem } from "@/lib/cart/types";

export type BackendCartLine = {
  id: number;
  product: number | null;
  variant: number | null;
  quantity: number;
  product_name: string;
  variant_description: string;
  barcode: string;
  unit_price: string;
  line_total: string;
};

export type BackendCartResponse = {
  id: number;
  user: number;
  items: BackendCartLine[];
  subtotal: string;
  created_at: string;
  updated_at: string;
};

const findVariantInCatalog = (
  products: Product[],
  variantId: number
): { product: Product; variant: ProductVariant } | null => {
  for (const p of products) {
    const v = p.variants?.find((x) => x.id === variantId);
    if (v) {
      return { product: p, variant: v };
    }
  }
  return null;
};

/** Minimal product when catalog has not loaded this id yet. */
const stubProductFromLine = (line: BackendCartLine, productId: number): Product => ({
  id: productId,
  name: line.product_name,
  description: line.variant_description || "",
  brand: null,
  price: line.unit_price,
  display_currency: "",
  currency_symbol: "",
  stock: 0,
  sku: null,
  barcode: line.barcode || null,
  image_urls: [],
  image_refs: [],
  subcategories: [],
  meta_title: null,
  meta_description: null,
  slug: "",
  avg_rating: null,
  review_count: 0,
  created_at: "",
  updated_at: "",
  variants: [],
  reviews: [],
});

export function backendLinesToCartItems(
  lines: BackendCartLine[],
  products: Product[]
): CartItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: CartItem[] = [];

  for (const line of lines) {
    if (line.product != null) {
      const p = byId.get(line.product) ?? stubProductFromLine(line, line.product);
      out.push({ product: p, quantity: line.quantity, variantId: null });
      continue;
    }
    if (line.variant != null) {
      const found = findVariantInCatalog(products, line.variant);
      if (found) {
        out.push({
          product: found.product,
          quantity: line.quantity,
          variantId: found.variant.id,
        });
      } else {
        out.push({
          product: stubProductFromLine(line, -(line.variant ?? line.id)),
          quantity: line.quantity,
          variantId: line.variant,
        });
      }
    }
  }
  return out;
}

export function cartItemsToSyncPayload(items: CartItem[]): OrderItemPayload[] {
  return items.map((item) =>
    item.variantId != null
      ? { variant: item.variantId, quantity: item.quantity }
      : { product: item.product.id, quantity: item.quantity }
  );
}

const payloadKey = (row: OrderItemPayload) =>
  row.variant != null && row.variant !== undefined ? `v:${row.variant}` : `p:${row.product ?? 0}`;

/**
 * Merge server cart with the browser cart: keep every backend-only line, and for any product/variant
 * that also exists in the browser cart, use the **browser quantity** (no summing).
 */
export function mergeLocalAndBackendLines(
  local: CartItem[],
  backendLines: BackendCartLine[]
): OrderItemPayload[] {
  const map = new Map<string, OrderItemPayload>();

  for (const line of backendLines) {
    if (line.product != null) {
      map.set(`p:${line.product}`, { product: line.product, quantity: line.quantity });
    } else if (line.variant != null) {
      map.set(`v:${line.variant}`, { variant: line.variant, quantity: line.quantity });
    }
  }

  for (const item of local) {
    const row: OrderItemPayload =
      item.variantId != null
        ? { variant: item.variantId, quantity: item.quantity }
        : { product: item.product.id, quantity: item.quantity };
    map.set(payloadKey(row), row);
  }

  return [...map.values()];
}

export function hasAnyLine(lines: BackendCartLine[]) {
  return lines.some((l) => (l.product != null || l.variant != null) && l.quantity > 0);
}
