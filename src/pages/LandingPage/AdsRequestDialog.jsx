import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarToday,
  Email,
  Language,
  Person,
  Phone,
  PhotoLibrary,
} from "@mui/icons-material";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import toast from "react-hot-toast";
import { api } from "../../lib/apiClient";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function isValidDateTimeLocal(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function makeSchema() {
  return yup.object({
    package_id: yup
      .string()
      .uuid("Invalid package ID")
      .required("Package is required"),

    media_type: yup
      .string()
      .oneOf(["image", "video"], "Choose image or video")
      .required("Pick a media type"),

    media_file: yup
      .mixed()
      .required("Please upload an image or video")
      .test("fileSize", "Max file size is 2MB", (file) => {
        if (!file) return false;
        return file.size <= MAX_FILE_BYTES;
      })
      .test("fileType", "Unsupported file type", function (file) {
        if (!file) return false;
        const mediaType = this.parent.media_type;
        if (mediaType === "image") return file.type?.startsWith("image/");
        if (mediaType === "video") return file.type?.startsWith("video/");
        return false;
      }),

    start_at: yup
      .string()
      .required("Start date is required")
      .test("validStart", "Invalid start date", (v) => isValidDateTimeLocal(v)),

    end_at: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test("validEnd", "Invalid end date", (v) => {
        if (!v) return true;
        return isValidDateTimeLocal(v);
      })
      .test(
        "endAfterStart",
        "End date must be after start date",
        function (end) {
          if (!end) return true;
          const start = this.parent.start_at;
          if (!start) return true;
          const a = new Date(start).getTime();
          const b = new Date(end).getTime();
          if (Number.isNaN(a) || Number.isNaN(b)) return true;
          return b >= a;
        }
      ),

    contact_name: yup.string().required("Name is required").max(120),

    contact_email: yup
      .string()
      .required("Email is required")
      .email("Provide a valid email"),

    contact_phone: yup
      .string()
      .required("Phone is required")
      .min(7, "Phone looks short")
      .max(30),

    company_name: yup.string().nullable().max(120),

    company_website: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .url("Provide a valid website"),
  });
}

const defaultValues = {
  package_id: "",
  media_type: "image",
  media_file: null,
  start_at: "",
  end_at: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  company_name: "",
  company_website: "",
};

function bytesToMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

export default function AdsRequestDialog({ open, onClose, selectedPackage }) {
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => makeSchema(), []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const mediaType = watch("media_type");
  const mediaFile = watch("media_file");

  // create preview URL (and clean it up)
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  useEffect(() => {
    if (selectedPackage) {
      reset({
        ...defaultValues,
        package_id: selectedPackage.id,
        media_type: selectedPackage.media_type || "image",
      });
    } else {
      reset(defaultValues);
    }
  }, [selectedPackage, reset]);

  const accept = mediaType === "video" ? "video/*" : "image/*";

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      // multipart/form-data
      const fd = new FormData();
      fd.append("package_id", values.package_id);
      fd.append("media_type", values.media_type);
      fd.append("start_at", values.start_at);
      if (values.end_at) fd.append("end_at", values.end_at);

      fd.append("contact_name", values.contact_name);
      fd.append("contact_email", values.contact_email);
      fd.append("contact_phone", values.contact_phone);

      if (values.company_name) fd.append("company_name", values.company_name);
      if (values.company_website)
        fd.append("company_website", values.company_website);

      // ✅ binary file field name (change here if backend expects something else)
      fd.append("media_file", values.media_file);

      await api.post("/api/v1/ads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Ad request sent! We'll follow up shortly.");
      onClose?.();
    } catch (error) {
      console.error("Ad request failed", error);
      const message =
        error?.response?.data?.message ||
        "Something went wrong while sending your request.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const headerText = selectedPackage
    ? `Run Ads · ${selectedPackage.name}`
    : "Run Ads";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        variant="span"
        className="tw:font-sans tw:text-slate-900 tw:text-xl tw:font-semibold"
      >
        {headerText}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent className="tw:space-y-6">
          {selectedPackage && (
            <div className="tw:rounded-3xl tw:border tw:border-primary/20 tw:bg-primary/5 tw:p-4 tw:text-sm tw:text-slate-700">
              <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-3">
                <div className="tw:space-y-1">
                  <Typography
                    variant="span"
                    className="tw:block tw:text-sm tw:font-semibold"
                  >
                    {selectedPackage.description}
                  </Typography>
                  <div className="tw:text-xs tw:text-slate-600">
                    Placement: {selectedPackage.placement || "—"} · Media:{" "}
                    {selectedPackage.media_type || "—"}
                  </div>
                </div>
                <div className="tw:rounded-2xl tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:text-slate-600 tw:border tw:border-slate-200">
                  {selectedPackage.duration_days
                    ? `${selectedPackage.duration_days} days`
                    : "Custom"}
                </div>
              </div>
            </div>
          )}

          <input type="hidden" {...register("package_id")} />

          {/* Media type + Upload */}
          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <TextField
              {...register("media_type")}
              select
              label="Media type"
              fullWidth
              error={Boolean(errors.media_type)}
              helperText={errors.media_type?.message}
            >
              <MenuItem value="image">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <PhotoLibrary fontSize="small" />
                  Image
                </div>
              </MenuItem>
              <MenuItem value="video">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <PhotoLibrary fontSize="small" />
                  Video
                </div>
              </MenuItem>
            </TextField>

            <Controller
              name="media_file"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900 tw:mb-2">
                    Upload {mediaType === "video" ? "video" : "image"} (max 2MB)
                  </label>

                  <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
                    <div className="tw:flex tw:flex-col tw:gap-3">
                      <input
                        type="file"
                        accept={accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          field.onChange(file);
                        }}
                      />

                      <div className="tw:text-xs tw:text-slate-500">
                        Allowed:{" "}
                        {mediaType === "video"
                          ? "MP4/MOV/WEBM…"
                          : "JPG/PNG/WEBP…"}{" "}
                        · Max size 2MB
                      </div>

                      {errors.media_file?.message && (
                        <div className="tw:text-xs tw:text-red-600">
                          {errors.media_file?.message}
                        </div>
                      )}

                      {field.value && (
                        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-2xl tw:bg-slate-50 tw:border tw:border-slate-200 tw:px-3 tw:py-2">
                          <div className="tw:min-w-0">
                            <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:truncate">
                              {field.value.name}
                            </div>
                            <div className="tw:text-xs tw:text-slate-600">
                              {bytesToMb(field.value.size)}MB ·{" "}
                              {field.value.type}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:px-3 tw:py-2 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:hover:bg-slate-50"
                            onClick={() => field.onChange(null)}
                            disabled={submitting}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="tw:rounded-4xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
              <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:mb-3">
                Preview
              </div>

              {mediaType === "video" ? (
                <video
                  src={previewUrl}
                  controls
                  className="tw:w-full tw:rounded-3xl tw:border tw:border-slate-200"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="tw:w-full tw:max-h-[360px] tw:object-cover tw:rounded-3xl tw:border tw:border-slate-200"
                />
              )}
            </div>
          )}

          {/* Dates */}
          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <TextField
              {...register("start_at")}
              label="Campaign starts"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={Boolean(errors.start_at)}
              helperText={errors.start_at?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register("end_at")}
              label="Campaign ends (optional)"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={Boolean(errors.end_at)}
              helperText={errors.end_at?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          {/* Contact */}
          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <TextField
              {...register("contact_name")}
              label="Contact name"
              fullWidth
              error={Boolean(errors.contact_name)}
              helperText={errors.contact_name?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register("contact_email")}
              label="Contact email"
              fullWidth
              error={Boolean(errors.contact_email)}
              helperText={errors.contact_email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <TextField
              {...register("contact_phone")}
              label="Contact phone"
              fullWidth
              error={Boolean(errors.contact_phone)}
              helperText={errors.contact_phone?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register("company_name")}
              label="Company / Brand (optional)"
              fullWidth
              error={Boolean(errors.company_name)}
              helperText={errors.company_name?.message}
            />
          </div>

          <TextField
            {...register("company_website")}
            label="Company website (optional)"
            placeholder="https://"
            fullWidth
            error={Boolean(errors.company_website)}
            helperText={errors.company_website?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Language />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions className="tw:px-6 tw:pb-6 tw:pt-0">
          <button
          style={{
            borderRadius: 12,
            fontSize: 12
          }}
            type="button"
            onClick={onClose}
            className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3 tw:text-slate-700 tw:hover:bg-slate-50"
            disabled={submitting}
          >
            Cancel
          </button>

          <button
          style={{
            borderRadius: 12,
            fontSize: 12
          }}
            type="submit"
            className="tw:rounded-2xl tw:bg-primary tw:px-5 tw:py-3 tw:text-white tw:font-semibold tw:shadow-[0_16px_40px_rgba(99,102,241,0.20)] tw:hover:brightness-95 active:tw:scale-[0.99]"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send request"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
