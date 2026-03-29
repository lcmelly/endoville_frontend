"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/state/cart-context";
import { useOrdersApi } from "@/lib/api/orders";
import { usePaymentsApi } from "@/lib/api/payments";
import { useProductsQuery } from "@/lib/api/products";
import { useAuth } from "@/lib/state/auth-context";
import { useToast } from "@/lib/state/toast-context";
import { useLocation } from "@/lib/state/location-context";

const parsePrice = (price: string) => {
  const value = Number(price);
  return Number.isFinite(value) ? value : 0;
};

const wait = (durationMs: number) =>
  new Promise((resolve) => window.setTimeout(resolve, durationMs));

const initialShipping = {
  full_name: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Kenya",
};

type ShippingState = typeof initialShipping;

const requiredShippingFields: Array<keyof ShippingState> = [
  "full_name",
  "phone",
  "email",
  "address_line_1",
  "city",
  "state",
  "postal_code",
  "country",
];

const getMissingShippingFields = (shipping: ShippingState) =>
  requiredShippingFields.filter((field) => !shipping[field].trim());

const inputClassName = (hasError: boolean) =>
  `h-11 w-full rounded-lg border px-3 text-sm focus:border-[#4C1C59] focus:outline-none ${
    hasError ? "border-red-300 bg-red-50" : "border-gray-200"
  }`;

