import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Landmark,
} from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { showError } from "../../component/ui/toast";

const getCurrencySymbol = (currency) => {
  const normalized = String(currency || "").toUpperCase();
  if (normalized === "USD") return "$";
  if (normalized === "EUR") return "€";
  if (normalized === "GBP") return "£";
  return "₦";
};

const resolveCurrencySymbol = (payout) =>
  payout?.currency_symbol ||
  payout?.currency?.symbol ||
  getCurrencySymbol(payout?.currency?.code || payout?.currency);

const formatMoney = (value, symbol = "₦") => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusTone = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "tw:bg-emerald-50 tw:text-emerald-700";
  if (normalized === "pending" || normalized === "processing") {
    return "tw:bg-amber-50 tw:text-amber-700";
  }
  if (normalized === "cancelled" || normalized === "rejected") {
    return "tw:bg-red-50 tw:text-red-700";
  }
  return "tw:bg-gray-50 tw:text-gray-700";
};

const normalizeCollection = (response) => {
  const root = response?.data || {};
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root)) return root;
  return [];
};

const maskAccountNumber = (value = "") => {
  const accountNumber = String(value || "");
  return accountNumber.length <= 4
    ? accountNumber
    : `******${accountNumber.slice(-4)}`;
};

const resolveBankDetails = (payout) => {
  const bankDetails =
    payout?.bank_account ||
    (typeof payout?.bank_details === "object" && payout?.bank_details !== null
      ? payout.bank_details
      : null);

  const bankName =
    payout?.bank_name ||
    bankDetails?.bank_name ||
    (typeof payout?.bank_details === "string" ? payout.bank_details : "");
  const accountNumber = payout?.account_number || bankDetails?.account_number || "";
  const accountName = payout?.account_name || bankDetails?.account_name || "";

  return { bankName, accountNumber, accountName };
};

const HistorySkeleton = () => (
  <div className="tw:mt-4 tw:space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm tw:animate-pulse"
      >
        <div className="tw:h-4 tw:w-36 tw:rounded-xl tw:bg-gray-200" />
        <div className="tw:mt-3 tw:h-3 tw:w-full tw:max-w-[260px] tw:rounded-xl tw:bg-gray-100" />
        <div className="tw:mt-3 tw:h-3 tw:w-40 tw:rounded-xl tw:bg-gray-100" />
      </div>
    ))}
  </div>
);

