import React from "react";
import { TextField } from "@mui/material";

export default function OrganiserBvnStep({
  bvn,
  bvnError,
  bvnLoading,
  onBvnChange,
  onBack,
  onSubmit,
}) {
  return (
    <div className="tw:space-y-4">
      <div>
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-gray-500 tw:mb-1">
          Identity check
        </span>
        <span className="tw:block tw:text-lg tw:md:text-xl tw:font-semibold tw:mb-1">
          Verify your identity (BVN)
        </span>
        <span className="tw:block tw:text-xs tw:md:text-sm tw:text-gray-600 tw:max-w-xl">
          We use your BVN to confirm that your bank account belongs to you. We
          do not share it with anyone, and it does not give us access to your
          funds.
        </span>
      </div>

      <div className="tw:max-w-sm">
        <TextField
          label="BVN"
          fullWidth
          value={bvn}
          onChange={onBvnChange}
          inputProps={{
            maxLength: 11,
            inputMode: "numeric",
            pattern: "[0-9]*",
            autoComplete: "off",
          }}
          error={Boolean(bvnError)}
          helperText={bvnError || "Enter the 11-digit BVN linked to this account"}
        />
        <p className="tw:mt-2 tw:text-[11px] tw:text-gray-500">
          Your BVN is encrypted and used only for verification purposes.
        </p>
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mt-4">
        <button
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-xl tw:border tw:border-gray-300 tw:text-xs tw:md:text-sm tw:font-medium tw:bg-white tw:hover:bg-gray-50 tw:transition"
          onClick={onBack}
        >
          <span>Back to bank details</span>
        </button>
        <button
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-5 tw:py-2 tw:rounded-xl tw:bg-primary tw:text-white tw:text-xs tw:md:text-sm tw:font-semibold tw:shadow-sm tw:hover:shadow-md tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:transition"
          disabled={!bvn || bvn.length < 11 || bvnLoading}
          onClick={onSubmit}
        >
          <span>{bvnLoading ? "Submitting..." : "Submit BVN"}</span>
        </button>
      </div>
    </div>
  );
}
