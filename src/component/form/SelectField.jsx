import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/solid";

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  error,
  disabled = false,
  className = "",
}) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <div className={`tw:w-full ${className}`}>
      {label ? (
        <label className="tw:block tw:text-[15px] tw:mb-1">{label}</label>
      ) : null}

      <Listbox value={value ?? ""} onChange={onChange} disabled={disabled}>
        <div className="tw:relative">
          <Listbox.Button
            className={`tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:bg-[#ffffff] tw:px-3 tw:py-2 tw:text-[15px] tw:text-left focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary tw:flex tw:items-center tw:justify-between ${
              disabled ? "tw:bg-gray-50" : ""
            } ${error ? "tw:border-red-400" : ""}`}
          >
            <span
              className={`tw:truncate ${selected ? "" : "tw:text-gray-400"}`}
            >
              {selected ? selected.label : placeholder}
            </span>
            <ChevronUpDownIcon className="tw:h-5 tw:w-5 tw:text-gray-400" />
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="tw:transition tw:duration-100"
            leaveFrom="tw:opacity-100"
            leaveTo="tw:opacity-0"
          >
            <Listbox.Options className="tw:absolute tw:z-20 tw:mt-2 tw:max-h-60 tw:w-full tw:overflow-auto tw:rounded-xl tw:bg-white tw:py-2 tw:shadow-xl tw:border tw:border-gray-100">
              {options.length === 0 && (
                <div className="tw:px-3 tw:py-2 tw:text-sm tw:text-gray-500">
                  No options
                </div>
              )}
              {options.map((opt) => (
                <Listbox.Option
                  key={String(opt.value)}
                  disabled={Boolean(opt.disabled)}
                  className={({ active }) =>
                    `tw:select-none tw:px-3 tw:py-2 tw:text-[15px] ${
                      opt.disabled
                        ? "tw:cursor-not-allowed tw:opacity-50 tw:text-gray-400"
                        : "tw:cursor-pointer"
                    } ${
                      active && !opt.disabled
                        ? "tw:bg-lightPurple tw:text-primary"
                        : "tw:text-gray-800"
                    }`
                  }
                  value={opt.value}
                >
                  {({ selected }) => (
                    <div className="tw:flex tw:items-start tw:gap-2">
                      <div className="tw:flex-1">
                        <div className="tw:font-medium">{opt.label}</div>
                        {opt.subLabel ? (
                          <div className="tw:text-xs tw:text-gray-500">
                            {opt.subLabel}
                          </div>
                        ) : null}
                      </div>
                      {selected ? (
                        <CheckIcon className="tw:h-4 tw:w-4 tw:text-primary" />
                      ) : null}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {error ? (
        <p className="tw:text-xs tw:text-red-500 tw:mt-1">{error}</p>
      ) : null}
    </div>
  );
}
