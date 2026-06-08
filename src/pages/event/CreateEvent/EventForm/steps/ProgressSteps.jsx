import { ChevronLeft } from "lucide-react";
import React from "react";

const STEPS = [
  "Event Details",
  "Ticketing",
  "Preview",
];

export default function ProgressSteps({ currentStep, completedSteps, onBack }) {
  return (
    <div className="tw:mb-6">
      {/* Mobile header */}
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:sm:hidden">
        <button
          style={{
            borderRadius: 20,
          }}
          onClick={onBack}
          className={`tw:h-9 tw:w-9 tw:flex tw:items-center tw:justify-center tw:rounded-xl tw:border tw:border-gray-200 tw:transition hover:tw:border-neon/40 hover:tw:shadow-[0_0_14px_rgba(0,245,255,0.08)] ${
            currentStep === 1 ? "tw:opacity-50 tw:pointer-events-none" : ""
          }`}
          aria-label="Back"
        >
          <span className="tw:text-lg">
            <ChevronLeft size={30} />
          </span>
        </button>
        <div className="tw:text-xl tw:md:text-2xl tw:font-medium tw:truncate tw:max-w-[60vw]">
          {STEPS[currentStep - 1]}
        </div>
        <div className="tw:text-sm tw:md:text-lg tw:text-gray-500">
          Step {currentStep} of {STEPS.length}
        </div>
      </div>

      {/* Desktop rail */}
      <div className="tw:hidden tw:sm:flex tw:sm:justify-center tw:sm:items-center tw:gap-3 tw:overflow-x-auto">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = completedSteps.includes(n);
          const active = n === currentStep;

          return (
            <div key={label} className="tw:flex tw:items-center tw:gap-3">
              <div
                className={`tw:h-9 tw:w-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold
                ${
                  done
                    ? "tw:bg-primary tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)]"
                    : active
                    ? "tw:ring-2 tw:ring-primary tw:text-primary tw:shadow-[0_0_18px_rgba(0,245,255,0.12)]"
                    : "tw:bg-gray-100 tw:text-gray-600"
                }`}
              >
                {done ? "✓" : `0${n}`}
              </div>
              <div
                className={`tw:text-sm ${
                  active ? "tw:text-primary tw:font-medium" : "tw:text-gray-600"
                }`}
              >
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className="tw:w-10 tw:h-px tw:bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
