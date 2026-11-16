"use client";

import { Minus, Plus, ShoppingBasket, Star } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/state/cart-context";
import { useToast } from "@/lib/state/toast-context";

type ProductCardProps = {
  product: Product;
  /** `row` = mobile list layout; `tile` = vertical grid card (default). */
  layout?: "tile" | "row";
};

const formatPrice = (price: string, currencySymbol?: string) => {
  const symbol = currencySymbol ?? "";
  const numericPrice = Number(price);
  const formattedPrice = Number.isFinite(numericPrice)
    ? numericPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : price;
  return symbol ? `${symbol}${formattedPrice}` : formattedPrice;
};

const getAverageRating = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const formatReviewCount = (count: number) => count.toLocaleString("en-US");

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" fill="#FFFFFF"/>
      <rect x="56" y="70" width="128" height="100" rx="12" fill="#E5E7EB"/>
      <path d="M80 150l26-30 20 22 26-34 28 42H80z" fill="#D1D5DB"/>
      <circle cx="150" cy="96" r="10" fill="#D1D5DB"/>
    </svg>`
  );

function ProductImage({
  product,
  imageUrl,
  imageFailed,
  imageLoaded,
  onLoaded,
  onFailed,
  className,
}: {
  product: Product;
  imageUrl?: string;
  imageFailed: boolean;
  imageLoaded: boolean;
  onLoaded: () => void;
  onFailed: () => void;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#F5F5F5]", className)}>
      {product.featured && (
        <span className="absolute left-0 top-2 z-10 rounded-r-sm bg-[#0A6B3C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Featured
        </span>
      )}
      <img
        src={FALLBACK_SVG}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-contain p-2"
      />
      {imageUrl && !imageFailed && (
        <img
          src={imageUrl}
          alt={product.name}
          className={cn(
            "absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          decoding="async"
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) {
              onLoaded();
            }
          }}
          onLoad={onLoaded}
          onError={onFailed}
        />
      )}
    </div>
  );
}

export default function ProductCard({ product, layout = "tile" }: ProductCardProps) {
  const { addItem, decrementItem, items } = useCart();
  const { showToast } = useToast();
  const rating = getAverageRating(product.avg_rating);
  const reviewCount = product.review_count ?? 0;
  const imageUrl = product.image_urls?.[0];
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasVariants = (product.variants?.length ?? 0) > 1;
  const itemInCart = items.find(
    (item) =>
      item.product.id === product.id &&
      (item.variantId === undefined || item.variantId === null)
  );
  const quantityInCart = itemInCart?.quantity ?? 0;
  const filledStars = Math.round(rating);
  const brandName = product.brand_details?.name;
  const priceLabel = formatPrice(product.price, product.currency_symbol);

  const handleAdd = () => {
    addItem(product, 1);
    showToast("Added to basket.");
  };

  const handleDecrement = () => {
    decrementItem(product.id);
    showToast("Updated basket quantity.");
  };

  if (layout === "row") {
    return (
      <article className="flex gap-3 border-b border-gray-100 py-4 last:border-b-0">
        <div className="w-[108px] shrink-0 sm:w-[120px]">
          <Link href={`/products/${product.slug}`} className="block">
            <ProductImage
              product={product}
              imageUrl={imageUrl}
              imageFailed={imageFailed}
              imageLoaded={imageLoaded}
              onLoaded={() => setImageLoaded(true)}
              onFailed={() => setImageFailed(true)}
              className="aspect-square rounded-lg"
            />
          </Link>
          {hasVariants && (
            <Link
              href={`/products/${product.slug}`}
              className="mt-1.5 block text-center text-xs font-medium text-[#126CC5]"
            >
              + More options
            </Link>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/products/${product.slug}`} className="block space-y-0.5">
            {brandName && (
              <p className="text-[12px] font-semibold leading-4 text-gray-900">{brandName}</p>
            )}
            <h3 className="line-clamp-3 text-[14px] font-semibold leading-5 text-gray-900">
              {product.name}
            </h3>
          </Link>

          <div className="mt-1.5 flex items-center gap-1 text-[13px]">
            <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
            <Star className="h-3.5 w-3.5 fill-[#F2BA52] text-[#F2BA52]" />
            {reviewCount > 0 && (
              <Link
                href={`/products/${product.slug}`}
                className="text-gray-500 hover:text-[#126CC5]"
              >
                ({formatReviewCount(reviewCount)})
              </Link>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <p className="text-lg font-bold leading-none text-gray-900">{priceLabel}</p>

            {quantityInCart > 0 ? (
              <div className="flex items-center gap-1 rounded-full bg-gray-100 p-0.5">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#4C1C59]"
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-5 text-center text-sm font-semibold text-gray-900">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#4C1C59]"
                  onClick={handleAdd}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#4C1C59] px-3.5 text-sm font-semibold text-white"
              >
                <ShoppingBasket className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="relative aspect-4/5 overflow-hidden bg-white sm:aspect-square">
        {product.featured && (
          <span className="absolute left-0 top-2 z-20 rounded-r-sm bg-[#0A6B3C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Featured
          </span>
        )}

        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          <img
            src={FALLBACK_SVG}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-contain p-2"
          />
          {imageUrl && !imageFailed && (
            <img
              src={imageUrl}
              alt={product.name}
              className={cn(
                "absolute inset-0 h-full w-full object-contain p-2 transition-[opacity,transform] duration-300 group-hover:scale-[1.02]",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              decoding="async"
              ref={(img) => {
                if (img?.complete && img.naturalWidth > 0) {
                  setImageLoaded(true);
                }
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
            />
          )}
        </Link>

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 px-2 pb-2",
            quantityInCart === 0 &&
              "pointer-events-none opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          )}
        >
          {quantityInCart > 0 ? (
            <div className="flex items-center gap-1 rounded-md bg-white/95 p-0.5 shadow-sm ring-1 ring-gray-200">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-[#4C1C59] transition-colors hover:bg-gray-100"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-6 flex-1 text-center text-xs font-semibold text-gray-900">
                {quantityInCart}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded text-[#4C1C59] transition-colors hover:bg-gray-100"
                onClick={handleAdd}
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pointer-events-auto flex h-9 w-full items-center justify-center rounded-md bg-[#4C1C59] text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#361340]"
              onClick={handleAdd}
            >
              Add to basket
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-3 pt-1.5">
        {hasVariants && (
          <Link
            href={`/products/${product.slug}`}
            className="mb-0.5 text-xs font-medium text-[#126CC5] hover:underline"
          >
            + More options
          </Link>
        )}

        <Link href={`/products/${product.slug}`} className="block space-y-0.5">
          {brandName && (
            <p className="truncate text-[11px] font-medium leading-4 text-gray-500">
              {brandName}
            </p>
          )}
          <h3 className="line-clamp-2 text-[13px] leading-5 text-[#181B1F] transition-colors group-hover:text-[#4C1C59]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1">
          <div className="flex items-center" aria-label={`${rating.toFixed(1)} out of 5`}>
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "h-3 w-3",
                  index < filledStars
                    ? "fill-[#F2BA52] text-[#F2BA52]"
                    : "fill-gray-200 text-gray-200"
                )}
              />
            ))}
          </div>
          {reviewCount > 0 && (
            <Link
              href={`/products/${product.slug}`}
              className="text-[11px] text-[#126CC5] hover:underline"
            >
              {formatReviewCount(reviewCount)}
            </Link>
          )}
        </div>

        <div className="mt-auto pt-1.5">
          <div className="text-base font-bold leading-none text-[#181B1F]">{priceLabel}</div>
        </div>
      </div>
    </div>
  );
}
