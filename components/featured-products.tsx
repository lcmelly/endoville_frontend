"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product-card";
import { useProductsQuery } from "@/lib/api/products";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const carouselArrowClassName =
  "absolute z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:border-gray-300 hover:text-gray-900 lg:flex";

const CAROUSEL_GAP_PX = 24;
const NATIVE_SCROLL_PEEK_PX = 28;

const trackClassName =
  "w-full min-w-0 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 [-webkit-overflow-scrolling:touch] lg:snap-none lg:overflow-hidden lg:pb-0";

const getCardWidth = (containerWidth: number, count: number, nativeScroll: boolean) => {
  if (containerWidth <= 0 || count <= 0) {
    return 0;
  }

  if (nativeScroll) {
    return Math.max(
      0,
      (containerWidth - CAROUSEL_GAP_PX * count - NATIVE_SCROLL_PEEK_PX) / count
    );
  }

  return Math.max(0, (containerWidth - CAROUSEL_GAP_PX * (count - 1)) / count);
};

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const getVisibleCountForWidth = (width: number) => {
  if (width >= 1536) {
    return 6;
  }
  if (width >= 1280) {
    return 5;
  }
  if (width >= 1024) {
    return 4;
  }
  if (width >= 640) {
    return 3;
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
  const useNativeScroll = visibleCount < 4;

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

  useIsomorphicLayoutEffect(() => {
    if (!trackRef.current) {
      return;
    }

    const updateCardWidth = () => {
      if (!trackRef.current) {
        return;
      }
      const containerWidth = trackRef.current.clientWidth;
      setCardWidth(getCardWidth(containerWidth, visibleCount, visibleCount < 4));
    };

    updateCardWidth();
    const observer = new ResizeObserver(updateCardWidth);
    observer.observe(trackRef.current);

    return () => observer.disconnect();
  }, [visibleCount, totalItems, isLoading]);

  useIsomorphicLayoutEffect(() => {
    if (!newArrivalsTrackRef.current) {
      return;
    }

    const updateNewArrivalsCardWidth = () => {
      if (!newArrivalsTrackRef.current) {
        return;
      }
      const containerWidth = newArrivalsTrackRef.current.clientWidth;
      setNewArrivalsCardWidth(
        getCardWidth(containerWidth, visibleCount, visibleCount < 4)
      );
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
    if (!shouldUseCarousel || cardWidth <= 0 || useNativeScroll) {
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
  }, [cardWidth, shouldUseCarousel, useNativeScroll]);

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
              <h2 className="text-3xl font-bold text-gray-900">Top Rated</h2>
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[280px] animate-pulse rounded-xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {shouldUseCarousel && hasMeasuredCarousel && !useNativeScroll && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className={cn(carouselArrowClassName, "left-0 -translate-x-1/2")}
                    style={{ top: cardWidth ? cardWidth * 0.88 : 180 }}
                    aria-label="Scroll top rated products left"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className={cn(carouselArrowClassName, "right-0 translate-x-1/2")}
                    style={{ top: cardWidth ? cardWidth * 0.88 : 180 }}
                    aria-label="Scroll top rated products right"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </>
              )}
              <div className={trackClassName} ref={trackRef}>
                {hasMeasuredCarousel ? (
                  <div
                    className={cn(
                      "flex w-max max-lg:!transform-none",
                      !useNativeScroll &&
                        isAnimating &&
                        "lg:transition-transform lg:duration-300 lg:ease-out"
                    )}
                    style={{
                      gap: CAROUSEL_GAP_PX,
                      transform: useNativeScroll
                        ? undefined
                        : `translateX(-${currentIndex * (cardWidth + CAROUSEL_GAP_PX)}px)`,
                    }}
                  >
                    {(useNativeScroll || !shouldUseCarousel
                      ? topRatedProducts
                      : extendedProducts
                    ).map((product, index) => (
                      <div
                        key={`${product.id}-${index}`}
                        className="flex-none snap-start lg:snap-none"
                        style={{
                          width: cardWidth ? `${cardWidth}px` : undefined,
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
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
              <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[280px] animate-pulse rounded-xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {shouldUseNewArrivalsCarousel && hasMeasuredNewArrivals && !useNativeScroll && (
                <>
                  <button
                    type="button"
                    onClick={handleNewArrivalsPrev}
                    className={cn(carouselArrowClassName, "left-0 -translate-x-1/2")}
                    style={{
                      top: newArrivalsCardWidth ? newArrivalsCardWidth * 0.88 : 180,
                    }}
                    aria-label="Scroll new arrivals left"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNewArrivalsNext}
                    className={cn(carouselArrowClassName, "right-0 translate-x-1/2")}
                    style={{
                      top: newArrivalsCardWidth ? newArrivalsCardWidth * 0.88 : 180,
                    }}
                    aria-label="Scroll new arrivals right"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </>
              )}
              <div className={trackClassName} ref={newArrivalsTrackRef}>
                {hasMeasuredNewArrivals ? (
                  <div
                    className={cn(
                      "flex w-max max-lg:!transform-none",
                      !useNativeScroll &&
                        isNewArrivalsAnimating &&
                        "lg:transition-transform lg:duration-300 lg:ease-out"
                    )}
                    style={{
                      gap: CAROUSEL_GAP_PX,
                      transform: useNativeScroll
                        ? undefined
                        : `translateX(-${
                            newArrivalsIndex * (newArrivalsCardWidth + CAROUSEL_GAP_PX)
                          }px)`,
                    }}
                  >
                    {newArrivals.map((product) => (
                      <div
                        key={product.id}
                        className="flex-none snap-start lg:snap-none"
                        style={{
                          width: newArrivalsCardWidth
                            ? `${newArrivalsCardWidth}px`
                            : undefined,
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
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
