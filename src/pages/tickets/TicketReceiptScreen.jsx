// src/pages/tickets/TicketReceiptScreen.jsx
//
// /tickets/:ticketId — web mirror of the screen the app opens when a ticket is
// tapped. DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//
//   List tap handler  lib/features/presentation/screens/ticket/screens/ticket_screen.dart:226-230
//                     (EventTicketCard onViewReceipt -> context.pushRight(ReceiptScreen(ticket)))
//   Detail screen     lib/features/presentation/screens/ticket/screens/view_receipt.dart
//     ReceiptScreen scaffold + AppBar('Receipt', centred, auto back) :320-334
//     ListView padding 16                                            :336-337
//     Order: card, View Event pill, Join live stream, Printable      :338-444
//     _ReceiptCard  (radius 28, bg card, blur30/y18 6% shadow)       :451-503
//     poster 170 tall, TOP corners radius 28, cover                  :507-527
//     _EventPosterFallback (#151515 + black .8->.4 scrim + icon)     :763-794
//     body padding 20                                                :529-530
//     icon circle 42, accent->accent@75 gradient, white ticket icon  :537-558
//     title 16/w700 (2 lines) + 'Ticket purchase' 12/w500 muted     :564-582
//     amount 18/w700 + currency code 11/w500 muted (right)           :587-608
//     divider hairline, 18 above / 18 below                          :612-614, :658-660, :683-685
//     section label 12/w600 muted, left ('Event details'...)        :616-626, 662-672, 687-697
//     'Date & time' = '<ordinal date>  •  <h:mm a>'                  :628-632 + :54-97
//     'Organizer' value in accent, tappable, verified tick 12        :634-656 + :99-124
//     'Ticket code'                                                  :674-678
//     _TicketQrBlock: centred white card, pad 14, radius 18,
//       hairline border, blur18/y10 4% shadow, QR 180 white bg      :718-761
//     'Ticket holder'                                                :681
//     'Status' (ticket.status ?? event.status, UPPERCASE)            :699 + :316
//     'Payment mode' upper-cased, _ -> ' ', only when non-empty      :701-706
//     'Paid on' = 'd MMM yyyy · h:mm a'                              :708 + :40-52
//     'View Event' pill, ink fill, radius 999, v16, open-in-new 18   :359-389
//     'Join live stream' red (#DC2626) pill, radius 999, play 20     :392-418
//     'Open Printable Ticket' AppButton h48/r12, accent fill, white  :422-441
//       (AppButton defaults: lib/core/widget/app_buttons.dart:44-84)
//     _ReceiptRow: label flex5 12/w500 muted, value flex8 13/w600
//       right-aligned, max 2 lines                                   :796-846
//
// DATA: no new endpoint. The app is handed the already-loaded TicketsData
// object; on the web the same object travels in router state from /tickets and
// is re-resolved from the same GET /api/v1/ticket/list payload (or the same
// localStorage warm cache) on a hard refresh. Nothing here invents a field.
//
// Legacy-cascade notes (src/styles/tailwind.css:88-111): every string is a
// div/span (never <p>, which the legacy `#root p{color:inherit}` greys out).
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Loader2,
  Play,
  Ticket as TicketIcon,
} from "lucide-react";

