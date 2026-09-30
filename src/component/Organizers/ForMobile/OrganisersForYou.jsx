/**
 * "Organizers you may know" rail on the signed-in home.
 *
 * APP SOURCE OF TRUTH (read-only): C:\Users\ceo\Desktop\xilolo-app
 *   lib/features/presentation/screens/home/widgets/suggested_organisers_section.dart
 *     :49-93     section frame: title row, then a 190-high HORIZONTAL rail
 *     :77-90     rail: height 190, 12px separators, BouncingScrollPhysics
 *     :96-215    card anatomy
 *     :104-105   card width = clamp(220, 72vw, 290)  <- the whole responsiveness
 *     :120-134   surface = card (#FFFFFF), radius 20, hairline border
 *     :138-186   58x58 avatar (radius 16) + 12px gap + name/username column
 *     :150-181   name 15/w700 + BlueVerifiedTick(14) | @username 12/w500
 *     :187-201   twelve-px gap, then a Wrap of stat chips (spacing 10 / run 8)
 *     :203-209   Spacer, then the Follow button bottom-left
 *     :217-333   Follow: height 38, radius 12, h-padding 14, label 12/w700;
 *                rest = card bg + hairline border, following = accentSoft bg +
 *                accent border, own profile = muted "Me"
 *     :335-368   chip: padding 10/8, radius 12, bg inner, hairline border,
 *                icon 14 (textSecondary) + 6px + label 11/w600 (textPrimary)
 *     :370-425   avatar: radius 16, bg inner, fallback = initials 18/w700
 *     :427-546   loading: THREE skeleton cards, same width/height, not a spinner
 *     :548-598   badge rule, @username rule, K/M formatting, initials
 *   lib/features/presentation/screens/home/data/service/suggested_organisers_service.dart:5-12
 *     endpoint `organiser/for-you/get?per_page=20` -> GET /api/v1/organiser/for-you/get
 *     (unchanged here; the payload was confirmed against the backend's
 *      app/Http/Resources/OrganiserResource.php: organiser, userName,
 *      profileImage, numberOfFollowers, tickets_total, has_active_subscription, plan)
 *   lib/features/presentation/screens/home_revamp/screen/home_revamp_screen.dart:395-410
 *     the app inserts this section INTO the feed at a random index; the web keeps
 *     it after the feed grid because the rebuilt grid must not be restructured.
 *
 * COLOUR — app `context.pal` (light, app_palette.dart) -> web tokens, 1:1:
 *   card #FFFFFF        -> tw:bg-paper-raised
 *   inner #E9E9EC       -> tw:bg-inner
 *   hairline .10 black  -> tw:border-hairline
 *   textPrimary #050505 -> tw:text-body
 *   textSecondary#76767C-> tw:text-muted
 *   accent #16909C      -> tw:text-[#16909C] (verified tick, exactly as
 *                          HeroFeedCard draws it) / follow-on state
 *   onAccent            -> WHITE on an accent fill
 * Deliberate deviations (see the task report): (1) no 4%-black drop shadow —
 * DESIGN.md is flat + hairline outside overlays; (2) accent-coloured TEXT uses
 * accent-deep (DESIGN.md's on-light rule) where the app uses raw accent;
 * (3) a non-numeric `tickets_total` (the backend sends public viewers a
 * milestone label, TicketMilestone.php) is printed verbatim instead of the app's
 * "0 tickets".
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Ticket, Users } from "lucide-react";

import { useAuth } from "../../../pages/auth/AuthContext";
import { showError, showSuccess } from "../../ui/toast";
import { api, authHeaders } from "../../../lib/apiClient";

/* ── Geometry taken straight from the app (numbers, not guesses) ───────────
   These are literal class strings on purpose: Tailwind scans the file text, so
   a class built by interpolation (`tw:h-[${n}px]`) would never be generated. */
// rail: height 190 + 12px separators (suggested_organisers_section.dart:79-84)
const RAIL_BOX =
  "tw:h-[190px] tw:w-full tw:gap-3 tw:overflow-x-auto tw-no-scrollbar";
// card: width clamp(220, 72vw, 290), radius 20 (:104-105, :120-134)
const CARD_BOX =
  "tw:h-[190px] tw:w-[clamp(220px,72vw,290px)] tw:shrink-0";

