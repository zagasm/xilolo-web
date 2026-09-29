// src/pages/tickets/EventTicketCard.jsx
//
// Web mirror of the app's ticket card. DESIGN SOURCE OF TRUTH (read-only):
//   xilolo-app/lib/features/presentation/screens/home_revamp/widgets/event_ticket_card.dart
//     EventTicketCard        :10-327
//     _statusColor/_statusBg :38-56
//     _ImagePlaceholder      :330-346
//     _InfoColumn            :349-397
//     EventTicketCardShimmer :400-466
//   used by the app's Tickets tab -> lib/.../ticket/screens/ticket_screen.dart:210-231
//
// Anatomy copied line-for-line (all values are the app's, not new design):
//   card    h=172, radius 20, padding 10, bg paper-raised, border hairline  (:62-70)
//   poster  110 wide, radius 13, cover, top scrim 70px black 70%->0, star badge
//           22x22 black 55% at 10/10                                        (:75-135)
//   gap     12                                                             (:137)
//   eyebrow 'EVENT TICKET' 9px/ls1.6/w500 accent + 'View Receipt' 10px/w600 accent
//           with chevron 13                                               (:146-181)
//   title   14px/w800/ls0.4/1.3, UPPERCASE, 2 lines, fixed 40px box        (:186-200)
//   date    calendar 11px + 10px muted, gap 10, clock 11px + 10px muted    (:205-235)
//   rule    dashed hairline                                                (:240-257)
//   footer  TICKET CODE 9px/ls1.2/label + 11px/w700/ls0.6 muted (flex 2)
//           STATUS 9px label + pill 7.5px/w700/ls0.4 padding 8/3 radius 100
//           PRICE 9px label + value 13px/w700 (right aligned)             (:262-318)
//
// The app declares `tag`, `venueLine1` and `onJoinLiveStream` but never renders
// them (grep: no reference inside build()), so this card renders no venue and
// no organiser line either — the app shows neither.
import React from "react";
import { Calendar, ChevronRight, Clock, Image as ImageIcon, Star } from "lucide-react";

/**
 * Status pill colours — app: event_ticket_card.dart:38-56.
 * The app's raw hexes (#0EA5B4 upcoming / #FF383C live / #34C759 active /
 * #888888 ended) are NOT in the web token set, so each maps onto the nearest
 * design token instead of a one-off hex (see tailwind.css header: "Do not add
 * one-off colours here"). One deviation, flagged: the app's fallback is
 * WHITE-on-white-10% (dark-mode-only value, invisible on the light paper) —
 * unmapped statuses use ink-muted grey here so the pill stays readable.
 */
export function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("upcoming")) return "tw:bg-accent/15 tw:text-accent";
  if (s.includes("live")) return "tw:bg-danger/15 tw:text-danger";
  if (s.includes("active")) return "tw:bg-success/15 tw:text-success";
  return "tw:bg-ink-muted/15 tw:text-ink-muted"; // 'ended' + everything else
}

/** `event.poster` is a url string in the app and an array on the web API. */
export function resolvePosterUrl(poster) {
  if (Array.isArray(poster)) {
    return poster.find((item) => item?.type === "image" && item?.url)?.url || "";
  }
  return poster || "";
}

const SHIMMER_BOX = "xt-shimmer tw:rounded-[4px]";

export function EventTicketCardShimmer() {
  return (
    <div
      aria-hidden="true"
      className="tw:flex tw:h-[172px] tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[10px]"
    >
      <div className={`tw:w-[110px] tw:shrink-0 tw:rounded-[13px] ${SHIMMER_BOX}`} />
      <div className="tw:w-3 tw:shrink-0" />
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <div className="tw:flex tw:items-center">
          <div className={`tw:h-[9px] tw:w-20 ${SHIMMER_BOX}`} />
          <div className={`tw:ml-auto tw:h-[9px] tw:w-[70px] ${SHIMMER_BOX}`} />
        </div>
        <div className={`tw:mt-2 tw:h-[14px] tw:w-full ${SHIMMER_BOX}`} />
        <div className={`tw:mt-[5px] tw:h-[14px] tw:w-[140px] ${SHIMMER_BOX}`} />
        <div className={`tw:mt-auto tw:h-[10px] tw:w-[160px] ${SHIMMER_BOX}`} />
        <div className="tw:mt-auto tw:flex tw:items-center">
          <div className={`tw:h-5 tw:w-[70px] ${SHIMMER_BOX}`} />
          <div className={`tw:ml-3 tw:h-5 tw:w-[60px] ${SHIMMER_BOX}`} />
          <div className={`tw:ml-auto tw:h-5 tw:w-[55px] ${SHIMMER_BOX}`} />
        </div>
      </div>
    </div>
  );
}

