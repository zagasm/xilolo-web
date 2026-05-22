import React, { Fragment, useMemo, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import { FileText, X } from "lucide-react";
import { formatEventDateTime } from "../../utils/ui";
import { priceText } from "./SingleEvent";

const hiddenScrollbarStyle = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

function getAmountLabel(amount, fallback, prefix = "") {
  if (fallback) return fallback;
  if (!amount) return "Free";
  return `${prefix}${Number(amount).toLocaleString("en-NG")}`;
}

export default function TicketPromptModal({
  open,
  onClose,
  event,
  onBuy,
  onDownloadManual,
  buying = false,
}) {
  const [selectedPurchaseType, setSelectedPurchaseType] = useState("ticket_only");
  const [quantity, setQuantity] = useState(1);

  const poster = event?.poster?.[0]?.url || "/images/event-dummy.jpg";
  const priceLabel = priceText(event);
  const dateLabel = formatEventDateTime(event?.eventDate, event?.startTime);
  const manual = event?.manual || {};
  const purchaseOptions = event?.purchase_options || {};
  const ticketAmount = Number(event?.price ?? 0);
  const manualAmount = Number(manual?.price ?? 0);
  const combinedAmount = ticketAmount + manualAmount;
  const hasManualAccess = !!manual?.viewer_has_access;

  const options = useMemo(() => {
    const list = [];

    if (purchaseOptions.ticket_only) {
      list.push({
        value: "ticket_only",
        label: "Ticket only",
        amountLabel: getAmountLabel(
          ticketAmount,
          event?.price_display,
          event?.currency?.symbol || ""
        ),
        description: "Standard ticket purchase.",
      });
    }

    if (event?.user_can_sponsor_tickets && ticketAmount > 0) {
      list.push({
        value: "sponsored_only",
        label: "Sponsor tickets",
        amountLabel: getAmountLabel(
          ticketAmount,
          event?.price_display,
          event?.currency?.symbol || ""
        ),
        description: "Pay for tickets that other users can claim.",
      });
    }

    if (purchaseOptions.ticket_and_manual && !hasManualAccess) {
      list.push({
        value: "ticket_and_manual",
        label: "Ticket + manual",
        amountLabel:
          combinedAmount > 0
            ? `${event?.currency?.symbol || ""}${combinedAmount.toLocaleString("en-NG")}`
            : event?.price_display,
        description: "Buy your ticket together with the paid event manual.",
      });
    }

    if (purchaseOptions.manual_only && !hasManualAccess) {
      list.push({
        value: "manual_only",
        label: "Manual only",
        amountLabel: getAmountLabel(
          manualAmount,
          manual?.price_display,
          event?.currency?.symbol || ""
        ),
        description: "Unlock the manual without buying another ticket.",
      });
    }

    return list;
  }, [
    combinedAmount,
    event?.currency?.symbol,
    event?.price_display,
    event?.user_can_sponsor_tickets,
    hasManualAccess,
    manual?.price_display,
    manualAmount,
    purchaseOptions.manual_only,
    purchaseOptions.ticket_and_manual,
    purchaseOptions.ticket_only,
    ticketAmount,
  ]);

  React.useEffect(() => {
    if (!open) return;
    setSelectedPurchaseType(options[0]?.value || "ticket_only");
    setQuantity(1);
  }, [open, options]);

  if (!event) return null;

  const selectedOption =
    options.find((option) => option.value === selectedPurchaseType) || options[0];
  const canChooseQuantity =
    selectedOption?.value === "ticket_only" ||
    selectedOption?.value === "ticket_and_manual" ||
    selectedOption?.value === "sponsored_only";
  const normalizedQuantity = canChooseQuantity
    ? Math.min(100, Math.max(1, Number(quantity) || 1))
    : 1;
  const selectedBaseAmount =
    selectedOption?.value === "ticket_and_manual"
      ? ticketAmount * normalizedQuantity + manualAmount
      : selectedOption?.value === "manual_only"
        ? manualAmount
        : ticketAmount * normalizedQuantity;
  const selectedTotalLabel =
    selectedBaseAmount > 0
      ? `${event?.currency?.symbol || ""}${selectedBaseAmount.toLocaleString("en-NG")}`
      : "Free";
  const buyerTicketCount = selectedOption?.value === "sponsored_only" ? 0 : 1;
  const sponsoredCount =
    selectedOption?.value === "sponsored_only"
      ? normalizedQuantity
      : Math.max(0, normalizedQuantity - 1);

  return (
    <Transition.Root show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-300"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-200"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:z-40 tw:bg-black/60" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-center tw:justify-center tw:p-3 tw:sm:items-center tw:sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="tw:ease-out tw:duration-300"
            enterFrom="tw:opacity-0 tw:scale-95"
            enterTo="tw:opacity-100 tw:scale-100"
            leave="tw:ease-in tw:duration-200"
            leaveFrom="tw:opacity-100 tw:scale-100"
            leaveTo="tw:opacity-0 tw:scale-95"
          >
            <DialogPanel className="tw:relative tw:z-50 tw:flex tw:w-full tw:max-w-lg tw:max-h-[76dvh] tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:p-2 tw:text-left tw:shadow-xl tw:sm:max-h-[78vh] tw:sm:rounded-3xl tw:sm:p-4">
              <div className="tw:flex tw:justify-end tw:pb-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="tw:rounded-full tw:p-1.5 tw:transition tw:duration-150 tw:hover:bg-gray-100"
                >
                  <X className="tw:h-4 tw:w-4 tw:text-gray-500" />
                </button>
              </div>

              <div
                className="tw:flex-1 tw:overflow-y-auto"
                style={hiddenScrollbarStyle}
              >
                <style>{`.xilolo-ticket-modal-scroll::-webkit-scrollbar{display:none;}`}</style>
                <div className="xilolo-ticket-modal-scroll tw:space-y-2 tw:overflow-y-auto tw:pr-1 tw:sm:space-y-3" style={hiddenScrollbarStyle}>
                  <div className="tw:grid tw:grid-cols-1 tw:gap-1.5 tw:sm:gap-3 tw:md:grid-cols-[160px_minmax(0,1fr)]">
                    <div className="tw:hidden tw:md:block tw:overflow-hidden tw:rounded-2xl tw:bg-gray-100 tw:shadow-inner">
                      <img
                        src={poster}
                        alt={event?.title || "Event"}
                        className="tw:h-20 tw:w-full tw:object-cover tw:sm:h-32 tw:md:h-full tw:md:min-h-[132px]"
                        loading="lazy"
                      />
                    </div>

                    <div className="tw:space-y-1.5 tw:sm:space-y-2">
                      <div className="tw:space-y-1">
                        <span className="tw:block tw:text-base tw:font-semibold tw:leading-tight tw:text-gray-900 tw:sm:text-lg">
                          {event?.title}
                        </span>
                        <span className="tw:block tw:text-[11px] tw:text-gray-500 tw:sm:text-sm">
                          {dateLabel}
                        </span>
                      </div>

                      <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-2 tw:sm:p-3">
                        <span className="tw:block tw:text-[11px] tw:text-gray-500 tw:sm:text-sm">
                          Ticket price
                        </span>
                        <span className="tw:block tw:text-lg tw:font-bold tw:text-black tw:sm:text-xl">
                          {priceLabel}
                        </span>
                      </div>

                      {manual?.available && (
                        <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-2 tw:sm:p-3">
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                            <div className="tw:flex tw:items-center tw:gap-2">
                              <span className="tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-[#f3f4ff] tw:text-primary">
                                <FileText className="tw:h-4 tw:w-4" />
                              </span>
                              <div>
                                <div className="tw:text-xs tw:font-semibold tw:text-slate-900 tw:sm:text-sm">
                                  Event manual
                                </div>
                                <div className="tw:text-[10px] tw:text-slate-500 tw:sm:text-xs">
                                  {manual?.file_name || "Soft-copy manual"}
                                </div>
                              </div>
                            </div>
                            <div className="tw:text-xs tw:font-semibold tw:text-slate-900 tw:sm:text-sm">
                              {manual?.price_display || "Included"}
                            </div>
                          </div>

                          {hasManualAccess ? (
                            <button
                              type="button"
                              onClick={onDownloadManual}
                              className="tw:mt-2 tw:w-full tw:rounded-[16px] tw:border tw:border-primary/20 tw:bg-primary/5 tw:py-2 tw:text-sm tw:font-semibold tw:text-primary hover:tw:bg-primary/10"
                            >
                              Download manual
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {options.length > 0 && (
                    <div className="tw:space-y-2">
                      <div className="tw:text-xs tw:font-semibold tw:text-slate-900">
                        Choose access
                      </div>
                      <div className="tw:grid tw:grid-cols-1 tw:gap-2">
                        {options.map((option) => {
                          const selected = option.value === selectedPurchaseType;
                          return (
                            <button
                              style={{
                                borderRadius: 16,
                              }}
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedPurchaseType(option.value)}
                              className={`tw:rounded-2xl tw:border tw:px-3 tw:py-2 tw:text-left tw:transition ${selected
                                ? "tw:border-primary tw:bg-primary/5"
                                : "tw:border-gray-200 tw:bg-white hover:tw:border-primary/30"
                                }`}
                            >
                              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                                <div>
                                  <div className="tw:text-xs tw:font-semibold tw:text-slate-900">
                                    {option.label}
                                  </div>
                                  <div className="tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-slate-500 tw:sm:text-xs tw:sm:leading-5">
                                    {option.description}
                                  </div>
                                </div>
                                <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                                  {option.amountLabel}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canChooseQuantity && (
                    <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
                      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                        <div>
                          <div className="tw:text-xs tw:font-semibold tw:text-slate-900">
                            Ticket quantity
                          </div>
                          <div className="tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-slate-500 tw:sm:text-xs">
                            {selectedOption?.value === "sponsored_only"
                              ? "All selected tickets become paid tickets other users can claim."
                              : "1 ticket is for you. Extra tickets become paid tickets other users can claim."}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={quantity}
                          onChange={(event) => setQuantity(event.target.value)}
                          onBlur={() => setQuantity(normalizedQuantity)}
                          className="tw:h-10 tw:w-20 tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:text-right tw:text-sm tw:font-semibold tw:outline-none focus:tw:border-primary"
                        />
                      </div>
                      <div className="tw:mt-2 tw:grid tw:grid-cols-2 tw:gap-2 tw:text-xs">
                        <div className="tw:rounded-xl tw:bg-gray-50 tw:p-2">
                          <span className="tw:block tw:text-slate-500">For you</span>
                          <span className="tw:font-semibold tw:text-slate-900">
                            {buyerTicketCount} ticket{buyerTicketCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="tw:rounded-xl tw:bg-gray-50 tw:p-2">
                          <span className="tw:block tw:text-slate-500">Sponsored</span>
                          <span className="tw:font-semibold tw:text-slate-900">
                            {sponsoredCount} ticket{sponsoredCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:rounded-xl tw:bg-primary/5 tw:p-2.5">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-600">Wallet total</span>
                        <span className="tw:text-sm tw:font-bold tw:text-slate-900">{selectedTotalLabel}</span>
                      </div>
                    </div>
                  )}

                  <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-1">
                    {selectedOption && (
                      <button
                        style={{
                          borderRadius: 24,
                        }}
                        type="button"
                        onClick={() => onBuy(selectedOption.value, normalizedQuantity)}
                        disabled={buying}
                        className="tw:w-full tw:rounded-[16px] tw:bg-primary tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:duration-150 hover:brightness-90 tw:disabled:cursor-not-allowed tw:disabled:opacity-70"
                      >
                        {buying
                          ? "Processing purchase..."
                          : `Continue with ${selectedOption.label} (${selectedTotalLabel})`}
                      </button>
                    )}

                    <button
                      style={{
                        borderRadius: 24,
                      }}
                      type="button"
                      onClick={onClose}
                      className="tw:w-full tw:rounded-[16px] tw:border tw:border-gray-200 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-700 tw:transition tw:duration-150 tw:hover:bg-gray-100"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
