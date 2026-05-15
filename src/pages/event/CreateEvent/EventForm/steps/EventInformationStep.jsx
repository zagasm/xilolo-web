import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import moment from "moment";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useAuth } from "../../../../../pages/auth/AuthContext";
import { api } from "../../../../../lib/apiClient";
import { showError } from "../../../../../component/ui/toast";
import PosterMediaFields from "./PosterMediaFields";

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

export default function EventInformationStep({
  defaultValues = {},
  onNext,
  posterImages,
  setPosterImages,
  existingPoster,
  setExistingPoster,
}) {
  const { user, token } = useAuth();
  const [timeZones, setTimeZones] = useState([]);
  const [mediaError, setMediaError] = useState("");

  const locationDefault = defaultValues.location || "Online";

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues.title || "",
      description: defaultValues.description || "",
      location: locationDefault,
      organizer:
        defaultValues.organizer ||
        user?.name ||
        user?.fullName ||
        user?.lastName ||
        "",
      genre: defaultValues.genre || "",
      timezone: defaultValues.timezone || "",
      dateTime: buildInitialDateTime(defaultValues),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    setValue("location", locationDefault, { shouldValidate: false });
  }, [locationDefault, setValue]);

  useEffect(() => {
    const totalPosterCount =
      (posterImages?.length || 0) +
      (existingPoster?.length || 0);

    if (totalPosterCount > 0 && mediaError) {
      setMediaError("");
    }
  }, [existingPoster, mediaError, posterImages]);

  useEffect(() => {
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
  }, [defaultValues.timezone, setValue, token]);

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

    onNext({
      ...values,
      location: locationDefault,
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="tw:rounded-4xl tw:border tw:border-gray-100 tw:bg-[#FFFFFF] tw:p-5 tw:shadow-[0_20px_60px_rgba(15,23,42,0.05)] tw:sm:p-7"
      >
        <div className="tw:mb-6 tw:flex tw:flex-col tw:gap-2">
          <span className="tw:text-lg tw:font-semibold tw:text-slate-900 tw:md:text-2xl">
            Event details
          </span>
          <span className="tw:text-sm tw:text-slate-500">
            Add the core event information and upload the media attendees will
            see first.
          </span>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)]">
          <div className="tw:space-y-5">
            <div>
              <span className="tw:mb-1 tw:block tw:text-[15px]">Event title</span>
              <input
                {...register("title")}
                placeholder="Enter event title"
                className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
              />
              {errors.title && (
                <span className="tw:mt-1 tw:block tw:text-xs tw:text-red-500">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div>
              <span className="tw:mb-1 tw:block tw:text-[15px]">Description</span>
              <textarea
                {...register("description")}
                rows={7}
                placeholder="Describe your event in detail"
                className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
              />
              {errors.description && (
                <span className="tw:mt-1 tw:block tw:text-xs tw:text-red-500">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div>
              <span className="tw:mb-1 tw:block tw:text-[15px]">
                Event date & time
              </span>
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
                        size: "small",
                        error: !!errors.dateTime,
                        helperText: errors.dateTime?.message,
                      },
                    }}
                  />
                )}
              />
            </div>
          </div>

          <input type="hidden" value={locationDefault} {...register("location")} />
          <input type="hidden" {...register("organizer")} />
          <input type="hidden" {...register("genre")} />
          <input type="hidden" {...register("timezone")} />

          <PosterMediaFields
            posterImages={posterImages}
            setPosterImages={setPosterImages}
            existingPoster={existingPoster}
            setExistingPoster={setExistingPoster}
            error={mediaError}
          />
        </div>

        <div className="tw:mt-6 tw:flex tw:justify-end">
          <button
            type="submit"
            disabled={!isValid}
            className="tw:rounded-full tw:bg-primary tw:px-5 tw:py-2.5 tw:text-white hover:tw:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
            style={{ borderRadius: 20 }}
          >
            Continue to ticketing
          </button>
        </div>
      </form>
    </LocalizationProvider>
  );
}