import { api, authHeaders } from "../../lib/apiClient";
import { showError } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import { formatTicketPrice, formatTicketTime } from "../../utils/ticketHelpers";
import { resolvePosterUrl } from "./EventTicketCard";
import { CACHE_KEY as TICKETS_CACHE_KEY } from "./TicketsPage";

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Date-only-safe split: `new Date("2026-11-12")` is UTC and can shift a day. */
function splitDateParts(raw) {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (match) {
    return { year: +match[1], month: +match[2], day: +match[3] };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

/**
 * app: `_formatOrdinalDate` (view_receipt.dart:54-83) -> '12th of November 2026'.
 * Local to this screen because the shared src/utils/ticketHelpers.js formats
 * the list card's compact date ("Nov 12, 2026") and is out of this task's scope.
 */
export function formatOrdinalDate(raw) {
  const parts = splitDateParts(raw);
  if (!parts) return "--";
  const { day, month, year } = parts;
  let suffix = "th";
  if (!(day >= 11 && day <= 13)) {
    if (day % 10 === 1) suffix = "st";
    else if (day % 10 === 2) suffix = "nd";
    else if (day % 10 === 3) suffix = "rd";
  }
  return `${day}${suffix} of ${MONTH_LONG[month - 1]} ${year}`;
}

/**
 * app: `_formatPaidOn` (view_receipt.dart:40-52) -> DateFormat('d MMM yyyy · h:mm a')
 * i.e. '29 Sep 2026 · 7:12 PM'. Computed from the same field the app uses,
 * payment.created_at.
 */
export function formatPaidOn(raw) {
  if (!raw || !String(raw).trim()) return "--";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return String(raw);
  const date = `${parsed.getDate()} ${MONTH_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`;
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** app: `_getOrganizerDisplayName` (view_receipt.dart:99-118). */
export function getOrganiserDisplayName(organiser) {
  if (!organiser) return "--";
  const userName = String(organiser.user_name ?? "").trim();
  if (userName) return userName[0].toUpperCase() + userName.slice(1);
  const name = String(organiser.name ?? "").trim();
  if (name) return name;
  return "--";
}

/** app: `_isOrganizerVerified` (view_receipt.dart:120-124). */
export function isOrganiserVerified(organiser) {
  if (!organiser) return false;
  return String(organiser.kyc_status ?? "").toLowerCase() === "verified";
}

/** Title on a brand fill is white (app: pal.onAccent -> ThemeData.estimateBrightnessForColor(accent)). */
const PILL_PRIMARY =
  "tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-transparent tw:bg-accent tw:text-[15px] tw:font-bold tw:text-white tw:transition-colors tw:hover:bg-accent-deep tw:disabled:cursor-not-allowed";

/** app: _ReceiptRow (view_receipt.dart:796-846) — label flex 5 / value flex 8. */
function ReceiptRow({ label, value, valueClassName = "" }) {
  return (
    <div className="tw:flex tw:items-start tw:gap-2">
      <div className="tw:min-w-0 tw:flex-[5] tw:text-xs tw:font-medium tw:text-muted">
        {label}
      </div>
      <div
        className={`tw:line-clamp-2 tw:min-w-0 tw:flex-[8] tw:text-right tw:text-[13px] tw:font-semibold tw:text-body ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

/** app: Divider(color: hairline, height: 1) with SizedBox(18) either side. */
function ReceiptDivider() {
  return (
    <div aria-hidden="true" className="tw:my-[18px] tw:h-px tw:bg-hairline" />
  );
}

/** app: section label (view_receipt.dart:616-626, 662-672, 687-697). */
function SectionLabel({ children }) {
  return (
    <div className="tw:mb-2 tw:text-left tw:text-xs tw:font-semibold tw:text-muted">
      {children}
    </div>
  );
}

/** app: _EventPosterFallback (view_receipt.dart:763-794). */
function PosterFallback() {
  return (
    <div className="tw:relative tw:h-full tw:w-full tw:bg-ink">
      <div
        aria-hidden="true"
        className="tw:absolute tw:inset-0 tw:bg-linear-to-t tw:from-black/80 tw:to-black/40"
      />
      <div className="tw:relative tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center">
        <Calendar className="tw:size-10 tw:text-white/75" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * app: _TicketQrBlock (view_receipt.dart:718-761).
 * Payload = qr_code ?? code (app: `qrCode?.trim().isNotEmpty ? qrCode : fallbackCode`);
 * an empty payload renders nothing at all (SizedBox.shrink()).
 */
function TicketQrBlock({ qrCode, fallbackCode }) {
  const value = String(qrCode ?? "").trim() || String(fallbackCode ?? "").trim();
  if (!value) return null;

  return (
    <div className="tw:pt-4 tw:pb-[10px]">
      <div className="tw:mx-auto tw:w-[208px] tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[14px] tw:shadow-[0_10px_18px_rgba(0,0,0,0.04)]">
        <QRCodeSVG
          value={value}
          size={180}
          level="L"
          bgColor="#FFFFFF"
          fgColor="#000000"
          includeMargin={false}
        />
      </div>
    </div>
  );
}

/** Web-only fallback: the app always receives the ticket object, so it has none. */
function DetailShell({ children }) {
  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pt-24 tw:pb-8 tw:font-sans">
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4">
        {children}
      </div>
    </div>
  );
}

export default function TicketReceiptScreen({
  // previewTicket / previewNotFound are preview-only (/dev/tickets-preview):
  // they skip the fetch (and every write) so the screen can be rendered and
  // screenshotted with no session. They are never passed in production.
  previewTicket = null,
  previewNotFound = false,
}) {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  // The app is handed the ticket by Navigator; the web gets it from the list's
  // router state and re-resolves it from the same payload on a cold load.
  const [ticket, setTicket] = useState(
    () => previewTicket || location.state?.ticket || null
  );
  const [loading, setLoading] = useState(
    () => !previewTicket && !previewNotFound && !location.state?.ticket
  );
  const [notFound, setNotFound] = useState(() => Boolean(previewNotFound));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // previewTicket is preview-only (/dev/tickets-preview) and skips the fetch
    // and every write entirely.
    if (previewTicket || previewNotFound) return undefined;

    const wanted = String(ticketId ?? "");
    const stateTicket = location.state?.ticket;
    if (
      stateTicket &&
      (String(stateTicket.ticket_id) === wanted ||
        String(stateTicket.code) === wanted)
    )
      return undefined;

    let cancelled = false;
    setLoading(true);

    const settle = (list) => {
      if (cancelled) return;
      const match = (list || []).find(
        (item) =>
          String(item?.ticket_id) === wanted || String(item?.code) === wanted
      );
      if (match) setTicket(match);
      else setNotFound(true);
      setLoading(false);
    };

    try {
      const cached = localStorage.getItem(TICKETS_CACHE_KEY);
      if (cached) settle(JSON.parse(cached));
    } catch (_) {
      /* ignore malformed cache */
    }

    (async () => {
      try {
        const res = await api.get("/api/v1/ticket/list", authHeaders(token));
        const list = res?.data?.data || [];
        try {
          localStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(list));
        } catch (_) {
          /* quota */
        }
        settle(list);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setLoading(false);
        setNotFound((prev) => prev || !ticket);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, previewTicket, previewNotFound]);

  /**
   * app: TicketProvider.openPrintableTicket (view_receipt.dart:139-155 +
   * :422-441). Same endpoint the web already used in component/Ticket/TicketViewModal.
   */
  const handlePrintableTicket = useCallback(async () => {
    const id = ticket?.ticket_id;
    if (!id || downloading) return;

    setDownloading(true);
    try {
      const response = await api.get(`/api/v1/ticket/${id}/download`, {
        ...authHeaders(token),
        responseType: "blob",
      });
      const disposition = response.headers?.["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename =
        filenameMatch?.[1] ||
        `xilolo-ticket-${ticket?.code?.slice(-8) || id}.pdf`;
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      showError(
        error?.response?.data?.message ||
          "Unable to download ticket. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }, [ticket, downloading, token]);

  const header = (
    <div className="tw:relative tw:mb-1 tw:flex tw:h-14 tw:items-center">
      <button
        type="button"
        onClick={() => navigate("/tickets")}
        aria-label="Back to tickets"
        className="tw:-ml-1 tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-body tw:transition-colors tw:hover:bg-chip"
      >
        <ArrowLeft className="tw:size-5" aria-hidden="true" />
      </button>
      {/* app: AppBar(title: 'Receipt', centerTitle: true) + theme titleTextStyle
          (app_design_system.dart:85-95 -> titleLarge w800 -> 22px/w800). */}
      <div className="tw:pointer-events-none tw:absolute tw:left-1/2 tw:-translate-x-1/2 tw:text-[22px] tw:font-extrabold tw:text-body">
        Receipt
      </div>
    </div>
  );

  if (loading) {
    return (
      <DetailShell>
        <div className="tw:flex tw:min-h-[50vh] tw:items-center tw:justify-center">
          <Loader2
            className="tw:size-6 tw:animate-spin tw:text-accent"
            aria-label="Loading ticket"
          />
        </div>
      </DetailShell>
    );
  }

  if (notFound || !ticket) {
    return (
      <DetailShell>
        <div className="tw:relative">
          {header}
          <div className="tw:mt-2 tw:rounded-[28px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-[22px] tw:pt-6 tw:pb-[22px] tw:text-center">
            <div className="tw:text-[17px] tw:font-extrabold tw:text-body">
              Ticket not found
            </div>
            <div className="tw:mt-2 tw:text-[13px] tw:font-medium tw:leading-[1.45] tw:text-muted">
              We could not load this ticket. Open it again from your tickets
              list.
            </div>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className={`${PILL_PRIMARY} tw:mt-5`}
            >
              Back to tickets
            </button>
          </div>
        </div>
      </DetailShell>
    );
  }

  const event = ticket.event || {};
  const payment = ticket.payment || {};
  const organiser = ticket.organiser || null;
  const holder = ticket.user || {};
  const posterUrl = resolvePosterUrl(event.poster);
  const currency = payment.currency || event.currency || "";
  // Same helper + same field the list card prints, so list and detail agree:
  // app: _formatAmount(payment?.amount ?? event?.price, currencySymbol) (:24-38).
  const amountLabel = formatTicketPrice(payment.amount ?? event.price, currency);
  const statusLabel = String(ticket.status || event.status || "")
    .replace(/_/g, " ")
    .toUpperCase();
  const paymentMode = String(payment.payment_method || "").trim();
  const isLive = String(event.status || "").toLowerCase() === "live";
  const organiserName = getOrganiserDisplayName(organiser);
  const organiserVerified = isOrganiserVerified(organiser);

  return (
    <DetailShell>
      <div className="tw:relative">
        {header}

        {/* app: _ReceiptCard (view_receipt.dart:451-716). Flat + hairline here
            instead of the app's blur30/y18 6% shadow (DESIGN.md: no drop
            shadows outside real overlays). */}
        <div className="tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-hairline tw:bg-paper-raised">
          <div className="tw:h-[170px] tw:w-full tw:overflow-hidden">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt=""
                className="tw:h-full tw:w-full tw:object-cover"
              />
            ) : (
              <PosterFallback />
            )}
          </div>

          <div className="tw:p-5">
            {/* title + amount */}
            <div className="tw:flex tw:items-start">
              <div
                aria-hidden="true"
                className="tw:flex tw:h-[42px] tw:w-[42px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-linear-to-br tw:from-accent tw:to-accent/75"
              >
                <TicketIcon className="tw:size-[22px] tw:text-white" />
              </div>
              <div className="tw:ml-3 tw:min-w-0 tw:flex-1">
                <div className="tw:line-clamp-2 tw:text-base tw:font-bold tw:text-body">
                  {event.title || ""}
                </div>
                <div className="tw:mt-1 tw:text-xs tw:font-medium tw:text-muted">
                  Ticket purchase
                </div>
              </div>
              <div className="tw:ml-2 tw:shrink-0 tw:text-right">
                <div className="tw:text-lg tw:font-bold tw:text-body">
                  {amountLabel}
                </div>
                <div className="tw:mt-0.5 tw:text-[11px] tw:font-medium tw:text-muted">
                  {currency}
                </div>
              </div>
            </div>

            <ReceiptDivider />

            <SectionLabel>Event details</SectionLabel>
            <ReceiptRow
              label="Date & time"
              value={`${formatOrdinalDate(event.event_date)}  •  ${formatTicketTime(
                event.start_time
              )}`}
            />
            <div className="tw:h-1.5" />
            <button
              type="button"
              disabled={!organiser?.user_id}
              onClick={() => navigate(`/profile/${organiser.user_id}`)}
              className="tw:block tw:w-full tw:text-left tw:disabled:cursor-default"
            >
              <div className="tw:flex tw:items-start tw:gap-2">
                <div className="tw:min-w-0 tw:flex-[5] tw:text-xs tw:font-medium tw:text-muted">
                  Organizer
                </div>
                <div className="tw:flex tw:min-w-0 tw:flex-[8] tw:items-center tw:justify-end tw:gap-2">
                  <span className="tw:line-clamp-2 tw:text-right tw:text-[13px] tw:font-semibold tw:text-accent">
                    {organiserName}
                  </span>
                  {organiserVerified ? (
                    <BadgeCheck
                      className="tw:size-3 tw:shrink-0 tw:text-accent"
                      aria-label="Verified organiser"
                    />
                  ) : null}
                </div>
              </div>
            </button>

            <ReceiptDivider />

            <SectionLabel>Ticket details</SectionLabel>
            <ReceiptRow label="Ticket code" value={ticket.code || ""} />
            <TicketQrBlock
              qrCode={ticket.qr_code || ticket.qrCode}
              fallbackCode={ticket.code}
            />
            <div className="tw:h-1.5" />
            <ReceiptRow label="Ticket holder" value={holder.name || ""} />

            <ReceiptDivider />

            <SectionLabel>Payment details</SectionLabel>
            <ReceiptRow label="Status" value={statusLabel} />
            {paymentMode ? (
              <>
                <div className="tw:h-1.5" />
                <ReceiptRow
                  label="Payment mode"
                  value={paymentMode.replace(/_/g, " ").toUpperCase()}
                />
              </>
            ) : null}
            <div className="tw:h-1.5" />
            <ReceiptRow label="Paid on" value={formatPaidOn(payment.created_at)} />
          </div>
        </div>

        {/* app: 'View Event' — ink fill, white label, radius 999 (view_receipt.dart:359-389).
            The app's ListView coerces its SizedBox(width: 230) to the full column
            width, so it renders full width here too. */}
        {event.id ? (
          <div className="tw:mt-4">
            <button
              type="button"
              onClick={() => navigate(`/event/view/${event.id}`)}
              className="tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-ink tw:bg-ink tw:text-sm tw:font-semibold tw:text-white tw:transition-colors tw:hover:bg-ink-raised"
            >
              <ExternalLink className="tw:size-[18px]" aria-hidden="true" />
              View Event
            </button>
          </div>
        ) : null}

        {/* app: 'Join live stream' — only while the event is live
            (view_receipt.dart:392-418, colour 0xFFDC2626 = tw:bg-danger). */}
        {isLive ? (
          <div className="tw:mt-4">
            <button
              type="button"
              onClick={() => navigate(`/event/view/${event.id}`)}
              className="tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:bg-danger tw:text-sm tw:font-semibold tw:text-white tw:transition-colors"
            >
              <Play className="tw:size-5" aria-hidden="true" />
              Join live stream
            </button>
          </div>
        ) : null}

        {/* app: 'Open Printable Ticket' — AppButton(h48, r12, accent fill, white
            label 15/w700), disabled without a ticket id (view_receipt.dart:422-441). */}
        <div className="tw:mt-[18px]">
          <button
            type="button"
            onClick={handlePrintableTicket}
            disabled={!ticket.ticket_id || downloading}
            className={`${PILL_PRIMARY} tw:rounded-xl tw:disabled:bg-accent tw:disabled:text-white/80`}
          >
            {downloading ? (
              <Loader2 className="tw:size-5 tw:animate-spin" aria-hidden="true" />
            ) : null}
            {downloading
              ? "Opening printable ticket..."
              : "Open Printable Ticket"}
          </button>
        </div>

        <div className="tw:h-[18px]" />
      </div>
    </DetailShell>
  );
}
