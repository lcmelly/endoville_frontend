"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import {
  BlogCategory,
  useBlogCategoriesQuery,
  useBlogPostsQuery,
  useBlogPostByIdQuery,
} from "@/lib/api/blogs";
import { cn } from "@/lib/utils";

const buildCategoryMap = (categories: BlogCategory[]) =>
  categories.reduce<Record<number, BlogCategory>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

export default function EndovilleLivingDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const categoryId = categoryParam ? Number(categoryParam) : null;
  const subcategoryId = subcategoryParam ? Number(subcategoryParam) : null;
  const { data: categories } = useBlogCategoriesQuery();
  const { data: posts } = useBlogPostsQuery();
  const postId = useMemo(
    () => posts?.find((post) => post.slug === params.slug)?.id ?? null,
    [posts, params.slug]
  );
  const { data: post, isLoading } = useBlogPostByIdQuery(postId);
  const categoryMap = useMemo(
    () => buildCategoryMap(categories ?? []),
    [categories]
  );

  const updateQuery = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    const query = nextParams.toString();
    router.push(query ? `/endoville-living?${query}` : "/endoville-living");
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="h-[520px] rounded-3xl border border-gray-100 bg-white animate-pulse" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Blog post not found.
        </div>
      </main>
    );
  }

  const activeCategoryId = categoryId ?? post.subcategories_details?.[0]?.category ?? null;
  const activeCategory = activeCategoryId ? categoryMap[activeCategoryId] : null;
  const visibleCategories = categories ?? [];

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="flex flex-col gap-10 lg:flex-row">
        <aside className="w-full max-w-full lg:w-72">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-6">
              <Link
                href="/endoville-living"
                className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
              >
                ← Back to Endoville Living
              </Link>
            </div>

            <h2 className="text-base font-semibold text-gray-900">Categories</h2>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => updateQuery({ category: null, subcategory: null })}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  !categoryId ? "bg-[#F4ECFF] text-[#4C1C59]" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                All categories
              </button>
              {visibleCategories.map((category) => (
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
                    activeCategoryId === category.id
                      ? "bg-[#F4ECFF] text-[#4C1C59] font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">Subcategories</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ subcategory: null })}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    !subcategoryId ? "bg-[#F4ECFF] text-[#4C1C59]" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  All subcategories
                </button>
                {(activeCategory?.subcategories ?? []).length === 0 && (
                  <span className="block px-3 text-xs text-gray-400">
                    Select a category to see subcategories.
                  </span>
                )}
                {(activeCategory?.subcategories ?? []).map((subcategory) => (
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
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      subcategoryId === subcategory.id
                        ? "bg-[#F4ECFF] text-[#4C1C59] font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <article className="flex-1 grid gap-10 xl:grid-cols-[1.2fr,0.8fr] bg-white p-6 shadow-sm backdrop-blur rounded-3xl">
          <section className="space-y-6">
            {post.featured_image_url && (
              <div className="overflow-hidden bg-gray-100">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="h-[360px] w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{post.title}</h1>
              <p className="mt-2 text-sm text-gray-500">
                {post.author_name} · {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">About this post</h2>
              <p className="mt-2 text-sm text-gray-500">{post.excerpt}</p>
            </div>
            {post.related_products_details?.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">Related products</h2>
                <div className="mt-4 space-y-3">
                  {post.related_products_details.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#4C1C59]"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                        {product.image_urls?.[0] ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </article>
      </div>
    </main>
  );
}
