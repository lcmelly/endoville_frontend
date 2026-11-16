"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  LoaderCircle,
  MapPin,
  Package,
  Trash2,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/state/cart-context";
import { cartItemsToSyncPayload } from "@/lib/cart/sync-utils";
import { useOrdersApi } from "@/lib/api/orders";
import { usePaymentsApi } from "@/lib/api/payments";
import { useCurrenciesQuery, useProductsQuery, useSubcategoriesQuery } from "@/lib/api/products";
import { estimateShippingFromWeight, useShippingRatesQuery } from "@/lib/api/shipping";
import ProductCard from "@/components/product-card";
import { formatOrderMoney } from "@/lib/currency-display";
import { useAuth } from "@/lib/state/auth-context";
import { useToast } from "@/lib/state/toast-context";
import { useLocation, type LocationOption } from "@/lib/state/location-context";
import { cn } from "@/lib/utils";

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const parsePrice = (price: string) => {
  const value = Number(price);
  return Number.isFinite(value) ? value : 0;
};

const wait = (durationMs: number) =>
  new Promise((resolve) => window.setTimeout(resolve, durationMs));

const getDeliveryEstimate = (location: LocationOption) =>
  location === "Kenya"
    ? { label: "11–20 business days", minDays: 11, maxDays: 20 }
    : { label: "5–7 business days", minDays: 5, maxDays: 7 };

const formatEstimateWindow = (location: LocationOption) => {
  const { minDays, maxDays } = getDeliveryEstimate(location);
  const start = new Date();
  const end = new Date();
  start.setDate(start.getDate() + minDays);
  end.setDate(end.getDate() + maxDays);
  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
};

type CheckoutStep = "cart" | "shipping" | "payment";

const initialShipping = {
  full_name: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "USA",
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

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: "cart", label: "Basket" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
];

