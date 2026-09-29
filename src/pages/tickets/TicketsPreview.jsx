/**
 * /dev/tickets-preview — DEV-ONLY preview of /tickets.
 *
 * WHY IT EXISTS: /tickets sits inside the auth gate (src/App.jsx:514,524), so the
 * real screen cannot be screenshotted or measured without an account. This route
 * renders the REAL presentation pieces of ./TicketsPage.jsx (TicketsHeader,
 * TicketFilterPills, TicketEmptyState, TicketRow, TICKET_ROW) plus the real card
 * from ./EventTicketCard.jsx, inside the real shell (the same Navbar, the same
 * page offset) with mock tickets and no API calls.
 *
 * It is registered in src/App.jsx behind `import.meta.env.DEV`, so it 404s in
 * production. Kept on purpose: it is how this page gets verified at 390, 768 and
 * 1440 without signing in.
 *
 * Query options:
 *   /dev/tickets-preview                   All tab, 5 mock tickets
 *   /dev/tickets-preview?tab=upcoming      Upcoming tab
 *   /dev/tickets-preview?tab=live          Live tab
 *   /dev/tickets-preview?tab=ended         Ended tab
 *   /dev/tickets-preview?state=loading     4 shimmer cards
 *   /dev/tickets-preview?state=empty       empty state
 *   /dev/tickets-preview?state=error       error strip + empty state
 */
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

import SEO from "../../component/SEO";
import Navbar from "../pageAssets/Navbar";
import { EventTicketCardShimmer } from "./EventTicketCard";
import {
  TICKET_ROW,
  TicketEmptyState,
  TicketFilterPills,
  TicketRow,
  TicketsHeader,
} from "./TicketsPage";

/* Fixtures for the preview only — never rendered in production. Shapes mirror
   what GET /api/v1/ticket/list returns (event.poster[] + payment.amount). */
const MOCK_TICKETS = [
  {
    ticket_id: "mock-upcoming-1",
    code: "XIL-8F42-QK1",
    event: {
      title: "afrobeats night with the lagos philharmonic",
      status: "upcoming",
      event_date: "2026-11-12",
      start_time: "20:00",
      poster: [{ url: "/images/photos/livemusic.jpg", type: "image" }],
      price: "7500",
      currency: "₦",
    },
    payment: { amount: "7500", currency: "₦" },
  },
  {
    ticket_id: "mock-live-1",
    code: "XIL-2C90-LV7",
    event: {
      title: "lagos tech summit — day two",
      status: "live",
      event_date: "2026-09-29",
      start_time: "19:00",
      poster: [{ url: "/images/photos/first.jpg", type: "image" }],
      price: "15000",
      currency: "₦",
    },
    payment: { amount: "15000", currency: "₦" },
  },
  {
    ticket_id: "mock-ended-1",
    code: "XIL-71AB-ED3",
    event: {
      title: "replay: product builders salon",
      status: "ended",
      event_date: "2026-09-10",
      start_time: "18:00",
      /* first poster entry is not an image -> exercises resolvePosterUrl() */
      poster: [
        { url: "", type: "video" },
        { url: "/images/photos/second.jpg", type: "image" },
      ],
      price: "2000",
      currency: "₦",
    },
    payment: { amount: "2000", currency: "₦" },
  },
  {
    ticket_id: "mock-noposter-1",
    code: "XIL-45DE-NP9",
    event: {
      title: "creators in abuja: community meetup",
      status: "upcoming",
      event_date: "2026-11-20",
      start_time: "17:30",
      poster: [],
      price: "Free",
      currency: "",
    },
    payment: { amount: "", currency: "" },
  },
  {
    ticket_id: "mock-upcoming-2",
    code: "XIL-93GH-UP5",
    event: {
      title: "studio lighting workshop",
      status: "upcoming",
      event_date: "2026-12-01",
      start_time: "10:00",
      poster: [{ url: "/images/photos/art.jpg", type: "image" }],
      price: "3000",
      currency: "₦",
    },
    payment: { amount: "3000", currency: "₦" },
  },
];

export default function TicketsPreview() {
  const [params] = useSearchParams();
  const state = params.get("state") || "";
  const [activeTab, setActiveTab] = useState(params.get("tab") || "all");

  const tickets = state === "empty" || state === "error" ? [] : MOCK_TICKETS;
  const filtered =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.event.status === activeTab);

  return (
    <>
      <SEO title="Tickets preview (dev) - Xilolo" noIndex />

      {/* The real shell, so the geometry under the Navbar is production-true. */}
      <Navbar />

      <div className="tw:min-h-screen tw:bg-paper tw:pt-24 tw:pb-8 tw:font-sans">
        <div className="tw:mx-auto tw:w-full tw:max-w-[560px]">
          <TicketsHeader />

          <div className="tw:px-4 tw:pt-2.5">
            <TicketFilterPills value={activeTab} onChange={setActiveTab} />
          </div>

          {state === "error" ? (
            <div className="tw:px-4 tw:pt-3">
              <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-danger/20 tw:bg-danger/5 tw:px-4 tw:py-3 tw:text-xs tw:text-danger">
                <span>Unable to load your tickets right now.</span>
                <button
                  type="button"
                  onClick={() => {}}
                  className="tw:ml-auto tw:shrink-0 tw:text-xs tw:font-semibold tw:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {state === "loading" ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={TICKET_ROW}>
                  <EventTicketCardShimmer />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <TicketEmptyState />
          ) : (
            <div>
              {filtered.map((ticket) => (
                <TicketRow
                  key={ticket.ticket_id}
                  ticket={ticket}
                  onViewReceipt={() => {}}
                />
              ))}
            </div>
          )}

          <div className="tw:h-4" />

          <div className="tw:px-4">
            <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[11px] tw:text-muted-strong">
              DEV-ONLY preview (import.meta.env.DEV). Renders the real /tickets
              presentation with mock tickets and no API calls. Tab: {activeTab} ·
              state: {state || "list"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
