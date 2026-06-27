import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import moment from "moment";
import { AlertCircle, Loader2, X } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { showError, showSuccess } from "../ui/toast";

const START_FORMATS = [
  "YYYY-MM-DD HH:mm",
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DD h:mm A",
  "YYYY-MM-DD hh:mm A",
];

const TIME_FORMATS = ["HH:mm", "HH:mm:ss", "h:mm A", "hh:mm A"];

function parseDateValue(value) {
  if (!value) return null;

  const parsed = moment(value, ["YYYY-MM-DD", moment.ISO_8601], true);
  return parsed.isValid() ? parsed : null;
}

function parseTimeValue(value) {
  if (!value) return null;

  const isoParsed = moment(value, moment.ISO_8601, true);
  if (isoParsed.isValid()) return isoParsed;

  const timeParsed = moment(value, TIME_FORMATS, true);
  return timeParsed.isValid() ? timeParsed : null;
}

function formatDisplayTime(value) {
  const parsed = parseTimeValue(value);
  return parsed ? parsed.format("h:mm A") : "";
}

function formatScheduleLine(dateValue, timeValue) {
  const dateMoment = parseDateValue(dateValue);
  const timeMoment = parseTimeValue(timeValue);

  const dateText = dateMoment?.isValid()
    ? dateMoment.format("ddd, MMM D, YYYY")
    : "Date not set";
  const timeText = timeMoment?.isValid() ? timeMoment.format("h:mm A") : "Time not set";

  return `${dateText} at ${timeText}`;
}

function formatEventDateLabel(dateValue) {
  const dateMoment = moment(dateValue, ["YYYY-MM-DD", moment.ISO_8601], true);
  return dateMoment.isValid() ? dateMoment.format("MMM D, YYYY") : dateValue || "Date not set";
}

function buildInitialStartDateTime(event) {
  const dateValue = event?.eventDateISO || event?.event_date || "";
  const timeValue = event?.startTime || event?.start_time || "";

  const parsedTime = parseTimeValue(timeValue);
  if (parsedTime && moment(timeValue, moment.ISO_8601, true).isValid()) {
    return parsedTime;
  }

  const parsedDate = parseDateValue(dateValue);
  if (parsedDate && parsedTime) {
    return parsedDate
      .clone()
      .hour(parsedTime.hour())
      .minute(parsedTime.minute())
      .second(0);
  }

  if (dateValue && timeValue) {
    const parsed = moment(`${dateValue} ${timeValue}`, START_FORMATS, true);
    if (parsed.isValid()) return parsed;
  }

  return parsedDate || moment().add(1, "day").startOf("hour");
}

function buildInitialEndTime(event, startDateTime) {
  const endValue = event?.endTime || event?.end_time || "";
  if (endValue) {
    const parsed = parseTimeValue(endValue);
    if (parsed) {
      return startDateTime
        .clone()
        .hour(parsed.hour())
        .minute(parsed.minute())
        .second(0);
    }
  }

  return startDateTime.clone().add(2, "hours");
}

function normalizeUpdatedEvent(event, payload = {}) {
  const responseData = payload?.data || payload || {};
  const updatedEvent = responseData?.event || responseData?.updated_event || {};
  const reschedule = responseData?.reschedule || {};
  const nextValues = reschedule?.new || {};
  const nextDate = nextValues?.event_date || updatedEvent?.event_date || event?.event_date;
  const nextStartTime =
    nextValues?.start_time || updatedEvent?.start_time || event?.start_time;
  const nextEndTime = nextValues?.end_time || updatedEvent?.end_time || event?.end_time;
  const changesUsed = Number(
    responseData?.changes_used ??
      updatedEvent?.date_time_change_count ??
      event?.date_time_change_count ??
      1
  );
  const remainingChanges = Number(
    responseData?.remaining_changes ??
      updatedEvent?.remaining_changes ??
      event?.remaining_changes ??
      0
  );

  return {
    ...event,
    ...updatedEvent,
    event_date: nextDate,
    eventDateISO: nextDate,
    eventDate: formatEventDateLabel(nextDate),
    start_time: nextStartTime,
    startTime: formatDisplayTime(nextStartTime),
    end_time: nextEndTime,
    endTime: formatDisplayTime(nextEndTime),
    date_time_change_count: Number.isFinite(changesUsed) ? changesUsed : 1,
    changes_used: Number.isFinite(changesUsed) ? changesUsed : 1,
    remaining_changes: Number.isFinite(remainingChanges) ? remainingChanges : 0,
    latest_reschedule: nextValues,
  };
}

