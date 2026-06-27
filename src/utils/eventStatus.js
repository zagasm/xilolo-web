export const EVENT_STATUS_META = {
  upcoming: {
    key: "upcoming",
    label: "Upcoming",
    pillClass:
      "tw:bg-emerald-800 tw:text-white",
    dotClass: "tw:bg-white/80",
  },
  ready_to_go_live: {
    key: "ready_to_go_live",
    label: "Ready to go live",
    pillClass:
      "tw:bg-amber-100 tw:text-amber-800",
    dotClass: "tw:bg-amber-500",
  },
  live: {
    key: "live",
    label: "Live now",
    pillClass:
      "tw:bg-red-50 tw:text-red-600",
    dotClass: "tw:bg-red-500",
  },
  paused: {
    key: "paused",
    label: "Paused",
    pillClass:
      "tw:bg-blue-50 tw:text-blue-700",
    dotClass: "tw:bg-blue-500",
  },
  ended: {
    key: "ended",
    label: "Ended",
    pillClass:
      "tw:bg-slate-100 tw:text-slate-700",
    dotClass: "tw:bg-slate-500",
  },
  expired: {
    key: "expired",
    label: "Expired",
    pillClass:
      "tw:bg-rose-50 tw:text-rose-700",
    dotClass: "tw:bg-rose-500",
  },
  cancelled: {
    key: "cancelled",
    label: "Cancelled",
    pillClass:
      "tw:bg-zinc-100 tw:text-zinc-700",
    dotClass: "tw:bg-zinc-500",
  },
  deactivated: {
    key: "deactivated",
    label: "Deactivated",
    pillClass:
      "tw:bg-zinc-100 tw:text-zinc-700",
    dotClass: "tw:bg-zinc-500",
  },
};

const STATUS_ALIASES = {
  soon: "upcoming",
  completed: "ended",
  past: "ended",
  canceled: "cancelled",
  did_not_hold: "cancelled",
  "did-not-hold": "cancelled",
  "did not hold": "cancelled",
};

export function normalizeEventStatus(status) {
  const normalized = (status ?? "").toString().toLowerCase().trim();
  const key = STATUS_ALIASES[normalized] || normalized || "upcoming";
  return EVENT_STATUS_META[key]?.key || "upcoming";
}

export function getEventStatusMeta(status) {
  return EVENT_STATUS_META[normalizeEventStatus(status)] || EVENT_STATUS_META.upcoming;
}
