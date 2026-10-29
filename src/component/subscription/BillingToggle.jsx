import React from "react";

export default function BillingToggle({ value, onChange }) {
  const isMonthly = value === "monthly";
  const isYearly = value === "yearly";

  return (
    <div className="tw:relative tw:mt-3 tw:inline-flex tw:bg-white tw:border tw:border-slate-200 tw:rounded-full tw:p-1 tw:gap-1 tw:text-xs tw:md:text-sm tw:items-center tw:shadow-sm">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`tw:relative tw:z-1 tw:px-4 tw:py-1.5 tw:rounded-full! tw:flex tw:items-center tw:gap-1 ${
          isMonthly ? "tw:text-white" : "tw:text-slate-500"
        }`}
      >
        <span>Monthly</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={`tw:relative tw:z-1 tw:px-4 tw:py-1.5 tw:rounded-full! tw:flex tw:items-center tw:gap-1 ${
          isYearly ? "tw:text-white" : "tw:text-slate-500"
        }`}
      >
        <span>Yearly</span>
        
      </button>

      {/* Sliding highlight */}
      <div
        className={`tw:absolute tw:top-1 tw:bottom-1 tw:w-[50%] tw:rounded-full tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:bg-opacity-[0.03] tw:transition-transform tw:duration-300 tw:ease-out ${
          isMonthly ? "tw:translate-x-0" : "tw:translate-x-full"
        }`}
      />
    </div>
  );
}
