import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  TrendingUp,
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
          className="tw:h-11 tw:rounded-2xl! tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800"
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
          className="tw:h-11 tw:rounded-2xl! tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
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
  // Cleared money only. `withdrawable_payout` is what PayoutWalletService says
  // has actually cleared; `potential_payout` is still coming in and must never
  // be withdrawable (app commit 86bdf44).
  const availableBalance = Number(
    balance?.withdrawable_payout ?? balance?.available_balance ?? 0
  );
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
              <Dialog.Panel className="tw:w-full tw:max-w-lg tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-5">
                <span className="tw:text-[18px] tw:font-bold tw:text-ink">
                  Request Payout
                </span>
                <p className="tw:mt-1 tw:text-[12px] tw:text-muted">
                  Choose where to receive your available balance.
                </p>

                <div className="tw:mt-5 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-inner/60 tw:p-4">
                  <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-muted">
                    Amount to be withdrawn
                  </div>
                  <div className="tw:mt-1 tw:text-[22px] tw:font-bold tw:text-ink tw:tabular-nums">
                    {formatMoney(availableBalance, symbol)}
                  </div>
                  <p className="tw:mt-2 tw:text-[11.5px] tw:text-muted">
                    This withdrawal request will submit your full withdrawable balance.
                  </p>
                </div>

                <div className="tw:mt-4">
                  <label className="tw:mb-2 tw:block tw:text-[12px] tw:font-semibold tw:text-ink">
                    Payout method
                  </label>
                  <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPayoutMethod("bank")}
                      className={cx(
                        "tw:rounded-[12px]! tw:border tw:px-3 tw:py-2 tw:text-[13px] tw:font-semibold",
                        payoutMethod === "bank"
                          ? "tw:border-accent tw:bg-accent/10 tw:text-accent-deep"
                          : "tw:border-hairline tw:bg-paper-raised tw:text-muted"
                      )}
                    >
                      Bank account
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPayoutMethod("crypto")}
                      className={cx(
                        "tw:rounded-[12px]! tw:border tw:px-3 tw:py-2 tw:text-[13px] tw:font-semibold",
                        payoutMethod === "crypto"
                          ? "tw:border-accent tw:bg-accent/10 tw:text-accent-deep"
                          : "tw:border-hairline tw:bg-paper-raised tw:text-muted"
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
                          className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl! tw:bg-primary tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-white"
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
                          className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl! tw:bg-gray-100 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-800"
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
                        className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl! tw:bg-primary tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-white"
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
                        className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl! tw:bg-gray-100 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-800"
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
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-[12px]! tw:border tw:border-hairline tw:bg-paper-raised tw:px-4 tw:text-[13px] tw:font-semibold tw:text-ink tw:transition-colors tw:hover:border-accent/50 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting || !canSubmit}
                    style={{ borderRadius: 20, fontSize: 12 }}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-[12px]! tw:border-0 tw:bg-accent tw:px-4 tw:text-[13px] tw:font-semibold tw:text-white tw:transition-colors tw:hover:bg-accent-deep tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
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

/* ── the app's payout dashboard, in the app's own measurements ────────────
   organiser_payout_dashboard.dart: _BalanceSummaryCard (202-343) and
   _PayoutStatusCard (388-483). The balance card is a dark gradient because the
   number is the one thing the organiser came for; everything else stays on the
   paper surface. */

function BalanceHero({ balance, symbol }) {
  if (!balance) {
    return (
      <div className="tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-5 tw:text-[13px] tw:text-muted">
        Payout balance will appear here.
      </div>
    );
  }

  const hasSplit =
    balance.withdrawable_payout !== null &&
    balance.withdrawable_payout !== undefined &&
    balance.potential_payout !== null &&
    balance.potential_payout !== undefined;

  // The backend calls it withdrawal_pending; the app parses pending_payouts.
  // Read both so the "on the way" pill cannot silently disappear.
  const pending = Number(balance.pending_payouts ?? balance.withdrawal_pending ?? 0);

  return (
    <div className="tw:rounded-[24px] tw:bg-[linear-gradient(135deg,#111827_0%,#1F2937_100%)] tw:p-5">
      {hasSplit ? (
        <>
          {/* Two numbers, because they answer two questions: "what can I take
              out today" and "what is still coming in". */}
          <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-white/70">
            Withdrawable
          </span>
          <span className="tw:mt-1.5 tw:block tw:text-[30px] tw:font-bold tw:leading-none tw:text-white tw:tabular-nums">
            {formatMoney(balance.withdrawable_payout, symbol)}
          </span>
          <span className="tw:mt-1 tw:block tw:text-[10.5px] tw:text-white/55">
            Ready to withdraw
          </span>

          <div className="tw:mt-3.5 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[14px] tw:bg-white/[0.07] tw:px-3 tw:py-2.5">
            <span className="tw:min-w-0 tw:truncate tw:text-[11.5px] tw:font-semibold tw:text-white/70">
              Potential payout
            </span>
            <span className="tw:shrink-0 tw:text-[15px] tw:font-bold tw:text-white/90 tw:tabular-nums">
              {formatMoney(balance.potential_payout, symbol)}
            </span>
          </div>
          <span className="tw:mt-1 tw:block tw:text-[9.5px] tw:leading-[1.4] tw:text-white/50">
            Still coming in. It moves to withdrawable when the show ends or voting closes.
          </span>
        </>
      ) : (
        <>
          <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-white/70">
            Available Balance
          </span>
          <span className="tw:mt-2 tw:block tw:text-[30px] tw:font-bold tw:leading-none tw:text-white tw:tabular-nums">
            {formatMoney(balance.available_balance ?? 0, symbol)}
          </span>
        </>
      )}

      {/* "On the way" and "Potential" read alike; only one of them is money the
          organiser has already asked for. */}
      {pending > 0 ? (
        <>
          <span className="tw:mt-3.5 tw:inline-flex tw:rounded-pill tw:bg-white/[0.09] tw:px-2.5 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-white/80">
            {formatMoney(pending, symbol)} on the way
          </span>
          <span className="tw:mt-1 tw:block tw:text-[9.5px] tw:leading-[1.4] tw:text-white/50">
            Requested. It clears once the payout is paid out.
          </span>
        </>
      ) : null}
    </div>
  );
}

function StatusChip({ label, ready }) {
  return (
    <span
      className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-pill tw:border tw:px-[9px] tw:py-[5px] tw:text-[11px] tw:font-bold ${
        ready
          ? "tw:border-[#15803D]/30 tw:bg-[#15803D]/12 tw:text-[#15803D]"
          : "tw:border-[#B45309]/30 tw:bg-[#B45309]/12 tw:text-[#B45309]"
      }`}
    >
      {label}
    </span>
  );
}

function SectionHead({ title, actionLabel, onAction, to }) {
  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
      <span className="tw:text-[15px] tw:font-semibold tw:text-ink">{title}</span>
      {actionLabel ? (
        to ? (
          <Link
            to={to}
            className="tw:text-[12.5px] tw:font-semibold tw:text-accent-deep tw:no-underline"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="tw:border-0 tw:bg-transparent tw:text-[12.5px] tw:font-semibold tw:text-accent-deep"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}

function EmptyRow({ children }) {
  return (
    <div className="tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-4 tw:text-[13px] tw:text-muted">
      {children}
    </div>
  );
}

function maskAccount(account) {
  const digits = String(account?.account_number ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "";
}

export default function AccountPayouts() {
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const isOrganizer = !!user?.is_organiser_verified;

  const [balance, setBalance] = useState(null);
  const [ticketSales, setTicketSales] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cryptoWallets, setCryptoWallets] = useState([]);
  const [history, setHistory] = useState([]);
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

  // Last three, for the dashboard preview the app shows under the sections.
  const fetchHistoryPreview = async () => {
    const res = await api.get("/api/v1/organiser/payouts/history", {
      ...authHeaders(token),
      params: { per_page: 3, page: 1 },
    });
    return normalizeCollection(res).slice(0, 3);
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
        historyResult,
      ] =
        await Promise.all([
          fetchBalance(),
          fetchTicketSales(),
          fetchBankAccounts(),
          fetchCryptoWallets(),
          fetchHistoryPreview().catch(() => []),
        ]);

      setBalance(balanceResult);
      setTicketSales(ticketSalesResult);
      setBankAccounts(bankAccountsResult);
      setCryptoWallets(cryptoWalletsResult);
      setHistory(historyResult);
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

  const navigate = useNavigate();
  const balanceSymbol = resolveCurrencySymbol(balance);

  /* The app's gating (organiser_payout_provider.dart:100-137): cleared money
     against the minimum, plus somewhere verified for it to go. */
  const withdrawable = Number(
    balance?.withdrawable_payout ?? balance?.available_balance ?? 0
  );
  const minimumWithdrawal = Number(balance?.minimum_withdrawal_amount ?? 10000);
  const hasVerifiedBank = bankAccounts.some(
    (account) =>
      account?.is_verified ||
      account?.verified_at ||
      String(account?.status || "").toLowerCase() === "verified"
  );
  const hasVerifiedWallet = cryptoWallets.length > 0;
  const hasWithdrawableBalance = withdrawable >= minimumWithdrawal;
  const canWithdrawNow = hasWithdrawableBalance && (hasVerifiedBank || hasVerifiedWallet);

  const withdrawMessage =
    balance == null
      ? "Loading payout balance"
      : !hasWithdrawableBalance
        ? "Your available balance is below the minimum withdrawal amount"
        : canWithdrawNow
          ? "Choose where the money goes: a bank account, or a crypto wallet."
          : !hasVerifiedBank && !hasVerifiedWallet
            ? "Add a verified bank account or crypto wallet before you can withdraw"
            : "Complete payout setup before you can withdraw";

  const withdrawLabel = canWithdrawNow
    ? "Withdraw available balance"
    : !bankAccounts.length
      ? "Add Bank Account"
      : "Manage Payout Setup";

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
    const availableBalance = Number(
      balance?.withdrawable_payout ?? balance?.available_balance ?? 0
    );

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
      <div className="tw:mx-auto tw:w-full tw:max-w-[860px] tw:px-4 tw:pb-24 tw:pt-24 tw:sm:px-6 tw:md:pt-28">
        <div className="tw:pb-5">
          <Link
            to="/account"
            className="tw:text-[12px] tw:font-medium tw:text-accent-deep tw:no-underline"
          >
            ← Account
          </Link>
          <h1 className="tw:m-0! tw:mt-1! tw:text-[24px]! tw:font-[800]! tw:leading-[1.05]! tw:tracking-[-0.02em]! tw:text-ink!">
            Payout Dashboard
          </h1>
          <span className="tw:mt-1 tw:block tw:text-[13px] tw:font-medium tw:text-muted">
            What has cleared, what is still coming in, and where the money goes.
          </span>
        </div>

        {sectionError ? (
          <div className="tw:mb-4 tw:rounded-[14px] tw:border tw:border-danger/30 tw:bg-danger/10 tw:p-3 tw:text-[13px] tw:text-danger">
            {sectionError}
          </div>
        ) : null}

        {/* The balance first, and the withdraw action right under the number it
            acts on — not buried under three sections of history. */}
        {loading && !balance ? (
          <div className="tw:h-[152px] tw:animate-pulse tw:rounded-[24px] tw:bg-inner" />
        ) : (
          <BalanceHero balance={balance} symbol={balanceSymbol} />
        )}

        <section className="tw:mt-3 tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
          <span className="tw:block tw:text-[16px] tw:font-bold tw:text-ink">Withdraw</span>
          <span className="tw:mt-2 tw:block tw:text-[13px] tw:leading-relaxed tw:text-muted">
            {withdrawMessage}
          </span>

          <div className="tw:mt-3.5 tw:flex tw:flex-wrap tw:gap-2">
            <StatusChip
              label={hasVerifiedBank ? "Bank account ready" : "Bank not ready"}
              ready={hasVerifiedBank}
            />
            <StatusChip
              label={hasVerifiedWallet ? "Crypto ready" : "Crypto wallet coming soon"}
              ready={hasVerifiedWallet}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              canWithdrawNow ? setWithdrawOpen(true) : navigate("/account/bank-accounts")
            }
            className="tw:mt-4 tw:h-12 tw:w-full tw:rounded-[16px]! tw:border-0 tw:bg-accent tw:text-[13px] tw:font-bold tw:text-white tw:transition-colors tw:hover:bg-accent-deep"
          >
            {withdrawLabel}
          </button>
        </section>

        <section className="tw:mt-6">
          <SectionHead title="Bank Accounts" actionLabel="Manage" to="/account/bank-accounts" />
          <div className="tw:mt-2.5 tw:flex tw:flex-col tw:gap-2">
            {bankAccounts.length === 0 ? (
              <EmptyRow>No bank account yet. Add one before you withdraw.</EmptyRow>
            ) : (
              bankAccounts.map((account, index) => {
                const verified =
                  account?.is_verified ||
                  account?.verified_at ||
                  String(account?.status || "").toLowerCase() === "verified";

                return (
                  <div
                    key={account?.id || account?.bank_id || `bank-${index}`}
                    className="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                  >
                    <Landmark className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
                    <div className="tw:min-w-0 tw:flex-1">
                      <span className="tw:block tw:truncate tw:text-[13px] tw:font-semibold tw:text-ink">
                        {getBankDisplayName(account)}
                        {maskAccount(account) ? ` · ${maskAccount(account)}` : ""}
                      </span>
                      <span className="tw:block tw:truncate tw:text-[11px] tw:text-muted">
                        {account?.account_name || "Account name unavailable"}
                      </span>
                    </div>
                    {account?.is_default ? (
                      <span className="tw:shrink-0 tw:rounded-pill tw:bg-inner tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-muted">
                        Default
                      </span>
                    ) : null}
                    <StatusChip
                      label={verified ? "Verified" : "Unverified"}
                      ready={Boolean(verified)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="tw:mt-6">
          <SectionHead
            title="Crypto Wallets"
            actionLabel="Withdraw"
            onAction={() => setWithdrawOpen(true)}
          />
          <div className="tw:mt-2.5 tw:flex tw:flex-col tw:gap-2">
            {cryptoWallets.length === 0 ? (
              <EmptyRow>
                No verified crypto wallet yet.{" "}
                <Link to="/account/crypto-wallet" className="tw:font-semibold tw:text-accent-deep">
                  Manage wallets
                </Link>
              </EmptyRow>
            ) : (
              cryptoWallets.map((wallet, index) => (
                <div
                  key={wallet?.id || `wallet-${index}`}
                  className="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                >
                  <Coins className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
                  <div className="tw:min-w-0 tw:flex-1">
                    <span className="tw:block tw:text-[13px] tw:font-semibold tw:uppercase tw:text-ink">
                      {String(wallet?.currency || "Crypto")}
                    </span>
                    <span className="tw:block tw:truncate tw:text-[11px] tw:text-muted">
                      {wallet?.address
                        ? `${String(wallet.address).slice(0, 8)}…${String(wallet.address).slice(-6)}`
                        : "Address unavailable"}
                    </span>
                  </div>
                  <StatusChip label="Verified" ready />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tw:mt-6">
          <SectionHead
            title="Payout History"
            actionLabel={history.length ? "View all" : null}
            to="/account/payouts/history"
          />
          <div className="tw:mt-2.5 tw:flex tw:flex-col tw:gap-2">
            {history.length === 0 ? (
              <EmptyRow>No payout has been requested yet.</EmptyRow>
            ) : (
              history.map((payout, index) => (
                <div
                  key={payout?.id || payout?.reference || `payout-${index}`}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                >
                  <div className="tw:min-w-0">
                    <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink tw:tabular-nums">
                      {formatMoney(payout?.amount ?? 0, balanceSymbol)}
                    </span>
                    <span className="tw:block tw:text-[11px] tw:text-muted tw:capitalize">
                      {String(payout?.status || "pending").replace(/_/g, " ")}
                      {payout?.created_at ? ` · ${formatDate(payout.created_at)}` : ""}
                    </span>
                  </div>
                  <Link
                    to="/account/payouts/history"
                    className="tw:shrink-0 tw:text-[12px] tw:font-semibold tw:text-accent-deep tw:no-underline"
                  >
                    Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tw:mt-6">
          <SectionHead title="Ticket sales" />
          <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted">
            Per event, for payout tracking.
          </span>

          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row">
            <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:rounded-[12px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2">
              <Search className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, date, status..."
                className="tw:w-full tw:border-0 tw:bg-transparent tw:text-[13px] tw:text-ink tw:outline-none tw:placeholder:text-muted"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="tw:rounded-[12px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2 tw:text-[13px] tw:text-ink tw:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
            {ticketSalesLoading ? (
              <div className="tw:h-[68px] tw:animate-pulse tw:rounded-[14px] tw:bg-inner" />
            ) : filteredTicketSales.length === 0 ? (
              <EmptyRow>No ticket sales yet.</EmptyRow>
            ) : (
              filteredTicketSales.map((item, index) => (
                <div
                  key={item?.id || item?.event_id || `${getTicketSaleTitle(item)}-${index}`}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                >
                  <div className="tw:min-w-0">
                    <span className="tw:block tw:truncate tw:text-[13px] tw:font-semibold tw:text-ink">
                      {getTicketSaleTitle(item)}
                    </span>
                    <span className="tw:block tw:truncate tw:text-[11px] tw:text-muted tw:capitalize">
                      {formatDate(getTicketSaleDate(item))} · {getTicketSaleStatus(item)}
                    </span>
                  </div>
                  <span className="tw:shrink-0 tw:text-[12.5px] tw:font-semibold tw:text-ink tw:tabular-nums">
                    {getTicketsSold(item).toLocaleString()} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
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
