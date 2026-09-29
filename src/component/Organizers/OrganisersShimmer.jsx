/**
 * Loading states for the Top Organizers screen — the app's `_TopOrganizersShimmer`
 * (top_organizers_screen.dart:856-898), `_PodiumShimmer` (:900-919),
 * `_ListShimmer` (:921-937) and `_RankRowShimmer` (:939-972).
 *
 * Every block is the app's `_ShimmerPill` / `_ShimmerCircle`: `pal.inner`
 * (#E9E9EC -> `tw:bg-inner`), the pills fully rounded (999), the podium panel
 * radius 24 with a hairline border, the row cards radius 18 with 12px padding.
 * The app animates these with the `shimmer` package; `animate-pulse` is the web
 * equivalent of the same base/highlight cycle.
 */

function Pill({ width, height }) {
  return (
    <span
      aria-hidden="true"
      className="tw:block tw:animate-pulse tw:rounded-full tw:bg-inner"
      style={{ width, height }}
    />
  );
}

function Circle({ diameter }) {
  return (
    <span
      aria-hidden="true"
      className="tw:block tw:animate-pulse tw:rounded-full tw:bg-inner"
      style={{ width: diameter, height: diameter }}
    />
  );
}

/** :900-919 — one podium column skeleton (avatar 64 / 86). */
export function PodiumShimmer({ size }) {
  return (
    <div className="tw:flex tw:flex-1 tw:flex-col tw:items-center">
      <Circle diameter={size} />
      <span className="tw:mt-3.5">
        <Pill width={70} height={13} />
      </span>
      <span className="tw:mt-1.5">
        <Pill width={54} height={11} />
      </span>
      <span className="tw:mt-2.5 tw:block tw:w-full">
        <Pill width="100%" height={28} />
      </span>
    </div>
  );
}

/** :939-972 — one leaderboard row skeleton. */
export function RankRowShimmer() {
  return (
    <div className="tw:flex tw:items-center tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-3">
      <Circle diameter={46} />
      <span className="tw:ml-3 tw:flex tw:flex-1 tw:flex-col tw:gap-2">
        <Pill width={130} height={13} />
        <Pill width={90} height={11} />
      </span>
      <span className="tw:ml-3">
        <Pill width={74} height={30} />
      </span>
    </div>
  );
}

/** :921-937 — `count` rows, each 10px above the next. */
export function ListShimmer({ count = 4 }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <RankRowShimmer key={i} />
      ))}
    </div>
  );
}

/**
 * :856-898 — the whole screen while the first page loads: the header stand-ins,
 * then the podium panel skeleton and 4 rows. The page renders the real back
 * arrow above this (the app's shimmer keeps its arrow real too, :866-870), so
 * only the title/subtitle are stand-ins here.
 */
export default function TopOrganizersShimmer() {
  return (
    <div className="tw:pt-2">
      <Pill width={200} height={30} />
      <span className="tw:mt-2.5 tw:block">
        <Pill width={150} height={13} />
      </span>
      <span className="tw:mt-[22px] tw:block">
        <span className="tw:block tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:pt-5 tw:pb-[18px]">
          <span className="tw:flex tw:items-end tw:gap-2.5">
            <PodiumShimmer size={64} />
            <PodiumShimmer size={86} />
            <PodiumShimmer size={64} />
          </span>
        </span>
      </span>
      <span className="tw:mt-5 tw:block">
        <ListShimmer count={4} />
      </span>
    </div>
  );
}
