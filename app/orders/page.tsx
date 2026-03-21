"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/state/auth-context";
import { Order, useOrdersApi } from "@/lib/api/orders";
import { useProductsQuery } from "@/lib/api/products";
import { useToast } from "@/lib/state/toast-context";
import { OrderPaymentBlock } from "@/components/order-payment-block";
import { useLocation } from "@/lib/state/location-context";
import { formatOrderMoney } from "@/lib/currency-display";

const PREVIEW_ITEM_COUNT = 2;

const formatStatusLabel = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getShippingStatusTone = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (/(delivered|complete|completed)/.test(normalizedStatus)) {
    return "bg-green-100 text-green-700";
  }

  if (/(shipped|dispatch|out for delivery|in transit)/.test(normalizedStatus)) {
    return "bg-blue-100 text-blue-700";
  }

  if (/(cancelled|canceled|failed|returned)/.test(normalizedStatus)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
};

const getPaymentStatusTone = (isFullyPaid: boolean) =>
  isFullyPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";

function OrdersPageContent() {
  const { auth } = useAuth();
  const { getOrders } = useOrdersApi();
  const { data: products } = useProductsQuery();
  const { location } = useLocation();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productImageById = useMemo(
    () =>
      new Map(
        (products ?? []).map((product) => [product.id, product.image_urls?.[0] ?? null])
      ),
    [products]
  );
  const productById = useMemo(
    () => new Map((products ?? []).map((product) => [product.id, product])),
    [products]
  );

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) {
      return;
    }
    if (payment === "success") {
      showToast("Payment completed.");
    } else if (payment === "failed") {
      showToast("Payment not completed.");
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    if (!auth?.access) {
      setLoading(false);
      return;
    }
    let isActive = true;
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders();
        if (isActive) {
          setOrders(data);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load orders.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    loadOrders();
    return () => {
      isActive = false;
    };
  }, [auth?.access, getOrders]);

  if (!auth?.access) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          <p>Please sign in or create an account to view your orders.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[#361340] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2a0f32]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <Link
          href="/products"
          className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
        >
          Continue shopping
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-red-500">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          You have not placed any orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-[#4C1C59] hover:underline"
                  >
                    Order #{order.id}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <div className="text-sm font-semibold text-[#4C1C59]">
                    {formatOrderMoney(order.total, { location })}
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#4C1C59] transition-colors hover:text-[#361340] hover:underline"
                  >
                    More Details
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)]">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Products in this order
                  </h3>
                  <div className="mt-3 space-y-3">
                    {order.items.slice(0, PREVIEW_ITEM_COUNT).map((item) => {
                      const catalogProduct = item.product
                        ? productById.get(item.product)
                        : undefined;
                      const productHref =
                        catalogProduct?.slug && catalogProduct.slug.length > 0
                          ? `/products/${catalogProduct.slug}`
                          : null;
                      const rowClassName =
                        "flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3";
                      const interactiveClass = productHref
                        ? " transition-colors hover:border-[#4C1C59]/35 hover:bg-white"
                        : "";

                      const body = (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                              {item.product && productImageById.get(item.product) ? (
                                <img
                                  src={productImageById.get(item.product) ?? ""}
                                  alt={item.product_name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.product_name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Quantity: {item.quantity}
                                {item.variant_description
                                  ? ` • ${item.variant_description}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[#4C1C59]">
                            {formatOrderMoney(item.line_total, {
                              location,
                              symbolOverride: item.product
                                ? productById.get(item.product)?.currency_symbol
                                : undefined,
                            })}
                          </span>
                        </>
                      );

                      return productHref ? (
                        <Link
                          key={item.id}
                          href={productHref}
                          className={`${rowClassName}${interactiveClass}`}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div key={item.id} className={rowClassName}>
                          {body}
                        </div>
                      );
                    })}
                    {order.items.length > PREVIEW_ITEM_COUNT && (
                      <p className="text-sm text-gray-500">
                        +{order.items.length - PREVIEW_ITEM_COUNT} more{" "}
                        {order.items.length - PREVIEW_ITEM_COUNT === 1 ? "item" : "items"}{" "}
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-0.5 font-semibold text-[#4C1C59] hover:underline"
                        >
                          Expand order
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </Link>
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Shipping status
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getShippingStatusTone(
                        order.status
                      )}`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    Shipping to {order.shipping_address?.city ?? "your selected address"},{" "}
                    {order.shipping_address?.country ?? "destination pending"}.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusTone(
                      order.is_fully_paid
                    )}`}
                  >
                    {order.is_fully_paid ? "Payment Complete" : "Payment Pending"}
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>
                      Shipping:{" "}
                      <span className="font-medium text-gray-900">
                        {formatOrderMoney(order.shipping_fee, { location })}
                      </span>
                    </span>
                    <span>
                      Total:{" "}
                      <span className="font-semibold text-[#4C1C59]">
                        {formatOrderMoney(order.total, { location })}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <OrderPaymentBlock order={order} authEmail={auth?.user?.email} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function OrdersPageFallback() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-3xl border border-gray-100 bg-white"
          />
        ))}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageFallback />}>
      <OrdersPageContent />
    </Suspense>
  );
}
