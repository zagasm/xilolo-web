import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, authHeaders } from "../../lib/apiClient";
import { showError } from "../ui/toast";
import {
  formatPaymentMethodLabel,
  formatTicketDate,
  formatTicketPrice,
  formatTicketStatusLabel,
  formatTicketTime,
} from "../../utils/ticketHelpers";

export default function TicketReceiptModal({ open, onClose, ticket }) {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const event = ticket?.event || {};
  const organiser = ticket?.organiser || {};
  const user = ticket?.user || {};
  const payment = ticket?.payment || {};

  const dateLabel = formatTicketDate(event.event_date, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const timeLabel = formatTicketTime(event.start_time);

  const priceLabel = formatTicketPrice(
    payment.amount ?? event.price ?? event.fullPrice ?? "",
    payment.currency || event.currency || ""
  );

  const statusLabel = formatTicketStatusLabel(event.status);

  const paymentMethodLabel = formatPaymentMethodLabel(
    payment.payment_method || ticket?.payment_method
  );
  const qrCodeValue = ticket?.qr_code || ticket?.qrCode || ticket?.code || "";
  const organiserProfileId =
    organiser?.user_id ||
    organiser?.userId ||
    organiser?.id ||
    event?.organiserUserId ||
    event?.organiserId ||
    event?.hostId ||
    null;

  const handleViewEvent = () => {
    if (!event?.id) {
      return;
    }

    onClose?.();
    navigate(`/event/view/${event.id}`);
  };

  const handleViewOrganiserProfile = () => {
    if (!organiserProfileId) {
      return;
    }

    onClose?.();
    navigate(`/profile/${organiserProfileId}`);
  };

  const handleDownloadPdf = async () => {
    if (!ticket?.ticket_id || isDownloading) return;

    setIsDownloading(true);

    try {
      const response = await api.get(
        `/api/v1/ticket/${ticket.ticket_id}/download`,
        {
          ...authHeaders(),
          responseType: "blob",
        }
      );

      const disposition = response.headers?.["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename =
        filenameMatch?.[1] ||
        `xilolo-ticket-${ticket?.code?.slice(-8) || ticket.ticket_id}.pdf`;

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
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
          "Unable to download this ticket right now."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/50" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-center tw:justify-center tw:p-2 tw:sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-200 tw:ease-out"
            enterFrom="tw:opacity-0 tw:translate-y-3 tw:scale-95"
            enterTo="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leave="tw:transition tw:duration-150 tw:ease-in"
            leaveFrom="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leaveTo="tw:opacity-0 tw:translate-y-3 tw:scale-95"
          >
            <Dialog.Panel className="tw:relative tw:flex tw:w-full tw:max-w-md tw:max-h-[84dvh] tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-b tw:from-gray-50 tw:to-white tw:shadow-2xl tw:sm:max-w-lg tw:sm:max-h-[88vh] tw:sm:rounded-3xl">
              <div className="tw:h-14 tw:w-full tw:overflow-hidden tw:bg-gray-200 tw:sm:h-32">
                <img
                  src={event.poster || "/images/banner.png"}
                  alt={event.title || "Event cover"}
                  className="tw:h-full tw:w-full tw:object-cover"
                />
              </div>

              <div className="tw:flex-1 tw:space-y-3 tw:overflow-y-auto tw:p-3 tw:sm:space-y-5 tw:sm:p-5">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                  <div className="tw:space-y-1">
                    <span className="tw:block tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900 tw:sm:text-xl">
                      {event.title || "Event Ticket"}
                    </span>
                    <span className="tw:block tw:text-[9px] tw:font-medium tw:uppercase tw:tracking-[0.16em] tw:text-gray-500 tw:sm:text-[10px]">
                      Ticket • {statusLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-black/5 tw:text-gray-700 tw:hover:bg-black/10 tw:sm:h-8 tw:sm:w-8"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="tw:flex tw:overflow-hidden tw:rounded-2xl tw:border tw:border-gray-100 tw:bg-white tw:shadow-sm">
                  <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2.5 tw:p-3 tw:sm:gap-3 tw:sm:p-4">
                    {qrCodeValue ? (
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-4">
                        <div className="tw:rounded-2xl tw:bg-white tw:p-3 tw:shadow-sm">
                          <QRCodeSVG
                            value={qrCodeValue}
                            size={156}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <span className="tw:text-center tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.12em] tw:text-gray-500">
                          Ticket QR Code
                        </span>
                      </div>
                    ) : null}

                    <div className="tw:space-y-1">
                      <span className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:sm:text-sm">
                        {dateLabel}
                        {timeLabel && (
                          <>
                            <span className="tw:mx-1">•</span>
                            {timeLabel}
                          </>
                        )}
                      </span>
                    </div>

                    {(organiser.name || organiser.user_name) && (
                      <div className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:px-2.5 tw:py-2.5 tw:sm:gap-3 tw:sm:px-3 tw:sm:py-3">
                        <button
                          type="button"
                          onClick={handleViewOrganiserProfile}
                          disabled={!organiserProfileId}
                          className="tw:shrink-0 tw:rounded-full disabled:tw:cursor-default"
                          aria-label="View organiser profile"
                        >
                          <img
                            src={organiser.profile_image || "/images/avater_pix.avif"}
                            alt={organiser.name || "Organiser"}
                            className="tw:h-10 tw:w-10 tw:rounded-full tw:object-cover tw:sm:h-11 tw:sm:w-11"
                          />
                        </button>

                        <button
                          type="button"
                          onClick={handleViewOrganiserProfile}
                          disabled={!organiserProfileId}
                          className="tw:min-w-0 tw:flex-1 tw:text-left disabled:tw:cursor-default"
                        >
                          <span className="tw:block tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.12em] tw:text-gray-500 tw:sm:text-[11px]">
                            Organiser
                          </span>
                          <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900 tw:sm:text-[15px] hover:tw:text-primary">
                            {organiser.name || "Event organiser"}
                          </span>
                          {organiser.user_name && (
                            <span className="tw:block tw:truncate tw:text-[11px] tw:text-gray-500 tw:sm:text-xs">
                              @{organiser.user_name}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:text-[11px] tw:sm:gap-3 tw:sm:text-xs">
                      <div className="tw:flex tw:flex-col tw:gap-1">
                        <span className="tw:text-gray-500">Ticket Holder</span>
                        <span className="tw:font-medium tw:text-gray-900">
                          {user.name || "You"}
                        </span>
                      </div>

                      <div className="tw:flex tw:flex-col tw:gap-1 tw:text-right">
                        <span className="tw:text-gray-500">Ticket Code</span>
                        <span className="tw:break-all tw:font-mono tw:text-[9px] tw:text-gray-900 tw:sm:text-[11px]">
                          {ticket?.code}
                        </span>
                      </div>
                    </div>

                    <div className="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:border-t tw:border-dashed tw:border-gray-200 tw:pt-2 tw:text-[11px] tw:sm:grid-cols-3 tw:sm:gap-3 tw:sm:text-xs">
                      <div>
                        <span className="tw:mb-0.5 tw:block tw:text-[9px] tw:uppercase tw:tracking-[0.12em] tw:text-gray-500 tw:sm:text-[10px]">
                          Price
                        </span>
                        <span className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:sm:text-sm">
                          {priceLabel}
                        </span>
                      </div>

                      <div>
                        <span className="tw:mb-0.5 tw:block tw:text-[9px] tw:uppercase tw:tracking-[0.12em] tw:text-gray-500 tw:sm:text-[10px]">
                          Payment Method
                        </span>
                        <span className="tw:block tw:text-[10px] tw:font-medium tw:text-gray-900 tw:sm:text-xs">
                          {paymentMethodLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:flex-col tw:gap-2 tw:text-[10px] tw:text-gray-500 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:sm:gap-3 tw:sm:text-[11px]">
                  <span>
                    Need help?{" "}
                    <span className="tw:font-medium tw:text-primary">
                      support@xilolo.com
                    </span>
                  </span>

                  <div className="tw:flex tw:w-full tw:flex-col tw:gap-2 tw:sm:w-auto tw:sm:flex-row">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={!ticket?.ticket_id || isDownloading}
                      className="tw:rounded-full tw:border tw:border-gray-300 tw:bg-white tw:px-4 tw:py-2 tw:text-[11px] tw:font-semibold tw:text-gray-800 tw:transition-colors tw:hover:bg-gray-50 disabled:tw:cursor-not-allowed disabled:tw:opacity-60 tw:sm:text-xs"
                    >
                      {isDownloading ? "Downloading..." : "Download PDF"}
                    </button>

                    <button
                      type="button"
                      onClick={handleViewEvent}
                      disabled={!event?.id}
                      className="tw:rounded-full tw:border tw:border-gray-300 tw:bg-white tw:px-4 tw:py-2 tw:text-[11px] tw:font-semibold tw:text-gray-800 tw:transition-colors tw:hover:bg-gray-50 disabled:tw:cursor-not-allowed disabled:tw:opacity-60 tw:sm:text-xs"
                    >
                      View Event Details
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-[11px] tw:font-semibold tw:text-white tw:hover:bg-primarySecond tw:sm:text-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
