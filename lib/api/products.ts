"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useLocation } from "@/lib/state/location-context";

export type ProductReview = {
  id: number;
  product: number;
  order: number;
  user: number;
  user_display: string;
  rating: number;
  body: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariantOptionDetail = {
  id: number;
  attribute: number;
  attribute_name: string;
  value: string;
};

export type ProductVariant = {
  id: number;
  product: number;
  options?: number[];
  options_details?: ProductVariantOptionDetail[];
  sku?: string | null;
  barcode: string | null;
  price: string;
  stock?: number;
  image_urls: string[];
  image_refs: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  avg_rating: string | null;
  review_count: number;
  reviews: ProductReview[];
  display_currency: string;
  currency_symbol: string;
};

export type Brand = {
  id: number;
  name: string;
  image_urls: string[];
  image_refs: string[];
  image_labels: string[];
  description: string | null;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  brand: number | null;
  brand_details?: Brand | null;
  price: string;
  display_currency: string;
  currency_symbol: string;
  stock: number;
  sku: string | null;
  barcode: string | null;
  image_urls: string[];
  image_refs: string[];
  subcategories: number[];
  meta_title: string | null;
  meta_description: string | null;
  slug: string;
  avg_rating: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  reviews: ProductReview[];
};

export type Category = {
  id: number;
  name: string;
  description: string | null;
};

export type Subcategory = {
  id: number;
  name: string;
  category: number;
};

export type ProductsQueryParams = {
  currency?: string;
};

const locationCurrencyMap = {
  USA: "USD",
  Kenya: "KES",
} as const;

const getCurrencyForLocation = (location?: keyof typeof locationCurrencyMap) =>
  location ? locationCurrencyMap[location] : undefined;

const buildProductsPath = (params?: ProductsQueryParams) => {
  if (!params?.currency) {
    return "/api/products/products/";
  }

  const searchParams = new URLSearchParams({ currency: params.currency });
  return `/api/products/products/?${searchParams.toString()}`;
};

export const fetchProducts = (params?: ProductsQueryParams) =>
  apiFetch<Product[]>(buildProductsPath(params));

export const fetchProductById = (id: number, params?: ProductsQueryParams) => {
  const basePath = buildProductsPath(params).replace(/\/?\?.*$/, "/");
  return apiFetch<Product>(`${basePath}${id}/`);
};

export const fetchCategories = () => apiFetch<Category[]>("/api/products/categories/");

export const fetchBrands = () => apiFetch<Brand[]>("/api/products/brands/");

export const fetchSubcategories = () =>
  apiFetch<Subcategory[]>("/api/products/subcategories/");

export const useProductsQuery = (params?: ProductsQueryParams) => {
  const { location } = useLocation();
  const currency = params?.currency ?? getCurrencyForLocation(location);
  const queryParams = currency ? { currency } : undefined;

  return useQuery({
    queryKey: ["products", currency ?? "default"],
    queryFn: () => fetchProducts(queryParams),
  });
};

export const useProductByIdQuery = (id: number | null, params?: ProductsQueryParams) => {
  const { location } = useLocation();
  const currency = params?.currency ?? getCurrencyForLocation(location);
  const queryParams = currency ? { currency } : undefined;

  return useQuery({
    queryKey: ["product", id ?? "none", currency ?? "default"],
    queryFn: () => fetchProductById(id as number, queryParams),
    enabled: typeof id === "number",
  });
};

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

export const useBrandsQuery = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

export const useSubcategoriesQuery = () =>
  useQuery({
    queryKey: ["subcategories"],
    queryFn: fetchSubcategories,
  });

export const productApi = {
  fetchCategories,
  fetchBrands,
  fetchProductById,
  fetchProducts,
  fetchSubcategories,
  useBrandsQuery,
  useCategoriesQuery,
  useProductByIdQuery,
  useProductsQuery,
  useSubcategoriesQuery,
};
