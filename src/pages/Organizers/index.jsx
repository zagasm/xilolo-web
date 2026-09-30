/**
 * /organizers — the standalone "Top Organizers" page.
 *
 * APP SOURCE OF TRUTH (read-only): C:\Users\ceo\Desktop\xilolo-app
 *   lib/features/presentation/screens/profile/screens/top_organizers_screen.dart
 *     :37-47     first page on mount, then ONE MORE page whenever the scroll
 *                position comes within 240px of the end (see note 1 below)
 *     :63-83     rank sort, then top1/top2/top3 + `sublist(3)` for the rows
 *     :87-157    Scaffold(pal.bg) -> ListView(padding 16/8/16/24). NO page card,
 *                no shadow, no max-width grid: the app is ONE column at every
 *                width, so the web is a capped centred column (560px).
 *     :95-102    (isLoading || isLoadingMore) && empty -> shimmer; empty -> empty
 *                state (the app has NO separate error UI — a failed fetch lands
 *                on the empty state, which is what the web now does too)
 *     :107-111   header: title 30 / w800 / -0.5 + subtitle 13.5, 6px apart
 *     :114-132   podium, then 20px, then the rank rows (10px apart)
 *     :134-138   loading more = a 2-row shimmer, never a spinner + caption
 *     :140-152   "You have reached the end" at 12 muted once the last page is in
 *     :186-219   _Header — back arrow above the title when the route can pop
 *     :222-264   _EmptyState — trophy 56 faint, "No organizers to show yet",
 *                then the refresh line 12 textLabel
 *
 * WHAT WAS WRONG BEFORE (the "already matches" claim): the previous page was a
 * different design altogether — a rounded-3xl shadowed card wrapper capped at
 * max-w-3xl, `#N` rank chips, 110px rounded-2xl row avatars, 👑 instead of 🏆,
 * green "N Tickets Sold" chips (the app shows none), "Unfollow"/"Follow back"
 * labels, gray-* colours instead of tokens, and "Scroll to load more" /
 * "No more organizers" footers. See the task report for the full table.
 *
 * Notes where the web cannot be literal:
 *   1. The app paginates off `ScrollController.position`; the web keeps its
 *      IntersectionObserver sentinel (same "one more page near the end" rule).
 *   2. The app's empty state says "Pull down to refresh" (a mobile gesture).
 *      The web renders the same icon + title and an app-vocabulary "Refresh"
 *      button instead (the word is the app's own — it is the rail's action).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Trophy } from "lucide-react";

import SEO from "../../component/SEO";
import { useAuth } from "../auth/AuthContext";
import { showError } from "../../component/ui/toast";
import { api, authHeaders } from "../../lib/apiClient";
import PodiumSection from "../../component/Organizers/PodiumSection";
import OrganizerRowCard from "../../component/Organizers/OrganiserRowCard";
import TopOrganizersShimmer, {
  ListShimmer,
} from "../../component/Organizers/OrganisersShimmer";
import { sortByRank } from "../../component/Organizers/topOrganizers.utils";

/* The app's own strings (:99-100 l10n, :108-109 l10n, :145 l10n). */
const TITLE = "Top Organizers";
const SUBTITLE = "See best rated organizers globally";
const END_OF_LIST = "You have reached the end";

/** :186-219 — back arrow, then the title at 30/w800/-0.5, then the subtitle. */
function TopOrganizersHeader({ onBack }) {
  return (
    <header className="tw:pt-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to home"
        className="tw:mb-1 tw:-ml-1 tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-full tw:text-body tw:transition-colors tw:hover:bg-chip"
      >
        <ArrowLeft className="tw:size-6" aria-hidden="true" />
      </button>

      <h1 className="tw:m-0! tw:text-[30px]! tw:font-extrabold! tw:leading-none! tw:tracking-[-0.5px]! tw:text-body">
        {TITLE}
      </h1>
      <p className="tw:mt-1.5 tw:mb-0! tw:text-[13.5px] tw:text-muted">
        {SUBTITLE}
      </p>
    </header>
  );
}

