import type { Product } from "@/lib/api/products";

export type CartItem = {
  product: Product;
  quantity: number;
  /** When set, line syncs as `{ variant, quantity }` and uses variant pricing when known. */
  variantId?: number | null;
};
