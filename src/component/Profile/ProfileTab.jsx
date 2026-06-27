import React, { useMemo, useState } from "react";
import EventsFilterTabs from "./EventsFilterTab";
import EventsGrid from "./EventsGrid";
import useMyEvents from "../../hooks/useMyEvents";

export default function ProfileTabs({ user, isOwnProfile }) {
  const [statusTab, setStatusTab] = useState("all");

  // ---------- MY PROFILE ----------
  const apiFilter = useMemo(() => statusTab, [statusTab]);

  const {
    events: myEvents,
    loading: myEventsLoading,
    loadingMore: myEventsLoadingMore,
    error: myEventsError,
    hasMore: myEventsHasMore,
    loadMore: loadMoreMyEvents,
    refresh: refreshMyEvents,
  } = useMyEvents(apiFilter, user?.id);

  // ---------- ORGANISER PROFILE ----------
  const isOrganiserProfileData =
    !isOwnProfile && (!!user?.events || !!user?.allEvents);

  const organiserEventsByTab = useMemo(() => {
    const buckets = user?.events || null;

    const all =
      buckets?.all ?? (Array.isArray(user?.allEvents) ? user.allEvents : []);

    const upcoming =
      buckets?.upcoming ??
      (Array.isArray(user?.upcomingEvents) ? user.upcomingEvents : []);

    const live = buckets?.live ?? [];
    const paused = buckets?.paused ?? [];
    const ended = buckets?.ended ?? [];
    const readyToGoLive = buckets?.ready_to_go_live ?? [];
    const expired = buckets?.expired ?? [];

    if (statusTab === "all") return all;
    if (statusTab === "upcoming") return upcoming;
    if (statusTab === "live") return live;
    if (statusTab === "paused") return paused;
    if (statusTab === "ended") return ended;
    if (statusTab === "ready_to_go_live") return readyToGoLive;
    if (statusTab === "expired") return expired;

    return all;
  }, [user, statusTab]);

  // ---------- choose source ----------
  const events = isOrganiserProfileData ? organiserEventsByTab : myEvents;
  const loading = isOrganiserProfileData ? false : myEventsLoading;
  const loadingMore = isOrganiserProfileData ? false : myEventsLoadingMore;
  const error = isOrganiserProfileData ? null : myEventsError;
  const hasMore = isOrganiserProfileData ? false : myEventsHasMore;

  const heading = isOwnProfile ? "My Events" : "Events";

  return (
    <div className="tw:h-full tw:flex tw:flex-col">
      <div className="tw:lg:sticky tw:lg:top-0 tw:z-20 tw:bg-white tw:pb-3">
        <div className="tw:flex tw:items-center tw:justify-between tw:pt-3 tw:pb-2">
          <span className="tw:text-lg tw:md:text-xl tw:font-semibold tw:text-gray-900">
            {heading}
          </span>
        </div>

        <EventsFilterTabs value={statusTab} onChange={setStatusTab} />
      </div>

      <div className="tw:flex-1 tw:mt-3 tw:pb-20">
        <EventsGrid
          events={events}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreMyEvents}
          error={error}
          isOwnProfile={isOwnProfile}
          isOrganiserProfile={isOrganiserProfileData}
          refreshEvents={isOrganiserProfileData ? undefined : refreshMyEvents}
        />
      </div>
    </div>
  );
}
