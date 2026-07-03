// src/pages/search/SearchPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { showError } from "../../component/ui/toast";
import SubscriptionBadge from "../../component/ui/SubscriptionBadge.jsx";

// Re-use your existing card + shimmer
import {
  EventShimmer,
  eventStartDate,
  hostHasActiveSubscription,
  hostName,
  priceText,
} from "../../component/Events/SingleEvent";

const RECENTS_KEY = "Xilolo_search_recent_people";

function normalizeSearchResponse(raw) {
  if (!raw) return { people: [], events: [] };

  const items = Array.isArray(raw) ? raw : raw.data || [];
  const people = [];
  const events = [];

  items.forEach((item) => {
    if (!item || !item.type || !item.data) return;

    if (item.type === "event") {
      events.push(item.data);
    } else if (item.type === "organiser" || item.type === "user") {
      people.push(item);
    }
  });

  return { people, events };
}

function initialsFromName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(item) {
  const data = item?.data || {};

  // Organiser search result
  if (item?.type === "organiser") {
    // if organiser is a string, use it
    if (typeof data.organiser === "string") return data.organiser;

    // if organiser is an object, pick a good label
    if (data.organiser && typeof data.organiser === "object") {
      return (
        data.organiser.organiser ||
        data.organiser.name ||
        data.organiser.userName ||
        data.organiser.email ||
        "Organizer"
      );
    }

    // some APIs might return name directly
    return data.name || data.userName || data.email || "Organizer";
  }

  // Normal user search result
  return data.name || data.firstName || data.userName || data.email || "User";
}

function getPersonId(item) {
  const data = item?.data || {};

  // organiser result
  if (item?.type === "organiser") {
    if (typeof data.organiser === "object" && data.organiser?.userId)
      return data.organiser.userId;
    if (typeof data.organiser === "object" && data.organiser?.user_id)
      return data.organiser.user_id;
    if (typeof data.organiser === "object" && data.organiser?.id)
      return data.organiser.id;
    return data.userId || data.user_id || data.id || null;
  }

  // user result
  return data.userId || data.user_id || data.id || null;
}

function getAvatarUrl(item) {
  const data = item?.data || {};

  if (item?.type === "organiser") {
    // organiser might be object or string
    if (typeof data.organiser === "object") {
      return data.organiser.profileImage || data.organiser.profileUrl || null;
    }
    return data.profileImage || null;
  }

  return data.profileUrl || data.profileImage || null;
}

function getCompactEventMeta(event) {
  const startDate = eventStartDate(event);
  const dateLabel = startDate
    ? startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : event?.eventDate || "Date TBA";
  const timeLabel = event?.startTime || "Time TBA";

  return { dateLabel, timeLabel };
}

function getEventPosterUrl(event) {
  if (Array.isArray(event?.poster)) {
    return event.poster.find((item) => item?.type === "image" && item?.url)?.url || null;
  }

  return typeof event?.poster === "string" ? event.poster : null;
}

