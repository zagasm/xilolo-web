import React, { useEffect, useState } from "react";
import { Star, Pencil, Trash2, MessageSquareQuote, Lock } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../ui/toast";

const DEFAULT_FORM = {
  rating: 5,
  title: "",
  body: "",
};

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getCurrentUserId(user) {
  return user?.id || user?.user_id || user?.userId || null;
}

function getReviewItems(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function getReviewSummary(payload = {}) {
  const summary =
    payload?.meta?.summary ||
    payload?.summary ||
    payload?.data?.meta?.summary ||
    payload?.data?.summary ||
    {};

  return {
    count: toNumber(
      summary?.count ?? summary?.total ?? summary?.reviews_count,
      0
    ),
    averageRating: toNumber(
      summary?.average_rating ?? summary?.averageRating ?? summary?.rating,
      0
    ),
    hasReviewed: !!(
      summary?.has_reviewed ??
      summary?.hasReviewed ??
      payload?.has_reviewed ??
      payload?.data?.has_reviewed
    ),
  };
}

function getReviewOwner(rawReview = {}) {
  return (
    rawReview?.user ||
    rawReview?.reviewer ||
    rawReview?.author ||
    rawReview?.owner ||
    {}
  );
}

function getReviewId(rawReview = {}) {
  return (
    rawReview?.id ||
    rawReview?.review_id ||
    rawReview?.reviewId ||
    rawReview?.uuid ||
    null
  );
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase() || "?";
}

function normalizeReview(rawReview = {}, currentUserId = null) {
  if (!rawReview || typeof rawReview !== "object") return null;

  const owner = getReviewOwner(rawReview);
  const userId =
    rawReview?.user_id ||
    rawReview?.userId ||
    rawReview?.author_id ||
    owner?.id ||
    owner?.user_id ||
    owner?.userId ||
    null;
  const firstName = owner?.firstName || owner?.first_name || "";
  const lastName = owner?.lastName || owner?.last_name || "";
  const fullName =
    rawReview?.user_name ||
    rawReview?.userName ||
    rawReview?.author_name ||
    rawReview?.reviewer_name ||
    owner?.name ||
    owner?.user_name ||
    owner?.userName ||
    owner?.username ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    "Anonymous attendee";
  const avatar =
    owner?.profileUrl ||
    owner?.profile_url ||
    owner?.profileImage ||
    owner?.profile_image ||
    owner?.avatar ||
    rawReview?.profile_url ||
    rawReview?.profile_image ||
    rawReview?.avatar ||
    null;

  return {
    id: getReviewId(rawReview),
    userId,
    rating: Math.max(0, Math.min(5, Math.round(toNumber(rawReview?.rating, 0)))),
    title: String(rawReview?.title || rawReview?.subject || "").trim(),
    body: String(
      rawReview?.body ||
        rawReview?.review ||
        rawReview?.comment ||
        rawReview?.content ||
        ""
    ).trim(),
    reviewerName: fullName,
    reviewerAvatar: avatar,
    reviewerInitials: getInitials(fullName),
    canEdit:
      typeof rawReview?.can_edit === "boolean"
        ? rawReview.can_edit
        : typeof rawReview?.canEdit === "boolean"
          ? rawReview.canEdit
          : !!(
              currentUserId &&
              userId &&
              String(currentUserId) === String(userId)
            ),
    createdAt:
      rawReview?.created_at ||
      rawReview?.createdAt ||
      rawReview?.time_ago ||
      rawReview?.date ||
      "",
    updatedAt: rawReview?.updated_at || rawReview?.updatedAt || "",
    raw: rawReview,
  };
}

function normalizeMineReview(payload, currentUserId) {
  const candidate =
    payload?.data?.review ||
    payload?.review ||
    payload?.data?.data ||
    payload?.data ||
    payload;

  return normalizeReview(candidate, currentUserId);
}

function formatTimestamp(value) {
  if (!value) return "Recently";
  if (String(value).toLowerCase().includes("ago")) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function fillFormFromReview(review) {
  return {
    rating: review?.rating || 5,
    title: review?.title || "",
    body: review?.body || "",
  };
}

function StarRow({ rating = 0, size = 16, muted = false }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;

        return (
          <Star
            key={value}
            className={`tw:shrink-0 ${
              filled ? "tw:fill-amber-400 tw:text-amber-400" : muted ? "tw:text-slate-300" : "tw:text-slate-200"
            }`}
            style={{ width: size, height: size }}
          />
        );
      })}
    </div>
  );
}

