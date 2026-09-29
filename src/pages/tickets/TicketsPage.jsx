// src/pages/tickets/TicketsPage.jsx
//
// /tickets — web mirror of the app's Tickets tab.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   Screen  lib/features/presentation/screens/ticket/screens/ticket_screen.dart
//           scaffold bg paper            :76
//           app bar (56, px 20, title 28/w800, inbox chip 40x40 r12)  :84-138
//           filter pill row (px16/pt10, chip bg, r100, p4)            :141-172
//           list (vertical, 4 shimmer cards while loading)            :175-235
//           empty state card (max 360, r22, 82 circle accent@10%)     :187-194 + 262-337
//           segments (flex-1, r100, accent fill + white label)        :340-395
//   Card    lib/.../home_revamp/widgets/event_ticket_card.dart  -> ./EventTicketCard.jsx
//   Tabs    lib/core/widget/bottom_nav.dart:42 (Tickets -> TicketScreen)
//   Copy    lib/l10n/app_en.arb (tickets / all / upcoming / live / ended /
//           noTickets / youCanSecureATicketByPayingForAnEventAllTicketsWillShowHere)
//
// Section order top->bottom is the app's, 1:1: header row, filter pills,
// one-column list of 172px cards, centred empty-state card. The app is a single
// column at every width (no grid), so this page is too — the column is capped
// at 560px and centred so wide screens show the same card proportions instead
// of a 1300px-wide 172px-tall bar.
//
// Data is untouched: same CACHE_KEY/localStorage warm start, same
// GET /api/v1/ticket/list call, same normalizeTicketStatus phases, same
// TicketReceiptModal wiring.
//
// Legacy-cascade notes (src/styles/tailwind.css:88-111):
//   - `#root p { color: inherit }` kills any `tw:text-*` on a <p>, so every
//     coloured string here is a <div>/<span>.
//   - `header{ display:flex; height:40px; padding:30px }` ships unlayered in
//     src/style.css, so the app bar is a <div>, never a <header>.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox } from "lucide-react";

import { api, authHeaders } from "../../lib/apiClient";
import { showError } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import {
  formatTicketDate,
  formatTicketPrice,
  formatTicketTime,
  normalizeTicketStatus,
} from "../../utils/ticketHelpers";
import EventTicketCard, {
  EventTicketCardShimmer,
  resolvePosterUrl,
} from "./EventTicketCard";
import "./tickets.css";

// Exported so the detail route (/tickets/:ticketId) can warm-start from the
// same cache and re-use the same payload shape.
export const CACHE_KEY = "Xilolo_tickets_cache_v1";

/** app: l10n all / upcoming / live / ended (ticket_screen.dart:68-73). */
export const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
];

/** Slack between cards: app card margin v8 + list padding-bottom 10 = 26px. */
export const TICKET_ROW = "tw:px-4 tw:pt-2 tw:pb-[18px]";

/** app bar — ticket_screen.dart:84-138 (56 high, 20 gutters, inbox chip). */
export function TicketsHeader() {
  return (
    <div className="tw:flex tw:h-14 tw:items-center tw:px-5">
      <h1 className="tw:m-0! tw:text-[28px]! tw:font-extrabold! tw:leading-none tw:tracking-[-0.3px]! tw:text-body">
        Tickets
      </h1>
      <div
        aria-hidden="true"
        className="tw:ml-auto tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-chip tw:text-muted"
      >
        <Inbox className="tw:size-5" />
      </div>
    </div>
  );
}

