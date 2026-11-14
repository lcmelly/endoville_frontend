"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listOrders, type Order } from "@/lib/api/orders";
import {
  ProductReview,
  useCreateProductReviewMutation,
  useDeleteProductReviewMutation,
  useProductReviewsQuery,
  useUpdateProductReviewMutation,
} from "@/lib/api/products";
import { useAuth } from "@/lib/state/auth-context";
import { useToast } from "@/lib/state/toast-context";
import { cn } from "@/lib/utils";

type ProductReviewsProps = {
  productId: number;
  avgRating: string | null;
  reviewCount: number;
};

const formatReviewDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }
  const data = error.data;
  if (typeof data === "string" && data.trim()) {
    return data;
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return record.detail;
    }
    for (const value of Object.values(record)) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }
  return fallback;
};

const isCompletedPaidOrder = (order: Order) =>
  order.status.toUpperCase() === "COMPLETE" && order.is_fully_paid;

const isConfirmedProductLine = (order: Order, productId: number) =>
  order.items.some((item) => {
    if (item.product !== productId) {
      return false;
    }
    const availability = item.availability?.toLowerCase();
    if (!availability) {
      return true;
    }
    return availability === "confirmed";
  });

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (!onChange) {
          return (
            <Star
              key={star}
              className={cn(
                iconClass,
                filled ? "fill-[#F2BA52] text-[#F2BA52]" : "fill-gray-200 text-gray-200"
              )}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition-transform hover:scale-110"
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              className={cn(
                iconClass,
                filled ? "fill-[#F2BA52] text-[#F2BA52]" : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewForm({
  productId,
  orderId,
  initial,
  onCancel,
  onSaved,
}: {
  productId: number;
  orderId: number;
  initial?: ProductReview | null;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const createMutation = useCreateProductReviewMutation(productId);
  const updateMutation = useUpdateProductReviewMutation(productId);
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [body, setBody] = useState(initial?.body ?? "");
  const [isAnonymous, setIsAnonymous] = useState(initial?.is_anonymous ?? false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initial);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            rating,
            body: body.trim() || undefined,
            is_anonymous: isAnonymous,
          },
        });
        showToast("Review updated.");
      } else {
        await createMutation.mutateAsync({
          product: productId,
          order: orderId,
          rating,
          body: body.trim() || undefined,
          is_anonymous: isAnonymous,
        });
        showToast("Review submitted.");
      }
      onSaved();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          isEditing ? "Could not update your review." : "Could not submit your review."
        )
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-100 bg-[#faf8fc] p-4"
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {isEditing ? "Edit your review" : "Write a review"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Rating is required. You can keep your name private if you prefer.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Rating
        </span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`review-body-${productId}`}
          className="text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Review
        </label>
        <textarea
          id={`review-body-${productId}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="Share what you liked or what could be better..."
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#4C1C59]"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#4C1C59] focus:ring-[#4C1C59]"
        />
        Post anonymously
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending || rating < 0}
          className="rounded-full bg-[#4C1C59] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#361340] disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Submit review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#4C1C59]/30"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function ProductReviews({
  productId,
  avgRating,
  reviewCount,
}: ProductReviewsProps) {
  const { auth, authLoading } = useAuth();
  const { showToast } = useToast();
  const { data: reviews, isLoading } = useProductReviewsQuery(productId);
  const deleteMutation = useDeleteProductReviewMutation(productId);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const userId = auth?.user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }

    let cancelled = false;
    setOrdersLoading(true);
    listOrders()
      .then((result) => {
        if (!cancelled) {
          setOrders(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const eligibleOrder = useMemo(() => {
    const candidates = orders
      .filter(
        (order) => isCompletedPaidOrder(order) && isConfirmedProductLine(order, productId)
      )
      .sort(
        (first, second) =>
          new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
      );
    return candidates[0] ?? null;
  }, [orders, productId]);

  const ownReview = useMemo(
    () => (reviews ?? []).find((review) => review.user === userId) ?? null,
    [reviews, userId]
  );

  const visibleReviews = reviews ?? [];
  const ratingValue = Number(avgRating ?? 0);
  const canWrite = Boolean(eligibleOrder) && !ownReview;

  const handleDelete = async (reviewId: number) => {
    try {
      await deleteMutation.mutateAsync(reviewId);
      showToast("Review deleted.");
      setEditingReviewId(null);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not delete review."));
    }
  };

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customer reviews</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <StarPicker value={Math.round(ratingValue)} size="sm" />
            <span className="font-semibold text-gray-900">
              {Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "0.0"}
            </span>
            <span>
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {!authLoading && !isAuthenticated && (
          <Link
            href="/login"
            className="text-sm font-semibold text-[#4C1C59] hover:text-[#361340]"
          >
            Sign in to leave a review
          </Link>
        )}
      </div>

      {isAuthenticated && !ordersLoading && canWrite && !showForm && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-[#4C1C59] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#361340]"
          >
            Write a review
          </button>
        </div>
      )}

      {isAuthenticated && !ordersLoading && !eligibleOrder && !ownReview && (
        <p className="mt-4 text-sm text-gray-500">
          You can review this product after a completed purchase has been fulfilled.
        </p>
      )}

      {showForm && eligibleOrder && (
        <div className="mt-5">
          <ReviewForm
            productId={productId}
            orderId={eligibleOrder.id}
            onCancel={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        </div>
      )}

      {ownReview && editingReviewId === ownReview.id && (
        <div className="mt-5">
          <ReviewForm
            productId={productId}
            orderId={ownReview.order}
            initial={ownReview}
            onCancel={() => setEditingReviewId(null)}
            onSaved={() => setEditingReviewId(null)}
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))
        ) : visibleReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
            No reviews yet. Be the first to share your experience.
          </div>
        ) : (
          visibleReviews.map((review) => {
            const isOwn = review.user === userId;
            const isEditing = editingReviewId === review.id;
            if (isEditing) {
              return null;
            }
            return (
              <article
                key={review.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.user_display || "Customer"}
                      {isOwn ? (
                        <span className="ml-2 text-xs font-medium text-[#4C1C59]">You</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatReviewDate(review.created_at)}
                    </p>
                  </div>
                  <StarPicker value={review.rating} size="sm" />
                </div>
                {review.body ? (
                  <p className="mt-3 text-sm leading-6 text-gray-700">{review.body}</p>
                ) : (
                  <p className="mt-3 text-sm italic text-gray-400">No written review.</p>
                )}
                {isOwn && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingReviewId(review.id);
                      }}
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#4C1C59]/30 hover:text-[#4C1C59]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(review.id)}
                      className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