function PayoutDetailsDialog({ open, payout, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const symbol = resolveCurrencySymbol(payout);
  const { bankName, accountNumber, accountName } = resolveBankDetails(payout);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>Payout details</DialogTitle>
      <DialogContent dividers>
        {payout ? (
          <div className="tw:space-y-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <div className="tw:rounded-2xl tw:border tw:border-neon/10 tw:bg-[#f8fafc] tw:p-3 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]">
                <div className="tw:text-xs tw:text-gray-500">Amount</div>
                <div className="tw:mt-1 tw:text-lg tw:font-semibold tw:text-gray-900">
                  {formatMoney(payout?.amount ?? 0, symbol)}
                </div>
              </div>
              <div className="tw:rounded-2xl tw:border tw:border-neon/10 tw:bg-[#f8fafc] tw:p-3 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]">
                <div className="tw:text-xs tw:text-gray-500">Status</div>
                <div className="tw:mt-1 tw:text-lg tw:font-semibold tw:text-gray-900 tw:capitalize">
                  {payout?.status || "unknown"}
                </div>
              </div>
            </div>

            <div className="tw:space-y-3 tw:text-sm">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-gray-500">Created</span>
                <span className="tw:text-gray-900">{formatDateTime(payout?.created_at)}</span>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-gray-500">Paid</span>
                <span className="tw:text-gray-900">{formatDateTime(payout?.paid_at)}</span>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-gray-500">Bank</span>
                <span className="tw:text-gray-900">{bankName || "—"}</span>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-gray-500">Account</span>
                <span className="tw:text-gray-900">
                  {accountName || "—"}
                  {accountNumber ? ` • ${maskAccountNumber(accountNumber)}` : ""}
                </span>
              </div>
            </div>

            {payout?.rejection_reason ? (
              <div className="tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:p-3 tw:text-sm tw:text-red-700">
                Rejection reason: {payout.rejection_reason}
              </div>
            ) : null}

            {payout?.admin_notes ? (
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-3 tw:text-sm tw:text-slate-700">
                Admin notes: {payout.admin_notes}
              </div>
            ) : null}

            {payout?.evidence_url ? (
              <a
                href={payout.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="tw:inline-flex tw:text-sm tw:font-semibold tw:text-primary"
              >
                View evidence
              </a>
            ) : null}
          </div>
        ) : (
          <div className="tw:text-sm tw:text-gray-500">No payout selected.</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AccountPayoutHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/organiser/payouts/history", {
        ...authHeaders(token),
        params: { per_page: 20, page },
      });
      const items = normalizeCollection(res);
      setHistory(items);
      setMeta(
        res?.data?.meta || {
          current_page: page,
          last_page: 1,
          per_page: 20,
          total: items.length,
        }
      );
    } catch (error) {
      console.error(error);
      showError("Could not load payout history.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const totalAmount = history.reduce(
      (sum, payout) => sum + Number(payout?.amount ?? 0),
      0
    );
    const pendingCount = history.filter((payout) =>
      ["pending", "processing"].includes(String(payout?.status || "").toLowerCase())
    ).length;
    const paidCount = history.filter(
      (payout) => String(payout?.status || "").toLowerCase() === "paid"
    ).length;

    return {
      totalAmount,
      pendingCount,
      paidCount,
    };
  }, [history]);

  return (
    <>
      <div className="tw:mx-auto tw:max-w-6xl tw:px-4 tw:pb-24 tw:pt-24 tw:sm:px-6 tw:md:pt-32 tw:lg:px-8">
        <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <Link
              to="/account/payouts/request"
              className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900"
            >
              <ArrowLeft className="tw:h-4 tw:w-4" />
              Back
            </Link>
            <span className="tw:text-lg tw:text-gray-900 tw:md:text-xl tw:lg:text-2xl">
              Payout history
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchHistory(meta.current_page || 1)}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm tw:hover:shadow-md"
          >
            <RefreshCw className="tw:h-4 tw:w-4" />
            Refresh
          </button>
        </div>

        <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:gap-3 tw:md:grid-cols-4">
          <div className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
            <div className="tw:text-sm tw:text-gray-500">Total records</div>
            <div className="tw:mt-2 tw:text-xl tw:font-bold tw:text-gray-900">
              {loading ? "—" : Number(meta.total || 0).toLocaleString()}
            </div>
          </div>
          <div className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
            <div className="tw:text-sm tw:text-gray-500">Current page</div>
            <div className="tw:mt-2 tw:text-xl tw:font-bold tw:text-gray-900">
              {loading ? "—" : meta.current_page || 1}
            </div>
          </div>
          <div className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
            <div className="tw:text-sm tw:text-gray-500">Pending items</div>
            <div className="tw:mt-2 tw:text-xl tw:font-bold tw:text-gray-900">
              {loading ? "—" : totals.pendingCount}
            </div>
          </div>
          <div className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
            <div className="tw:text-sm tw:text-gray-500">Paid items</div>
            <div className="tw:mt-2 tw:text-xl tw:font-bold tw:text-gray-900">
              {loading ? "—" : totals.paidCount}
            </div>
          </div>
        </div>

        <div className="tw:mb-4 tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-gray-500">
            <Landmark className="tw:h-4 tw:w-4" />
            Visible amount
          </div>
          <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900">
            {loading ? "—" : formatMoney(totals.totalAmount)}
          </div>
        </div>

        {loading ? (
          <HistorySkeleton />
        ) : history.length === 0 ? (
          <div className="tw:rounded-3xl tw:bg-white tw:p-6 tw:shadow-sm">
            <div className="tw:font-semibold tw:text-gray-900">No payout history yet</div>
            <div className="tw:mt-1 tw:text-sm tw:text-gray-600">
              Completed and pending payout requests will appear here.
            </div>
          </div>
        ) : (
          <div className="tw:space-y-3">
            {history.map((payout) => {
              const symbol = resolveCurrencySymbol(payout);
              const normalizedStatus = String(payout?.status || "").toLowerCase();
              const { bankName, accountNumber } = resolveBankDetails(payout);

              return (
                <button
                  key={payout?.id}
                  type="button"
                  onClick={() => setSelectedPayout(payout)}
                  className="tw:w-full tw:rounded-3xl tw:bg-white tw:p-4 tw:text-left tw:shadow-sm tw:transition hover:tw:shadow-md"
                >
                  <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                    <div className="tw:min-w-0">
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                        <span className="tw:font-semibold tw:text-gray-900">
                          {formatMoney(payout?.amount ?? 0, symbol)}
                        </span>
                        <span
                          className={`tw:rounded-full tw:px-2.5 tw:py-1 tw:text-xs tw:capitalize ${statusTone(
                            payout?.status
                          )}`}
                        >
                          {payout?.status || "unknown"}
                        </span>
                      </div>

                      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:text-sm tw:text-gray-600">
                        <span className="tw:flex tw:items-center tw:gap-1">
                          <Clock3 className="tw:h-4 tw:w-4 tw:text-gray-400" />
                          {formatDateTime(payout?.created_at)}
                        </span>
                        <span className="tw:flex tw:items-center tw:gap-1">
                          {normalizedStatus === "paid" ? (
                            <CheckCircle2 className="tw:h-4 tw:w-4 tw:text-emerald-500" />
                          ) : (
                            <AlertCircle className="tw:h-4 tw:w-4 tw:text-amber-500" />
                          )}
                          {bankName || "Bank details unavailable"}
                          {accountNumber ? ` • ${maskAccountNumber(accountNumber)}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-primary">
                      <Eye className="tw:h-4 tw:w-4" />
                      View details
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="tw:mt-6 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
            <button
              type="button"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => fetchHistory(meta.current_page - 1)}
              className="tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
            >
              Previous
            </button>
            <div className="tw:text-sm tw:text-gray-500">
              Page {meta.current_page} of {meta.last_page}
            </div>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => fetchHistory(meta.current_page + 1)}
              className="tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <PayoutDetailsDialog
        open={!!selectedPayout}
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />
    </>
  );
}
