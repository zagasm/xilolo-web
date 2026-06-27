import React, { useEffect, useMemo, useState } from "react";
import Ticket from "../../component/Ticket/Ticket";
import TicketReceiptModal from "../../component/Ticket/TicketViewModal";
import { api, authHeaders } from "../../lib/apiClient";
import { showError } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import { TicketIcon } from "lucide-react";
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

  return (
    <div className="tw:font-sans">
      <div className="tw:w-full tw:min-h-screen tw:bg-white tw:py-20 tw:md:pt-24 tw:lg:px-4">
        <div className="account_section" style={{ padding: 0 }}>
          <div className="tw:px-2 tw:py-4 tw:md:px-8 tw:md:py-8">
            <div className="tw:flex tw:flex-col tw:gap-6">
              {/* Header */}
              <div className="tw:flex tw:flex-col tw:gap-1">
                <span className="tw:text-xl tw:md:text-3xl tw:font-bold tw:text-gray-900">
                  Tickets
                </span>
                <span className="tw:block tw:text-xs tw:md:text-base tw:text-gray-500">
                  Access all your event tickets in one place.
                </span>
              </div>

              {/* Tabs */}
              <div className="tw:mt-2 tw:mb-4 tw:w-full">
                <StatusFilter
                  value={activeTab}
                  onChange={setActiveTab}
                  options={TABS}
                  counts={counts}
                  label="Filter tickets by event status"
                />
              </div>

              {/* Error state */}
              {error && (
                <div className="tw:flex tw:items-center tw:justify-between tw:rounded-2xl tw:bg-red-50 tw:border tw:border-red-100 tw:px-4 tw:py-3 tw:text-xs tw:text-red-700 tw:md:text-sm">
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
                <div className="row">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="col-12 col-md-12 col-lg-4 mb-4">
                      <div className="tw:animate-pulse tw:h-40 tw:bg-[#ffffff] tw:rounded-3xl tw:shadow-sm tw:w-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {showEmpty && (
                <div className="tw:mt-6 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:text-center tw:py-10 tw:bg-white tw:rounded-3xl">
                  <div className="tw:text-3xl tw:md:text-4xl">
                    <TicketIcon className="tw:text-primary" size={32} />
                  </div>
                  <span className="tw:text-sm tw:font-medium tw:text-gray-900 tw:md:text-base">
                    No tickets yet
                  </span>
                  <span className="tw:text-xs tw:text-gray-500 tw:max-w-md tw:md:text-sm">
                    When you buy tickets to an event, they will appear here with
                    their receipt and details.
                  </span>
                </div>
              )}

              {/* Tickets grid – Bootstrap columns (1 / 2 / 3) */}
              {!loading && filteredTickets.length > 0 && (
                <div className="row">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.ticket_id}
                      className="col-12 col-md-12 col-lg-6 col-xl-4 mb-4"
                    >
                      <Ticket
                        ticket={ticket}
                        phase={ticket.phase}
                        onViewReceipt={() => handleViewReceipt(ticket)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* No tickets in current tab but there are in others */}
              {!loading && !showEmpty && filteredTickets.length === 0 && (
                <div className="tw:py-10 tw:text-center tw:text-sm tw:text-gray-500 tw:md:text-base">
                  No {activeTab} tickets right now.
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
