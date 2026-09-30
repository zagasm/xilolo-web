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
 *     _buildAllSliverList     -> <HeroFeedCard> list (All tab)
 *     _HomeHeroCard           -> <HeroFeedCard>
 *     _buildLiveSliverList    -> <LiveFeedCard> list (Live tab)
 *     LiveEventCard           -> <LiveFeedCard>      (home/widgets/live_event_card.dart)
 *     _buildShimmerLoader     -> <HeroSkeleton>
 *     empty + error states    -> <EmptyState> / <InlineErrorCard>
 *   xilolo-app/lib/core/widget/bottom_nav.dart -> the web Navbar (global shell)
 *
 * App section order is preserved exactly: greeting -> wallet strip -> All/Live
 * pills -> feed, and the card anatomy stays poster -> title -> host + price ->
 * CTA. The ONLY structural change is the desktop layout: the feed is a real grid
 * (1 column mobile / 2 at md / 3 at xl) instead of one narrow column.
 *
 * Tokens: DESIGN.md + src/styles/tailwind.css. Primitives: src/component/ui.
 * Tailwind here is `tw:`-prefixed with the variant AFTER the prefix
 * (`tw:md:grid-cols-2`), never the other way round (`<variant>:tw:grid-cols-2`
 * is silently dead).
 *
 * Legacy-cascade notes for whoever touches this next:
 *   - `header { display:flex; height:40px; padding:30px }` and
 *     `h1..h6 { font-weight:500 }` ship UNLAYERED in src/style.css /
 *     main.min.css, so they beat layered Tailwind utilities whatever the class
 *     list says. The header wrapper is therefore a <div> (not a <header>), and
 *     heading weight carries the `!` important modifier.
 *   - `#root p { color: inherit }` (id-scoped) kills every `tw:text-*` on a <p>,
 *     so coloured copy is rendered as <span className="tw:block …">.
 *
 * Data is untouched: the feed still reads the same endpoints through the same
 * `usePaginatedEvents` hook the previous implementation used.
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

/* ── Layout tokens ───────────────────────────────────────────────────────── */

/** One container for the header AND the feed so the grid lines up with it. */
export const HOME_CONTAINER = "tw:mx-auto tw:w-full tw:max-w-7xl tw:px-4 tw:md:px-6";

/**
 * Responsive feed grid — 1 column on phones, 2 at md, 3 at xl (founder brief).
 * `items-stretch` + `h-full` on every card keeps each row equal-height and the
 * gap (16px / 24px on md+) is the only spacing between cards.
 */
export function FeedGrid({ className = "", children }) {
  return (
    <div
      className={`tw:grid tw:grid-cols-1 tw:items-stretch tw:gap-4 tw:md:grid-cols-2 tw:md:gap-5 tw:xl:grid-cols-3 ${className}`}
    >
      {children}
    </div>
  );
}

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

/* ── Organiser tap target — avatar + name open the organiser's profile ───── */
/**
 * The feed payload exposes NO share key: `app/Http/Resources/EventResource.php`
 * ships `hostId` / `organiser_id` (both the host user id) plus `hostName` /
 * `hostImage`, and `/organisers/:shareKey` can only resolve from a share key.
 * So the honest link from feed data is `/profile/:profileId`, which exists
 * today (src/app.jsx:523-524) and needs no backend change. A richer
 * `/organisers/:shareKey` link needs a share-key field added to EventResource.
 */
function hostProfileHref(event) {
  const candidates = [
    event?.hostId,
    event?.host_id,
    event?.organiser_id,
    event?.organiserId,
  ];
  for (const candidate of candidates) {
    const value = candidate === 0 || candidate ? String(candidate).trim() : "";
    if (value) return `/profile/${value}`;
  }
  return "";
}

/**
 * Renders the avatar + organiser name as ONE tap target. Falls back to a plain
 * (non-interactive) fragment when the payload carries no host id, so a card can
 * never link to a broken URL.
 */
