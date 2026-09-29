import React from "react";
import { useSearchParams } from "react-router-dom";
import EventCreationWizard from "./EventForm/EventCreationWizard";

/*
 * DEV-only preview of the create-event flow (/dev/create-event-preview?step=1|2|3).
 *
 * /event/create-event/:eventTypeId is auth-gated, so this route renders the REAL
 * wizard (no duplicated markup) with a fixture event and a forced step, so each
 * step of the flow can be measured + screenshotted at any width without an
 * account. It 404s in production (see the route guard in src/app.jsx).
 */

const PREVIEW_TIMEZONES = [
  { id: "1", name: "Africa/Lagos", gmt_offset: "+01:00" },
  { id: "2", name: "Europe/London", gmt_offset: "+00:00" },
  { id: "3", name: "America/New_York", gmt_offset: "-05:00" },
];

const PREVIEW_EVENT = {
  currentEvent: {
    id: 991,
    title: "The Weekend Show",
    description:
      "A live Afrobeats showcase streaming from Lagos with guest performers and a replay window after the event ends.",
    location: "Online",
    organizer: { name: "Ada Obi" },
    genre: "Music",
    event_date: "2026-05-16",
    eventDateISO: "2026-05-16T19:00:00Z",
    start_time: "19:00",
    timezone_id: "1",
    price: 7500,
    max_tickets: 0,
    currency: { id: "1", code: "NGN" },
    delivery_type: "live",
    attendance_type: "online",
    streaming_option: "in_app",
    visibility: "public",
    mature_content: false,
    enable_replay: true,
    replay_available_after_minutes: 120,
    replay_available_for_minutes: 1440,
    manual: { available: false },
    poster: [],
  },
};

export default function CreateEventPreview() {
  const [params] = useSearchParams();
  const step = Math.min(3, Math.max(1, Number(params.get("step") || 1)));

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:font-sans">
      <EventCreationWizard
        eventTypeId="1"
        previewStep={step}
        previewTimeZones={PREVIEW_TIMEZONES}
        initialEvent={PREVIEW_EVENT}
      />
    </div>
  );
}
