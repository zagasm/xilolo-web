import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function ReportModal({ open, onClose, onSubmit }) {
  const REASONS = [
    "Spam",
    "Inappropriate content",
    "Scam or fraud",
    "Harassment or bullying",
    "Hate speech",
    "Misinformation",
    "Impersonation",
    "Violence or dangerous acts",
    "Illegal activity",
    "Other",
  ];
  const [selected, setSelected] = useState("");
  const [other, setOther] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected("");
      setOther("");
    }
  }, [open]);

  const finalReason = selected === "Other" ? other.trim() : selected;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="tw:relative tw:z-50">
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:p-4">
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-200"
            enterFrom="tw:opacity-0 tw:translate-y-1"
            enterTo="tw:opacity-100 tw:translate-y-0"
            leave="tw:transition tw:duration-150"
            leaveFrom="tw:opacity-100 tw:translate-y-0"
            leaveTo="tw:opacity-0 tw:translate-y-1"
          >
            <Dialog.Panel className="tw:w-full tw:max-w-md tw:bg-white tw:rounded-2xl tw:shadow-lg tw:p-5">
              <span className="tw:block tw:text-xl tw:font-semibold tw:mb-2">
                Report event
              </span>
              <p className="tw:text-sm tw:text-gray-600 tw:mb-4">
                Select a reason. We’ll review this report.
              </p>

              <div className="tw:max-h-[260px] tw:overflow-auto tw:space-y-2 tw:space-x-2 tw:mb-3">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={`tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:rounded-xl tw:border tw:cursor-pointer ${
                      selected === r
                        ? "tw:border-primary tw:bg-lightPurple/60"
                        : "tw:border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      className="tw:accent-primary"
                      checked={selected === r}
                      onChange={() => setSelected(r)}
                    />
                    <span className="tw:text-sm tw:ml-2">{r}</span>
                  </label>
                ))}
              </div>

              {selected === "Other" && (
                <input
                  className="tw:w-full tw:border tw:border-gray-200 tw:rounded-xl tw:px-3 tw:py-2 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary tw:mb-3"
                  placeholder="Tell us more…"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                />
              )}

              <div className="tw:flex tw:justify-end tw:gap-3">
                <button
                  className="tw:px-4 tw:h-10 tw:rounded-full tw:bg-gray-100"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="tw:px-5 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:disabled:opacity-50"
                  disabled={!finalReason}
                  onClick={() => onSubmit(finalReason)}
                >
                  Submit report
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
