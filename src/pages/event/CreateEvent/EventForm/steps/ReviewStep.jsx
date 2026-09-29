import React, { Fragment, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Dialog, Transition } from "@headlessui/react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Pencil,
  ShieldAlert,
  Ticket,
  Type,
  Eye,
} from "lucide-react";
import {
  flattenLaravelErrors,
  prettifyPath,
} from "../../../../../utils/helpers";
import { currencySymbol, formatMoney } from "../../../../../utils/pricingHelpers";
import { EventSelect, EventSwitch, StepCtaBar } from "./EventUI";

/*
 * App→web review/publish screen.
 * Source: lib/features/event/screens/preview_screen.dart
 *   :79-154   _buildSectionCard — 40x40 accent-10% tile, 12 w600 uppercase label,
 *             14 w600 value, 12 textLabel subtitle, Edit chip on the right
 *   :550-570  _buildPosterCard      :619-669  row order + hairline dividers
 *   :367-424  _buildVisibilityDropdownCard
 *   :426-488  _buildContentSafetyCard
 *   :577-599  AppBar "Review & Publish"    :679-720 bottom CTA bar
 *   :785-808  _buildEditChip
 * The app renders this as its own pushed screen (no step rail), reached from
 * create_event_three.dart:562 with CTA "Review & Publish".
 */

function Divider() {
  return <div className="tw:h-px tw:w-full tw:bg-hairline" />;
}

function EditChip({ onClick, label = "Edit" }) {
  // preview_screen.dart:785-808 — accent 10% pill, radius 9, 11.5 w600
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-[9px] tw:bg-accent-soft tw:px-2.5 tw:py-1.5 tw:text-[11.5px] tw:font-semibold tw:text-accent-deep"
    >
      <Pencil className="tw:size-[13px]" aria-hidden="true" />
      {label}
    </button>
  );
}

function IconTile({ icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "tw:bg-accent-soft tw:text-accent-deep",
    warning: "tw:bg-warning/10 tw:text-warning",
  };
  return (
    <span
      className={`tw:grid tw:size-10 tw:shrink-0 tw:place-items-center tw:rounded-[11px] ${tones[tone]}`}
    >
      <Icon className="tw:size-5" aria-hidden="true" />
    </span>
  );
}

