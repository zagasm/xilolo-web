import React from "react";
import { ArrowLeft, CheckCircle2, ChevronDown } from "lucide-react";

/*
 * App→web primitives for the create-event flow.
 *
 * Every value here is lifted from the Flutter app (the design source of truth),
 * with the file:line kept in the comment so the mapping can be re-checked:
 *   - lib/features/event/widgets/event_step_shell.dart:104-200  _StepHeader
 *   - lib/features/event/widgets/event_step_shell.dart:202-292  _StepWalkthrough
 *   - lib/features/event/widgets/event_step_shell.dart:56-66    floating CTA bar
 *   - lib/features/event/widgets/event_step_shell.dart:294-428  EventSurface / EventSurfaceGroup
 *   - lib/features/event/widgets/event_textfield.dart:53-137    EventTextField
 *   - lib/features/event/widgets/event_dropdown_textfields.dart  DropdownEventTextField
 *   - lib/features/event/screens/create_event_one.dart:738-818  _AttendanceSelector
 *   - lib/features/event/screens/create_event_three.dart:928-985 _buildFormatOptionCard
 *   - lib/core/widget/app_buttons.dart:44-90                    AppButton (pill r100, h50)
 */

/* ---------------- text ---------------- */

export function StepTitle({ children, className = "" }) {
  return (
    <span className={`tw:block tw:font-display tw:text-[14px] tw:font-extrabold tw:text-body ${className}`}>
      {children}
    </span>
  );
}

export function SurfaceTitle({ children, className = "" }) {
  // event_step_shell.dart:374-381 — Work Sans 14 w700 textPrimary
  return (
    <span className={`tw:block tw:text-[14px] tw:font-bold tw:text-body ${className}`}>
      {children}
    </span>
  );
}

export function FieldLabel({ children, className = "" }) {
  // event_textfield.dart:61-67 — montserrat 13 w700 textPrimary, 8px above the input
  if (!children) return null;
  return (
    <span className={`tw:mb-2 tw:block tw:text-[13px] tw:font-bold tw:text-body ${className}`}>
      {children}
    </span>
  );
}

export function FieldHint({ children }) {
  // create_event_three.dart:173-180 / 321-327 — 12 w600 textSecondary helper line
  if (!children) return null;
  return <p className="tw:mt-2 tw:text-[12px] tw:font-semibold tw:text-muted">{children}</p>;
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="tw:mt-2 tw:text-[12px] tw:font-semibold tw:text-danger">{children}</p>;
}

/* ---------------- fields ---------------- */

// event_textfield.dart:108-133 — filled chip surface, radius 12, hairline border,
// accent 1.5 border on focus, #EF4444 on error. Focus ring is a border swap (flat, no glow).
export const APP_INPUT =
  "tw:w-full tw:rounded-[12px] tw:border tw:border-hairline tw:bg-inner tw:px-4 tw:py-3 tw:text-[15px] tw:font-medium tw:text-body tw:outline-none tw:placeholder:font-normal tw:placeholder:text-ink-muted tw:focus:border-accent tw:focus:ring-1 tw:focus:ring-accent";

export const APP_INPUT_ERROR =
  "tw:w-full tw:rounded-[12px] tw:border tw:border-danger tw:bg-inner tw:px-4 tw:py-3 tw:text-[15px] tw:font-medium tw:text-body tw:outline-none tw:placeholder:font-normal tw:placeholder:text-ink-muted";