/** filter selector — ticket_screen.dart:141-172 + _TicketFilterSegment :340-395. */
export function TicketFilterPills({ tabs = TABS, value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Filter tickets by event status"
      className="tw:flex tw:rounded-full tw:border tw:border-hairline tw:bg-chip tw:p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={`tw:mx-0.5 tw:flex-1 tw:rounded-full tw:px-2.5 tw:py-[11px] tw:text-center tw:text-xs tw:transition-colors tw:duration-150 tw:ease-out ${
              selected
                ? "tw:bg-accent tw:font-bold tw:text-paper-raised tw:shadow-[0_4px_14px] tw:shadow-accent/25"
                : "tw:font-medium tw:text-muted tw:hover:text-body"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** empty state — ticket_screen.dart:262-337 (no CTA in the app). */
export function TicketEmptyState() {
  return (
    <div className="tw:px-5 tw:pt-8 tw:pb-10">
      <div className="tw:mx-auto tw:w-full tw:max-w-[360px] tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-[22px] tw:pt-6 tw:pb-[22px] tw:shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
        <div className="tw:mx-auto tw:flex tw:h-[82px] tw:w-[82px] tw:items-center tw:justify-center tw:rounded-full tw:bg-accent/10">
          {/* app: ImageView.asset(tickets_empty, width: 48, color: accent) —
              ColorFilter.mode(accent, srcIn) == a CSS mask over a flat accent
              fill. The app's own glyph is reused (public/images/tickets_empty.png). */}
          <div
            aria-hidden="true"
            className="xt-ticket-glyph tw:h-12 tw:w-12"
            style={{
              WebkitMaskImage: "url(/images/tickets_empty.png)",
              maskImage: "url(/images/tickets_empty.png)",
            }}
          />
        </div>
        <div className="tw:mt-[18px] tw:text-center tw:text-[17px] tw:font-extrabold tw:text-body">
          No Tickets
        </div>
        <div className="tw:mt-2 tw:text-center tw:text-[13px] tw:font-medium tw:leading-[1.45] tw:text-muted">
          You can secure a ticket by paying for an event. All tickets will show
          here.
        </div>
      </div>
    </div>
  );
}

/** Not in the app (it has no failure surface) — kept from the previous page. */
function ErrorStrip({ message, onRetry }) {
  return (
    <div className="tw:px-4 tw:pt-3">
      <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-danger/20 tw:bg-danger/5 tw:px-4 tw:py-3 tw:text-xs tw:text-danger">
        <span>{message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="tw:ml-auto tw:shrink-0 tw:text-xs tw:font-semibold tw:underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/** One card, wired exactly like the app's EventTicketCard(...) call site
 *  (ticket_screen.dart:210-231) — title, date, time, price, code, status, poster. */
export function TicketRow({ ticket, onViewReceipt }) {
  const event = ticket.event || {};
  const payment = ticket.payment || {};
  const status = event.status || ticket.status || "";

  return (
    <div className={TICKET_ROW}>
      <EventTicketCard
        title={event.title || "Event"}
        date={formatTicketDate(event.event_date)}
        time={formatTicketTime(event.start_time)}
        price={formatTicketPrice(
          payment.amount ?? event.price,
          payment.currency || event.currency || ""
        )}
        ticketCode={ticket.code || ""}
        status={status}
        imageUrl={resolvePosterUrl(event.poster)}
        onViewReceipt={() => onViewReceipt(ticket)}
      />
    </div>
  );
}

function TicketsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("all");

  // load from cache first
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setTickets(parsed);
      } catch (_) {}
    }
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/ticket/list", authHeaders(token));
      const list = res?.data?.data || [];
      setTickets(list);
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error(err);
      setError("Unable to load your tickets right now.");
      showError("Unable to load your tickets right now.");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  /**
   * A tap on a card opens the ticket's detail screen, exactly like the app
   * (ticket_screen.dart:226-230 -> pushRight(ReceiptScreen(ticket))).
   * The ticket travels in router state so the detail paints immediately; the
   * route re-resolves it from the same list payload on a hard refresh.
   */
  const handleViewReceipt = (ticket) => {
    const id = ticket?.ticket_id || ticket?.code;
    if (!id) return;
    navigate(`/tickets/${encodeURIComponent(id)}`, { state: { ticket } });
  };

  // Attach phase (upcoming/live/ended) to each ticket for filtering
  const ticketsWithPhase = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        phase: normalizeTicketStatus(t.event?.status),
      })),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    if (activeTab === "all") return ticketsWithPhase;
    return ticketsWithPhase.filter((t) => t.phase === activeTab);
  }, [ticketsWithPhase, activeTab]);

  const showEmpty = initialLoaded && !loading && filteredTickets.length === 0;

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pt-24 tw:pb-8 tw:font-sans">
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px]">
        <TicketsHeader />

        <div className="tw:px-4 tw:pt-2.5">
          <TicketFilterPills value={activeTab} onChange={setActiveTab} />
        </div>

        {error ? <ErrorStrip message={error} onRetry={fetchTickets} /> : null}

        {loading ? (
          // app: 4 EventTicketCardShimmer while isFetchingTickets
          // (ticket_screen.dart:178-185)
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={TICKET_ROW}>
                <EventTicketCardShimmer />
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <TicketEmptyState />
        ) : (
          <div>
            {filteredTickets.map((ticket) => (
              <TicketRow
                key={ticket.ticket_id || ticket.code}
                ticket={ticket}
                onViewReceipt={handleViewReceipt}
              />
            ))}
          </div>
        )}

        {/* app: SliverToBoxAdapter(SizedBox(height: 16)) — ticket_screen.dart:237 */}
        <div className="tw:h-4" />
      </div>

    </div>
  );
}

export default TicketsPage;