function HostTapTarget({ event, className = "", children }) {
  const href = hostProfileHref(event);
  if (!href) return <>{children}</>;
  return (
    <Link
      to={href}
      title="View organiser profile"
      className={`tw:transition-opacity tw:hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
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
/**
 * Hover audit (defect 6): unselected = ink text on paper-raised, hover raises
 * the fill to chip (#EFEFF2) — 16.6:1. The count badge was `muted` on that
 * hover fill, 3.84:1 and failing AA, so it is `muted-strong` (5.9:1) now.
 * Selected = paper on ink (17.4:1 base, 16.7:1 on the ink-raised hover).
 */
export function TabPill({ label, selected, onClick, showLiveDot = false, count = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`tw:inline-flex tw:h-[38px] tw:items-center tw:gap-1.5 tw:rounded-pill tw:px-[18px] tw:text-sm tw:font-semibold tw:transition-colors ${
        selected
          ? "tw:bg-ink tw:text-paper tw:hover:bg-ink-raised"
          : "tw:border tw:border-hairline tw:bg-paper-raised tw:text-body tw:hover:bg-chip tw:hover:text-body"
      }`}
    >
      {showLiveDot ? (
        <span className="tw:size-[7px] tw:shrink-0 tw:rounded-full tw:bg-danger" />
      ) : null}
      <span className="tw:whitespace-nowrap">{label}</span>
      {count > 0 ? (
        <span
          className={`tw:text-xs tw:font-bold ${
            selected ? "tw:text-paper/70" : "tw:text-muted-strong"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ── Wallet strip — app `_HomeWalletStrip` ──────────────────────────────── */
/**
 * The ONE balance on this screen (the shell's Navbar chip is hidden here by
 * `.home-wallet-strip`'s sibling rule in Homestyle.css — defect 4).
 * Surface matches the app: flat fill + accent hairline + radius 18, no shadow
 * (DESIGN.md forbids shadows outside overlays). The old inline
 * `linear-gradient(var(--color-accent-soft) …)` never rendered at all: the tw
 * prefix renames @theme vars to `--tw-color-*`, so the var resolved to nothing.
 */
export function WalletStrip() {
  const { data, isLoading } = useWalletSummary();
  const balance = formatWalletMoney(
    getWalletBalanceAmount(data),
    getWalletCurrencyCode(data),
  );

  return (
    <Link
      to="/account/wallet"
      className="home-wallet-strip tw:mt-2.5 tw:flex tw:w-full tw:max-w-[420px] tw:items-center tw:gap-3 tw:rounded-[18px] tw:border tw:border-accent/40 tw:bg-paper-raised tw:px-3 tw:py-2.5 tw:transition-colors tw:hover:border-accent/70"
    >
      <span className="tw:flex tw:size-[38px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-[13px] tw:bg-[#16909C] tw:text-paper-raised">
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
      <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-pill tw:bg-[#16909C] tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-paper-raised">
        <Plus className="tw:size-[15px]" aria-hidden="true" />
        Top up
      </span>
    </Link>
  );
}

/* ── Card frame — shared by both card types so the grid stays equal-height ── */
export function FeedCard({ rounded = 12, padded = false, className = "", children }) {
  const radius = rounded >= 24 ? "tw:rounded-[24px]" : "tw:rounded-[16px]";
  return (
    <article
      className={`tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:border tw:border-hairline tw:bg-paper-raised ${radius} ${
        padded ? "tw:p-2.5" : ""
      } ${className}`}
    >
      {children}
    </article>
  );
}

/* ── Hero card — app `_HomeHeroCard` (the All tab) ──────────────────────── */
export function HeroFeedCard({ event }) {
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
    <FeedCard rounded={24}>
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

      <div className="tw:flex tw:flex-1 tw:flex-col tw:p-4">
        <h3 className="tw:mb-0! tw:text-base! tw:font-extrabold! tw:leading-[1.2]!">
          {href ? (
            <Link to={href} className="tw:block">
              <span className="tw:line-clamp-2 tw:block tw:font-display tw:text-base tw:font-extrabold tw:leading-[1.2] tw:text-body tw:transition-colors tw:hover:text-accent-deep">
                {title}
              </span>
            </Link>
          ) : (
            <span className="tw:line-clamp-2 tw:block tw:font-display tw:text-base tw:font-extrabold tw:leading-[1.2] tw:text-body">
              {title}
            </span>
          )}
        </h3>

        <div className="tw:mt-3 tw:flex tw:items-start tw:gap-2.5">
          <HostTapTarget
            event={event}
            className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-2.5"
          >
            <HostAvatar event={event} name={host} />
            <div className="tw:min-w-0 tw:flex-1">
              <span className="tw:flex tw:items-center tw:gap-1 tw:text-[13px] tw:font-bold tw:text-body">
                <span className="tw:truncate">{host}</span>
                {verified ? (
                  <BadgeCheck
                    className="tw:size-[13px] tw:shrink-0 tw:text-[#16909C]"
                    aria-label="Verified organiser"
                  />
                ) : null}
              </span>
              {dateLine ? (
                <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[11px] tw:text-muted">
                  {dateLine}
                </span>
              ) : null}
            </div>
          </HostTapTarget>
          <span className="tw:shrink-0 tw:text-right">
            <span className="tw:block tw:text-[9.5px] tw:font-bold tw:leading-none tw:text-muted">
              From
            </span>
            <span className="tw:mt-1 tw:block tw:font-display tw:text-[16.5px] tw:font-extrabold tw:leading-none tw:text-body">
              {eventPrice(event)}
            </span>
          </span>
        </div>

        <CtaButton href={href}>
          <CtaIcon className="tw:size-[19px]" aria-hidden="true" />
          {ctaLabel}
        </CtaButton>
      </div>
    </FeedCard>
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
 * (`LiveEventCard`) share this shape.
 *
 * Colours come from the app, not from taste. The app's card CTA is the accent
 * fill with a white label: `home_revamp_screen.dart:2580-2582` sets
 * `backgroundColor: pal.accent, foregroundColor: pal.onAccent`, where
 * `pal.accent` is the light-mode brand (`app_palette.dart:57-58` ->
 * `app_design_system.dart:26-40`, seed `#0EA5B4` -> `#16909C`) and
 * `pal.onAccent` resolves to `Colors.white` for that luminance
 * (`app_palette.dart:64-67`). `Button`'s `primary` variant points the other way
 * (accent fill + ink label), so the card CTA overrides it with the `!` suffix
 * form — needed twice over: the base rule so it beats the variant, and the
 * hover rule so the important base doesn't pin the hover state.
 */
export function CtaButton({ href, hasPaid = false, children }) {
  const variant = hasPaid ? "danger" : "primary";
  const className = hasPaid
    ? "tw:w-full"
    : "tw:w-full tw:bg-[#16909C]! tw:text-paper-raised! tw:hover:bg-accent-deep! tw:hover:text-paper-raised! tw:disabled:bg-[#16909C]/45! tw:disabled:text-paper-raised!";

  const button = href ? (
    <Button as={Link} to={href} variant={variant} size="lg" className={className}>
      {children}
    </Button>
  ) : (
    <Button variant={variant} size="lg" className={className} disabled>
      {children}
    </Button>
  );

  // mt-auto + pt-3.5 pins the CTA to the bottom of an equal-height grid card
  // (padding, not margin, so no two margin utilities have to fight).
  return <div className="tw:mt-auto tw:pt-3.5">{button}</div>;
}

/* ── Live card — app LiveEventCard (home/widgets/live_event_card.dart) ──── */
export function LiveFeedCard({ event, onMore }) {
  const poster = posterUrl(event);
  const title = eventTitle(event);
  const host = hostName(event);
  const verified = hostHasActiveSubscription(event);
  const dateLine = eventDateLine(event);
  const hasPaid = event?.hasPaid === true;
  const href = eventHref(event);

  return (
    <FeedCard padded>
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
          className="tw:absolute tw:right-2.5 tw:top-2.5 tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-pill tw:bg-black/50 tw:text-paper-raised tw:transition-colors tw:hover:bg-black/75"
        >
          <MoreHorizontal className="tw:size-5" aria-hidden="true" />
        </button>

        <div className="tw:absolute tw:inset-x-3 tw:bottom-3 tw:flex tw:items-center tw:gap-2.5">
          <HostTapTarget
            event={event}
            className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2.5"
          >
            <HostAvatar event={event} name={host} size={40} />
            <div className="tw:min-w-0 tw:flex-1">
              <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-bold tw:text-paper-raised">
                <span className="tw:truncate">{host}</span>
                {verified ? (
                  <BadgeCheck
                    className="tw:size-4 tw:shrink-0 tw:text-[#16909C]"
                    aria-label="Verified organiser"
                  />
                ) : null}
              </span>
              {dateLine ? (
                <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[11px] tw:text-paper-raised/90">
                  {dateLine}
                </span>
              ) : null}
            </div>
          </HostTapTarget>
        </div>
      </div>

      <div className="tw:mt-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
        <h3 className="tw:mb-0! tw:text-[15px]! tw:font-bold! tw:leading-snug!">
          <span className="tw:line-clamp-2 tw:block tw:text-[15px] tw:font-bold tw:leading-snug tw:text-body">
            {title}
          </span>
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
    </FeedCard>
  );
}

/* ── Loading / error / empty — app shimmer, inline error card, empty state ─ */
export function HeroSkeleton() {
  return (
    <FeedCard rounded={24}>
      <Skeleton className="tw:h-[200px] tw:w-full tw:rounded-none" />
      <div className="tw:flex tw:flex-1 tw:flex-col tw:p-4">
        <Skeleton className="tw:h-4 tw:w-3/4 tw:rounded-control" />
        <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5">
          <Skeleton className="tw:size-[34px] tw:rounded-pill" />
          <div className="tw:min-w-0 tw:flex-1">
            <Skeleton className="tw:h-3 tw:w-1/3 tw:rounded-control" />
            <Skeleton className="tw:mt-2 tw:h-3 tw:w-1/2 tw:rounded-control" />
          </div>
        </div>
        <div className="tw:mt-auto tw:pt-3.5">
          <Skeleton className="tw:h-[50px] tw:w-full tw:rounded-pill" />
        </div>
      </div>
    </FeedCard>
  );
}

export function InlineErrorCard({ message, onRetry }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-card tw:border tw:border-danger/30 tw:bg-danger/10 tw:px-3.5 tw:py-3">
      <span className="tw:flex tw:size-[38px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-paper-raised tw:text-danger">
        <CalendarX2 className="tw:size-5" aria-hidden="true" />
      </span>
      <span className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-body">
        {message}
      </span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* ── Header — app `_HomeHeaderSection` ──────────────────────────────────── */
/**
 * Order is the app's and must not change: greeting -> wallet strip -> pills.
 * The wrapper is a <div>, NOT a <header>: `src/style.css` ships a global
 * `header { display:flex; align-items:center; height:40px; padding:30px }`
 * which squashed this block into a 40px flex box, overflowed ~70px upwards and
 * pushed the greeting under the fixed 74px Navbar (that was the "Hi <name> is
 * missing" defect) while the overflowing wallet strip landed on top of the tab
 * pills (the overlap defect). A <div> is immune to that element rule.
 *
 * SMART HEADER (founder brief, 2026-09-29 — this deliberately diverges from the
 * app, whose `Column[header, Expanded(feed)]` keeps the whole header fixed):
 * the greeting + wallet strip SCROLL AWAY with the feed, and only the All/Live
 * tab row stays pinned so the tabs remain reachable from the bottom of the
 * list. Two consequences for anyone editing this:
 *   1. Both blocks are rendered from this one component as a FRAGMENT (no
 *      wrapper box), so in the DOM they are direct children of `.home-feed` —
 *      the scroll container.
 *   2. That is required, not cosmetic: a sticky element is clamped to its
 *      parent's box, so a sticky tab row nested inside a header wrapper would
 *      unstick the moment the header scrolled past. As a direct child of
 *      `.home-feed` it pins for the whole scroll range.
 */
export function HomeHeader({ firstName, activeTab, onTabChange, liveCount }) {
  return (
    <>
      {/* Scrolls away: greeting -> wallet strip. */}
      <div className={`${HOME_CONTAINER} tw:pt-4 tw:pb-3`}>
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <span className="tw:block tw:min-w-0 tw:truncate tw:text-[18.5px] tw:font-extrabold tw:leading-[1.08] tw:tracking-[-0.01em] tw:text-body">
            Hi <span className="tw:text-accent-deep">{firstName || "there"}</span>
          </span>
          <span aria-hidden="true" className="tw:text-base tw:leading-none">
            👋
          </span>
        </div>

        <WalletStrip />
      </div>

      {/* Pinned: All / Live. `top-0` of the scrollport is below the fixed 74px
          Navbar, because `.home-feed` itself starts under the page's pt-24. */}
      <div className="home-tabbar tw:sticky tw:top-0 tw:z-20 tw:border-b tw:border-hairline tw:bg-paper">
        <div className={`${HOME_CONTAINER} tw:py-2.5`}>
          <div className="tw:flex tw:items-center tw:gap-2">
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
      </div>
    </>
  );
}

/**
 * Heading for the "Suggested Organisers For You" rail. Exported so the DEV
 * preview in ./HomePreview.jsx renders this exact node instead of a copy that
 * can drift.
 *
 * App parity: suggested_organisers_section.dart:35 — the LIVE section's title
 * is the literal 'Suggested Organisers For You' (16/w700, textPrimary, left)
 * and its action is a 'Refresh' TextButton at :64-74 (accent text, w600,
 * rendered because home_revamp_screen.dart:405 always passes `onRetry`).
 *
 * DEFECT FIXED HERE: the heading used to read "Organizers you may know" with a
 * "View all" link. That copy/action pair belongs to `organizers_section.dart`
 * (dead code: `OrganizersSection(` has no call site; its only consumer is
 * `home/screen/organizer_screen.dart`, itself reachable only from
 * `profile.dart`'s ProfileScreen, which nothing constructs). Replaced with the
 * live section's copy + action; /organizers stays reachable from the Navbar
 * (src/pages/pageAssets/Navbar.jsx:359) and the mobile nav (MobileNav.jsx:54).
 */
export function OrganizersRailHeading({ onRefresh }) {
  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:pb-3">
      <span className="tw:text-base tw:font-bold tw:text-body">
        Suggested Organisers For You
      </span>
      <button
        type="button"
        onClick={onRefresh}
        className="tw:shrink-0 tw:cursor-pointer tw:text-sm tw:font-semibold tw:text-accent-deep tw:hover:underline!"
      >
        Refresh
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [showOrganizers, setShowOrganizers] = useState(false);
  // Whether the organisers rail has anything to show (loading or loaded). The
  // rail reports it so its heading disappears when the app's section would.
  const [organisersAvailable, setOrganisersAvailable] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const eventsScrollRef = useRef(null);
  // The rail owns its fetch; the heading (rendered here) owns the app's
  // "Refresh" action, so the rail publishes its re-fetch through this ref.
  const organisersRefreshRef = useRef(null);
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

  // The API ships the name camel-cased (`UserResource`: 'firstName' => …), but
  // the older snake_case payloads still float around in localStorage, so both
  // spellings are read. `username` is the last resort before the "there" copy.
  const firstName =
    (typeof user?.firstName === "string" && user.firstName.trim()) ||
    (typeof user?.first_name === "string" && user.first_name.trim()) ||
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
          {/* The header lives INSIDE the scroll container so the greeting and
              the wallet card scroll away with the feed; only its tab row is
              sticky (see <HomeHeader>). */}
          <div ref={eventsScrollRef} className="home-feed tw-no-scrollbar">
            <HomeHeader
              firstName={firstName}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              liveCount={liveEvents.length}
            />

            <div className={`${HOME_CONTAINER} tw:pt-3 tw:pb-7`}>
              {feed.error && list.length > 0 ? (
                <div className="tw:mb-4">
                  <InlineErrorCard message={errorMessage} onRetry={feed.refresh} />
                </div>
              ) : null}

              <FeedGrid>
                {showSkeletons ? (
                  <>
                    <HeroSkeleton />
                    <HeroSkeleton />
                    <HeroSkeleton />
                  </>
                ) : null}

                {!feed.loading && feed.error && list.length === 0 ? (
                  <div className="tw:col-span-full">
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
                  </div>
                ) : null}

                {!feed.loading && !feed.error && list.length === 0 ? (
                  <div className="tw:col-span-full">
                    <EmptyState
                      icon={emptyState.Icon}
                      title={emptyState.title}
                      body={emptyState.body}
                    />
                  </div>
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
              </FeedGrid>

              {!showSkeletons && !isDone && list.length > 0 ? (
                <div ref={loadMoreRef} className="tw:h-10 tw:w-full" aria-hidden="true" />
              ) : null}

              {showOrganizers && !showSkeletons ? (
                <div className="tw:mt-12">
                  {/* App parity: suggested_organisers_section.dart:35 + :64-74 —
                      title 16/w700 in textPrimary, the "Refresh" action on the
                      right. The heading is hidden when the app would render
                      nothing at all (:40-46), so it waits for the rail to report
                      whether it has content. */}
                  {organisersAvailable ? (
                    <OrganizersRailHeading
                      onRefresh={() => organisersRefreshRef.current?.()}
                    />
                  ) : null}
                  <MobileSingleOrganizers
                    onAvailabilityChange={setOrganisersAvailable}
                    refreshRef={organisersRefreshRef}
                  />
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
