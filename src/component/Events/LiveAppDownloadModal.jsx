import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Smartphone } from "lucide-react";

export default function LiveAppDownloadModal({ open, onClose }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-80" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="tw:duration-200 tw:ease-out"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:duration-150 tw:ease-in"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40 tw:backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:duration-200 tw:ease-out"
              enterFrom="tw:opacity-0 tw:translate-y-3 tw:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:scale-100"
              leave="tw:duration-150 tw:ease-in"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-3 tw:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-2xl tw:bg-white tw:px-6 tw:py-5 tw:shadow-[0_18px_45px_rgba(15,23,42,0.18)] tw:border tw:border-gray-100">
                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="tw:absolute tw:right-4 tw:top-4 tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full! tw:bg-gray-100 tw:hover:bg-gray-200 tw:text-gray-500"
                >
                  <X className="tw:w-4 tw:h-4" />
                </button>

                <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:gap-3 tw:mt-2">
                  <div className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary">
                    <Smartphone className="tw:w-6 tw:h-6" />
                  </div>

                  <span className="tw:text-lg tw:md:text-xl tw:lg:text-2xl tw:font-semibold tw:text-gray-900">
                    Join this event LIVE on mobile
                  </span>

                  <Dialog.Description className="tw:text-sm tw:text-gray-600 tw:max-w-sm">
                    To join this event LIVE right now, download the Xilolo
                    Studios app from your preferred app store.
                  </Dialog.Description>

                  <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-3 tw:mt-3 tw:w-full">
                    {/* Google Play button */}
                    <a
                      href="https://play.google.com/store/apps/details?id=com.zagasmstudio.app"
                      onClick={onClose}
                      className="tw:flex-1 tw:inline-flex tw:flex-row tw:items-center tw:justify-center tw:gap-3 tw:rounded-xl tw:bg-black tw:px-4 tw:py-2.5 tw:text-sm tw:font-medium text-white tw:hover:bg-gray-900 tw:transition"
                    >
                      <img
                        src="/images/icons/ps.png"
                        alt="Google Play"
                        className="tw:h-6 tw:w-6 tw:object-contain"
                      />
                      <span className="tw:flex tw:flex-col tw:items-start tw:text-left">
                        <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:opacity-70">
                          Download on
                        </span>
                        <span className="tw:text-sm tw:leading-tight">
                          Google Play
                        </span>
                      </span>
                    </a>

                    {/* App Store button */}
                    <a
                      href="https://apps.apple.com/ng/app/zagasm-studios/id6755035145"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw:flex-1 tw:inline-flex tw:flex-row tw:items-center tw:justify-center tw:gap-3 tw:rounded-xl tw:bg-black tw:px-4 tw:py-2.5 tw:text-sm tw:font-medium text-white tw:hover:bg-black tw:transition"
                    >
                      <img
                        src="/images/icons/as.png"
                        alt="App Store"
                        className="tw:h-6 tw:w-6 tw:object-contain"
                      />
                      <span className="tw:flex tw:flex-col tw:items-start tw:text-left">
                        <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:opacity-70">
                          Download on
                        </span>
                        <span className="tw:text-sm tw:leading-tight">
                          App Store
                        </span>
                      </span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:mt-3 tw:text-xs tw:text-gray-500 tw:hover:text-gray-700"
                  >
                    I’ll do this later
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
