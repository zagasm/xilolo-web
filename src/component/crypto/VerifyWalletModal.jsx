import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showPromise } from "../../component/ui/toast";

export default function VerifyWalletModal({
  open,
  onClose,
  token,
  wallet,
  ownership,
  onVerified,
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    setCode("");
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();

    if (!wallet || !wallet.id) {
      showError("Missing wallet information.");
      return;
    }

    if (!trimmed || trimmed.length !== 5) {
      showError("Enter the 5-digit code.");
      return;
    }

    const payload = {
      code: trimmed,
    };

    const request = api
      .post(
        `/api/v1/crypto-wallets/${wallet.id}/verify`,
        payload,
        authHeaders(token)
      )
      .then((res) => {
        const updated =
          res?.data?.wallet || res?.data?.data || res?.data || null;
        if (updated && onVerified) {
          onVerified(updated);
        }
        setCode("");
        onClose?.();
        return updated;
      });

    setSubmitting(true);
    try {
      await showPromise(request, {
        loading: "Verifying wallet…",
        success: "Wallet verified successfully.",
        error: "Could not verify wallet.",
      });
    } catch (err) {
      if (!err.__handled) {
        showError("Something went wrong while verifying wallet.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const emailHint = ownership?.target || null;

  return (
    <Transition.Root show={open} as={Fragment}>
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
          <div className="tw:fixed tw:inset-0 tw:bg-black/40 tw:backdrop-blur-sm" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:px-4 tw:py-4 tw:sm:py-8">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:scale-95 tw:translate-y-2"
              enterTo="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leaveTo="tw:opacity-0 tw:scale-95 tw:translate-y-2"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:rounded-3xl tw:bg-white tw:border tw:border-[#ded6cd] tw:shadow-[0_18px_60px_rgba(15,23,42,0.18)] tw:p-6 tw:sm:p-7">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                  <div className="tw:space-y-1.5">
                    <span className="tw:block tw:text-base tw:sm:text-lg tw:md:text-xl tw:font-semibold tw:text-[#050505]">
                      Verify this wallet
                    </span>
                    <span className="tw:block tw:text-xs tw:sm:text-sm tw:text-[#5f5a55]">
                      Enter the 5-digit code we just emailed to{" "}
                      <span className="tw:font-medium tw:text-primary">
                        {emailHint || "your account email"}
                      </span>{" "}
                      to confirm you own this address.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="tw:shrink-0 tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-lightPurple tw:text-primary tw:hover:bg-[#e2d9ce] tw:transition"
                  >
                    <span className="tw:text-lg tw:leading-none">×</span>
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="tw:mt-6 tw:space-y-5 tw:sm:space-y-6"
                >
                  <div className="tw:space-y-2">
                    <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#4e4942]">
                      Verification code
                    </span>
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      <input
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        className="tw:block tw:w-full tw:text-center tw:tracking-[0.6em] tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-[#e5e4e2] tw:px-4 tw:py-3 tw:text-lg tw:font-semibold tw:text-[#050505] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary/25 focus:tw:border-transparent tw:placeholder:tracking-normal placeholder:tw:text-[#a89f95]"
                        placeholder="0 0 0 0 0"
                      />
                      <span className="tw:text-[10px] tw:text-[#7a736c]">
                        Code expires after a short time. If it stops working,
                        request a new one from your wallet settings.
                      </span>
                    </div>
                  </div>

                  <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-3 tw:mt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      style={{
                        borderRadius: 16,
                      }}
                      className="tw:w-full tw:sm:w-auto tw:h-10 tw:px-4 tw:rounded-2xl tw:text-xs tw:font-medium tw:border tw:border-[#E2E8F0] tw:text-[#0F172A] tw:bg-white tw:hover:bg-[#F9FAFB] tw:transition disabled:tw:opacity-60"
                    >
                      <span>Skip for now</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        borderRadius: 16,
                      }}
                      className="tw:w-full tw:sm:w-auto tw:h-10 tw:px-5 tw:rounded-2xl tw:text-xs tw:font-semibold tw:text-white tw:bg-[linear-gradient(135deg,#050505,#2b2b2b)] tw:shadow-[0_12px_35px_rgba(0,0,0,0.24)] tw:hover:scale-[1.01] tw:transition tw:flex tw:items-center tw:justify-center tw:gap-2 disabled:tw:opacity-60 disabled:tw:hover:scale-100"
                    >
                      {submitting && (
                        <span className="tw:inline-block tw:h-3 tw:w-3 tw:rounded-full tw:border tw:border-white/40 tw:border-t-transparent tw:animate-spin" />
                      )}
                      <span>{submitting ? "Verifying…" : "Verify wallet"}</span>
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
