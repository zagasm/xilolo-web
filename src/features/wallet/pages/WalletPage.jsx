import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { MenuItem, Pagination, TextField } from "@mui/material";
import WalletBalanceCard from "../components/WalletBalanceCard";
import FundWalletModal from "../components/FundWalletModal";
import { useWalletSummary } from "../hooks/useWalletSummary";
import { useWalletTransactions } from "../hooks/useWalletTransactions";
import {
  formatWalletMoney,
  getWalletCurrencyCode,
} from "../walletUtils";

const DEFAULT_TRANSACTION_FILTERS = {
  page: 1,
  per_page: 20,
  status: "all",
  direction: "all",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "successful", label: "Successful" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const DIRECTION_OPTIONS = [
  { value: "all", label: "All directions" },
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
];

function buildTransactionFilters(filters) {
  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (value === "all" || value === "" || value == null) {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
}

function formatTransactionDate(value) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WalletPage() {
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState(
    DEFAULT_TRANSACTION_FILTERS
  );
  const walletSummary = useWalletSummary();
  const transactionsQuery = useWalletTransactions(
    buildTransactionFilters(transactionFilters)
  );
  const navigate = useNavigate();

  const transactions = useMemo(
    () => transactionsQuery.data?.items || [],
    [transactionsQuery.data]
  );
  const pagination = transactionsQuery.data?.meta || {
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: transactionFilters.per_page,
  };

  const currencyCode = getWalletCurrencyCode(walletSummary.data);

  const handleFilterChange = (key, value) => {
    setTransactionFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (_event, page) => {
    setTransactionFilters((current) => ({
      ...current,
      page,
    }));
  };

  return (
    <>
      <div className="tw:min-h-screen tw:bg-white tw:px-4 tw:pb-16 tw:pt-24 tw:font-sans tw:md:px-6 tw:lg:px-8">
        <div className="tw:mx-auto tw:max-w-5xl">
          <div className="tw:flex tw:flex-col tw:gap-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-gray-500 tw:hover:text-gray-900"
              >
                <ArrowLeft className="tw:h-4 tw:w-4" />
                <span>Back</span>
              </button>
              <div className="tw:mt-4 tw:text-3xl tw:font-semibold tw:text-gray-900">
                Wallet
              </div>
              <div className="tw:mt-2 tw:text-sm tw:text-gray-500">
                Manage your user wallet.
              </div>
            </div>

          </div>

          <div className="tw:mt-6">
            {walletSummary.isError ? (
              <div className="tw:rounded-[28px] tw:border tw:border-red-100 tw:bg-red-50 tw:p-5 tw:text-sm tw:text-red-700">
                Unable to load your wallet right now.
                <button
                  type="button"
                  onClick={() => walletSummary.refetch()}
                  className="tw:ml-2 tw:font-semibold tw:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <WalletBalanceCard
                summary={walletSummary.data}
                loading={walletSummary.isLoading}
                onFund={() => setFundModalOpen(true)}
              />
            )}
          </div>

          <div className="tw:mt-6 tw:rounded-[30px] tw:border tw:border-white/70 tw:bg-[#f6f7fb] tw:p-5 tw:shadow-[0_18px_50px_rgba(15,23,42,0.08)] tw:md:p-7">
            <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:justify-between">
              <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                Recent transactions
              </div>
            </div>

            <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-3">
              <TextField
                select
                label="Status"
                value={transactionFilters.status}
                onChange={(event) =>
                  handleFilterChange("status", event.target.value)
                }
                fullWidth
                size="small"
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Direction"
                value={transactionFilters.direction}
                onChange={(event) =>
                  handleFilterChange("direction", event.target.value)
                }
                fullWidth
                size="small"
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Per page"
                value={transactionFilters.per_page}
                onChange={(event) =>
                  handleFilterChange("per_page", Number(event.target.value))
                }
                fullWidth
                size="small"
              >
                {[10, 20, 50].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} per page
                  </MenuItem>
                ))}
              </TextField>
            </div>

            {transactionsQuery.isLoading ? (
              <div className="tw:mt-5 tw:space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="tw:h-20 tw:animate-pulse tw:rounded-3xl tw:bg-gray-100"
                  />
                ))}
              </div>
            ) : transactionsQuery.isError ? (
              <div className="tw:mt-5 tw:rounded-2xl tw:border tw:border-red-100 tw:bg-red-50 tw:p-4 tw:text-sm tw:text-red-700">
                Unable to load wallet transactions.
                <button
                  type="button"
                  onClick={() => transactionsQuery.refetch()}
                  className="tw:ml-2 tw:font-semibold tw:underline"
                >
                  Retry
                </button>
              </div>
            ) : !transactions.length ? (
              <div className="tw:mt-5 tw:rounded-3xl tw:border-gray-200 tw:bg-[#fcfcfe] tw:p-6 tw:text-center tw:text-sm tw:text-gray-500">
                No wallet transactions match the current filters.
              </div>
            ) : (
              <>
                <div className="tw:mt-5 tw:space-y-3">
                  {transactions.map((transaction, index) => {
                    const isDebit =
                      String(transaction?.direction || "").toLowerCase() ===
                      "debit";
                    const amountColor = isDebit
                      ? "tw:text-red-600"
                      : "tw:text-emerald-600";

                    return (
                      <div
                        key={transaction?.id || transaction?.reference || index}
                        className="tw:flex tw:flex-col tw:gap-3 tw:rounded-3xl tw:border tw:border-gray-100 tw:bg-[#fcfcfe] tw:p-4 tw:md:flex-row tw:md:items-center tw:md:justify-between"
                      >
                        <div>
                          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                            <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                              {transaction?.reference || "Wallet transaction"}
                            </div>
                            {transaction?.status ? (
                              <span className="tw:rounded-full tw:bg-white tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:text-gray-500 tw:capitalize">
                                {transaction.status}
                              </span>
                            ) : null}
                            {transaction?.direction ? (
                              <span className="tw:rounded-full tw:bg-white tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:text-gray-500 tw:capitalize">
                                {transaction.direction}
                              </span>
                            ) : null}
                          </div>
                          <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                            {transaction?.purpose
                              ? `${String(transaction.purpose)
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) =>
                                  char.toUpperCase()
                                )} • `
                              : ""}
                            {formatTransactionDate(
                              transaction?.created_at || transaction?.credited_at
                            )}
                          </div>
                        </div>
                        <div className={`tw:text-sm tw:font-semibold ${amountColor}`}>
                          {isDebit ? "-" : "+"}
                          {formatWalletMoney(
                            Number(
                              transaction?.amount ??
                              transaction?.credited_amount ??
                              transaction?.requested_credit_amount ??
                              0
                            ),
                            transaction?.currency?.code ||
                            transaction?.currency ||
                            currencyCode
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                  <div className="tw:text-sm tw:text-gray-500">
                    Showing page {pagination.currentPage} of {pagination.lastPage}
                    {pagination.total
                      ? ` • ${Number(pagination.total).toLocaleString()} total transactions`
                      : ""}
                  </div>
                  <Pagination
                    page={pagination.currentPage}
                    count={pagination.lastPage}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    siblingCount={0}
                    boundaryCount={1}
                  />
                </div>
              </>)}
          </div>
        </div>
      </div>

      <FundWalletModal
        open={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        source="wallet_page"
      />
    </>
  );
}
