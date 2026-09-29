/**
 * /feed — the signed-in HOME.
 *
 * This file is a translation, not a design. It mirrors the Flutter app's home
 * screen section-for-section:
 *
 *   xilolo-app/lib/features/presentation/screens/home_revamp/screen/home_revamp_screen.dart
 *     _HomeHeaderSection      -> <HomeHeader>        (greeting + wallet strip + tab pills)
 *     _HomeWalletStrip        -> <WalletStrip>
 *     _CompactHomeTabPills    -> <TabPill> pair      (All / Live + live count)
 *     _buildAllSliverList     -> <HeroFeedCard> list (All tab, single column)
 *     _HomeHeroCard           -> <HeroFeedCard>
 *     _buildLiveSliverList    -> <LiveFeedCard> list (Live tab, single column)
 *     LiveEventCard           -> <LiveFeedCard>      (home/widgets/live_event_card.dart)
 *     _buildShimmerLoader     -> <HeroSkeleton>
 *     empty + error states    -> <EmptyState> / <InlineErrorCard>
 *   xilolo-app/lib/core/widget/bottom_nav.dart -> the web Navbar (global shell)
 *
 * Tokens: DESIGN.md + src/styles/tailwind.css. Primitives: src/component/ui.
 * Tailwind here is `tw:`-prefixed with the variant AFTER the prefix.
 *
 * Data is untouched: the feed still reads the same endpoints through the same
 * `usePaginatedEvents` hook the previous EventTemplate used.
 */
import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import Countdown from "react-countdown";
import {
  BadgeCheck,
  CalendarDays,
  CalendarX2,
  Info,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  Ticket,
  TicketCheck,
  VideoOff,
  Wallet,
} from "lucide-react";

import SEO from "../../component/SEO";
import MobileSingleOrganizers from "../../component/Organizers/ForMobile/OrganisersForYou";
import EventActionsSheet from "../../component/Events/EventsActionSheet";
import {
  eventStartDate,
  getRawDate,
  hostHasActiveSubscription,
  hostName,
  priceText,
} from "../../component/Events/SingleEvent";
import { getEventStatusMeta, normalizeEventStatus } from "../../utils/eventStatus";
import usePaginatedEvents from "../../hooks/usePaginatedEvents";
import { useWalletSummary } from "../../features/wallet/hooks/useWalletSummary";
import {
  formatWalletMoney,
  getWalletBalanceAmount,
  getWalletCurrencyCode,
} from "../../features/wallet/walletUtils";
import { Button, LiveBadge, EmptyState, Skeleton } from "../../component/ui";
import { useAuth } from "../auth/AuthContext";
import "./Homestyle.css";

/* ── Endpoints — unchanged from the previous implementation ──────────────── */
const ALL_ENDPOINT = "/api/v1/events/all/get";
const LIVE_ENDPOINT = "/api/v1/events/view/live";

/* ── Presentation helpers (mirror the app's private helpers) ─────────────── */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const asText = (value) => (typeof value === "string" ? value.trim() : "");

/** App `_homeFormatEventDate` + startTime -> "25 Nov 2025 · 08:00 PM". */
function eventDateLine(event) {
  const raw = getRawDate(event);
  const time = asText(event?.startTime || event?.start_time);
  const parts = [];

  if (raw) {
    const [year, month, day] = raw.split("-");
    const monthIndex = parseInt(month, 10);
    if (year && monthIndex >= 1 && monthIndex <= 12) {
      parts.push(`${String(day).padStart(2, "0")} ${MONTHS[monthIndex - 1]} ${year}`);
    }
  }

  if (time) {
    const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const suffix = (match[3] || (hour >= 12 ? "PM" : "AM")).toUpperCase();
      const hour12 = ((hour + 11) % 12) + 1;
      parts.push(`${String(hour12).padStart(2, "0")}:${match[2]} ${suffix}`);
    } else {
      parts.push(time);
    }
  }

  return parts.join(" · ");
}

