// src/component/Profile/EventsGrid.jsx
//
// The profile page's event list + its empty states.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app — the app has THREE different
// empty states and each of these screens owns one:
//   own profile   lib/.../profile/screens/my_events_screen.dart:958-1008
//                 card, max-w 380, r22, px22/pt24/pb22, 82 circle accent@10%
//                 with event_busy_outlined 38 accent, "No events found" 18/w800,
//                 "Create your first event to get started." 14 muted centred.
//   other user    lib/.../profile/screens/user_profile_screen.dart:173-203
//                 plain centred event icon 64 faint, "No events found" 16
//                 textSecondary, "This user hasn't created any events yet" 14
//                 textLabel.
//   other org.    lib/.../profile/screens/organizer_profile.dart:757-775
//                 plain centred event_busy 64 faint, "No events found" 18
//                 textSecondary, px32/py40.
//
// The list is a single column at every width because the app's is
// (organizer_profile.dart:778-786 SliverList, my_events_screen.dart:307-360).
import React, { useEffect, useRef, useState } from "react";
import { CalendarX2 } from "lucide-react";

import EventCard from "./EventCard";
import EventCardShimmer from "../Events/EventCardShimmer";

/** app: my_events_screen.dart:958-1008. */
function OwnEventsEmpty() {
  return (
    <div className="tw:flex tw:justify-center tw:px-5 tw:pt-10 tw:pb-14">
      <div className="tw:w-full tw:max-w-[380px] tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-[22px] tw:pt-6 tw:pb-[22px] tw:text-center">
        <div className="tw:mx-auto tw:flex tw:size-[82px] tw:items-center tw:justify-center tw:rounded-full tw:bg-accent/10">
          <CalendarX2 className="tw:size-[38px] tw:text-accent" />
        </div>
        <div className="tw:mt-[18px] tw:text-[18px] tw:font-extrabold tw:text-body">
          No events found
        </div>
        <div className="tw:mt-2 tw:text-[14px] tw:leading-[1.45] tw:text-muted">
          Create your first event to get started.
        </div>
      </div>
    </div>
  );
}

/** app: user_profile_screen.dart:173-203 / organizer_profile.dart:757-775. */
function OtherProfileEmpty({ isOtherUserProfile }) {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:py-10 tw:text-center">
      <CalendarX2 className="tw:size-16 tw:text-faint" />
      <div className="tw:mt-4 tw:text-[18px] tw:text-muted">No events found</div>
      {isOtherUserProfile && (
        <div className="tw:mt-2 tw:text-[14px] tw:text-ink-muted">
          This user hasn&apos;t created any events yet
        </div>
      )}
    </div>
  );
}

export default function EventsGrid({
  events,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  error,
  isOwnProfile,
  isOrganiserProfile,
  isOtherUserProfile,
  refreshEvents,
}) {
  const [items, setItems] = useState(events ?? []);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // keep local list in sync when parent updates (new fetch, filter, etc)
  useEffect(() => {
    setItems(events ?? []);
  }, [events]);

  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || !observerRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
          loadMoreRef.current?.();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, items.length]);

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdated = (updatedEvent) => {
    if (!updatedEvent?.id) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === updatedEvent.id ? { ...item, ...updatedEvent } : item,
      ),
    );
  };

  if (loading) {
    return (
      <div className="tw:space-y-[14px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventCardShimmer key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-danger/20 tw:bg-danger/5 tw:px-4 tw:py-3 tw:text-xs tw:text-danger">
        Failed to load events: {error}
      </div>
    );
  }

  if (!items?.length) {
    return isOwnProfile ? (
      <OwnEventsEmpty />
    ) : (
      <OtherProfileEmpty isOtherUserProfile={isOtherUserProfile} />
    );
  }

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-[14px]">
        {items.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            isOwnProfile={isOwnProfile}
            isOrganiserProfile={isOrganiserProfile}
            onDeleted={handleDeleted}
            onUpdated={handleUpdated}
            refreshEvents={refreshEvents}
          />
        ))}
      </div>

      <div ref={observerRef} className="tw:h-4 tw:w-full" />

      {loadingMore ? (
        <div className="tw:mt-[14px] tw:space-y-[14px]">
          {Array.from({ length: 2 }).map((_, i) => (
            <EventCardShimmer key={`more-${i}`} />
          ))}
        </div>
      ) : null}
    </>
  );
}
