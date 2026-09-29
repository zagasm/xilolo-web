/**
 * Avatar + verified tick for the Top Organizers screen.
 *
 * APP SOURCE OF TRUTH: top_organizers_screen.dart
 *   :587-661  _GradientRingAvatar — ClipOval image, else a gradient block with
 *             initials at 0.34 * size in white; `ringWidth` 3 by default, and
 *             ringWidth <= 0 means NO ring at all (:622 — the row's 46px avatar).
 *             Rank 1's ring is the gold gradient (:585), everyone else's is the
 *             hairline (:635).
 *   :663-671  _VerifiedTick — Icons.verified in pal.accent, 13 / 12 px.
 */
import { BadgeCheck } from "lucide-react";

import {
  AVATAR_GRADIENTS,
  GOLD_RING,
  appInitials,
  gradientIndex,
  hasImage,
} from "./topOrganizers.utils";

/**
 * @param size      86 (rank 1) / 64 (podium 2-3) / 46 (rows)
 * @param ringWidth 3 in the podium, 0 in the rows
 * @param gold      rank 1's gold gradient ring
 */
export default function TopOrganizerAvatar({
  name,
  imageUrl,
  size,
  ringWidth = 3,
  gold = false,
}) {
  const gradient = AVATAR_GRADIENTS[gradientIndex(name)];
  const initials = (
    <span
      className="tw:flex tw:size-full tw:items-center tw:justify-center tw:font-bold tw:text-white"
      style={{
        backgroundImage: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
        fontSize: size * 0.34,
      }}
    >
      {appInitials(name)}
    </span>
  );

  const inner = (
    <span
      className="tw:block tw:overflow-hidden tw:rounded-full"
      style={{ width: size, height: size }}
    >
      {hasImage(imageUrl) ? (
        <img
          src={imageUrl}
          alt={name || "Organiser"}
          loading="lazy"
          className="tw:size-full tw:object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );

  if (ringWidth <= 0) return inner;

  return (
    <span
      className="tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full"
      style={{
        padding: ringWidth,
        backgroundImage: gold
          ? `linear-gradient(135deg, ${GOLD_RING[0]} 0%, ${GOLD_RING[1]} 100%)`
          : undefined,
        backgroundColor: gold ? undefined : "var(--color-hairline)",
      }}
    >
      {inner}
    </span>
  );
}

/** :663-671 — the tick is the brand accent, exactly as HeroFeedCard draws it. */
export function VerifiedTick({ size = 13 }) {
  return (
    <BadgeCheck
      aria-label="Verified organiser"
      className="tw:shrink-0 tw:text-[#16909C]"
      style={{ width: size, height: size }}
    />
  );
}
