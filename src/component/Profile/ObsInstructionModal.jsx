import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Copy } from "lucide-react";
import { showError, showSuccess } from "../ui/toast";

export default function ObsInstructionsModal({ open, onClose, payload, onProceed }) {
  const url  = payload?.event?.obs_instructions?.srt_url || payload?.event?.srt_ingest_url;
  const port = payload?.event?.obs_instructions?.srt_port || payload?.event?.srt_port;
  const title = payload?.event?.title;

  const copy = async (txt, label = "Copied!") => {
    try { await navigator.clipboard.writeText(String(txt || "")); showSuccess(label); }
    catch { showError("Copy failed"); }
  };

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog onClose={onClose} className="tw:relative tw:z-50">
        <Transition.Child
          as={React.Fragment}
          enter="tw:transition-opacity tw:duration-200"
          enterFrom="tw:opacity-0" enterTo="tw:opacity-100"
          leave="tw:transition-opacity tw:duration-200"
          leaveFrom="tw:opacity-100" leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:p-3 tw:sm:p-4">
          <Transition.Child
            as={React.Fragment}
            enter="tw:transition tw:duration-200 tw:ease-out"
            enterFrom="tw:opacity-0 tw:translate-y-2 tw:scale-[0.98]"
            enterTo="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leave="tw:transition tw:duration-150 tw:ease-in"
            leaveFrom="tw:opacity-100 tw:translate-y-0 tw:scale-100"
            leaveTo="tw:opacity-0 tw:translate-y-2 tw:scale-[0.98]"
          >
            {/* Reduced height + scrollable content */}
            <Dialog.Panel className="tw:w-full tw:max-w-2xl tw:max-h-[80vh] tw:sm:max-h-[78vh] tw:rounded-3xl tw:bg-white tw:shadow-xl tw:border tw:border-gray-100 tw:flex tw:flex-col">
              <div className="tw:p-5 tw:sm:p-6">
                <Dialog.Title className="tw:flex tw:items-center tw:gap-2 tw:text-lg tw:font-semibold tw:text-primary">
                  <span className="tw:inline-flex tw:size-8 tw:items-center tw:justify-center tw:rounded-xl tw:bg-lightPurple/60">🎥</span>
                  <span>OBS Streaming Instructions</span>
                </Dialog.Title>
              </div>

              {/* scrollable body */}
              <div className="tw:flex-1 tw:overflow-y-auto tw:px-5 tw:sm:px-6 tw:pb-2 tw:space-y-4">
                {title && (
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-sm">
                    <span className="tw:font-medium">Event:</span>
                    <span className="tw:text-primary">{title}</span>
                  </div>
                )}

                <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
                  <div className="tw:flex tw:items-center tw:justify-between tw:rounded-2xl tw:bg-lightPurple/40 tw:p-3">
                    <div className="tw:text-sm">
                      <div className="tw:text-gray-500">SRT URL</div>
                      <div className="tw:font-medium tw:break-all">{url || "—"}</div>
                    </div>
                    <button onClick={() => copy(url, "SRT URL copied")} className="tw:rounded-xl! tw:p-2 tw:hover:bg-white/60" title="Copy URL">
                      <Copy className="tw:size-5" />
                    </button>
                  </div>

                  <div className="tw:flex tw:items-center tw:justify-between tw:rounded-2xl tw:bg-lightPurple/40 tw:p-3">
                    <div className="tw:text-sm">
                      <div className="tw:text-gray-500">Port</div>
                      <div className="tw:font-medium">{port ?? "—"}</div>
                    </div>
                    <button onClick={() => copy(port, "Port copied")} className="tw:rounded-xl! tw:p-2 tw:hover:bg-white/60" title="Copy Port">
                      <Copy className="tw:size-5" />
                    </button>
                  </div>
                </div>

                <div className="tw:rounded-2xl tw:bg-lightPurple/35 tw:p-4 tw:text-sm tw:leading-6 tw:text-gray-800 tw:border tw:border-lightPurple">
                  <div className="tw:font-semibold tw:mb-2">Setup Instructions:</div>
                  <ol className="tw:list-decimal tw:pl-5 tw:space-y-1">
                    {(payload?.event?.obs_instructions?.instructions || []).map((line, i) => (
                      <li key={i}>{line || " "}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* sticky footer actions */}
              <div className="tw:p-4 tw:border-t tw:border-gray-100 tw:flex tw:items-center tw:justify-center tw:gap-3">
                <button onClick={onClose} className="tw:px-5 tw:py-3 tw:rounded-2xl! tw:bg-gray-100 tw:hover:bg-gray-200 tw:text-gray-700 tw:font-medium">
                  Cancel
                </button>
                <button onClick={onProceed} className="tw:px-5 tw:py-3 tw:rounded-2xl! tw:bg-primary tw:hover:bg-primary/90 tw:text-white tw:font-medium tw:shadow-sm">
                  Proceed
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
