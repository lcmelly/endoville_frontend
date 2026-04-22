"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchProducts, type Product } from "@/lib/api/products";
import { getMyCart, syncCart } from "@/lib/api/cart";
import { useAuth } from "@/lib/state/auth-context";
import { useLocation } from "@/lib/state/location-context";
import { CartMergeDialog } from "@/components/cart-merge-dialog";
import type { CartItem } from "@/lib/cart/types";
import {
  backendLinesToCartItems,
  cartItemsToSyncPayload,
  hasAnyLine,
  mergeLocalAndBackendLines,
  type BackendCartResponse,
} from "@/lib/cart/sync-utils";

export type { CartItem } from "@/lib/cart/types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  decrementItem: (productId: number, variantId?: number | null) => void;
  removeItem: (productId: number, variantId?: number | null) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "endoville_cart_v1";

const locationCurrencyMap = {
  USA: "USD",
  Kenya: "KES",
} as const;

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

const sameLine = (
  item: CartItem,
  productId: number,
  variantId: number | null | undefined
) => item.product.id === productId && (item.variantId ?? null) === (variantId ?? null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { auth, authLoading } = useAuth();
  const { location } = useLocation();
  const currency =
    location === "Kenya" || location === "USA"
      ? locationCurrencyMap[location]
      : undefined;

  const [items, setItems] = useState<CartItem[]>(() => loadStoredCart());
  const [mergeState, setMergeState] = useState<{
    backend: BackendCartResponse;
    localSnapshot: CartItem[];
    products: Product[];
  } | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const suppressRemoteSyncRef = useRef(false);
  const authBootstrapDoneRef = useRef(false);
  const prevLoggedInRef = useRef<boolean | null>(null);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const applyHydratedItems = useCallback((next: CartItem[]) => {
    setItems(next);
    persistCart(next);
  }, []);

  const hydrateFromServer = useCallback(
    async (products: Product[], backend: BackendCartResponse) => {
      const next = backendLinesToCartItems(backend.items, products);
      applyHydratedItems(next);
    },
    [applyHydratedItems]
  );

  /** Initial session (e.g. page load with cookie): server cart replaces local per API docs. */
  const bootstrapServerCartForSession = useCallback(async () => {
    suppressRemoteSyncRef.current = true;
    try {
      const [backend, products] = await Promise.all([
        getMyCart(),
        fetchProducts(currency ? { currency } : undefined),
      ]);
      await hydrateFromServer(products, backend);
    } catch {
      // Keep local cart if the request fails (e.g. network).
    } finally {
      suppressRemoteSyncRef.current = false;
    }
  }, [currency, hydrateFromServer]);

  const reconcileAfterLogin = useCallback(async () => {
    suppressRemoteSyncRef.current = true;
    try {
      const local = [...itemsRef.current];
      const [backend, products] = await Promise.all([
        getMyCart(),
        fetchProducts(currency ? { currency } : undefined),
      ]);
      const localNonEmpty = local.length > 0;
      const backendNonEmpty = hasAnyLine(backend.items);

      if (!localNonEmpty && !backendNonEmpty) {
        return;
      }
      if (!localNonEmpty && backendNonEmpty) {
        await hydrateFromServer(products, backend);
        return;
      }
      if (localNonEmpty && !backendNonEmpty) {
        const res = await syncCart(cartItemsToSyncPayload(local));
        await hydrateFromServer(products, res);
        return;
      }
      setMergeState({ backend, localSnapshot: local, products });
    } catch {
      // Keep local cart on failure.
    } finally {
      suppressRemoteSyncRef.current = false;
    }
  }, [currency, hydrateFromServer]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authBootstrapDoneRef.current) {
      authBootstrapDoneRef.current = true;
      prevLoggedInRef.current = Boolean(auth?.user);
      if (auth?.user) {
        void bootstrapServerCartForSession();
      }
      return;
    }

    const wasLoggedIn = prevLoggedInRef.current === true;
    const isLoggedIn = Boolean(auth?.user);
    prevLoggedInRef.current = isLoggedIn;

    if (wasLoggedIn && !isLoggedIn) {
      return;
    }
    if (!wasLoggedIn && isLoggedIn) {
      void reconcileAfterLogin();
    }
  }, [auth, authLoading, bootstrapServerCartForSession, reconcileAfterLogin]);

  useEffect(() => {
    if (!auth?.user || authLoading) {
      return;
    }
    if (mergeState) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (suppressRemoteSyncRef.current) {
        return;
      }
      const payload = cartItemsToSyncPayload(itemsRef.current);
      syncCart(payload).catch(() => {
        // Silent failure; cart stays local until next change or navigation.
      });
    }, 750);

    return () => window.clearTimeout(timer);
  }, [items, auth?.user, authLoading, mergeState]);

  const handleMergeKeepLocal = useCallback(async () => {
    if (!mergeState) {
      return;
    }
    const { localSnapshot, products, backend: _backend } = mergeState;
    setMergeState(null);
    setMergeBusy(true);
    suppressRemoteSyncRef.current = true;
    try {
      const res = await syncCart(cartItemsToSyncPayload(localSnapshot));
      const next = backendLinesToCartItems(res.items, products);
      applyHydratedItems(next);
    } catch {
      setMergeState({
        backend: _backend,
        localSnapshot,
        products,
      });
    } finally {
      setMergeBusy(false);
      suppressRemoteSyncRef.current = false;
    }
  }, [applyHydratedItems, mergeState]);

  const handleMergeCombine = useCallback(async () => {
    if (!mergeState) {
      return;
    }
    const { localSnapshot, products, backend } = mergeState;
    setMergeState(null);
    setMergeBusy(true);
    suppressRemoteSyncRef.current = true;
    try {
      const payload = mergeLocalAndBackendLines(localSnapshot, backend.items);
      const res = await syncCart(payload);
      const next = backendLinesToCartItems(res.items, products);
      applyHydratedItems(next);
    } catch {
      setMergeState({
        backend,
        localSnapshot,
        products,
      });
    } finally {
      setMergeBusy(false);
      suppressRemoteSyncRef.current = false;
    }
  }, [applyHydratedItems, mergeState]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.variantId == null || item.variantId === undefined)
      );
      const next = existing
        ? prev.map((item) =>
            item.product.id === product.id &&
            (item.variantId == null || item.variantId === undefined)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...prev, { product, quantity, variantId: undefined }];
      persistCart(next);
      return next;
    });
  }, []);

  const decrementItem = useCallback((productId: number, variantId?: number | null) => {
    setItems((prev) => {
      const next = prev
        .map((item) =>
          sameLine(item, productId, variantId)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number, variantId?: number | null) => {
    setItems((prev) => {
      const next = prev.filter((item) => !sameLine(item, productId, variantId));
      persistCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: number, quantity: number, variantId?: number | null) => {
      setItems((prev) => {
        const next = prev
          .map((item) =>
            sameLine(item, productId, variantId) ? { ...item, quantity } : item
          )
          .filter((item) => item.quantity > 0);
        persistCart(next);
        return next;
      });
    },
    []
  );

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

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartMergeDialog
        open={Boolean(mergeState)}
        localItems={mergeState?.localSnapshot ?? []}
        backend={mergeState?.backend ?? { id: 0, user: 0, items: [], subtotal: "0", created_at: "", updated_at: "" }}
        busy={mergeBusy}
        onKeepLocal={handleMergeKeepLocal}
        onMerge={handleMergeCombine}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
};
