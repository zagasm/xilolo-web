import React from "react";
import "./ticket.css";
import {
  formatPaymentMethodLabel,
  formatTicketDate,
  formatTicketPrice,
  formatTicketTime,
  normalizeTicketStatus,
} from "../../utils/ticketHelpers";
import {
  CalendarDays,
  Receipt,
  Ticket as TicketIcon,
  Wallet,
} from "lucide-react";

const phaseStyles = {
  live: {
    label: "Live",
    classes: "tw:bg-red-100 tw:text-red-600",
    icon: (
      <svg
        className="tw:mr-1 tw:h-3 tw:w-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
      </svg>
    ),
  },
  upcoming: {
    label: "Upcoming",
    classes: "tw:bg-emerald-100 tw:text-emerald-600",
  },
  ended: {
    label: "Ended",
    classes: "tw:bg-gray-100 tw:text-gray-600",
  },
};

function Ticket({ ticket, phase: phaseProp, onViewReceipt }) {
  const event = ticket.event || {};
  const payment = ticket.payment || {};
  const title = event.title || "Event";

  const dateLabel = formatTicketDate(event.event_date);
  const timeLabel = formatTicketTime(event.start_time);
  const paymentMethodLabel = formatPaymentMethodLabel(
    payment.payment_method || ticket.payment_method
  );

  const phase = phaseProp || normalizeTicketStatus(event.status);
  const phaseDef = phaseStyles[phase] || phaseStyles.upcoming;

  const priceLabel = formatTicketPrice(
    payment.amount ?? event.price ?? event.fullPrice ?? "",
    payment.currency || event.currency || ""
  );

  return (
    <div className="ticket-wrapper">
      <div className="ticket-shell">
        <div className="ticket-hero">
          <img
            src={event.poster}
            alt={title}
            className="ticket-hero-image"
            
          />
          <div className="ticket-hero-overlay" />

          <div className="ticket-hero-content">
            <span
              className={`tw:inline-flex tw:w-fit tw:items-center tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[9px] tw:font-bold tw:uppercase tw:md:px-3 tw:md:text-[10px] ${phaseDef.classes}`}
            >
              {phaseDef.icon}
              {phaseDef.label}
            </span>

            <div className="tw:flex tw:items-end tw:justify-between tw:gap-4">
              <div className="tw:min-w-0">
                <span className="tw:block tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.16em] tw:text-white/75 tw:md:text-[11px]">
                  Event Ticket
                </span>
                <span className="tw:mt-1.5 tw:block tw:line-clamp-2 tw:text-base tw:font-semibold tw:leading-tight tw:text-white tw:md:mt-2 tw:md:text-lg">
                  {title}
                </span>
              </div>

              
            </div>
          </div>
        </div>

        <div className="ticket-body">
          <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-[minmax(0,1.2fr)_minmax(190px,0.8fr)]">
            <div className="tw:space-y-3">
              <div className="tw:flex tw:items-start tw:gap-2 tw:text-xs tw:text-slate-700 tw:md:text-sm">
                <CalendarDays className="tw:mt-0.5 tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:text-primary tw:md:h-4 tw:md:w-4" />
                <div className="tw:min-w-0">
                  <span className="tw:block tw:font-medium tw:text-slate-900">
                    {dateLabel}
                    {timeLabel ? ` • ${timeLabel}` : ""}
                  </span>
                </div>
              </div>

              <div className="tw:flex tw:items-start tw:gap-2 tw:text-xs tw:text-slate-700 tw:md:text-sm">
                <Wallet className="tw:mt-0.5 tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:text-primary tw:md:h-4 tw:md:w-4" />
                <div className="tw:min-w-0">
                  <span className="tw:block tw:font-medium tw:text-slate-900">
                    Payment Method: {paymentMethodLabel}
                  </span>
                  <span className="tw:block tw:break-all tw:text-[11px] tw:text-slate-500 tw:md:text-xs">
                    {ticket?.code || "Ticket code unavailable"}
                  </span>
                </div>
              </div>
            </div>

            <div className="ticket-price-block">
              <span className="ticket-price-label">Amount Paid</span>
              <span className="ticket-price-value">{priceLabel}</span>
            </div>
          </div>
        </div>

        <div className="ticket-divider" aria-hidden="true" />

        <div className="ticket-footer">
          <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-[11px] tw:text-slate-500 tw:md:text-xs">
            <Receipt className="tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:text-slate-400 tw:md:h-4 tw:md:w-4" />
            <span className="tw:truncate">
              Open your receipt for full payment and ticket details.
            </span>
          </div>

          <button
            style={{ borderRadius: 12, fontSize: 11 }}
            type="button"
            onClick={onViewReceipt}
            className="tw:inline-flex tw:h-10 tw:min-w-[132px] tw:items-center tw:justify-center tw:rounded-xl tw:bg-slate-950 tw:px-4 tw:text-xs tw:font-semibold tw:text-white tw:shadow-[0_12px_28px_rgba(0,0,0,0.16),0_0_16px_rgba(0,245,255,0.12)] tw:transition-colors tw:hover:bg-slate-800 tw:md:h-11 tw:md:min-w-[148px] tw:md:text-sm"
          >
            View Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default Ticket;
