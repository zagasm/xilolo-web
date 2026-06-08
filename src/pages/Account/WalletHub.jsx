import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Landmark,
  WalletCards,
} from "lucide-react";

const payoutItems = [
  {
    icon: Landmark,
    label: "Request Payout",
    description: "View your balance, ticket sales, and submit a withdrawal request.",
    to: "/account/payouts/request",
  },
  {
    icon: WalletCards,
    label: "My bank accounts",
    description: "Add, remove, and set the bank accounts used for organiser payouts.",
    to: "/account/bank-accounts",
  },
];

export default function WalletHub() {
  return (
    <div className="tw:min-h-screen tw:w-full tw:bg-[#F6F7FB] tw:px-4 tw:pb-16 tw:pt-24 tw:font-sans tw:md:px-6 tw:lg:px-8">
      <div className="tw:mx-auto tw:w-full tw:max-w-4xl">
        <div className="tw:md:rounded-4xl tw:md:border tw:md:border-gray-100 tw:md:bg-white tw:md:shadow-[0_18px_50px_rgba(15,23,42,0.08),0_0_20px_rgba(0,245,255,0.05)] tw:md:p-7">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div>
              <Link
                to="/account"
                className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-gray-500 hover:tw:text-gray-900"
              >
                <ArrowLeft className="tw:h-4 tw:w-4" />
                <span>Back to account</span>
              </Link>

              <span className="tw:mt-3 tw:block tw:text-2xl tw:font-semibold tw:text-gray-900 tw:md:text-3xl">
                Payouts
              </span>
              <span className="tw:mt-2 tw:block tw:max-w-2xl tw:text-sm tw:text-gray-600 tw:md:text-base">
                Choose what you want to do next.
              </span>
            </div>
          </div>

          <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-4">
            {payoutItems.map(({ icon: Icon, label, description, to }) => (
              <Link
                key={label}
                to={to}
                className="tw:flex tw:items-center tw:justify-between tw:rounded-[28px] tw:border tw:border-gray-100 tw:bg-[#fbfbfd] tw:px-4 tw:py-4 tw:transition hover:tw:border-neon/30 hover:tw:bg-white hover:tw:shadow-[0_14px_34px_rgba(15,23,42,0.08),0_0_18px_rgba(0,245,255,0.08)] tw:md:p-5"
              >
                <div className="tw:flex tw:items-center tw:gap-4">
                  <span className="tw:flex tw:size-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-white tw:shadow-sm">
                    <Icon className="tw:size-5 tw:text-gray-700" />
                  </span>

                  <div>
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                      {label}
                    </div>
                    <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:md:text-sm">
                      {description}
                    </div>
                  </div>
                </div>

                <ChevronRight className="tw:h-5 tw:w-5 tw:text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
