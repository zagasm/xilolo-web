// src/component/Profile/ProfileHeader.jsx
//
// Web mirror of the app's profile top stack. THREE app designs, one per shape of
// profile the web page can show (`variant` prop).
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   OWN PROFILE  lib/features/presentation/screens/profile/screens/
//                user_and_organizer_profile_screen/user_main_profile_screen_revamp.dart
//                  live stack order (header -> followers/following -> about ->
//                  ranking), gutters 10:                        :332-346
//                  header card: r24, Row = avatar + Column(name 21/w700,
//                  verify accent 18, role pill, hairline divider, 2 hero
//                  metrics split by a 1px rule), padding 16/18 — and the
//                  COMPACT branch at card width < 360: avatar 72, name 19,
//                  padding 14/16, divider 12, metric icon 16/value 15/label 10 :349-466
//                  avatar ring: 84, card fill, hairline border, ring padding 5
//                  (4 when <= 80), initials accent on accentSoft at .28*size :468-531
//                  role pill: accent@11%, r999, 12/w500, 'Organizer'/'User',
//                  isOrganiser = isOrganiserVerified || isOrganiser    :578-598
//                  hero metric: icon 18, value 16/w700, label 11/w500 muted,
//                  ticket icon accent / calendar icon textPrimary, gap 2      :600-654
//                  followers/following 2-up stat cards: minH 90, r20, p13,
//                  42 circle accent@9% + icon textPrimary, 30 circle arrow
//                  accent, title 12.5/w500, value 24/w700                     :657-762
//                  K/M count rule, '.0' stripped                              :764-774
//                  ranking card: ink gradient #111318 -> #05070A, r24, p15/17,
//                  globe watermark 96 at left -24/top 24 white@4.5%, 34x34 r12
//                  globe chip top16/right16, gold cup trophy art 74x88
//                  (#FFD27A on a #141820 pill) + sparkles, 'Organizer Ranking'
//                  16/w700 white, rank 36/w700 white + laurel sprig 23,
//                  'You are among the top organizers this month.' 13 white70,
//                  48 white r16 'View Leaderboard' + right arrow           :900-1054
//                  rank label is '#n', or an em dash when rank is null/0 :903
//   OTHER USER   lib/.../profile/screens/organizer_profile.dart
//                  header card row: padding 12/14, avatar 84 r24 with a
//                  4px card-coloured border (clip r20), name 18/w700 +
//                  BlueVerifiedTick 16, '@username' 13 accent, tickets row
//                  (confirmation-number icon, Flutter green, 13/w500) and
//                  events row (event-available icon, accent, 13/w500)  :299-472
//                  followers card: single, r20, padding 14/16, label 13/w500
//                  muted, count 22/w700, arrow_outward 18 muted         :513-555
//                  ranking card: LIGHT card r24, padding 20/16, centered
//                  "Organizer's Ranking" 16/w600, globe 24 + rank 14/w600,
//                  accent r16 'View Top Organizers' (white label)       :617-678
//
// DELIBERATE DIVERGENCES (stated, not drift):
//  * App cards carry a 4%-black blur-18 shadow; DESIGN.md is flat + hairline
//    outside real overlays, so no shadow here (incl. the avatar ring's).
//  * App paints accent-coloured TEXT with the raw accent; on light surfaces the
//    token contract is accent-deep for text (src/styles/tailwind.css:16-19), so
//    text uses accent-deep while fills/rings/ticks keep #16909C.
//  * `Iconsax.arrow_right_3` (stat-card arrow + leaderboard CTA) has no lucide
//    twin: ArrowUpRight is used for both, matching the diagonal-arrow reading of
//    the app icon.
//  * `Iconsax.global`/`Iconsax.cup` -> lucide Globe/Trophy; `Icons.verified`
//    (widgets/blue_verified_tick.dart) -> BadgeCheck in the accent.
//  * The app's laurel sprig is a CustomPainter of five green leaves
//    (_LaurelPainter :3091-3162); a green lucide Leaf stands in for it.
//  * Card copy that embeds the count ("Tickets Sold (12)", "Events (3)") is the
//    app's own interpolated string (l10n) and is kept verbatim in the
//    organiser variant; the own-profile hero metrics strip the count, exactly as
//    the app's _labelWithoutCount does (:574-576).
//
// Colour/rules applied here come from src/styles/tailwind.css tokens; no hexes
// other than the ones the app itself hard-codes (ink gradient, gold trophy,
// trophy plinth, leaderboard label).
// Legacy cascade note (src/styles/tailwind.css:95-97): `#root p { color: inherit }`
// greys any <p>, so every coloured string in this file is a <div> or <span>.
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Globe,
  Leaf,
  Sparkles,
  Ticket,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

