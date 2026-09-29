import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../../pages/auth/AuthContext";
import { api, authHeaders } from "../../lib/apiClient";

export default function DeactivateAccountModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();

  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setPassword("");
    setError("");
    onClose?.();
  };

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      setError("Please tell us why you are deactivating your account.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token") || user?.token;

    try {
      await api.post(
        "/api/v1/user/deactivate",
        {
          reason: reason.trim(),
          password: password.trim(),
        },
        authHeaders(token)
      );

      setIsSubmitting(false);
      setReason("");
      setPassword("");
      setError("");

      // let parent show success + handle logout
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Deactivate error:", err);
      const apiMessage =
        err?.response?.data?.message ||
        "Unable to deactivate account. Please try again.";
      setError(apiMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={handleClose}>
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
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-2xl tw:bg-white tw:p-6 tw:shadow-xl">
                <Dialog.Title
                  as="span"
                  className="tw:block tw:text-lg tw:md:text-xl tw:font-semibold tw:text-gray-900"
                >
                  Deactivate your account?
                </Dialog.Title>

                <Dialog.Description
                  as="span"
                  className="tw:mt-2 tw:block tw:text-sm tw:text-gray-600"
                >
                  This will deactivate your Xilolo account.
                </Dialog.Description>

                <div className="tw:mt-4 tw:space-y-4">
                  {/* Reason */}
                  <div>
                    <span className="tw:block tw:text-sm tw:font-medium tw:text-gray-800 tw:mb-1">
                      Reason for deactivating{" "}
                      <span className="tw:text-red-500">*</span>
                    </span>
                    <textarea
                      className="tw:w-full tw:min-h-[100px] tw:rounded-xl tw:border tw:border-gray-200 tw:p-3 tw:text-sm tw:outline-none tw:focus:border-primary tw:focus:ring-1 tw:focus:ring-primary"
                      placeholder="Tell us why you’re leaving…"
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <span className="tw:block tw:text-sm tw:font-medium tw:text-gray-800 tw:mb-1">
                      Confirm with password{" "}
                      <span className="tw:text-red-500">*</span>
                    </span>
                    <input
                      type="password"
                      className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:p-3 tw:text-sm tw:outline-none tw:focus:border-primary tw:focus:ring-1 tw:focus:ring-primary"
                      placeholder="Enter your account password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {error && (
                    <span className="tw:block tw:text-xs tw:text-red-500">
                      {error}
                    </span>
                  )}
                </div>

                <div className="tw:mt-6 tw:flex tw:justify-end tw:gap-3">
                  <button
                    style={{
                      borderRadius: 16,
                    }}
                    type="button"
                    className="tw:inline-flex tw:justify-center tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-gray-700 tw:hover:bg-gray-50"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      borderRadius: 16,
                    }}
                    type="button"
                    className="tw:inline-flex tw:justify-center tw:rounded-xl tw:bg-red-500 tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:hover:bg-red-600 tw:disabled:opacity-60 tw:disabled:cursor-not-allowed"
                    onClick={handleDeactivate}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deactivating…" : "Deactivate"}
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
