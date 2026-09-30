import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { dedupeEvents, readNextPageParam } from "./paginationUtils";
import { api, authHeaders } from "../lib/apiClient";
import { useAuth } from "../pages/auth/AuthContext";

/**
 * The event feeds (/api/v1/events/all/get, /events/view/live) do NOT paginate
 * the way this hook used to assume. Measured against production on 2026-09-30:
 *
 *   meta = { path, per_page: [20, 20], next_cursor: ["eyJ…", "eyJ…"],
 *            prev_cursor: [null, null], count: 20, type: "all", filters_used: [] }
 *
 *   - there is no `current_page`, no `last_page` and no `total`, so the old
 *     `meta.current_page >= meta.last_page` evaluation was `undefined >= undefined`
 *     → the fabricated `last_page: 1` made it `1 >= 1` → **every consumer decided
 *     the feed was complete after page 1** and never rendered its load-more
 *     sentinel. The feed was silently capped at 20 events with no indication
 *     more existed.
 *   - the advertised cursor is currently NOT usable: passing `meta.next_cursor[0]`
 *     back as `?cursor=` returns **HTTP 500 "Server Error"** on api.xilolo.com in
 *     every encoding (raw / quote / quote_plus, with and without per_page).
 *   - the ordering is non-deterministic — five identical requests returned five
 *     different sequences — so plain `?page=2` is not "the next 20" either; it
 *     overlapped page 1 by 13 of 20 items.
 *
 * So this hook now:
 *   1. reads the pagination it is actually given (cursor first, page meta as a
 *      fallback for endpoints that still use it), instead of inventing page 2;
 *   2. dedupes by event id across pages, so a server-side overlap cannot render
 *      the same event twice;
 *   3. treats a FAILED next-page request as "this feed cannot page any further"
 *      rather than as a feed error — the already-loaded events stay on screen, no
 *      error card, no retry storm, and no repeated attempts for the rest of the
 *      session. That keeps the feed honest today and means pagination starts
 *      working by itself the moment the backend cursor is repaired, with no
 *      further front-end change;
 *   4. owns `hasNextPage` / `isDone`, because both consumers previously computed
 *      `isDone` from the fabricated meta and got it wrong identically.
 *
 * Parity note: the Flutter app does not paginate this feed at all (no cursor,
 * page, loadMore or hasMore anywhere in its home provider) — it renders the same
 * first page. So a 20-item first page is parity; what is NOT parity, and is
 * fixed here, is the web pretending the feed was complete.
 */

/* The pagination helpers (firstUsableString / readNextPageParam / dedupeEvents) live in
   ./paginationUtils so they can be unit-tested without React or import.meta. */
export default function usePaginatedEvents(endpoint) {
  const { token, user } = useAuth();
  const userKey = user?.user_id || user?.id || "anonymous";

  const query = useInfiniteQuery({
    queryKey: ["paginated-events", endpoint, userKey],
    enabled: Boolean(user && endpoint),
    initialPageParam: { page: 1, cursor: null },
    queryFn: async ({ pageParam }) => {
      const params = pageParam?.cursor
        ? { cursor: pageParam.cursor }
        : { page: pageParam?.page || 1 };

      try {
        const res = await api.get(endpoint, {
          ...authHeaders(token),
          params,
        });

        const payload = res?.data ?? {};
        const items = Array.isArray(payload.data) ? payload.data : [];
        const meta = payload.meta || {};

        return {
          items,
          meta: {
            current_page: Number(meta.current_page ?? pageParam?.page ?? 1),
            last_page: Number.isFinite(Number(meta.last_page))
              ? Number(meta.last_page)
              : null,
            total: Number.isFinite(Number(meta.total)) ? Number(meta.total) : null,
            count: Number.isFinite(Number(meta.count)) ? Number(meta.count) : items.length,
            type: meta.type ?? null,
          },
          nextParam: readNextPageParam(payload),
          failed: false,
        };
      } catch (error) {
        // The FIRST page failing is a real feed error and must surface. A later
        // page failing means this endpoint cannot page (see the cursor bug at the
        // top of this file) — degrade quietly and stop asking.
        const isFirstPage = !pageParam?.cursor && (pageParam?.page || 1) === 1;
        if (isFirstPage) throw error;

        console.warn(
          `[usePaginatedEvents] next page unavailable for ${endpoint}; ` +
            "continuing with the events already loaded.",
          error?.response?.status || error?.message || error,
        );

        return { items: [], meta: null, nextParam: null, failed: true };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.nextParam ?? undefined,
  });

  const pages = query.data?.pages ?? [];

  const items = useMemo(
    () => dedupeEvents(pages.flatMap((page) => page.items ?? [])),
    [pages],
  );

  // Newest page's meta; null once a page has failed without meta.
  const meta = useMemo(() => {
    for (let i = pages.length - 1; i >= 0; i -= 1) {
      if (pages[i]?.meta) return pages[i].meta;
    }
    return { current_page: 1, last_page: null, total: null, count: 0 };
  }, [pages]);

  const hasNextPage = Boolean(query.hasNextPage);
  /* Only claim the feed is complete when the API actually said so — either it
     returned no next cursor/page, or the next-page attempt failed (which also
     means there is nothing further we can show). Never from a fabricated
     `last_page`, which is what made both consumers lie before. */
  const isDone = !hasNextPage;

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const loadNext = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    query.fetchNextPage();
  }, [query]);

  return {
    items,
    meta,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    hasNextPage,
    isDone,
    refresh,
    loadNext,
  };
}
