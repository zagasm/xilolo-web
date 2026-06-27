import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Coins,
  History,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Wallet,
} from "lucide-react";
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { showError, showPromise } from "../../component/ui/toast";
import AddWalletModal from "../../component/crypto/AddWalletModal";
import VerifyWalletModal from "../../component/crypto/VerifyWalletModal";
import {
  addBankAccount,
  clearBankMutationState,
  clearBankVerification,
  verifyBankAccount,
} from "../../store/bankAccountsSlice";
import {
  selectIsAddingBankAccount,
  selectIsVerifyingBankAccount,
  selectVerifiedBankAccount,
} from "../../store/bankAccountsSelectors";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const getCurrencySymbol = (currency) => {
  const normalized = String(currency || "").toUpperCase();
  if (normalized === "USD") return "$";
  if (normalized === "EUR") return "€";
  if (normalized === "GBP") return "£";
  return "₦";
};

const resolveCurrencySymbol = (payload) =>
  payload?.currency_symbol ||
  payload?.currency?.symbol ||
  getCurrencySymbol(payload?.currency?.code || payload?.currency);

const formatMoney = (value, symbol = "₦") => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const getTicketSaleTitle = (item) =>
  item?.event_title || item?.title || item?.event?.title || "Untitled event";

const getTicketSaleDate = (item) =>
  item?.event_date ||
  item?.date ||
  item?.event?.event_date ||
  item?.event?.eventDate ||
  item?.event?.starts_at;

const getTicketSaleStatus = (item) =>
  item?.event_status || item?.status || item?.event?.status || "unknown";

const getTicketsSold = (item) =>
  Number(
    item?.tickets_sold_count ??
    item?.tickets_sold ??
    item?.ticketsSold ??
    item?.sold_count ??
    0
  );

const getBankDisplayName = (account) =>
  account?.bank_name || account?.bank?.name || "Bank account";

const getBankVerificationLabel = (account) => {
  if (typeof account?.verification_state === "string") {
    return account.verification_state;
  }
  if (typeof account?.verification_status === "string") {
    return account.verification_status;
  }
  if (account?.is_verified) return "verified";
  return "";
};

function AddBankAccountDialog({ open, onClose, banks, banksLoading, onSubmit }) {
  const dispatch = useDispatch();
  const verifiedAccount = useSelector(selectVerifiedBankAccount);
  const isVerifying = useSelector(selectIsVerifyingBankAccount);
  const isAdding = useSelector(selectIsAddingBankAccount);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedBank(null);
      setAccountNumber("");
      setSetAsDefault(false);
      dispatch(clearBankVerification());
      dispatch(clearBankMutationState("add"));
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedBank?.code || accountNumber.length !== 10) {
      dispatch(clearBankVerification());
      return;
    }

    const id = setTimeout(() => {
      dispatch(verifyBankAccount({ bankCode: selectedBank.code, accountNumber }));
    }, 350);

    return () => clearTimeout(id);
  }, [accountNumber, dispatch, open, selectedBank]);

  const canSubmit =
    !!selectedBank &&
    accountNumber.length === 10 &&
    !!verifiedAccount &&
    !isVerifying &&
    !isAdding;

  return (
    <MuiDialog open={open} onClose={isAdding ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Add bank account</DialogTitle>
      <DialogContent>
        <div className="tw:space-y-4 tw:pt-2">
          <Autocomplete
            options={banks}
            loading={banksLoading}
            value={selectedBank}
            onChange={(_, value) => setSelectedBank(value)}
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) => option?.code === value?.code}
            renderInput={(params) => <TextField {...params} label="Select bank" />}
          />
          <TextField
            label="Account number"
            value={accountNumber}
            onChange={(event) =>
              setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={setAsDefault}
                onChange={(event) => setSetAsDefault(event.target.checked)}
              />
            }
            label="Set as default account"
          />
          <div className="tw:min-h-20 tw:rounded-3xl tw:border tw:border-neon/15 tw:bg-[#fbfbfd] tw:p-4 tw:text-xs tw:text-gray-600 tw:shadow-[0_0_16px_rgba(0,245,255,0.05)]">
            {isVerifying ? (
              <div className="tw:flex tw:items-center tw:gap-3">
                <CircularProgress size={18} />
                Verifying account details...
              </div>
            ) : verifiedAccount ? (
              <div className="tw:space-y-1">
                <div className="tw:flex tw:items-center tw:gap-2 tw:font-semibold tw:text-gray-900">
                  <BadgeCheck className="tw:h-4 tw:w-4 tw:text-green-600" />
                  {verifiedAccount.account_name}
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {selectedBank?.name} - {maskAccountNumber(accountNumber)}
                </div>
              </div>
            ) : (
              "Select a bank and enter a 10-digit account number to verify it."
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 24px" }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isAdding}
          style={{ borderRadius: 16 }}
          className="tw:h-11 tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({ bankCode: selectedBank.code, accountNumber, setAsDefault })
          }
          style={{ borderRadius: 16 }}
          className="tw:h-11 tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
        >
          {isAdding ? "Saving..." : "Add account"}
        </button>
      </DialogActions>
    </MuiDialog>
  );
}