/** app: _formatCount (revamp:764-774) — 1.5K / 2.1M, '.0' stripped. */
export function formatCount(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000000) {
    const v = (n / 1000000).toFixed(1);
    return v.endsWith(".0") ? `${v.slice(0, -2)}M` : `${v}M`;
  }
  if (n >= 1000) {
    const v = (n / 1000).toFixed(1);
    return v.endsWith(".0") ? `${v.slice(0, -2)}K` : `${v}K`;
  }
  return String(n);
}

const nonEmpty = (v) => {
  const s = String(v ?? "").trim();
  return s || null;
};

/** app: _displayName + _titleCaseName (revamp:542-572). */
export function profileDisplayName(user) {
  const explicit = nonEmpty(user?.name);
  if (explicit) return titleCase(explicit);
  const organiser =
    typeof user?.organiser === "string"
      ? user.organiser
      : user?.organiser?.organiser || user?.organiser?.name;
  if (nonEmpty(organiser)) return titleCase(String(organiser).trim());
  const full = [user?.firstName, user?.lastName]
    .filter((p) => nonEmpty(p))
    .join(" ")
    .trim();
  if (full) return titleCase(full);
  return titleCase(nonEmpty(user?.userName || user?.user_name) || "User");
}

function titleCase(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`)
    .join(" ");
}

/** app: _getInitials (revamp:533-540) — first + last initial, else 'U'. */
export function profileInitials(user) {
  const first = String(user?.firstName ?? "").trim();
  const last = String(user?.lastName ?? "").trim();
  if (!first && !last) {
    // fall back to the display name so a linked organiser still gets letters
    const parts = profileDisplayName(user).split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  if (!last) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/** app: User.resolvedProfileImageUrl. */
export function profileAvatarUrl(user) {
  const raw =
    user?.profileImage ||
    user?.profile_image ||
    user?.profileUrl ||
    user?.profile_url ||
    user?.organiser?.profileImage ||
    null;
  return nonEmpty(raw);
}

/** app: hasActiveSubscription (revamp:394) / organiser.hasActiveSubscription. */
export function profileHasSubscription(user) {
  return Boolean(
    user?.subscription?.isActive ||
      user?.subscription?.is_active ||
      user?.has_active_subscription ||
      user?.hasActiveSubscription ||
      user?.organiser?.has_active_subscription,
  );
}

/**
 * app: `isOrganizer = user.isOrganiserVerified == true || user.isOrganiser`
 * (revamp:580) for the role pill; an `organiser` object/name also counts, which
 * is what the /api/v1/profile payload exposes for an actual organiser.
 * NOT `user.userId` — every account has an id, which made the pill read
 * "Organizer" for plain users.
 */
export function profileIsOrganiser(user) {
  return Boolean(
    user?.is_organiser_verified ||
      user?.isOrganiserVerified ||
      user?.isOrganiser ||
      user?.is_organiser ||
      user?.organiser,
  );
}

export function profileUsername(user) {
  return nonEmpty(user?.userName || user?.user_name);
}

/** app: _resolveTicketsSold (organizer_profile.dart:494-510). */
export function profileTicketsSold(user) {
  const candidates = [
    user?.ticketsSold,
    user?.tickets_sold,
    user?.tickets_total,
    user?.ticketsTotal,
    user?.successfulPayments,
    user?.successful_payments,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // last resort the app uses: sum the per-event payment count
  const events = Array.isArray(user?.allEvents) ? user.allEvents : [];
  const sum = events.reduce((total, e) => {
    const n = Number(e?.paymentCount ?? e?.payment_count ?? 0);
    return Number.isFinite(n) ? total + n : total;
  }, 0);
  return sum > 0 ? sum : 0;
}

/** app: _resolveEventCount (organizer_profile.dart:482-492). */
export function profileEventsCount(user) {
  const candidates = [
    user?.eventsCount,
    user?.events_count,
    user?.totalEventsCreated,
    user?.total_events_created,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const buckets = user?.events || {};
  const all = buckets?.all ?? user?.allEvents ?? user?.all_events;
  return Array.isArray(all) ? all.length : 0;
}

function pickRank(user) {
  const source = user?.organiser ?? user;
  const raw =
    source?.rank ??
    source?.rank_global ??
    source?.ranking ??
    user?.rank ??
    user?.rank_global ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** app: hero metric labels are l10n strings with the count stripped
 *  (_labelWithoutCount :574-576) -> "Tickets Sold" / "Ticket Sold" / "Events". */
function heroLabels(tickets, events) {
  return {
    tickets: tickets === 1 ? "Ticket Sold" : "Tickets Sold",
    events: events === 1 ? "Event" : "Events",
  };
}

/** app: _buildHeroMetric (revamp:600-654). */
function HeroMetric({ icon: Icon, value, label, iconClass }) {
  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:max-[391px]:gap-1.5">
      <Icon
        className={`tw:shrink-0 tw:size-[18px] tw:max-[391px]:size-4 ${iconClass}`}
      />
      <div className="tw:min-w-0">
        <div className="tw:text-[16px] tw:max-[391px]:text-[15px] tw:font-bold! tw:leading-none tw:text-body">
          {value}
        </div>
        <div className="tw:mt-[3px] tw:truncate tw:text-[11px] tw:max-[391px]:text-[10px] tw:font-medium tw:leading-[1.1] tw:text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

/** app: _buildStatCard (revamp:689-762) — own profile, 2-up. */
function StatCard({ icon: Icon, title, value, onClick }) {
  const inner = (
    <>
      <div className="tw:flex tw:items-center">
        <span className="tw:flex tw:size-[42px] tw:items-center tw:justify-center tw:rounded-full tw:bg-accent-soft tw:text-body">
          <Icon className="tw:size-[21px]" />
        </span>
        <span className="tw:ml-auto tw:flex tw:size-[30px] tw:items-center tw:justify-center tw:rounded-full tw:bg-accent-soft tw:text-accent">
          <ArrowUpRight className="tw:size-4" />
        </span>
      </div>
      <div className="tw:mt-3 tw:text-[12.5px] tw:font-medium tw:leading-[1.1] tw:text-body">
        {title}
      </div>
      <div className="tw:mt-[5px] tw:text-[24px] tw:font-bold! tw:leading-none tw:text-body">
        {value}
      </div>
    </>
  );

  const shell =
    "tw:flex tw:min-h-[90px] tw:w-full tw:flex-col tw:items-stretch tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[13px] tw:text-left";

  if (!onClick) {
    return <div className={shell}>{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} tw:transition-colors tw:hover:bg-chip`}
    >
      {inner}
    </button>
  );
}

