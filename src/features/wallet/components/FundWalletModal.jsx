import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { CircularProgress, MenuItem, TextField } from "@mui/material";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { showError } from "../../../component/ui/toast";
import { initializeWalletFunding as initializeWalletFundingRequest } from "../../../api/walletApi";
import { useWalletPaymentMethods } from "../hooks/useWalletPaymentMethods";
import { useAuth } from "../../../pages/auth/AuthContext";
import { getDefaultWalletProvider, getApiErrorMessage } from "../walletUtils";
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
      previewInFlightKeyRef.current = "";
      previewResolvedKeyRef.current = "";
      return;
    }

    setAmount(prefilledAmount ? String(prefilledAmount) : "");
    setDebouncedAmount(prefilledAmount ? String(prefilledAmount) : "");
    setReviewData(null);
    setFormError("");
    setPreviewLoading(false);
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
        const payload = await initializeWalletFundingRequest(
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
        dispatch(
          setLastFundingContext({
            reference: payload?.reference || "",
            provider: payload?.provider || debouncedProvider,
            requestedCreditAmount:
              payload?.requested_credit_amount ?? numericAmount,
            source,
            pendingPurchase,
          })
        );
        setReviewData(payload);
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

  const handleProceedToPayment = () => {
    const numericAmount = normalizeAmountInput(amount);

    if (!provider) {
      setFormError("Select a payment method to continue.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError("Enter a valid wallet funding amount.");
      return;
    }

    if (!reviewData?.authorization_url) {
      setFormError("Funding review is still loading. Please wait a moment.");
      return;
    }

    window.location.href = reviewData.authorization_url;
  };

  const selectedMethod = selectableMethods.find((method) => method.value === provider);
  const isCryptoFunding = String(provider).toLowerCase() === "cryptomus" || selectedMethod?.raw?.metadata?.category === "crypto";

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
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-500 hover:tw:bg-gray-200"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-4">
                    <TextField
                      select
                      label="Payment method"
                      value={provider}
                      onChange={(event) => setProvider(event.target.value)}
                      fullWidth
                      disabled={methodsLoading}
                      helperText={
                        methodsError
                          ? "Could not load payment methods."
                          : "Select a provider to preview the charge."
                      }
                    >
                      {selectableMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Amount"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      inputProps={{ min: 1 }}
                      fullWidth
                      disabled={false}
                    />

                    {previewLoading && currentInputPreviewKey ? (
                      <div className="tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-[linear-gradient(135deg,#f7f2eb,#ffffff)] tw:p-4">
                        <div className="tw:space-y-3 tw:animate-pulse">
                          <div className="tw:h-4 tw:w-40 tw:rounded-full tw:bg-[#e9ddff]" />
                          <div className="tw:flex tw:items-center tw:justify-between">
                            <div className="tw:h-3 tw:w-28 tw:rounded-full tw:bg-[#f0e8ff]" />
                            <div className="tw:h-3 tw:w-20 tw:rounded-full tw:bg-[#f0e8ff]" />
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between">
                            <div className="tw:h-3 tw:w-24 tw:rounded-full tw:bg-[#f0e8ff]" />
                            <div className="tw:h-3 tw:w-16 tw:rounded-full tw:bg-[#f0e8ff]" />
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between">
                            <div className="tw:h-3 tw:w-24 tw:rounded-full tw:bg-[#f0e8ff]" />
                            <div className="tw:h-3 tw:w-24 tw:rounded-full tw:bg-[#f0e8ff]" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {reviewData ? (
                      <div className="tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-[linear-gradient(135deg,#f7f2eb,#ffffff)] tw:p-4">
                        <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                          Review funding charge
                        </div>
                        <div className="tw:mt-4 tw:space-y-3 tw:text-sm">
                          <div className="tw:flex tw:items-center tw:justify-between tw:text-gray-600">
                            <span>Wallet credit amount</span>
                            <span className="tw:font-semibold tw:text-gray-900">
                              {reviewData.currency}{" "}
                              {Number(
                                reviewData.requested_credit_amount || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between tw:text-gray-600">
                            <span>Gateway fee</span>
                            <span className="tw:font-semibold tw:text-gray-900">
                              {reviewData.currency}{" "}
                              {Number(reviewData.fee_amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between tw:text-gray-600">
                            <span>Total charged</span>
                            <span className="tw:font-semibold tw:text-gray-900">
                              {reviewData.currency}{" "}
                              {Number(
                                reviewData.total_charge_amount || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {isCryptoFunding ? (
                          <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-primary/5 tw:p-3 tw:text-xs tw:text-gray-600">
                            Crypto funding is processed by {selectedMethod?.label || "Cryptomus"}. The gateway fee is added to your charge, so your wallet receives only the credit amount shown above.
                          </div>
                        ) : null}
                      </div>
                    ) : null}

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
                        className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800 hover:tw:bg-gray-200"
                        style={{ borderRadius: 16 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        onClick={handleProceedToPayment}
                        disabled={
                          previewLoading ||
                          methodsLoading ||
                          !selectableMethods.length ||
                          !reviewData?.authorization_url
                        }
                        className="tw:inline-flex tw:h-11 tw:min-w-[148px] tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                        style={{ borderRadius: 16 }}
                      >
                        Proceed to payment
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
