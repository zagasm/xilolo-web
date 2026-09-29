// src/component/Profile/ProfileHeader.jsx
//
// Web mirror of the app's profile top stack.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   Own profile  lib/features/presentation/screens/profile/screens/
//                user_and_organizer_profile_screen/user_main_profile_screen_revamp.dart
//                  header card (avatar ring 84, name 21/w700, verify tick accent,
//                  role pill accent@11% r999, hairline divider, tickets+events
//                  hero metrics split by a 1px hairline)        :349-466
//                  avatar ring (card fill, hairline border, p4-5) :468-531
//                  role pill ("Organizer"/"User")                :578-598
//                  hero metric (icon 18, value 16/w700, label 11 muted) :600-654
//                  followers/following 2-up stat cards (minH 90, r20,
//                  42 circle accent@9% + 30 circle arrow)         :657-762
//                  K/M count rule                                 :764-774
//                  ranking card — ink gradient #111318 -> #05070A, white
//                  "View Leaderboard" pill                        :900-1054
//   Other user   lib/.../profile/screens/organizer_profile.dart
//                  header card row (name 18/w700 + validate tick, @username accent) :299-357
//                  followers card (label 13 muted, count 22/w700, arrow_outward) :513-555
//                  ranking card (light, "Organizer's Ranking", accent CTA) :617-678
//
// Colour/rules applied here come from src/styles/tailwind.css tokens; no hexes
// other than the two the app itself hard-codes for the ink ranking gradient.
// Legacy cascade note (src/styles/tailwind.css:88-111): `#root p { color: inherit }`
// greys any <p>, so every coloured string in this file is a <div> or <span>.
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Globe,
  Ticket,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

/** app: _formatCount (user_main_profile_screen_revamp.dart:764-774) — 1.5K / 2.1M. */
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

export function profileDisplayName(user) {
  const explicit = String(user?.name || "").trim();
  if (explicit) return explicit;
  const organiser =
    typeof user?.organiser === "string"
      ? user.organiser
      : user?.organiser?.organiser || user?.organiser?.name;
  if (organiser && String(organiser).trim()) return String(organiser).trim();
  const full = [user?.firstName, user?.lastName]
    .filter((p) => p && String(p).trim())
    .join(" ")
    .trim();
  if (full) return full;
  const userName = String(user?.userName || user?.user_name || "").trim();
  return userName || "User";
}

