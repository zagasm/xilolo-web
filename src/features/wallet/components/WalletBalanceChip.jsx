import React from "react";
import { Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useWalletSummary } from "../hooks/useWalletSummary";
import {
  formatWalletMoney,
  getWalletBalanceAmount,
  getWalletCurrencyCode,
} from "../walletUtils";

export default function WalletBalanceChip() {
  const { data, isLoading, isError } = useWalletSummary();

  if (isError) return null;

  return (
    <Link
      to="/account/wallet"
      className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-800 tw:hover:bg-white"
    >
      <Wallet className="tw:h-4 tw:w-4 tw:text-primary" />
      {isLoading ? (
        <span className="tw:inline-block tw:h-3 tw:w-16 tw:animate-pulse tw:rounded-full tw:bg-gray-200" />
      ) : (
        <span>
          {formatWalletMoney(
            getWalletBalanceAmount(data),
            getWalletCurrencyCode(data)
          )}
        </span>
      )}
    </Link>
  );
}
