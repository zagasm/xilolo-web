import React from "react";
import { SlidersHorizontal } from "lucide-react";

export default function StatusFilter({
  value,
  onChange,
  options,
  counts = {},
  label = "Filter by status",
}) {
  return (
    <div className="tw:w-full">
      <span className="tw:sr-only">{label}</span>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
        <div className="tw:inline-flex tw:h-11 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/70 tw:bg-white/80 tw:px-4 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500 tw:shadow-[0_16px_34px_rgba(15,23,42,0.08)] tw:backdrop-blur">
          <SlidersHorizontal className="tw:h-4 tw:w-4 tw:text-primary" />
          <span>Filter</span>
        </div>

        <div className="tw-no-scrollbar tw:flex tw:min-w-0 tw:flex-1 tw:gap-2 tw:overflow-x-auto tw:pb-1">
          {options.map((option) => {
            const isActive = value === option.key;
            const count = counts[option.key] ?? 0;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange(option.key)}
                aria-pressed={isActive}
                className={[
                  "tw:inline-flex tw:h-11 tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-4 tw:text-sm tw:font-semibold tw:transition tw:duration-200",
                  isActive
                    ? "tw:border-primary tw:bg-primary tw:text-white tw:shadow-[0_18px_38px_rgba(5,5,5,0.18),0_0_18px_rgba(0,255,209,0.14)]"
                    : "tw:border-white/70 tw:bg-white/85 tw:text-slate-700 tw:shadow-[0_12px_28px_rgba(15,23,42,0.06)] tw:hover:border-neon/30 tw:hover:text-primary tw:hover:shadow-[0_16px_34px_rgba(15,23,42,0.08),0_0_16px_rgba(0,255,209,0.08)]",
                ].join(" ")}
              >
                <span>{option.label}</span>
                <span
                  className={[
                    "tw:inline-flex tw:min-w-[28px] tw:items-center tw:justify-center tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold",
                    isActive
                      ? "tw:bg-white/14 tw:text-white"
                      : "tw:bg-lightPurple tw:text-primary",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