const requiredLabelClassName =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const { auth, authLoading } = useAuth();
  const { placeOrder, getOrders } = useOrdersApi();
  const { createOrderPayment } = usePaymentsApi();
  const { data: products } = useProductsQuery();
  const { showToast } = useToast();
  const router = useRouter();
  const { location } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [stkProcessing, setStkProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShippingValidation, setShowShippingValidation] = useState(false);
  const [activeTab, setActiveTab] = useState<"shipping" | "payment">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [shipping, setShipping] = useState<ShippingState>(initialShipping);
  const orderSummaryRef = useRef<HTMLElement>(null);
  const isAuthenticated = Boolean(auth?.user);

  const productsById = useMemo(
    () => new Map((products ?? []).map((product) => [product.id, product])),
    [products]
  );

  const pricedItems = useMemo(
    () =>
      items.map((item) => {
        const displayProduct = productsById.get(item.product.id) ?? item.product;
        const unitPrice = parsePrice(displayProduct.price);

        return {
          item,
          displayProduct,
          lineTotal: unitPrice * item.quantity,
        };
      }),
    [items, productsById]
  );

  const totals = useMemo(() => {
    const subtotal = pricedItems.reduce((total, entry) => total + entry.lineTotal, 0);
    const currencySymbol =
      pricedItems[0]?.displayProduct.currency_symbol ??
      (location === "Kenya" ? "KSh" : items[0]?.product.currency_symbol ?? "");
    return { subtotal, currencySymbol };
  }, [items, location, pricedItems]);

  const missingShippingFields = useMemo(
    () => getMissingShippingFields(shipping),
    [shipping]
  );

  const shippingErrors = useMemo(
    () => new Set(showShippingValidation ? missingShippingFields : []),
    [missingShippingFields, showShippingValidation]
  );

  const handleShippingChange = (field: keyof ShippingState, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError(null);
    }
  };

  const canProceedToPayment = missingShippingFields.length === 0;

  const validateShippingBeforePayment = () => {
    if (canProceedToPayment) {
      setError(null);
      return true;
    }

    setShowShippingValidation(true);
    setActiveTab("shipping");
    setError("Please fill in all required shipping fields.");
    return false;
  };

  useEffect(() => {
    if (activeTab !== "payment") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      orderSummaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse products and add them to your cart.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#361340] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2a0f32]"
          >
            Shop products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16">
      {stkProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#4C1C59]" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Processing M-Pesa payment</h2>
            <p className="mt-2 text-sm text-gray-600">
              We have sent the STK push to your phone. Please complete it to continue.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Your cart</h1>
            <button
              type="button"
              onClick={clear}
              className="text-sm inline-flex items-center gap-2 font-medium text-red-500 hover:text-gray-600"
            >
              <X className="h-4 w-4 text-red-500" />
              Clear Cart
            </button>
          </div>

          <div className="space-y-4">
            {pricedItems.map(({ item, lineTotal }) => (
              <div
                key={item.product.id}
                className="relative grid grid-cols-[auto,1fr] gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex md:flex-row md:items-center md:gap-6"
              >
                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  className="absolute right-3 top-3 rounded-full p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  {item.product.image_urls?.[0] ? (
                    <img
                      src={item.product.image_urls[0]}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {item.product.name}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.product.description}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-4 md:col-span-1 md:justify-center md:mx-4">
                  <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-gray-200 text-sm"
                    onClick={() =>
                      updateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                    }
                  >
                    -
                  </button>
                  <span className="w-8 tabular-nums text-center text-sm font-semibold text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-gray-200 text-sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  </div>
                <div className="text-right md:text-left md:ml-auto md:min-w-[120px]">
                  <p className="text-sm font-semibold text-gray-900">
                    {totals.currencySymbol} {lineTotal.toFixed(2)}
                  </p>
                </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside
          ref={orderSummaryRef}
          className="w-full max-w-full lg:max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">
              {totals.currencySymbol} {totals.subtotal.toFixed(2)}
            </span>
          </div>
          {authLoading ? (
            <div className="mt-6 text-sm text-gray-600">Checking your session...</div>
          ) : isAuthenticated ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 p-1 text-xs font-semibold text-gray-500">
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`flex-1 rounded-full px-3 py-2 transition-colors ${
                    activeTab === "shipping"
                      ? "bg-[#4C1C59] text-white"
                      : "text-gray-500"
                  }`}
                >
                  Shipping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateShippingBeforePayment()) {
                      setActiveTab("payment");
                    }
                  }}
                  className={`flex-1 rounded-full px-3 py-2 transition-colors ${
                    activeTab === "payment"
                      ? "bg-[#4C1C59] text-white"
                      : "text-gray-500"
                  }`}
                >
                  Payment
                </button>
              </div>

              {activeTab === "shipping" ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">Shipping details</h3>
                    <span className="text-xs font-medium text-gray-500">
                      <span className="text-red-500">*</span> Required fields
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={requiredLabelClassName}>
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={shipping.full_name}
                        onChange={(event) => handleShippingChange("full_name", event.target.value)}
                        placeholder="Full name"
                        className={inputClassName(shippingErrors.has("full_name"))}
                      />
                    </div>
                    <div>
                      <label className={requiredLabelClassName}>
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={shipping.phone}
                        onChange={(event) => handleShippingChange("phone", event.target.value)}
                        placeholder="Phone"
                        className={inputClassName(shippingErrors.has("phone"))}
                      />
                    </div>
                    <div>
                      <label className={requiredLabelClassName}>
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={shipping.email}
                        onChange={(event) => handleShippingChange("email", event.target.value)}
                        placeholder="Email"
                        className={inputClassName(shippingErrors.has("email"))}
                      />
                    </div>
                    <div>
                      <label className={requiredLabelClassName}>
                        Address line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={shipping.address_line_1}
                        onChange={(event) =>
                          handleShippingChange("address_line_1", event.target.value)
                        }
                        placeholder="Address line 1"
                        className={inputClassName(shippingErrors.has("address_line_1"))}
                      />
                    </div>
                    <div>
                      <label className={requiredLabelClassName}>
                        Address line 2 <span className="normal-case font-normal text-gray-400">(optional)</span>
                      </label>
                      <input
                        value={shipping.address_line_2}
                        onChange={(event) =>
                          handleShippingChange("address_line_2", event.target.value)
                        }
                        placeholder="Address line 2 (optional)"
                        className={inputClassName(false)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={requiredLabelClassName}>
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={shipping.city}
                          onChange={(event) => handleShippingChange("city", event.target.value)}
                          placeholder="City"
                          className={inputClassName(shippingErrors.has("city"))}
                        />
                      </div>
                      <div>
                        <label className={requiredLabelClassName}>
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={shipping.state}
                          onChange={(event) => handleShippingChange("state", event.target.value)}
                          placeholder="State"
                          className={inputClassName(shippingErrors.has("state"))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={requiredLabelClassName}>
                          Postal code <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={shipping.postal_code}
                          onChange={(event) =>
                            handleShippingChange("postal_code", event.target.value)
                          }
                          placeholder="Postal code"
                          className={inputClassName(shippingErrors.has("postal_code"))}
                        />
                      </div>
                      <div>
                        <label className={requiredLabelClassName}>
                          Country <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={shipping.country}
                          onChange={(event) => handleShippingChange("country", event.target.value)}
                          placeholder="Country"
                          className={inputClassName(shippingErrors.has("country"))}
                        />
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      if (validateShippingBeforePayment()) {
                        setActiveTab("payment");
                      }
                    }}
                    className="w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340]"
                  >
                    Continue to payment
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
                  {location === "Kenya" ? (
                    <div className="space-y-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("mpesa")}
                          className={`flex items-center justify-center rounded-lg border px-3 py-3 transition-colors ${
                            paymentMethod === "mpesa"
                              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
                              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
                          }`}
                        >
                          <img
                            src="/mpesa.png"
                            alt="M-Pesa"
                            className="h-8 w-auto max-w-[140px] object-contain"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`flex items-center justify-center rounded-lg border px-3 py-3 transition-colors ${
                            paymentMethod === "card"
                              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
                              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
                          }`}
                        >
                          <img
                            src="/visa_mastercard.png"
                            alt="Visa and Mastercard"
                            className="h-8 w-auto max-w-[160px] object-contain"
                          />
                        </button>
                      </div>
                      {paymentMethod === "mpesa" && (
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Mobile number
                          </label>
                          <input
                            value={mpesaPhone}
                            onChange={(event) => setMpesaPhone(event.target.value)}
                            placeholder="0712345678"
                            className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-gray-600">Pay securely using your card.</p>
                      <div className="flex justify-center rounded-lg border border-gray-200 bg-white px-3 py-3">
                        <img
                          src="/visa_mastercard.png"
                          alt="Visa and Mastercard"
                          className="h-8 w-auto max-w-[160px] object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="button"
                    disabled={submitting || stkProcessing || items.length === 0}
                    onClick={async () => {
                      if (!validateShippingBeforePayment()) {
                        return;
                      }

                      setError(null);
                      try {
                        setSubmitting(true);
                        const orderPayload = {
                          shipping_address: shipping,
                          items: items.map((item) => ({
                            product: item.product.id,
                            quantity: item.quantity,
                          })),
                          shipping_fee: "0.00",
                          notes: "",
                        };
                        const existingOrders = await getOrders();
                        const cartSignature = items
                          .map((item) => ({
                            product: item.product.id,
                            variant: null,
                            quantity: item.quantity,
                          }))
                          .sort((a, b) => a.product - b.product);
                        const matchingOrder = existingOrders.find((order) => {
                          if (order.is_fully_paid) {
                            return false;
                          }
                          if (order.items.length !== cartSignature.length) {
                            return false;
                          }
                          const orderSignature = order.items
                            .map((item) => ({
                              product: item.product ?? 0,
                              variant: item.variant ?? null,
                              quantity: item.quantity,
                            }))
                            .sort((a, b) => a.product - b.product);
                          return orderSignature.every((item, index) => {
                            const cartItem = cartSignature[index];
                            return (
                              item.product === cartItem.product &&
                              item.variant === cartItem.variant &&
                              item.quantity === cartItem.quantity
                            );
                          });
                        });

                        const order = matchingOrder ?? (await placeOrder(orderPayload));
                        const origin = window.location.origin;
                        const isKenya = location === "Kenya";
                        const isMpesaPayment = isKenya && paymentMethod === "mpesa";
                        const payment = await createOrderPayment({
                          order: order.id,
                          provider: isMpesaPayment ? "intasend" : "stripe",
                          method: isMpesaPayment ? "stk" : "checkout",
                          phone_number: isMpesaPayment ? mpesaPhone : undefined,
                          email: shipping.email,
                          success_url: `${origin}/orders?payment=success`,
                          cancel_url: `${origin}/orders?payment=failed`,
                        });
                        if (payment.checkout_url) {
                          clear();
                          window.location.assign(payment.checkout_url);
                          return;
                        }
                        if (isMpesaPayment) {
                          clear();
                          setStkProcessing(true);
                          await wait(30000);
                          router.push("/orders");
                          return;
                        }
                        clear();
                        showToast(
                          isKenya
                            ? paymentMethod === "mpesa"
                              ? "STK prompt sent to your phone."
                              : "Payment initiated."
                            : "Payment initiated."
                        );
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : "Failed to place order."
                        );
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting || stkProcessing
                      ? "Processing..."
                      : location === "Kenya"
                      ? paymentMethod === "mpesa"
                        ? "M-Pesa STK Push"
                        : "Pay with Card/Paypal"
                      : "Pay with Card"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 text-sm text-gray-600">
              Please sign in or create an account to place an order.
            </div>
          )}
          {!authLoading && !isAuthenticated && (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340]"
            >
              Proceed to checkout
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