/** :222-264 — trophy, title, then the refresh affordance. */
function TopOrganizersEmptyState({ onRefresh }) {
  return (
    <div className="tw:pt-20 tw:text-center">
      <Trophy className="tw:mx-auto tw:size-14 tw:text-faint" aria-hidden="true" />
      <p className="tw:mt-3.5 tw:mb-0! tw:text-sm tw:font-semibold tw:text-muted">
        No organizers to show yet
      </p>
      <p className="tw:mt-1.5 tw:mb-0! tw:text-xs tw:text-ink-muted">
        <button
          type="button"
          onClick={onRefresh}
          className="tw:cursor-pointer tw:font-semibold tw:text-accent-deep tw:hover:underline!"
        >
          Refresh
        </button>
      </p>
    </div>
  );
}

/**
 * Pure presentation half of the page, so the DEV preview
 * (./OrganizersPreview.jsx) renders the REAL markup with fixtures and cannot
 * drift. `preview` is only used to disable navigation targets in the preview.
 */
export function TopOrganizersView({
  items = [],
  loading = false,
  loadingMore = false,
  hasMore = true,
  onToggleFollow,
  loadingUserId = null,
  currentUserId = null,
  onOpenProfile,
  onBack,
  onRefresh,
}) {
  const ordered = useMemo(() => sortByRank(items), [items]);
  const top1 = ordered[0];
  const top2 = ordered[1];
  const top3 = ordered[2];
  const rest = ordered.length > 3 ? ordered.slice(3) : [];
  const isEmpty = ordered.length === 0;

  const isOwnProfile = (org) => {
    const target = org?.userId;
    if (!target || !currentUserId) return false;
    return String(target) === String(currentUserId);
  };

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pt-24 tw:pb-8 tw:font-sans">
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4">
        <TopOrganizersHeader onBack={onBack} />

        {loading && isEmpty ? <TopOrganizersShimmer /> : null}

        {!loading && isEmpty ? (
          <TopOrganizersEmptyState onRefresh={onRefresh} />
        ) : null}

        {!isEmpty ? (
          <>
            {/* :112 — 22px from the subtitle to the podium. */}
            <div className="tw:mt-[22px]">
              {top1 ? (
                <PodiumSection
                  top3={[top1, top2, top3].filter(Boolean)}
                  onToggleFollow={onToggleFollow}
                  isOwnProfile={isOwnProfile}
                  loadingUserId={loadingUserId}
                />
              ) : null}
            </div>

            {/* :122-132 — 20px above the first row, 10px between rows. */}
            <div className="tw:mt-5">
              {rest.map((org) => (
                <div key={org?.id ?? org?.userId} className="tw:mb-2.5">
                  <OrganizerRowCard
                    org={org}
                    onToggleFollow={onToggleFollow}
                    onOpenProfile={onOpenProfile}
                    isOwnProfile={isOwnProfile(org)}
                    isLoading={loadingUserId === org?.userId}
                  />
                </div>
              ))}
            </div>

            {loadingMore ? (
              <div className="tw:pt-1.5 tw:pb-3">
                <ListShimmer count={2} />
              </div>
            ) : null}

            {!hasMore ? (
              <p className="tw:py-1.5 tw:mb-0! tw:text-center tw:text-xs tw:text-muted">
                {END_OF_LIST}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AllOrganizers() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const perPage = 20;

  const [organizers, setOrganizers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(1);
  const [loadingUserId, setLoadingUserId] = useState(null);

  const pendingFollowRef = useRef({});

  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "500px 0px",
    triggerOnce: false,
  });

  const fetchOrganisers = useCallback(
    async (pageToLoad = 1, isMore = false) => {
      try {
        isMore ? setLoadingMore(true) : setLoadingList(true);

        const { data } = await api.get("/api/v1/top-organisers", {
          params: { per_page: perPage, page: pageToLoad },
          ...authHeaders(token),
        });

        const list = Array.isArray(data?.data) ? data.data : [];
        const normalized = list.map((o) => ({
          ...o,
          isFollowing:
            typeof o.isFollowing === "boolean" ? o.isFollowing : !!o.following,
        }));

        setOrganizers((prev) =>
          isMore ? [...prev, ...normalized] : normalized
        );

        const meta = data?.meta || {};
        const currentPage = meta.current_page ?? pageToLoad;
        const lastPage = meta.last_page ?? currentPage;
        const moreAvailable = currentPage < lastPage;

        setNextPage(moreAvailable ? currentPage + 1 : null);
        setHasMore(moreAvailable);
      } catch (e) {
        console.error("Error fetching top organizers:", e);
        if (isMore) {
          setHasMore(false);
          setNextPage(null);
        } else {
          // :95-102 — the app has no error branch for this screen: an empty
          // list renders the empty state, so the web does the same.
          setOrganizers([]);
          setHasMore(false);
          setNextPage(null);
        }
      } finally {
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [token, perPage]
  );

  useEffect(() => {
    fetchOrganisers(1, false);
  }, [fetchOrganisers]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && nextPage) {
      fetchOrganisers(nextPage, true);
    }
  }, [inView, hasMore, loadingMore, nextPage, fetchOrganisers]);

  /** :741-751 — optimistic toggle, then POST /api/v1/follow/:userId. */
  const toggleFollow = async (org) => {
    const userId = org?.userId;
    if (!userId || pendingFollowRef.current[userId]) return;

    let previousFollowing = false;
    pendingFollowRef.current[userId] = true;
    setLoadingUserId(userId);

    setOrganizers((prev) =>
      prev.map((o) => {
        if (o.userId !== userId) return o;
        previousFollowing = o.isFollowing === true;
        const nextFollowing = !previousFollowing;
        return {
          ...o,
          isFollowing: nextFollowing,
          numberOfFollowers: Math.max(
            0,
            Number(o?.numberOfFollowers ?? 0) + (nextFollowing ? 1 : -1)
          ),
        };
      })
    );

    try {
      const { data: result } = await api.post(
        `/api/v1/follow/${userId}`,
        {},
        authHeaders(token)
      );
      const isNowFollowing =
        typeof result?.following === "boolean"
          ? result.following
          : !!(result?.data?.following ?? result?.data?.is_following);

      setOrganizers((prev) =>
        prev.map((o) =>
          o.userId === userId ? { ...o, isFollowing: isNowFollowing } : o
        )
      );
    } catch (e) {
      console.error("Error toggling follow:", e);
      setOrganizers((prev) =>
        prev.map((o) =>
          o.userId === userId
            ? {
                ...o,
                isFollowing: previousFollowing,
                numberOfFollowers: Math.max(
                  0,
                  Number(o?.numberOfFollowers ?? 0) +
                    (previousFollowing ? 1 : -1)
                ),
              }
            : o
        )
      );
      showError("Something went wrong. Try again.");
    } finally {
      delete pendingFollowRef.current[userId];
      setLoadingUserId(null);
    }
  };

  const currentUserId = user?.id ?? user?.userId ?? null;

  return (
    <>
      <SEO
        title="Top Organizers"
        description="See best rated organizers globally."
        keywords="Xilolo, organizers, ranking"
      />

      <TopOrganizersView
        items={organizers}
        loading={loadingList}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onToggleFollow={toggleFollow}
        loadingUserId={loadingUserId}
        currentUserId={currentUserId}
        onOpenProfile={(id) => navigate(`/profile/${id}`)}
        onBack={() => navigate("/feed")}
        onRefresh={() => fetchOrganisers(1, false)}
      />

      {/* :39-47 — one more page when the end comes into view. */}
      {hasMore && organizers.length > 0 ? (
        <div ref={loadMoreRef} className="tw:h-px tw:w-full" aria-hidden="true" />
      ) : null}
    </>
  );
}
