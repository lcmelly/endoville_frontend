"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, SlidersHorizontal, Star, X } from "lucide-react";
import ProductCard from "@/components/product-card";
import {
  useBrandsQuery,
  useCategoriesQuery,
  useProductsQuery,
  useSubcategoriesQuery,
} from "@/lib/api/products";
import { cn } from "@/lib/utils";

const parseNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRatingValue = (rating: string | null) => {
  const value = Number(rating ?? 0);
  return Number.isFinite(value) ? value : 0;
};

type SortOption = "rating_desc" | "price_asc" | "price_desc" | "name_asc";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "rating_desc", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A-Z" },
];

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: products, isLoading } = useProductsQuery();
  const { data: brands } = useBrandsQuery();
  const { data: categories } = useCategoriesQuery();
  const { data: subcategories } = useSubcategoriesQuery();

  const search = searchParams.get("search") ?? "";
  const filtersParam = searchParams.get("filters");
  const brandParam = searchParams.get("brand");
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");

  const [sort, setSort] = useState<SortOption>("rating_desc");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRatingFourPlus, setMinRatingFourPlus] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFilterMenu, setMobileFilterMenu] = useState<
    null | "category" | "brand" | "rating" | "price" | "sort"
  >(null);
  const pageSize = 12;

  const brandId = brandParam ? Number(brandParam) : null;
  const categoryId = categoryParam ? Number(categoryParam) : null;
  const subcategoryId = subcategoryParam ? Number(subcategoryParam) : null;

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const openFilters = () => {
    setMobileFilterMenu(null);
    setFiltersOpen(true);
    updateQuery({ filters: "1" });
  };

  const closeFilters = () => {
    setFiltersOpen(false);
    setMobileFilterMenu(null);
    if (filtersParam) {
      updateQuery({ filters: null });
    }
  };

  const toggleMobileFilterMenu = (
    menu: "category" | "brand" | "rating" | "price" | "sort"
  ) => {
    setMobileFilterMenu((prev) => (prev === menu ? null : menu));
  };

  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Featured";

  const clearAllFilters = () => {
    setInStockOnly(false);
    setMinRatingFourPlus(false);
    setMinPrice("");
    setMaxPrice("");
    updateQuery({
      search: null,
      brand: null,
      category: null,
      subcategory: null,
      filters: null,
    });
  };

  const subcategoriesByCategory = useMemo(() => {
    const grouped = new Map<number, NonNullable<typeof subcategories>>();
    (subcategories ?? []).forEach((subcategory) => {
      const list = grouped.get(subcategory.category) ?? [];
      list.push(subcategory);
      grouped.set(subcategory.category, list);
    });
    return grouped;
  }, [subcategories]);

  const activeSubcategories = useMemo(() => {
    if (categoryId && subcategoriesByCategory.has(categoryId)) {
      return subcategoriesByCategory.get(categoryId) ?? [];
    }
    return subcategories ?? [];
  }, [categoryId, subcategories, subcategoriesByCategory]);

  const activeBrandName = useMemo(
    () => brands?.find((brand) => brand.id === brandId)?.name ?? null,
    [brandId, brands]
  );

  const activeCategoryName = useMemo(
    () => categories?.find((category) => category.id === categoryId)?.name ?? null,
    [categories, categoryId]
  );

  const activeSubcategoryName = useMemo(
    () => subcategories?.find((subcategory) => subcategory.id === subcategoryId)?.name ?? null,
    [subcategories, subcategoryId]
  );

  const pageTitle = useMemo(() => {
    if (search.trim()) {
      return `Results for “${search.trim()}”`;
    }
    if (activeSubcategoryName) {
      return activeSubcategoryName;
    }
    if (activeCategoryName) {
      return activeCategoryName;
    }
    if (activeBrandName) {
      return activeBrandName;
    }
    return "Products";
  }, [search, activeSubcategoryName, activeCategoryName, activeBrandName]);

  const appliedFilterValues = useMemo(
    () =>
      [
        search || null,
        activeBrandName,
        activeCategoryName,
        activeSubcategoryName,
        inStockOnly ? "In stock" : null,
        minRatingFourPlus ? "4★ and up" : null,
        minPrice ? `Min: ${minPrice}` : null,
        maxPrice ? `Max: ${maxPrice}` : null,
      ].filter(Boolean) as string[],
    [
      search,
      activeBrandName,
      activeCategoryName,
      activeSubcategoryName,
      inStockOnly,
      minRatingFourPlus,
      minPrice,
      maxPrice,
    ]
  );

  const hasActiveFilters = appliedFilterValues.length > 0;

  const filteredProducts = useMemo(() => {
    const min = parseNumber(minPrice);
    const max = parseNumber(maxPrice);
    const normalizedSearch = search.trim().toLowerCase();

    return (products ?? [])
      .filter((product) => {
        if (inStockOnly && product.stock <= 0) {
          return false;
        }
        if (minRatingFourPlus && getRatingValue(product.avg_rating) < 4) {
          return false;
        }
        if (brandId && product.brand !== brandId) {
          return false;
        }
        if (categoryId && (subcategories?.length ?? 0) > 0) {
          const subcategoryIds =
            subcategoriesByCategory.get(categoryId)?.map((sub) => sub.id) ?? [];
          if (!product.subcategories.some((id) => subcategoryIds.includes(id))) {
            return false;
          }
        }
        if (subcategoryId && !product.subcategories.includes(subcategoryId)) {
          return false;
        }
        if (normalizedSearch) {
          const haystack =
            `${product.brand_details?.name ?? ""} ${product.name} ${product.description}`.toLowerCase();
          if (!haystack.includes(normalizedSearch)) {
            return false;
          }
        }
        const price = Number(product.price);
        if (Number.isFinite(price)) {
          if (min !== null && price < min) {
            return false;
          }
          if (max !== null && price > max) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "rating_desc") {
          return getRatingValue(b.avg_rating) - getRatingValue(a.avg_rating);
        }
        if (sort === "price_asc") {
          return Number(a.price) - Number(b.price);
        }
        if (sort === "price_desc") {
          return Number(b.price) - Number(a.price);
        }
        if (sort === "name_asc") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [
    products,
    search,
    sort,
    inStockOnly,
    minRatingFourPlus,
    minPrice,
    maxPrice,
    brandId,
    categoryId,
    subcategoryId,
    subcategories,
    subcategoriesByCategory,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const resultStart =
    filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(currentPage * pageSize, filteredProducts.length);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const hasProducts = (products ?? []).length > 0;

  useEffect(() => {
    setPage(1);
  }, [
    search,
    sort,
    inStockOnly,
    minRatingFourPlus,
    minPrice,
    maxPrice,
    brandId,
    categoryId,
    subcategoryId,
  ]);

  useEffect(() => {
    if (categoryId && subcategoryId && subcategories) {
      const subcategory = subcategories.find((item) => item.id === subcategoryId);
      if (subcategory && subcategory.category !== categoryId) {
        updateQuery({ subcategory: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reconcile mismatched subcategory
  }, [categoryId, subcategoryId, subcategories]);

  useEffect(() => {
    setFiltersOpen(filtersParam === "1");
  }, [filtersParam]);

  const subcategoryPillClass = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
      active
        ? "border-[#4C1C59] bg-[#F4ECFF] text-[#4C1C59]"
        : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
    );

  const filterChipClass = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "border-[#4C1C59] bg-[#F4ECFF] text-[#4C1C59]"
        : "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200"
    );

  const mobileFilterPillClass = (active: boolean) =>
    cn(
      "inline-flex max-w-[11rem] shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-[#F4ECFF] text-[#4C1C59]"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
    );

  const pricePillLabel =
    minPrice || maxPrice
      ? [minPrice && `Min ${minPrice}`, maxPrice && `Max ${maxPrice}`]
          .filter(Boolean)
          .join(" · ")
      : "Price";

  const resultsMeta = (
    <div className="relative flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500 sm:text-base">
        {isLoading
          ? "Loading results…"
          : filteredProducts.length === 0
            ? "0 results"
            : `${resultStart} – ${resultEnd} of ${filteredProducts.length.toLocaleString("en-US")} results`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:border-[#4C1C59]/40"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}

        {/* Mobile: in-place sort pill + dropdown */}
        <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => toggleMobileFilterMenu("sort")}
            className={cn(
              mobileFilterPillClass(mobileFilterMenu === "sort"),
              "max-w-none"
            )}
            aria-expanded={mobileFilterMenu === "sort"}
            aria-haspopup="listbox"
          >
            <span>{activeSortLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
          {mobileFilterMenu === "sort" && (
            <div className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,14rem)] rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSort(option.value);
                    setMobileFilterMenu(null);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm",
                    sort === option.value
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: native select */}
        <label className="hidden items-center gap-2 text-sm text-gray-600 lg:flex">
          <span className="whitespace-nowrap">Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-9 rounded-full border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-[#4C1C59] focus:outline-none"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const renderPopularQuickFilters = (className?: string) => (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={() => setInStockOnly((prev) => !prev)}
        className={filterChipClass(inStockOnly)}
      >
        In stock
      </button>
      <button
        type="button"
        onClick={() => setMinRatingFourPlus((prev) => !prev)}
        className={filterChipClass(minRatingFourPlus)}
      >
        <Star className="h-3.5 w-3.5 fill-[#F2BA52] text-[#F2BA52]" />
        4 and up
      </button>
    </div>
  );

  const renderSidebarFields = () => (
    <>
      <div className="space-y-3 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">Brand</h3>
        <select
          value={brandId ? String(brandId) : ""}
          onChange={(event) =>
            updateQuery({
              brand: event.target.value || null,
            })
          }
          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
        >
          <option value="">All brands</option>
          {(brands ?? []).map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">Price range</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Min
            </label>
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Max
            </label>
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="200"
              inputMode="decimal"
              className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-5">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#4C1C59]"
          />
          Available items only
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={minRatingFourPlus}
            onChange={(event) => setMinRatingFourPlus(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#4C1C59]"
          />
          4 stars and up
        </label>
      </div>
    </>
  );

  return (
    <main className="container mx-auto px-4 pb-12 pt-6 md:pt-8">
      <nav
        className="mb-3 hidden items-center gap-1 text-sm text-gray-500 lg:flex"
        aria-label="Breadcrumb"
      >
        <Link href="/products" className="hover:text-[#4C1C59]">
          Products
        </Link>
        {activeCategoryName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            <button
              type="button"
              onClick={() => updateQuery({ category: String(categoryId), subcategory: null })}
              className="hover:text-[#4C1C59]"
            >
              {activeCategoryName}
            </button>
          </>
        )}
        {activeSubcategoryName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            <span className="text-gray-700">{activeSubcategoryName}</span>
          </>
        )}
        {!activeCategoryName && activeBrandName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            <span className="text-gray-700">{activeBrandName}</span>
          </>
        )}
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
        {pageTitle}
      </h1>

      {/* Subcategory pills: scroll on mobile, wrap on desktop */}
      {activeSubcategories.length > 0 && (
        <div className="-mx-4 mt-4 px-4 lg:mx-0 lg:mt-5 lg:px-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            <button
              type="button"
              onClick={() => updateQuery({ subcategory: null })}
              className={subcategoryPillClass(!subcategoryId)}
            >
              All
            </button>
            {activeSubcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                type="button"
                onClick={() =>
                  updateQuery({
                    category: String(subcategory.category),
                    subcategory:
                      subcategoryId === subcategory.id ? null : String(subcategory.id),
                  })
                }
                className={subcategoryPillClass(subcategoryId === subcategory.id)}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile filter pills — keep quick filters, add dropdown pills */}
      <div className="mt-3 -mx-4 px-4 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={openFilters} className={filterChipClass(filtersOpen)}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => setInStockOnly((prev) => !prev)}
            className={filterChipClass(inStockOnly)}
          >
            In stock
          </button>
          <button
            type="button"
            onClick={() => setMinRatingFourPlus((prev) => !prev)}
            className={filterChipClass(minRatingFourPlus)}
          >
            <Star className="h-3.5 w-3.5 fill-[#F2BA52] text-[#F2BA52]" />
            4 and up
          </button>
          <button
            type="button"
            onClick={() => toggleMobileFilterMenu("category")}
            className={mobileFilterPillClass(Boolean(categoryId) || mobileFilterMenu === "category")}
          >
            <span className="truncate">{activeCategoryName ?? "Category"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
          <button
            type="button"
            onClick={() => toggleMobileFilterMenu("brand")}
            className={mobileFilterPillClass(Boolean(brandId) || mobileFilterMenu === "brand")}
          >
            <span className="truncate">{activeBrandName ?? "Brands"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
          <button
            type="button"
            onClick={() => toggleMobileFilterMenu("rating")}
            className={mobileFilterPillClass(
              minRatingFourPlus || mobileFilterMenu === "rating"
            )}
          >
            <span className="truncate">
              {minRatingFourPlus ? "4★ and up" : "Ratings"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
          <button
            type="button"
            onClick={() => toggleMobileFilterMenu("price")}
            className={mobileFilterPillClass(
              Boolean(minPrice || maxPrice) || mobileFilterMenu === "price"
            )}
          >
            <span className="truncate">{pricePillLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
        </div>

        {mobileFilterMenu &&
          mobileFilterMenu !== "sort" && (
          <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 text-lg shadow-sm">
            {mobileFilterMenu === "category" && (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateQuery({ category: null, subcategory: null });
                    setMobileFilterMenu(null);
                  }}
                  className={cn(
                    "w-full rounded-lg px-4 py-3.5 text-left text-lg",
                    !categoryId
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  All categories
                </button>
                {(categories ?? []).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      updateQuery({
                        category: String(category.id),
                        subcategory: null,
                      });
                      setMobileFilterMenu(null);
                    }}
                    className={cn(
                      "w-full rounded-lg px-4 py-3.5 text-left text-lg",
                      categoryId === category.id
                        ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                        : "text-gray-800 hover:bg-gray-50"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {mobileFilterMenu === "brand" && (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateQuery({ brand: null });
                    setMobileFilterMenu(null);
                  }}
                  className={cn(
                    "w-full rounded-lg px-4 py-3.5 text-left text-lg",
                    !brandId
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  All brands
                </button>
                {(brands ?? []).map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      updateQuery({ brand: String(brand.id) });
                      setMobileFilterMenu(null);
                    }}
                    className={cn(
                      "w-full rounded-lg px-4 py-3.5 text-left text-lg",
                      brandId === brand.id
                        ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                        : "text-gray-800 hover:bg-gray-50"
                    )}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}

            {mobileFilterMenu === "rating" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMinRatingFourPlus(false);
                    setMobileFilterMenu(null);
                  }}
                  className={cn(
                    "w-full rounded-lg px-4 py-3.5 text-left text-lg",
                    !minRatingFourPlus
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  Any rating
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinRatingFourPlus(true);
                    setMobileFilterMenu(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-4 py-3.5 text-left text-lg",
                    minRatingFourPlus
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  <Star className="h-5 w-5 fill-[#F2BA52] text-[#F2BA52]" />
                  4 and up
                </button>
              </div>
            )}

            {mobileFilterMenu === "price" && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-base font-semibold text-gray-600">
                      Min
                    </label>
                    <input
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="0"
                      inputMode="decimal"
                      className="mt-2 h-12 w-full rounded-lg border border-gray-200 px-3 text-lg focus:border-[#4C1C59] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-base font-semibold text-gray-600">
                      Max
                    </label>
                    <input
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="200"
                      inputMode="decimal"
                      className="mt-2 h-12 w-full rounded-lg border border-gray-200 px-3 text-lg focus:border-[#4C1C59] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      setMobileFilterMenu(null);
                    }}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-3.5 text-lg font-medium text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFilterMenu(null)}
                    className="flex-1 rounded-lg bg-[#4C1C59] px-3 py-3.5 text-lg font-semibold text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
          <div className="sticky top-28 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Popular filters</h2>
              <div className="mt-3">{renderPopularQuickFilters()}</div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
              <button
                type="button"
                onClick={() => updateQuery({ category: null, subcategory: null })}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  !categoryId ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                All categories
              </button>
              {(categories ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    updateQuery({
                      category: String(category.id),
                      subcategory: null,
                    })
                  }
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    categoryId === category.id
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {renderSidebarFields()}
          </div>
        </aside>

        {/* Mobile filter drawer */}
        <div
          className={cn(
            "fixed inset-0 z-60 bg-black/30 transition-opacity lg:hidden",
            filtersOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={closeFilters}
          aria-hidden={!filtersOpen}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-70 w-[min(100%,22rem)] overflow-y-auto bg-white p-5 text-lg shadow-xl transition-transform duration-300 lg:hidden [&_button]:text-lg [&_h3]:text-base [&_input]:h-12 [&_input]:text-lg [&_label]:text-base [&_select]:h-12 [&_select]:text-lg",
            filtersOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-hidden={!filtersOpen}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
            <button
              type="button"
              onClick={closeFilters}
              className="rounded-full bg-gray-100 px-4 py-2 text-base font-semibold text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="mb-5">{renderPopularQuickFilters()}</div>

          <div className="space-y-1 border-t border-gray-100 pt-5">
            <h3 className="mb-2 font-semibold text-gray-900">Categories</h3>
            <button
              type="button"
              onClick={() => updateQuery({ category: null, subcategory: null })}
              className={cn(
                "w-full rounded-lg px-3.5 py-3 text-left transition-colors",
                !categoryId ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              All categories
            </button>
            {(categories ?? []).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  updateQuery({
                    category: String(category.id),
                    subcategory: null,
                  })
                }
                className={cn(
                  "w-full rounded-lg px-3.5 py-3 text-left transition-colors",
                  categoryId === category.id
                    ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {activeSubcategories.length > 0 && (
            <div className="mt-5 space-y-1 border-t border-gray-100 pt-5">
              <h3 className="mb-2 font-semibold text-gray-900">Subcategories</h3>
              <button
                type="button"
                onClick={() => updateQuery({ subcategory: null })}
                className={cn(
                  "w-full rounded-lg px-3.5 py-3 text-left transition-colors",
                  !subcategoryId
                    ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                All subcategories
              </button>
              {activeSubcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  onClick={() =>
                    updateQuery({
                      category: String(subcategory.category),
                      subcategory: String(subcategory.id),
                    })
                  }
                  className={cn(
                    "w-full rounded-lg px-3.5 py-3 text-left transition-colors",
                    subcategoryId === subcategory.id
                      ? "bg-[#F4ECFF] font-semibold text-[#4C1C59]"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          )}

          {renderSidebarFields()}

          <button
            type="button"
            onClick={closeFilters}
            className="mt-6 w-full rounded-xl bg-[#4C1C59] px-4 py-3.5 text-lg font-semibold text-white"
          >
            Show results
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4">{resultsMeta}</div>

          {isLoading ? (
            <>
              <div className="space-y-0 lg:hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3 border-b border-gray-100 py-4">
                    <div className="h-[108px] w-[108px] shrink-0 animate-pulse rounded-lg bg-gray-100" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                      <div className="mt-auto h-8 w-20 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden grid-cols-3 gap-x-3 gap-y-5 lg:grid xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-[280px] animate-pulse rounded-xl bg-white" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="lg:hidden">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} layout="row" />
                ))}
              </div>
              <div className="hidden grid-cols-3 gap-x-3 gap-y-5 lg:grid xl:grid-cols-4">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {!hasProducts && (
                <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                  No products available yet. Please check back soon.
                </div>
              )}

              {hasProducts && pagedProducts.length === 0 && (
                <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                  No products match your filters. Try adjusting the filters.
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductsPageFallback() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-3xl border border-gray-100 bg-white"
          />
        ))}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}
