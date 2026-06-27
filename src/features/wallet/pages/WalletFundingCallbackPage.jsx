import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCcw, Ticket } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { showError, showSuccess } from "../../../component/ui/toast";
import { usePurchaseTicketWithWallet } from "../hooks/usePurchaseTicketWithWallet";
import { useVerifyWalletFunding } from "../hooks/useVerifyWalletFunding";
import {
  clearLastFundingContext,
  clearPendingPurchaseIntent,
  markPendingPurchaseRetryAttempted,
  selectLastWalletFunding,
  selectPendingWalletPurchase,
} from "../store/walletFlowSlice";
import { getApiErrorMessage } from "../walletUtils";

const CRYPTOMUS_SUCCESS_STATUSES = ["paid", "paid_over"];
const CRYPTOMUS_FAILED_STATUSES = [
  "fail",
  "wrong_amount",
  "cancel",
  "system_fail",
  "refund_fail",
];

export default function WalletFundingCallbackPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const autoRetryStartedRef = useRef(false);
  const pendingPurchase = useSelector(selectPendingWalletPurchase);
  const lastFunding = useSelector(selectLastWalletFunding);
  const [verificationState, setVerificationState] = useState({
    status: "idle",
    error: "",
    payload: null,
  });
  const [purchaseState, setPurchaseState] = useState({
    status: "idle",
    error: "",
  });
  const navigate = useNavigate();

  const provider = String(
    searchParams.get("provider") || lastFunding?.provider || ""
  ).toLowerCase();
  const cryptomusStatus = String(
    searchParams.get("status") ||
      searchParams.get("payment_status") ||
      searchParams.get("paymentStatus") ||
      ""
  ).toLowerCase();
  const isCryptomusReturn =
    provider === "cryptomus" ||
    searchParams.has("uuid") ||
    searchParams.has("order_id") ||
    searchParams.has("payment_uuid");
  const isCryptomusSuccessStatus =
    CRYPTOMUS_SUCCESS_STATUSES.includes(cryptomusStatus);
  const isCryptomusFailedStatus =
    CRYPTOMUS_FAILED_STATUSES.includes(cryptomusStatus);

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    searchParams.get("order_id") ||
    lastFunding?.reference ||
    "";

  const verifyFunding = useVerifyWalletFunding({
    onSuccess: (payload) => {
      setVerificationState({
        status: "success",
        error: "",
        payload,
      });
      if (!pendingPurchase?.eventId) {
        dispatch(clearLastFundingContext());
      }
      showSuccess("Wallet funding verified successfully.");
    },
  });

  const purchaseTicket = usePurchaseTicketWithWallet({
    onSuccess: () => {
      setPurchaseState({ status: "success", error: "" });
      dispatch(clearPendingPurchaseIntent());
      dispatch(clearLastFundingContext());
      showSuccess("Ticket purchase completed successfully.");
    },
  });

  const handleVerify = async ({ force = false } = {}) => {
    if (!reference) {
      setVerificationState({
        status: "error",
        error: "No wallet funding reference was found.",
        payload: null,
      });
      return;
    }

    if (
      isCryptomusReturn &&
      !force &&
      (!cryptomusStatus || (!isCryptomusSuccessStatus && !isCryptomusFailedStatus))
    ) {
      setVerificationState({
        status: "pending",
        error: "",
        payload: null,
      });
      return;
    }

    setVerificationState({
      status: "loading",
      error: "",
      payload: null,
    });

    try {
      const providerPayload = {};
      const orderId = searchParams.get("order_id");
      const txid = searchParams.get("txid");
      const uuid =
        searchParams.get("uuid") || searchParams.get("payment_uuid");

      if (orderId) providerPayload.order_id = orderId;
      if (txid) providerPayload.txid = txid;
      if (uuid) providerPayload.uuid = uuid;
      if (cryptomusStatus) {
        providerPayload.status = cryptomusStatus;
        providerPayload.payment_status = cryptomusStatus;
      }
      if (isCryptomusReturn) providerPayload.provider = "cryptomus";

      const payload = await verifyFunding.mutateAsync({
        reference,
        provider_payload: providerPayload,
      });

      setVerificationState({
        status: "success",
        error: "",
        payload,
      });
    } catch (error) {
      const responseStatus = error?.response?.data?.data?.status;
      if (
        isCryptomusReturn &&
        (responseStatus === "pending" || (!cryptomusStatus && !force))
      ) {
        setVerificationState({
          status: "pending",
          error: "",
          payload: null,
        });
        return;
      }

      const message = getApiErrorMessage(
        error,
        "Unable to verify wallet funding right now."
      );
      setVerificationState({
        status: "error",
        error: message,
        payload: null,
      });
      showError(message);
    }
  };

  useEffect(() => {
    handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, cryptomusStatus]);

  useEffect(() => {
    if (
      verificationState.status !== "success" ||
      !pendingPurchase?.eventId ||
      !reference ||
      autoRetryStartedRef.current ||
      pendingPurchase?.autoRetryReference === reference
    ) {
      return;
    }

    autoRetryStartedRef.current = true;
    dispatch(markPendingPurchaseRetryAttempted(reference));
    setPurchaseState({ status: "loading", error: "" });

    purchaseTicket
      .mutateAsync({
        event_id: pendingPurchase.eventId,
        quantity: pendingPurchase.quantity || 1,
      })
      .then(() => {
        setPurchaseState({ status: "success", error: "" });
      })
      .catch((error) => {
        const message = getApiErrorMessage(
          error,
          "Funding was verified, but the ticket purchase could not be completed automatically."
        );
        setPurchaseState({ status: "error", error: message });
        showError(message);
      });
  }, [
    dispatch,
    pendingPurchase,
    purchaseTicket,
    reference,
    verificationState.status,
  ]);

  const handleManualPurchase = async () => {
    if (!pendingPurchase?.eventId) return;

    setPurchaseState({ status: "loading", error: "" });

    try {
      await purchaseTicket.mutateAsync({
        event_id: pendingPurchase.eventId,
        quantity: pendingPurchase.quantity || 1,
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to complete the ticket purchase."
      );
      setPurchaseState({ status: "error", error: message });
      showError(message);
    }
  };

  useEffect(() => {
    if (verificationState.status !== "success") {
      return undefined;
    }

    if (pendingPurchase?.eventId && purchaseState.status !== "success") {
      return undefined;
    }

    const destination = pendingPurchase?.eventPath || (
      pendingPurchase?.eventId ? "/tickets" : "/account/wallet"
    );

    const timerId = window.setTimeout(() => {
      navigate(destination, { replace: true });
    }, 2000);

    return () => window.clearTimeout(timerId);
  }, [
    navigate,
    pendingPurchase?.eventId,
    pendingPurchase?.eventPath,
    purchaseState.status,
    verificationState.status,
  ]);

  return (
    <div className="tw:min-h-screen tw:bg-[#F6F7FB] tw:px-4 tw:pb-16 tw:pt-24 tw:font-sans">
      <div className="tw:mx-auto tw:max-w-2xl">
        <div className="tw:rounded-4xl tw:border tw:border-white/70 tw:bg-white tw:p-8 tw:text-center tw:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          {verificationState.status === "loading" ? (
            <>
              <div className="tw:mx-auto tw:h-14 tw:w-14 tw:animate-spin tw:rounded-full tw:border-4 tw:border-primary/20 tw:border-t-primary" />
              <div className="tw:mt-5 tw:text-3xl tw:font-semibold tw:text-gray-900">
                Verifying wallet funding
              </div>
              <div className="tw:mt-3 tw:text-sm tw:text-gray-500">
                We are confirming your payment and refreshing your wallet balance.
              </div>
            </>
          ) : verificationState.status === "error" ? (
            <>
              <div className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-100 tw:text-red-600">
                <RefreshCcw className="tw:h-8 tw:w-8" />
              </div>
              <div className="tw:mt-5 tw:text-3xl tw:font-semibold tw:text-gray-900">
                Verification needed
              </div>
              <div className="tw:mt-3 tw:text-sm tw:text-gray-500">
                {verificationState.error}
              </div>
              <button
                type="button"
                onClick={handleVerify}
                className="tw:mt-8 tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                style={{ borderRadius: 16 }}
              >
                Retry verification
              </button>
            </>
          ) : verificationState.status === "pending" ? (
            <>
              <div className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-100 tw:text-amber-700">
                <RefreshCcw className="tw:h-8 tw:w-8" />
              </div>
              <div className="tw:mt-5 tw:text-3xl tw:font-semibold tw:text-gray-900">
                Payment confirmation pending
              </div>
              <div className="tw:mt-3 tw:text-sm tw:text-gray-500">
                Cryptomus is still confirming your crypto payment. Your wallet
                will be credited automatically after the blockchain payment is
                confirmed and Cryptomus sends the webhook.
              </div>
              {reference ? (
                <div className="tw:mt-5 tw:rounded-2xl tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-xs tw:font-medium tw:text-amber-800">
                  Funding reference: {reference}
                </div>
              ) : null}
              <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleVerify({ force: true })}
                  disabled={verifyFunding.isPending}
                  className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  style={{ borderRadius: 16 }}
                >
                  {verifyFunding.isPending ? "Checking..." : "Check status"}
                </button>
                <button
                  onClick={() => navigate("/account/wallet")}
                  className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                  style={{ borderRadius: 16 }}
                >
                  View wallet
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-100 tw:text-emerald-600">
                <CheckCircle2 className="tw:h-8 tw:w-8" />
              </span>
              <div className="tw:mt-5 tw:text-3xl tw:font-semibold tw:text-gray-900">
                Wallet funded
              </div>
              <div className="tw:mt-3 tw:text-sm tw:text-gray-500">
                Your wallet funding has been verified successfully.
              </div>

              {pendingPurchase?.eventId ? (
                <div className="tw:mt-6 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-[linear-gradient(135deg,#e5e4e2,#ffffff)] tw:p-4 tw:text-left">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900">
                    <Ticket className="tw:h-4 tw:w-4 tw:text-primary" />
                    Ticket purchase continuation
                  </div>
                  <div className="tw:mt-2 tw:text-sm tw:text-gray-500">
                    {purchaseState.status === "loading"
                      ? "Completing your saved ticket purchase..."
                      : purchaseState.status === "success"
                        ? "Your saved ticket purchase has been completed."
                        : purchaseState.error ||
                          "You can finish your saved ticket purchase now."}
                  </div>

                  {purchaseState.status !== "success" && (
                    <button
                      type="button"
                      onClick={handleManualPurchase}
                      disabled={purchaseState.status === "loading"}
                      className="tw:mt-4 tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                      style={{ borderRadius: 16 }}
                    >
                      {purchaseState.status === "loading"
                        ? "Completing purchase..."
                        : "Complete ticket purchase"}
                    </button>
                  )}
                </div>
              ) : null}

              <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
                <button
                  onClick={() => navigate("/account/wallet")}
                  className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                  style={{ borderRadius: 16 }}
                >
                  View wallet
                </button>
                <Link
                  to={
                    purchaseState.status === "success"
                      ? "/tickets"
                      : pendingPurchase?.eventPath || "/feed"
                  }
                  className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                  style={{ borderRadius: 16 }}
                >
                  {purchaseState.status === "success"
                    ? "Go to my tickets"
                    : pendingPurchase?.eventPath
                      ? "Return to event"
                      : "Continue browsing"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
