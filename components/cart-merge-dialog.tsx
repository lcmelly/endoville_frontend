"use client";

import type { BackendCartResponse } from "@/lib/cart/sync-utils";
import type { CartItem } from "@/lib/cart/types";

type CartMergeDialogProps = {
  open: boolean;
  localItems: CartItem[];
  backend: BackendCartResponse;
  busy: boolean;
  onKeepLocal: () => void;
  onMerge: () => void;
};

export function CartMergeDialog({
  open,
  localItems,
  backend,
  busy,
  onKeepLocal,
  onMerge,
}: CartMergeDialogProps) {
  if (!open) {
    return null;
  }

  const localCount = localItems.reduce((n, i) => n + i.quantity, 0);
  const backendCount = backend.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-merge-title"
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
      >
        <h2 id="cart-merge-title" className="text-lg font-semibold text-gray-900">
          Merge your cart?
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          You have <strong>{localCount}</strong> item{localCount === 1 ? "" : "s"} in this browser
          and <strong>{backendCount}</strong> in your saved account cart. Choose how to combine them.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>
            <span className="font-medium text-gray-900">Use this device&apos;s cart</span> — replaces
            your account cart with what you had while signed out.
          </li>
          <li>
            <span className="font-medium text-gray-900">Merge carts</span> — keeps everything from
            your account cart and adds items from this device; if the same product appears in both,
            the quantity from this device is used.
          </li>
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={busy}
            onClick={onMerge}
            className="h-11 flex-1 rounded-lg bg-[#4C1C59] text-sm font-semibold text-white transition-colors hover:bg-[#361340] disabled:opacity-60"
          >
            {busy ? "Saving..." : "Merge carts"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onKeepLocal}
            className="h-11 flex-1 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Use this device's cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
