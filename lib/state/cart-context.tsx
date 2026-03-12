"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Product } from "@/lib/api/products";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  decrementItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "endoville_cart_v1";

const loadStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item?.product?.id && item.quantity > 0);
  } catch {
    return [];
  }
};

const persistCart = (items: CartItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore persistence errors
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadStoredCart());

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const next = existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...prev, { product, quantity }];
      persistCart(next);
      return next;
    });
  }, []);

  const decrementItem = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      persistCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      const next = prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0);
      persistCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    persistCart([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addItem,
      decrementItem,
      removeItem,
      updateQuantity,
      clear,
    }),
    [items, itemCount, addItem, decrementItem, removeItem, updateQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
};