const SkeletonBlock = ({ className }) => (
  <div
    className={cx("tw:animate-pulse tw:rounded-2xl tw:bg-gray-200", className)}
  />
);

const StatsSkeleton = ({ cards = 3 }) => (
  <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-3">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
        <SkeletonBlock className="tw:h-4 tw:w-24" />
        <SkeletonBlock className="tw:mt-3 tw:h-7 tw:w-32" />
        <SkeletonBlock className="tw:mt-3 tw:h-3 tw:w-24" />
      </div>
    ))}
  </div>
);

const ListSkeleton = ({ rows = 4 }) => (
  <div className="tw:space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-sm">
        <SkeletonBlock className="tw:h-4 tw:w-40" />
        <SkeletonBlock className="tw:mt-3 tw:h-3 tw:w-full tw:max-w-[360px]" />
        <SkeletonBlock className="tw:mt-2 tw:h-3 tw:w-56" />
      </div>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)]">
    <div className="tw:flex tw:items-center tw:justify-between">
      <span className="tw:text-sm tw:text-gray-500">{label}</span>
      {Icon ? <Icon className="tw:h-4 tw:w-4 tw:text-gray-400" /> : null}
    </div>
    <div className="tw:mt-2 tw:text-lg tw:font-bold tw:text-gray-900 tw:md:text-xl">
      {value}
    </div>
    {hint ? <div className="tw:mt-1 tw:text-xs tw:text-gray-500">{hint}</div> : null}
  </div>
);

