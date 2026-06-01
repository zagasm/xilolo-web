import React from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export default function StatusFilter({
  value,
  onChange,
  options,
  counts = {},
  label = "Filter by status",
}) {
  return (
    <div className="tw:w-full">
      <div className="tw:relative tw:block tw:w-full tw:sm:w-[220px]">
        <span className="tw:sr-only">{label}</span>
        <SlidersHorizontal className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:h-4 tw:w-4 tw:-translate-y-1/2 tw:text-slate-500" />
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="tw:h-11 tw:w-full tw:appearance-none tw:rounded-xl tw:border tw:border-slate-200 tw:bg-[#f6f7f1] tw:pl-10 tw:pr-10 tw:text-sm tw:font-medium tw:text-slate-700 tw:shadow-sm tw:outline-none focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/15"
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
              {counts[option.key] !== undefined ? ` (${counts[option.key]})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="tw:pointer-events-none tw:absolute tw:right-3 tw:top-1/2 tw:h-4 tw:w-4 tw:-translate-y-1/2 tw:text-slate-400" />
      </div>
    </div>
  );
}