/** App `_homePosterUrl`: first non-video poster, else the first poster. */
function posterUrl(event) {
  const posters = Array.isArray(event?.poster) ? event.poster : [];
  if (!posters.length) return "";
  const picked =
    posters.find((item) => asText(item?.type || "image").toLowerCase() !== "video") ||
    posters[0];
  return asText(picked?.url) || asText(posters[0]?.url);
}

/** App `_homeCapitalize` + price fallback (`_homePriceText`). */
function eventTitle(event) {
  const raw = asText(event?.title);
  if (!raw) return "Untitled event";
  return raw[0].toUpperCase() + raw.slice(1);
}

function eventPrice(event) {
  const value = priceText(event);
  const text = value == null ? "" : String(value).trim();
  return text || "Free";
}

function hostInitials(name) {
  return asText(name) ? asText(name)[0].toUpperCase() : "?";
}

/**
 * App `_HomeHeroCard._resolveCta()` — the card never says "Get tickets" twice.
 * Returns a lucide icon component (the app's Iconsax equivalents).
 */
function resolveCta(event, isLive) {
  if (isLive) return { Icon: Play, label: "Watch live now" };

  const status = normalizeEventStatus(event?.status);
  if (["ended", "completed", "finished", "past"].includes(status)) {
    return event?.enableReplay
      ? { Icon: RotateCcw, label: "Watch replay" }
      : { Icon: Info, label: "View event" };
  }
  if (event?.hasPaid) return { Icon: TicketCheck, label: "Ticket Purchased" };
  if (eventPrice(event).toLowerCase() === "free") {
    return { Icon: Ticket, label: "Reserve free seat" };
  }
  return { Icon: Ticket, label: "Buy Ticket" };
}

function eventHref(event) {
  const id = event?.id ?? event?.slug;
  return id == null || String(id).trim() === "" ? null : `/event/view/${id}`;
}

