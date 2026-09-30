import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Countdown from "react-countdown";
import SubscriptionBadge from "../../../component/ui/SubscriptionBadge.jsx";
import { SponsorProfileLink } from "./sponsorLink.jsx";
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Flag,
  Share2,
  Star,
  Upload,
  Video,
  Wifi,
} from "lucide-react";

/**
 * App→web parity presentation for the event detail screen.
 *
 * Mirrors the Flutter app screen
 * lib/features/presentation/screens/home/screen/details_screen.dart
 * (the screen home feed cards push into — event_card.dart:198-210,
 * live_event_card.dart:171, home_revamp_screen.dart:2178).
 *
 * Component map (app file:line → this file's section):
 *   _buildHeroSummarySection  details_screen.dart:6279-6453 → <EventHero>
 *   _buildSponsoredTicketSection :1874-1906               → sponsored slot
 *   _buildManualAccessSection    :1913-2041               → manual slot
 *   eventInfo()                  :5802-5917               → META SECTIONS
 *     · Event Schedule  :5823-5828
 *     · Access Window   :5830-5839
 *     · Replay          :5841-5844 (via _buildReplaySection :6455)
 *     · Hosted By       :5845-5871 (avatar :3590-3642, BlueVerifiedTick :5863)
 *     · Countdown       :5873-5899 (CountdownTimer compactClock+seconds)
 *     · About This Event:5901-5914
 *   reportEventSection()         :5712-5800               → report card
 *   _buildReviewsSection()       :3648                    → reviews slot
 *   _buildBottomTicketBar()      :5637-5710                → <EventBottomBar>
 *   state machine                :5265-5628                → bottomBarState()
 *   DetailsAppBar                :7103-7211                → <EventTopBar>
 *   _EventDetailStateScaffold    :6942-6994                → <EventStateScaffold>
 *
 * Pure presentation: every hook, API call and nav target stays in index.jsx.
 * Design deviations from the app are listed in the parity report.
 */

const LABEL = "tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted";
const CARD = "tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised";
const ACTIVE_BTN =
  "tw:bg-[#16909C] tw:text-white tw:hover:bg-[#06707D] tw:cursor-pointer";
const DISABLED_BTN = "tw:bg-[#2F2F2F] tw:text-white tw:cursor-not-allowed";
const INERT_BTN = "tw:bg-[#16909C]/40 tw:text-white tw:cursor-default";
const OUTLINE_BTN =
  "tw:border tw:border-accent tw:bg-paper-raised tw:text-accent-deep tw:hover:bg-accent-soft tw:cursor-pointer";
const BTN_BASE =
  "tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:font-display tw:text-sm tw:font-bold tw:px-3";

/** details_screen.dart:3545-3553 */
export function statusWord(flags) {
  if (flags.isLiveNow) return "Live";
  if (flags.isPaused) return "Paused";
  if (flags.isEnded) return "Ended";
  return "Upcoming";
}

/** CountdownTimer format: compactClock + showSeconds (countdown_timer.dart:47-62) */
function CountdownInline({ target }) {
  if (!target) return <span className="tw:text-sm tw:font-semibold tw:text-body">Countdown unavailable</span>;
  return (
    <Countdown
      date={target}
      renderer={({ days, hours, minutes, seconds, completed }) => {
        if (completed) return <span className="tw:text-sm tw:font-semibold tw:text-body">Countdown finished</span>;
        const pad = (n) => String(n).padStart(2, "0");
        const text = days > 0
          ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        return <span className="tw:text-sm tw:font-bold tw:text-body">{text}</span>;
      }}
    />
  );
}

/** _buildSectionLabel — details_screen.dart:6200-6210 */
function SectionLabel({ children }) {
  return <div className={LABEL}>{children}</div>;
}

/** _buildMetaSection — details_screen.dart:6212-6228 (label + 10px + child, pad 16) */
function MetaSection({ label, children }) {
  return (
    <section className="tw:px-4">
      <SectionLabel>{label}</SectionLabel>
      <div className="tw:mt-2.5">{children}</div>
    </section>
  );
}

