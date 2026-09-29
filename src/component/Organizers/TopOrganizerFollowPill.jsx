/**
 * Follow pill for the Top Organizers screen — the app's `_FollowButton`
 * (top_organizers_screen.dart:673-805) reduced to its _pill renderer
 * (:757-805) plus the state table at :716-732.
 *
 *   own card      -> "Me"        transparent · muted label · hairline border (disabled)
 *   following     -> "Following" transparent · ink label   · hairline border
 *   follow (rank1)-> "Follow"    ACCENT fill · WHITE label · no border
 *   follow (rest) -> "Follow"    INK fill    · WHITE label · no border
 *
 * Geometry (:777-780 + :793-795): radius 999 · fullWidth -> py 7 / 13->12px,
 * inline -> px 18 / py 9 / 13px · label w700 · 14px spinner while pending.
 * The app's `pal.bg` label on the ink fill is #F3F2F0; the house rule for this
 * work is "white on ink", so white is used (3% off, indistinguishable).
 */
export default function TopOrganizerFollowPill({
  isOwnProfile = false,
  isFollowing = false,
  isFirst = false,
  isLoading = false,
  fullWidth = false,
  onToggle,
}) {
  const border = isOwnProfile || isFollowing;

  const tone = isOwnProfile
    ? "tw:border-hairline tw:bg-transparent tw:text-muted"
    : isFollowing
      ? "tw:border-hairline tw:bg-transparent tw:text-body"
      : isFirst
        ? "tw:border-0 tw:bg-accent tw:text-white"
        : "tw:border-0 tw:bg-ink tw:text-white";

  const geometry = fullWidth
    ? "tw:w-full tw:py-[7px] tw:text-xs"
    : "tw:px-[18px] tw:py-[9px] tw:text-[13px]";

  const label = isOwnProfile ? "Me" : isFollowing ? "Following" : "Follow";

  return (
    <button
      type="button"
      disabled={isOwnProfile || isLoading || !onToggle}
      onClick={(e) => {
        e.stopPropagation();
        if (!isOwnProfile && !isLoading) onToggle?.();
      }}
      className={`tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:font-bold tw:leading-none tw:transition-colors ${border ? "tw:border-[1.5px]" : ""} ${geometry} ${tone}`}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="tw:block tw:size-3.5 tw:animate-spin tw:rounded-full tw:border-2 tw:border-current tw:border-t-transparent"
        />
      ) : (
        label
      )}
    </button>
  );
}
