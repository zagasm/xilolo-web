import React from "react";

export default function SmallSupportCard() {
  return (
    <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:flex tw:flex-col tw:gap-2 tw:text-xs tw:text-slate-600 tw:shadow-sm">
      <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
        Need a different deal?
      </span>
      <span>
        Running a studio, agency or ticketing platform with high volume? Let’s
        talk about custom pricing for your team, venues or markets.
      </span>
      <button
        type="button"
        className="tw:self-start tw:mt-1 tw:px-3 tw:py-1.5 tw:rounded-full! tw:bg-white tw:border tw:border-slate-200 tw:text-[11px] tw:text-slate-700 tw:hover:border-primary tw:hover:text-primary tw:hover:bg-primary/5 tw:transition"
        onClick={() => {
          window.location.href = "/contact"; // adjust route
        }}
      >
        <span>Contact sales / support</span>
      </button>
    </div>
  );
}
