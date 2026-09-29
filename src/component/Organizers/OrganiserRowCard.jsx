/**
 * Leaderboard row (rank 4 and below) — the app's `_OrganizerRankRow`
 * (top_organizers_screen.dart:468-570).
 *
 *   :484-490  surface: card fill, radius 18, hairline border, 12px padding
 *   :493-504  rank cell: a 22px-wide gutter, centred, 14px w800, textSecondary
 *             — a plain NUMBER, not the "#N" chip the old web page drew
 *   :506-512  avatar: 46px, `ringWidth: 0` (NO ring), gradient initials fallback
 *   :520-535  name: capitalizeUsername(userName) 14.5 w700 + 4px + a 13px tick
 *   :539-559  followers: 13px people icon + 4px + "N followers" at 12 muted
 *   :564      follow pill, inline width (px 18 / py 9 / 13px)
 * The app's 10px inter-row gap lives in the parent list (:125-126), so the page
 * supplies it instead of this card.
 */
import { Users } from "lucide-react";

import TopOrganizerAvatar, { VerifiedTick } from "./TopOrganizerAvatar";
import TopOrganizerFollowPill from "./TopOrganizerFollowPill";
import {
  capitalizeUsername,
  compactNumber,
  hasActiveSubscription,
  rankOf,
} from "./topOrganizers.utils";

export default function OrganizerRowCard({
  org,
  onToggleFollow,
  onOpenProfile,
  isOwnProfile,
  isLoading,
}) {
  const name = capitalizeUsername(org?.userName);
  const verified = hasActiveSubscription(org);
  const followers = compactNumber(org?.numberOfFollowers);

  const open = () => {
    if (org?.id) onOpenProfile?.(org.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="tw:flex tw:cursor-pointer tw:items-center tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-3"
    >
      <span className="tw:w-[22px] tw:shrink-0 tw:text-center tw:text-sm tw:font-extrabold tw:text-muted">
        {rankOf(org)}
      </span>

      <span className="tw:ml-3 tw:shrink-0">
        <TopOrganizerAvatar
          name={org?.organiser ?? org?.userName}
          imageUrl={org?.profileImage}
          size={46}
          ringWidth={0}
        />
      </span>

      <div className="tw:ml-3 tw:min-w-0 tw:flex-1">
        <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1">
          <span
            className="tw:truncate tw:font-bold tw:text-body"
            style={{ fontSize: 14.5 }}
          >
            {name}
          </span>
          {verified ? <VerifiedTick size={13} /> : null}
        </span>

        <span className="tw:mt-0.5 tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:text-xs tw:text-muted">
          <Users aria-hidden="true" className="tw:size-[13px] tw:shrink-0" />
          <span className="tw:truncate">{followers} followers</span>
        </span>
      </div>

      <span className="tw:ml-2.5 tw:shrink-0">
        <TopOrganizerFollowPill
          isOwnProfile={isOwnProfile}
          isFollowing={org?.isFollowing === true}
          isLoading={isLoading}
          onToggle={() => onToggleFollow?.(org)}
        />
      </span>
    </div>
  );
}