function SummaryRow({ icon, label, value, subtitle, action, children }) {
  return (
    <div className="tw:py-3">
      {children ? (
        <div className="tw:flex tw:items-start tw:gap-3">
          <IconTile icon={icon} />
          <span className="tw:min-w-0 tw:flex-1 tw:text-[12px] tw:font-semibold tw:tracking-[0.2px] tw:text-muted">
            {label}
          </span>
          {action}
        </div>
      ) : (
        <div className="tw:flex tw:items-center tw:gap-3">
          <IconTile icon={icon} />
          <div className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-[12px] tw:font-semibold tw:tracking-[0.2px] tw:text-muted">
              {label}
            </span>
            <span className="tw:mt-[3px] tw:block tw:truncate tw:text-[14px] tw:font-semibold tw:text-body">
              {value}
            </span>
            {subtitle ? (
              <span className="tw:mt-px tw:block tw:text-[12px] tw:text-ink-muted">
                {subtitle}
              </span>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children ? <div className="tw:mt-3">{children}</div> : null}
    </div>
  );
}

function PreviewMedia({ posterImages, existingPoster }) {
  const imagePreviewUrls = useMemo(
    () =>
      posterImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [posterImages]
  );

  React.useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [imagePreviewUrls]);

  const mediaItems = [
    ...(existingPoster || []).filter((item) => item.type === "image").map((item) => ({
      type: item.type,
      url: item.url,
      name: item.type,
      existing: true,
    })),
    ...imagePreviewUrls.map((item) => ({
      type: "image",
      ...item,
      existing: false,
    })),
  ];

  if (!mediaItems.length) {
    return (
      <div className="tw:flex tw:h-32 tw:items-center tw:justify-center tw:rounded-[12px] tw:border tw:border-dashed tw:border-hairline tw:bg-inner tw:text-[12px] tw:font-medium tw:text-muted">
        No poster media added yet.
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:grid-cols-3">
      {mediaItems.map((item, index) => (
        <figure
          key={`${item.type}-${item.name}-${index}`}
          className="tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-hairline"
        >
          <div className="tw:relative">
            <img
              src={item.url}
              alt={item.name || `poster-${index}`}
              className="tw:h-40 tw:w-full tw:object-cover"
            />
            <span className="tw:absolute tw:left-2 tw:top-2 tw:rounded-full tw:bg-ink/70 tw:px-2.5 tw:py-1 tw:text-[11px] tw:uppercase tw:text-white">
              {item.type}
            </span>
            {item.existing ? (
              <span className="tw:absolute tw:right-2 tw:top-2 tw:rounded-full tw:bg-paper-raised tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-body">
                Existing
              </span>
            ) : null}
          </div>
          <figcaption className="tw:truncate tw:px-3 tw:py-2 tw:text-[12px] tw:font-medium tw:text-muted">
            {item.name || item.type}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function formatReplayMinutes(value) {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return "Not set";
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function ErrorModal({ open, errors, onClose, onGoToStep }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-999" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/45" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:scale-95"
              enterTo="tw:opacity-100 tw:scale-100"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:scale-100"
              leaveTo="tw:opacity-0 tw:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-lg tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-5">
                <Dialog.Title className="tw:block tw:font-display tw:text-[17px] tw:font-bold tw:text-body">
                  Event submission failed
                </Dialog.Title>
                <Dialog.Description className="tw:mt-2 tw:text-[13px] tw:font-medium tw:text-muted">
                  Please fix the errors below and submit again.
                </Dialog.Description>

                <ul className="tw:mt-4 tw:max-h-72 tw:space-y-2 tw:overflow-y-auto tw:pr-1 tw:text-[13px] tw:text-danger">
                  {errors.map(({ path, messages }) => (
                    <li key={path} className="tw:rounded-[12px] tw:border tw:border-danger/30 tw:p-3">
                      <button
                        type="button"
                        className="tw:font-semibold tw:underline tw:underline-offset-2"
                        onClick={() => {
                          const match = path.match(/^step_(\d+)/);
                          if (match && onGoToStep) {
                            const step = Math.min(2, Math.max(1, Number(match[1])));
                            onGoToStep(step);
                            onClose();
                          }
                        }}
                      >
                        {prettifyPath(path)}
                      </button>
                      <span>: {messages.join(", ")}</span>
                    </li>
                  ))}
                </ul>

                <div className="tw:mt-5 tw:flex tw:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:rounded-full tw:bg-accent tw:px-4 tw:py-2 tw:text-[13px] tw:font-bold tw:text-white"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function ReviewStep({
  collected,
  formErrors,
  isSubmitting,
  onBack,
  onPublish,
  onGoToStep,
  onUpdateAccess,
  isEdit = false,
  posterImages = [],
  existingPoster = [],
}) {
  const {
    title,
    date,
    time,
    location,
    description,
    price,
    currencyCode,
    deliveryType,
    maxTickets,
    ticketLimit,
    visibility,
    hasMaterials,
    enableReplay,
    replayAvailableAfterMinutes,
    replayAvailableForMinutes,
    matureContent,
    manualPrice,
    manualFile,
    manualCover,
    existingManual,
    existingManualCover,
  } = collected || {};

  // preview_screen.dart:407-420 / :476-484 — both are editable from this screen.
  const [accessDraft, setAccessDraft] = useState({
    visibility: visibility === "private" ? "private" : "public",
    matureContent: !!matureContent,
  });

  const flat = useMemo(
    () => flattenLaravelErrors(formErrors),
    [formErrors]
  );
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  useEffect(() => {
    if (flat.length) {
      setIsErrorModalOpen(true);
    }
  }, [flat]);

  const currencyMark = currencySymbol(currencyCode || "NGN");
  const dateLabel =
    date && time
      ? moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").format("dddd, MMMM D, YYYY [at] h:mm A")
      : "Date and time not set";
  const manualCoverUrl = useMemo(() => {
    if (manualCover instanceof File) {
      return URL.createObjectURL(manualCover);
    }
    return existingManualCover?.url || "";
  }, [existingManualCover?.url, manualCover]);
  const hasMaterial = Boolean(
    hasMaterials && (manualFile || existingManual?.fileName)
  );

  const updateAccess = (patch) => {
    const next = { ...accessDraft, ...patch };
    setAccessDraft(next);
    onUpdateAccess?.(next);
  };

  React.useEffect(() => {
    return () => {
      if (manualCover instanceof File && manualCoverUrl) {
        URL.revokeObjectURL(manualCoverUrl);
      }
    };
  }, [manualCover, manualCoverUrl]);

  const priceLabel = price
    ? `${currencyMark}${formatMoney(Number(price))}`
    : "Free";
  const maxTicketsLabel =
    maxTickets === "limited"
      ? `${formatMoney(Number(ticketLimit || 0))} tickets`
      : "Unlimited";

  return (
    <div>
      <ErrorModal
        open={isErrorModalOpen}
        errors={flat}
        onClose={() => setIsErrorModalOpen(false)}
        onGoToStep={onGoToStep}
      />

      {/* preview_screen.dart:577-599 — AppBar "Review & Publish" (no step rail) */}
      <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:pt-2 tw:pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-[14px] tw:border tw:border-hairline tw:bg-inner tw:p-[11px] tw:text-body tw:transition tw:hover:border-accent"
        >
          <ChevronLeft className="tw:size-[18px]" aria-hidden="true" />
        </button>
        <span className="tw:block tw:flex-1 tw:text-center tw:font-display tw:text-[17px] tw:font-bold tw:text-body">
          Review &amp; Publish
        </span>
        <span className="tw:w-10" />
      </div>

      <div className="tw:px-3.5 tw:pt-3 tw:pb-4">
        {!!flat.length && (
          <div className="tw:mb-3 tw:rounded-[12px] tw:border tw:border-danger/30 tw:p-4">
            <div className="tw:text-[13px] tw:font-bold tw:text-danger">
              Please fix the errors below:
            </div>
            <ul className="tw:mt-2 tw:list-inside tw:list-disc tw:space-y-1 tw:text-[13px] tw:text-danger">
              {flat.map(({ path, messages }) => (
                <li key={path}>
                  <button
                    type="button"
                    className="tw:underline tw:underline-offset-2"
                    onClick={() => {
                      const match = path.match(/^step_(\d+)/);
                      if (!match || !onGoToStep) return;
                      const step = Math.min(2, Math.max(1, Number(match[1])));
                      onGoToStep(step);
                    }}
                  >
                    {prettifyPath(path)}:
                  </button>{" "}
                  {messages.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* preview_screen.dart:619-669 — one card, hairline-divided rows */}
        <div className="tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3.5 tw:py-2">
          <SummaryRow
            icon={Type}
            label="EDIT TITLE AND DESCRIPTION"
            action={<EditChip onClick={() => onGoToStep?.(1)} />}
          >
            <div className="tw:pl-0">
              <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-body">
                {title || "Event title"}
              </span>
              <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
                {description || "No description provided"}
              </span>
            </div>
          </SummaryRow>
          <Divider />

          <SummaryRow
            icon={Eye}
            label="POSTER MEDIA"
            action={<EditChip onClick={() => onGoToStep?.(1)} />}
          >
            <PreviewMedia posterImages={posterImages} existingPoster={existingPoster} />
          </SummaryRow>
          <Divider />

          <SummaryRow
            icon={Ticket}
            label="TICKETS PRICE"
            value={priceLabel}
            subtitle={`Max ${maxTicketsLabel} tickets • ${currencyCode || "NGN"}`}
            action={<EditChip onClick={() => onGoToStep?.(2)} />}
          />
          <Divider />

          <SummaryRow
            icon={Clock}
            label="DATE AND TIME"
            value={dateLabel}
            subtitle={location || "Online"}
          />
          <Divider />

          {hasMaterial ? (
            <>
              <SummaryRow
                icon={FileText}
                label="EVENT MANUAL"
                value={manualFile?.name || existingManual?.fileName || "Material attached"}
                subtitle={
                  Number(manualPrice || 0) > 0
                    ? `Price ${currencyMark}${formatMoney(Number(manualPrice))}`
                    : "Manual attached"
                }
                action={<EditChip onClick={() => onGoToStep?.(2)} />}
              />
              <Divider />
            </>
          ) : null}

          {deliveryType === "vod" ? (
            <>
              <SummaryRow
                icon={CheckCircle2}
                label="EVENT VIDEO"
                value="Video on demand"
                subtitle="Uploaded before review"
                action={<EditChip onClick={() => onGoToStep?.(2)} />}
              />
              <Divider />
            </>
          ) : null}

          <SummaryRow
            icon={Clock}
            label="REPLAY"
            value={enableReplay ? "Enabled" : "Not enabled"}
            subtitle={
              enableReplay
                ? `Unlocks after ${formatReplayMinutes(replayAvailableAfterMinutes)} • stays online ${formatReplayMinutes(replayAvailableForMinutes)}`
                : undefined
            }
            action={<EditChip onClick={() => onGoToStep?.(2)} />}
          />
          <Divider />

          {/* preview_screen.dart:367-424 — editable visibility dropdown on this screen */}
          <div className="tw:py-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <IconTile icon={Eye} />
              <span className="tw:min-w-0 tw:flex-1 tw:text-[12px] tw:font-semibold tw:tracking-[0.2px] tw:text-muted">
                VISIBILITY
              </span>
            </div>
            <div className="tw:mt-3">
              <EventSelect
                value={accessDraft.visibility}
                onChange={(value) => updateAccess({ visibility: value })}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                ]}
                placeholder="Select visibility"
              />
            </div>
          </div>
          <Divider />

          {/* preview_screen.dart:426-488 — content safety switch */}
          <div className="tw:flex tw:items-center tw:gap-3 tw:py-3">
            <IconTile icon={ShieldAlert} tone="warning" />
            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:text-[12px] tw:font-semibold tw:tracking-[0.2px] tw:text-muted">
                CONTENT SAFETY
              </span>
              <span className="tw:mt-[3px] tw:block tw:text-[14px] tw:font-semibold tw:text-body">
                {accessDraft.matureContent ? "Mature content enabled" : "Mature content flag"}
              </span>
            </span>
            <EventSwitch
              label="Mature content"
              checked={accessDraft.matureContent}
              onChange={(next) => updateAccess({ matureContent: next })}
            />
          </div>
        </div>
      </div>

      {/* preview_screen.dart:679-720 — bottom CTA bar */}
      <StepCtaBar>
        <button
          type="button"
          onClick={onPublish}
          disabled={isSubmitting}
          className="tw:inline-flex tw:min-h-[50px] tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:bg-accent tw:px-5 tw:text-[15px] tw:font-bold tw:text-white tw:transition tw:hover:brightness-95 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
        >
          {isSubmitting
            ? "Submitting..."
            : isEdit
            ? "Save Changes"
            : "Publish Event"}
        </button>
      </StepCtaBar>
    </div>
  );
}
