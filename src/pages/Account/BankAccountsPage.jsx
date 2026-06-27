import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showPromise } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import {
  addBankAccount,
  clearBankMutationState,
  clearBankVerification,
  deleteBankAccount,
  setDefaultBankAccount,
  verifyBankAccount,
} from "../../store/bankAccountsSlice";
import {
  selectDefaultingBankAccountId,
  selectDeletingBankAccountId,
  selectIsAddingBankAccount,
  selectIsSettingDefaultBankAccount,
  selectIsVerifyingBankAccount,
  selectVerifiedBankAccount,
} from "../../store/bankAccountsSelectors";

const BANKS_DIRECTORY_QUERY_KEY = ["banks-directory"];

const maskAccountNumber = (value = "") => {
  const digits = String(value);
  return digits.length <= 4 ? digits : `******${digits.slice(-4)}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
};

const fetchPrimaryBankAccount = async (token) => {
  const res = await api.get("/api/v1/organiser/kyc/bank", authHeaders(token));
  return res?.data?.data || null;
};

const fetchBankAccounts = async (token) => {
  const res = await api.get("/api/v1/organiser/kyc/bank-accounts", authHeaders(token));
  return {
    accounts: res?.data?.data || [],
    totalAccounts: Number(res?.data?.total_accounts ?? 0),
  };
};

const fetchBanksDirectory = async () => {
  const res = await api.get("/api/v1/banks", authHeaders());
  return res?.data?.banks || [];
};

function AddAccountDialog({ open, onClose, banks, banksLoading, onSubmit }) {
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
    !!selectedBank && accountNumber.length === 10 && !!verifiedAccount && !isVerifying && !isAdding;

  return (
    <Dialog open={open} onClose={isAdding ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Add bank account</DialogTitle>
      <DialogContent>
        <div className="tw:pt-2 tw:space-y-4">
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
        <button type="button" onClick={onClose} disabled={isAdding} style={{ borderRadius: 16 }} className="tw:h-11 tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800">Cancel</button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit({ bankCode: selectedBank.code, accountNumber, setAsDefault })}
          style={{ borderRadius: 16 }}
          className="tw:h-11 tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
        >
          {isAdding ? "Saving..." : "Add account"}
        </button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteAccountDialog({ open, onClose, account, disableDelete, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Delete bank account</DialogTitle>
      <DialogContent>
        <div className="tw:pt-2 tw:text-sm tw:text-gray-600">
          {account
            ? `Delete ${account.bank_name} - ${maskAccountNumber(account.account_number)}?`
            : "Delete this bank account?"}
        </div>
        {disableDelete && (
          <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-xs tw:text-amber-800">
            You must keep at least one bank account on your profile.
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 24px" }}>
        <button type="button" onClick={onClose} style={{ borderRadius: 16 }} className="tw:h-11 tw:rounded-2xl tw:bg-gray-100 tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800">Cancel</button>
        <button type="button" disabled={disableDelete} onClick={onConfirm} style={{ borderRadius: 16 }} className="tw:h-11 tw:rounded-2xl tw:bg-red-600 tw:px-5 tw:text-sm tw:font-semibold tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60">Delete</button>
      </DialogActions>
    </Dialog>
  );
}

export default function BankAccountsPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { token, user, isAuthenticated } = useAuth();
  const deletingAccountId = useSelector(selectDeletingBankAccountId);
  const defaultingAccountId = useSelector(selectDefaultingBankAccountId);
  const isSettingDefault = useSelector(selectIsSettingDefaultBankAccount);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const accountScope = user?.id || user?.user_id || token || "anonymous";
  const primaryBankAccountQueryKey = ["organiser-primary-bank-account", String(accountScope)];
  const bankAccountsQueryKey = ["organiser-bank-accounts", String(accountScope)];

  const { data: primaryAccount, isLoading: primaryLoading, refetch: refetchPrimary } = useQuery({
    queryKey: primaryBankAccountQueryKey,
    queryFn: () => fetchPrimaryBankAccount(token),
    enabled: isAuthenticated,
    retry: 1,
  });
  const { data: accountsPayload, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: bankAccountsQueryKey,
    queryFn: () => fetchBankAccounts(token),
    enabled: isAuthenticated,
    retry: 1,
  });
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: BANKS_DIRECTORY_QUERY_KEY,
    queryFn: fetchBanksDirectory,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const accounts = accountsPayload?.accounts || [];
  const totalAccounts = accountsPayload?.totalAccounts || accounts.length;
  const defaultAccount = primaryAccount || accounts.find((item) => item.is_default) || null;
  const canDeleteMore = totalAccounts > 1;
  const loading = primaryLoading || accountsLoading;

  const stats = useMemo(() => ({
    total: totalAccounts,
    verified: accounts.filter((item) => item.is_verified).length,
    bvnVerified: accounts.filter((item) => item.bvn_verified).length,
  }), [accounts, totalAccounts]);

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey }),
      queryClient.invalidateQueries({ queryKey: primaryBankAccountQueryKey }),
    ]);
  };

  const refreshData = async () => Promise.all([refetchAccounts(), refetchPrimary()]);

  const handleAdd = async (payload) => {
    try {
      const promise = dispatch(addBankAccount(payload)).unwrap();
      await showPromise(promise, {
        loading: "Adding bank account...",
        success: "Bank account added successfully.",
        error: "Unable to add bank account.",
      });
      dispatch(clearBankMutationState("add"));
      setAddOpen(false);
      await invalidateQueries();
    } catch (error) {
      showError(error || "Unable to add bank account.");
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      const promise = dispatch(setDefaultBankAccount({ accountId })).unwrap();
      await showPromise(promise, {
        loading: "Updating default account...",
        success: "Default bank account updated successfully.",
        error: "Unable to update default bank account.",
      });
      dispatch(clearBankMutationState("setDefault"));
      await invalidateQueries();
    } catch (error) {
      showError(error || "Unable to update default bank account.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canDeleteMore) {
      showError("You must keep at least one bank account on your profile.");
      return;
    }
    try {
      const promise = dispatch(deleteBankAccount({ accountId: deleteTarget.id })).unwrap();
      await showPromise(promise, {
        loading: "Deleting bank account...",
        success: "Bank account deleted successfully.",
        error: "Unable to delete bank account.",
      });
      dispatch(clearBankMutationState("delete"));
      setDeleteTarget(null);
      await invalidateQueries();
    } catch (error) {
      showError(error || "Unable to delete bank account.");
    }
  };

  return (
    <>
      <div className="tw:min-h-screen tw:bg-[#F6F7FB] tw:px-3 tw:pb-16 tw:pt-24 tw:md:px-6 tw:lg:px-8">
        <div className="tw:mx-auto tw:max-w-6xl">
          <section className="tw:p-0 tw:md:rounded-[32px] tw:md:border tw:md:border-white/70 tw:md:bg-white tw:md:p-7 tw:md:shadow-[0_18px_50px_rgba(15,23,42,0.08),0_0_20px_rgba(0,245,255,0.05)]">
            <div className="tw:flex tw:flex-col tw:gap-5 tw:md:flex-row tw:md:items-start tw:md:justify-between">
              <div>
                <Link to="/account/payouts" className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-gray-500 tw:hover:text-gray-900">
                  <ArrowLeft className="tw:h-4 tw:w-4" />
                  <span>Back to payouts</span>
                </Link>
                <div className="tw:mt-4 tw:flex tw:items-center tw:gap-3">
                  <span className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-[20px] tw:bg-neon/10 tw:text-primary tw:shadow-[0_0_18px_rgba(0,245,255,0.12)]">
                    <Landmark className="tw:h-6 tw:w-6" />
                  </span>
                  <div>
                    <div className="tw:text-xl tw:font-semibold tw:text-gray-900 tw:md:text-3xl">My Bank Accounts</div>
                    <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:md:text-sm">Add, remove, and manage the bank accounts used for organiser payouts.</div>
                  </div>
                </div>
              </div>

              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                {/* <button type="button" onClick={refreshData} style={{ borderRadius: 16 }} className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-[#f5f6fb] tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-800">
                  <RefreshCw className="tw:h-4 tw:w-4" />
                  Refresh
                </button> */}
                <button type="button" onClick={() => setAddOpen(true)} style={{ borderRadius: 20, fontSize: 12 }} className="tw:inline-flex tw:py-2 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)]">
                  <Plus className="tw:h-4 tw:w-4" />
                  Add account
                </button>
              </div>
            </div>

            <div className="tw:mt-6 tw:grid tw:grid-cols-3 tw:gap-4 tw:sm:grid-cols-3">
              <div className="tw:rounded-[28px] tw:border tw:border-neon/10 tw:bg-[#fbfbfd] tw:p-4 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]"><div className="tw:text-xs tw:text-gray-500">Linked accounts</div><div className="tw:mt-2 tw:text-2xl tw:font-semibold tw:text-gray-900">{stats.total}</div></div>
              <div className="tw:rounded-[28px] tw:border tw:border-neon/10 tw:bg-[#fbfbfd] tw:p-4 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]"><div className="tw:text-xs tw:text-gray-500">Verified accounts</div><div className="tw:mt-2 tw:text-2xl tw:font-semibold tw:text-gray-900">{stats.verified}</div></div>
              <div className="tw:rounded-[28px] tw:border tw:border-neon/10 tw:bg-[#fbfbfd] tw:p-4 tw:shadow-[0_0_16px_rgba(0,245,255,0.04)]"><div className="tw:text-xs tw:text-gray-500">BVN verified</div><div className="tw:mt-2 tw:text-2xl tw:font-semibold tw:text-gray-900">{stats.bvnVerified}</div></div>
            </div>

            {/* <div className="tw:mt-6 tw:rounded-[24px] tw:border tw:border-[#ece8ff] tw:bg-[linear-gradient(135deg,#fbf8ff,#ffffff)] tw:p-4 tw:md:rounded-[32px] tw:md:p-6">
              {loading ? (
                <div className="tw:h-24 tw:animate-pulse tw:rounded-3xl tw:bg-gray-100" />
              ) : defaultAccount ? (
                <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                  <div>
                    <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary/10 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary">
                      <Star className="tw:h-3.5 tw:w-3.5" />
                      Default account
                    </div>
                    <div className="tw:mt-3 tw:text-lg tw:font-semibold tw:text-gray-900 tw:md:text-xl">{defaultAccount.bank_name}</div>
                    <div className="tw:mt-1 tw:text-xs tw:text-gray-600 tw:md:text-sm">
                      {defaultAccount.account_name} - {maskAccountNumber(defaultAccount.account_number)}
                    </div>
                    <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                      {defaultAccount.is_verified && <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-green-50 tw:px-3 tw:py-1 tw:text-xs tw:text-green-700"><BadgeCheck className="tw:h-3.5 tw:w-3.5" />Verified</span>}
                      {defaultAccount.bvn_verified && <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-blue-50 tw:px-3 tw:py-1 tw:text-xs tw:text-blue-700"><ShieldCheck className="tw:h-3.5 tw:w-3.5" />BVN verified</span>}
                    </div>
                  </div>
                  <div className="tw:text-sm tw:text-gray-500">
                    {totalAccounts} linked account{totalAccounts === 1 ? "" : "s"}
                  </div>
                </div>
              ) : (
                <div className="tw:text-sm tw:text-gray-500">No bank accounts yet.</div>
              )}
            </div> */}
          </section>

          <section className="tw:mt-5 tw:p-0 tw:md:rounded-[32px] tw:md:border tw:md:border-white/70 tw:md:bg-white tw:md:p-7 tw:md:shadow-[0_18px_50px_rgba(15,23,42,0.08),0_0_20px_rgba(0,245,255,0.05)]">
            <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:justify-between">
              <div className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:md:text-xl">All bank accounts</div>
              <div className="tw:text-xs tw:text-gray-500 tw:md:text-sm">You must keep at least one account.</div>
            </div>

            {loading ? (
              <div className="tw:mt-5 tw:space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="tw:h-28 tw:animate-pulse tw:rounded-[28px] tw:bg-gray-100" />)}</div>
            ) : accounts.length === 0 ? (
              <div className="tw:mt-5 tw:rounded-[24px] tw:border tw:border-dashed tw:border-gray-200 tw:bg-[#fcfcfe] tw:p-4 tw:text-center tw:text-sm tw:text-gray-500 tw:md:rounded-[28px] tw:md:p-6">No linked bank accounts yet.</div>
            ) : (
              <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-4">
                {accounts.map((account) => {
                  const isDeleting = deletingAccountId === account.id;
                  const isDefaulting = isSettingDefault && defaultingAccountId === account.id;
                  return (
                    <div key={account.id} className="tw:rounded-[22px] tw:border tw:border-gray-100 tw:bg-[#fcfcfe] tw:p-4 tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)] tw:md:rounded-[28px] tw:md:p-5">
                      <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
                        <div>
                          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                            <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:md:text-lg">{account.bank_name}</div>
                            {account.is_default && <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary/10 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary"><Star className="tw:h-3.5 tw:w-3.5" />Default</span>}
                          </div>
                          <div className="tw:mt-1 tw:text-xs tw:text-gray-600 tw:md:text-sm">{account.account_name}</div>
                          <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:md:text-sm">{maskAccountNumber(account.account_number)} - Code {account.bank_code}</div>
                          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                            <span className="tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:text-xs tw:text-gray-500">Added {formatDate(account.created_at)}</span>
                            {account.is_verified && <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-green-50 tw:px-3 tw:py-1 tw:text-xs tw:text-green-700"><BadgeCheck className="tw:h-3.5 tw:w-3.5" />Verified</span>}
                            {account.bvn_verified && <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-blue-50 tw:px-3 tw:py-1 tw:text-xs tw:text-blue-700"><ShieldCheck className="tw:h-3.5 tw:w-3.5" />BVN verified</span>}
                          </div>
                        </div>
                        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                          {!account.is_default && (
                            <button type="button" onClick={() => handleSetDefault(account.id)} disabled={isDefaulting} style={{ borderRadius: 16 }} className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-white tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-900 tw:shadow-sm tw:transition tw:hover:border-neon/30 tw:hover:shadow-[0_0_14px_rgba(0,245,255,0.08)] disabled:tw:cursor-not-allowed disabled:tw:opacity-60">
                              {isDefaulting ? <CircularProgress size={16} /> : <Star className="tw:h-4 tw:w-4" />}
                              Set default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => (canDeleteMore ? setDeleteTarget(account) : showError("You must keep at least one bank account on your profile."))}
                            disabled={isDeleting}
                            style={{ borderRadius: 16 }}
                            className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-red-50 tw:px-4 tw:text-sm tw:font-semibold tw:text-red-600 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                          >
                            {isDeleting ? <CircularProgress size={16} color="inherit" /> : <Trash2 className="tw:h-4 tw:w-4" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} banks={banks} banksLoading={banksLoading} onSubmit={handleAdd} />
      <DeleteAccountDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} account={deleteTarget} disableDelete={!canDeleteMore} onConfirm={handleDelete} />
    </>
  );
}
