import React from "react";
import { Autocomplete, TextField } from "@mui/material";

export default function OrganiserBankAccountStep({
  accountNumber,
  selectedBank,
  banks,
  banksLoading,
  banksError,
  verifyLoading,
  verifiedAccount,
  autoVerifyError,
  profileName,
  savingBank,
  onAccountNumberChange,
  onBankChange,
  onChangeMethod,
  onContinue,
}) {
  return (
    <div className="tw:space-y-4">
      <div>
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-gray-500 tw:mb-1">
          Payout account
        </span>
        <span className="tw:block tw:text-lg tw:md:text-xl tw:font-semibold tw:mb-1">
          Add your bank account
        </span>
        <span className="tw:block tw:text-xs tw:md:text-sm tw:text-gray-600 tw:max-w-xl">
          We&apos;ll send your payouts to this account. Make sure it matches
          your BVN and profile name to avoid delays.
        </span>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        <div className="tw:md:col-span-1">
          <TextField
            label="Account number"
            fullWidth
            value={accountNumber}
            onChange={onAccountNumberChange}
            inputProps={{ maxLength: 10 }}
          />
        </div>
        <div className="tw:md:col-span-2">
          <Autocomplete
            options={banks}
            getOptionLabel={(option) => option.name || ""}
            loading={banksLoading}
            value={selectedBank}
            onChange={onBankChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select bank"
                helperText={banksError || "Start typing to search your bank"}
                error={Boolean(banksError)}
              />
            )}
          />
        </div>
      </div>

      <div className="tw:mt-2">
        {verifyLoading && (
          <span className="tw:block tw:text-[11px] tw:text-gray-500">
            Verifying account details...
          </span>
        )}
        {verifiedAccount && !verifyLoading && (
          <div className="tw:bg-[#F5F5F7] tw:rounded-2xl tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-1 tw:border tw:border-gray-200">
            <span className="tw:text-[11px] tw:uppercase tw:tracking-[0.12em] tw:text-gray-500">
              Account name (from bank)
            </span>
            <span className="tw:text-sm tw:font-semibold tw:text-[#111827]">
              {verifiedAccount.account_name}
            </span>
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mt-1">
              <span className="tw:text-[11px] tw:text-gray-500">
                Profile name:
              </span>
              <span className="tw:text-[11px] tw:font-medium tw:text-gray-800 tw:bg-white tw:rounded-full tw:px-2 tw:py-0.5">
                {profileName || "Not set"}
              </span>
            </div>
          </div>
        )}
        {autoVerifyError && (
          <span className="tw:block tw:text-xs tw:text-red-500 tw:mt-1">
            {autoVerifyError}
          </span>
        )}
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mt-4">
        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-xl! tw:border tw:border-gray-300 tw:text-xs tw:md:text-sm tw:font-medium tw:bg-white tw:hover:bg-gray-50 tw:transition"
          onClick={onChangeMethod}
        >
          <span>Change method</span>
        </button>
        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-5 tw:py-2 tw:rounded-xl! tw:bg-primary tw:text-white tw:text-xs tw:md:text-sm tw:font-semibold tw:shadow-sm tw:hover:shadow-md tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:transition"
          disabled={
            !selectedBank ||
            accountNumber.length !== 10 ||
            !verifiedAccount ||
            savingBank ||
            verifyLoading
          }
          onClick={onContinue}
        >
          <span>{savingBank ? "Saving..." : "Continue to identity check"}</span>
        </button>
      </div>
    </div>
  );
}
