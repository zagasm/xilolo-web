import React from "react";
import StatusFilter from "../ui/StatusFilter";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ready_to_go_live", label: "Ready to go live" },
  { key: "live", label: "Live" },
  { key: "paused", label: "Paused" },
  { key: "ended", label: "Ended" },
  { key: "expired", label: "Expired" },
];

export default function EventsFilterTabs({ value, onChange }) {
  return <StatusFilter value={value} onChange={onChange} options={FILTERS} />;
}