export default function BasketPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const { auth, authLoading } = useAuth();
  const { placeOrder, getOrders } = useOrdersApi();
  const { createOrderPayment } = usePaymentsApi();
  const { data: products } = useProductsQuery();
  const { data: subcategories } = useSubcategoriesQuery();
  const { data: currencies } = useCurrenciesQuery();
  const { showToast } = useToast();
  const router = useRouter();
  const { location } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [stkProcessing, setStkProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShippingValidation, setShowShippingValidation] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [shipping, setShipping] = useState<ShippingState>(() => ({
    ...initialShipping,
    country: location === "Kenya" ? "Kenya" : "USA",
  }));
  const isAuthenticated = Boolean(auth?.user);
  const deliveryEstimate = getDeliveryEstimate(location);
  const estimateWindow = formatEstimateWindow(location);

  const productsById = useMemo(
    () => new Map((products ?? []).map((product) => [product.id, product])),
    [products]
  );

  const pricedItems = useMemo(
    () =>
      items.map((item) => {
        const displayProduct = productsById.get(item.product.id) ?? item.product;
        const variant =
          item.variantId != null
            ? displayProduct.variants?.find((v) => v.id === item.variantId)
            : undefined;
        const unitPrice = parsePrice(variant?.price ?? displayProduct.price);

        return {
          item,
          displayProduct,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      }),
    [items, productsById]
  );

  const shippingCountry = shipping.country.trim() || (location === "Kenya" ? "Kenya" : "USA");
  const { data: shippingRates, isLoading: shippingRatesLoading } = useShippingRatesQuery();

  const cartWeightGrams = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = productsById.get(item.product.id) ?? item.product;
        const unitWeight = Number(product.unit_weight ?? 0);
        const safeWeight = Number.isFinite(unitWeight) && unitWeight > 0 ? unitWeight : 0;
        return total + safeWeight * item.quantity;
      }, 0),
    [items, productsById]
  );

  const shippingEstimate = useMemo(
    () => estimateShippingFromWeight(shippingRates, shippingCountry, cartWeightGrams),
    [cartWeightGrams, shippingCountry, shippingRates]
  );

  const shippingFeeUsd = shippingEstimate.feeUsd;

  const shippingFeeLocal = useMemo(() => {
    if (shippingFeeUsd === null) {
      return null;
    }
    if (location !== "Kenya") {
      return shippingFeeUsd;
    }
    const kesRate = Number(
      currencies?.find((currency) => currency.is_active && currency.code.toUpperCase() === "KES")
        ?.usd_rate ?? NaN
    );
    return Number.isFinite(kesRate) ? shippingFeeUsd * kesRate : shippingFeeUsd;
  }, [currencies, location, shippingFeeUsd]);

  const shippingFeeLabel = useMemo(() => {
    if (shippingRatesLoading) {
      return "Estimating…";
    }
    if (shippingEstimate.error) {
      return shippingEstimate.error;
    }
    if (shippingFeeUsd === null) {
      return "Unavailable";
    }
    if (shippingFeeUsd === 0) {
      return "Free";
    }
    return formatOrderMoney(shippingFeeUsd.toFixed(2), {
      location,
      currencies,
      sourceCurrencyCode: "USD",
    });
  }, [
    currencies,
    location,
    shippingEstimate.error,
    shippingFeeUsd,
    shippingRatesLoading,
  ]);

  const totals = useMemo(() => {
    const subtotal = pricedItems.reduce((total, entry) => total + entry.lineTotal, 0);
    const itemCount = pricedItems.reduce((total, entry) => total + entry.item.quantity, 0);
    const currencySymbol =
      pricedItems[0]?.displayProduct.currency_symbol ??
      (location === "Kenya" ? "KSh" : items[0]?.product.currency_symbol ?? "");
    const shippingAmount = shippingFeeLocal ?? 0;
    return {
      subtotal,
      currencySymbol,
      itemCount,
      shippingAmount,
      total: subtotal + shippingAmount,
    };
  }, [items, location, pricedItems, shippingFeeLocal]);

  const recommendedProducts = useMemo(() => {
    if (!products?.length) {
      return [];
    }

    const cartProductIds = new Set(items.map((item) => item.product.id));
    const cartSubcategoryIds = new Set<number>();
    for (const item of items) {
      const product = productsById.get(item.product.id) ?? item.product;
      for (const subcategoryId of product.subcategories ?? []) {
        cartSubcategoryIds.add(subcategoryId);
      }
    }

    const subcategoryToCategory = new Map(
      (subcategories ?? []).map((subcategory) => [subcategory.id, subcategory.category])
    );
    const cartCategoryIds = new Set<number>();
    for (const subcategoryId of cartSubcategoryIds) {
      const categoryId = subcategoryToCategory.get(subcategoryId);
      if (typeof categoryId === "number") {
        cartCategoryIds.add(categoryId);
      }
    }

    const subcategoryIdsInCartCategories = new Set(
      (subcategories ?? [])
        .filter((subcategory) => cartCategoryIds.has(subcategory.category))
        .map((subcategory) => subcategory.id)
    );

    // Prefer same-category matches; if cart items have no category data, fall back to top rated overall.
    const pool =
      cartCategoryIds.size > 0
        ? products.filter((product) =>
            (product.subcategories ?? []).some((id) => subcategoryIdsInCartCategories.has(id))
          )
        : products;

    return pool
      .filter((product) => !cartProductIds.has(product.id))
      .slice()
      .sort((a, b) => getRatingValue(b.avg_rating) - getRatingValue(a.avg_rating))
      .slice(0, 8);
  }, [items, products, productsById, subcategories]);

  const missingShippingFields = useMemo(
    () => getMissingShippingFields(shipping),
    [shipping]
  );

  const shippingErrors = useMemo(
    () => new Set(showShippingValidation ? missingShippingFields : []),
    [missingShippingFields, showShippingValidation]
  );

  const canProceedToPayment = missingShippingFields.length === 0;

  useEffect(() => {
    setShipping((prev) => ({
      ...prev,
      country: location === "Kenya" ? "Kenya" : "USA",
    }));
  }, [location]);

  useEffect(() => {
    if (auth?.user?.email && !shipping.email) {
      setShipping((prev) => ({ ...prev, email: auth.user?.email ?? prev.email }));
    }
  }, [auth?.user?.email, shipping.email]);

  const handleShippingChange = (field: keyof ShippingState, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError(null);
    }
  };

  const validateShippingBeforePayment = () => {
    if (canProceedToPayment) {
      setError(null);
      return true;
    }
    setShowShippingValidation(true);
    setStep("shipping");
    setError("Please fill in all required shipping fields.");
    return false;
  };

  const goToCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setStep("shipping");
  };

  const placeOrderAndPay = async () => {
    if (!validateShippingBeforePayment()) {
      return;
    }

    setError(null);
    try {
      setSubmitting(true);
      const orderPayload = {
        shipping_address: shipping,
        items: cartItemsToSyncPayload(items),
        shipping_fee: "0.00",
        notes: "",
      };
      const existingOrders = await getOrders();
      const lineSortKey = (product: number | null, variant: number | null) =>
        variant != null ? `v:${variant}` : `p:${product ?? 0}`;
      const cartSignature = cartItemsToSyncPayload(items)
        .map((row) => ({
          product: row.product ?? null,
          variant: row.variant ?? null,
          quantity: row.quantity,
        }))
        .sort((a, b) =>
          lineSortKey(a.product, a.variant).localeCompare(lineSortKey(b.product, b.variant))
        );
      const matchingOrder = existingOrders.find((order) => {
        if (order.is_fully_paid) {
          return false;
        }
        if (order.items.length !== cartSignature.length) {
          return false;
        }
        const orderSignature = order.items
          .map((item) => ({
            product: item.product ?? null,
            variant: item.variant ?? null,
            quantity: item.quantity,
          }))
          .sort((a, b) =>
            lineSortKey(a.product, a.variant).localeCompare(lineSortKey(b.product, b.variant))
          );
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
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Your basket is empty</h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse products and add them to your basket.
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

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);

  return (
    <main className="pb-16">
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

      {/* Delivery band */}
      <div className="border-b border-[#4C1C59]/10 bg-[#F4ECFF]">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-3 text-sm text-[#361340] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 sm:items-center">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
            <p>
              Delivering to <span className="font-semibold">{location}</span>
            </p>
          </div>
          <div className="flex items-start gap-2 sm:items-center">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
            <p>
              Estimated delivery{" "}
              <span className="font-semibold">{estimateWindow}</span>
              <span className="text-[#4C1C59]/70"> ({deliveryEstimate.label})</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-2 sm:gap-4">
          {STEPS.map((entry, index) => {
            const isComplete = index < stepIndex;
            const isCurrent = entry.id === step;
            return (
              <li key={entry.id} className="flex flex-1 items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                      isComplete || isCurrent
                        ? "bg-[#4C1C59] text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold sm:text-sm",
                      isCurrent ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {entry.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1",
                      index < stepIndex ? "bg-[#4C1C59]" : "bg-gray-200"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <section className="min-w-0 flex-1 space-y-4">
            {step !== "cart" && (
              <button
                type="button"
                onClick={() => setStep(step === "payment" ? "shipping" : "cart")}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#4C1C59] hover:text-[#361340]"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === "payment" ? "Back to shipping" : "Back to basket"}
              </button>
            )}

            {step === "cart" && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Your basket
                    <span className="ml-2 text-base font-normal text-gray-500">
                      ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})
                    </span>
                  </h1>
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>

                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                  {pricedItems.map(({ item, displayProduct, unitPrice, lineTotal }) => (
                    <div
                      key={`${item.product.id}-${item.variantId ?? "base"}`}
                      className="flex gap-4 p-4 sm:p-5"
                    >
                      <Link
                        href={`/products/${displayProduct.slug}`}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50"
                      >
                        {displayProduct.image_urls?.[0] ? (
                          <img
                            src={displayProduct.image_urls[0]}
                            alt={displayProduct.name}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {displayProduct.brand_details?.name && (
                              <p className="text-xs font-semibold text-gray-500">
                                {displayProduct.brand_details.name}
                              </p>
                            )}
                            <Link
                              href={`/products/${displayProduct.slug}`}
                              className="mt-0.5 block text-sm font-semibold text-gray-900 hover:text-[#4C1C59] sm:text-base"
                            >
                              {displayProduct.name}
                            </Link>
                            <p className="mt-1 text-sm text-gray-500">
                              {totals.currencySymbol}
                              {unitPrice.toFixed(2)} each
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id, item.variantId ?? null)}
                            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center text-sm text-gray-700"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  Math.max(1, item.quantity - 1),
                                  item.variantId ?? null
                                )
                              }
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center text-sm text-gray-700"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.variantId ?? null
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {totals.currencySymbol}
                            {lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === "shipping" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#4C1C59]" />
                  <h1 className="text-xl font-semibold text-gray-900">Shipping details</h1>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Where should we send your order in {location}?
                </p>

                <div className="mt-6 space-y-3">
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
                  <div className="grid gap-3 sm:grid-cols-2">
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
                      placeholder="Street address"
                      className={inputClassName(shippingErrors.has("address_line_1"))}
                    />
                  </div>
                  <div>
                    <label className={requiredLabelClassName}>
                      Address line 2{" "}
                      <span className="normal-case font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      value={shipping.address_line_2}
                      onChange={(event) =>
                        handleShippingChange("address_line_2", event.target.value)
                      }
                      placeholder="Apartment, suite, etc."
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
                        State / County <span className="text-red-500">*</span>
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
                        readOnly
                        className={cn(inputClassName(shippingErrors.has("country")), "bg-gray-50")}
                      />
                    </div>
                  </div>
                </div>
                {error && step === "shipping" && (
                  <p className="mt-4 text-sm text-red-500">{error}</p>
                )}
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
                <h1 className="text-xl font-semibold text-gray-900">Payment</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Choose how you’d like to pay for your order.
                </p>

                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">Ship to</p>
                  <p className="mt-1">
                    {shipping.full_name}
                    <br />
                    {shipping.address_line_1}
                    {shipping.address_line_2 ? `, ${shipping.address_line_2}` : ""}
                    <br />
                    {shipping.city}, {shipping.state} {shipping.postal_code}
                    <br />
                    {shipping.country}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {location === "Kenya" ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("mpesa")}
                          className={cn(
                            "flex items-center justify-center rounded-lg border px-3 py-3 transition-colors",
                            paymentMethod === "mpesa"
                              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
                              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
                          )}
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
                          className={cn(
                            "flex items-center justify-center rounded-lg border px-3 py-3 transition-colors",
                            paymentMethod === "card"
                              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
                              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
                          )}
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
                    </>
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
                </div>
                {error && step === "payment" && (
                  <p className="mt-4 text-sm text-red-500">{error}</p>
                )}
              </div>
            )}
          </section>

          <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>


              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>
                    Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-semibold text-gray-900">
                    {totals.currencySymbol}
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 text-gray-600">
                  <span>
                    Shipping
                    <span className="mt-0.5 block text-xs font-normal text-gray-400">
                      to {shippingCountry}
                      {cartWeightGrams > 0
                        ? ` · ${(cartWeightGrams / 1000).toFixed(2)} kg`
                        : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-right font-semibold",
                      shippingEstimate.error
                        ? "text-amber-700"
                        : shippingFeeUsd === 0
                          ? "text-[#0A6B3C]"
                          : "text-gray-900"
                    )}
                  >
                    {shippingFeeLabel}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-gray-100 pt-3 text-gray-600">
                  <span>Estimated delivery</span>
                  <span className="text-right font-medium text-gray-900">
                    {estimateWindow}
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">
                      {deliveryEstimate.label}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    {totals.currencySymbol}
                    {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {authLoading ? (
                <p className="mt-6 text-sm text-gray-500">Checking your session…</p>
              ) : step === "cart" ? (
                <>
                  {!isAuthenticated && (
                    <p className="mt-4 text-sm text-gray-500">
                      Sign in to continue to shipping and payment.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={goToCheckout}
                    className="mt-6 w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340]"
                  >
                    {isAuthenticated ? "Checkout" : "Sign in to checkout"}
                  </button>
                  <Link
                    href="/products"
                    className="mt-3 block text-center text-sm font-medium text-[#4C1C59] hover:text-[#361340]"
                  >
                    Continue shopping
                  </Link>
                </>
              ) : step === "shipping" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateShippingBeforePayment()) {
                      setStep("payment");
                    }
                  }}
                  className="mt-6 w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340]"
                >
                  Continue to payment
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || stkProcessing}
                  onClick={placeOrderAndPay}
                  className="mt-6 w-full rounded-lg bg-[#3D7C4E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2F6340] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting || stkProcessing
                    ? "Processing..."
                    : location === "Kenya"
                      ? paymentMethod === "mpesa"
                        ? "Pay with M-Pesa"
                        : "Pay with card"
                      : "Pay with card"}
                </button>
              )}
            </div>
          </aside>
        </div>

        {step === "cart" && recommendedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recommended for you</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Top-rated picks from categories in your basket
                </p>
              </div>
              <Link
                href="/products"
                className="shrink-0 text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
              >
                Shop all
              </Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[160px] shrink-0 sm:w-auto"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