function CompactEventRow({ event, index = null, onClick }) {
  const poster = getEventPosterUrl(event);
  const { dateLabel, timeLabel } = getCompactEventMeta(event);
  const organiser = hostName(event);
  const hasActiveSubscription = !!(
    event?.has_active_subscription || hostHasActiveSubscription(event)
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:flex tw:w-full tw:items-start tw:gap-3 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:text-left tw:shadow-[0_10px_26px_rgba(15,23,42,0.04)] tw:transition tw:hover:border-neon/30 tw:hover:bg-slate-50 tw:hover:shadow-[0_14px_34px_rgba(15,23,42,0.08),0_0_18px_rgba(0,245,255,0.08)]"
    >
      

      <div className="tw:min-w-0 tw:flex-1">
        
        <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-base tw:font-semibold tw:text-slate-900">
          <span>{event?.title || "Untitled event"}</span>
          
        </div>
        <div className="tw:mt-1 tw:text-[11px] tw:md:text-sm tw:text-slate-500">
          Organised by {organiser}
          {hasActiveSubscription ? (
            <SubscriptionBadge className="tw:size-3 tw:md:size-4 tw:ml-1" />
          ) : null}
        </div>

        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-2 tw:text-xs tw:text-slate-500">
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <CalendarDays className="tw:h-3.5 tw:w-3.5" />
            {dateLabel}
          </span>
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <Clock3 className="tw:h-3.5 tw:w-3.5" />
            {timeLabel}
          </span>
          <span className="tw:rounded-full tw:bg-slate-100 tw:px-2.5 tw:py-1 tw:font-medium tw:text-slate-700">
            {priceText(event)}
          </span>
        </div>
      </div>

      <div className="tw:h-16 tw:w-16 tw:shrink-0 tw:overflow-hidden tw:rounded-2xl tw:bg-slate-100">
        {poster ? (
          <img
            src={poster}
            alt={event?.title || "Event poster"}
            className="tw:h-full tw:w-full tw:object-cover"
          />
        ) : null}
      </div>
    </button>
  );
}

function SearchSuggestionEventRow({ event, onClick }) {
  const poster = getEventPosterUrl(event);
  const { dateLabel, timeLabel } = getCompactEventMeta(event);
  const organiser = hostName(event);

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:flex tw:w-full tw:items-stretch tw:gap-3 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:text-left tw:shadow-[0_10px_24px_rgba(15,23,42,0.04)] tw:transition tw:hover:border-neon/30 tw:hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="tw:w-1 tw:shrink-0 tw:rounded-full tw:bg-[#00FFD1]" />

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:line-clamp-2 tw:text-base tw:font-bold tw:leading-tight tw:text-primary">
          {event?.title || "Untitled event"}
        </div>

        <div className="tw:mt-1 tw:truncate tw:text-sm tw:text-slate-500">
          Organised by {organiser}
        </div>

        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-2 tw:text-xs tw:text-slate-500">
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <CalendarDays className="tw:h-3.5 tw:w-3.5" />
            {dateLabel}
          </span>
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <Clock3 className="tw:h-3.5 tw:w-3.5" />
            {timeLabel}
          </span>
        </div>

        <div className="tw:mt-3 tw:text-lg tw:font-bold tw:text-[#058C78]">
          {priceText(event)}
        </div>
      </div>

      <div className="tw:h-24 tw:w-24 tw:shrink-0 tw:overflow-hidden tw:rounded-[20px] tw:bg-lightPurple tw:sm:h-28 tw:sm:w-28">
        {poster ? (
          <img
            src={poster}
            alt={event?.title || "Event poster"}
            className="tw:h-full tw:w-full tw:object-cover"
          />
        ) : null}
      </div>
    </button>
  );
}

function PersonRow({ item, onClick }) {
  const isOrganiser = item.type === "organiser";

  const name = getDisplayName(item);
  const subtitle = isOrganiser ? "Event organiser" : "User";
  const avatarUrl = getAvatarUrl(item);
  const initials = initialsFromName(name);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  // console.log(item)

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:py-3 tw:px-1 tw:rounded-2xl tw:transition tw:hover:bg-zinc-50 tw:hover:shadow-[0_0_18px_rgba(0,245,255,0.06)]"
    >
      <div className="tw:w-14 tw:h-14 tw:rounded-full tw:overflow-hidden tw:shrink-0 tw:bg-lightPurple tw:flex tw:items-center tw:justify-center tw:font-semibold tw:border tw:border-neon">
        {avatarUrl && !avatarFailed ? (
          <img
            src={avatarUrl}
            alt={name}
            className="tw:w-full tw:h-full tw:object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="tw:text-primary">{initials}</span>
        )}
      </div>

      <div className="tw:flex tw:flex-col tw:text-left tw:overflow-hidden">
        <div className="tw:flex tw:items-center">
          <span className="tw:text-base tw:font-semibold tw:text-black tw:truncate">
            {name}
          </span>
          {item.data.has_active_subscription && (
            <SubscriptionBadge className="tw:size-[15px]" />
          )}
        </div>
        <span className="tw:text-sm tw:text-zinc-500 tw:truncate">
          {subtitle}
        </span>
      </div>
    </button>
  );
}

