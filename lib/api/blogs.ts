"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BlogCategory = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  subcategories: BlogSubcategory[];
};

export type BlogSubcategory = {
  id: number;
  name: string;
  category: number;
  category_name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type BlogPostListItem = {
  id: number;
  title: string;
  slug: string;
  author: number;
  author_name: string;
  excerpt: string;
  featured_image_url: string;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  subcategories: number[];
  subcategories_details: BlogSubcategory[];
};

export type BlogPost = BlogPostListItem & {
  content: string;
  related_products: number[];
  related_products_details: Array<{
    id: number;
    name: string;
    slug: string;
    price: string;
    image_urls: string[];
  }>;
};

export type BlogPostsQueryParams = {
  search?: string;
  category?: number;
  subcategory?: number;
};

const buildPostsPath = (params?: BlogPostsQueryParams) => {
  const searchParams = new URLSearchParams();
  if (params?.search) {
    searchParams.set("search", params.search);
  }
  if (params?.subcategory) {
    searchParams.set("subcategory", String(params.subcategory));
  }
  if (params?.category) {
    searchParams.set("category", String(params.category));
  }
  const query = searchParams.toString();
  return query ? `/api/blogs/posts/?${query}` : "/api/blogs/posts/";
};

export const fetchBlogCategories = () =>
  apiFetch<BlogCategory[]>("/api/blogs/categories/");

export const fetchBlogSubcategories = () =>
  apiFetch<BlogSubcategory[]>("/api/blogs/subcategories/");

export const fetchBlogPosts = (params?: BlogPostsQueryParams) =>
  apiFetch<BlogPostListItem[]>(buildPostsPath(params));

export const fetchBlogPostById = (id: number) =>
  apiFetch<BlogPost>(`/api/blogs/posts/${id}/`);

export const useBlogCategoriesQuery = () =>
  useQuery({
    queryKey: ["blog-categories"],
    queryFn: fetchBlogCategories,
  });

export const useBlogSubcategoriesQuery = () =>
  useQuery({
    queryKey: ["blog-subcategories"],
    queryFn: fetchBlogSubcategories,
  });

export const useBlogPostsQuery = (params?: BlogPostsQueryParams) =>
  useQuery({
    queryKey: ["blog-posts", params?.search ?? "", params?.category ?? "", params?.subcategory ?? ""],
    queryFn: () => fetchBlogPosts(params),
  });

export const useBlogPostByIdQuery = (id: number | null) =>
  useQuery({
    queryKey: ["blog-post", id ?? "none"],
    queryFn: () => fetchBlogPostById(id as number),
    enabled: typeof id === "number",
  });
// TODO: add blog queries/mutations based on backend guide.
export const blogApi = {};