export function profileInitials(user) {
  const name = profileDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function profileAvatarUrl(user) {
  const raw =
    user?.profileImage ||
    user?.profile_image ||
    user?.profileUrl ||
    user?.profile_url ||
    user?.organiser?.profileImage ||
    null;
  if (!raw) return null;
  const value = String(raw).trim();
  return value ? value : null;
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

/** app: _buildOrganizerRolePill isOrganizer (revamp:580). */
export function profileIsOrganiser(user) {
  return Boolean(
    user?.is_organiser_verified ||
      user?.isOrganiserVerified ||
      user?.isOrganiser ||
      user?.is_organiser ||
      user?.organiser ||
      user?.userId,
  );
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
  return 0;
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

function HeroMetric({ icon: Icon, value, label, iconClass, onClick }) {
  const body = (
    <>
      <Icon className={`tw:size-[18px] tw:shrink-0 ${iconClass}`} />
      <div className="tw:min-w-0">
        <div className="tw:text-[16px] tw:font-bold! tw:leading-none tw:text-body">
          {value}
        </div>
        <div className="tw:mt-[3px] tw:truncate tw:text-[11px] tw:font-medium tw:leading-[1.1] tw:text-muted">
          {label}
        </div>
      </div>
    </>
  );

  if (!onClick) {
    return <div className="tw:flex tw:items-center tw:gap-2">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:flex tw:items-center tw:gap-2 tw:text-left"
    >
      {body}
    </button>
  );
}

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

/**
 * Ranking card. Two real app designs:
 *   own profile  -> ink gradient "Organizer Ranking" + white "View Leaderboard"
 *                   (user_main_profile_screen_revamp.dart:900-1054)
 *   other        -> light card "Organizer's Ranking" + accent "View Top Organizers"
 *                   (organizer_profile.dart:617-678)
 * Rendered only when the profile carries a rank (app: `if (organiser != null)
 * _buildRankingSection` at user_main_profile_screen_revamp.dart:343).
 */
export function ProfileRanking({ user, isOwnProfile }) {
  const rank =
    user?.organiser?.rank ??
    user?.organiser?.rank_global ??
    user?.rank ??
    user?.rank_global ??
    null;
  const rankValue = Number(rank);
  if (!Number.isFinite(rankValue) || rankValue <= 0) return null;
  const rankLabel = `#${rankValue}`;

  if (!isOwnProfile) {
    return (
      <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-5 tw:py-4 tw:text-center">
        <div className="tw:text-[16px] tw:font-semibold tw:text-body">
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
          className="tw:mt-4 tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-[16px] tw:bg-accent tw:text-[14px] tw:font-semibold tw:text-white"
        >
          View Top Organizers
        </Link>
      </div>
    );
  }

  return (
    <div
      className="tw:overflow-hidden tw:rounded-[24px] tw:p-[15px]"
      style={{
        backgroundImage: "linear-gradient(135deg, #111318 0%, #05070A 100%)",
      }}
    >
      <div className="tw:flex tw:items-center tw:gap-[14px]">
        <span className="tw:flex tw:size-[46px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-[14px] tw:border tw:border-white/10 tw:bg-white/10 tw:text-white">
          <Trophy className="tw:size-[22px]" />
        </span>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[16px] tw:font-bold tw:text-white">
            Organizer Ranking
          </div>
          <div className="tw:mt-[10px] tw:flex tw:items-end tw:gap-[10px]">
            <span className="tw:text-[36px] tw:font-bold tw:leading-[0.95] tw:text-white">
              {rankLabel}
            </span>
          </div>
          <div className="tw:mt-2 tw:text-[13px] tw:leading-[1.3] tw:text-white/70">
            You are among the top organizers this month.
          </div>
        </div>
      </div>

      <Link
        to="/organizers"
        className="tw:mt-4 tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-[9px] tw:rounded-[16px] tw:bg-white tw:text-[13.5px] tw:font-bold tw:text-[#080A0E]"
      >
        <Trophy className="tw:size-[19px]" />
        View Leaderboard
        <ChevronRight className="tw:size-5 tw:ml-auto" />
      </Link>
    </div>
  );
}

export default function ProfileHeader({
  user,
  isOwnProfile = true,
  isFollowing = false,
  followLoading = false,
  onToggleFollow,
}) {
  const displayName = profileDisplayName(user);
  const username = String(user?.userName || user?.user_name || "").trim();
  const avatarUrl = profileAvatarUrl(user);
  const isOrganiser = profileIsOrganiser(user);
  const hasSubscription = profileHasSubscription(user);
  const followers = Number(
    user?.numberOfFollowers ?? user?.followers_count ?? user?.followersCount ?? 0,
  );
  const following = Number(
    user?.followings_count ?? user?.followingsCount ?? 0,
  );
  const showRoles = !isOwnProfile && typeof onToggleFollow === "function";
  const navigate = useNavigate();

  return (
    <div className="tw:space-y-[10px]">
      {/* ── profile card: avatar + name + verified + role pill + metrics ── */}
      <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[14px] tw:md:p-[18px]">
        <div className="tw:flex tw:items-center tw:gap-3 tw:md:gap-4">
          <span className="tw:flex tw:size-[84px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline tw:bg-paper-raised tw:p-1">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="tw:h-full tw:w-full tw:rounded-full tw:object-cover"
                loading="lazy"
              />
            ) : (
              <span className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:rounded-full tw:bg-accent-soft tw:text-[23px] tw:font-bold tw:text-accent-deep">
                {profileInitials(user)}
              </span>
            )}
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:truncate tw:text-[19px] tw:font-bold! tw:leading-none tw:text-body tw:md:text-[21px]">
                {displayName}
              </span>
              {hasSubscription && (
                <BadgeCheck className="tw:size-[18px] tw:shrink-0 tw:text-accent" />
              )}
            </div>

            {username && (
              <div className="tw:mt-[2px] tw:truncate tw:text-[13px] tw:text-accent-deep">
                @{username}
              </div>
            )}

            <div className="tw:mt-[7px]">
              <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-accent-soft tw:px-[11px] tw:py-[5px] tw:text-[12px] tw:leading-none tw:font-medium tw:text-accent-deep">
                {isOrganiser ? "Organizer" : "User"}
              </span>
            </div>

            <div className="tw:mt-3 tw:h-px tw:w-full tw:bg-hairline" />

            <div className="tw:mt-3 tw:flex tw:items-center">
              <HeroMetric
                icon={Ticket}
                value={formatCount(profileTicketsSold(user))}
                label="Tickets Sold"
                iconClass="tw:text-accent"
              />
              <span className="tw:mx-3 tw:h-8 tw:w-px tw:shrink-0 tw:bg-hairline" />
              <HeroMetric
                icon={CalendarDays}
                value={formatCount(profileEventsCount(user))}
                label="Events"
                iconClass="tw:text-body"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── follow CTA (app: AppButton 'Follow' filled, user_profile_screen.dart:448-461) ── */}
      {showRoles && (
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

      {/* ── followers / following (app: _buildFollowersFollowingRow) ── */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-[10px]">
        <StatCard
          icon={UserPlus}
          title="Followers"
          value={formatCount(followers)}
          onClick={
            isOwnProfile
              ? () => navigate("/me/organisers/followers")
              : undefined
          }
        />
        <StatCard
          icon={Users}
          title="Following"
          value={formatCount(following)}
          onClick={
            isOwnProfile
              ? () => navigate("/me/organisers")
              : undefined
          }
        />
      </div>
    </div>
  );
}
