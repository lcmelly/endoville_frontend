"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBlogPostsQuery } from "@/lib/api/blogs";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function EndovilleLivingPreview() {
  const { data: posts, isLoading } = useBlogPostsQuery();

  const latestPosts = useMemo(
    () =>
      [...(posts ?? [])]
        .filter((post) => post.is_published)
        .sort(
          (firstPost, secondPost) =>
            new Date(secondPost.created_at).getTime() - new Date(firstPost.created_at).getTime()
        )
        .slice(0, 8),
    [posts]
  );

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4C1C59]">
              Endoville Living
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Wellness, nutrition, and lifestyle
            </h2>
          </div>
          <Link
            href="/endoville-living"
            className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
          >
            View all
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-[220px] flex-1 animate-pulse rounded-2xl border border-gray-100 bg-white"
                >
                  <div className="h-32 w-full rounded-t-2xl bg-gray-100" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
              ))
            : latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/endoville-living/${post.slug}`}
                  className="group min-w-[220px] flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="h-32 w-full overflow-hidden bg-gray-100">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-medium text-gray-400">{formatDate(post.created_at)}</p>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#4C1C59]">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
