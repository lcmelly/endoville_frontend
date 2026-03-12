"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/product-card";
import { useProductsQuery } from "@/lib/api/products";

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

export default function FeaturedProducts() {
  const { data: products, isLoading } = useProductsQuery();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const [cardWidth, setCardWidth] = useState(0);
  const gapPx = 24;

  const topRatedProducts = useMemo(
    () =>
      (products ?? [])
        .slice()
        .sort((a, b) => getRatingValue(b.avg_rating) - getRatingValue(a.avg_rating))
        .slice(0, 9),
    [products]
  );

  const extendedProducts = useMemo(() => {
    if (topRatedProducts.length === 0) {
      return [];
    }
    return [...topRatedProducts, ...topRatedProducts];
  }, [topRatedProducts]);

  const totalItems = topRatedProducts.length;

  const handleNext = () => {
    if (totalItems <= visibleCount) {
      return;
    }
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (totalItems <= visibleCount) {
      return;
    }
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (totalItems <= visibleCount) {
      return;
    }
    setCurrentIndex(totalItems);
  }, [totalItems]);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width >= 1536) {
        setVisibleCount(5);
      } else if (width >= 1280) {
        setVisibleCount(4);
      } else if (width >= 1024) {
        setVisibleCount(3);
      } else if (width >= 640) {
        setVisibleCount(2);
      } else {
        setVisibleCount(2);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }

    const updateCardWidth = () => {
      if (!trackRef.current) {
        return;
      }
      const containerWidth = trackRef.current.clientWidth;
      const nextCardWidth =
        (containerWidth - gapPx * (visibleCount - 1)) / visibleCount;
      setCardWidth(nextCardWidth);
    };

    updateCardWidth();
    const observer = new ResizeObserver(updateCardWidth);
    observer.observe(trackRef.current);

    return () => observer.disconnect();
  }, [visibleCount]);

  useEffect(() => {
    if (totalItems <= visibleCount) {
      return;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setIsAnimating(true);
      setCurrentIndex((prev) => prev + 1);
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [totalItems, visibleCount]);

  useEffect(() => {
    if (totalItems <= visibleCount) {
      return;
    }
    if (currentIndex >= totalItems * 2 - visibleCount) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(totalItems);
      }, 300);
      return () => clearTimeout(timeout);
    }
    if (currentIndex < totalItems) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(totalItems + (currentIndex % totalItems));
      }, 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [currentIndex, totalItems, visibleCount]);

  return (
    <section className="bg-transparent mb-10">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#361340]">
            Top rated
          </span>
          <h2 className="text-3xl font-bold text-gray-900">Best rated picks</h2>
          <p className="text-sm text-gray-500">
            Discover the most loved supplements from our community.
          </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-2xl border border-gray-100 bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-3 text-gray-600 shadow-sm transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
              aria-label="Scroll top rated products left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-3 text-gray-600 shadow-sm transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
              aria-label="Scroll top rated products right"
            >
              →
            </button>
            <div className="overflow-hidden" ref={trackRef}>
              <div
                className={`flex gap-6 ${
                  isAnimating ? "transition-transform duration-300 ease-out" : ""
                }`}
                style={{
                  transform: `translateX(-${currentIndex * (cardWidth + gapPx)}px)`,
                }}
              >
                {(totalItems <= visibleCount ? topRatedProducts : extendedProducts).map(
                  (product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="flex-none"
                      style={{
                        width: cardWidth ? `${cardWidth}px` : undefined,
                      }}
                    >
                      <ProductCard product={product} />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
