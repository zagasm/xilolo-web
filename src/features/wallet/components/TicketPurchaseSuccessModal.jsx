import React, { Fragment } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { CheckCircle2, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function TicketPurchaseSuccessModal({
  open,
  onClose,
  eventTitle,
  purchaseType = "ticket_only",
  includesManual = false,
  onDownloadManual,
}) {
  const title =
    purchaseType === "manual_only"
      ? "Manual purchased"
      : includesManual
      ? "Ticket and manual purchased"
      : "Ticket purchased";
  const description = eventTitle
    ? purchaseType === "manual_only"
      ? `The manual for "${eventTitle}" is now unlocked.`
      : includesManual
      ? `Your ticket and manual for "${eventTitle}" are now ready.`
      : `Your ticket for "${eventTitle}" is now ready in My Tickets.`
    : purchaseType === "manual_only"
    ? "Your manual is now unlocked."
    : includesManual
    ? "Your ticket and manual are now ready."
    : "Your ticket is now ready in My Tickets.";

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:bg-black/45" />
        </TransitionChild>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <TransitionChild
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:translate-y-2 tw:sm:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-2 tw:sm:scale-95"
            >
              <DialogPanel className="tw:w-full tw:max-w-md tw:rounded-[28px] tw:bg-white tw:p-6 tw:shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
                <div className="tw:flex tw:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-500 tw:hover:bg-gray-200"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:mt-2 tw:flex tw:flex-col tw:items-center tw:text-center">
                  <span className="tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-100 tw:text-emerald-600">
                    <CheckCircle2 className="tw:h-8 tw:w-8" />
                  </span>
                  <span className="tw:block tw:mt-5 tw:text-2xl tw:font-semibold tw:text-gray-900">
                    {title}
                  </span>
                  <Dialog.Description className="tw:mt-2 tw:block tw:text-sm tw:text-gray-500">
                    {description}
                  </Dialog.Description>
                </div>

                <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-3">
                  {includesManual && onDownloadManual && (
                    <button
                      type="button"
                      onClick={onDownloadManual}
                      className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:px-5 tw:text-sm tw:font-semibold tw:text-primary tw:hover:bg-primary/15"
                      style={{ borderRadius: 16 }}
                    >
                      Download manual
                    </button>
                  )}
                  <Link
                    to="/tickets"
                    onClick={onClose}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                    style={{ borderRadius: 16, color: "#fff" }}
                  >
                    View my tickets
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                    style={{ borderRadius: 16 }}
                  >
                    Continue browsing
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
