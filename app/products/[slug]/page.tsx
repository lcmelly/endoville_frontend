"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Minus, Plus, Star } from "lucide-react";
import { useProductByIdQuery, useProductsQuery } from "@/lib/api/products";
import { useCart } from "@/lib/state/cart-context";
import { useToast } from "@/lib/state/toast-context";

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const formatPrice = (price: string, currencySymbol?: string) =>
  `${currencySymbol ?? ""} ${price}`;

const getVariantLabel = (variant: { options_details?: { value: string }[] }) => {
  const values = variant.options_details?.map((option) => option.value).filter(Boolean);
  if (values && values.length > 0) {
    return values.join(" / ");
  }
  return "Variant";
};

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data: products } = useProductsQuery();
  const productId = useMemo(
    () => products?.find((item) => item.slug === params.slug)?.id ?? null,
    [products, params.slug]
  );
  const { data: product, isLoading } = useProductByIdQuery(productId);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const variants = product?.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product?.price ?? "0.00";
  const displayCurrency = selectedVariant?.currency_symbol ?? product?.currency_symbol ?? "";

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="h-[520px] rounded-3xl border border-gray-100 bg-white animate-pulse" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Product not found.
        </div>
      </main>
    );
  }

  const images = product.image_urls?.length ? product.image_urls : [];
  const rating = getRatingValue(product.avg_rating);

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="rounded-3xl bg-white/40 p-6 shadow-sm backdrop-blur">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <section className="lg:pr-4">
          <div className="p-1 lg:p-0">
            <div className="relative overflow-hidden rounded-2xl bg-[#F7F3EB]">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="h-[380px] w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-[380px] items-center justify-center text-sm text-gray-400">
                  No image available
                </div>
              )}
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`rounded-xl border p-2 transition-colors ${
                      activeImage === index
                        ? "border-[#4C1C59] bg-[#fffff00]"
                        : "border-gray-200 hover:border-[#4C1C59]/40"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-20 w-full object-contain"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-8 lg:pl-4">
          <div className="space-y-6">
            {product.brand_details?.name && (
              <span className="text-xs font-semibold uppercase tracking-wide text-[#4C1C59]">
                {product.brand_details.name}
              </span>
            )}
            {selectedVariant && (
              <span className="text-xs font-semibold uppercase tracking-wide text-[#4C1C59]">
                {getVariantLabel(selectedVariant)}
              </span>
            )}
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">{product.name}</h1>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < Math.round(rating)
                        ? "text-[#F2BA52] fill-[#F2BA52]"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span>{rating.toFixed(1)} rating</span>
            </div>

            <div className="mt-6 text-2xl font-semibold text-[#4C1C59]">
              {formatPrice(displayPrice, displayCurrency)}
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{product.description || "No description available."}</ReactMarkdown>
              </div>
            </div>

            {variants.length > 0 && (
              <div className="mt-6 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Variations
                </label>
                <select
                  value={selectedVariantId ?? variants[0].id}
                  onChange={(event) => setSelectedVariantId(Number(event.target.value))}
                  className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                >
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {getVariantLabel(variant)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>One-time purchase</span>
                <span className="text-[#4C1C59]">
                  {formatPrice(displayPrice, displayCurrency)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-6 w-6 rounded-full text-gray-600 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-700">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="h-6 w-6 rounded-full text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  addItem(product, quantity);
                  showToast("Added to cart.");
                }}
                className="flex-1 rounded-full bg-[#7B9450] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6B8447]"
              >
                Add to cart
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-6 border-b border-gray-100 pb-3 text-xs font-semibold uppercase tracking-wide text-[#4C1C59]">
              <span>Benefits</span>
              <span>Ingredients</span>
              <span>How to use</span>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Content will be populated from the backend.
            </div>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}
