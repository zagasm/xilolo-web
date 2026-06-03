import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Radio } from "lucide-react";
import {
  CountdownPill,
  eventStartDate,
  firstImageFromPoster,
  formatMetaLine,
  hostHasActiveSubscription,
  hostName,
  priceText,
} from "./SingleEvent";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";
import { getEventStatusMeta, normalizeEventStatus } from "../../utils/eventStatus";

function resolvePoster(event, posterFallback) {
  const posterUrl = firstImageFromPoster(event?.poster);
  return posterUrl || posterFallback || "/images/event-dummy.jpg";
}

function RecommendationCard({ event, posterFallback }) {
  const status = normalizeEventStatus(event?.status);
  const statusMeta = getEventStatusMeta(event?.status);
  const isLive = status === "live";
  const isPaid = !!event?.hasPaid;
  const startDate = eventStartDate(event);
  const host = hostName(event);
  const imageUrl = resolvePoster(event, posterFallback);

  return (
    <article className="tw:h-full tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-[#eef2f7] tw:bg-white tw:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <Link
        to={`/event/view/${event.id}`}
        className="tw:block tw:text-inherit tw:no-underline"
      >
        <div className="tw:relative tw:h-52 tw:w-full tw:overflow-hidden tw:bg-slate-100">
          <img
            className="tw:h-full tw:w-full tw:object-cover"
            src={imageUrl}
            alt={event?.title || "Event"}
            loading="lazy"
          />

          <div className="tw:absolute tw:inset-0 tw:bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.16)_42%,rgba(15,23,42,0.62)_100%)]" />

          <div className="tw:absolute tw:left-4 tw:top-4 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white/92 tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-slate-900 tw:shadow-sm">
            {isLive ? (
              <Radio className="tw:h-3.5 tw:w-3.5 tw:text-red-500" />
            ) : (
              <CalendarDays className="tw:h-3.5 tw:w-3.5 tw:text-emerald-600" />
            )}
            {statusMeta.label}
          </div>

          <div className="tw:absolute tw:bottom-4 tw:left-4 tw:right-4 tw:flex tw:items-end tw:justify-between tw:gap-3">
            <div className="tw:min-w-0">
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-white/70">
                Event
              </div>
              <div className="tw:line-clamp-2 tw:text-xl tw:font-semibold tw:leading-tight tw:text-white">
                {event?.title || "Untitled event"}
              </div>
            </div>

            <div className="tw:max-w-[45%] tw:rounded-2xl tw:bg-white/92 tw:px-3 tw:py-2 tw:text-right tw:shadow-sm">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-slate-500">
                Ticket
              </div>
              <div className="tw:break-words tw:text-base tw:font-semibold tw:leading-tight tw:text-slate-900">
                {priceText(event)}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="tw:flex tw:flex-col tw:gap-4 tw:p-5">
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-2xl tw:bg-[#f8fafc] tw:px-3 tw:py-3">
          <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-slate-200">
            <img
              src={event?.hostImage ?? "/images/avater_pix.avif"}
              alt={host}
              className="tw:h-full tw:w-full tw:object-cover"
            />
          </div>
          <div className="tw:min-w-0">
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
              Organised by
            </div>
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
              <span className="tw:truncate">{host}</span>
              {hostHasActiveSubscription(event) && (
                <SubscriptionBadge className="tw:size-4" />
              )}
            </div>
          </div>
        </div>

        <div className="tw:flex tw:flex-col tw:gap-3">
          {startDate && status === "upcoming" ? (
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-2xl tw:border tw:border-[#eef2f7] tw:bg-[#fcfdff] tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-slate-600">
                <Clock className="tw:h-4 tw:w-4" />
                Starts in
              </div>
              <CountdownPill target={startDate} />
            </div>
          ) : (
            <div className="tw:rounded-2xl tw:border tw:border-[#eef2f7] tw:bg-[#fcfdff] tw:px-4 tw:py-3 tw:text-sm tw:font-medium tw:text-slate-700">
              {formatMetaLine(event)}
            </div>
          )}

          <Link
          style={{
            color: "white"
          }}
            to={`/event/view/${event.id}`}
            className="tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:rounded-[18px] tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:no-underline hover:tw:bg-primarySecond"
          >
            {isPaid ? "View event" : `Buy Ticket (${priceText(event)})`}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function YouMayAlsoLike({
  recs = [],
  posterFallback,
  title = "You may also like",
}) {
  const items = recs.slice(0, 8);
  const [sliderRef, sliderInstanceRef] = useKeenSlider({
    slides: {
      perView: 1,
      spacing: 16,
    },
    breakpoints: {
      "(min-width: 768px)": {
        slides: {
          perView: 2,
          spacing: 20,
        },
      },
      "(min-width: 1280px)": {
        slides: {
          perView: 3,
          spacing: 24,
        },
      },
    },
    rubberband: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateState = useCallback(() => {
    const slider = sliderInstanceRef.current;
    if (!slider) return;
    setSelectedIndex(slider.track.details.rel);
    setCanScrollPrev(slider.track.details.rel > 0);
    setCanScrollNext(
      slider.track.details.rel < slider.track.details.slides.length - 1
    );
    setScrollSnaps(Array.from({ length: slider.track.details.slides.length }));
  }, [sliderInstanceRef]);

  useEffect(() => {
    const slider = sliderInstanceRef.current;
    if (!slider) return;
    updateState();
    slider.on("slideChanged", updateState);
    slider.on("updated", updateState);
    return () => {
      slider.off("slideChanged", updateState);
      slider.off("updated", updateState);
    };
  }, [sliderInstanceRef, updateState]);

  if (!items.length) return null;

  return (
    <section className="tw:space-y-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h4 className="tw:text-2xl tw:font-semibold tw:text-slate-900 tw:md:text-[28px]">
          {title}
        </h4>

        <div className="tw:flex tw:items-center tw:gap-2">
          <button
            type="button"
            onClick={() => sliderInstanceRef.current?.prev()}
            disabled={!canScrollPrev}
            className="tw:inline-flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:shadow-sm hover:tw:bg-slate-50 tw:disabled:cursor-not-allowed tw:disabled:opacity-40"
            aria-label="Show previous events"
          >
            <ArrowLeft className="tw:h-4 tw:w-4" />
          </button>
          <button
            type="button"
            onClick={() => sliderInstanceRef.current?.next()}
            disabled={!canScrollNext}
            className="tw:inline-flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:shadow-sm hover:tw:bg-slate-50 tw:disabled:cursor-not-allowed tw:disabled:opacity-40"
            aria-label="Show more events"
          >
            <ArrowRight className="tw:h-4 tw:w-4" />
          </button>
        </div>
      </div>

      <div ref={sliderRef} className="keen-slider">
          {items.map((event) => (
            <div
              key={event?.id || event?.slug || `${event?.title}-${event?.status}`}
              className="keen-slider__slide tw:min-w-0"
            >
              <RecommendationCard
                event={event}
                posterFallback={posterFallback}
              />
            </div>
          ))}
      </div>

      {scrollSnaps.length > 1 ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => sliderInstanceRef.current?.moveToIdx(index)}
              className={`tw:h-2.5 tw:rounded-full tw:transition-all ${
                index === selectedIndex
                  ? "tw:w-8 tw:bg-primary"
                  : "tw:w-2.5 tw:bg-slate-300 hover:tw:bg-slate-400"
              }`}
              aria-label={`Go to recommendation ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
