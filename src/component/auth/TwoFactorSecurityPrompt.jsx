import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";
import { useAuth } from "../../pages/auth/AuthContext";

const DISMISSED_UNTIL_KEY = "xilolo_2fa_prompt_dismissed_until";

function getDismissedUntil() {
  const value = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0);
  return Number.isFinite(value) ? value : 0;
}

export default function TwoFactorSecurityPrompt() {
  const { token, security } = useAuth();
  const [dismissedUntil, setDismissedUntil] = useState(() => getDismissedUntil());
  const shouldShow = useMemo(() => {
    if (!token || !security?.two_factor_prompt) return false;
    if (security?.two_factor_enabled) return false;
    return dismissedUntil <= Date.now();
  }, [dismissedUntil, security, token]);

  if (!shouldShow) return null;

  const dismiss = () => {
    const days = Number(security?.two_factor_prompt_interval_days || 14);
    const nextDismissedUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(nextDismissedUntil));
    setDismissedUntil(nextDismissedUntil);
  };

  return (
    <Transition appear show={shouldShow} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={dismiss}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/45" />
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
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-3xl tw:bg-white tw:p-6 tw:shadow-xl">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                  <span className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100">
                    <ShieldCheck className="tw:h-6 tw:w-6 tw:text-gray-900" />
                  </span>
                  <button
                    style={{
                      borderRadius: "9999px",
                    }}
                    type="button"
                    aria-label="Dismiss security prompt"
                    onClick={dismiss}
                    className="tw:rounded-full tw:p-1.5 tw:text-gray-500 hover:tw:bg-gray-100"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <span className="tw:mt-5 tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-gray-900">
                  Add two-factor authentication
                </span>
                <span className="tw:mt-2 tw:block tw:text-sm tw:leading-6 tw:text-gray-600">
                  Protect your Xilolo account with a 6-digit authenticator app
                  code before future sign-ins can finish.
                </span>

                <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row">
                  <Link
                    style={{
                      borderRadius: "9999px",
                    }}
                    to="/account/security"
                    onClick={dismiss}
                    className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:rounded-full tw:bg-black tw:px-5 tw:py-3 tw:text-sm tw:font-semibold text-white tw:no-underline"
                  >
                    Open Security
                  </Link>
                  <button
                    style={{
                      borderRadius: "9999px",
                    }}
                    type="button"
                    onClick={dismiss}
                    className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-300 tw:bg-white tw:px-5 tw:py-3 tw:text-sm tw:font-semibold tw:text-gray-900"
                  >
                    Remind me later
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
