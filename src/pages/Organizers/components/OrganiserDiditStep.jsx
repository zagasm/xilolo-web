import React from "react";

export default function OrganiserDiditStep({
  selectedCountry,
  diditStatus,
  localDiditStatus,
  diditSessionLoading,
  diditSessionError,
  diditStatusCopy,
  canRetryDidit,
  onChangeMethod,
  onOpenDiditInfo,
}) {
  const organiserIsActive = localDiditStatus === "verified";

  return (
    <div className="tw:space-y-5">
      <div>
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-gray-500 tw:mb-1">
          DIDIT verification
        </span>
        <span className="tw:block tw:text-lg tw:md:text-xl tw:font-semibold tw:mb-1">
          Verify with a government-issued ID
        </span>
        <span className="tw:block tw:text-xs tw:md:text-sm tw:text-gray-600 tw:max-w-xl">
          DIDIT will guide you through document capture and selfie verification.
        </span>
      </div>

      <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-4 tw:py-4 tw:space-y-3">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
          <div>
            <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.14em] tw:text-slate-500">
              Selected country
            </span>
            <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
              {selectedCountry?.flagEmoji || ""} {selectedCountry?.name}
            </span>
          </div>
          <div>
            <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.14em] tw:text-slate-500">
              Current status
            </span>
            <span className="tw:inline-flex tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-slate-700 tw:border tw:border-slate-200">
              {organiserIsActive ? "Organiser active" : diditStatus || "Unverified"}
            </span>
          </div>
        </div>

        <p className="tw:text-sm tw:text-slate-600">{diditStatusCopy}</p>

        {localDiditStatus && !organiserIsActive && (
          <div className="tw:text-xs tw:text-slate-500">
            KYC state:{" "}
            <span className="tw:font-semibold tw:text-slate-700">
              {localDiditStatus}
            </span>
          </div>
        )}

        {diditSessionLoading && (
          <span className="tw:block tw:text-xs tw:text-slate-500">
            Loading your DIDIT session state...
          </span>
        )}

        {/* {diditSessionError && (
          <span className="tw:block tw:text-xs tw:text-red-500">
            {diditSessionError}
          </span>
        )} */}
      </div>

      <div className="tw:rounded-2xl tw:border tw:border-[#ddd4ca] tw:bg-white tw:px-4 tw:py-4 tw:space-y-2">
        <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
          Before you continue
        </span>
        <span className="tw:block tw:text-xs tw:text-slate-600">
          DIDIT is Xilolo&apos;s identity verification provider for
          government-issued documents. By continuing, you consent to share your
          verification data with DIDIT for identity checks and fraud prevention.
        </span>
        <span className="tw:block tw:text-xs tw:text-slate-600">
          Make sure you have your ID ready, allow camera access, and review
          Xilolo&apos;s privacy notice before starting.
        </span>
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-xl tw:border tw:border-gray-300 tw:text-xs tw:md:text-sm tw:font-medium tw:bg-white tw:hover:bg-gray-50 tw:transition"
          onClick={onChangeMethod}
        >
          Change method
        </button>
        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-5 tw:py-2 tw:rounded-xl tw:bg-primary tw:text-white tw:text-xs tw:md:text-sm tw:font-semibold tw:shadow-sm tw:hover:shadow-md tw:transition"
          onClick={onOpenDiditInfo}
        >
          <span>
            {canRetryDidit ? "Start new DIDIT session" : "Verify identity"}
          </span>
        </button>
      </div>
    </div>
  );
}
