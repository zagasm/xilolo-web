import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import moment from "moment";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ArrowRight, Calendar, Globe, MapPin, MonitorSmartphone, Tag, TextAlignLeft } from "lucide-react";
import { useAuth } from "../../../../../pages/auth/AuthContext";
import { api } from "../../../../../lib/apiClient";
import { showError } from "../../../../../component/ui/toast";
import PosterMediaFields from "./PosterMediaFields";
import {
  APP_INPUT,
  APP_INPUT_ERROR,
  EventSelect,
  EventSurfaceGroup,
  Field,
  FieldError,
  StepCtaBar,
  StepCtaButton,
} from "./EventUI";

const schema = z.object({
  title: z.string().min(5, "Event title must be at least 5 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  dateTime: z
    .any()
    .refine((value) => value && moment(value).isValid(), "Select the event date and time")
    .refine(
      (value) => (value ? moment(value).isAfter(moment()) : false),
      "Event date and time must be in the future"
    ),
  // Carried, not validated (the app has no step-1 validation on either — see
  // create_event_one.dart:452-497; both were already payload fields on the web).
  attendanceType: z.string().optional(),
  location: z.string().optional(),
});

function buildInitialDateTime(defaultValues) {
  const combined = defaultValues.date && defaultValues.time
    ? moment(`${defaultValues.date} ${defaultValues.time}`, [
        "YYYY-MM-DD HH:mm",
        "YYYY-MM-DD HH:mm:ss",
      ])
    : null;

  return combined?.isValid() ? combined : null;
}

function getDefaultTimezoneId(timeZones, existingTimezone) {
  if (existingTimezone) {
    const byId = timeZones.find(
      (timezone) => String(timezone.id) === String(existingTimezone)
    );
    if (byId?.id) {
      return String(byId.id);
    }

    const byName = timeZones.find(
      (timezone) => String(timezone.name) === String(existingTimezone)
    );
    if (byName?.id) {
      return String(byName.id);
    }
  }

  const lagos = timeZones.find((timezone) => timezone.name === "Africa/Lagos");
  if (lagos?.id) {
    return String(lagos.id);
  }

  return timeZones[0]?.id ? String(timeZones[0].id) : "";
}

// create_event_one.dart:738-818 — _AttendanceSelector
const ATTENDANCE_OPTIONS = [
  { value: "online", label: "Online", icon: Globe },
  { value: "physical", label: "Physical", icon: MapPin },
  { value: "both", label: "Both", icon: MonitorSmartphone },
];

function AttendanceSelector({ value, onChange }) {
  return (
    <div className="tw:w-full">
      <span className="tw:mb-2 tw:block tw:text-[13px] tw:font-semibold tw:text-body">
        Attendance type
      </span>
      <div className="tw:flex tw:gap-2">
        {ATTENDANCE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[12px] tw:border tw:py-2.5 tw:text-[13px] tw:font-semibold tw:transition ${
                selected
                  ? "tw:border-[1.5px] tw:border-accent tw:bg-accent-soft tw:text-accent-deep"
                  : "tw:border-hairline tw:bg-inner tw:text-muted"
              }`}
            >
              <Icon className="tw:size-4 tw:shrink-0" aria-hidden="true" />
              <span className="tw:truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EventInformationStep({
  defaultValues = {},
  /* Preview-only (import.meta.env.DEV): seeds the timezone list so the DEV
     preview page does not fire an unauthenticated request. */
  previewTimeZones = null,
  onNext,
  posterImages,
  setPosterImages,
  existingPoster,
  setExistingPoster,
}) {
  const { user, token } = useAuth();
  const [timeZones, setTimeZones] = useState([]);
  const [mediaError, setMediaError] = useState("");

  const initialLocation = defaultValues.location || "Online";

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues.title || "",
      description: defaultValues.description || "",
      location: initialLocation,
      organizer:
        defaultValues.organizer ||
        user?.name ||
        user?.fullName ||
        user?.lastName ||
        "",
      genre: defaultValues.genre || "",
      timezone: defaultValues.timezone || "",
      attendanceType: defaultValues.attendanceType || "online",
      dateTime: buildInitialDateTime(defaultValues),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const attendanceType = watch("attendanceType") || "online";

  const isOnlineOnly = attendanceType === "online";

  useEffect(() => {
    // create_event_one.dart:54-59 — an online event pins location to "Online".
    if (isOnlineOnly) {
      setValue("location", "Online", { shouldValidate: false });
    } else if ((watch("location") || "").trim() === "Online") {
      setValue("location", "", { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceType, setValue]);

  useEffect(() => {
    const totalPosterCount =
      (posterImages?.length || 0) +
      (existingPoster?.length || 0);

    if (totalPosterCount > 0 && mediaError) {
      setMediaError("");
    }
  }, [existingPoster, mediaError, posterImages]);

  useEffect(() => {
    if (previewTimeZones) {
      setTimeZones(previewTimeZones);
      return undefined;
    }

    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/v1/time-zone", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = res?.data?.timeZones || res?.data?.data || [];
        if (!mounted) return;

        const normalized = Array.isArray(list) ? list : [];
        setTimeZones(normalized);
        const defaultTimezoneId = getDefaultTimezoneId(
          normalized,
          defaultValues.timezone
        );
        if (defaultTimezoneId) {
          setValue("timezone", defaultTimezoneId, {
            shouldValidate: false,
          });
        }
      } catch {
        showError("Error fetching timezones");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [defaultValues.timezone, previewTimeZones, setValue, token]);

  const timeZoneOptions = useMemo(
    () =>
      timeZones.map((tz) => ({
        value: String(tz.id || tz.value || tz.name || ""),
        label: `${tz.name || tz.label || ""}${
          tz.gmt_offset ? ` (GMT ${tz.gmt_offset})` : ""
        }`,
      })),
    [timeZones]
  );

  const onSubmit = (values) => {
    const totalPosterCount =
      (posterImages?.length || 0) +
      (existingPoster?.length || 0);

    if (totalPosterCount === 0) {
      setMediaError("Add at least one event poster image.");
      return;
    }

    const dateTime = moment(values.dateTime);
    const timezone = getDefaultTimezoneId(
      timeZones,
      values.timezone || defaultValues.timezone
    );
    if (!timezone) {
      showError("Timezone setup is not ready yet. Please wait a moment.");
      return;
    }

    const timezoneLabel =
      timeZoneOptions.find((option) => option.value === String(timezone))
        ?.label || "";

    const location =
      values.attendanceType === "online"
        ? "Online"
        : String(values.location || "").trim();

    onNext({
      ...values,
      location,
      attendanceType: values.attendanceType || "online",
      organizer:
        values.organizer ||
        defaultValues.organizer ||
        user?.name ||
        user?.fullName ||
        user?.lastName ||
        "",
      genre: defaultValues.genre || "",
      timezone,
      timezone_label: timezoneLabel,
      date: dateTime.format("YYYY-MM-DD"),
      time: dateTime.format("HH:mm"),
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      {/* create_event_one.dart:387-607 — one EventSurfaceGroup holding the media
          strip, the basics, then the "Date & Time" block. */}
      <form onSubmit={handleSubmit(onSubmit)} className="tw:pb-0">
        <EventSurfaceGroup>
          <div className="tw:mb-4">
            <PosterMediaFields
              posterImages={posterImages}
              setPosterImages={setPosterImages}
              existingPoster={existingPoster}
              setExistingPoster={setExistingPoster}
              error={mediaError}
            />
          </div>

          <Field
            label="Event Title"
            className="tw:mb-4"
          >
            <div className="tw:relative">
              <Tag
                className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:size-[18px] tw:-translate-y-1/2 tw:text-muted"
                aria-hidden="true"
              />
              <input
                {...register("title")}
                placeholder="Enter event title"
                className={`${errors.title ? APP_INPUT_ERROR : APP_INPUT} tw:pl-10`}
              />
            </div>
            {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
          </Field>

          <Field label="Description" className="tw:mb-5">
            <div className="tw:relative">
              <TextAlignLeft
                className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-3.5 tw:size-[18px] tw:text-muted"
                aria-hidden="true"
              />
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Describe your event in detail"
                className={`${errors.description ? APP_INPUT_ERROR : APP_INPUT} tw:pl-10`}
              />
            </div>
            {errors.description ? (
              <FieldError>{errors.description.message}</FieldError>
            ) : null}
          </Field>

          {/* create_event_one.dart:437-447 — "Date & Time" section heading (15 w800) */}
          <span className="tw:mb-3 tw:block tw:text-[15px] tw:font-extrabold tw:text-body">
            Date &amp; Time
          </span>

          <AttendanceSelector
            value={attendanceType}
            onChange={(value) => setValue("attendanceType", value, { shouldValidate: false })}
          />

          {/* create_event_one.dart:473-481 — Location only when not a pure online event */}
          {!isOnlineOnly ? (
            <div className={isOnlineOnly ? "" : "tw:mt-2.5"}>
              <Field label="Location">
                <input
                  {...register("location")}
                  placeholder="Venue or address"
                  className={APP_INPUT}
                />
              </Field>
            </div>
          ) : null}

          <div className="tw:mt-2.5">
            <Field label="Date and time">
              <div className="tw:relative">
                <Controller
                  name="dateTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      disablePast
                      ampm
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.dateTime,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              backgroundColor: "#E9E9EC",
                              fontSize: 15,
                              paddingRight: "38px",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(17, 19, 22, 0.10)",
                            },
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                              { borderColor: "#16909C", borderWidth: "1.5px" },
                          },
                        },
                      }}
                    />
                  )}
                />
                <Calendar
                  className="tw:pointer-events-none tw:absolute tw:right-3 tw:top-1/2 tw:size-[18px] tw:-translate-y-1/2 tw:text-muted"
                  aria-hidden="true"
                />
              </div>
              {errors.dateTime ? <FieldError>{errors.dateTime.message}</FieldError> : null}
            </Field>
          </div>

          <div className="tw:mt-2.5">
            <EventSelect
              label="Time zone"
              value={watch("timezone")}
              onChange={(value) => setValue("timezone", value, { shouldValidate: false })}
              options={timeZoneOptions}
              placeholder="Select time zone"
            />
            {/* create_event_one.dart:582-601 — tz hint row */}
            <p className="tw:mt-2 tw:flex tw:items-start tw:gap-2 tw:text-[12px] tw:font-medium tw:text-muted">
              <Globe className="tw:mt-px tw:size-[18px] tw:shrink-0" aria-hidden="true" />
              <span>We align tickets and reminders to this time zone.</span>
            </p>
          </div>
        </EventSurfaceGroup>

        {/*
          Hidden carriers — keep the existing payload shape untouched
          (EventCreationWizard.jsx buildEventPayload reads info.organizer / genre).
        */}
        <input type="hidden" {...register("organizer")} />
        <input type="hidden" {...register("genre")} />

        <StepCtaBar>
          <StepCtaButton disabled={!isValid}>
            Save &amp; continue
            <ArrowRight className="tw:size-[18px]" aria-hidden="true" />
          </StepCtaButton>
        </StepCtaBar>
      </form>
    </LocalizationProvider>
  );
}
