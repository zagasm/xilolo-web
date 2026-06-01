import React from "react";
import { Wallet } from "lucide-react";
import {
  formatWalletMoney,
  getWalletBalanceAmount,
  getWalletCurrencyCode,
} from "../walletUtils";

export default function WalletBalanceCard({ summary, loading = false, onFund }) {
  return (
    <div className="tw:rounded-[30px] tw:border tw:border-white/70 tw:bg-[#f6f7fb] tw:p-5 tw:shadow-[0_18px_50px_rgba(15,23,42,0.08)] tw:md:p-7">
      <div className="tw:flex tw:flex-col tw:gap-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
        <div>
          <div className="tw:flex tw:items-center tw:gap-3">
            <span className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-[18px] tw:bg-[#f4efff] tw:text-primary">
              <Wallet className="tw:h-5 tw:w-5" />
            </span>
            <div>
              <div className="tw:text-sm tw:font-medium tw:text-gray-500">
                User wallet balance
              </div>
              {loading ? (
                <div className="tw:mt-2 tw:h-9 tw:w-44 tw:animate-pulse tw:rounded-full tw:bg-gray-100" />
              ) : (
                <div className="tw:mt-2 tw:text-3xl tw:font-semibold tw:text-gray-900">
                  {formatWalletMoney(
                    getWalletBalanceAmount(summary),
                    getWalletCurrencyCode(summary)
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onFund}
          className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white hover:tw:bg-primarySecond"
          style={{ borderRadius: 18 }}
        >
          Fund wallet
        </button>
      </div>
    </div>
  );
}
