import React, { Fragment, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Dialog, Transition } from "@headlessui/react";
import {
  flattenLaravelErrors,
  prettifyPath,
} from "../../../../../utils/helpers";
import { currencySymbol, formatMoney } from "../../../../../utils/pricingHelpers";

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
      <div className="tw:flex tw:h-48 tw:items-center tw:justify-center tw:rounded-[28px] tw:border tw:border-dashed tw:border-gray-200 tw:bg-slate-50 tw:text-sm tw:text-slate-500">
        No poster media added yet.
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:xl:grid-cols-3">
      {mediaItems.map((item, index) => (
        <figure
          key={`${item.type}-${item.name}-${index}`}
          className="tw:overflow-hidden tw:rounded-[24px] tw:border tw:border-gray-100 tw:bg-white tw:shadow-sm"
        >
          <div className="tw:relative">
            <img
              src={item.url}
              alt={item.name || `poster-${index}`}
              className="tw:h-52 tw:w-full tw:object-cover"
            />

            <span className="tw:absolute tw:left-3 tw:top-3 tw:rounded-full tw:bg-black/65 tw:px-2.5 tw:py-1 tw:text-[11px] tw:uppercase tw:text-white">
              {item.type}
            </span>
            {item.existing && (
              <span className="tw:absolute tw:right-3 tw:top-3 tw:rounded-full tw:bg-white tw:px-2.5 tw:py-1 tw:text-[11px] tw:text-slate-700">
                Existing
              </span>
            )}
          </div>
          <figcaption className="tw:truncate tw:px-3 tw:py-2 tw:text-xs tw:text-slate-500">
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
              <Dialog.Panel className="tw:w-full tw:max-w-lg tw:rounded-2xl tw:bg-white tw:p-5 tw:shadow-xl">
                <Dialog.Title className="tw:text-lg tw:font-semibold tw:text-gray-900">
                  Event submission failed
                </Dialog.Title>
                <Dialog.Description className="tw:mt-2 tw:text-sm tw:text-gray-600">
                  Please fix the errors below and submit again.
                </Dialog.Description>

                <ul className="tw:mt-4 tw:max-h-72 tw:space-y-2 tw:overflow-y-auto tw:pr-1 tw:text-sm tw:text-red-700">
                  {errors.map(({ path, messages }) => (
                    <li key={path} className="tw:rounded-xl tw:bg-red-50 tw:p-3">
                      <button
                        type="button"
                        className="tw:font-medium tw:text-red-700 tw:underline tw:underline-offset-2"
                        onClick={() => {
                          const match = path.match(/^step_(\d+)/);
                          if (match && onGoToStep) {
                            const step = Math.min(3, Math.max(1, Number(match[1])));
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
                    className="tw:rounded-xl tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white"
                    style={{ borderRadius: 16 }}
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

  React.useEffect(() => {
    return () => {
      if (manualCover instanceof File && manualCoverUrl) {
        URL.revokeObjectURL(manualCoverUrl);
      }
    };
  }, [manualCover, manualCoverUrl]);

  return (
    <div className="tw:rounded-[32px] tw:border tw:border-gray-100 tw:bg-white tw:p-5 tw:shadow-[0_20px_60px_rgba(15,23,42,0.05)] tw:sm:p-7">
      <ErrorModal
        open={isErrorModalOpen}
        errors={flat}
        onClose={() => setIsErrorModalOpen(false)}
        onGoToStep={onGoToStep}
      />

      {!!flat.length && (
        <div className="tw:mb-5 tw:rounded-[24px] tw:border tw:border-red-200 tw:bg-red-50 tw:p-4">
          <div className="tw:text-sm tw:font-medium tw:text-red-700">
            Please fix the errors below:
          </div>
          <ul className="tw:mt-2 tw:list-inside tw:list-disc tw:space-y-1 tw:text-sm tw:text-red-700">
            {flat.map(({ path, messages }) => (
              <li key={path}>
                <button
                  type="button"
                  className="tw:text-red-700 tw:underline tw:underline-offset-2 hover:tw:text-red-800"
                  onClick={() => {
                    const match = path.match(/^step_(\d+)/);
                    if (!match || !onGoToStep) return;
                    const step = Math.min(3, Math.max(1, Number(match[1])));
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

      <div className="tw:mb-6 tw:overflow-hidden tw:rounded-[28px] tw:bg-primary tw:p-6 tw:text-white">
        <div className="tw:flex tw:flex-col tw:gap-6 tw:lg:flex-row tw:lg:items-end tw:lg:justify-between">
          <div className="tw:max-w-2xl">
            <div className="tw:inline-flex tw:rounded-full tw:bg-white/10 tw:px-3 tw:py-1 tw:text-[11px] tw:uppercase tw:tracking-[0.2em]">
              Final preview
            </div>
            <span className="tw:block tw:mt-3 tw:text-2xl tw:font-semibold tw:md:text-4xl">
              {title || "Untitled event"}
            </span>
            <p className="tw:mt-3 tw:max-w-2xl tw:text-sm tw:text-white/80 tw:md:text-base">
              {description || "Add a short description to tell attendees what to expect."}
            </p>
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
            <div className="tw:rounded-2xl tw:border tw:border-white/15 tw:bg-white/10 tw:px-4 tw:py-3 tw:backdrop-blur">
              <div className="tw:text-xs tw:text-white/60">Date & time</div>
              <div className="tw:mt-1 tw:text-sm tw:font-medium">{dateLabel}</div>
            </div>
            <div className="tw:rounded-2xl tw:border tw:border-white/15 tw:bg-white/10 tw:px-4 tw:py-3 tw:backdrop-blur">
              <div className="tw:text-xs tw:text-white/60">Ticket price</div>
              <div className="tw:mt-1 tw:text-sm tw:font-medium">
                {currencyMark}
                {formatMoney(Number(price || 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-[1.15fr_0.85fr]">
        <section className="tw:space-y-4">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div>
              <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                Poster media
              </div>
              <div className="tw:text-sm tw:text-slate-500">
                Review the images that will represent this event.
              </div>
            </div>
            <button
              type="button"
              className="tw:text-sm tw:text-primary"
              onClick={() => onGoToStep?.(1)}
            >
              Edit
            </button>
          </div>

          <PreviewMedia
            posterImages={posterImages}
            existingPoster={existingPoster}
          />
        </section>

        <div className="tw:space-y-4">
          <section className="tw:rounded-[28px] tw:border tw:border-gray-100 tw:bg-[#faf8ff] tw:p-5">
            <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between">
              <div>
                <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                  Event summary
                </div>
                <div className="tw:text-sm tw:text-slate-500">
                  Core details attendees will care about.
                </div>
              </div>
              <button
                type="button"
                className="tw:text-sm tw:text-primary"
                onClick={() => onGoToStep?.(1)}
              >
                Edit
              </button>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-2">
              <div>
                <div className="tw:text-xs tw:text-slate-500">Title</div>
                <div className="tw:mt-1 tw:text-sm tw:font-medium tw:text-slate-900">
                  {title || "—"}
                </div>
              </div>
              <div className="">
                <div className="tw:text-xs tw:text-slate-500">Description</div>
                <div className="tw:mt-1 tw:text-sm tw:text-slate-700">
                  {description || "—"}
                </div>
              </div>
            </div>
          </section>

          <section className="tw:rounded-[28px] tw:border tw:border-gray-100 tw:bg-white tw:p-5">
            <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between">
              <div>
                <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                  Ticketing summary
                </div>
                <div className="tw:text-sm tw:text-slate-500">
                  Pricing, capacity, and attendee access.
                </div>
              </div>
              <button
                type="button"
                className="tw:text-sm tw:text-primary"
                onClick={() => onGoToStep?.(2)}
              >
                Edit
              </button>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                <div className="tw:text-xs tw:text-slate-500">Price</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                  {currencyMark}
                  {formatMoney(Number(price || 0))}
                </div>
              </div>
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                <div className="tw:text-xs tw:text-slate-500">Availability</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                  {maxTickets === "limited"
                    ? `${formatMoney(Number(ticketLimit || 0))} tickets`
                    : "Unlimited tickets"}
                </div>
              </div>
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                <div className="tw:text-xs tw:text-slate-500">Visibility</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:capitalize tw:text-slate-900">
                  {visibility || "public"}
                </div>
              </div>
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                <div className="tw:text-xs tw:text-slate-500">Replay enabled</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                  {enableReplay ? "Yes" : "No"}
                </div>
              </div>
              {enableReplay && (
                <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                  <div className="tw:text-xs tw:text-slate-500">Replay unlock delay</div>
                  <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                    {formatReplayMinutes(replayAvailableAfterMinutes)}
                  </div>
                </div>
              )}
              {enableReplay && (
                <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                  <div className="tw:text-xs tw:text-slate-500">Replay expiry window</div>
                  <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                    {formatReplayMinutes(replayAvailableForMinutes)}
                  </div>
                </div>
              )}
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4">
                <div className="tw:text-xs tw:text-slate-500">Mature content</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                  {matureContent ? "Yes" : "No"}
                </div>
              </div>
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:p-4 tw:sm:col-span-3">
                <div className="tw:text-xs tw:text-slate-500">Event material</div>
                <div className="tw:mt-1 tw:text-base tw:font-semibold tw:text-slate-900">
                  {hasMaterial
                    ? `${currencyMark}${formatMoney(Number(manualPrice || 0))} add-on`
                    : "No material attached"}
                </div>
                {hasMaterial && (
                  <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center">
                    {manualCoverUrl && (
                      <img
                        src={manualCoverUrl}
                        alt="Material cover"
                        className="tw:h-24 tw:w-24 tw:rounded-2xl tw:object-cover"
                      />
                    )}
                    <div className="tw:text-sm tw:text-slate-600">
                      {manualFile?.name || existingManual?.fileName || "Material attached"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="tw:mt-6 tw:flex tw:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="tw:rounded-full tw:border tw:border-gray-200 tw:px-4 tw:py-2.5 tw:hover:bg-gray-50"
          style={{ borderRadius: 20 }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isSubmitting}
          className="tw:rounded-full tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:px-5 tw:py-2.5 tw:text-white disabled:tw:opacity-70"
          style={{ borderRadius: 20 }}
        >
          {isSubmitting ? "Submitting..." : "Submit event"}
        </button>
      </div>
    </div>
  );
}
