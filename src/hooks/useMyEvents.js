import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api, authHeaders } from "../lib/apiClient";
import { useAuth } from "../pages/auth/AuthContext";
import { resolveMediaUrl } from "../utils/media";

export function normalizeStatus(v) {
  if (!v) return "unknown";
  const s = String(v).toLowerCase().trim();
  if (s === "upcoming" || s === "soon") return "upcoming";
  if (s === "ready_to_go_live") return "ready_to_go_live";
  if (s === "live") return "live";
  if (s === "paused") return "paused";
  if (s === "ended" || s === "past" || s === "completed") return "ended";
  if (s === "expired") return "expired";
  return s;
}

function formatMoney(value, currencyCode = "NGN") {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "Free";

  if (amount <= 0) return "Free";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currencyCode}`;
  }
}

function formatEventDate(dateValue) {
  if (!dateValue) return "Date not set";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(timeValue) {
  if (!timeValue) return "";

  const parsedDate = new Date(timeValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const normalized = String(timeValue).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) return normalized;

  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = ((hour + 11) % 12) + 1;

  return `${hour}:${minute} ${suffix}`;
}

function normalizePoster(rawEvent) {
  const source = Array.isArray(rawEvent?.poster)
    ? rawEvent.poster
    : Array.isArray(rawEvent?.event_images)
      ? rawEvent.event_images
      : [];

  return source.map((item) => ({
    ...item,
    url: resolveMediaUrl(item?.url),
    original_url: resolveMediaUrl(item?.original_url),
  }));
}

function mapEventForCard(rawEvent) {
  return {
    ...rawEvent,
    poster: normalizePoster(rawEvent),
    eventDate: rawEvent?.eventDate || formatEventDate(rawEvent?.event_date),
    eventDateISO: rawEvent?.eventDateISO || rawEvent?.event_date || "",
    startTime: formatEventTime(rawEvent?.startTime || rawEvent?.start_time || ""),
    endTime: formatEventTime(rawEvent?.endTime || rawEvent?.end_time || ""),
    hostName:
      rawEvent?.hostName ||
      rawEvent?.organizer?.name ||
      rawEvent?.organiser?.name ||
      rawEvent?.user?.name ||
      "Xilolo",
    price_display:
      rawEvent?.price_display ||
      formatMoney(
        rawEvent?.price,
        rawEvent?.currency?.code || rawEvent?.currency_code || "NGN",
      ),
    isOwner: rawEvent?.isOwner ?? true,
  };
}

function extractEventsPayload(payload) {
  const data = payload?.data ?? {};
  const list = Array.isArray(data?.events)
    ? data.events
    : Array.isArray(data)
      ? data
      : [];
  const pagination = data?.pagination ?? {};

  return {
    events: list.map(mapEventForCard),
    pagination: {
      currentPage: Number(pagination?.current_page ?? 1),
      perPage: Number(pagination?.per_page ?? (list.length || 10)),
      total: Number(pagination?.total ?? list.length),
      hasMore: Boolean(pagination?.has_more),
      lastPage: Number(
        pagination?.last_page ??
        (pagination?.has_more
          ? Number(pagination?.current_page ?? 1) + 1
          : 1),
      ),
    },
  };
}

const EMPTY_PAGINATION = {
  currentPage: 1,
  perPage: 10,
  total: 0,
  hasMore: false,
  lastPage: 1,
};

export default function useMyEvents(activeFilter = "all") {
  const { token } = useAuth();

  const eventsQuery = useInfiniteQuery({
    queryKey: ["profile", "my-events", token ?? "guest", activeFilter],
    enabled: !!token,
    staleTime: 1000 * 60 * 2,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = { page: pageParam };
      if (activeFilter !== "all") {
        params.status = activeFilter;
      }

      const response = await api.get("/api/v1/user/events", {
        ...authHeaders(token),
        params,
      });

      return extractEventsPayload(response?.data);
    },
    getNextPageParam: (lastPage) =>
      lastPage?.pagination?.hasMore
        ? lastPage.pagination.currentPage + 1
        : undefined,
  });

  const events = useMemo(
    () =>
      eventsQuery.data?.pages?.flatMap((page) =>
        Array.isArray(page?.events) ? page.events : [],
      ) ?? [],
    [eventsQuery.data],
  );

  const pagination = useMemo(() => {
    const lastPage =
      eventsQuery.data?.pages?.[eventsQuery.data.pages.length - 1] ?? null;
    return lastPage?.pagination ?? EMPTY_PAGINATION;
  }, [eventsQuery.data]);

  const loadMore = useCallback(() => {
    if (
      eventsQuery.isLoading ||
      eventsQuery.isFetchingNextPage ||
      !eventsQuery.hasNextPage
    ) {
      return;
    }

    eventsQuery.fetchNextPage();
  }, [eventsQuery]);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    if (activeFilter === "all") return list;
    return list.filter((event) => normalizeStatus(event?.status) === activeFilter);
  }, [activeFilter, events]);

  return {
    events: filteredEvents,
    rawEvents: events,
    loading: !!token ? eventsQuery.isLoading : false,
    loadingMore: eventsQuery.isFetchingNextPage,
    error: eventsQuery.error?.message || null,
    hasMore: !!eventsQuery.hasNextPage,
    pagination,
    loadMore,
    refresh: eventsQuery.refetch,
  };
}
