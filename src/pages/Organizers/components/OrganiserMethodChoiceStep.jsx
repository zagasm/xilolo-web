import React from "react";

export default function OrganiserMethodChoiceStep({
  selectedCountry,
  countryAutoDetected,
  isNigeria,
  verificationMethod,
  onSelectBvn,
  onSelectDidit,
  onChangeCountry,
}) {
  return (
    <div className="tw:w-full tw:min-h-[260px] tw:flex tw:flex-col tw:gap-6">
      <div>
        <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.16em] tw:text-gray-500 tw:bg-lightPurple/60 tw:px-3 tw:py-1 tw:rounded-full">
          <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-primary" />
          Verification options
        </span>
        <span className="tw:block tw:mt-3 tw:text-2xl tw:md:text-3xl tw:font-semibold tw:text-[#111827]">
          Choose how you want to verify your identity
        </span>
        <span className="tw:block tw:mt-2 tw:text-xs tw:md:text-sm tw:text-gray-600 tw:max-w-xl">
          Selected country:{" "}
          <span className="tw:font-semibold">{selectedCountry?.name}</span>
          {countryAutoDetected ? " (auto-detected)." : "."} We will only show
          verification methods supported for that country.
        </span>
      </div>

      <div
        className={`tw:grid tw:grid-cols-1 ${isNigeria ? "tw:md:grid-cols-2" : ""
          } tw:gap-4 tw:mt-2`}
      >
        {isNigeria && (
          <button
            style={{
              borderRadius: 12
            }}
            type="button"
            onClick={onSelectBvn}
            className={`tw:group tw:w-full tw:text-left tw:rounded-2xl! tw:border tw:px-4 tw:py-4 tw:transition tw:duration-150 tw:bg-white tw:shadow-sm tw:hover:shadow-md ${verificationMethod === "bvn"
              ? "tw:border-primary tw:bg-lightPurple/40 tw:ring-2 tw:ring-primary/20"
              : "tw:border-gray-200 tw:hover:border-gray-300"
              }`}
          >
            <div className="tw:flex tw:items-start tw:gap-3">

              <div className="tw:flex-1">
                <span className="tw:block tw:text-sm tw:font-semibold tw:mb-1">
                  BVN verification
                </span>
                <span className="tw:block tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                  Add and verify your Nigerian bank account, then confirm your
                  identity with your BVN.
                </span>
              </div>
            </div>

          </button>
        )}

        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          onClick={onSelectDidit}
          className={`tw:group tw:w-full tw:text-left tw:rounded-2xl! tw:border tw:px-4 tw:py-4 tw:transition tw:duration-150 tw:bg-white tw:shadow-sm tw:hover:shadow-md ${verificationMethod === "didit"
            ? "tw:border-primary tw:bg-lightPurple/40 tw:ring-2 tw:ring-primary/20"
            : "tw:border-gray-200 tw:hover:border-gray-300"
            }`}
        >
          <div className="tw:flex tw:items-start tw:gap-3">

            <div className="tw:flex-1">
              <span className="tw:block tw:text-sm tw:font-semibold tw:mb-1">
                Government issued ID card
              </span>
              <span className="tw:block tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                Verify your identity using a supported
                government-issued document and selfie capture.
              </span>
            </div>
          </div>

        </button>
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mt-2">
        <button
          style={{
            borderRadius: 12
          }}
          type="button"
          onClick={onChangeCountry}
          className="tw:inline-flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-xl! tw:border tw:border-gray-300 tw:text-xs tw:md:text-sm tw:font-medium tw:bg-white tw:hover:bg-gray-50 tw:transition"
        >
          Change country
        </button>
        
      </div>
    </div>
  );
}