function RatingInput({ value, onChange, disabled }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-1.5">
      {[1, 2, 3, 4, 5].map((ratingValue) => {
        const active = ratingValue <= value;

        return (
          <button
            key={ratingValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ratingValue)}
            className="tw:inline-flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:transition tw:hover:border-amber-300 tw:hover:bg-amber-50 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
            aria-label={`Rate ${ratingValue} star${ratingValue > 1 ? "s" : ""}`}
          >
            <Star
              className={active ? "tw:fill-amber-400 tw:text-amber-400" : "tw:text-slate-300"}
              size={18}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function EventReviewsSection({
  eventId,
  eventSummary,
  token,
  currentUser,
  onReviewMutationSuccess,
}) {
  const currentUserId = getCurrentUserId(currentUser);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    averageRating: 0,
    hasReviewed: false,
  });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mineReview, setMineReview] = useState(null);
  const [loadingMine, setLoadingMine] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const canReviewFromEvent = !!eventSummary?.can_review;
  const headlineCount =
    summary?.count > 0
      ? summary.count
      : toNumber(eventSummary?.count, reviews.length);
  const headlineAverage =
    summary?.count > 0
      ? toNumber(summary?.averageRating, 0)
      : toNumber(eventSummary?.average_rating, 0);
  const hasReviewed = !!(summary?.hasReviewed || mineReview?.id);
  const canShowComposerCta = !!token && (canReviewFromEvent || hasReviewed);
  const shouldShowLockedComposer = !!token && !canReviewFromEvent && !hasReviewed;

  async function loadReviews({ showLoader = true } = {}) {
    if (!eventId) return;

    try {
      if (showLoader) setLoadingReviews(true);
      setReviewsError("");

      const response = await api.get(
        `/api/v1/events/${eventId}/reviews`,
        authHeaders(token)
      );
      const payload = response?.data || {};
      const items = getReviewItems(payload)
        .map((item) => normalizeReview(item, currentUserId))
        .filter(Boolean);

      setReviews(items);
      setSummary(getReviewSummary(payload));
    } catch (error) {
      setReviewsError(getErrorMessage(error, "Unable to load reviews right now."));
    } finally {
      if (showLoader) setLoadingReviews(false);
    }
  }

  async function loadMineReview({ showLoader = true, suppressError = false } = {}) {
    if (!eventId || !token) return null;

    try {
      if (showLoader) setLoadingMine(true);

      const response = await api.get(
        `/api/v1/events/${eventId}/reviews/mine`,
        authHeaders(token)
      );
      const normalized = normalizeMineReview(response?.data || {}, currentUserId);

      setMineReview(normalized);
      if (normalized) {
        setForm(fillFormFromReview(normalized));
      }
      return normalized;
    } catch (error) {
      const status = error?.response?.status;

      if (status === 404) {
        setMineReview(null);
        setForm(DEFAULT_FORM);
        return null;
      }

      if (!suppressError) {
        showError(getErrorMessage(error, "Unable to load your review right now."));
      }
      return null;
    } finally {
      if (showLoader) setLoadingMine(false);
    }
  }

  async function refreshAfterMutation({ reloadMine = true } = {}) {
    await loadReviews({ showLoader: false });

    if (reloadMine && token) {
      await loadMineReview({ showLoader: false, suppressError: true });
    } else {
      setMineReview(null);
      setForm(DEFAULT_FORM);
    }

    if (typeof onReviewMutationSuccess === "function") {
      await onReviewMutationSuccess();
    }
  }

  useEffect(() => {
    setReviews([]);
    setSummary({
      count: 0,
      averageRating: 0,
      hasReviewed: false,
    });
    setComposerOpen(false);
    setMineReview(null);
    setForm(DEFAULT_FORM);
    loadReviews();
  }, [eventId, token, currentUserId]);

  async function openComposer() {
    setComposerOpen(true);

    if (hasReviewed) {
      const existingReview = mineReview?.id
        ? mineReview
        : await loadMineReview({ suppressError: false });

      if (existingReview) {
        setForm(fillFormFromReview(existingReview));
      } else {
        setForm(DEFAULT_FORM);
      }
      return;
    }

    setForm(DEFAULT_FORM);
  }

  function closeComposer() {
    setComposerOpen(false);

    if (!hasReviewed) {
      setForm(DEFAULT_FORM);
    } else if (mineReview) {
      setForm(fillFormFromReview(mineReview));
    }
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!token) {
      showError("Please sign in to review this event.");
      return;
    }

    if (!form.body.trim()) {
      showError("Write a short review before submitting.");
      return;
    }

    setSubmitting(true);

    const payload = {
      rating: Math.max(1, Math.min(5, Math.round(toNumber(form.rating, 5)))),
      title: form.title.trim(),
      body: form.body.trim(),
    };

    try {
      if (hasReviewed && mineReview?.id) {
        await api.patch(
          `/api/v1/events/${eventId}/reviews/${mineReview.id}`,
          payload,
          authHeaders(token)
        );
        showSuccess("Review updated successfully.");
      } else {
        await api.post(
          `/api/v1/events/${eventId}/reviews`,
          payload,
          authHeaders(token)
        );
        showSuccess("Review submitted successfully.");
      }

      await refreshAfterMutation({ reloadMine: true });
      setComposerOpen(false);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 403) {
        showError("Only users who paid for this event can review it.");
        return;
      }

      if (status === 422 && !hasReviewed) {
        const existingReview =
          normalizeMineReview(error?.response?.data || {}, currentUserId) ||
          (await loadMineReview({ showLoader: false, suppressError: true }));

        if (existingReview) {
          setMineReview(existingReview);
          setForm(fillFormFromReview(existingReview));
          setComposerOpen(true);
        }

        await refreshAfterMutation({ reloadMine: true });
        showError("You already reviewed this event. You can edit it below.");
        return;
      }

      showError(getErrorMessage(error, "Unable to save your review right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview(review) {
    if (!review?.id || !token) return;

    const confirmed = window.confirm("Delete your review for this event?");
    if (!confirmed) return;

    try {
      setDeletingReviewId(review.id);
      await api.delete(
        `/api/v1/events/${eventId}/reviews/${review.id}`,
        authHeaders(token)
      );
      showSuccess("Review deleted successfully.");
      await refreshAfterMutation({ reloadMine: false });
      setComposerOpen(false);
    } catch (error) {
      showError(getErrorMessage(error, "Unable to delete your review right now."));
    } finally {
      setDeletingReviewId(null);
    }
  }

  return (
    <section className="tw:mt-8 tw:rounded-[28px] tw:bg-white tw:p-4 tw:md:rounded-[34px] tw:md:border tw:md:border-[#f1f5f9] tw:md:p-7 tw:md:shadow-[0_20px_60px_rgba(148,163,184,0.10)]">
      <div className="tw:flex tw:flex-col tw:gap-5 tw:md:flex-row tw:md:items-start tw:md:justify-between">
        <div className="tw:max-w-2xl">
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
            <MessageSquareQuote className="tw:h-4 tw:w-4" />
            Event Reviews
          </div>

          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:text-3xl tw:font-semibold tw:text-slate-900">
                {headlineCount > 0 ? headlineAverage.toFixed(1) : "0.0"}
              </div>
              <div>
                <StarRow rating={Math.round(headlineAverage)} />
                <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                  {headlineCount > 0
                    ? `${headlineCount} review${headlineCount === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </div>
              </div>
            </div>
          </div>

          <div className="tw:mt-4 tw:text-sm tw:text-slate-600">
            {headlineCount > 0
              ? "See what attendees are saying about this event."
              : "No reviews yet for this event."}
          </div>
        </div>

        <div className="tw:w-full tw:max-w-md">
          {canShowComposerCta && !composerOpen && (
            <div className="tw:rounded-[22px] tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4">
              <div className="tw:text-sm tw:font-medium tw:text-slate-900">
                {hasReviewed
                  ? "Update your review any time."
                  : "Share your experience with this event."}
              </div>
              <button
                type="button"
                onClick={openComposer}
                className="tw:mt-3 tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                style={{ borderRadius: 9999 }}
              >
                {hasReviewed ? "Edit your review" : "Write a review"}
              </button>
            </div>
          )}

          {shouldShowLockedComposer && !composerOpen && (
            <div className="tw:rounded-[22px] tw:border tw:border-[#fde68a] tw:bg-[#fffbeb] tw:p-4">
              <div className="tw:flex tw:items-start tw:gap-3">
                <Lock className="tw:mt-0.5 tw:h-4 tw:w-4 tw:text-[#d97706]" />
                <div>
                  <div className="tw:text-sm tw:font-medium tw:text-slate-900">
                    Reviews are locked for unpaid attendees
                  </div>
                  <div className="tw:mt-1 tw:text-sm tw:leading-6 tw:text-slate-600">
                    Only users who paid for this event can leave a review.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!token && !composerOpen && (
            <div className="tw:rounded-[22px] tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4 tw:text-sm tw:text-slate-600">
              Sign in to leave a review for this event.
            </div>
          )}
        </div>
      </div>

      {composerOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="tw:mt-6 tw:rounded-[24px] tw:border tw:border-slate-200 tw:bg-[#fcfcfd] tw:p-4 tw:md:p-5"
        >
          <div className="tw:flex tw:flex-col tw:gap-5">
            <div>
              <div className="tw:text-sm tw:font-medium tw:text-slate-900">
                {hasReviewed ? "Edit your review" : "Write a review"}
              </div>
              <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                Rate the event and share a short summary of your experience.
              </div>
            </div>

            <div>
              <label className="tw:block tw:text-sm tw:font-medium tw:text-slate-700">
                Rating
              </label>
              <div className="tw:mt-2">
                <RatingInput
                  value={form.rating}
                  onChange={(rating) =>
                    setForm((previous) => ({ ...previous, rating }))
                  }
                  disabled={submitting || loadingMine}
                />
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:gap-4">
              <div>
                <label className="tw:block tw:text-sm tw:font-medium tw:text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  maxLength={120}
                  disabled={submitting || loadingMine}
                  placeholder="Excellent event"
                  className="tw:mt-2 tw:h-12 tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:text-sm tw:text-slate-900 tw:outline-none focus:tw:border-primary"
                />
              </div>

              <div>
                <label className="tw:block tw:text-sm tw:font-medium tw:text-slate-700">
                  Review
                </label>
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      body: event.target.value,
                    }))
                  }
                  disabled={submitting || loadingMine}
                  placeholder="Well organized event and smooth access from purchase to entry."
                  className="tw:mt-2 tw:min-h-[150px] tw:w-full tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:text-slate-900 tw:outline-none focus:tw:border-primary"
                />
              </div>
            </div>

            <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-3">
              <button
                type="button"
                onClick={closeComposer}
                disabled={submitting}
                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:px-5 tw:text-sm tw:font-medium tw:text-slate-700 tw:hover:bg-slate-50 disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                style={{ borderRadius: 9999 }}
              >
                Cancel
              </button>

              {hasReviewed && mineReview?.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteReview(mineReview)}
                  disabled={submitting || deletingReviewId === mineReview.id}
                  className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-red-200 tw:bg-red-50 tw:px-5 tw:text-sm tw:font-medium tw:text-red-600 tw:hover:bg-red-100 disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                  style={{ borderRadius: 9999 }}
                >
                  {deletingReviewId === mineReview.id ? "Deleting..." : "Delete"}
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || loadingMine}
                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                style={{ borderRadius: 9999 }}
              >
                {submitting
                  ? hasReviewed
                    ? "Saving..."
                    : "Submitting..."
                  : hasReviewed
                    ? "Save changes"
                    : "Submit review"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="tw:mt-8">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
            Attendee feedback
          </div>

          {reviews.length > 0 && (
            <button
              type="button"
              onClick={() => loadReviews()}
              className="tw:text-sm tw:font-medium tw:text-primary tw:hover:text-primarySecond"
            >
              Refresh
            </button>
          )}
        </div>

        {loadingReviews ? (
          <div className="tw:mt-4 tw:space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="tw:h-32 tw:animate-pulse tw:rounded-[24px] tw:bg-slate-100"
              />
            ))}
          </div>
        ) : reviewsError ? (
          <div className="tw:mt-4 tw:rounded-[22px] tw:border tw:border-red-100 tw:bg-red-50 tw:p-4">
            <div className="tw:text-sm tw:text-red-600">{reviewsError}</div>
            <button
              type="button"
              onClick={() => loadReviews()}
              className="tw:mt-3 tw:text-sm tw:font-medium tw:text-red-600 tw:hover:text-red-700"
            >
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="tw:mt-4 tw:rounded-[22px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-slate-50 tw:p-6 tw:text-sm tw:text-slate-500">
            No reviews yet for this event.
          </div>
        ) : (
          <div className="tw:mt-4 tw:space-y-4">
            {reviews.map((review) => (
              <article
                key={review.id || `${review.userId}-${review.createdAt}`}
                className="tw:rounded-[24px] tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:md:p-5"
              >
                <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-start tw:md:justify-between">
                  <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-3">
                    {review.reviewerAvatar ? (
                      <img
                        src={review.reviewerAvatar}
                        alt={review.reviewerName}
                        className="tw:h-11 tw:w-11 tw:rounded-full tw:object-cover"
                      />
                    ) : (
                      <div className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#f1f5f9] tw:text-sm tw:font-semibold tw:text-slate-700">
                        {review.reviewerInitials}
                      </div>
                    )}
                    <div className="tw:min-w-0">
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                        <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                          {review.reviewerName}
                        </div>
                        <div className="tw:text-xs tw:text-slate-400">
                          {formatTimestamp(review.createdAt)}
                        </div>
                      </div>

                      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
                        <StarRow rating={review.rating} />
                        <div className="tw:text-sm tw:font-medium tw:text-slate-700">
                          {review.title || "Event review"}
                        </div>
                      </div>

                      <div className="tw:mt-3 tw:text-sm tw:leading-7 tw:text-slate-600">
                        {review.body}
                      </div>
                    </div>
                  </div>

                  {review.canEdit && (
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMineReview(review);
                          setForm(fillFormFromReview(review));
                          setComposerOpen(true);
                        }}
                        className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:text-sm tw:font-medium tw:text-slate-700 tw:hover:bg-slate-50"
                        style={{ borderRadius: 9999 }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review)}
                        disabled={deletingReviewId === review.id}
                        className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-red-200 tw:bg-red-50 tw:px-4 tw:text-sm tw:font-medium tw:text-red-600 tw:hover:bg-red-100 disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                        style={{ borderRadius: 9999 }}
                      >
                        <Trash2 size={14} />
                        {deletingReviewId === review.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
