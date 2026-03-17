"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import {
  useBrandsQuery,
  useCategoriesQuery,
  useProductsQuery,
  useSubcategoriesQuery,
} from "@/lib/api/products";

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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const closeFilters = () => {
    setFiltersOpen(false);
    if (filtersParam) {
      updateQuery({ filters: null });
    }
  };

  const subcategoriesByCategory = useMemo(() => {
    const grouped = new Map<number, typeof subcategories>();
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

  const appliedFilterValues = useMemo(
    () =>
      [
        search || null,
        activeBrandName,
        activeCategoryName,
        activeSubcategoryName,
        inStockOnly ? "In stock" : null,
      ].filter(Boolean) as string[],
    [search, activeBrandName, activeCategoryName, activeSubcategoryName, inStockOnly]
  );

  const filteredProducts = useMemo(() => {
    const min = parseNumber(minPrice);
    const max = parseNumber(maxPrice);
    const normalizedSearch = search.trim().toLowerCase();

    return (products ?? [])
      .filter((product) => {
        if (inStockOnly && product.stock <= 0) {
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
          const haystack = `${product.brand_details?.name ?? ""} ${product.name} ${product.description}`.toLowerCase();
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
    minPrice,
    maxPrice,
    brandId,
    categoryId,
    subcategoryId,
    subcategoriesByCategory,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const hasProducts = (products ?? []).length > 0;

  useEffect(() => {
    setPage(1);
  }, [search, sort, inStockOnly, minPrice, maxPrice, brandId, categoryId, subcategoryId]);

  useEffect(() => {
    if (categoryId && subcategoryId && subcategories) {
      const subcategory = subcategories.find((item) => item.id === subcategoryId);
      if (subcategory && subcategory.category !== categoryId) {
        updateQuery({ subcategory: null });
      }
    }
  }, [categoryId, subcategoryId, subcategories]);

  useEffect(() => {
    setFiltersOpen(filtersParam === "1");
  }, [filtersParam]);

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="flex flex-col gap-10 lg:flex-row">
        <aside className="w-full max-w-full lg:w-72">
          <div
            className={`fixed pb-6 inset-0 z-60 overflow-y-auto bg-white p-5 shadow-lg transition-transform duration-300 lg:static lg:z-auto lg:h-auto lg:translate-x-0 lg:rounded-2xl lg:border lg:border-gray-100 lg:p-5 lg:shadow-sm ${
              filtersOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none lg:pointer-events-auto"
            }`}
          >
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <span className="text-base font-semibold text-gray-900">Filters</span>
              <button
                type="button"
                onClick={closeFilters}
                className="absolute right-4 top-35 z-70 -translate-y-1/2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
              >
                Close
              </button>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Categories</h2>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => updateQuery({ category: null, subcategory: null })}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  !categoryId ? "bg-[#F4ECFF] text-[#4C1C59]" : "text-gray-600 hover:bg-gray-100"
                }`}
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
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    categoryId === category.id
                      ? "bg-[#F4ECFF] text-[#4C1C59] font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Brand</h3>
              <div className="mt-3">
                <select
                  value={brandId ? String(brandId) : ""}
                  onChange={(event) =>
                    updateQuery({
                      brand: event.target.value || null,
                    })
                  }
                  className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                >
                  <option value="">All brands</option>
                  {(brands ?? []).map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Price range</h3>
              <div className="mt-3 flex gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Min
                  </label>
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                    className="mt-2 h-10 w-24 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Max
                  </label>
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="200"
                    inputMode="decimal"
                    className="mt-2 h-10 w-24 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Subcategories</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ subcategory: null })}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    !subcategoryId
                      ? "bg-[#F4ECFF] text-[#4C1C59]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
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
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      subcategoryId === subcategory.id
                        ? "bg-[#F4ECFF] text-[#4C1C59] font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4C1C59]"
                />
                In stock only
              </label>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5 lg:hidden">
              <label className="text-sm font-semibold text-gray-900">Sort by</label>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="mt-3 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
              >
                <option value="rating_desc">Top rated</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-6 hidden flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full max-w-full flex-1 hidden lg:block">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Brands
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuery({ brand: null })}
                    className={`font-heading rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                      !brandId
                        ? "border-[#4C1C59] bg-[#F4ECFF] text-[#4C1C59]"
                        : "border-gray-200 text-gray-700 hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
                    }`}
                  >
                    All brands
                  </button>
                  {(brands ?? []).map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => updateQuery({ brand: String(brand.id) })}
                      className={`font-heading rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                        brandId === brand.id
                          ? "border-[#4C1C59] bg-[#F4ECFF] text-[#4C1C59]"
                          : "border-gray-200 text-gray-700 hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Sort by
                </label>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="mt-2 h-11 rounded-2xl border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
                >
                  <option value="rating_desc">Top rated</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="name_asc">Name: A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {appliedFilterValues.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
              {appliedFilterValues.map((value) => (
                <span
                  key={value}
                  className="font-heading rounded-full border border-[#4C1C59]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#4C1C59] shadow-sm"
                >
                  {value}
                </span>
              ))}
            </div>
          )}

          {search && (
            <div className="mb-6 hidden rounded-2xl border border-[#4C1C59]/10 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm lg:block">
              Showing product results for <span className="font-heading font-bold text-[#4C1C59]">"{search}"</span>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-6 grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-6 grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