export const APP_INPUT_LOCKED =
  "tw:w-full tw:rounded-[12px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-4 tw:py-3 tw:text-[15px] tw:font-medium tw:text-muted tw:outline-none";

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {error ? <FieldError>{error}</FieldError> : <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function EventSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  error,
}) {
  const selected = options.find((option) => String(option.value) === String(value));
  return (
    <div className="tw:w-full">
      <FieldLabel>{label}</FieldLabel>
      <div className="tw:relative">
        <select
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${error ? APP_INPUT_ERROR : APP_INPUT} tw:appearance-none tw:pr-10`}
        >
          {!selected ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={String(option.value)} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="tw:pointer-events-none tw:absolute tw:right-3 tw:top-1/2 tw:size-[18px] tw:-translate-y-1/2 tw:text-muted"
          aria-hidden="true"
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

// create_event_three.dart:347-355 — Switch with accent active track + white thumb.
export function EventSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`tw:relative tw:inline-flex tw:h-6 tw:w-11 tw:shrink-0 tw:items-center tw:rounded-full tw:border tw:transition-colors ${
        checked ? "tw:border-accent tw:bg-accent" : "tw:border-hairline tw:bg-inner"
      } ${disabled ? "tw:opacity-50" : ""}`}
    >
      <span
        className={`tw:inline-block tw:size-[18px] tw:rounded-full tw:bg-white tw:transition-transform ${
          checked ? "tw:translate-x-[22px]" : "tw:translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function SwitchRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
      <div className="tw:min-w-0">
        <span className="tw:block tw:text-[15px] tw:font-bold tw:text-body">{title}</span>
        {description ? (
          <span className="tw:mt-1 tw:block tw:text-[12px] tw:font-semibold tw:text-muted">
            {description}
          </span>
        ) : null}
      </div>
      <EventSwitch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

// create_event_three.dart:928-985 — _buildFormatOptionCard
export function OptionCard({ selected, title, subtitle, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-0 tw:rounded-[14px] tw:border tw:p-[11px] tw:text-left tw:transition ${
        selected ? "tw:border-accent tw:bg-accent-soft" : "tw:border-hairline tw:bg-inner"
      }`}
    >
      <span className="tw:flex tw:w-full tw:items-center tw:justify-between">
        <Icon className={`tw:size-5 ${selected ? "tw:text-accent" : "tw:text-muted"}`} aria-hidden="true" />
        {selected ? <CheckCircle2 className="tw:size-[18px] tw:text-accent" aria-hidden="true" /> : null}
      </span>
      <span className="tw:mt-2.5 tw:block tw:text-[14px] tw:font-extrabold tw:text-body">{title}</span>
      <span className="tw:mt-1 tw:block tw:text-[11.5px] tw:font-semibold tw:text-muted">{subtitle}</span>
    </button>
  );
}

// create_event_three.dart:1680-1730 — _ReplayChip
export function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-[10px] tw:border tw:px-2.5 tw:py-2.5 tw:text-[13px] tw:transition ${
        selected
          ? "tw:border-accent tw:bg-accent-soft tw:font-bold tw:text-accent-deep"
          : "tw:border-hairline tw:bg-inner tw:font-medium tw:text-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function ChipGroup({ title, subtitle, children }) {
  // create_event_three.dart:1739-1783 — _ReplayOptionGroup
  return (
    <div className="tw:mb-3 tw:last:mb-0">
      <span className="tw:block tw:text-[13px] tw:font-bold tw:text-body">{title}</span>
      {subtitle ? (
        <span className="tw:mt-1 tw:block tw:text-[11.5px] tw:font-medium tw:text-muted">{subtitle}</span>
      ) : null}
      <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:gap-2">{children}</div>
    </div>
  );
}

/* ---------------- shells ---------------- */

// event_step_shell.dart:294-394 — EventSurface (card, radius 14, hairline, flat)
export function EventSurface({ title, action, children, className = "" }) {
  return (
    <section
      className={`tw:mb-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-4 ${className}`}
    >
      {title || action ? (
        <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-3">
          {title ? <SurfaceTitle>{title}</SurfaceTitle> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// event_step_shell.dart:400-428 — EventSurfaceGroup (one panel, nested surfaces flatten)
export function EventSurfaceGroup({ children, className = "" }) {
  return (
    <div
      className={`tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:pt-3 tw:pb-3.5 ${className}`}
    >
      {children}
    </div>
  );
}

// event_step_shell.dart:104-200 — _StepHeader (back chip + 2-line title, hairline bottom)
export function StepHeader({ step, totalSteps, stepLabels, onBack, backLabel = "Back" }) {
  return (
    <div className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:pt-2 tw:pb-3">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-[14px] tw:border tw:border-hairline tw:bg-inner tw:p-[11px] tw:text-body tw:transition tw:hover:border-accent"
          >
            <ArrowLeft className="tw:size-[18px]" aria-hidden="true" />
          </button>
        ) : (
          <span className="tw:w-8" />
        )}

        <span className="tw:flex tw:flex-col tw:items-center">
          <StepTitle>Create Event</StepTitle>
          <span className="tw:mt-0.5 tw:text-[11px] tw:font-semibold tw:text-accent-deep">
            Step {step} of {totalSteps}
          </span>
        </span>

        <span className="tw:w-8" />
      </div>

      <div className="tw:mt-3.5">
        <StepWalkthrough currentStep={step} labels={stepLabels} />
      </div>
    </div>
  );
}

// event_step_shell.dart:202-292 — _StepWalkthrough (pill per step, r999)
export function StepWalkthrough({ currentStep, labels }) {
  return (
    <div className="tw:flex tw:items-stretch">
      {labels.map((label, index) => {
        const number = index + 1;
        const isActive = number === currentStep;
        const isDone = number < currentStep;

        return (
          <div
            key={label}
            className={`tw:min-w-0 tw:flex-1 ${index === labels.length - 1 ? "" : "tw:pr-2"}`}
          >
            <div
              className={`tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:px-3 tw:py-2 ${
                isActive
                  ? "tw:border-[1.5px] tw:border-accent"
                  : "tw:border tw:border-hairline"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="tw:size-4 tw:shrink-0 tw:text-success" aria-hidden="true" />
              ) : (
                <span
                  className={`tw:grid tw:size-[18px] tw:shrink-0 tw:place-items-center tw:rounded-full tw:text-[10px] tw:font-extrabold ${
                    isActive ? "tw:bg-accent tw:text-white" : "tw:bg-faint tw:text-ink-muted"
                  }`}
                >
                  {number}
                </span>
              )}
              <span
                className={`tw:truncate tw:text-[12px] ${
                  isActive ? "tw:font-bold tw:text-body" : "tw:font-medium tw:text-muted"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// event_step_shell.dart:56-66 — floating CTA bar (hairline top, bg, 16/8/16/12 padding)
export function StepCtaBar({ children }) {
  return (
    <div className="tw:sticky tw:bottom-0 tw:z-10 tw:mt-4 tw:border-t tw:border-hairline tw:bg-paper tw:px-4 tw:pt-2 tw:pb-3">
      {children}
    </div>
  );
}

// app_buttons.dart:44-90 — filled pill, accent fill, WHITE label, h50
export function StepCtaButton({ children, disabled = false, type = "submit", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="tw:inline-flex tw:min-h-[50px] tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:bg-accent tw:px-5 tw:text-[15px] tw:font-bold tw:text-white tw:transition tw:hover:brightness-95 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
    >
      {children}
    </button>
  );
}
