import React from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import { CalendarDays, Clock, MapPin, Smartphone } from "lucide-react";
import SEO from "../../component/SEO";
import { useSharedEventPage } from "../../features/eventShare/hooks/useSharedEventPage";
import { getEventDescription } from "../../features/eventShare/shareUtils";

// TODO(mobile): confirm the real App Store Apple ID + iOS bundle identifier.
const APP_STORE_URL =
  "https://apps.apple.com/app/id0000000000"; // Apple ID from the mobile team
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.zagasmstudio.app";

function posterUrl(event) {
  return (
    event?.poster?.find((item) => item?.type === "image" && item?.url)?.url ||
    event?.poster?.[0]?.url ||
    event?.cover?.url ||
    event?.icon_url ||
    ""
  );
}

function formatDateTime(event) {
  if (!event?.event_date && !event?.start_time) return null;
  const datePart = event.event_date || moment().format("YYYY-MM-DD");
  const timePart = event.start_time || "12:00:00";
  const parsed = moment(`${datePart} ${timePart}`, [
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD HH:mm",
    "MM/DD/YYYY HH:mm:ss",
  ]);
  return parsed.isValid() ? parsed.format("ddd, MMM D, YYYY · h:mm A") : null;
}

function EventDeepLinkShimmer() {
  return (
    <div className="tw:min-h-screen tw:bg-[#0f0a1a] tw:flex tw:items-center tw:justify-center">
      <div className="tw:mx-auto tw:max-w-md tw:w-full tw:px-5">
        <div className="tw:h-64 tw:animate-pulse tw:rounded-2xl tw:bg-white/10" />
        <div className="tw:mt-6 tw:space-y-3">
          <div className="tw:h-6 tw:w-3/4 tw:animate-pulse tw:rounded tw:bg-white/10" />
          <div className="tw:h-4 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-white/10" />
          <div className="tw:h-24 tw:animate-pulse tw:rounded tw:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function EventDeepLinkPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useSharedEventPage(id);

  if (isLoading) return <EventDeepLinkShimmer />;

  const event = data?.event;
  const deepLink = `https://xilolo.com/event/${id}`;

  if (isError || !event) {
    return (
      <div className="tw:min-h-screen tw:bg-[#0f0a1a] tw:text-white tw:flex tw:items-center tw:justify-center tw:px-6">
        <SEO title="Event not found" noIndex />
        <div className="tw:text-center tw:max-w-sm">
          <h1 className="tw:text-2xl tw:font-bold tw:mb-2">Event not found</h1>
          <p className="tw:text-white/60 tw:mb-6">
            This event may have ended or the link is incorrect.
          </p>
          <a
            href="https://xilolo.com"
            className="tw:inline-block tw:rounded-xl tw:bg-[#7C3AED] tw:px-6 tw:py-3 tw:font-semibold tw:text-white"
          >
            Go to Xilolo
          </a>
        </div>
      </div>
    );
  }

  const cover = posterUrl(event);
  const metaLine = formatDateTime(event);
  const description = getEventDescription(event) || "";
  const isLive = event?.status === "live";

  return (
    <div className="tw:min-h-screen tw:bg-[#0f0a1a] tw:text-white">
      <SEO
        title={event.title || "Event"}
        description={description.slice(0, 160)}
        image={cover || "/images/event-dummy.jpg"}
        url={deepLink}
        type="article"
      />

      <div className="tw:mx-auto tw:max-w-md tw:px-5 tw:py-8 tw:pb-14">
        {cover ? (
          <img
            src={cover}
            alt={event.title}
            className="tw:aspect-video tw:w-full tw:rounded-2xl tw:object-cover"
          />
        ) : (
          <div className="tw:aspect-video tw:w-full tw:rounded-2xl tw:bg-gradient-to-br tw:from-[#7C3AED] tw:to-[#312e81] tw:flex tw:items-center tw:justify-center">
            <span className="tw:text-4xl tw:font-black tw:text-white/80">
              {event.title?.charAt(0) || "X"}
            </span>
          </div>
        )}

        {isLive && (
          <span className="tw:mt-5 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#e11d48] tw:px-3 tw:py-1 tw:text-xs tw:font-bold tw:animate-pulse">
            ● LIVE NOW
          </span>
        )}

        <h1 className="tw:mt-3 tw:text-2xl tw:font-bold tw:leading-snug">
          {event.title}
        </h1>

        <div className="tw:mt-3 tw:space-y-1.5 tw:text-sm tw:text-white/60">
          {metaLine && (
            <p className="tw:flex tw:items-center tw:gap-2">
              <CalendarDays className="tw:h-4 tw:w-4" />
              {metaLine}
            </p>
          )}
          {event?.location && (
            <p className="tw:flex tw:items-center tw:gap-2">
              <MapPin className="tw:h-4 tw:w-4" />
              {event.location}
            </p>
          )}
          {event?.hostName && (
            <p className="tw:flex tw:items-center tw:gap-2">
              <Clock className="tw:h-4 tw:w-4" />
              Hosted by {event.hostName}
            </p>
          )}
        </div>

        {description && (
          <p className="tw:mt-5 tw:whitespace-pre-line tw:text-[15px] tw:leading-relaxed tw:text-white/75">
            {description}
          </p>
        )}

        <div className="tw:mt-8 tw:space-y-3">
          <a
            href={deepLink}
            className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-[#7C3AED] tw:px-4 tw:py-3.5 tw:font-bold tw:text-white tw:no-underline"
          >
            <Smartphone className="tw:h-5 tw:w-5" />
            {isLive ? "Watch live in the app" : "Open event in the app"}
          </a>

          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:rounded-xl tw:border tw:border-white/15 tw:bg-white/5 tw:px-3 tw:py-3 tw:text-center tw:text-sm tw:font-semibold tw:text-white tw:no-underline"
            >
              Get it on Google Play
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:rounded-xl tw:border tw:border-white/15 tw:bg-white/5 tw:px-3 tw:py-3 tw:text-center tw:text-sm tw:font-semibold tw:text-white tw:no-underline"
            >
              Download on the App Store
            </a>
          </div>
        </div>

        <p className="tw:mt-8 tw:text-center tw:text-xs tw:text-white/30">
          Powered by Xilolo
        </p>
      </div>
    </div>
  );
}
