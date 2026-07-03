import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Ticket from "../../component/Ticket/Ticket";
import TicketReceiptModal from "../../component/Ticket/TicketViewModal";
import { api, authHeaders } from "../../lib/apiClient";
import { showError } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowRight,
  CalendarRange,
  Radio,
  RefreshCcw,
  TicketIcon,
} from "lucide-react";
import { normalizeTicketStatus } from "../../utils/ticketHelpers";
import StatusFilter from "../../component/ui/StatusFilter";

const CACHE_KEY = "Xilolo_tickets_cache_v1";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
];

/** Same logic as in Ticket, but kept here for filtering */
function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("all");

  // load from cache first
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setTickets(parsed);
      } catch (_) { }
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

  const handleViewReceipt = (ticket) => {
    setSelectedTicket(ticket);
    setReceiptOpen(true);
  };

  const closeReceipt = () => {
    setReceiptOpen(false);
    setSelectedTicket(null);
  };

  const showEmpty = initialLoaded && !loading && tickets.length === 0;

  // Attach phase (upcoming/live/ended) to each ticket for UI + filtering
  const ticketsWithPhase = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        phase: normalizeTicketStatus(t.event?.status),
      })),
    [tickets]
  );

  const counts = useMemo(() => {
    const upcoming = ticketsWithPhase.filter(
      (t) => t.phase === "upcoming"
    ).length;
    const live = ticketsWithPhase.filter((t) => t.phase === "live").length;
    const ended = ticketsWithPhase.filter((t) => t.phase === "ended").length;
    return {
      all: ticketsWithPhase.length,
      upcoming,
      live,
      ended,
    };
  }, [ticketsWithPhase]);

  const filteredTickets = useMemo(() => {
    if (activeTab === "all") return ticketsWithPhase;
    return ticketsWithPhase.filter((t) => t.phase === activeTab);
  }, [ticketsWithPhase, activeTab]);

  const activeTabLabel =
    TABS.find((tab) => tab.key === activeTab)?.label || "All";

  const spotlightStats = [
    {
      label: "All passes",
      value: counts.all,
      note: "Everything you have secured on Xilolo.",
      icon: TicketIcon,
    },
    {
      label: "Upcoming",
      value: counts.upcoming,
      note: "Reserved experiences still ahead of you.",
      icon: CalendarRange,
    },
    {
      label: "Live now",
      value: counts.live,
      note: "Events you can jump into right away.",
      icon: Radio,
    },
  ];

  return (
    <div className="tw:font-sans">
      <div className="tw:min-h-screen tw:bg-[radial-gradient(circle_at_top,rgba(0,255,209,0.10),transparent_28%),linear-gradient(180deg,#f9faf8_0%,#ffffff_58%,#f4f5f2_100%)] tw:py-20 tw:md:pt-24">
        <div className="account_section" style={{ padding: 0 }}>
          <div className="tw:px-3 tw:py-5 tw:md:px-8 tw:md:py-8">
            <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1360px] tw:flex-col tw:gap-6">

              <section className="tw:rounded-4xl tw:border tw:border-white/80 tw:bg-white/80 tw:p-4 tw:shadow-[0_22px_56px_rgba(15,23,42,0.06)] tw:backdrop-blur tw:md:p-6">
                <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
                  <div>
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Current view
                    </div>
                    <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                      <span className="tw:text-2xl tw:font-black tw:tracking-[-0.03em] tw:text-primary">
                        {activeTabLabel}
                      </span>
                      <span className="tw:rounded-full tw:bg-lightPurple tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary">
                        {filteredTickets.length} result{filteredTickets.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="tw:mt-2 tw:text-sm tw:text-slate-500">
                      Filter your pass library by live, upcoming, or completed
                      experiences.
                    </p>
                  </div>

                  <div className="tw:w-full tw:max-w-[760px]">
                    <StatusFilter
                      value={activeTab}
                      onChange={setActiveTab}
                      options={TABS}
                      counts={counts}
                      label="Filter tickets by event status"
                    />
                  </div>
                </div>
              </section>

              {/* Error state */}
              {error && (
                <div className="tw:flex tw:items-center tw:justify-between tw:rounded-[28px] tw:border tw:border-red-100 tw:bg-red-50/90 tw:px-4 tw:py-3 tw:text-xs tw:text-red-700 tw:shadow-[0_16px_34px_rgba(127,29,29,0.06)] tw:md:text-sm">
                  <span>{error}</span>
                  <button
                    onClick={fetchTickets}
                    className="tw:text-xs tw:font-medium tw:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="row tw:mx-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="col-12 col-md-6 col-xl-4 tw:px-2 tw:mb-4">
                      <div className="tw:h-80 tw:w-full tw:animate-pulse tw:rounded-[30px] tw:border tw:border-white/80 tw:bg-[linear-gradient(180deg,#ffffff_0%,#f3f4f6_100%)] tw:shadow-[0_16px_40px_rgba(15,23,42,0.06)]" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {showEmpty && (
                <div className="tw:relative tw:overflow-hidden tw:rounded-[34px] tw:border tw:border-white/80 tw:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(229,228,226,0.88))] tw:px-5 tw:py-12 tw:text-center tw:shadow-[0_24px_64px_rgba(15,23,42,0.06)] tw:md:px-8 tw:md:py-16">
                  <div
                    aria-hidden
                    className="tw:absolute tw:left-1/2 tw:top-10 tw:h-28 tw:w-28 tw:-translate-x-1/2 tw:rounded-full tw:bg-neon/10 tw:blur-3xl"
                  />
                  <div className="tw:relative tw:mx-auto tw:flex tw:max-w-xl tw:flex-col tw:items-center tw:gap-4">
                    <div className="tw:flex tw:h-20 tw:w-20 tw:items-center tw:justify-center tw:rounded-[28px] tw:bg-primary tw:text-white tw:shadow-[0_18px_40px_rgba(5,5,5,0.22),0_0_20px_rgba(0,255,209,0.15)]">
                      <TicketIcon className="tw:h-8 tw:w-8" />
                    </div>
                    <div>
                      <h2 className="tw:text-2xl tw:font-black tw:tracking-[-0.03em] tw:text-primary">
                        Your ticket vault is still empty
                      </h2>
                      <p className="tw:mt-3 tw:text-sm tw:leading-7 tw:text-slate-500 tw:md:text-base">
                        The moment you buy into an event, your pass, payment record,
                        and receipt will land here ready for quick access.
                      </p>
                    </div>
                    <Link
                      to="/feed"
                      className="tw:inline-flex tw:h-12 tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-white/80 tw:bg-white/90 tw:px-5 tw:text-sm tw:font-semibold tw:text-slate-700 tw:shadow-[0_12px_30px_rgba(15,23,42,0.08)] tw:transition tw:hover:border-neon/35 tw:hover:text-primary"
                    >
                      Find your next event
                      <ArrowRight className="tw:h-4 tw:w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {!loading && !showEmpty && (
                <div key={activeTab} className="xilolo-ticket-results-motion">
                  {/* Tickets grid – Bootstrap columns (1 / 2 / 3) */}
                  {filteredTickets.length > 0 ? (
                    <div className="row tw:mx-0">
                      {filteredTickets.map((ticket) => (
                        <div
                          key={ticket.ticket_id}
                          className="col-12 col-md-6 col-xl-4 tw:px-2 tw:mb-4"
                        >
                          <Ticket
                            ticket={ticket}
                            phase={ticket.phase}
                            onViewReceipt={() => handleViewReceipt(ticket)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tw:rounded-[30px] tw:border tw:border-dashed tw:border-slate-200 tw:bg-white/75 tw:px-5 tw:py-12 tw:text-center tw:shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="tw:text-lg tw:font-semibold tw:text-primary">
                        No {activeTabLabel.toLowerCase()} tickets right now.
                      </div>
                      <p className="tw:mt-2 tw:text-sm tw:text-slate-500">
                        Switch filters or explore fresh events to fill this section.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Ticket / Receipt modal (unchanged) */}
      <TicketReceiptModal
        open={receiptOpen}
        onClose={closeReceipt}
        ticket={selectedTicket}
      />
    </div>
  );
}

export default TicketsPage;