function WithdrawDialog({
  open,
  onClose,
  balance,
  accounts,
  cryptoWallets,
  payoutMethod,
  onSelectPayoutMethod,
  selectedAccountId,
  onSelectAccount,
  selectedCryptoWalletId,
  onSelectCryptoWallet,
  onAddBankAccount,
  onAddCryptoWallet,
  onSubmit,
  submitting,
}) {
  const symbol = resolveCurrencySymbol(balance);
  const availableBalance = Number(balance?.available_balance ?? 0);
  const hasAccounts = accounts.length > 0;
  const hasCryptoWallets = cryptoWallets.length > 0;
  const hasAvailableBalance = availableBalance > 0;
  const canSubmit =
    hasAvailableBalance &&
    (payoutMethod === "crypto" ? hasCryptoWallets : hasAccounts);

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog
        as="div"
        className="tw:relative tw:z-50"
        onClose={submitting ? () => { } : onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:transition tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:translate-y-2 tw:sm:translate-y-0 tw:sm:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leave="tw:transition tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:sm:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-2 tw:sm:translate-y-0 tw:sm:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-xl tw:rounded-3xl tw:border tw:border-gray-100 tw:bg-white tw:p-5 tw:shadow-[0_24px_64px_rgba(15,23,42,0.18)] tw:sm:p-6">
                <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
                  Request Payout
                </span>
                <p className="tw:mt-1 tw:text-xs tw:text-gray-500">
                  Choose where to receive your available balance.
                </p>

                <div className="tw:mt-5 tw:rounded-2xl tw:border tw:border-neon/10 tw:bg-[#f8fafc] tw:p-4 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]">
                  <div className="tw:text-xs tw:text-gray-500">
                    Amount to be withdrawn
                  </div>
                  <div className="tw:mt-1 tw:text-lg tw:font-semibold tw:text-gray-900">
                    {formatMoney(availableBalance, symbol)}
                  </div>
                  <p className="tw:mt-2 tw:text-xs tw:text-gray-500">
                    This withdrawal request will submit your full available balance.
                  </p>
                </div>

                <div className="tw:mt-4">
                  <label className="tw:mb-2 tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                    Payout method
                  </label>
                  <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPayoutMethod("bank")}
                      className={cx(
                        "tw:rounded-2xl tw:border tw:px-3 tw:py-2 tw:text-sm tw:font-semibold",
                        payoutMethod === "bank"
                          ? "tw:border-primary tw:bg-primary/5 tw:text-primary"
                          : "tw:border-gray-200 tw:bg-white tw:text-gray-700"
                      )}
                    >
                      Bank account
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPayoutMethod("crypto")}
                      className={cx(
                        "tw:rounded-2xl tw:border tw:px-3 tw:py-2 tw:text-sm tw:font-semibold",
                        payoutMethod === "crypto"
                          ? "tw:border-primary tw:bg-primary/5 tw:text-primary"
                          : "tw:border-gray-200 tw:bg-white tw:text-gray-700"
                      )}
                    >
                      Crypto wallet
                    </button>
                  </div>
                  {!hasAvailableBalance ? (
                    <div className="tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-sm tw:text-amber-800">
                      You need an available balance before submitting a withdrawal.
                    </div>
                  ) : payoutMethod === "crypto" ? (
                    !hasCryptoWallets ? (
                      <div className="tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3">
                        <div className="tw:text-sm tw:text-amber-800 tw:mb-2">
                          Add and verify a crypto wallet first before submitting a crypto payout.
                        </div>
                        <button
                          style={{
                            borderRadius: 20
                          }}
                          type="button"
                          onClick={onAddCryptoWallet}
                          className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-white"
                        >
                          <Plus className="tw:h-4 tw:w-4" />
                          Add crypto wallet
                        </button>
                      </div>
                    ) : (
                      <div className="tw:space-y-2">
                        <button
                          type="button"
                          onClick={onAddCryptoWallet}
                          className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-gray-100 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-800"
                        >
                          <Plus className="tw:h-4 tw:w-4" />
                          Add another wallet
                        </button>
                        <div className="tw:max-h-64 tw:space-y-2 tw:overflow-y-auto">
                          {cryptoWallets.map((wallet) => {
                            const checked =
                              String(selectedCryptoWalletId) === String(wallet?.id);
                            const verified =
                              wallet?.status === "verified" || !!wallet?.verified_at;

                            return (
                              <label
                                key={wallet?.id}
                                className={cx(
                                  "tw:flex tw:cursor-pointer tw:items-start tw:justify-between tw:gap-3 tw:rounded-2xl tw:border tw:p-3",
                                  checked
                                    ? "tw:border-primary tw:bg-primary/5"
                                    : "tw:border-gray-200 tw:bg-white"
                                )}
                              >
                                <div className="tw:min-w-0">
                                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                                    <span className="tw:font-semibold tw:text-gray-900">
                                      {String(wallet?.currency || "Crypto").toUpperCase()} on{" "}
                                      {wallet?.network || "network"}
                                    </span>
                                    {wallet?.is_primary ? (
                                      <span className="tw:rounded-full tw:bg-primary/10 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-primary">
                                        Primary
                                      </span>
                                    ) : null}
                                    <span
                                      className={cx(
                                        "tw:rounded-full tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:capitalize",
                                        verified
                                          ? "tw:bg-emerald-50 tw:text-emerald-700"
                                          : "tw:bg-amber-50 tw:text-amber-700"
                                      )}
                                    >
                                      {verified ? "verified" : wallet?.status || "pending"}
                                    </span>
                                  </div>
                                  <div className="tw:mt-1 tw:truncate tw:text-sm tw:text-gray-600">
                                    {wallet?.address || "Wallet address"}
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  name="withdraw-crypto-wallet"
                                  checked={checked}
                                  onChange={() => onSelectCryptoWallet(wallet?.id)}
                                  className="tw:mt-1"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ) : !hasAccounts ? (
                    <div className="tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3">
                      <div className="tw:text-sm tw:text-amber-800">
                        Add a bank account first before submitting a withdrawal.
                      </div>
                      <button
                        type="button"
                        onClick={onAddBankAccount}
                        className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-white"
                      >
                        <Plus className="tw:h-4 tw:w-4" />
                        Add bank account
                      </button>
                    </div>
                  ) : (
                    <div className="tw:space-y-2">
                      <button
                        type="button"
                        onClick={onAddBankAccount}
                        className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-gray-100 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-800"
                      >
                        <Plus className="tw:h-4 tw:w-4" />
                        Add another account
                      </button>
                      <div className="tw:max-h-64 tw:space-y-2 tw:overflow-y-auto">
                        {accounts.map((account) => {
                          const verificationLabel = getBankVerificationLabel(account);
                          const checked = String(selectedAccountId) === String(account?.id);

                          return (
                            <label
                              key={account?.id}
                              className={cx(
                                "tw:flex tw:cursor-pointer tw:items-start tw:justify-between tw:gap-3 tw:rounded-2xl tw:border tw:p-3",
                                checked
                                  ? "tw:border-primary tw:bg-primary/5"
                                  : "tw:border-gray-200 tw:bg-white"
                              )}
                            >
                              <div className="tw:min-w-0">
                                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                                  <span className="tw:font-semibold tw:text-gray-900">
                                    {getBankDisplayName(account)}
                                  </span>
                                  {account?.is_default ? (
                                    <span className="tw:rounded-full tw:bg-primary/10 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-primary">
                                      Default
                                    </span>
                                  ) : null}
                                  {verificationLabel ? (
                                    <span className="tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:capitalize">
                                      {verificationLabel}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="tw:mt-1 tw:text-sm tw:text-gray-600">
                                  {account?.account_name || "Account holder"} •{" "}
                                  {maskAccountNumber(account?.account_number)}
                                </div>
                              </div>
                              <input
                                type="radio"
                                name="withdraw-bank-account"
                                checked={checked}
                                onChange={() => onSelectAccount(account?.id)}
                                className="tw:mt-1"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="tw:mt-6 tw:flex tw:items-center tw:justify-end tw:gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    style={{ borderRadius: 20, fontSize: 12 }}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-medium tw:text-gray-800 tw:transition tw:hover:bg-gray-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting || !canSubmit}
                    style={{ borderRadius: 20, fontSize: 12 }}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:text-sm tw:font-medium tw:text-white tw:transition tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit withdrawal"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AccountPayouts() {
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const isOrganizer = !!user?.is_organiser_verified;

  const [balance, setBalance] = useState(null);
  const [ticketSales, setTicketSales] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cryptoWallets, setCryptoWallets] = useState([]);
  const [banks, setBanks] = useState([]);
  const [cryptoOptions, setCryptoOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(false);
  const [cryptoOptionsLoading, setCryptoOptionsLoading] = useState(false);
  const [ticketSalesLoading, setTicketSalesLoading] = useState(true);
  const [sectionError, setSectionError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const [verifyWalletOpen, setVerifyWalletOpen] = useState(false);
  const [walletToVerify, setWalletToVerify] = useState(null);
  const [walletOwnership, setWalletOwnership] = useState(null);
  const [payoutMethod, setPayoutMethod] = useState("bank");
  const [selectedWithdrawBankAccountId, setSelectedWithdrawBankAccountId] =
    useState("");
  const [selectedWithdrawCryptoWalletId, setSelectedWithdrawCryptoWalletId] =
    useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const fetchBalance = async () => {
    const res = await api.get("/api/v1/organiser/payouts/balance", authHeaders(token));
    return res?.data?.data || null;
  };

  const fetchTicketSales = async () => {
    const res = await api.get("/api/v1/organiser/payouts/ticket-sales", {
      ...authHeaders(token),
      params: { per_page: 20, page: 1 },
    });
    return normalizeCollection(res);
  };

  const fetchBankAccounts = async () => {
    const res = await api.get(
      "/api/v1/organiser/kyc/bank-accounts",
      authHeaders(token)
    );
    return normalizeCollection(res);
  };

  const fetchBanksDirectory = async () => {
    const res = await api.get("/api/v1/banks", authHeaders(token));
    return res?.data?.banks || [];
  };

  const fetchCryptoWallets = async () => {
    const res = await api.get("/api/v1/crypto-wallets", authHeaders(token));
    return normalizeCollection(res).filter(
      (wallet) => wallet?.status === "verified" || !!wallet?.verified_at
    );
  };

  const fetchCryptoOptions = async () => {
    const res = await api.get("/api/v1/crypto/options", authHeaders(token));
    return res?.data?.data || [];
  };

  const loadPage = async () => {
    setLoading(true);
    setTicketSalesLoading(true);
    setSectionError("");

    try {
      const [
        balanceResult,
        ticketSalesResult,
        bankAccountsResult,
        cryptoWalletsResult,
      ] =
        await Promise.all([
          fetchBalance(),
          fetchTicketSales(),
          fetchBankAccounts(),
          fetchCryptoWallets(),
        ]);

      setBalance(balanceResult);
      setTicketSales(ticketSalesResult);
      setBankAccounts(bankAccountsResult);
      setCryptoWallets(cryptoWalletsResult);
    } catch (error) {
      console.error(error);
      setSectionError("Could not load payout information right now. Please try again.");
    } finally {
      setLoading(false);
      setTicketSalesLoading(false);
    }
  };

  useEffect(() => {
    if (!isOrganizer) return;
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganizer]);

  useEffect(() => {
    if (!isOrganizer || !token) return;

    const loadDestinationOptions = async () => {
      setBanksLoading(true);
      setCryptoOptionsLoading(true);
      try {
        const [banksResult, cryptoOptionsResult] = await Promise.all([
          fetchBanksDirectory(),
          fetchCryptoOptions(),
        ]);
        setBanks(banksResult);
        setCryptoOptions(cryptoOptionsResult);
      } catch (error) {
        console.error(error);
        showError("Could not load payout destination options.");
      } finally {
        setBanksLoading(false);
        setCryptoOptionsLoading(false);
      }
    };

    loadDestinationOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganizer, token]);

  useEffect(() => {
    const defaultAccount = bankAccounts.find((account) => account?.is_default);
    if (!defaultAccount && bankAccounts.length === 0) {
      setSelectedWithdrawBankAccountId("");
      return;
    }

    setSelectedWithdrawBankAccountId((current) => {
      if (
        current &&
        bankAccounts.some(
          (account) =>
            String(account?.id ?? account?.bank_id) === String(current)
        )
      ) {
        return current;
      }
      return (
        String(defaultAccount?.id ?? defaultAccount?.bank_id ?? "") ||
        String(bankAccounts[0]?.id ?? bankAccounts[0]?.bank_id ?? "")
      );
    });
  }, [bankAccounts]);

  useEffect(() => {
    const defaultWallet = cryptoWallets.find((wallet) => wallet?.is_primary);
    if (!defaultWallet && cryptoWallets.length === 0) {
      setSelectedWithdrawCryptoWalletId("");
      return;
    }

    setSelectedWithdrawCryptoWalletId((current) => {
      if (
        current &&
        cryptoWallets.some((wallet) => String(wallet?.id) === String(current))
      ) {
        return current;
      }

      return String(defaultWallet?.id || cryptoWallets[0]?.id || "");
    });
  }, [cryptoWallets]);

  const balanceSymbol = resolveCurrencySymbol(balance);

  const filteredTicketSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return ticketSales.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : String(getTicketSaleStatus(item)).toLowerCase() === statusFilter;

      if (!matchesStatus) return false;
      if (!query) return true;

      const haystack = [
        getTicketSaleTitle(item),
        getTicketSaleStatus(item),
        getTicketSaleDate(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [ticketSales, searchQuery, statusFilter]);

  const ticketSalesTotals = useMemo(() => {
    return filteredTicketSales.reduce(
      (acc, item) => {
        acc.totalTicketSales += Number(item?.total_ticket_sales ?? 0);
        acc.ticketsSold += getTicketsSold(item);
        return acc;
      },
      {
        totalTicketSales: 0,
        ticketsSold: 0,
      }
    );
  }, [filteredTicketSales]);

  const handleAddBankAccount = async (payload) => {
    try {
      const result = await showPromise(dispatch(addBankAccount(payload)).unwrap(), {
        loading: "Adding bank account...",
        success: "Bank account added successfully.",
        error: "Unable to add bank account.",
      });

      dispatch(clearBankMutationState("add"));
      setAddBankOpen(false);
      const nextBankAccounts = await fetchBankAccounts();
      setBankAccounts(nextBankAccounts);

      const createdAccount =
        result?.data ||
        result?.account ||
        nextBankAccounts.find(
          (account) =>
            String(account?.account_number) === String(payload.accountNumber)
        );

      if (createdAccount?.id) {
        setSelectedWithdrawBankAccountId(String(createdAccount.id));
      }
      setPayoutMethod("bank");
    } catch (error) {
      showError(error || "Unable to add bank account.");
    }
  };

  const handleWalletCreated = async (wallet, ownership = null) => {
    setPayoutMethod("crypto");

    if (
      wallet &&
      (wallet.status === "pending" ||
        (!wallet.verified_at && wallet.status !== "verified"))
    ) {
      setWalletToVerify(wallet);
      setWalletOwnership(ownership);
      setVerifyWalletOpen(true);
      return;
    }

    const nextWallets = await fetchCryptoWallets();
    setCryptoWallets(nextWallets);
    if (wallet?.id) {
      setSelectedWithdrawCryptoWalletId(String(wallet.id));
    }
  };

  const handleWalletVerified = async (wallet) => {
    const nextWallets = await fetchCryptoWallets();
    setCryptoWallets(nextWallets);
    if (wallet?.id) {
      setSelectedWithdrawCryptoWalletId(String(wallet.id));
    }
    setPayoutMethod("crypto");
  };

  const handleWithdraw = async () => {
    const availableBalance = Number(balance?.available_balance ?? 0);

    if (!Number.isFinite(availableBalance) || availableBalance <= 0) {
      showError("You need an available balance before requesting a withdrawal.");
      return;
    }

    if (payoutMethod === "crypto" && !selectedWithdrawCryptoWalletId) {
      showError("Select a crypto wallet for this payout.");
      return;
    }

    if (payoutMethod !== "crypto" && !selectedWithdrawBankAccountId) {
      showError("Select a bank account for this withdrawal.");
      return;
    }

    const payload =
      payoutMethod === "crypto"
        ? {
          payout_method: "crypto",
          crypto_wallet_id: selectedWithdrawCryptoWalletId,
        }
        : {
          payout_method: "bank",
          bank_account_id: selectedWithdrawBankAccountId,
        };

    try {
      setSubmittingWithdraw(true);
      await showPromise(
        api.post(
          "/api/v1/organiser/payouts/withdraw",
          payload,
          authHeaders(token)
        ),
        {
          loading: "Submitting payout request...",
          success: "Payout request submitted.",
          error: "Unable to submit payout request.",
        }
      );

      setWithdrawOpen(false);
      await loadPage();
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!isOrganizer) {
    return (
      <div className="tw:rounded-3xl tw:bg-white tw:p-5 tw:shadow-sm tw:flex tw:items-start tw:gap-3">
        <AlertTriangle className="tw:mt-0.5 tw:h-5 tw:w-5 tw:text-amber-500" />
        <div>
          <div className="tw:font-semibold tw:text-gray-900">Access restricted</div>
          <div className="tw:text-sm tw:text-gray-600">
            You’ll see payouts here after your organiser account is verified.
          </div>
          <Link
            to="/account"
            className="tw:mt-3 tw:inline-flex tw:text-sm tw:font-semibold tw:text-gray-900"
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:mx-auto tw:max-w-6xl tw:px-4 tw:pb-24 tw:pt-24 tw:sm:px-6 tw:md:pt-32 tw:lg:px-8">
        <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <Link
              to="/account/payouts"
              className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900"
            >
              <ArrowLeft className="tw:h-4 tw:w-4" />
              Back
            </Link>
            <div>
              <div className="tw:text-lg tw:font-bold tw:text-gray-900 tw:md:text-2xl">
                Request Payout
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                Review your balance and submit a payout request.
              </div>
            </div>
          </div>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Link
              to="/account/payouts/history"
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm tw:transition tw:hover:shadow-[0_0_16px_rgba(0,245,255,0.08)]"
            >
              <History className="tw:h-4 tw:w-4" />
              Withdrawal history
            </Link>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              style={{ borderRadius: 12 }}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] tw:hover:bg-primarySecond"
            >
              <Landmark className="tw:h-4 tw:w-4" />
              Withdraw
            </button>
            <Link
              to="/account/crypto-wallet"
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm tw:transition tw:hover:shadow-[0_0_16px_rgba(0,245,255,0.08)]"
            >
              <Coins className="tw:h-4 tw:w-4" />
              Crypto wallets
            </Link>
            <button
              type="button"
              onClick={loadPage}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm tw:transition tw:hover:shadow-[0_0_16px_rgba(0,245,255,0.08)]"
            >
              <RefreshCw className="tw:h-4 tw:w-4" />
              Refresh
            </button>
          </div>
        </div>

        {sectionError ? (
          <div className="tw:mb-4 tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:p-3 tw:text-sm tw:text-red-700">
            {sectionError}
          </div>
        ) : null}

        <section className="tw:mb-4">
          {loading ? (
            <StatsSkeleton cards={3} />
          ) : (
            <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2">
              <StatCard
                icon={Wallet}
                label="Available balance"
                value={formatMoney(balance?.available_balance ?? 0, balanceSymbol)}
                hint="Amount available for payout"
              />
              {/* <StatCard
                icon={TrendingUp}
                label="Ticket sales"
                value={formatMoney(balance?.total_ticket_sales ?? 0, balanceSymbol)}
                hint="Total processed ticket sales"
              /> */}
              <StatCard
                icon={Ticket}
                label="Tickets sold"
                value={ticketSalesTotals.ticketsSold.toLocaleString()}
                hint={`${filteredTicketSales.length.toLocaleString()} event records`}
              />
            </div>
          )}
        </section>

        <section className="tw:rounded-3xl tw:bg-white tw:p-4 tw:shadow-[0_14px_36px_rgba(15,23,42,0.06),0_0_18px_rgba(0,245,255,0.04)]">
          <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div>
              <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                Ticket sales
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                Simple event sales view for payout tracking.
              </div>
            </div>
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <div className="tw:flex tw:flex-1 tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-gray-50 tw:px-3 tw:py-2 tw:transition focus-within:tw:shadow-[0_0_0_4px_rgba(0,245,255,0.08)] tw:md:min-w-[280px]">
                <Search className="tw:h-4 tw:w-4 tw:text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, date, status..."
                  className="tw:w-full tw:bg-transparent tw:text-sm tw:text-gray-800 tw:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="tw:rounded-2xl tw:bg-gray-50 tw:px-3 tw:py-2 tw:text-sm tw:text-gray-800 tw:outline-none focus:tw:shadow-[0_0_0_4px_rgba(0,245,255,0.08)]"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="tw:mt-4">
            {ticketSalesLoading ? (
              <ListSkeleton rows={4} />
            ) : filteredTicketSales.length === 0 ? (
              <div className="tw:rounded-3xl tw:border tw:border-dashed tw:border-gray-200 tw:bg-[#fcfcfe] tw:p-6 tw:text-sm tw:text-gray-500">
                No ticket sales yet.
              </div>
            ) : (
              <div className="tw:space-y-3">
                {filteredTicketSales.map((item, index) => (
                  <div
                    key={item?.id || item?.event_id || `${getTicketSaleTitle(item)}-${index}`}
                    className="tw:rounded-3xl tw:border tw:border-gray-100 tw:bg-[#fcfcfe] tw:p-4 tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)]"
                  >
                    <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-start tw:lg:justify-between">
                      <div className="tw:min-w-0">
                        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                          <span className="tw:font-semibold tw:text-gray-900">
                            {getTicketSaleTitle(item)}
                          </span>
                          <span className="tw:rounded-full tw:bg-gray-100 tw:px-2.5 tw:py-1 tw:text-xs tw:text-gray-700 tw:capitalize">
                            {getTicketSaleStatus(item)}
                          </span>
                        </div>
                        <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-4 tw:text-sm tw:text-gray-600">
                          <span className="tw:flex tw:items-center tw:gap-1">
                            <CalendarDays className="tw:h-4 tw:w-4 tw:text-gray-400" />
                            {formatDate(getTicketSaleDate(item))}
                          </span>
                          <span className="tw:flex tw:items-center tw:gap-1">
                            <Ticket className="tw:h-4 tw:w-4 tw:text-gray-400" />
                            {getTicketsSold(item).toLocaleString()} sold
                          </span>
                        </div>
                      </div>

                      <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:lg:min-w-[180px]">
                        {/* <div className="tw:rounded-2xl tw:bg-white tw:px-3 tw:py-2">
                          <div className="tw:text-[11px] tw:text-gray-500">Ticket sales</div>
                          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                            {formatMoney(item?.total_ticket_sales ?? 0, balanceSymbol)}
                          </div>
                        </div> */}
                        <div className="tw:rounded-2xl tw:bg-white tw:px-3 tw:py-2">
                          <div className="tw:text-[11px] tw:text-gray-500">Tickets sold</div>
                          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                            {getTicketsSold(item).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {!bankAccounts.length ? (
          <div className="tw:mt-4 tw:rounded-3xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-4 tw:text-sm tw:text-amber-800">
            No saved bank account found. Add one from{" "}
            <Link to="/account/bank-accounts" className="tw:font-semibold tw:underline">
              My bank accounts
            </Link>{" "}
            before requesting a withdrawal.
          </div>
        ) : null}
      </div>

      <WithdrawDialog
        open={withdrawOpen}
        onClose={() => {
          if (!submittingWithdraw) {
            setWithdrawOpen(false);
          }
        }}
        balance={balance}
        accounts={bankAccounts}
        cryptoWallets={cryptoWallets}
        payoutMethod={payoutMethod}
        onSelectPayoutMethod={setPayoutMethod}
        selectedAccountId={selectedWithdrawBankAccountId}
        onSelectAccount={setSelectedWithdrawBankAccountId}
        selectedCryptoWalletId={selectedWithdrawCryptoWalletId}
        onSelectCryptoWallet={setSelectedWithdrawCryptoWalletId}
        onAddBankAccount={() => setAddBankOpen(true)}
        onAddCryptoWallet={() => setAddWalletOpen(true)}
        onSubmit={handleWithdraw}
        submitting={submittingWithdraw}
      />
      <AddBankAccountDialog
        open={addBankOpen}
        onClose={() => setAddBankOpen(false)}
        banks={banks}
        banksLoading={banksLoading}
        onSubmit={handleAddBankAccount}
      />
      <AddWalletModal
        open={addWalletOpen}
        onClose={() => setAddWalletOpen(false)}
        token={token}
        options={cryptoOptions}
        loading={cryptoOptionsLoading}
        onCreated={handleWalletCreated}
      />
      <VerifyWalletModal
        open={verifyWalletOpen}
        onClose={() => setVerifyWalletOpen(false)}
        token={token}
        wallet={walletToVerify}
        ownership={walletOwnership}
        onVerified={handleWalletVerified}
      />
    </>
  );
}