async function syncNotifications(token) {
  if (!token || typeof window === "undefined") return;

  try {
    const res = await api.get("/api/v1/notifications", authHeaders(token));
    const notifications = Array.isArray(res?.data?.notifications)
      ? res.data.notifications
      : [];

    window.dispatchEvent(
      new CustomEvent("notifications:sync", { detail: notifications })
    );
  } catch (error) {
    console.error("Failed to refresh notifications", error);
  }
}

export default function RescheduleEventModal({
  open,
  event,
  onClose,
  onSuccess,
}) {
  const { token } = useAuth();
  const [startDateTime, setStartDateTime] = useState(() => buildInitialStartDateTime(event));
  const [endTime, setEndTime] = useState(() =>
    buildInitialEndTime(event, buildInitialStartDateTime(event))
  );
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const nextStart = buildInitialStartDateTime(event);
    setStartDateTime(nextStart);
    setEndTime(buildInitialEndTime(event, nextStart));
    setReason("");
    setErrorMessage("");
    setSubmitting(false);
  }, [event, open]);

  const oldScheduleLabel = useMemo(
    () => formatScheduleLine(event?.event_date || event?.eventDateISO, event?.startTime || event?.start_time),
    [event]
  );

  const nextScheduleLabel = useMemo(
    () =>
      formatScheduleLine(
        startDateTime?.format("YYYY-MM-DD"),
        startDateTime?.format("HH:mm")
      ),
    [startDateTime]
  );

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    const nextStart = moment(startDateTime);
    const nextEnd = moment(startDateTime)
      .hour(moment(endTime).hour())
      .minute(moment(endTime).minute())
      .second(0);

    if (!nextStart.isValid()) {
      setErrorMessage("Choose a valid new date and start time.");
      return;
    }

    if (!nextStart.isAfter(moment())) {
      setErrorMessage("The new event date and start time must be in the future.");
      return;
    }

    if (!nextEnd.isValid() || !nextEnd.isAfter(nextStart)) {
      setErrorMessage("End time must be later than the new start time.");
      return;
    }

    if (trimmedReason.length < 10) {
      setErrorMessage("Add a short reason so attendees understand the schedule change.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await api.patch(
        `/api/v1/events/${event.id}/reschedule`,
        {
          event_date: nextStart.format("YYYY-MM-DD"),
          start_time: nextStart.format("HH:mm"),
          end_time: nextEnd.format("HH:mm"),
          reason: trimmedReason,
        },
        authHeaders(token)
      );

      const responseData = res?.data?.data || res?.data || {};
      const updatedEvent = normalizeUpdatedEvent(event, responseData);

      await syncNotifications(token);
      showSuccess(res?.data?.message || "Event rescheduled successfully.");
      onSuccess?.({
        event: updatedEvent,
        responseData,
      });
      onClose();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to reschedule this event right now.";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("already been rescheduled once")) {
        onSuccess?.({
          event: {
            ...event,
            date_time_change_count: Math.max(
              Number(event?.date_time_change_count || 0),
              1
            ),
            remaining_changes: 0,
          },
          responseData: null,
          lockReschedule: true,
        });
        showError(message);
        onClose();
        return;
      }

      setErrorMessage(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:bg-slate-950/60 tw:backdrop-blur-[2px]" />
        </TransitionChild>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-3 tw:sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:translate-y-3 tw:sm:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-3 tw:sm:scale-95"
            >
              <DialogPanel className="tw:flex tw:w-full tw:max-w-xl tw:max-h-[82vh] tw:flex-col tw:overflow-hidden tw:rounded-[28px] tw:bg-white tw:shadow-[0_24px_64px_rgba(15,23,42,0.18)] tw:ring-1 tw:ring-black/5 tw:sm:max-h-[86vh]">
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <div className="tw:overflow-y-auto tw:px-5 tw:py-5 tw:sm:px-6 tw:sm:py-6">
                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                      <div>
                        <span className="tw:text-xl tw:font-semibold tw:text-slate-900">
                          Reschedule event
                        </span>
                        <span className="tw:block tw:mt-1 tw:text-sm tw:text-slate-500">
                          Change the event date and time once. Connected users will be notified automatically.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-slate-500 tw:hover:bg-slate-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                      >
                        <X className="tw:h-4 tw:w-4" />
                      </button>
                    </div>

                    <div className="tw:mt-5 tw:space-y-3">
                      <div className=" tw:py-3">
                        <span className="tw:block tw:text-xs tw:font-medium tw:text-slate-500">
                          Current schedule
                        </span>
                        <span className="tw:mt-1 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                          {oldScheduleLabel}
                        </span>
                      </div>
                      <div className=" tw:py-3">
                        <span className="tw:block tw:text-xs tw:font-medium tw:text-slate-500">
                          New schedule preview
                        </span>
                        <span className="tw:mt-1 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                          {nextScheduleLabel}
                        </span>
                      </div>
                      <div className="tw:rounded-2xl tw:border tw:border-amber-100 tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-sm tw:text-amber-800">
                        This change can only be made once.
                      </div>
                    </div>

                    <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-5">
                      <div>
                        <span className="tw:mb-2 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                          New date and start time
                        </span>
                        <DateTimePicker
                          value={startDateTime}
                          onChange={(value) => {
                            const nextValue = value ? moment(value) : value;
                            setStartDateTime(nextValue);

                            if (!nextValue || !moment(endTime).isValid()) return;

                            const nextEnd = nextValue
                              .clone()
                              .hour(moment(endTime).hour())
                              .minute(moment(endTime).minute())
                              .second(0);

                            if (!nextEnd.isAfter(nextValue)) {
                              setEndTime(nextValue.clone().add(2, "hours"));
                            }
                          }}
                          disablePast
                          ampm
                          minutesStep={5}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              placeholder: "Select new date and time",
                              sx: {
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "16px",
                                  backgroundColor: "#fff",
                                },
                              },
                            },
                          }}
                        />
                      </div>

                      <div>
                        <span className="tw:mb-2 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                          New end time
                        </span>
                        <TimePicker
                          value={endTime}
                          onChange={(value) => setEndTime(value ? moment(value) : value)}
                          ampm
                          minutesStep={5}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              placeholder: "Choose end time",
                              sx: {
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "16px",
                                  backgroundColor: "#fff",
                                },
                              },
                            },
                          }}
                        />
                      </div>

                      <div>
                        <span className="tw:mb-2 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                          Reason for reschedule
                        </span>
                        <textarea
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          rows={4}
                          placeholder="Tell attendees why the schedule changed."
                          className="tw:min-h-[120px] tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:text-slate-900 focus:tw:border-primary focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary/15"
                        />
                      </div>
                    </div>

                    {errorMessage ? (
                      <div className="tw:mt-5 tw:flex tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-red-100 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-sm tw:text-red-700">
                        <AlertCircle className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    ) : null}

                    <div className="tw:mt-6 tw:flex tw:flex-col-reverse tw:gap-3 tw:sm:flex-row tw:sm:justify-end">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-slate-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-slate-700 tw:hover:bg-slate-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                        style={{ borderRadius: 16 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="tw:inline-flex tw:h-11 tw:min-w-[170px] tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-70"
                        style={{ borderRadius: 16 }}
                      >
                        {submitting ? (
                          <Loader2 className="tw:h-4 tw:w-4 tw:animate-spin" />
                        ) : (
                          "Confirm reschedule"
                        )}
                      </button>
                    </div>
                  </div>
                </LocalizationProvider>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
