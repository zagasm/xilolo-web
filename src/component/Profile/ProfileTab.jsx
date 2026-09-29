// src/component/Profile/ProfileTab.jsx
//
// Right-hand block of the web profile page: section heading (app app-bar title),
// the app's segmented status filter, and the event cards.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   Own profile   lib/.../profile/screens/my_events_screen.dart:198 — app bar
//                 title l10n.myEvents ("My Events"), so the web heading is the
//                 same string. Filter = my_events_screen.dart:215-301.
//   Other         lib/.../profile/screens/organizer_profile.dart:684-697 —
//                 "More From Organizer" (l10n.moreFromOrganizer, app_en.arb:224)
//                 immediately above the filter row (:153-155).
//   Plain user    lib/.../profile/screens/user_profile_screen.dart:157 — the
//                 first of the profile's two tabs is labelled "Events".
//
// Data is untouched: same useMyEvents hook, same GET /api/v1/user/events, same
// pagination/infinite scroll, same write-free rendering for another organiser's
// pre-bucketed events. The four filter keys are the app's four segments; the
// web's extra server buckets are folded into them (see BUCKET_KEYS) so no event
// becomes unreachable.
import React, { useMemo, useState } from "react";

import EventsFilterTabs from "./EventsFilterTab";
import EventsGrid from "./EventsGrid";
import useMyEvents from "../../hooks/useMyEvents";

/** app: _getFilteredEvents (organizer_profile.dart:789-806). The app's Ended
 *  segment is ended + paused; the web also has an `expired` bucket, folded in
 *  here so those events stay reachable under a chip. */
const BUCKET_KEYS = {
  all: ["all"],
  upcoming: ["upcoming"],
  live: ["live"],
  ended: ["ended", "paused", "expired"],
};

/** app bar title (my_events_screen.dart:198) / organizer_profile.dart:684-697
 *  / user_profile_screen.dart:157. Exported so /dev/profile-preview renders the
 *  real heading rather than a copy that can drift. */
export function ProfileEventsHeading({ heading }) {
  return (
    <div className="tw:flex tw:h-14 tw:items-center">
      <h1 className="tw:m-0! tw:text-[24px]! tw:font-extrabold! tw:leading-none tw:tracking-[-0.3px]! tw:text-body">
        {heading}
      </h1>
    </div>
  );
}

export default function ProfileTabs({ user, isOwnProfile, previewEvents }) {
  const [statusTab, setStatusTab] = useState("all");

  const {
    events: myEvents,
    loading: myEventsLoading,
    loadingMore: myEventsLoadingMore,
    error: myEventsError,
    hasMore: myEventsHasMore,
    loadMore: loadMoreMyEvents,
    refresh: refreshMyEvents,
  } = useMyEvents(statusTab);

  // ---------- ORGANISER PROFILE ----------
  const isOrganiserProfileData =
    !isOwnProfile && (!!user?.events || !!user?.allEvents);

  // Viewing a regular (non-organiser) user → they have no event buckets.
  // Show an empty grid instead of falling back to the viewer's own events.
  const isOtherRegularUserProfile = !isOwnProfile && !isOrganiserProfileData;

  const organiserEventsByTab = useMemo(() => {
    const buckets = user?.events || null;

    const pick = (keys) => {
      const out = [];
      for (const key of keys) {
        const list =
          key === "all"
            ? (buckets?.all ??
              (Array.isArray(user?.allEvents) ? user.allEvents : []))
            : key === "upcoming"
              ? (buckets?.upcoming ??
                (Array.isArray(user?.upcomingEvents) ? user.upcomingEvents : []))
              : (buckets?.[key] ?? []);
        if (Array.isArray(list)) out.push(...list);
      }
      return out;
    };

    return pick(BUCKET_KEYS[statusTab] ?? BUCKET_KEYS.all);
  }, [user, statusTab]);

  // ---------- choose source ----------
  const events = Array.isArray(previewEvents)
    ? previewEvents
    : isOrganiserProfileData
      ? organiserEventsByTab
      : isOtherRegularUserProfile
        ? []
        : myEvents;
  const loading =
    Array.isArray(previewEvents) ||
    isOrganiserProfileData ||
    isOtherRegularUserProfile
      ? false
      : myEventsLoading;
  const loadingMore =
    isOrganiserProfileData || isOtherRegularUserProfile
      ? false
      : myEventsLoadingMore;
  const error =
    isOrganiserProfileData || isOtherRegularUserProfile
      ? null
      : myEventsError;
  const hasMore =
    isOrganiserProfileData || isOtherRegularUserProfile
      ? false
      : myEventsHasMore;

  const heading = isOwnProfile
    ? "My Events"
    : isOrganiserProfileData
      ? "More From Organizer"
      : "Events";

  return (
    <div className="tw:flex tw:flex-col">
      <ProfileEventsHeading heading={heading} />

      <EventsFilterTabs value={statusTab} onChange={setStatusTab} />

      <div className="tw:mt-[14px]">
        <EventsGrid
          events={events}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreMyEvents}
          error={error}
          isOwnProfile={isOwnProfile}
          isOrganiserProfile={isOrganiserProfileData}
          isOtherUserProfile={isOtherRegularUserProfile}
          refreshEvents={isOrganiserProfileData ? undefined : refreshMyEvents}
        />
      </div>
    </div>
  );
}