/** _buildSummaryPill — details_screen.dart:6241-6277 */
function SummaryPill({ label, value }) {
  return (
    <div className="tw:min-w-0 tw:flex-1 tw:rounded-2xl tw:border tw:border-white/6 tw:bg-white/8 tw:px-3.5 tw:py-3.5">
      <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.2px] tw:text-white/70">
        {label}
      </div>
      <div className="tw:mt-2 tw:line-clamp-2 tw:text-[13px] tw:font-bold tw:text-white">
        {value}
      </div>
    </div>
  );
}

/** _buildBottomTicketBar status pill — details_screen.dart:5677-5700 */
function StatusPill({ status }) {
  const closed = status === "Ticket Sales Closed";
  return (
    <div
      className={
        closed
          ? "tw:inline-flex tw:self-start tw:rounded-full tw:bg-[#111827] tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-bold tw:text-white"
          : "tw:inline-flex tw:self-start tw:rounded-full tw:bg-[#FFF4D9] tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-bold tw:text-[#C58A00]"
      }
    >
      {status}
    </div>
  );
}

/** _buildHeroSummarySection — details_screen.dart:6279-6453 */
function EventHero({ v }) {
  const posters = Array.isArray(v.posters) ? v.posters.filter((p) => p && p.url) : [];
  const [index, setIndex] = useState(0);
  const active = posters[index] || null;

  useEffect(() => {
    if (posters.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % posters.length), 5000);
    return () => clearInterval(id);
  }, [posters.length]);

  return (
    <div className="tw:px-2 tw:pt-1.5">
      <div className="tw:relative tw:h-[210px] tw:w-full tw:overflow-hidden tw:rounded-[24px] tw:bg-ink tw:md:h-[280px]">
        {active?.url ? (
          <img src={active.url} alt={v.event?.title || "Event poster"} className="tw:h-full tw:w-full tw:object-cover" />
        ) : (
          <div className="tw:h-full tw:w-full tw:bg-[linear-gradient(135deg,#1F2328_0%,#111316_100%)]" />
        )}

        {/* scrim so the glass summary stays legible over any poster */}
        <div className="tw:absolute tw:inset-0 tw:bg-[linear-gradient(180deg,rgba(17,19,22,0.06)_0%,rgba(17,19,22,0.20)_42%,rgba(17,19,22,0.74)_100%)]" />

        {v.hasPaid && (
          <div className="tw:absolute tw:right-3 tw:top-3 tw:rounded-full tw:bg-[#4ADE80] tw:px-3 tw:py-1.5 tw:text-[10px] tw:font-bold tw:text-body">
            Ticket purchased
          </div>
        )}

        {posters.length > 1 && (
          <div className="tw:absolute tw:left-0 tw:right-0 tw:top-3 tw:flex tw:justify-center tw:gap-1.5">
            {posters.map((p, i) => (
              <span
                key={p.url || i}
                className={
                  i === index
                    ? "tw:h-1.5 tw:w-4 tw:rounded-full tw:bg-white/90"
                    : "tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-white/45"
                }
              />
            ))}
          </div>
        )}

        <div className="tw:absolute tw:bottom-3 tw:left-1.5 tw:right-1.5">
          <div className="tw:rounded-[22px] tw:border tw:border-white/30 tw:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] tw:p-3.5 tw:backdrop-blur-[10px]">
            <div className="tw:line-clamp-2 tw:font-display tw:text-[22px] tw:font-bold tw:leading-tight tw:text-white">
              {v.event?.title || ""}
            </div>
            <div className="tw:mt-2.5 tw:flex tw:gap-3">
              <SummaryPill label="Date & Time" value={v.formattedDateTime || "Date unavailable"} />
              <SummaryPill label="Ticket Price" value={v.priceDisplay} />
            </div>
            <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-2.5">
              <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#22C55E] tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-white">
                <Wifi className="tw:h-3 tw:w-3 tw:text-white" />
                {v.statusLabel}
              </span>
              {v.formattedLocation && (
                <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[11px] tw:font-semibold tw:text-white/85">
                  {v.formattedLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** DetailsAppBar — details_screen.dart:7103-7211 */
function EventTopBar({ v }) {
  return (
    <header className="tw:static tw:z-30 tw:border-b tw:border-hairline tw:bg-paper-raised tw:md:sticky tw:md:top-20">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:items-center tw:gap-1.5 tw:px-2 tw:py-2">
        <button
          type="button"
          onClick={v.onBack}
          aria-label="Go back"
          className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border-0 tw:bg-transparent"
        >
          <ChevronLeft className="tw:h-5 tw:w-5 tw:text-body" />
        </button>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1.2px] tw:text-muted">
            Event Detail
          </div>
          <div className="tw:mt-0.5 tw:truncate tw:font-display tw:text-[16px] tw:font-bold tw:text-body">
            {v.event?.title || ""}
          </div>
        </div>
        <button
          type="button"
          onClick={v.onShare}
          aria-label="Share event"
          className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border-0 tw:bg-transparent"
        >
          <Share2 className="tw:h-5 tw:w-5 tw:text-body" />
        </button>
      </div>
    </header>
  );
}

/** _EventDetailStateScaffold — details_screen.dart:6942-6994 */
export function EventStateScaffold({ title = "Event details", message, isOffline, onRetry }) {
  return (
    <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pt-20 tw:font-sans">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:flex-col tw:items-center tw:justify-center tw:px-5 tw:py-24">
        <Clock className="tw:h-12 tw:w-12 tw:text-muted" />
        <div className="tw:mt-3 tw:text-center tw:text-sm tw:font-semibold tw:text-muted">{message}</div>
        <button
          type="button"
          onClick={onRetry}
          className="tw:mt-4 tw:flex tw:h-12 tw:w-[180px] tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-lg tw:border-0 tw:bg-[#16909C] tw:font-display tw:text-sm tw:font-bold tw:text-white tw:hover:bg-[#06707D]"
        >
          {isOffline ? "Try again" : "Retry"}
        </button>
      </div>
    </div>
  );
}

/**
 * Bottom bar state machine — details_screen.dart:5265-5628.
 * Returns null when the app renders no bar at all (:5520-5522).
 */
export function bottomBarState(v) {
  const {
    isOwnerEvent, isEnded, isSoldOut, hasPaid, manualHasAccess, isLiveNow,
    startingStream, canBuyManualOnly, canOpenPurchaseOptions, canSponsorOwnEvent,
    viewerHasSponsoredTickets, shouldChoosePurchaseType, primaryCtaLabel,
    replayIsAvailable, replayUrl, replayExpired, hasReplay, replayEnabled,
    canWatchVod, onPrimaryAction, onOpenPurchaseOptions, onGetTicket, onWatchVod,
    onOwnerStreamAction,
  } = v;
  const word = statusWord(v);

  // :5298-5327 — host, event not ended
  if (isOwnerEvent && !isEnded) {
    return {
      statusLabel: "You are hosting this event",
      action: {
        label: startingStream ? "Starting stream..." : v.ownerStreamLabel,
        tone: "active",
        onClick: onOwnerStreamAction,
        disabled: !!startingStream,
      },
      secondary: v.canSponsorOwnEvent
        ? { label: "Buy for others", onClick: onOpenPurchaseOptions }
        : null,
    };
  }

  // :5329-5480 — ended: replay affordances
  if (isEnded) {
    const replayWatchable = hasPaid || canWatchVod;
    if (replayIsAvailable && replayUrl) {
      if (replayWatchable) {
        return {
          statusLabel: "Replay available",
          action: { label: "Watch Replay", tone: "active", onClick: onWatchVod },
        };
      }
      return {
        statusLabel: "Buy ticket to unlock replay",
        action: { label: "Buy Ticket To Watch Replay", tone: "active", onClick: onPrimaryAction },
      };
    }
    if (replayEnabled && hasReplay) {
      return {
        statusLabel: "Replay scheduled",
        action: { label: "Replay Coming Soon", tone: "disabled" },
      };
    }
    if (replayExpired) {
      return {
        statusLabel: "Replay expired",
        action: { label: "Replay Expired", tone: "disabled" },
      };
    }
    return { statusLabel: word, action: { label: "Event Ended", tone: "disabled" } };
  }

  // :5482-5498
  if (isSoldOut) {
    return { statusLabel: word, action: { label: "Sold Out", tone: "disabled" } };
  }

  // :5520-5522 — manual access already owned, nothing to sell
  if (manualHasAccess && !hasPaid) return null;

  // :5524-5540
  if (hasPaid && isLiveNow) {
    return {
      statusLabel: "Live",
      action: { label: "Join Live Stream", tone: "active", onClick: onPrimaryAction },
    };
  }

  // :5542-5565
  if (hasPaid && canSponsorOwnEvent) {
    return {
      statusLabel: "Ticket access confirmed",
      action: { label: "Buy for Others", tone: "active", onClick: onOpenPurchaseOptions },
    };
  }

  // :5567-5582 — access confirmed, button is inert in the app
  if (hasPaid) {
    return {
      statusLabel: "Ticket access confirmed",
      action: { label: canBuyManualOnly ? primaryCtaLabel : "Ticket Access Confirmed", tone: "inert", onClick: onPrimaryAction },
      secondary: canBuyManualOnly ? null : null,
    };
  }

  // :5584-5600
  if (!canOpenPurchaseOptions && !canBuyManualOnly && !viewerHasSponsoredTickets) {
    return { statusLabel: word, action: { label: "Purchase Unavailable", tone: "disabled" } };
  }

  // :5602-5624
  return {
    statusLabel: word,
    action: {
      label: shouldChoosePurchaseType ? "Choose Purchase" : primaryCtaLabel,
      tone: "active",
      onClick: viewerHasSponsoredTickets && onOpenPurchaseOptions ? onOpenPurchaseOptions : onGetTicket,
    },
    secondary: v.canOpenPurchaseOptions && shouldChoosePurchaseType && onOpenPurchaseOptions
      ? { label: "Choose purchase options", onClick: onOpenPurchaseOptions }
      : null,
  };
}

function ActionButton({ action }) {
  const cls =
    action.tone === "disabled"
      ? DISABLED_BTN
      : action.tone === "inert"
        ? INERT_BTN
        : ACTIVE_BTN;
  return (
    <button
      type="button"
      disabled={action.tone === "disabled" || action.disabled}
      onClick={action.tone === "inert" ? undefined : action.onClick}
      className={`${BTN_BASE} ${cls}`}
    >
      {action.label}
    </button>
  );
}

/** _buildBottomTicketBar — details_screen.dart:5637-5710 */
function EventBottomBar({ v }) {
  const bar = bottomBarState(v);
  if (!bar) return null;
  return (
    <div className="tw:fixed tw:inset-x-0 tw:bottom-[56px] tw:z-40 tw:px-3 tw:pb-3 tw:md:bottom-0">
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:md:max-w-[1040px] tw:md:px-6">
        <div className="tw:flex tw:items-stretch tw:gap-3 tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-2.5 tw:shadow-[0_10px_30px_rgba(17,19,22,0.12)]">
          <div className="tw:flex tw:w-[44%] tw:flex-col tw:justify-center tw:gap-1.5 tw:px-1">
            <SectionLabel>Ticket Access</SectionLabel>
            <div className="tw:font-display tw:text-lg tw:font-extrabold tw:text-body">
              {v.priceDisplay}
            </div>
            <StatusPill status={bar.statusLabel} />
          </div>
          <div className="tw:flex tw:flex-1 tw:flex-col tw:justify-center tw:gap-2">
            <ActionButton action={bar.action} />
            {bar.secondary && (
              <button
                type="button"
                onClick={bar.secondary.onClick}
                className="tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-accent tw:bg-paper-raised tw:px-3 tw:text-[12px] tw:font-bold tw:text-accent-deep tw:hover:bg-accent-soft"
              >
                {bar.secondary.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailView({ v }) {
  const event = v.event || {};
  const replayBlock = v.replayNode; // built in index.jsx (player + owner management)
  const vodBlock = v.vodNode;
  const sponsoredNode = v.sponsoredNode;
  const manualNode = v.manualNode;
  const reviewsNode = v.reviewsNode;

  return (
    <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-[180px] tw:pt-20 tw:font-sans tw:text-body tw:md:pb-[150px]">
      <EventTopBar v={v} />

      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:pb-8 tw:md:max-w-[1040px] tw:md:px-6">
        {/* details_screen.dart:4975 */}
        <EventHero v={v} />

        {/* DESKTOP DISTRIBUTION (founder, 2026-09-30): the page was one
            560px column, so a desktop screen wasted ~880px of width and the
            content ran long enough to need scrolling. From md up the sections
            flow into two balanced columns (newspaper order: top-to-bottom,
            then the next column) so the whole event fits one page. CSS
            multicol is used ON PURPOSE instead of a main+sidebar grid: it
            preserves DOM order exactly, so the app-parity section order
            (hero, sponsored, manual, vod, schedule, access, replay, hosted,
            countdown, about, report, reviews) is untouched on phones, where
            the columns collapse back to a single one. */}
        <div className="tw:md:columns-2 tw:md:gap-x-8">

        {/* details_screen.dart:4977-4978 */}
        <div className="tw:break-inside-avoid">{sponsoredNode}</div>
        <div className="tw:break-inside-avoid">{manualNode}</div>
        <div className="tw:break-inside-avoid">{vodBlock}</div>

        {/* details_screen.dart:4980 eventInfo() — 22px between meta sections */}
        <div className="tw:mt-5">
          {/* Event Schedule :5823-5828 */}
          <MetaSection label="Event Schedule">
            <div className="tw:text-sm tw:font-semibold tw:text-body">
              {v.formattedDateTime || "Date unavailable"}
            </div>
          </MetaSection>

          {/* Access Window :5830-5839 — green when unlocked */}
          <div className="tw:break-inside-avoid tw:mt-[22px]">
            <MetaSection label="Access Window">
              <div
                className={
                  v.hasPaid || v.manualHasAccess
                    ? "tw:text-sm tw:font-semibold tw:text-[#22C55E]"
                    : "tw:text-sm tw:font-semibold tw:text-body"
                }
              >
                {v.accessLabel}
              </div>
            </MetaSection>
          </div>

          {/* Replay :5841-5844 */}
          {replayBlock ? <div className="tw:break-inside-avoid tw:mt-[22px]">{replayBlock}</div> : null}

          {/* Hosted By :5845-5871 */}
          <div className="tw:break-inside-avoid tw:mt-[22px]">
            <MetaSection label="Hosted By">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Link
                  to={v.profileHref}
                  className="tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-hairline tw:bg-paper-raised"
                  style={{ color: "inherit" }}
                >
                  {v.hostHasImage ? (
                    <img src={event.hostImage} alt={v.hostName} className="tw:h-full tw:w-full tw:object-cover" />
                  ) : (
                    <span className="tw:text-[10px] tw:font-bold tw:text-muted">{v.hostInitials}</span>
                  )}
                </Link>
                <Link
                  to={v.profileHref}
                  className="tw:flex tw:min-w-0 tw:items-center tw:gap-0.5"
                  style={{ color: "inherit" }}
                >
                  <span className="tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold tw:text-body">
                    {v.hostName}
                  </span>
                  {v.hostHasActiveSubscription && <SubscriptionBadge className="tw:size-3" />}
                </Link>
              </div>

              {v.hostAbout && (
                <div className="tw:mt-3 tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted">
                  {v.hostAbout}
                </div>
              )}

              <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row">
                <button
                  type="button"
                  onClick={v.onToggleFollow}
                  disabled={v.followLoading || !event.hostId}
                  className={`tw:flex tw:h-11 tw:flex-1 tw:items-center tw:justify-center tw:rounded-xl tw:text-[13px] tw:font-bold ${
                    v.followLoading
                      ? "tw:cursor-not-allowed tw:border tw:border-hairline tw:bg-paper-raised tw:text-muted"
                      : v.isFollowing
                        ? "tw:cursor-pointer tw:border tw:border-accent tw:bg-paper-raised tw:text-accent-deep"
                        : "tw:cursor-pointer tw:border tw:border-transparent tw:bg-ink tw:text-white"
                  }`}
                >
                  {v.followLoading ? "Updating..." : v.isFollowing ? "Following" : "Follow Organizer"}
                </button>
                <Link
                  to={v.profileHref}
                  className="tw:flex tw:h-11 tw:flex-1 tw:items-center tw:justify-center tw:rounded-xl tw:bg-[#16909C] tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-[#06707D]"
                  style={{ color: "#FFFFFF" }}
                >
                  View Profile
                </Link>
              </div>

              {v.isSaved && (
                <div className="tw:mt-3 tw:inline-flex tw:items-center tw:rounded-full tw:bg-accent-soft tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-bold tw:text-accent-deep">
                  Saved
                </div>
              )}

              {v.canSponsorOwnEvent && !v.isEnded && !v.isVodEvent && (
                <div className="tw:mt-3 tw:text-[12px] tw:leading-[1.6] tw:text-muted">
                  Open the stream control page to manage OBS credentials, go live, pause, resume, or end this event.
                </div>
              )}
            </MetaSection>
          </div>

          {/* Countdown :5873-5899 */}
          <div className="tw:break-inside-avoid tw:mt-[22px]">
            <MetaSection label="Countdown">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Clock className="tw:h-4 tw:w-4 tw:text-body" />
                <CountdownInline target={v.countdownTarget} />
              </div>
            </MetaSection>
          </div>

          {/* About This Event :5901-5914 */}
          <div className="tw:break-inside-avoid tw:mt-[22px]">
            <MetaSection label="About This Event">
              <div className="tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted">
                {v.description}
              </div>
            </MetaSection>
          </div>
        </div>

        {/* details_screen.dart:4983 reportEventSection() */}
        <div className="tw:break-inside-avoid tw:mt-[18px] tw:px-4">
          <div
            role="button"
            tabIndex={0}
            onClick={v.onReport}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") v.onReport?.();
            }}
            className="tw:cursor-pointer tw:rounded-2xl tw:bg-[#FFF1F2] tw:p-3.5"
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <Flag className="tw:h-4 tw:w-4 tw:text-[#DC2626]" />
              <span className="tw:text-[13px] tw:font-bold tw:text-[#DC2626]">
                Need to flag this event?
              </span>
            </div>
            <div className="tw:mt-2 tw:text-[12px] tw:leading-[1.5] tw:font-medium tw:text-[#7F1D1D]">
              Report suspicious or inappropriate listings and our team will review them.
            </div>
            <div className="tw:mt-2 tw:text-[12px] tw:font-bold tw:text-[#DC2626]">Report this event</div>
          </div>
        </div>

        {/* details_screen.dart:4987 _buildReviewsSection() */}
        <div className="tw:break-inside-avoid tw:mt-[22px] tw:px-4">
          <SectionLabel>Reviews</SectionLabel>
          <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <Star className="tw:h-4 tw:w-4 tw:fill-amber-400 tw:text-amber-400" />
              <span className="tw:text-sm tw:font-bold tw:text-body">
                {v.reviewCount > 0 ? `${v.reviewAverage.toFixed(1)} / 5` : "No reviews yet"}
              </span>
            </div>
            <div className="tw:text-[12px] tw:text-muted">
              {v.reviewCount > 0
                ? `${v.reviewCount} attendee review${v.reviewCount === 1 ? "" : "s"}`
                : "Be the first attendee to share feedback."}
            </div>
          </div>
          <div className="tw:mt-3">{reviewsNode}</div>
        </div>
        </div>
      </div>

      <EventBottomBar v={v} />
    </div>
  );
}
