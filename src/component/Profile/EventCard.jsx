import React, { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  Clock,
  Heart,
  Pencil,
  Trash2,
  Pause,
  CalendarDays,
  MoreVertical,
  Upload,
  QrCode,
  BarChart3,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { showPromise } from "../ui/toast";
import { useAuth } from "../../pages/auth/AuthContext";
import MediaCarousel from "./MediaCarousel";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { CountdownPill, eventStartDate } from "../Events/SingleEvent";
import RescheduleEventModal from "./RescheduleEventModal";
import ReplayUploadModal from "../Events/ReplayUploadModal";
import { getEventStatusMeta, normalizeEventStatus } from "../../utils/eventStatus";

function collectMedia(poster = []) {
  const imgs = poster.filter((p) => p.type === "image");
  const vids = poster.filter((p) => p.type === "video");
  return [...imgs, ...vids];
}
function getApiErrorMessage(err) {
  const data = err?.response?.data;

  if (typeof data?.message === "string" && data.message.trim())
    return data.message;
  if (typeof err?.message === "string" && err.message.trim())
    return err.message;

  return "Something went wrong. Please try again.";
}

function formatEventSchedule(event) {
  const dateValue = event?.eventDateISO || event?.event_date || "";
  const timeValue = event?.startTime || event?.start_time || "";
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const date =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : null;
  const dateLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : event?.eventDate || "Date not set";

  if (!timeValue) return dateLabel;

  const parsedDate = new Date(timeValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    const timeLabel = parsedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateLabel} • ${timeLabel}`;
  }

  const normalized = String(timeValue).trim();
  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    let hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = ((hour + 11) % 12) + 1;
    return `${dateLabel} • ${hour}:${minute} ${suffix}`;
  }

  const meridianMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (meridianMatch) {
    return `${dateLabel} • ${normalized.toUpperCase()}`;
  }

  return `${dateLabel} • ${normalized}`;
}

function isStatusBlockedForReschedule(status) {
  const normalized = (status ?? "").toString().toLowerCase().trim();

  return [
    "live",
    "paused",
    "ended",
    "completed",
    "past",
    "cancelled",
    "canceled",
    "did not hold",
    "did_not_hold",
    "did-not-hold",
  ].includes(normalized);
}

function hasUsedReschedule(event) {
  const remainingChanges = Number(event?.remaining_changes);
  const dateTimeChangeCount = Number(event?.date_time_change_count);

  if (Number.isFinite(remainingChanges)) {
    return remainingChanges <= 0;
  }

  if (Number.isFinite(dateTimeChangeCount)) {
    return dateTimeChangeCount >= 1;
  }

  return false;
}

export default function EventCard({
  event,
  isOwnProfile,
  isOrganiserProfile,
  onDeleted,
  onUpdated,
  refreshEvents,
}) {
  const media = useMemo(() => collectMedia(event.poster), [event]);
  const startDate = useMemo(() => eventStartDate(event), [event]);
  const normalizedStatus = useMemo(
    () => normalizeEventStatus(event?.status),
    [event?.status],
  );
  const isVodEvent = event?.delivery_type === "vod";
  const attendanceType = String(event?.attendance_type || event?.attendanceType || "").toLowerCase();
  const isPhysicalOnlyEvent = attendanceType === "physical";
  const statusMeta = useMemo(() => getEventStatusMeta(event?.status), [event?.status]);
  const scheduleLabel = useMemo(() => formatEventSchedule(event), [event]);
  const [isSaved, setIsSaved] = useState(!!event.is_saved);
  const [deleteError, setDeleteError] = useState("");
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openReplayUpload, setOpenReplayUpload] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startingStream, setStartingStream] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  const isOwnerEvent = Boolean(event?.isOwner || isOwnProfile);
  const hasTicketSales = Boolean(event?.has_ticket_sales);
  const shouldShowRescheduleAction =
    isOwnerEvent && !isStatusBlockedForReschedule(event?.status);
  const rescheduleLocked = hasUsedReschedule(event);
  const replayUploadAllowed =
    normalizeEventStatus(event?.status) === "ended" && !!event?.enable_replay;

  const goToEvent = () => {
    navigate(`/event/view/${event.id}`);
  };

  const goToStreamControl = async () => {
    if (isVodEvent) {
      navigate(`/event/view/${event.id}`);
      return;
    }

    if (normalizedStatus === "ended" || normalizedStatus === "expired") {
      navigate(`/event/stream/${event.id}`);
      return;
    }

    setStartingStream(true);
    try {
      await showPromise(
        api.post(`/api/v1/events/${event.id}/streams/start`, {}, authHeaders(token)),
        {
          loading: "Starting stream…",
          success: "Stream ready",
          error: (err) => getApiErrorMessage(err),
        },
      );
      navigate(`/event/stream/${event.id}`);
    } finally {
      setStartingStream(false);
    }
  };

  const toggleSave = async () => {
    const req = api.post(
      `/api/v1/events/${event.id}/toggle`,
      {},
      authHeaders(token),
    );

    await showPromise(req, {
      loading: isSaved ? "Removing…" : "Saving…",
      success: isSaved ? "Removed from saved" : "Saved",
      error: "Could not update",
    });

    setIsSaved((s) => !s);
  };

  const deleteEvent = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      await showPromise(
        api.post(`/api/v1/delete/event/${event.id}`, {}, authHeaders(token)),
        {
          loading: "Deleting event…",
          success: "Event deleted",
          error: (err) => getApiErrorMessage(err), // IMPORTANT: allow function
        },
      );

      setOpenDelete(false);
      onDeleted?.(event.id);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const statusChip = (
    <span className={`tw:inline-flex tw:h-6 tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2.5 tw:text-[10px] tw:font-semibold ${statusMeta.pillClass}`}>
      <span>{statusMeta.label}</span>
      {normalizedStatus === "paused" ? (
        <Pause className="tw:size-3.5" />
      ) : (
        <span className={`tw:inline-block tw:h-2 tw:w-2 tw:rounded-full ${statusMeta.dotClass}`} />
      )}
    </span>
  );

  const handleRescheduleSuccess = async ({ event: nextEvent }) => {
    onUpdated?.(nextEvent);
    await refreshEvents?.();
  };

  const handleReplayUploaded = async () => {
    await refreshEvents?.();
  };

  return (
    <div className="col-12 col-md-6 col-lg-6 col-xl-6 tw:relative tw:overflow-hidden tw:rounded-3xl tw:border tw:border-slate-100 tw:bg-[#ffffff] tw:shadow-[0_14px_36px_rgba(15,23,42,0.06),0_0_18px_rgba(0,245,255,0.04)] tw:transition-shadow tw:hover:shadow-[0_18px_46px_rgba(15,23,42,0.08),0_0_24px_rgba(0,245,255,0.08)]">
      {/* Top-right actions (only for owner) */}
      {isOwnerEvent && (
        <div className="tw:absolute tw:right-4 tw:top-4 tw:z-20">
          <Menu as="div" className="tw:relative">
            <Menu.Button
              style={{ borderRadius: 9999 }}
              onClick={(e) => e.stopPropagation()}
              className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-slate-700 tw:shadow-[0_10px_24px_rgba(15,23,42,0.14),0_0_12px_rgba(0,245,255,0.08)] tw:hover:bg-slate-50"
            >
              <MoreVertical className="tw:h-4 tw:w-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="tw:transition tw:duration-100 tw:ease-out"
              enterFrom="tw:opacity-0 tw:scale-95"
              enterTo="tw:opacity-100 tw:scale-100"
              leave="tw:transition tw:duration-75 tw:ease-in"
              leaveFrom="tw:opacity-100 tw:scale-100"
              leaveTo="tw:opacity-0 tw:scale-95"
            >
              <Menu.Items className="tw:absolute tw:right-0 tw:mt-2 tw:w-60 tw:origin-top-right tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:shadow-[0_18px_48px_rgba(15,23,42,0.14),0_0_20px_rgba(0,245,255,0.08)] focus:tw:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/edit/${event.id}`);
                      }}
                      className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:text-slate-700 ${active ? "tw:bg-slate-100" : ""
                        }`}
                    >
                      <Pencil className="tw:h-4 tw:w-4" />
                      <span>Edit Event</span>
                    </button>
                  )}
                </Menu.Item>

                {event?.checkin_available || ["physical", "both"].includes(event?.attendance_type) ? (
                  <Menu.Item>
                    {({ active }) => (
                      <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/event/checkin/${event.id}`); }} className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:text-slate-700 ${active ? "tw:bg-slate-100" : ""}`}>
                        <QrCode className="tw:h-4 tw:w-4" />
                        <span>Manage Check-In</span>
                      </button>
                    )}
                  </Menu.Item>
                ) : null}

                {!isPhysicalOnlyEvent ? (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/analytics/${event.id}`);
                        }}
                        className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:text-slate-700 ${active ? "tw:bg-slate-100" : ""}`}
                      >
                        <BarChart3 className="tw:h-4 tw:w-4" />
                        <span>Stream Analytics</span>
                      </button>
                    )}
                  </Menu.Item>
                ) : null}

                <Menu.Item disabled={!shouldShowRescheduleAction || rescheduleLocked}>
                  {({ active, disabled }) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        setOpenReschedule(true);
                      }}
                      className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm ${disabled
                        ? "tw:cursor-not-allowed tw:text-slate-400"
                        : active
                          ? "tw:bg-slate-100 tw:text-slate-700"
                          : "tw:text-slate-700"
                        }`}
                    >
                      <CalendarDays className="tw:h-4 tw:w-4" />
                      <span>Reschedule Event</span>
                    </button>
                  )}
                </Menu.Item>

                {event?.enable_replay ? (
                  <Menu.Item disabled={!replayUploadAllowed}>
                    {({ active, disabled }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (disabled) return;
                          setOpenReplayUpload(true);
                        }}
                        className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm ${disabled
                          ? "tw:cursor-not-allowed tw:text-slate-400"
                          : active
                            ? "tw:bg-slate-100 tw:text-slate-700"
                            : "tw:text-slate-700"
                          }`}
                      >
                        <Upload className="tw:h-4 tw:w-4" />
                        <span>Upload Replay Video</span>
                      </button>
                    )}
                  </Menu.Item>
                ) : null}

                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasTicketSales) return;
                        setDeleteError("");
                        setOpenDelete(true);
                      }}
                      disabled={hasTicketSales}
                      className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:text-sm ${
                        hasTicketSales
                          ? "tw:cursor-not-allowed tw:text-slate-400"
                          : `tw:text-red-600 ${active ? "tw:bg-red-50" : ""}`
                      }`}
                    >
                      <Trash2 className="tw:h-4 tw:w-4" />
                      <span>Delete Event</span>
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      )}

      {/* Clickable media/title section navigates to event page */}
      <div className="tw:cursor-pointer" onClick={goToEvent}>
        <MediaCarousel items={media} alt={event.title} />
      </div>

      <div className="tw:flex tw:flex-col tw:gap-4 tw:p-5">
        <div className="tw:text-xs tw:text-zinc-600">
          <div className="tw:flex tw:flex-col tw:gap-3">
            {statusChip && (
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  {statusChip}
                  {normalizedStatus === "upcoming" && <CountdownPill target={startDate} />}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="tw:flex tw:items-start tw:gap-2">
          <div
            onClick={goToEvent}
            className="tw:uppercase tw:text-left tw:block tw:text-[16px] tw:text-black tw:font-semibold tw:flex-1"
          >
            {event.title}
          </div>

          {isOrganiserProfile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSave();
              }}
              className={`tw:rounded-xl tw:p-2 tw:transition ${isSaved ? "tw:text-primary" : "tw:text-gray-600 "
                }`}
              aria-label="Save"
              title={isSaved ? "Unsave" : "Save"}
            >
              <Heart
                className={`tw:size-5 ${isSaved ? "tw:fill-current" : ""}`}
              />
            </button>
          )}
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:pt-1">
          <div className="tw:text-xs tw:inline-flex tw:items-center tw:gap-2 tw:text-gray-600">
            <Clock size={14} />
            <span>{scheduleLabel}</span>
          </div>
          <div className="tw:text-primary tw:text-lg tw:font-semibold">
            {event.price_display}
          </div>
        </div>

        {/* <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-5 tw:text-gray-500">
          <div className="tw:space-x-5">
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm">
              <Eye size={14} /> 0
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm">
              <Users size={14} /> 0
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw:size-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                  clipRule="evenodd"
                />
              </svg>
              0
            </span>
          </div>
        </div> */}

        {/* CTA */}
        {isOwnerEvent ? (
          <button
            style={{
              fontSize: 12,
              borderRadius: 20,
            }}
            onClick={(e) => {
              e.stopPropagation();
              goToStreamControl();
            }}
            disabled={startingStream}
            className="tw:mt-auto tw:inline-flex tw:gap-2 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:font-medium tw:text-white tw:shadow-[0_12px_28px_rgba(0,0,0,0.14),0_0_16px_rgba(0,245,255,0.12)] tw:hover:bg-primary/90"
          >
            <span className="tw:mr-2">
              {startingStream
                ? "Starting stream..."
                : isVodEvent
                  ? "View event"
                : normalizedStatus === "live"
                  ? "Manage live stream"
                  : normalizedStatus === "paused"
                    ? "Resume Event"
                    : normalizedStatus === "ended"
                      ? "View Event"
                      : normalizedStatus === "expired"
                        ? "View Event"
                      : "Start stream"}
            </span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToEvent();
            }}
            className="tw:mt-4 tw:inline-flex tw:gap-2 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:font-medium tw:text-white tw:shadow-[0_12px_28px_rgba(0,0,0,0.14),0_0_16px_rgba(0,245,255,0.12)] tw:hover:bg-primary/90"
          >
            <span className="tw:mr-2">
              {isOrganiserProfile ? "Buy Ticket" : "View event"}
            </span>
          </button>
        )}
      </div>

      <DeleteConfirmModal
        open={openDelete}
        onClose={() => (deleting ? null : setOpenDelete(false))}
        title="Delete this event?"
        description={
          hasTicketSales
            ? "This event already has ticket sales and cannot be deleted."
            : "This will permanently remove the event and its details. This action cannot be undone."
        }
        confirmText="Yes, delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={deleteEvent}
      />
      <RescheduleEventModal
        open={openReschedule}
        event={event}
        onClose={() => setOpenReschedule(false)}
        onSuccess={handleRescheduleSuccess}
      />
      <ReplayUploadModal
        open={openReplayUpload}
        event={event}
        token={token}
        onClose={() => setOpenReplayUpload(false)}
        onUploaded={handleReplayUploaded}
      />
    </div>
  );
}
