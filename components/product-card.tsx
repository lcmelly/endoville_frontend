"use client";

import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/state/cart-context";
import { useToast } from "@/lib/state/toast-context";

type ProductCardProps = {
  product: Product;
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
  return symbol ? `${symbol} ${formattedPrice}` : formattedPrice;
};

const getAverageRating = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem, decrementItem, items } = useCart();
  const { showToast } = useToast();
  const rating = getAverageRating(product.avg_rating);
  const imageUrl = product.image_urls?.[0];
  const [imageFailed, setImageFailed] = useState(false);
  const itemInCart = items.find(
    (item) =>
      item.product.id === product.id &&
      (item.variantId === undefined || item.variantId === null)
  );
  const quantityInCart = itemInCart?.quantity ?? 0;

  const fallbackSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
        <rect width="240" height="240" rx="16" fill="#F3F4F6"/>
        <rect x="56" y="70" width="128" height="100" rx="12" fill="#E5E7EB"/>
        <path d="M80 150l26-30 20 22 26-34 28 42H80z" fill="#D1D5DB"/>
        <circle cx="150" cy="96" r="10" fill="#D1D5DB"/>
      </svg>`
    );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="group flex flex-1 flex-col">
        <div className="relative rounded-xl bg-gray-50 p-3 sm:p-4">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-36 sm:h-44 w-full object-contain"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <img
              src={fallbackSvg}
              alt="Product placeholder"
              className="h-36 sm:h-44 w-full object-contain"
              loading="lazy"
            />
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FBEFD2] px-2.5 py-1 text-xs font-semibold text-[#4C1C59]">
            <Star className="h-3.5 w-3.5 fill-[#F2BA52] text-[#F2BA52]" />
            {rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex flex-1 flex-col space-y-2 sm:space-y-3">
          <div className="space-y-1">
            {product.brand_details?.name && (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4C1C59]">
                {product.brand_details.name}
              </p>
            )}
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-[#4C1C59]">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-snug line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2 pt-2">
            <div className="text-base sm:text-lg font-bold text-[#4C1C59]">
              {formatPrice(product.price, product.currency_symbol)}
            </div>
            {quantityInCart > 0 && (
              <span className="rounded-full bg-[#F4ECFF] px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-[#4C1C59]">
                In cart: {quantityInCart}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={cn(
              "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border transition-colors",
              quantityInCart > 0
                ? "border-[#4C1C59] bg-[#4C1C59] text-white"
                : "border-gray-200 bg-white text-[#4C1C59] hover:border-[#4C1C59]/40"
            )}
            aria-label="Add to cart"
            onClick={() => {
              addItem(product, 1);
              showToast("Added to cart.");
            }}
          >
            {quantityInCart > 0 ? (
              <Plus className="h-5 w-5" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </button>
          {quantityInCart > 0 && (
            <button
              type="button"
              className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-gray-200 text-[#4C1C59] transition-colors hover:border-[#4C1C59]/40"
              onClick={() => {
                decrementItem(product.id);
                showToast("Updated cart quantity.");
              }}
              aria-label="Decrease quantity"
            >
              <Minus className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            className={cn(
              "flex h-9 sm:h-11 flex-1 items-center justify-center rounded-xl",
              "bg-[#F2BA52] text-xs sm:text-sm font-semibold text-[#361340] transition-colors hover:bg-[#E5A93F]"
            )}
            onClick={() => {
              addItem(product, 1);
              showToast("Added to cart.");
              router.push("/cart");
            }}
          >
            Buy Now
          </button>
      </div>
    </div>
  );
}
