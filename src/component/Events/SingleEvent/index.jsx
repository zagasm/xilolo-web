// src/component/Events/SingleEvent.jsx
import React, { useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import "./eventSTyling.css";
import camera_icon from "../../../assets/navbar_icons/camera_icon.png";
import live_indicator from "../../../assets/navbar_icons/live_indicator.png";
import { Link, useNavigate } from "react-router-dom";
import usePaginatedEvents from "../../../hooks/usePaginatedEvents";
import {
  Ellipsis,
  Clock,
  MapPin,
  CalendarDays,
  Frown,
  Pause,
} from "lucide-react";
import Countdown from "react-countdown";
import EventActionsSheet from "../EventsActionSheet";
import SubscriptionBadge from "../../ui/SubscriptionBadge.jsx";
import { getEventStatusMeta, normalizeEventStatus } from "../../../utils/eventStatus";

/* ---- Shimmer ---- */
export const EventShimmer = () => (
  <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 tw:flex">
    <div className="shadow-s rounded h-100 tw:w-full blog-card border-0 position-relative">
      <div className="shimmer-container">
        <div className="shimmer-image"></div>
        <div className="shimmer-content">
          <div className="shimmer-line shimmer-title"></div>
          <div className="shimmer-line shimmer-subtitle"></div>
          <div className="shimmer-line shimmer-price"></div>
        </div>
      </div>
    </div>
  </div>
);

/* ---- Helpers ---- */
export function firstImageFromPoster(poster = []) {
  const img = poster.find((p) => p?.type === "image" && p?.url);
  if (img) return img.url;
  return "/images/event-dummy.jpg";
}

function preloadEventImages(events = []) {
  events.forEach((event) => {
    const imageUrl = firstImageFromPoster(event?.poster);
    if (!imageUrl) return;

    const img = new Image();
    img.decoding = "async";
    img.src = imageUrl;
  });
}

export function formatMetaLine(event) {
  const rawDate = getRawDate(event);
  const rawTime = getRawTime(event);

  if (!rawDate) return rawTime || "";

  const [year, month, day] = rawDate.split("-").map(Number);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const shortDate = `${day}${suffix} ${months[month - 1]}, ${year}`;

  const [h, m] = rawTime.split(":");
  let hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = ((hr + 11) % 12) + 1;

  return `${shortDate} - ${hr}:${m} ${ampm}`;
}

export function priceText(event) {
  if (event?.price_display) return event.price_display;
  if (event?.currency?.symbol && event?.price) {
    return `${event.currency.symbol}${event.price}`;
  }
  if (event?.price) return event.price;
  return "Free";
}

export function hostName(event) {
  return (
    event?.hostName ||
    event?.organizer_name ||
    event?.creator_name ||
    "Unknown host"
  );
}

function organiserProfileId(event) {
  return (
    event?.organiserUserId ||
    event?.organiser_user_id ||
    event?.organiser?.user_id ||
    event?.organiser?.userId ||
    event?.organiser?.user?.id ||
    event?.organizer?.user_id ||
    event?.organizer?.userId ||
    event?.organizer?.user?.id ||
    event?.host?.user_id ||
    event?.host?.userId ||
    event?.user_id ||
    event?.userId ||
    event?.user?.id ||
    event?.hostId ||
    event?.organiserId ||
    event?.organizerId ||
    null
  );
}

export function hostHasActiveSubscription(event) {
  return !!(
    event?.hostHasActiveSubscription ||
    event?.has_active_subscription ||
    event?.host?.has_active_subscription ||
    event?.user?.has_active_subscription ||
    event?.organiser?.has_active_subscription ||
    event?.organizer?.has_active_subscription ||
    event?.hostSubscription?.isActive
  );
}

export function eventLocation(event) {
  if (event?.is_online) return "Online";
  return event?.location || "Venue TBA";
}

/** Extract clean raw date like 2025-11-25 */
export function getRawDate(event) {
  const raw = event?.eventDate || event?.event_date;
  if (!raw) return null;

  const parsedIso = new Date(raw);
  if (!Number.isNaN(parsedIso.getTime())) {
    const year = parsedIso.getFullYear();
    const month = String(parsedIso.getMonth() + 1).padStart(2, "0");
    const day = String(parsedIso.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const parts = raw.split(",");
  if (parts.length < 3) return null;

  const monthDay = parts[1].trim();
  const yearPart = parts[2].trim();
  const cleanYear = yearPart.replace(/[^\d]/g, "");

  const [monthName, day] = monthDay.split(" ");

  const monthIndex = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ].indexOf(monthName.toLowerCase());

  if (monthIndex === -1) return null;

  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return `${cleanYear}-${mm}-${dd}`;
}

/** Convert "08:00 PM" -> "20:00:00" */
function getRawTime(event) {
  const raw = event?.startTime || event?.start_time;
  if (!raw) return "00:00:00";

  const parsedIso = new Date(raw);
  if (!Number.isNaN(parsedIso.getTime())) {
    return `${String(parsedIso.getHours()).padStart(2, "0")}:${String(
      parsedIso.getMinutes()
    ).padStart(2, "0")}:${String(parsedIso.getSeconds()).padStart(2, "0")}`;
  }

  const normalizedRaw = String(raw).trim();
  const [timePart = "", ampmRaw = ""] = normalizedRaw.split(/\s+/);
  let [h = "0", m = "00", s = "00"] = timePart.split(":");
  const ampm = ampmRaw.toUpperCase();

  h = parseInt(h, 10);
  if (!Number.isFinite(h)) h = 0;

  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${String(m || "00").padStart(2, "0")}:${String(
    s || "00"
  ).padStart(2, "0")}`;
}

/** Build accurate JS Date considering timezone */
export function eventStartDate(event) {
  const date = getRawDate(event);
  const time = getRawTime(event);

  if (!date) return null;

  const zone = event?.timeZone?.name || "UTC";
  const iso = `${date}T${time}`;

  try {
    return new Date(new Date(iso).toLocaleString("en-US", { timeZone: zone }));
  } catch {
    return new Date(iso);
  }
}

/* ---- Countdown pill for upcoming events ---- */
export function CountdownPill({ target }) {
  if (!target) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1 tw:rounded-full tw:bg-black/70 tw:text-white tw:text-[10px] tw:md:text-[12px] tw:font-medium tw:border tw:border-white/30 tw:backdrop-blur">
      <Clock className="tw:w-4 tw:h-4 tw:opacity-80" />

      <Countdown
        date={target.getTime()}
        daysInHours={false}
        renderer={({ days, hours, minutes, seconds }) => {
          return (
            <span>
              {String(days).padStart(2, "0")}D:
              {String(hours).padStart(2, "0")}H:
              {String(minutes).padStart(2, "0")}M:
              {String(seconds).padStart(2, "0")}S
            </span>
          );
        }}
      />
    </div>
  );
}

/* ---- Single Card (shared for all variants) ---- */
export function EventCard({
  event,
  index = 0,
  variant = "default",
  onMore,
  hidePrice = false,
}) {
  const startDate = eventStartDate(event);
  const navigate = useNavigate();

  const isDedicatedLiveTab = variant === "live";
  const isDedicatedUpcomingTab = variant === "upcoming";
  const normalizedStatus = normalizeEventStatus(event?.status);
  const statusMeta = getEventStatusMeta(event?.status);

  const isLive =
    isDedicatedLiveTab || (variant === "all" && normalizedStatus === "live");
  const isPaused =
    isDedicatedLiveTab || (variant === "all" && normalizedStatus === "paused");
  const isUpcoming =
    isDedicatedUpcomingTab ||
    (variant === "all" && normalizedStatus === "upcoming");
  const isReadyToGoLive = normalizedStatus === "ready_to_go_live";
  const isEnded = normalizedStatus === "ended";
  const isExpired = normalizedStatus === "expired";

  const ticketLabel = `Buy Ticket ${!hidePrice ? `(${priceText(event)})` : ""} `;

  function initialsFromName(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }

  const hostInitials = initialsFromName(hostName(event) || "");

  const isMyEvent =
    event?.isOwner ||
    event?.is_owner ||
    event?.is_my_event ||
    event?.isMine ||
    event?.is_current_user_event;

  const goToHostProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hostId = organiserProfileId(event);
    if (!hostId) return;
    navigate(`/profile/${hostId}`);
  };

  const statusChip = (
    <span className={`tw:inline-flex tw:h-6 tw:md:h-8 tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2.5 tw:text-[10px] tw:md:text-[12px] tw:font-semibold ${statusMeta.pillClass}`}>
      <span>{statusMeta.label}</span>
      {isLive ? (
      <img
        src={camera_icon}
        alt="Live"
        className="tw:h-3.5 tw:w-3.5 tw:object-contain"
      />
      ) : isPaused ? (
        <Pause className="tw:size-3.5" />
      ) : (
        <span className={`tw:inline-block tw:h-2 tw:w-2 tw:rounded-full ${statusMeta.dotClass}`} />
      )}
    </span>
  );

  return (
    <div className="p-0 p-md-2 tw:col-xl-4 col-lg-4 col-md-6 col-sm-6 tw:flex">
      <div className="blog-card position-relative tw:relative tw:flex tw:h-full tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-xl tw:bg-[#ffffff] tw:shadow-md border-0">
        <button
          style={{ borderRadius: "50%" }}
          type="button"
          onClick={onMore}
          className="tw:absolute tw:right-3 tw:top-3 tw:z-40 tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-black/35 tw:text-white tw:backdrop-blur"
        >
          <Ellipsis className="tw:h-4 tw:w-4" />
        </button>

        <Link to={`/event/view/${event.id}`} className="text-decoration-none">
          <div className="tw:relative tw:h-[210px] tw:w-full">
            <img
              className="tw:h-full tw:w-full tw:object-cover"
              src={firstImageFromPoster(event?.poster)}
              alt={event?.title || "Event"}
              loading={index < 6 ? "eager" : "lazy"}
              fetchPriority={index < 3 ? "high" : "auto"}
              decoding="async"
            />
          </div>
        </Link>

        <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4 tw:px-4 tw:py-4">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:wrap-break-word tw:text-[16px] tw:font-semibold tw:leading-tight tw:text-slate-900">
                {event?.title || "Untitled event"}
              </span>
            </div>
            {!hidePrice && (
              <div className="tw:shrink-0 tw:rounded-xl tw:px-3 tw:py-2 tw:text-right tw:text-primary">
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.12em] tw:text-primary/85">
                  Price
                </div>
                <div className="tw:text-xl tw:font-bold tw:leading-none">
                  {priceText(event)}
                </div>
              </div>
            )}
          </div>
          <div className=" tw:text-xs tw:text-zinc-600">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {(isLive || isPaused || isUpcoming || isReadyToGoLive || isEnded || isExpired) && (
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  {statusChip}
                  {isUpcoming && <CountdownPill target={startDate} />}
                </div>
              )}
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-zinc-700">
                <CalendarDays className="tw:h-4 tw:w-4 tw:text-zinc-500" />
                <span className="tw:font-medium">{formatMetaLine(event)}</span>
              </div>
            </div>
          </div>

          

          <div className="tw:min-h-[52px]">
            <button
              type="button"
              onClick={goToHostProfile}
              className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:bg-[#f5f5f5] tw:px-3 tw:py-2 tw:text-left tw:text-xs tw:font-medium tw:text-black"
            >
              <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-lightPurple tw:text-[11px] tw:font-semibold tw:text-primary">
                {event?.hostImage ? (
                  <img
                    src={event.hostImage}
                    alt={hostName(event)}
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  hostInitials || "?"
                )}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:text-zinc-500">
                  Organiser
                </div>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:text-slate-900">
                  <span className="tw:truncate">{hostName(event)}</span>
                  {hostHasActiveSubscription(event) && (
                    <SubscriptionBadge className="tw:size-4" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {isMyEvent ? (
            <Link
              to={`/event/view/${event.id}`}
              className="tw:mt-auto tw:inline-block tw:w-full"
            >
              <button
                type="button"
                style={{ borderRadius: 8 }}
                className="tw:w-full tw:rounded-2xl tw:bg-black tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:shadow-md"
              >
                You're hosting this event
              </button>
            </Link>
          ) : event?.hasPaid ? (
            <button
              type="button"
              style={{ borderRadius: 8 }}
              disabled
              className="tw:mt-auto tw:w-full tw:cursor-not-allowed tw:rounded-2xl tw:bg-primary/30 tw:py-3 tw:text-sm tw:font-semibold tw:text-white"
            >
              You have paid for this event.
            </button>
          ) : isEnded ? (
            <button
              type="button"
              style={{ borderRadius: 8 }}
              disabled
              className="tw:mt-auto tw:w-full tw:cursor-not-allowed tw:rounded-2xl tw:bg-zinc-200 tw:py-3 tw:text-sm tw:font-semibold tw:text-zinc-600"
            >
              Event ended
            </button>
          ) : isLive ? (
            <Link
              to={`/event/view/${event.id}`}
              className="tw:mt-auto tw:inline-block tw:w-full"
            >
              <button
                type="button"
                style={{ borderRadius: 8 }}
                className="tw:w-full tw:rounded-2xl tw:bg-red-500 tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:shadow-md"
              >
                Join event now
              </button>
            </Link>
          ) : (
            <Link
              to={`/event/view/${event.id}`}
              className="tw:mt-auto tw:inline-block tw:w-full"
            >
              <button
                type="button"
                style={{ borderRadius: 8 }}
                className="tw:w-full tw:rounded-2xl tw:bg-primary tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:shadow-md tw:hover:bg-primarySecond"
              >
                {ticketLabel}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventTemplate({
  endpoint = "/api/v1/events",
  live = false,
  upcoming = false,
  all = false,
}) {
  const {
    items,
    meta,
    loading,
    loadingMore,
    loadNext,
  } = usePaginatedEvents(endpoint);

  const [visibleEvents, setVisibleEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  React.useEffect(() => {
    if (!Array.isArray(items)) return;
    setVisibleEvents(items);
  }, [items]);

  React.useEffect(() => {
    if (!visibleEvents.length) return;
    preloadEventImages(visibleEvents.slice(0, 12));
  }, [visibleEvents]);

  /* ---- Infinite scroll trigger ---- */
  const { ref: loadMoreRef, inView } = useInView({ rootMargin: "300px" });

  React.useEffect(() => {
    if (inView) loadNext();
  }, [inView, loadNext]);

  const isDone = useMemo(() => meta?.current_page >= meta?.last_page, [meta]);

  const variant = live ? "live" : upcoming ? "upcoming" : "all";

  const showShimmer = loading && visibleEvents.length === 0;

  return (
    <>
      {/* SHIMMER */}
      {showShimmer && (
        <div className="row g-4 event-template-grid tw:mx-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventShimmer key={i} />
          ))}
        </div>
      )}

      {/* EVENTS */}
      {!showShimmer && (
        <div className="row g-4 event-template-grid tw:mx-0 tw:pt-8">
          {visibleEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              variant={variant}
              onMore={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      )}

      {/* LOADING MORE */}
      {loadingMore && visibleEvents.length > 0 && (
        <div className="row g-4 event-template-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <EventShimmer key={i} />
          ))}
        </div>
      )}

      {/* LOAD MORE TRIGGER */}
      {!isDone && (
        <div
          ref={loadMoreRef}
          className="tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center"
        />
      )}

      {/* EMPTY STATE */}
      {!loading && visibleEvents.length === 0 && (
        <div className="tw:mt-12 tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:text-gray-500">
          <Frown className="tw:mb-3 tw:h-10 tw:w-10" />
          <span className="tw:font-medium">No events available</span>
          <small>Check back later or try a different filter.</small>
        </div>
      )}

      <EventActionsSheet
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onEventReported={(id) =>
          setVisibleEvents((prev) => prev.filter((ev) => ev.id !== id))
        }
      />
    </>
  );
}
