import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";
import {
  selectLastWalletFunding,
  selectPendingWalletPurchase,
} from "../store/walletFlowSlice";

const CRYPTOMUS_FAILED_STATUSES = [
  "fail",
  "wrong_amount",
  "cancel",
  "system_fail",
  "refund_fail",
];

export default function WalletFundingCancelPage() {
  const [searchParams] = useSearchParams();
  const pendingPurchase = useSelector(selectPendingWalletPurchase);
  const lastFunding = useSelector(selectLastWalletFunding);
  const navigate = useNavigate();
  const provider = String(
    searchParams.get("provider") || lastFunding?.provider || ""
  ).toLowerCase();
  const cryptomusStatus = String(
    searchParams.get("status") || searchParams.get("payment_status") || ""
  ).toLowerCase();
  const reference =
    searchParams.get("reference") ||
    searchParams.get("order_id") ||
    lastFunding?.reference ||
    "";
  const isCryptomusReturn =
    provider === "cryptomus" ||
    searchParams.has("uuid") ||
    searchParams.has("order_id") ||
    searchParams.has("payment_uuid");
  const isFailedCryptomusStatus =
    isCryptomusReturn && CRYPTOMUS_FAILED_STATUSES.includes(cryptomusStatus);

  const title = isFailedCryptomusStatus
    ? "Crypto payment was not completed"
    : "Funding cancelled";
  const description = isCryptomusReturn
    ? "Your Cryptomus checkout did not complete successfully. If you already sent crypto, wait a few minutes and check your wallet before starting a new payment."
    : "Your wallet was not charged. You can return to your wallet and try again when you are ready.";

  return (
    <div className="tw:min-h-screen tw:bg-[#F6F7FB] tw:px-4 tw:pb-16 tw:pt-24 tw:font-sans">
      <div className="tw:mx-auto tw:max-w-2xl">
        <div className="tw:rounded-4xl tw:border tw:border-white/70 tw:bg-white tw:p-8 tw:text-center tw:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <span className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-100 tw:text-amber-700">
            <AlertCircle className="tw:h-8 tw:w-8" />
          </span>
          <div className="tw:mt-5 tw:text-3xl tw:font-semibold tw:text-gray-900">
            {title}
          </div>
          <div className="tw:mt-3 tw:text-sm tw:text-gray-500">
            {description}
          </div>
          {reference ? (
            <div className="tw:mt-5 tw:rounded-2xl tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-xs tw:font-medium tw:text-amber-800">
              Funding reference: {reference}
            </div>
          ) : null}
          {cryptomusStatus ? (
            <div className="tw:mt-2 tw:text-xs tw:font-medium tw:text-gray-500">
              Cryptomus status: {cryptomusStatus}
            </div>
          ) : null}

          <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
            <button
              onClick={() => navigate("/account/wallet")}
              className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
              style={{ borderRadius: 16, color: "white" }}
            >
              Go to wallet
            </button>
            {pendingPurchase?.eventPath ? (
              <Link
                to={pendingPurchase.eventPath}
                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                style={{ borderRadius: 16 }}
              >
                Return to event
              </Link>
            ) : (
              <Link
                to="/feed"
                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-gray-800 tw:hover:bg-gray-200"
                style={{ borderRadius: 16 }}
              >
                View All Events
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