export default function EventTicketCard({
  title,
  date,
  time,
  price,
  ticketCode,
  status,
  imageUrl,
  onViewReceipt,
}) {
  // app: status.replaceAll('_', ' ').toUpperCase()   event_ticket_card.dart:299
  const statusLabel = String(status || "").replace(/_/g, " ").toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onViewReceipt}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewReceipt?.();
        }
      }}
      className="tw:flex tw:h-[172px] tw:cursor-pointer tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[10px] tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent/45"
    >
      {/* ── LEFT: poster (app :75-135) ─────────────────────────────────── */}
      <div className="tw:relative tw:h-full tw:w-[110px] tw:shrink-0 tw:overflow-hidden tw:rounded-[13px] tw:bg-inner">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="tw:absolute tw:inset-0 tw:h-full tw:w-full tw:object-cover"
          />
        ) : (
          <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:text-faint">
            <ImageIcon className="tw:size-7" aria-hidden="true" />
          </div>
        )}

        {/* top gradient scrim — black 70% -> transparent over 70px */}
        <div
          aria-hidden="true"
          className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[70px] tw:bg-linear-to-b tw:from-black/70 tw:to-transparent"
        />

        {/* star badge — inset 10/10 so it clears the 13px radius */}
        <div
          aria-hidden="true"
          className="tw:absolute tw:left-[10px] tw:top-[10px] tw:flex tw:h-[22px] tw:w-[22px] tw:items-center tw:justify-center tw:rounded-full tw:bg-black/55"
        >
          <Star className="tw:size-3 tw:fill-white tw:text-white" />
        </div>
      </div>

      <div className="tw:w-3 tw:shrink-0" />

      {/* ── RIGHT: content (app :140-321) ──────────────────────────────── */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        {/* header row: eyebrow + View Receipt affordance */}
        <div className="tw:flex tw:items-center">
          <span className="tw:text-[9px] tw:font-medium tw:uppercase tw:tracking-[1.6px] tw:text-accent">
            Event Ticket
          </span>
          <span className="tw:ml-auto tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:font-semibold tw:text-accent">
            View Receipt
            <ChevronRight className="tw:size-[13px]" aria-hidden="true" />
          </span>
        </div>

        <div className="tw:h-[7px]" />

        {/* title — fixed 40px box so every card is the same size */}
        <div className="tw:line-clamp-2 tw:h-10 tw:text-[14px] tw:font-extrabold tw:uppercase tw:leading-[1.3] tw:tracking-[0.4px] tw:text-body">
          {title}
        </div>

        {/* date + time */}
        <div className="tw:mt-2 tw:flex tw:items-center tw:text-muted">
          <Calendar className="tw:mr-1 tw:size-[11px] tw:shrink-0" aria-hidden="true" />
          <span className="tw:text-[10px]">{date}</span>
          <Clock className="tw:ml-[10px] tw:mr-1 tw:size-[11px] tw:shrink-0" aria-hidden="true" />
          <span className="tw:text-[10px]">{time}</span>
        </div>

        {/* dashed divider */}
        <div aria-hidden="true" className="xt-dash-rule tw:my-[10px]" />

        {/* footer: ticket code | status | price */}
        <div className="tw:flex tw:items-end">
          <div className="tw:min-w-0 tw:flex-[2]">
            <div className="tw:text-[9px] tw:font-semibold tw:tracking-[1.2px] tw:text-ink-muted">
              TICKET CODE
            </div>
            <div className="tw:mt-[3px] tw:truncate tw:text-[11px] tw:font-bold tw:tracking-[0.6px] tw:text-muted">
              {ticketCode}
            </div>
          </div>

          <div className="tw:ml-3 tw:shrink-0">
            <div className="tw:text-[9px] tw:font-semibold tw:tracking-[1.2px] tw:text-ink-muted">
              STATUS
            </div>
            <div className="tw:mt-[3px]">
              <span
                className={`tw:inline-block tw:rounded-full tw:px-2 tw:py-[3px] tw:text-[7.5px] tw:font-bold tw:tracking-[0.4px] ${statusPillClass(
                  status
                )}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="tw:ml-auto tw:shrink-0 tw:text-right">
            <div className="tw:text-[9px] tw:font-semibold tw:tracking-[1.2px] tw:text-ink-muted">
              PRICE
            </div>
            <div className="tw:mt-[3px] tw:text-[13px] tw:font-bold tw:text-body">{price}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