function PersonSliderCard({ item, onClick }) {
  const name = getDisplayName(item);
  const avatarUrl = getAvatarUrl(item);
  const initials = initialsFromName(name);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:flex tw:w-full tw:flex-col tw:items-center tw:gap-2 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-4 tw:text-center tw:shadow-[0_10px_26px_rgba(15,23,42,0.04)] tw:transition tw:hover:border-neon/30 tw:hover:bg-slate-50 tw:hover:shadow-[0_14px_34px_rgba(15,23,42,0.08),0_0_18px_rgba(0,245,255,0.08)]"
    >
      <div className="tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-lightPurple">
        {avatarUrl && !avatarFailed ? (
          <img
            src={avatarUrl}
            alt={name}
            className="tw:h-full tw:w-full tw:object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="tw:text-primary tw:text-sm tw:font-semibold">
            {initials}
          </span>
        )}
      </div>
      <span className="tw:line-clamp-2 tw:min-h-10 tw:text-sm tw:font-semibold tw:text-slate-900">
        {name}
      </span>
    </button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth() || {};
  const searchShellRef = useRef(null);

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [peopleSliderRef] = useKeenSlider({
    slides: {
      perView: 2.1,
      spacing: 12,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: {
          perView: 3.2,
          spacing: 14,
        },
      },
      "(min-width: 1024px)": {
        slides: {
          perView: 5,
          spacing: 16,
        },
      },
    },
    rubberband: false,
  });

  const fetchTrending = async () => {
    try {
      setLoadingTrending(true);
      const res = await api.get("/api/v1/recommendations/trending/search", {
        ...authHeaders(token),
      });

      setTrendingEvents(res?.data?.data ?? []);
    } catch (err) {
      console.error(err);
      // don't toast here - trending is "nice to have"
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchShellRef.current?.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  // persistent recent people
  const [recentPeople, setRecentPeople] = useState([]);

  // load recent from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentPeople(parsed);
      }
    } catch (e) {
      console.error("Failed to read recents", e);
    }
  }, []);

  // small debounce
  const [pendingQuery, setPendingQuery] = useState("");
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setQuery(urlQuery);
    setPendingQuery(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    const id = setTimeout(() => {
      const t = pendingQuery.trim();

      if (!t) {
        // reset search results view when input is empty
        setPeople([]);
        setEvents([]);
        setHasSearched(false);
        return;
      }

      doSearch(t);
    }, 400);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery]);

  const handleBack = () => {
    setIsSuggestionsOpen(false);
    navigate(-1);
  };

  const handleClear = () => {
    setQuery("");
    setPendingQuery("");
    setPeople([]);
    setEvents([]);
    setHasSearched(false);
    setIsSuggestionsOpen(true);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setPendingQuery(value);
    setIsSuggestionsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSuggestionsOpen(false);
    doSearch(query.trim());
  };

  const updateRecents = (newPeople) => {
    if (!Array.isArray(newPeople) || newPeople.length === 0) return;

    setRecentPeople((prev) => {
      const map = new Map();

      // new first so they appear at top
      [...newPeople, ...prev].forEach((item) => {
        if (!item || !item.type || !item.data) return;
        const key = `${item.type}-${item.data.id}`;
        if (!map.has(key)) {
          map.set(key, item);
        }
      });

      const merged = Array.from(map.values()).slice(0, 10); // keep last 10
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error("Failed to write recents", e);
      }

      return merged;
    });
  };

  const doSearch = async (term) => {
    try {
      setLoading(true);
      setHasSearched(true);

      const res = await api.get("/api/v1/search", {
        params: { q: term },
        ...authHeaders(token),
      });

      const { people: foundPeople, events: foundEvents } =
        normalizeSearchResponse(res.data);

      setPeople(foundPeople);
      setEvents(foundEvents);
      updateRecents(foundPeople);
    } catch (err) {
      console.error(err);
      showError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = useMemo(
    () => people.length > 0 || events.length > 0,
    [people, events]
  );
  const trimmedQuery = query.trim();
  const isTypingQuery = trimmedQuery.length >= 2;
  const showSuggestionPanel = isSuggestionsOpen;
  const suggestionEvents = isTypingQuery ? events : trendingEvents;
  const suggestionHeading = isTypingQuery ? "Suggested Events" : "Trending Events";
  const suggestionSubtext = isTypingQuery
    ? "Quick matches based on what you are typing."
    : "Popular events people are checking out right now.";

  const peopleToShow = people.length > 0 ? people : recentPeople;
  const showPeopleSection = peopleToShow.length > 0;

  return (
    <div className="tw:min-h-screen tw:bg-white tw:flex tw:justify-center tw:py-16 tw:md:py-20 tw:px-3 tw:sm:px-4">
      <div className="tw:w-full tw:max-w-4xl tw:pb-10 tw:pt-8">
        {/* Top search bar */}
        <div
          ref={searchShellRef}
          className="tw:relative tw:flex tw:items-center tw:gap-3 tw:mb-6 tw:sm:mb-8"
        >
          <button
            type="button"
            onClick={handleBack}
            className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:hover:bg-zinc-100 tw:transition-colors"
          >
            <ArrowLeft className="tw:w-5 tw:h-5 tw:text-black" />
          </button>

          <form
            onSubmit={handleSubmit}
            className="tw:flex-1 tw:relative tw:flex tw:items-center"
          >
            <div className="tw:flex tw:items-center tw:bg-[#f5f7fa] tw:border tw:border-slate-200 tw:rounded-full tw:px-3 tw:sm:px-4 tw:py-4 tw:w-full tw:transition focus-within:tw:border-neon/50 focus-within:tw:shadow-[0_0_0_4px_rgba(0,245,255,0.08),0_12px_30px_rgba(15,23,42,0.06)]">
              <Search className="tw:w-5 tw:h-5 tw:text-zinc-500 tw:mr-2" />
              <input
                type="text"
                value={query}
                onFocus={() => setIsSuggestionsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsSuggestionsOpen(false);
                  }
                }}
                onChange={handleChange}
                placeholder="Search events, creators or genres..."
                className="tw:flex-1 tw:bg-transparent tw:border-none tw:outline-none tw:text-sm tw:sm:text-base tw:text-black tw:placeholder:text-zinc-400"
              />
              <button
                type="button"
                aria-label="Search filters"
                className="tw:ml-2 tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:text-zinc-500 tw:transition-colors hover:tw:bg-white/60"
              >
                <SlidersHorizontal className="tw:h-4 tw:w-4" />
              </button>
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-full tw:hover:bg-white/60 tw:transition-colors"
                >
                  <X className="tw:w-4 tw:h-4 tw:text-zinc-500" />
                </button>
              )}
            </div>
          </form>

          {showSuggestionPanel && (
            <div className="tw:absolute tw:left-0 tw:right-0 tw:top-[calc(100%+12px)] tw:z-30">
              <div className="tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-slate-200 tw:bg-[#fbfbf9] tw:p-4 tw:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
                <div className="tw:mb-4">
                  <div className="tw:text-base tw:font-semibold tw:text-primary">
                    {suggestionHeading}
                  </div>
                  <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                    {isTypingQuery
                      ? loading
                        ? "Searching for matching events..."
                        : suggestionSubtext
                      : suggestionSubtext}
                  </div>
                </div>

                {!isTypingQuery && loadingTrending && suggestionEvents.length === 0 ? (
                  <div className="tw:space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="tw:h-32 tw:animate-pulse tw:rounded-3xl tw:bg-white"
                      />
                    ))}
                  </div>
                ) : null}

                {isTypingQuery && loading ? (
                  <div className="tw:space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="tw:h-32 tw:animate-pulse tw:rounded-3xl tw:bg-white"
                      />
                    ))}
                  </div>
                ) : null}

                {!loading &&
                !loadingTrending &&
                suggestionEvents.length > 0 ? (
                  <div className="tw:flex tw:max-h-[460px] tw:flex-col tw:gap-3 tw:overflow-y-auto tw:pr-1">
                    {suggestionEvents.slice(0, 6).map((event) => (
                      <SearchSuggestionEventRow
                        key={event.id}
                        event={event}
                        onClick={() => {
                          setIsSuggestionsOpen(false);
                          navigate(`/event/view/${event.id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {isTypingQuery &&
                !loading &&
                suggestionEvents.length === 0 ? (
                  <div className="tw:rounded-[22px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-white tw:px-4 tw:py-5 tw:text-sm tw:text-slate-500">
                    No event suggestions yet. Press Enter to view broader search
                    results.
                  </div>
                ) : null}

                {!isTypingQuery &&
                !loadingTrending &&
                suggestionEvents.length === 0 ? (
                  <div className="tw:rounded-[22px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-white tw:px-4 tw:py-5 tw:text-sm tw:text-slate-500">
                    Trending events are not available right now.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {!showSuggestionPanel && loading && (
          <div className="tw:mb-4 tw:text-sm tw:text-zinc-500">Searching…</div>
        )}

        {!showSuggestionPanel && showPeopleSection && (
          <section className="tw:mb-8">
            <div className="tw:mb-3 tw:text-lg tw:sm:text-xl tw:font-semibold tw:text-black">
              {people.length > 0 ? "Users" : "Recent Searches"}
            </div>

            <div ref={peopleSliderRef} className="keen-slider">
              {peopleToShow.map((item) => (
                <div
                  key={`${item.type}-${item.data.id}`}
                  className="keen-slider__slide"
                >
                  <PersonSliderCard
                    item={item}
                    onClick={() => {
                      const id = getPersonId(item);
                      if (!id) return;
                      navigate(`/profile/${id}`);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {!showSuggestionPanel && !hasSearched && trendingEvents.length > 0 && (
          <section className="tw:mb-6">
            <div className="tw:mb-3 tw:text-lg tw:sm:text-xl tw:font-semibold tw:text-black">
              Trending Searches
            </div>
            <div className="tw:mb-4 tw:text-sm tw:text-slate-500">
              Popular events people are checking out right now.
            </div>

            <div className="tw:flex tw:flex-col tw:gap-3">
              {trendingEvents.map((event, index) => (
                <CompactEventRow
                  key={event.id}
                  event={event}
                  index={index}
                  onClick={() => navigate(`/event/view/${event.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {!showSuggestionPanel &&
        !hasSearched &&
        loadingTrending &&
        trendingEvents.length === 0 && (
          <div className="row tw:mx-0 tw:mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventShimmer key={i} />
            ))}
          </div>
        )}

        {!showSuggestionPanel && events.length > 0 && (
          <section className="tw:mb-6">
            <div className="tw:mb-3 tw:text-lg tw:sm:text-xl tw:font-semibold tw:text-black">
              Events
            </div>

            <div className="tw:flex tw:flex-col tw:gap-3">
              {events.map((event) => (
                <CompactEventRow
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/event/view/${event.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {!showSuggestionPanel && loading && events.length === 0 && (
          <div className="row tw:mx-0 tw:mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventShimmer key={i} />
            ))}
          </div>
        )}

        {!showSuggestionPanel && !loading && hasSearched && !hasResults && (
          <div className="tw:mt-10 tw:text-center tw:text-zinc-500">
            <p className="tw:text-base tw:font-medium">
              No results found for “{query}”
            </p>
            <p className="tw:text-sm tw:mt-1">
              Try a different name, event title or genre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
