// src/component/Profile/EventsFilterTab.jsx
//
// Web mirror of the app's profile event filter.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   lib/features/presentation/screens/profile/screens/my_events_screen.dart
//     segmented track: context.pal.chip fill, r100, hairline border, p5 :223-229
//     segment: h38, r100, accent fill + onAccent (WHITE) label when selected,
//              transparent + textSecondary when not, label 11/w900  :260-301
//     the four segments are all / upcoming / live / ended           :217-222
//   (organizer_profile.dart:699-748 is the older variant of the same control:
//    card fill r12 with r8 chips at 10/w800. The revamp segmented pill above is
//    the newer one and is what this file mirrors.)
//
// The keys are unchanged (`all` / `upcoming` / `live` / `ended`) — only the
// option list and the chrome moved to the app's. ProfileTab owns the
// bucket -> key mapping.
export const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
];

export default function EventsFilterTabs({ value, onChange }) {
  return (
    <div className="tw:flex tw:rounded-full tw:border tw:border-hairline tw:bg-chip tw:p-[5px]">
      {FILTERS.map((option) => {
        const isActive = value === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={isActive}
            className={`tw:flex tw:h-[38px] tw:min-w-0 tw:flex-1 tw:items-center tw:justify-center tw:truncate tw:rounded-full tw:px-2 tw:text-[11px] tw:font-black tw:leading-none tw:transition-colors ${
              isActive
                ? "tw:bg-accent tw:text-white"
                : "tw:text-muted tw:hover:text-body"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