const TICK = "tw:size-3.5 tw:shrink-0 tw:text-[#16909C]"; // :164-168 + brand accent

/* ── App helpers, mirrored (:548-598) ───────────────────────────────────── */

/** _asBool — the app accepts true / 1 / 'yes'. */
const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

/** :548-550 — badge when the organiser has an active subscription or a plan. */
const isVerified = (org) =>
  toBool(org?.has_active_subscription ?? org?.hasActiveSubscription) ||
  !!org?.plan;

/** :559-568 — 1_234_567 -> "1.2M followers", 12_400 -> "12.4K followers". */
const compact = (value, unit) => {
  const count = Number(value ?? 0);
  const safe = Number.isFinite(count) ? count : 0;
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1).replace(".0", "")}M ${unit}`;
  if (safe >= 1000) return `${(safe / 1000).toFixed(1).replace(".0", "")}K ${unit}`;
  return `${Math.trunc(safe)} ${unit}`;
};

/**
 * :570-579 — the app mirrors _formatTickets. `tickets_total` is an exact number
 * only for the owner/admin; everyone else gets a milestone label string from the
 * API (TicketMilestone.php), which the app's num-parse silently flattens to
 * "0 tickets". Printing the label the API actually sent is the honest read.
 */
const ticketsLabel = (value) => {
  if (value === null || value === undefined || value === "") return compact(0, "tickets");
  const numeric = Number(value);
  return Number.isFinite(numeric) ? compact(numeric, "tickets") : String(value);
};

/** :552-557 — user_name, else the display name lower-cased and de-spaced. */
const buildUsername = (org, displayName) => {
  const username = String(org?.userName ?? "").trim();
  if (username) return username;
  const derived = String(displayName ?? "").toLowerCase().replace(/ /g, "");
  return derived || "organizer";
};

/** :581-598 — 'Ada Obi' -> 'AO', 'Ada' -> 'A', '' -> 'O'. */
const initials = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

/**
 * :164 — displayName = `organiser` ?? `userName`. The backend's
 * OrganiserResource sets `organiser` to the organiser/user name, so it wins;
 * firstName+lastName stays as the last-resort legacy fallback the web already had.
 */
const displayNameOf = (org) =>
  String(
    org?.organiser ||
      org?.userName ||
      [org?.firstName, org?.lastName].filter(Boolean).join(" ") ||
      "Organizer",
  ).trim();

/** :335-368 — stat chip. `shrink` lets a long milestone label ellipsize instead
    of forcing a second chip row (the app never wraps with its own data: its
    `_formatTickets` collapses the API's label string to "0 tickets"). */
function StatChip({ icon: Icon, label, title, shrink = false }) {
  return (
    <span
      title={title}
      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-inner tw:px-2.5 tw:py-2 ${shrink ? "tw:min-w-0 tw:shrink" : "tw:shrink-0"}`}
    >
      <Icon className="tw:size-3.5 tw:shrink-0 tw:text-muted" aria-hidden />
      <span
        className={`tw:text-[11px] tw:font-semibold tw:text-body ${shrink ? "tw:truncate" : ""}`}
      >
        {label}
      </span>
    </span>
  );
}

/** :370-402 — 58x58, radius 16, inner fill; initials when there is no image. */
function Avatar({ url, name }) {
  const valid =
    typeof url === "string" && url.trim() !== "" && url !== "null" && url !== "undefined";

  return (
    <span className="tw:flex tw:size-[58px] tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-2xl tw:bg-inner">
      {valid ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          className="tw:size-full tw:object-cover"
        />
      ) : (
        <span className="tw:text-lg tw:font-bold tw:text-muted">{initials(name)}</span>
      )}
    </span>
  );
}

