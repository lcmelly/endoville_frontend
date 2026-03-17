"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpenText, Dumbbell, Heart, Home, PlayCircle, Sparkles, Utensils } from "lucide-react";
import { BlogCategory, useBlogCategoriesQuery, useBlogPostsQuery } from "@/lib/api/blogs";
import { cn } from "@/lib/utils";

const buildCategoryMap = (categories: BlogCategory[]) =>
  categories.reduce<Record<number, BlogCategory>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

const formatViews = (views: number) => `${views.toLocaleString()} views`;
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const sidebarIcons = [Heart, Sparkles, Dumbbell, Utensils];

function EndovilleLivingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const categoryId = categoryParam ? Number(categoryParam) : null;
  const subcategoryId = subcategoryParam ? Number(subcategoryParam) : null;

  const { data: categories } = useBlogCategoriesQuery();
  const { data: posts, isLoading } = useBlogPostsQuery({
    search: search || undefined,
    category: categoryId ?? undefined,
    subcategory: subcategoryId ?? undefined,
  });

  const categoryMap = useMemo(() => buildCategoryMap(categories ?? []), [categories]);

  const sortedPosts = useMemo(
    () =>
      [...(posts ?? [])].sort(
        (firstPost, secondPost) =>
          new Date(secondPost.created_at).getTime() - new Date(firstPost.created_at).getTime()
      ),
    [posts]
  );

  const featuredPost = sortedPosts[0] ?? null;
  const popularPosts = useMemo(
    () => [...sortedPosts].sort((firstPost, secondPost) => secondPost.views - firstPost.views).slice(0, 3),
    [sortedPosts]
  );
  const explorePosts = useMemo(() => {
    const excludedIds = new Set([featuredPost?.id, ...popularPosts.map((post) => post.id)].filter(Boolean));
    return sortedPosts.filter((post) => !excludedIds.has(post.id)).slice(0, 8);
  }, [featuredPost?.id, popularPosts, sortedPosts]);

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
    router.push(query ? `/endoville-living?${query}` : "/endoville-living");
  };

  const activeCategory = categoryId ? categoryMap[categoryId] : null;
  const visibleCategories = categories ?? [];

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <aside className="relative">
          <div
            className={cn(
              "fixed inset-0 z-60 overflow-y-auto bg-white p-5 shadow-lg transition-transform duration-300 lg:sticky lg:top-[150px] lg:z-auto lg:h-fit lg:translate-x-0 lg:rounded-2xl lg:border lg:border-gray-200 lg:bg-[#f7f7f8] lg:p-6 lg:shadow-none",
              filtersOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none lg:pointer-events-auto"
            )}
          >
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <span className="text-base font-semibold text-gray-900">Endoville Living</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
              >
                Close
              </button>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Endoville Living</h2>

            <div className="mt-8">
              <Link
                href="/endoville-living"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  !categoryId && !subcategoryId
                    ? "bg-white text-[#4C1C59] shadow-sm ring-1 ring-[#4C1C59]/10"
                    : "text-gray-700 hover:bg-white hover:text-[#4C1C59]"
                )}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Sections
              </p>
              <div className="space-y-2">
                {visibleCategories.map((category, index) => {
                  const Icon = sidebarIcons[index % sidebarIcons.length];
                  return (
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
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      categoryId === category.id
                        ? "bg-white font-semibold text-[#4C1C59] shadow-sm ring-1 ring-[#4C1C59]/10"
                        : "text-gray-700 hover:bg-white hover:text-[#4C1C59]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </button>
                )})}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Content types
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#4C1C59] shadow-sm ring-1 ring-[#4C1C59]/10">
                  <BookOpenText className="h-4 w-4" />
                  <span>Articles</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-500">
                  <PlayCircle className="h-4 w-4" />
                  <span>Videos</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Topic filters
              </p>
              <div className="space-y-2">
                {(activeCategory?.subcategories ?? []).length === 0 && (
                  <span className="block px-3 text-xs leading-5 text-gray-400">
                    Pick a category above to show related topics.
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
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      subcategoryId === subcategory.id
                        ? "bg-white font-semibold text-[#4C1C59] shadow-sm ring-1 ring-[#4C1C59]/10"
                        : "text-gray-700 hover:bg-white hover:text-[#4C1C59]"
                    )}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-8">
          <div className="rounded-[28px] border border-[#4C1C59]/10 bg-linear-to-r from-[#f7ecfb] via-[#f4efff] to-[#fff6ef] px-6 py-10 text-center shadow-sm lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4C1C59]">
              Endoville Living
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Happier, Healthier Living, Delivered to your doorstep.
            </h1>
          
            {search && (
              <p className="mt-4 text-sm font-medium text-[#4C1C59]">
                Showing results for “{search}”
              </p>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="mt-5 rounded-full border border-[#4C1C59]/15 bg-white px-4 py-2 text-sm font-semibold text-[#4C1C59] transition-colors hover:border-[#4C1C59]/30 lg:hidden"
            >
              {filtersOpen ? "Hide menu" : "Browse sections"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-10">
              <div className="h-[420px] animate-pulse rounded-[28px] border border-gray-100 bg-white" />
              <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[300px] animate-pulse rounded-[24px] border border-gray-100 bg-white"
                  />
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[300px] animate-pulse rounded-[24px] border border-gray-100 bg-white"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {featuredPost ? (
                <section>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                    What&apos;s New
                  </p>
                  <div className="mt-4 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[0.95fr_1.25fr]">
                      <div className="p-6 lg:p-8">
                        <div className="h-1 w-10 rounded-full bg-[#4C1C59]" />
                        <h2 className="mt-5 text-3xl font-semibold leading-tight text-gray-900">
                          {featuredPost.title}
                        </h2>
                        <p className="mt-4 text-sm font-semibold text-[#4C1C59]">
                          {formatDate(featuredPost.created_at)}
                        </p>
                        <p className="mt-4 max-w-xl text-base leading-8 text-gray-600">
                          {featuredPost.excerpt}
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">{featuredPost.author_name}</span>
                          <span className="text-sm text-gray-400">{formatViews(featuredPost.views)}</span>
                        </div>
                        <div className="mt-8">
                          <span className="inline-flex rounded-xl bg-[#4C1C59] px-4 py-2 text-sm font-semibold text-white">
                            Read more
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-100">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={featuredPost.title}
                            className="h-full min-h-[340px] w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex min-h-[340px] items-center justify-center text-sm text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-[#4C1C59]">Popular Articles</h2>
                  <span className="text-sm text-gray-400">{popularPosts.length} highlighted</span>
                </div>
                {popularPosts.length > 0 ? (
                  <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {popularPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/endoville-living/${post.slug}`}
                        className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="overflow-hidden bg-gray-100">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-2xl font-semibold leading-tight text-gray-900 transition-colors group-hover:text-[#4C1C59]">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm text-gray-600">by {post.author_name}</p>
                          <p className="mt-2 text-xs text-gray-400">{formatViews(post.views)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                    No popular articles are available for the current filters.
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-[#4C1C59]">Explore</h2>
                  {(posts?.length ?? 0) > 0 ? (
                    <span className="text-sm text-gray-400">{posts?.length} total articles</span>
                  ) : null}
                </div>

                {explorePosts.length > 0 ? (
                  <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {explorePosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/endoville-living/${post.slug}`}
                        className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="overflow-hidden bg-gray-100">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="line-clamp-3 text-xl font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[#4C1C59]">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm text-gray-600">by {post.author_name}</p>
                          <p className="mt-2 text-xs text-gray-400">{formatViews(post.views)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                    No blog posts matched your current filters.
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EndovilleLivingPageFallback() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">
      <div className="space-y-10">
        <div className="h-48 animate-pulse rounded-[28px] border border-gray-100 bg-white" />
        <div className="h-[420px] animate-pulse rounded-[28px] border border-gray-100 bg-white" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[300px] animate-pulse rounded-[24px] border border-gray-100 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function EndovilleLivingPage() {
  return (
    <Suspense fallback={<EndovilleLivingPageFallback />}>
      <EndovilleLivingPageContent />
    </Suspense>
  );
}
