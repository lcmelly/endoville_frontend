"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/state/auth-context";
import { OrderDetail, useOrdersApi } from "@/lib/api/orders";
import { useProductsQuery } from "@/lib/api/products";
import { useToast } from "@/lib/state/toast-context";
import { OrderPaymentBlock } from "@/components/order-payment-block";
import { useLocation } from "@/lib/state/location-context";
import { formatOrderMoney } from "@/lib/currency-display";

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

const paymentRecordTone = (status: string) => {
  const s = status.toLowerCase();
  if (/(paid|complete|succeeded|success)/.test(s)) return "bg-green-100 text-green-700";
  if (/(fail|cancel|void)/.test(s)) return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const searchParams = useSearchParams();
  const { auth } = useAuth();
  const { getOrderById } = useOrdersApi();
  const { data: products } = useProductsQuery();
  const { location } = useLocation();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
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
    if (!payment) return;
    if (payment === "success") {
      showToast("Payment completed.");
    } else if (payment === "failed") {
      showToast("Payment not completed.");
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    if (!auth?.access || !Number.isFinite(orderId)) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(orderId);
        if (active) setOrder(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load order.");
          setOrder(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth?.access, getOrderById, orderId]);

  if (!auth?.access) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          <p>Please sign in to view this order.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[#361340] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2a0f32]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-red-600">
          {error ?? "Order not found."}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/orders"
            className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
          >
            ← Back to orders
          </Link>
        </div>
      </main>
    );
  }

  const addr = order.shipping_address;
  const shipment = order.shipment;
  const payments = order.payments ?? [];

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <Link
          href="/orders"
          className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
        >
          ← Back to orders
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleString()}
              {order.updated_at && order.updated_at !== order.created_at && (
                <span className="block text-xs">
                  Updated {new Date(order.updated_at).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getShippingStatusTone(
                order.status
              )}`}
            >
              {formatStatusLabel(order.status)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusTone(
                order.is_fully_paid
              )}`}
            >
              {order.is_fully_paid ? "Paid" : "Payment pending"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Items ({order.items.length})
          </h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => {
              const itemSymbol = item.product
                ? productById.get(item.product)?.currency_symbol
                : undefined;
              const catalogProduct = item.product
                ? productById.get(item.product)
                : undefined;
              const productHref =
                catalogProduct?.slug && catalogProduct.slug.length > 0
                  ? `/products/${catalogProduct.slug}`
                  : null;
              const rowClassName =
                "flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3";
              const interactiveClass = productHref
                ? " transition-colors hover:border-[#4C1C59]/35 hover:bg-white"
                : "";

              const body = (
                <>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{item.product_name}</p>
                      {item.variant_description ? (
                        <p className="mt-1 text-sm text-gray-600">{item.variant_description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-gray-500">
                        Qty {item.quantity} ×{" "}
                        {formatOrderMoney(item.unit_price, {
                          location,
                          symbolOverride: itemSymbol,
                        })}
                        {item.barcode ? ` • ${item.barcode}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#4C1C59]">
                    {formatOrderMoney(item.line_total, {
                      location,
                      symbolOverride: itemSymbol,
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
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatOrderMoney(order.subtotal, { location })}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-medium text-gray-900">
                {formatOrderMoney(order.shipping_fee, { location })}
              </span>
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-[#4C1C59]">
                {formatOrderMoney(order.total, { location })}
              </span>
            </div>
          </div>
        </section>

        {addr && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Shipping address
            </h2>
            <div className="mt-3 text-sm text-gray-800">
              <p className="font-semibold">{addr.full_name}</p>
              <p className="mt-1">{addr.address_line_1}</p>
              {addr.address_line_2 ? <p>{addr.address_line_2}</p> : null}
              <p>
                {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
              </p>
              <p>{addr.country}</p>
              <p className="mt-2 text-gray-600">
                {addr.phone} · {addr.email}
              </p>
            </div>
          </section>
        )}

        {order.notes?.trim() ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Order notes
            </h2>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </section>
        ) : null}

        {shipment && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Shipment
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getShippingStatusTone(
                  shipment.status
                )}`}
              >
                {formatStatusLabel(shipment.status)}
              </span>
              {shipment.carrier ? (
                <span className="text-sm text-gray-600">Carrier: {shipment.carrier}</span>
              ) : null}
            </div>
            {(shipment.tracking_number || shipment.tracking_url) && (
              <div className="mt-3 text-sm">
                {shipment.tracking_number && (
                  <p>
                    <span className="text-gray-500">Tracking: </span>
                    <span className="font-medium text-gray-900">{shipment.tracking_number}</span>
                  </p>
                )}
                {shipment.tracking_url && (
                  <a
                    href={shipment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-semibold text-[#4C1C59] hover:underline"
                  >
                    Open tracking link
                  </a>
                )}
              </div>
            )}
            {shipment.estimated_delivery_at && (
              <p className="mt-2 text-sm text-gray-600">
                Est. delivery:{" "}
                {new Date(shipment.estimated_delivery_at).toLocaleString()}
              </p>
            )}
            {shipment.delivered_at && (
              <p className="mt-1 text-sm text-green-700">
                Delivered {new Date(shipment.delivered_at).toLocaleString()}
              </p>
            )}
            {shipment.events?.length ? (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Timeline
                </h3>
                <ul className="mt-3 space-y-3">
                  {shipment.events
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.occurred_at).getTime() -
                        new Date(a.occurred_at).getTime()
                    )
                    .map((ev) => (
                      <li
                        key={ev.id}
                        className="border-l-2 border-[#4C1C59]/30 pl-4 text-sm"
                      >
                        <p className="font-medium text-gray-900">
                          {ev.message || formatStatusLabel(ev.status)}
                        </p>
                        {ev.location ? (
                          <p className="text-xs text-gray-500">{ev.location}</p>
                        ) : null}
                        <p className="text-xs text-gray-400">
                          {new Date(ev.occurred_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {payments.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Payments
            </h2>
            <div className="mt-4 space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.provider} ·{" "}
                      {formatOrderMoney(p.amount, {
                        location,
                        currencyCode: p.currency,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentRecordTone(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <OrderPaymentBlock
          order={order}
          authEmail={auth?.user?.email}
          paymentReturn="order-detail"
        />
      </div>
    </main>
  );
}

function OrderDetailFallback() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" />
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<OrderDetailFallback />}>
      <OrderDetailContent />
    </Suspense>
  );
}