/** :427-546 — the loading skeleton (three of these), never a spinner. */
function SkeletonCard() {
  return (
    <div
      className={`${CARD_BOX} tw:flex tw:animate-pulse tw:flex-col tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5`}
      aria-hidden="true"
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        <span className="tw:size-[58px] tw:shrink-0 tw:rounded-2xl tw:bg-inner" />
        <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2">
          <span className="tw:block tw:h-3.5 tw:w-[120px] tw:rounded-lg tw:bg-inner" />
          <span className="tw:block tw:h-3 tw:w-[90px] tw:rounded-lg tw:bg-inner" />
        </span>
      </div>
      <div className="tw:mt-3.5 tw:flex tw:gap-2.5">
        <span className="tw:block tw:h-8 tw:w-[96px] tw:rounded-xl tw:bg-inner" />
        <span className="tw:block tw:h-8 tw:w-[96px] tw:rounded-xl tw:bg-inner" />
      </div>
      <span className="tw:mt-auto tw:block tw:h-[38px] tw:w-[96px] tw:rounded-xl tw:bg-inner" />
    </div>
  );
}

/** :96-215 — the card. */
function OrganiserCard({
  organizer,
  onOpen,
  onToggleFollow,
  isOwnProfile,
  isPending,
}) {
  const profileId = organizer?.id;
  const followUserId = organizer?.userId;
  const isFollowing = toBool(organizer?.isFollowing ?? organizer?.following);
  const name = displayNameOf(organizer);
  const username = buildUsername(organizer, name);
  const verified = isVerified(organizer);

  /* :247-281 — "Following" while following (the app's l10n string), "Me" on
     your own card, "Follow" otherwise. */
  const label = isOwnProfile ? "Me" : isFollowing ? "Following" : "Follow";

  const buttonTone = isOwnProfile
    ? "tw:border-hairline tw:bg-paper-raised tw:text-muted"
    : isFollowing
      ? "tw:border-accent tw:bg-accent-soft tw:text-accent-deep"
      : "tw:border-hairline tw:bg-paper-raised tw:text-body tw:hover:border-accent";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => profileId && onOpen(profileId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && profileId) onOpen(profileId);
      }}
      className={`${CARD_BOX} tw:flex tw:cursor-pointer tw:flex-col tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5`}
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        <Avatar url={organizer?.profileImage} name={name} />

        <div className="tw:min-w-0 tw:flex-1">
          <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1">
            <span className="tw:truncate tw:text-[15px] tw:font-bold tw:text-body tw:first-letter:capitalize">
              {name}
            </span>
            {verified ? (
              <BadgeCheck className={TICK} aria-label="Verified organiser" />
            ) : null}
          </span>
          <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:font-medium tw:text-muted">
            @{username}
          </span>
        </div>
      </div>

      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5">
        <StatChip
          icon={Users}
          label={compact(organizer?.numberOfFollowers, "followers")}
        />
        <StatChip
          icon={Ticket}
          label={ticketsLabel(organizer?.tickets_total)}
          title={ticketsLabel(organizer?.tickets_total)}
          shrink
        />
      </div>

      {/* :228 + :203-209 — no button at all when there is no follow target. */}
      {followUserId ? (
        <div className="tw:mt-auto tw:flex">
          <button
            type="button"
            disabled={isOwnProfile || isPending}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOwnProfile) onToggleFollow(followUserId);
            }}
            className={`tw:inline-flex tw:h-[38px] tw:items-center tw:justify-center tw:rounded-xl tw:border tw:px-3.5 tw:text-xs tw:font-bold tw:transition-colors ${buttonTone}`}
          >
            <span>{label}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function MobileSingleOrganizers({
  onAvailabilityChange,
  previewOrganisers,
  previewLoading,
}) {
  const navigate = useNavigate();

  /* `previewOrganisers` is used ONLY by the DEV-only /dev/home-preview route
     (pages/Home/HomePreview.jsx) to render this rail with fixtures and no API
     call — the same pattern that route already uses for HomeHeader/HeroFeedCard.
     In production the prop is absent and the endpoint below is the only source. */
  const isPreview = Array.isArray(previewOrganisers);

  const [organizers, setOrganizers] = useState(
    isPreview ? previewOrganisers : [],
  );
  const [loadingList, setLoadingList] = useState(
    isPreview ? !!previewLoading : true, // shimmer first, like the app
  );
  const pendingFollowRef = useRef({});
  const { token, user } = useAuth();

  useEffect(() => {
    if (isPreview) return;
    fetchOrganizers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  /* :33-46 — loading shows the section, an error or an empty list removes it
     entirely (the app returns SizedBox.shrink()). The heading lives in
     pages/Home/index.jsx, so it is told to follow the same rule. */
  const lastAvailabilityRef = useRef(false);
  useEffect(() => {
    const available = loadingList || organizers.length > 0;
    if (lastAvailabilityRef.current === available) return;
    lastAvailabilityRef.current = available;
    onAvailabilityChange?.(available);
  }, [loadingList, organizers.length, onAvailabilityChange]);

  const fetchOrganizers = async () => {
    try {
      setLoadingList(true);

      const res = await api.get("/api/v1/organiser/for-you/get", {
        params: {
          per_page: 20,
        },
        ...authHeaders(token),
      });

      const list = Array.isArray(res?.data?.data) ? res.data.data : [];

      // normalize follow state (keep both fields in sync)
      const normalized = list.map((o) => {
        const isFollowing = toBool(o?.isFollowing ?? o?.following);
        return { ...o, isFollowing, following: isFollowing };
      });

      setOrganizers(normalized);
    } catch (e) {
      console.error("Error fetching organizers:", e);
      showError("Unable to load organizers right now.");
      setOrganizers([]);
    } finally {
      setLoadingList(false);
    }
  };

  const toggleFollow = async (followUserId) => {
    if (!followUserId || pendingFollowRef.current[followUserId]) return;

    let previousFollowing = false;
    pendingFollowRef.current[followUserId] = true;

    setOrganizers((prev) =>
      prev.map((org) => {
        if (org?.userId !== followUserId) {
          return org;
        }

        previousFollowing = toBool(org?.isFollowing ?? org?.following);
        const nextFollowing = !previousFollowing;

        return {
          ...org,
          isFollowing: nextFollowing,
          following: nextFollowing,
          numberOfFollowers: Math.max(
            0,
            Number(org?.numberOfFollowers ?? 0) + (nextFollowing ? 1 : -1),
          ),
        };
      }),
    );

    /* DEV preview only (no session): keep the optimistic state, skip the POST.
       Production always takes the network path below. */
    if (isPreview) {
      delete pendingFollowRef.current[followUserId];
      return;
    }

    try {
      const res = await api.post(
        `/api/v1/follow/${followUserId}`,
        {},
        authHeaders(token),
      );
      const body = res?.data || {};
      const newFollowing =
        typeof body.following === "boolean"
          ? body.following
          : typeof body?.data?.following === "boolean"
            ? body.data.following
            : // fallback: some APIs return is_following / isFollowing
              !!(body?.data?.is_following ?? body?.data?.isFollowing);

      showSuccess(body?.message || "Updated");

      setOrganizers((prev) =>
        prev.map((org) =>
          org?.userId === followUserId
            ? {
                ...org,
                isFollowing: newFollowing,
                following: newFollowing,
              }
            : org,
        ),
      );
    } catch (e) {
      setOrganizers((prev) =>
        prev.map((org) =>
          org?.userId === followUserId
            ? {
                ...org,
                isFollowing: previousFollowing,
                following: previousFollowing,
                numberOfFollowers: Math.max(
                  0,
                  Number(org?.numberOfFollowers ?? 0) +
                    (previousFollowing ? 1 : -1),
                ),
              }
            : org,
        ),
      );
      console.error("Error toggling follow:", e);
      showError("Something went wrong. Please try again.");
    } finally {
      delete pendingFollowRef.current[followUserId];
    }
  };

  const currentUserId = user?.id ?? user?.userId ?? null;
  const isOwnProfile = (organizer) => {
    const target = organizer?.userId ?? organizer?.id;
    if (!target || !currentUserId) return false;
    return String(target) === String(currentUserId);
  };

  if (loadingList && organizers.length === 0) {
    return (
      <div className={`tw:font-sans ${RAIL_BOX}`}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (organizers.length === 0) return null; // :40-46 — error and empty render nothing

  return (
    <div className={`tw:font-sans ${RAIL_BOX}`}>
      {organizers.map((organizer) => (
        <OrganiserCard
          key={organizer?.id || organizer?.userId}
          organizer={organizer}
          isOwnProfile={isOwnProfile(organizer)}
          isPending={!!pendingFollowRef.current[organizer?.userId]}
          onOpen={(id) => navigate(`/profile/${id}`)}
          onToggleFollow={toggleFollow}
        />
      ))}
    </div>
  );
}
