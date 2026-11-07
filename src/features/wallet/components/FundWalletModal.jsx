import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { CircularProgress, TextField } from "@mui/material";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { showError } from "../../../component/ui/toast";
import {
  getWalletFundingQuote,
  initializeWalletFunding as initializeWalletFundingRequest,
} from "../../../api/walletApi";
import { useWalletPaymentMethods } from "../hooks/useWalletPaymentMethods";
import { useAuth } from "../../../pages/auth/AuthContext";
import {
  getDefaultWalletProvider,
  getApiErrorMessage,
  groupWalletPaymentMethods,
} from "../walletUtils";
import PaymentMark from "./PaymentMark";
import {
  selectPendingWalletPurchase,
  setLastFundingContext,
} from "../store/walletFlowSlice";

function normalizeAmountInput(value) {
  const digits = String(value || "").replace(/[^\d.]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FundWalletModal({
  open,
  onClose,
  prefilledAmount,
  source = "wallet_page",
  preselectedProvider = "",
}) {
  const dispatch = useDispatch();
  const { token } = useAuth();
  const pendingPurchase = useSelector(selectPendingWalletPurchase);
  const [amount, setAmount] = useState(
    prefilledAmount ? String(prefilledAmount) : ""
  );
  const [provider, setProvider] = useState(preselectedProvider || "");
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const [debouncedProvider, setDebouncedProvider] = useState("");
  const [reviewData, setReviewData] = useState(null);
  const [formError, setFormError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const latestPreviewRequestRef = useRef(0);
  const previewInFlightKeyRef = useRef("");
  const previewResolvedKeyRef = useRef("");

  const {
    data: methods = [],
    isLoading: methodsLoading,
    isError: methodsError,
    refetch: refetchMethods,
  } = useWalletPaymentMethods({ enabled: open });

  const selectableMethods = useMemo(
    () => methods.filter((method) => !method.disabled),
    [methods]
  );

  const methodGroups = useMemo(
    () => groupWalletPaymentMethods(selectableMethods),
    [selectableMethods]
  );

  const currentInputPreviewKey = useMemo(() => {
    const numericAmount = normalizeAmountInput(amount);

    if (!provider || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return "";
    }

    return `${provider}:${numericAmount}`;
  }, [amount, provider]);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setProvider("");
      setDebouncedAmount("");
      setDebouncedProvider("");
      setReviewData(null);
      setFormError("");
      setPreviewLoading(false);
      setSubmitting(false);
      previewInFlightKeyRef.current = "";
      previewResolvedKeyRef.current = "";
      return;
    }

    setAmount(prefilledAmount ? String(prefilledAmount) : "");
    setDebouncedAmount(prefilledAmount ? String(prefilledAmount) : "");
    setReviewData(null);
    setFormError("");
    setPreviewLoading(false);
    setSubmitting(false);
    previewInFlightKeyRef.current = "";
    previewResolvedKeyRef.current = "";
  }, [open, prefilledAmount]);

  useEffect(() => {
    if (!open) return;
    if (!selectableMethods.length) {
      setProvider("");
      return;
    }

    const defaultProvider =
      preselectedProvider || getDefaultWalletProvider(selectableMethods);

    setProvider((current) => {
      if (
        current &&
        selectableMethods.some((method) => method.value === current)
      ) {
        return current;
      }

      return defaultProvider;
    });
  }, [open, preselectedProvider, selectableMethods]);

  useEffect(() => {
    if (!open) return undefined;

    if (!currentInputPreviewKey) {
      setDebouncedProvider("");
      setDebouncedAmount("");
      setReviewData(null);
      setFormError("");
      setPreviewLoading(false);
      previewInFlightKeyRef.current = "";
      previewResolvedKeyRef.current = "";
      return undefined;
    }

    setReviewData(null);
    setFormError("");
    setPreviewLoading(true);

    const timerId = window.setTimeout(() => {
      setDebouncedProvider(provider);
      setDebouncedAmount(amount);
    }, 600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [amount, currentInputPreviewKey, open, provider]);

  useEffect(() => {
    if (!open) return undefined;
    if (methodsLoading || methodsError) return undefined;

    const numericAmount = normalizeAmountInput(debouncedAmount);

    if (
      !debouncedProvider ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return undefined;
    }

    const previewKey = `${debouncedProvider}:${numericAmount}`;

    if (previewResolvedKeyRef.current === previewKey && reviewData) {
      setPreviewLoading(false);
      return undefined;
    }

    if (previewInFlightKeyRef.current === previewKey) {
      return undefined;
    }

    const currentRequestId = latestPreviewRequestRef.current + 1;
    latestPreviewRequestRef.current = currentRequestId;
    previewInFlightKeyRef.current = previewKey;

    let cancelled = false;

    (async () => {
      try {
        // Priced, not created: the quote endpoint returns the same numbers `initialize`
        // would charge without minting a funding row or a vendor checkout session.
        const quote = await getWalletFundingQuote(
          {
            provider: debouncedProvider,
            amount: numericAmount,
          },
          token
        );

        if (cancelled || latestPreviewRequestRef.current !== currentRequestId) {
          return;
        }

        previewResolvedKeyRef.current = previewKey;
        previewInFlightKeyRef.current = "";
        setPreviewLoading(false);
        setReviewData({
          provider: quote?.provider || debouncedProvider,
          currency: quote?.currency || "NGN",
          requested_credit_amount: quote?.wallet_credit_amount ?? numericAmount,
          bonus_amount: quote?.bonus_amount ?? 0,
          bonus_percent: quote?.bonus_percent ?? 0,
          fee_amount: quote?.fee_amount ?? 0,
          total_charge_amount: quote?.total_charge_amount ?? numericAmount,
          gateway_charge_currency: quote?.charge_currency || quote?.currency || "NGN",
          gateway_charge_amount: quote?.charge_amount ?? numericAmount,
          fx_rate: quote?.fx_rate ?? null,
        });
      } catch (error) {
        if (cancelled || latestPreviewRequestRef.current !== currentRequestId) {
          return;
        }

        previewInFlightKeyRef.current = "";
        previewResolvedKeyRef.current = "";
        setPreviewLoading(false);
        setReviewData(null);
        setFormError(
          getApiErrorMessage(error, "Unable to initialize wallet funding.")
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedAmount,
    debouncedProvider,
    dispatch,
    methodsError,
    methodsLoading,
    open,
    pendingPurchase,
    reviewData,
    source,
    token,
  ]);

  const handleProceedToPayment = async () => {
    const numericAmount = normalizeAmountInput(amount);

    if (!provider) {
      setFormError("Select a payment method to continue.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError("Enter a valid wallet funding amount.");
      return;
    }

    if (submitting) return;

    setFormError("");
    setSubmitting(true);

    try {
      // Only now do we create the funding row and the vendor checkout.
      const payload = await initializeWalletFundingRequest(
        { provider, amount: numericAmount },
        token
      );

      if (!payload?.authorization_url) {
        setFormError("Unable to start this payment. Please pick another method.");
        setSubmitting(false);
        return;
      }

      dispatch(
        setLastFundingContext({
          reference: payload?.reference || "",
          provider: payload?.provider || provider,
          requestedCreditAmount:
            payload?.requested_credit_amount ?? numericAmount,
          source,
          pendingPurchase,
        })
      );

      try {
        window.sessionStorage.setItem(
          "xilolo:pending-wallet-funding",
          JSON.stringify({
            reference: payload.reference,
            provider: payload.provider || provider,
            amount: numericAmount,
          })
        );
      } catch (_error) {
        // Storage blocked: the vendor still returns a reference for most rails.
      }

      window.location.href = payload.authorization_url;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to initialize wallet funding."
      );
      setFormError(message);
      showError(message);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (previewLoading) return;
    onClose();
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:bg-black/45" />
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
              <DialogPanel className="tw:w-full tw:max-w-lg tw:rounded-[28px] tw:bg-white tw:p-6 tw:shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                  <div>
                    <span className="tw:block tw:text-xl tw:font-semibold tw:text-gray-900">
                      Fund wallet
                    </span>
                    <Dialog.Description className="tw:mt-1 tw:block tw:text-sm tw:text-gray-500">
                      Add money to your user wallet.
                    </Dialog.Description>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full! tw:bg-gray-100 tw:text-gray-500 tw:hover:bg-gray-200"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-4">
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-muted">
                        How do you want to pay?
                      </span>

                      {methodGroups.map((group) => (
                        <div key={group.code} className="tw:flex tw:flex-col">
                          <div className="tw:mt-2 tw:mb-1 tw:text-[10.5px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-muted">
                            {group.label}
                          </div>

                          {group.methods.map((method) => {
                            const active = provider === method.value;

                            return (
                              <button
                                key={method.value}
                                type="button"
                                onClick={() => setProvider(method.value)}
                                aria-pressed={active}
                                className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:py-2.5 tw:text-left tw:transition tw:hover:bg-paper"
                                style={{ borderBottom: "1px solid rgba(17,19,22,0.06)" }}
                              >
                                <PaymentMark mark={method.metadata?.mark} label={method.label} />
                                <span className="tw:min-w-0 tw:flex-1">
                                  <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-ink">
                                    {method.label}
                                  </span>
                                  <span className="tw:mt-0.5 tw:block tw:line-clamp-2 tw:text-[12px] tw:text-muted">
                                    {method.metadata?.description ||
                                      method.metadata?.fee_note ||
                                      "Secure checkout."}
                                  </span>
                                </span>
                                <span
                                  className={`tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border-2 ${
                                    active ? "tw:border-accent tw:bg-accent" : "tw:border-faint"
                                  }`}
                                >
                                  {active ? (
                                    <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-white" />
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}

                      {methodsError ? (
                        <span className="tw:text-[12px] tw:text-danger">
                          Could not load payment methods.
                        </span>
                      ) : null}
                    </div>

                    <TextField
                      label="Amount"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      inputProps={{ min: 1 }}
                      fullWidth
                      disabled={false}
                    />

                    <p className="tw:mt-1 tw:text-[11.5px] tw:leading-snug tw:text-gray-500">
                      The final amount and any provider fee are shown on the secure checkout page.
                    </p>

                    {methodsError && (
                      <div className="tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-sm tw:text-amber-800">
                        Wallet funding methods are unavailable right now.
                        <button
                          type="button"
                          onClick={() => refetchMethods()}
                          className="tw:ml-2 tw:font-semibold tw:underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {!methodsLoading &&
                      !selectableMethods.length &&
                      !methodsError && (
                        <div className="tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-sm tw:text-amber-800">
                          No wallet funding methods are currently available.
                        </div>
                      )}

                    {formError ? (
                      <div className="tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:p-3 tw:text-sm tw:text-red-700">
                        {formError}
                      </div>
                    ) : null}

                    <div className="tw:flex tw:justify-end tw:mt-3 tw:gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl! tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                        style={{ borderRadius: 16 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        onClick={handleProceedToPayment}
                        disabled={
                          previewLoading ||
                          submitting ||
                          methodsLoading ||
                          !selectableMethods.length ||
                          !provider
                        }
                        className="tw:inline-flex tw:h-11 tw:min-w-[148px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl! tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
                        style={{ borderRadius: 16 }}
                      >
                        {submitting ? (
                          <>
                            <CircularProgress size={14} color="inherit" />
                            Starting…
                          </>
                        ) : (
                          "Proceed to payment"
                        )}
                      </button>
                    </div>
                    
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