/* ── Host avatar — app `_hostAvatar()` / `_avatarFallback()` ─────────────── */
function HostAvatar({ event, name, size = 34, className = "" }) {
  const image = asText(event?.hostImage || event?.host_image);

  if (image) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`tw:shrink-0 tw:rounded-pill tw:bg-inner tw:object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`home-avatar-fallback tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:text-xs tw:font-bold tw:text-paper-raised ${className}`}
      style={{ width: size, height: size }}
    >
      {hostInitials(name)}
    </span>
  );
}

/* ── Glass chip — app `_glassChip()` ─────────────────────────────────────── */
function GlassChip({ children, className = "" }) {
  return (
    <span
      className={`home-glass-chip tw:inline-flex tw:items-center tw:rounded-pill tw:px-[11px] tw:py-1.5 ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Header tab pill — app `_CompactHomeTabPill` (38px, pill) ────────────── */
function TabPill({ label, selected, onClick, showLiveDot = false, count = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`tw:inline-flex tw:h-[38px] tw:items-center tw:gap-1.5 tw:rounded-pill tw:px-[18px] tw:text-sm tw:font-semibold tw:transition-colors ${
        selected
          ? "tw:bg-ink tw:text-paper"
          : "tw:border tw:border-hairline tw:bg-paper-raised tw:text-body tw:hover:bg-chip"
      }`}
    >
      {showLiveDot ? (
        <span className="tw:size-[7px] tw:shrink-0 tw:rounded-full tw:bg-danger" />
      ) : null}
      <span className="tw:whitespace-nowrap">{label}</span>
      {count > 0 ? (
        <span
          className={`tw:text-xs tw:font-bold ${
            selected ? "tw:text-paper/70" : "tw:text-muted"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ── Wallet strip — app `_HomeWalletStrip` ──────────────────────────────── */
function WalletStrip() {
  const { data, isLoading } = useWalletSummary();
  const balance = formatWalletMoney(
    getWalletBalanceAmount(data),
    getWalletCurrencyCode(data),
  );

  return (
    <Link
      to="/account/wallet"
      className="tw:mt-2.5 tw:flex tw:items-center tw:gap-3 tw:rounded-[18px] tw:border tw:border-accent/25 tw:px-3 tw:py-2.5"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--color-accent-soft), var(--color-paper-raised))",
      }}
    >
      <span className="tw:flex tw:size-[38px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-[13px] tw:bg-accent tw:text-ink">
        <Wallet className="tw:size-[19px]" aria-hidden="true" />
      </span>
      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:block tw:text-[11px] tw:font-medium tw:leading-none tw:text-muted">
          Available balance
        </span>
        <span className="tw:mt-1.5 tw:block tw:truncate tw:text-lg tw:font-bold tw:leading-none tw:text-body">
          {isLoading && !data ? "—" : balance}
        </span>
      </span>
      <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-pill tw:bg-accent tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-ink">
        <Plus className="tw:size-[15px]" aria-hidden="true" />
        Top up
      </span>
    </Link>
  );
}

/* ── Hero card — app `_HomeHeroCard` (the All tab) ──────────────────────── */
function HeroFeedCard({ event }) {
  const live = normalizeEventStatus(event?.status) === "live";
  const target = eventStartDate(event);
  const hasFutureCountdown =
    !live && target != null && target.getTime() > Date.now();
  const statusLabel = asText(event?.status)
    ? getEventStatusMeta(event.status).label
    : "";
  const { Icon: CtaIcon, label: ctaLabel } = resolveCta(event, live);

  const poster = posterUrl(event);
  const title = eventTitle(event);
  const host = hostName(event);
  const verified = hostHasActiveSubscription(event);
  const dateLine = eventDateLine(event);
  const href = eventHref(event);

  return (
    <article className="tw:mb-4 tw:overflow-hidden tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised">
      {href ? (
        <Link to={href} className="home-hero-media tw:block" aria-label={title}>
          <PosterMedia
            poster={poster}
            title={title}
            overlay={
              live ? (
                <LiveBadge />
              ) : hasFutureCountdown ? (
                <GlassChip className="tw:gap-[7px]">
                  <span className="tw:size-[7px] tw:shrink-0 tw:rounded-full tw:bg-danger" />
                  <Countdown
                    date={target.getTime()}
                    daysInHours={false}
                    renderer={({ days, hours, minutes, seconds }) => (
                      <span className="tw:text-xs tw:font-extrabold tw:tracking-tight tw:text-paper-raised">
                        {String(days).padStart(2, "0")}D:
                        {String(hours).padStart(2, "0")}H:
                        {String(minutes).padStart(2, "0")}M:
                        {String(seconds).padStart(2, "0")}S
                      </span>
                    )}
                  />
                </GlassChip>
              ) : statusLabel ? (
                <GlassChip>
                  <span className="tw:text-[11.5px] tw:font-bold tw:text-paper-raised">
                    {statusLabel}
                  </span>
                </GlassChip>
              ) : null
            }
          />
        </Link>
      ) : (
        <PosterMedia
          poster={poster}
          title={title}
          overlay={live ? <LiveBadge /> : null}
        />
      )}

      <div className="tw:p-4">
        {href ? (
          <Link to={href} className="tw:block">
            <h3 className="tw:line-clamp-2 tw:font-display tw:text-base tw:font-extrabold tw:leading-[1.2] tw:text-body">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="tw:line-clamp-2 tw:font-display tw:text-base tw:font-extrabold tw:leading-[1.2] tw:text-body">
            {title}
          </h3>
        )}

        <div className="tw:mt-3 tw:flex tw:items-start tw:gap-2.5">
          <HostAvatar event={event} name={host} />
          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:flex tw:items-center tw:gap-1 tw:text-[13px] tw:font-bold tw:text-body">
              <span className="tw:truncate">{host}</span>
              {verified ? (
                <BadgeCheck
                  className="tw:size-[13px] tw:shrink-0 tw:text-accent-deep"
                  aria-label="Verified organiser"
                />
              ) : null}
            </p>
            {dateLine ? (
              <p className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-muted">
                {dateLine}
              </p>
            ) : null}
          </div>
          <div className="tw:shrink-0 tw:text-right">
            <p className="tw:text-[9.5px] tw:font-bold tw:leading-none tw:text-muted">
              From
            </p>
            <p className="tw:mt-1 tw:font-display tw:text-[16.5px] tw:font-extrabold tw:leading-none tw:text-body">
              {eventPrice(event)}
            </p>
          </div>
        </div>

        <CtaButton href={href}>
          <CtaIcon className="tw:size-[19px]" aria-hidden="true" />
          {ctaLabel}
        </CtaButton>
      </div>
    </article>
  );
}

/** Poster slot: blurred bleed copy behind the un-cropped image (app parity). */
function PosterMedia({ poster, title, overlay }) {
  return (
    <div className="home-hero-media">
      {poster ? (
        <>
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            className="home-hero-media__blur"
          />
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="home-hero-media__image"
          />
        </>
      ) : (
        <div className="home-poster-fallback tw:h-[200px] tw:w-full" />
      )}
      {overlay ? <div className="tw:absolute tw:left-3.5 tw:top-3.5">{overlay}</div> : null}
    </div>
  );
}

/**
 * Full-width pill CTA — app hero card (`_HomeHeroCard`) and live card
 * (`LiveEventCard`) share this shape. Only the live card turns red, and only
 * once the viewer has paid ("Join Live Stream").
 */
function CtaButton({ href, hasPaid = false, children }) {
  const variant = hasPaid ? "danger" : "primary";
  const className = "tw:mt-3.5 tw:w-full";

  if (!href) {
    return (
      <Button variant={variant} size="lg" className={className} disabled>
        {children}
      </Button>
    );
  }

  return (
    <Button as={Link} to={href} variant={variant} size="lg" className={className}>
      {children}
    </Button>
  );
}

/* ── Live card — app LiveEventCard (home/widgets/live_event_card.dart) ──── */
function LiveFeedCard({ event, onMore }) {
  const poster = posterUrl(event);
  const title = eventTitle(event);
  const host = hostName(event);
  const verified = hostHasActiveSubscription(event);
  const dateLine = eventDateLine(event);
  const hasPaid = event?.hasPaid === true;
  const href = eventHref(event);

  return (
    <article className="tw:mb-5 tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-2.5">
      <div className="tw:relative tw:min-h-[170px] tw:overflow-hidden tw:rounded-[12px] tw:bg-inner">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="tw:relative tw:block tw:w-full tw:h-auto"
          />
        ) : (
          <div className="home-poster-fallback tw:h-[170px] tw:w-full" />
        )}

        <div className="tw:pointer-events-none tw:absolute tw:inset-0 home-scrim-bottom" />

        <LiveBadge className="tw:absolute tw:left-2.5 tw:top-2.5" />

        <button
          type="button"
          onClick={onMore}
          aria-label="Event options"
          className="tw:absolute tw:right-2.5 tw:top-2.5 tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-pill tw:bg-black/45 tw:text-paper-raised"
        >
          <MoreHorizontal className="tw:size-5" aria-hidden="true" />
        </button>

        <div className="tw:absolute tw:inset-x-3 tw:bottom-3 tw:flex tw:items-center tw:gap-2.5">
          <HostAvatar event={event} name={host} size={40} />
          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-bold tw:text-paper-raised">
              <span className="tw:truncate">{host}</span>
              {verified ? (
                <BadgeCheck
                  className="tw:size-4 tw:shrink-0 tw:text-accent-deep"
                  aria-label="Verified organiser"
                />
              ) : null}
            </p>
            {dateLine ? (
              <p className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-paper-raised/90">
                {dateLine}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="tw:mt-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
        <h3 className="tw:line-clamp-2 tw:text-[15px] tw:font-bold tw:leading-snug tw:text-body">
          {title}
        </h3>
        <span className="tw:shrink-0 tw:font-display tw:text-xl tw:font-bold tw:leading-none tw:text-body">
          {eventPrice(event)}
        </span>
      </div>

      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5 tw:rounded-[10px] tw:border tw:border-hairline tw:bg-paper tw:px-3 tw:py-2.5">
        <span className="tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-chip tw:text-muted-strong">
          <CalendarDays className="tw:size-4" aria-hidden="true" />
        </span>
        <span className="tw:truncate tw:text-xs tw:text-muted-strong">
          {dateLine || "Date coming soon"}
        </span>
      </div>

      <CtaButton href={href} hasPaid={hasPaid}>
        {hasPaid ? (
          <Play className="tw:size-5" aria-hidden="true" />
        ) : (
          <Ticket className="tw:size-5" aria-hidden="true" />
        )}
        {hasPaid ? "Join Live Stream" : "Buy Ticket"}
      </CtaButton>
    </article>
  );
}

/* ── Loading / error / empty — app shimmer, inline error card, empty state ─ */
function HeroSkeleton() {
  return (
    <div className="tw:mb-4 tw:overflow-hidden tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised">
      <Skeleton className="tw:h-[200px] tw:w-full tw:rounded-none" />
      <div className="tw:p-4">
        <Skeleton className="tw:h-4 tw:w-3/4 tw:rounded-control" />
        <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5">
          <Skeleton className="tw:size-[34px] tw:rounded-pill" />
          <div className="tw:min-w-0 tw:flex-1">
            <Skeleton className="tw:h-3 tw:w-1/3 tw:rounded-control" />
            <Skeleton className="tw:mt-2 tw:h-3 tw:w-1/2 tw:rounded-control" />
          </div>
        </div>
        <Skeleton className="tw:mt-3.5 tw:h-[50px] tw:w-full tw:rounded-pill" />
      </div>
    </div>
  );
}

function InlineErrorCard({ message, onRetry }) {
  return (
    <div className="tw:mb-4 tw:flex tw:items-center tw:gap-3 tw:rounded-card tw:border tw:border-danger/30 tw:bg-danger/10 tw:px-3.5 tw:py-3">
      <span className="tw:flex tw:size-[38px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-paper-raised tw:text-danger">
        <CalendarX2 className="tw:size-5" aria-hidden="true" />
      </span>
      <p className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-body">
        {message}
      </p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ── Header — app `_HomeHeaderSection` ──────────────────────────────────── */
function HomeHeader({ firstName, activeTab, onTabChange, liveCount }) {
  return (
    <header className="tw:shrink-0 tw:border-b tw:border-hairline tw:bg-paper">
      <div className="tw:mx-auto tw:w-full tw:max-w-[720px] tw:px-3.5 tw:pt-3.5 tw:pb-3">
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <p className="tw:min-w-0 tw:truncate tw:text-[18.5px] tw:font-extrabold tw:leading-[1.08] tw:tracking-[-0.01em] tw:text-body">
            Hi <span className="tw:text-accent-deep">{firstName || "there"}</span>
          </p>
          <span aria-hidden="true" className="tw:text-base tw:leading-none">
            👋
          </span>
        </div>

        <WalletStrip />

        <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2">
          <TabPill
            label="All"
            selected={activeTab === "all"}
            onClick={() => onTabChange("all")}
          />
          <TabPill
            label="Live"
            showLiveDot
            count={liveCount}
            selected={activeTab === "live"}
            onClick={() => onTabChange("live")}
          />
        </div>
      </div>
    </header>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [showOrganizers, setShowOrganizers] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const eventsScrollRef = useRef(null);
  const { user } = useAuth();

  // Same endpoints, same hook, same response shape as before. The app loads
  // the All + Live feeds together (home_revamp_screen.dart:181-186); the Live
  // feed is also what supplies the tab pill's count.
  const allFeed = usePaginatedEvents(ALL_ENDPOINT);
  const liveFeed = usePaginatedEvents(LIVE_ENDPOINT);

  const liveEvents = useMemo(
    () => (liveFeed.items || []).filter((e) => normalizeEventStatus(e?.status) === "live"),
    [liveFeed.items],
  );

  const isLive = activeTab === "live";
  const feed = isLive ? liveFeed : allFeed;
  const list = isLive ? liveEvents : allFeed.items || [];

  const { ref: loadMoreRef, inView } = useInView({ rootMargin: "300px" });

  React.useEffect(() => {
    if (inView) feed.loadNext();
  }, [inView, feed.loadNext]);

  React.useEffect(() => {
    const area = eventsScrollRef.current;
    if (!area) return;

    const onScroll = () => {
      if (area.scrollTop > 10) setShowOrganizers(true);
    };

    area.addEventListener("scroll", onScroll);
    return () => area.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSelectedEvent(null);

    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = 0;
    }

    setShowOrganizers(false);
  };

  const firstName =
    (typeof user?.firstName === "string" && user.firstName.trim()) ||
    (typeof user?.username === "string" && user.username.trim()) ||
    "";

  const showSkeletons = feed.loading && list.length === 0;
  const errorMessage =
    feed.error?.response?.data?.message ||
    feed.error?.message ||
    "Please try again later.";
  const isDone = feed.meta?.current_page >= feed.meta?.last_page;

  const emptyState = isLive
    ? {
        Icon: VideoOff,
        title: "No live events available",
        body: "Live events will appear here once they are available. Please check back soon.",
      }
    : {
        Icon: CalendarX2,
        title: "No events available",
        body: "Events will appear here once they are available. Please check back soon.",
      };

  return (
    <>
      <SEO title="Discover Events - Xilolo" />

      <div className="tw:w-full tw:bg-paper tw:pt-24 tw:font-sans">
        <div className="home-feed-shell">
          <HomeHeader
            firstName={firstName}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            liveCount={liveEvents.length}
          />

          <div ref={eventsScrollRef} className="home-feed tw-no-scrollbar">
            <div className="tw:mx-auto tw:w-full tw:max-w-[720px] tw:px-4 tw:pt-3 tw:pb-7">
              {feed.error && list.length > 0 ? (
                <InlineErrorCard message={errorMessage} onRetry={feed.refresh} />
              ) : null}

              {showSkeletons ? (
                <>
                  <HeroSkeleton />
                  <HeroSkeleton />
                  <HeroSkeleton />
                </>
              ) : null}

              {!feed.loading && feed.error && list.length === 0 ? (
                <EmptyState
                  icon={CalendarX2}
                  title="Can't load events right now"
                  body={errorMessage}
                  action={
                    <Button variant="primary" size="md" onClick={feed.refresh}>
                      Retry
                    </Button>
                  }
                />
              ) : null}

              {!feed.loading && !feed.error && list.length === 0 ? (
                <EmptyState
                  icon={emptyState.Icon}
                  title={emptyState.title}
                  body={emptyState.body}
                />
              ) : null}

              {list.map((event) =>
                isLive ? (
                  <LiveFeedCard
                    key={event.id}
                    event={event}
                    onMore={() => setSelectedEvent(event)}
                  />
                ) : (
                  <HeroFeedCard key={event.id} event={event} />
                ),
              )}

              {feed.loadingMore && list.length > 0 ? (
                <>
                  <HeroSkeleton />
                  <HeroSkeleton />
                </>
              ) : null}

              {!showSkeletons && !isDone && list.length > 0 ? (
                <div ref={loadMoreRef} className="tw:h-10 tw:w-full" aria-hidden="true" />
              ) : null}

              {showOrganizers && !showSkeletons ? (
                <div className="tw:mt-12">
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-1 tw:pb-3">
                    <p className="tw:text-sm tw:font-semibold tw:text-body">
                      Organizers you may know
                    </p>
                    <Link
                      to="/organizers"
                      className="tw:text-xs tw:font-semibold tw:text-accent-deep"
                    >
                      View all
                    </Link>
                  </div>
                  <MobileSingleOrganizers />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <EventActionsSheet
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
        />
      </div>
    </>
  );
}
