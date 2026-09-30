/**
 * Top-3 podium — the app's `_PodiumPanel` + `_PodiumColumn` + `_RankBadge`.
 *
 * APP SOURCE OF TRUTH: lib/features/presentation/screens/profile/screens/
 *   top_organizers_screen.dart
 *     :289-337  one bordered panel, radius 24, gradient panelTop -> card.
 *               Light panelTop = #EAF7F9 (:286-287). Columns are laid out as
 *               [2nd, 1st, 3rd] with 10px gaps and `crossAxisAlignment.end`,
 *               so the three follow pills share a baseline.
 *     :340-432  column: 🏆 (26px) for rank 1 / a 14px spacer for the rest
 *               (:368-374), avatar (86 first, 64 others) with a rank badge
 *               overhanging 6px, name at 14.5 / 13 w700 + a 13 / 12px tick,
 *               then "N followers" at 11.5, then the full-width follow pill.
 *     :434-462  rank badge: 24x24 circle, ACCENT fill for #1 else INK fill,
 *               a 2px card-coloured border, label 12 w800.
 */
import TopOrganizerAvatar, { VerifiedTick } from "./TopOrganizerAvatar";
import TopOrganizerFollowPill from "./TopOrganizerFollowPill";
import { capitalizeUsername, compactNumber, hasActiveSubscription } from "./topOrganizers.utils";

function RankBadge({ rank, highlight }) {
  return (
    <span
      className={`tw:absolute tw:-bottom-1.5 tw:left-1/2 tw:flex tw:size-6 tw:-translate-x-1/2 tw:items-center tw:justify-center tw:rounded-full tw:border-2 tw:border-paper-raised tw:text-xs tw:font-extrabold tw:text-white ${highlight ? "tw:bg-accent" : "tw:bg-ink"}`}
    >
      {rank}
    </span>
  );
}

function PodiumColumn({ org, rank, size, isFirst, onToggleFollow, isOwnProfile, isLoading }) {
  const name = capitalizeUsername(org?.userName);
  const verified = hasActiveSubscription(org);
  const followers = compactNumber(org?.numberOfFollowers);

  return (
    <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-center">
      {isFirst ? (
        <span className="tw:pb-0.5 tw:text-[26px] tw:leading-none" aria-hidden="true">
          🏆
        </span>
      ) : (
        <span className="tw:block tw:h-3.5" aria-hidden="true" />
      )}

      <span className="tw:relative tw:inline-flex tw:justify-center">
        <TopOrganizerAvatar
          name={org?.organiser ?? org?.userName}
          imageUrl={org?.profileImage}
          size={size}
          gold={isFirst}
        />
        <RankBadge rank={rank} highlight={isFirst} />
      </span>

      <span className="tw:mt-3 tw:flex tw:min-w-0 tw:items-center tw:justify-center tw:gap-[3px]">
        <span
          className="tw:truncate tw:font-bold tw:text-body"
          style={{ fontSize: isFirst ? 14.5 : 13 }}
        >
          {name}
        </span>
        {verified ? <VerifiedTick size={isFirst ? 13 : 12} /> : null}
      </span>

      <span className="tw:mt-0.5 tw:block tw:max-w-full tw:truncate tw:text-[11.5px] tw:text-muted">
        {followers} followers
      </span>

      <span className="tw:mt-2.5 tw:flex tw:w-full tw:justify-center">
        <TopOrganizerFollowPill
          isOwnProfile={isOwnProfile}
          isFollowing={org?.isFollowing === true}
          isFirst={isFirst}
          isLoading={isLoading}
          fullWidth
          onToggle={() => onToggleFollow?.(org)}
        />
      </span>
    </div>
  );
}

export default function PodiumSection({
  top3 = [],
  onToggleFollow,
  isOwnProfile,
  loadingUserId,
}) {
  const [first, second, third] = top3;

  return (
    <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-linear-to-b tw:from-[#EAF7F9] tw:to-paper-raised tw:px-3 tw:pt-5 tw:pb-[18px]">
      <div className="tw:flex tw:items-end tw:gap-2.5">
        <div className="tw:flex tw:min-w-0 tw:flex-1">
          {second ? (
            <PodiumColumn
              org={second}
              rank={2}
              size={64}
              isFirst={false}
              onToggleFollow={onToggleFollow}
              isOwnProfile={isOwnProfile?.(second)}
              isLoading={loadingUserId === second?.userId}
            />
          ) : null}
        </div>

        <div className="tw:flex tw:min-w-0 tw:flex-1">
          {first ? (
            <PodiumColumn
              org={first}
              rank={1}
              size={86}
              isFirst
              onToggleFollow={onToggleFollow}
              isOwnProfile={isOwnProfile?.(first)}
              isLoading={loadingUserId === first?.userId}
            />
          ) : null}
        </div>

        <div className="tw:flex tw:min-w-0 tw:flex-1">
          {third ? (
            <PodiumColumn
              org={third}
              rank={3}
              size={64}
              isFirst={false}
              onToggleFollow={onToggleFollow}
              isOwnProfile={isOwnProfile?.(third)}
              isLoading={loadingUserId === third?.userId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