/** app: _buildFollowersCard (organizer_profile.dart:513-555) — other profile,
 *  single card, arrow_outward, no follow-through (the app's onTap is an empty
 *  TODO) so this stays a div. */
function FollowersCard({ count }) {
  return (
    <div className="tw:flex tw:items-center tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-[14px] tw:py-4">
      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:text-[13px] tw:font-medium tw:text-muted">
          Followers
        </div>
        <div className="tw:mt-1 tw:text-[22px] tw:font-bold! tw:leading-none tw:text-body">
          {formatCount(count)}
        </div>
      </div>
      <ArrowUpRight className="tw:size-[18px] tw:shrink-0 tw:text-muted" />
    </div>
  );
}

/**
 * Ranking card. Two real app designs:
 *   own profile  -> ink gradient "Organizer Ranking" + white "View Leaderboard"
 *                   (user_main_profile_screen_revamp.dart:900-1054); only
 *                   rendered when the profile carries an organiser object
 *                   (`if (organiser != null)` :343)
 *   other        -> light card "Organizer's Ranking" + accent "View Top
 *                   Organizers" (organizer_profile.dart:617-678); rendered
 *                   unconditionally on the organiser profile (:292)
 * Both use an em dash when the rank is null/0 (:903 / :619).
 */
export function ProfileRanking({ user, variant = "own" }) {
  if (variant === "own") {
    if (!user?.organiser) return null;
  } else if (variant !== "organiser") {
    return null;
  }
  const rankValue = pickRank(user);
  const rankLabel = rankValue ? `#${rankValue}` : "—";

  if (variant !== "own") {
    /* organizer_profile.dart:617-678 — light card, centered, accent CTA */
    return (
      <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-5 tw:py-4 tw:text-center">
        <div className="tw:text-[16px] tw:font-semibold! tw:text-body">
          Organizer&apos;s Ranking
        </div>
        <div className="tw:mt-3 tw:flex tw:items-center tw:justify-center tw:gap-1">
          <Globe className="tw:size-6 tw:text-body" />
          <span className="tw:text-[14px] tw:font-semibold tw:text-body">
            {rankLabel}
          </span>
        </div>
        <Link
          to="/organizers"
          className="tw:mt-4 tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-[16px] tw:bg-accent tw:text-[14px] tw:font-semibold! tw:text-white"
        >
          View Top Organizers
        </Link>
      </div>
    );
  }

  /* user_main_profile_screen_revamp.dart:900-1054 — ink gradient */
  return (
    <div
      className="tw:relative tw:overflow-hidden tw:rounded-[24px] tw:px-[15px] tw:py-[17px]"
      style={{
        backgroundImage: "linear-gradient(135deg, #111318 0%, #05070A 100%)",
      }}
    >
      {/* globe watermark, left -24 / top 24, white@4.5% */}
      <Globe
        className="tw:pointer-events-none tw:absolute tw:size-24 tw:text-white/5"
        style={{ left: -24, top: 24 }}
        strokeWidth={1.2}
      />
      {/* 34x34 r12 globe chip, top 16 / right 16 */}
      <span className="tw:absolute tw:right-4 tw:top-4 tw:flex tw:size-[34px] tw:items-center tw:justify-center tw:rounded-[12px] tw:border tw:border-white/10 tw:bg-white/10">
        <Globe className="tw:size-[18px] tw:text-white" />
      </span>

      <div className="tw:relative tw:flex tw:items-center tw:gap-[14px]">
        {/* app: _RankingTrophyArt (:3009-3075) — 74x88, gold cup on a plinth */}
        <span className="tw:relative tw:flex tw:h-[88px] tw:w-[74px] tw:shrink-0 tw:items-end tw:justify-center">
          <span className="tw:absolute tw:bottom-0 tw:h-4 tw:w-[60px] tw:rounded-full tw:bg-[#141820]" />
          <Trophy
            className="tw:relative tw:mb-[10px] tw:size-[66px] tw:text-[#FFD27A]"
            strokeWidth={1.4}
          />
          <Sparkles className="tw:absolute tw:left-2 tw:top-1.5 tw:size-3 tw:text-[#FFE6A7]" />
          <Sparkles className="tw:absolute tw:left-6 tw:top-[22px] tw:size-[7px] tw:text-[#FFE6A7]" />
        </span>

        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[16px] tw:font-bold! tw:text-white">
            Organizer Ranking
          </div>
          <div className="tw:mt-[10px] tw:flex tw:items-end tw:gap-[10px]">
            <span className="tw:text-[36px] tw:font-bold! tw:leading-[0.95] tw:text-white">
              {rankLabel}
            </span>
            {/* app: _LaurelSprig(size: 23) — green custom-painted sprig */}
            <Leaf
              className="tw:mb-1 tw:size-[23px] tw:shrink-0 tw:text-[#74B95B]"
              strokeWidth={2.4}
            />
          </div>
          <div className="tw:mt-2 tw:text-[13px] tw:leading-[1.3] tw:text-white/70">
            You are among the top organizers this month.
          </div>
        </div>
      </div>

      <Link
        to="/organizers"
        className="tw:relative tw:mt-4 tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-[9px] tw:rounded-[16px] tw:bg-white tw:text-[13.5px] tw:font-bold! tw:text-[#080A0E]"
      >
        <Trophy className="tw:size-[19px] tw:shrink-0" />
        View Leaderboard
        <ArrowUpRight className="tw:absolute tw:right-[15px] tw:size-5 tw:shrink-0" />
      </Link>
    </div>
  );
}

