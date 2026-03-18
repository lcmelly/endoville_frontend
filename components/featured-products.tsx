"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { useProductsQuery } from "@/lib/api/products";

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const getVisibleCountForWidth = (width: number) => {
  if (width >= 1536) {
    return 5;
  }
  if (width >= 1280) {
    return 4;
  }
  if (width >= 1024) {
    return 3;
  }
  if (width >= 640) {
    return 2;
  }
  return 2;
};

export default function FeaturedProducts() {
  const { data: products, isLoading } = useProductsQuery();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const newArrivalsTrackRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [newArrivalsIndex, setNewArrivalsIndex] = useState(0);
  const [isNewArrivalsAnimating, setIsNewArrivalsAnimating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window === "undefined" ? 4 : getVisibleCountForWidth(window.innerWidth)
  );
  const [cardWidth, setCardWidth] = useState(0);
  const [newArrivalsCardWidth, setNewArrivalsCardWidth] = useState(0);
  const gapPx = 24;

  const topRatedProducts = useMemo(
    () =>
      (products ?? [])
        .slice()
        .sort((a, b) => getRatingValue(b.avg_rating) - getRatingValue(a.avg_rating))
        .slice(0, 9),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      (products ?? [])
        .slice()
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 50),
    [products]
  );

  const extendedProducts = useMemo(() => {
    if (topRatedProducts.length === 0) {
      return [];
    }
    return [...topRatedProducts, ...topRatedProducts];
  }, [topRatedProducts]);

  const totalItems = topRatedProducts.length;
  const shouldUseCarousel = totalItems > visibleCount;
  const hasMeasuredCarousel = !shouldUseCarousel || cardWidth > 0;
  const initialVisibleProducts = topRatedProducts.slice(0, visibleCount);
  const newArrivalsTotal = newArrivals.length;
  const shouldUseNewArrivalsCarousel = newArrivalsTotal > visibleCount;
  const hasMeasuredNewArrivals = !shouldUseNewArrivalsCarousel || newArrivalsCardWidth > 0;
  const initialVisibleNewArrivals = newArrivals.slice(0, visibleCount);

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
    if (currentIndex === 0) {
      setIsAnimating(false);
      setCurrentIndex(totalItems - 1);
      window.requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      return;
    }
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNewArrivalsNext = () => {
    if (newArrivalsTotal <= visibleCount) {
      return;
    }
    const maxIndex = Math.max(0, newArrivalsTotal - visibleCount);
    setIsNewArrivalsAnimating(true);
    setNewArrivalsIndex((prev) => {
      const nextIndex = prev + visibleCount;
      return nextIndex > maxIndex ? 0 : nextIndex;
    });
    window.setTimeout(() => setIsNewArrivalsAnimating(false), 300);
  };

  const handleNewArrivalsPrev = () => {
    if (newArrivalsTotal <= visibleCount) {
      return;
    }
    const maxIndex = Math.max(0, newArrivalsTotal - visibleCount);
    setIsNewArrivalsAnimating(true);
    setNewArrivalsIndex((prev) => {
      const nextIndex = prev - visibleCount;
      return nextIndex < 0 ? maxIndex : nextIndex;
    });
    window.setTimeout(() => setIsNewArrivalsAnimating(false), 300);
  };

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getVisibleCountForWidth(window.innerWidth));
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
  }, [visibleCount, totalItems, isLoading]);

  useEffect(() => {
    if (!newArrivalsTrackRef.current) {
      return;
    }

    const updateNewArrivalsCardWidth = () => {
      if (!newArrivalsTrackRef.current) {
        return;
      }
      const containerWidth = newArrivalsTrackRef.current.clientWidth;
      const nextCardWidth =
        (containerWidth - gapPx * (visibleCount - 1)) / visibleCount;
      setNewArrivalsCardWidth(nextCardWidth);
    };

    updateNewArrivalsCardWidth();
    const observer = new ResizeObserver(updateNewArrivalsCardWidth);
    observer.observe(newArrivalsTrackRef.current);

    return () => observer.disconnect();
  }, [visibleCount, newArrivalsTotal, isLoading]);

  useEffect(() => {
    if (!shouldUseCarousel || cardWidth <= 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [cardWidth, shouldUseCarousel]);

  useEffect(() => {
    if (!shouldUseCarousel || cardWidth <= 0) {
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
  }, [cardWidth, shouldUseCarousel]);

  useEffect(() => {
    if (!shouldUseCarousel) {
      return;
    }
    if (currentIndex >= totalItems) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [currentIndex, shouldUseCarousel, totalItems]);

  return (
    <>
      <section className="bg-transparent mb-12">
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
            <Link
              href="/products"
              className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
            >
              Shop all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {shouldUseCarousel && hasMeasuredCarousel && (
                <>
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
                </>
              )}
              <div className="overflow-hidden" ref={trackRef}>
                {hasMeasuredCarousel ? (
                  <div
                    className={`flex gap-6 ${
                      isAnimating ? "transition-transform duration-300 ease-out" : ""
                    }`}
                    style={{
                      transform: `translateX(-${currentIndex * (cardWidth + gapPx)}px)`,
                    }}
                  >
                    {(shouldUseCarousel ? extendedProducts : topRatedProducts).map(
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
                ) : (
                  <div
                    className="grid gap-6"
                    style={{
                      gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {initialVisibleProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-transparent mb-12">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold uppercase tracking-wide text-[#361340]">
                New arrivals
              </span>
              <h2 className="text-3xl font-bold text-gray-900">Fresh in store</h2>
              <p className="text-sm text-gray-500">
                Explore the latest additions to Endoville Health.
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
            >
              Shop all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {shouldUseNewArrivalsCarousel && (
                <>
                  <button
                    type="button"
                    onClick={handleNewArrivalsPrev}
                    className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-3 text-gray-600 shadow-sm transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
                    aria-label="Scroll new arrivals left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleNewArrivalsNext}
                    className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-3 text-gray-600 shadow-sm transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
                    aria-label="Scroll new arrivals right"
                  >
                    →
                  </button>
                </>
              )}
              <div className="overflow-hidden" ref={newArrivalsTrackRef}>
                {hasMeasuredNewArrivals ? (
                  <div
                    className={`flex gap-6 ${
                      isNewArrivalsAnimating ? "transition-transform duration-300 ease-out" : ""
                    }`}
                    style={{
                      transform: `translateX(-${
                        newArrivalsIndex * (newArrivalsCardWidth + gapPx)
                      }px)`,
                    }}
                  >
                    {(shouldUseNewArrivalsCarousel ? newArrivals : initialVisibleNewArrivals).map(
                      (product, index) => (
                        <div
                          key={`${product.id}-${index}`}
                          className="flex-none"
                          style={{
                            width: newArrivalsCardWidth
                              ? `${newArrivalsCardWidth}px`
                              : undefined,
                          }}
                        >
                          <ProductCard product={product} />
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div
                    className="grid gap-6"
                    style={{
                      gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {initialVisibleNewArrivals.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
