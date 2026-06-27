import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function DeleteConfirmModal({
  open,
  onClose,
  title = "Delete event",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-999" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
        </Transition.Child>

        {/* Panel */}
        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:scale-95"
              enterTo="tw:opacity-100 tw:scale-100"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:scale-100"
              leaveTo="tw:opacity-0 tw:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-2xl tw:bg-white tw:p-5 tw:shadow-xl">
                <span className="tw:block tw:text-lg tw:font-semibold tw:text-gray-900">
                  {title}
                </span>

                <span className="tw:mt-2 tw:text-sm tw:text-gray-600">
                  {description}
                </span>

                <div className="tw:mt-5 tw:flex tw:gap-3 tw:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="tw:rounded-xl tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:bg-gray-100 tw:text-gray-800 tw:hover:bg-gray-200 disabled:tw:opacity-60"
                  >
                    {cancelText}
                  </button>

                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="tw:rounded-xl tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:bg-red-600 tw:text-white tw:hover:bg-red-700 disabled:tw:opacity-60"
                  >
                    {loading ? "Deleting..." : confirmText}
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