/**
 * variant: "own"       -> revamp header card + role pill + 2-up stat cards
 *          "organiser" -> organizer_profile header card + single followers card
 *          "user"      -> shared card for a plain user reached by share link
 *                         (the app's 200px accent-soft banner + tabs on
 *                         user_profile_screen.dart:138-171 is NOT mirrored — see
 *                         the report; this reuses the same card + follow CTA)
 */
export default function ProfileHeader({
  user,
  isOwnProfile = true,
  variant,
  isFollowing = false,
  followLoading = false,
  onToggleFollow,
}) {
  const mode = variant || (isOwnProfile ? "own" : "organiser");
  const displayName = profileDisplayName(user);
  const username = profileUsername(user);
  const avatarUrl = profileAvatarUrl(user);
  const isOrganiser = profileIsOrganiser(user);
  const hasSubscription = profileHasSubscription(user);
  const followers = Number(
    user?.numberOfFollowers ?? user?.followers_count ?? user?.followersCount ?? 0,
  );
  const following = Number(
    user?.followings_count ?? user?.followingsCount ?? 0,
  );
  const showFollow = mode !== "own" && typeof onToggleFollow === "function";
  const navigate = useNavigate();

  const ticketsSold = profileTicketsSold(user);
  const eventsCount = profileEventsCount(user);
  const labels = heroLabels(ticketsSold, eventsCount);

  /* ── OTHER-USER header card: organizer_profile.dart:299-472 ─────────────── */
  if (mode === "organiser") {
    return (
      <div className="tw:space-y-[12px]">
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-[14px]">
          <span className="tw:flex tw:size-[84px] tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-[24px] tw:border-4 tw:border-paper-raised tw:bg-inner">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="tw:size-full tw:rounded-[20px] tw:object-cover"
                loading="lazy"
              />
            ) : (
              <span
                className="tw:flex tw:size-full tw:items-center tw:justify-center tw:rounded-[20px] tw:text-[22px] tw:font-bold tw:text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #16909C 0%, rgba(22,144,156,0.7) 100%)",
                }}
              >
                {profileInitials(user)}
              </span>
            )}
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-0.5">
              <span className="tw:truncate tw:text-[18px] tw:font-bold! tw:leading-none tw:text-body">
                {displayName}
              </span>
              {hasSubscription && (
                <BadgeCheck className="tw:size-4 tw:shrink-0 tw:text-accent" />
              )}
            </div>

            {username && (
              <div className="tw:mt-0.5 tw:truncate tw:text-[13px] tw:text-accent-deep">
                @{username}
              </div>
            )}

            {/* tickets row — app copies l10n with the count inside the string */}
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
              <Ticket className="tw:size-[18px] tw:shrink-0 tw:text-success" />
              <span className="tw:truncate tw:text-[13px] tw:font-medium tw:text-body">
                {`${
                  ticketsSold === 1 ? "Ticket Sold" : "Tickets Sold"
                } (${ticketsSold})`}
              </span>
            </div>

            {/* events row */}
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
              <CalendarDays className="tw:size-[18px] tw:shrink-0 tw:text-accent" />
              <span className="tw:truncate tw:text-[13px] tw:font-medium tw:text-body">
                {eventsCount === 1
                  ? `Event (${eventsCount})`
                  : `Events (${eventsCount})`}
              </span>
            </div>
          </div>
        </div>

        {showFollow && (
          <button
            type="button"
            disabled={followLoading}
            onClick={onToggleFollow}
            className="tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-full tw:bg-accent tw:text-[13px] tw:font-medium tw:text-white tw:disabled:opacity-60"
          >
            {followLoading
              ? "Please wait..."
              : isFollowing
                ? "Unfollow"
                : "Follow Organizer"}
          </button>
        )}

        <FollowersCard count={followers} />
      </div>
    );
  }

  /* ── OWN header card: revamp:349-466 (compact < 360px card) ─────────────── */
  return (
    <div className="tw:space-y-[10px]">
      <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-4 tw:py-[18px] tw:max-[391px]:px-[14px] tw:max-[391px]:py-4">
        <div className="tw:flex tw:items-center tw:gap-4 tw:max-[391px]:gap-3">
          {/* avatar ring: card fill + hairline, ring padding 5 (4 when <=80) */}
          <span className="tw:flex tw:size-[84px] tw:max-[391px]:size-[72px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline tw:bg-paper-raised tw:p-[5px] tw:max-[391px]:p-1">
            <span className="tw:flex tw:size-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-accent-soft">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="tw:size-full tw:object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="tw:text-[23.5px] tw:max-[391px]:text-[20px] tw:font-bold tw:text-accent-deep">
                  {profileInitials(user)}
                </span>
              )}
            </span>
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:truncate tw:text-[21px] tw:max-[391px]:text-[19px] tw:font-bold! tw:leading-none tw:text-body">
                {displayName}
              </span>
              {hasSubscription && (
                <BadgeCheck className="tw:size-[18px] tw:max-[391px]:size-4 tw:shrink-0 tw:text-accent" />
              )}
            </div>

            {mode === "own" && (
              <div className="tw:mt-[7px]">
                <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-accent-soft tw:px-[11px] tw:py-[5px] tw:text-[12px] tw:leading-none tw:font-medium tw:text-accent-deep">
                  {isOrganiser ? "Organizer" : "User"}
                </span>
              </div>
            )}

            <div className="tw:mt-[14px] tw:max-[391px]:mt-3 tw:h-px tw:w-full tw:bg-hairline" />

            <div className="tw:mt-[14px] tw:max-[391px]:mt-3 tw:flex tw:items-center">
              <div className="tw:min-w-0 tw:flex-1">
                <HeroMetric
                  icon={Ticket}
                  value={formatCount(ticketsSold)}
                  label={labels.tickets}
                  iconClass="tw:text-accent"
                />
              </div>
              <span className="tw:h-8 tw:max-[391px]:h-[30px] tw:w-px tw:shrink-0 tw:bg-hairline" />
              <div className="tw:min-w-0 tw:flex-1 tw:pl-[14px] tw:max-[391px]:pl-[10px]">
                <HeroMetric
                  icon={CalendarDays}
                  value={formatCount(eventsCount)}
                  label={labels.events}
                  iconClass="tw:text-body"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* follow CTA (app: AppButton 'Follow', user_profile_screen.dart:448-461) */}
      {showFollow && (
        <button
          type="button"
          disabled={followLoading}
          onClick={onToggleFollow}
          className="tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-full tw:bg-accent tw:text-[13px] tw:font-medium tw:text-white tw:disabled:opacity-60"
        >
          {followLoading
            ? "Please wait..."
            : isFollowing
              ? "Unfollow"
              : "Follow Organizer"}
        </button>
      )}

      {/* app: _buildFollowersFollowingRow (:657-687) — 2-up, gap 10 */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-[10px]">
        <StatCard
          icon={UserPlus}
          title="Followers"
          value={formatCount(followers)}
          onClick={
            mode === "own"
              ? () => navigate("/me/organisers/followers")
              : undefined
          }
        />
        <StatCard
          icon={Users}
          title="Following"
          value={formatCount(following)}
          onClick={mode === "own" ? () => navigate("/me/organisers") : undefined}
        />
      </div>
    </div>
  );
}
