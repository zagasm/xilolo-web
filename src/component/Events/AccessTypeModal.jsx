import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Ticket, ChevronRight } from "lucide-react";

export default function AccessTypeModal({ open, onClose, event, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => {
    if (!event) return [];

    const base = [];

    // Main access (regular ticket)
    base.push({
      id: "main",
      label: "Main Access",
      description: "Enjoy the full main event experience.",
      price: event.price_display || "—",
      badge: "Popular",
    });

    // Backstage
    if (event.hasBackstage && event.backstage_price_display) {
      base.push({
        id: "backstage",
        label: "Backstage Access",
        description: "Exclusive access behind the scenes with performers.",
        price: event.backstage_price_display,
        badge: "Exclusive",
      });
    }

    // Bundle / Combined
    if (event.combined_price_display) {
      base.push({
        id: "bundle",
        label: "Bundle (Main + Backstage)",
        description: "Everything in one: main experience plus backstage.",
        price: event.combined_price_display,
        badge: "Best value",
      });
    }

    return base;
  }, [event]);

  useEffect(() => {
    if (open) {
      // Set default option when modal opens
      if (options.length > 0) {
        setSelected(options[0].id);
      }
      setSubmitting(false);
    }
  }, [open, options]);

  const handleConfirmClick = async () => {
    if (!selected || !onConfirm) return;
    try {
      setSubmitting(true);
      await onConfirm(selected);
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/25" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:scale-95 tw:translate-y-2"
              enterTo="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leaveTo="tw:opacity-0 tw:scale-95 tw:translate-y-2"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-2xl tw:bg-white tw:px-5 tw:py-4 tw:shadow-[0_18px_45px_rgba(15,23,42,0.18)] tw:space-y-4">
                <div className="tw:flex tw:items-start tw:gap-3">
                  <div className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10">
                    <Ticket className="tw:w-5 tw:h-5 tw:text-primary" />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <span className="tw:text-lg tw:md:text-xl tw:font-semibold tw:text-gray-900">
                      Choose your access type
                    </span>
                    <Dialog.Description className="tw:mt-1 tw:text-xs tw:text-gray-500">
                      Select how you want to attend{" "}
                      <span className="tw:font-medium tw:text-gray-700">
                        {event.title}
                      </span>
                      . You can always upgrade later if available.
                    </Dialog.Description>
                  </div>
                </div>

                <div className="tw:space-y-2 tw:mt-1">
                  {options.map((opt) => {
                    const isActive = selected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelected(opt.id)}
                        className={`tw:w-full tw:text-left tw:rounded-2xl! tw:border tw:px-3.5 tw:py-3 tw:flex tw:items-center tw:gap-3 tw:transition tw:duration-150 ${
                          isActive
                            ? "tw:border-primary tw:bg-primary/5 tw:ring-1 tw:ring-primary/40"
                            : "tw:border-gray-200 tw:bg-white tw:hover:border-gray-300 tw:hover:bg-gray-50"
                        }`}
                      >
                        <div className="tw:flex-1">
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                            <div className="tw:flex tw:items-center tw:gap-2">
                              <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                                {opt.label}
                              </span>
                              {opt.badge && (
                                <span className="tw:text-[10px] tw:px-2 tw:py-0.5 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:font-medium">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                              {opt.price}
                            </span>
                          </div>
                          <p className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
                            {opt.description}
                          </p>
                        </div>
                        <ChevronRight className="tw:w-4 tw:h-4 tw:text-gray-300" />
                      </button>
                    );
                  })}
                </div>

                <div className="tw:flex tw:items-center tw:justify-between tw:pt-2 tw:border-t tw:border-gray-100">
                  <div className="tw:text-[11px] tw:text-gray-500">
                    Your ticket will be purchased directly from your user wallet balance.
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="tw:inline-flex tw:h-9 tw:items-center tw:justify-center tw:px-3.5 tw:text-xs tw:font-medium tw:text-gray-700 tw:bg-gray-50 tw:rounded-full! tw:hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClick}
                    disabled={!selected || submitting}
                    className={`tw:inline-flex tw:h-9 tw:items-center tw:justify-center tw:px-4 tw:text-xs tw:font-semibold tw:rounded-full! tw:text-white ${
                      submitting
                        ? "tw:bg-primary/60 tw:cursor-wait"
                        : "tw:bg-primary tw:hover:bg-primarySecond"
                    }`}
                  >
                    {submitting ? "Processing…" : "Continue"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
