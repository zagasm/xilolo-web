import React, { Fragment } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Loader2, ShieldCheck, X } from "lucide-react";

export default function BlueBadgeSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  formattedPrice,
}) {
  return (
    <Transition show={isOpen} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={loading ? () => {} : onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:bg-black/50" />
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
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                  <div className="tw:flex tw:items-start tw:gap-3">
                    
                    <div>
                      <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
                        Subscribe to Xilolo badge
                      </span>
                      <span className="tw:block tw:mt-1 tw:text-sm tw:text-gray-500">
                        This will charge your wallet {formattedPrice} for one month of Xilolo badge verification.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-500 tw:hover:bg-gray-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:mt-6 tw:rounded-2xl tw:bg-[#f8fbff] tw:px-4 tw:py-4">
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                    <span className="tw:text-sm tw:text-gray-500">Monthly price</span>
                    <span className="tw:text-base tw:font-semibold tw:text-gray-900">
                      {formattedPrice}
                    </span>
                  </div>
                  <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-4">
                    <span className="tw:text-sm tw:text-gray-500">Payment source</span>
                    <span className="tw:text-sm tw:font-medium tw:text-primary">
                      Wallet balance only
                    </span>
                  </div>
                </div>

                <div className="tw:mt-6 tw:flex tw:justify-end tw:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                    style={{ borderRadius: 16 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="tw:inline-flex tw:h-11 tw:min-w-32 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                    style={{ borderRadius: 16 }}
                  >
                    {loading ? (
                      <Loader2 className="tw:h-4 tw:w-4 tw:animate-spin" />
                    ) : (
                      "Confirm"
                    )}
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
