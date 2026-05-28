import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Download, X } from "lucide-react";

/**
 * Download modal used across the app. Styling matches the original inline version.
 */
const DownloadAppModal = ({
  open,
  onClose = () => { },
  onAppStoreDownload = () => { },
  onApkDownload = () => { },
  onSkip = () => { },
  apkCtaText = "Get it on Google Play",
  platform = "all",
}) => {
  const showIosDownload = platform === "ios" || platform === "all";
  const showAndroidDownload = platform === "android" || platform === "all";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-9999" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40 tw:backdrop-blur-sm" />
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
              <Dialog.Panel className="tw:relative tw:w-full tw:max-w-md tw:overflow-hidden tw:rounded-3xl tw:bg-white/90 tw:shadow-2xl tw:ring-1 tw:ring-[#ddd4ca] tw:backdrop-blur">
                <div className="tw:absolute tw:inset-0 tw:z-0 tw:opacity-80 tw:bg-[radial-gradient(circle_at_15%_20%,#f1ebe4_0,transparent_32%),radial-gradient(circle_at_85%_15%,#e5e4e2_0,transparent_28%),radial-gradient(circle_at_50%_100%,#e5ddd3_0,transparent_38%)]" />
                <div className="tw:relative tw:z-10 tw:p-6">
                  <div className="tw:flex tw:items-start tw:justify-between">
                    <span className="tw:text-xl tw:md:text-2xl tw:font-bold tw:text-gray-900">
                      Get the Xilolo app
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="tw:rounded-full tw:p-2 tw:text-gray-500 tw:transition tw:hover:bg-gray-100 tw:hover:text-gray-800 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-[#ddd4ca]"
                    >
                      <X className="tw:size-5" />
                    </button>
                  </div>
                  <span className="tw:mt-2 tw:text-sm tw:text-gray-600">
                    {platform === "all"
                      ? "Choose your platform and start using the app in seconds."
                      : "Download the app for your device and start using it in seconds."}
                  </span>

                  <div className="tw:mt-6 tw:space-y-3">
                    {showIosDownload && (
                      <button
                        style={{
                          borderRadius: 16,
                        }}
                        type="button"
                        onClick={onAppStoreDownload}
                        className="tw:flex tw:w-full tw:items-center tw:justify-between tw:rounded-2xl tw:bg-linear-to-r tw:from-primary tw:via-primarySecond tw:to-[#3a3a3a] tw:px-5 tw:py-4 tw:text-white tw:shadow-xl tw:transition tw:hover:shadow-black/20 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-[#cfc4b8]"
                      >
                        <span className="tw:flex tw:items-center tw:gap-3">
                          <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/15 tw:ring-1 tw:ring-white/30">
                            <img
                              src="/images/icons/as.png"
                              alt="App Store"
                              className="tw:h-5 tw:w-5 tw:object-contain"
                            />
                          </span>
                          <span className="tw:text-left">
                            <span className="tw:block tw:text-xs tw:uppercase tw:tracking-wide tw:opacity-80">
                              App Store
                            </span>
                            <span className="tw:block tw:text-sm tw:font-semibold">
                              Download for iOS
                            </span>
                          </span>
                        </span>
                        <Download className="tw:size-5 tw:opacity-80" />
                      </button>
                    )}

                    {showAndroidDownload && (
                      <button
                        style={{
                          borderRadius: 16,
                        }}
                        type="button"
                        onClick={onApkDownload}
                        className="tw:flex tw:w-full tw:items-center tw:justify-between tw:rounded-2xl tw:border tw:border-[#ddd4ca] tw:bg-white tw:px-5 tw:py-4 tw:text-gray-800 tw:shadow-lg tw:transition tw:hover:border-[#cfc4b8] tw:hover:shadow-black/5 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-[#ddd4ca]"
                      >
                        <span className="tw:flex tw:items-center tw:gap-3">
                          <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-lightPurple tw:text-primary">
                            <img
                              src="/images/icons/ps.png"
                              alt="Google Play"
                              className="tw:h-5 tw:w-5 tw:object-contain"
                            />
                          </span>
                          <span className="tw:text-left">
                            <span className="tw:block tw:text-xs tw:uppercase tw:tracking-wide tw:text-[#5f5a55]">
                              Google Play
                            </span>
                            <span className="tw:block tw:text-sm tw:font-semibold">
                              {apkCtaText}
                            </span>
                          </span>
                        </span>
                        <Download className="tw:size-5 tw:opacity-80" />
                      </button>
                    )}
                  </div>

                  <div className="tw:mt-4 tw:flex tw:justify-center">
                    <button
                      type="button"
                      onClick={onSkip}
                      className="tw:text-xs tw:font-semibold tw:text-primary tw:underline tw:underline-offset-4 hover:tw:text-primarySecond"
                    >
                      Skip, download later
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DownloadAppModal;
