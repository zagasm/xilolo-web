import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../../pages/auth/AuthContext";
import { api } from "../../../../../lib/apiClient";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { showError } from "../../../../../component/ui/toast";
import SelectField from "../../../../../component/form/SelectField";

const DISPLAY_CURRENCIES = [
  {
    value: "NGN",
    label: "Nigerian Naira",
    subLabel: "Minimum ticket price: N3,000",
    symbol: "N",
    minimum: 3000,
  },
  {
    value: "USD",
    label: "US Dollar",
    subLabel: "Minimum ticket price: $3",
    symbol: "$",
    minimum: 3,
  },
];

const MANUAL_PRICE_MINIMUMS = {
  NGN: 100,
  USD: 1,
};

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const REPLAY_MINUTE_PRESETS = [30, 60, 120, 180, 720, 1440];

const MANUAL_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "ppt",
  "pptx",
  "rtf",
  "odt",
  "ods",
];

const MANUAL_FILE_ACCEPT = MANUAL_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");
const MANUAL_COVER_ACCEPT = "image/*";

function normalizeAmountInput(rawValue) {
  const raw = String(rawValue || "");
  const stripped = raw.replace(/,/g, "").replace(/[^\d.]/g, "");

  if (!stripped) return "";

  const firstDotIndex = stripped.indexOf(".");
  if (firstDotIndex === -1) {
    return stripped.replace(/^0+(?=\d)/, "");
  }

  const integerPart = stripped.slice(0, firstDotIndex).replace(/^0+(?=\d)/, "");
  const decimalPart = stripped.slice(firstDotIndex + 1).replace(/\./g, "").slice(0, 2);

  return `${integerPart || "0"}.${decimalPart}`;
}

function formatAmountDisplay(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const normalized = normalizeAmountInput(value);
  if (!normalized) return "";

  const [integerPart, decimalPart] = normalized.split(".");
  const formattedInteger = Number(integerPart || 0).toLocaleString("en-NG");
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

function parseAmount(value) {
  const cleaned = String(value || "").replace(/,/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function findCurrencyByCode(currencies, code) {
  return currencies.find((currency) => {
    const normalizedCode = String(currency?.code || "").toUpperCase();
    const normalizedSymbol = String(currency?.symbol || "").toUpperCase();
    const normalizedName = String(currency?.name || "").toUpperCase();

    return (
      normalizedCode === code ||
      normalizedSymbol === code ||
      normalizedName.includes(code)
    );
  });
}

function getFileExtension(fileName = "") {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function isManualFileAllowed(file) {
  if (!file?.name) return false;
  return MANUAL_FILE_EXTENSIONS.includes(getFileExtension(file.name));
}

function fileLabel(file) {
  return file?.name || "";
}

function isBrowserFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

const schema = z
  .object({
    priceInput: z.string().min(1, "Enter a ticket price"),
    maxTickets: z.enum(["limited", "unlimited"]),
    ticketLimit: z.string().optional(),
    currencyCode: z.enum(["NGN", "USD"]),
    deliveryType: z.enum(["live", "vod"]),
    visibility: z.enum(["public", "private"]),
    attendanceType: z.enum(["online", "physical", "both"]),
    hasMaterials: z.boolean(),
    enableReplay: z.boolean(),
    replayAvailableAfterMinutes: z.string().optional(),
    replayAvailableForMinutes: z.string().optional(),
    matureContent: z.boolean(),
    manualPriceInput: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const selectedCurrency = DISPLAY_CURRENCIES.find(
      (currency) => currency.value === values.currencyCode
    );
    const price = parseAmount(values.priceInput);

    if (price === null || price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceInput"],
        message: "Enter a valid ticket price",
      });
    } else if (selectedCurrency && price < selectedCurrency.minimum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceInput"],
        message: `Minimum ticket price for ${selectedCurrency.label} is ${selectedCurrency.symbol}${selectedCurrency.minimum.toLocaleString(
          "en-NG"
        )}`,
      });
    }

    if (values.maxTickets === "limited") {
      const parsedLimit = Number(values.ticketLimit || "");
      if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ticketLimit"],
          message: "Ticket limit must be at least 1",
        });
      }
    }

    const manualPrice = parseAmount(values.manualPriceInput);
    if (values.manualPriceInput && (manualPrice === null || manualPrice <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualPriceInput"],
        message: "Enter a valid material price",
      });
    } else if (values.manualPriceInput && selectedCurrency) {
      const minimumManualPrice =
        MANUAL_PRICE_MINIMUMS[selectedCurrency.value] ?? 1;

      if (manualPrice !== null && manualPrice < minimumManualPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manualPriceInput"],
          message: `Minimum material price for ${selectedCurrency.label} is ${selectedCurrency.symbol}${minimumManualPrice.toLocaleString(
            "en-NG"
          )}`,
        });
      }
    }

    if (values.enableReplay) {
      const replayAvailableAfterMinutes = Number(
        values.replayAvailableAfterMinutes || ""
      );
      const replayAvailableForMinutes = Number(
        values.replayAvailableForMinutes || ""
      );

      if (
        !Number.isFinite(replayAvailableAfterMinutes) ||
        replayAvailableAfterMinutes < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["replayAvailableAfterMinutes"],
          message: "Choose when the replay should unlock.",
        });
      }

      if (
        !Number.isFinite(replayAvailableForMinutes) ||
        replayAvailableForMinutes < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["replayAvailableForMinutes"],
          message: "Choose how long the replay should stay available.",
        });
      }
    }
  });

export default function TicketingStep({ defaultValues = {}, onBack, onNext }) {
  const { token } = useAuth();
  const vodInputRef = useRef(null);
  const [currencies, setCurrencies] = useState([]);
  const [manualFile, setManualFile] = useState(() =>
    isBrowserFile(defaultValues.manualFile) ? defaultValues.manualFile : null
  );
  const [manualCover, setManualCover] = useState(() =>
    isBrowserFile(defaultValues.manualCover) ? defaultValues.manualCover : null
  );
  const [manualErrors, setManualErrors] = useState({});
  const [vodFile, setVodFile] = useState(() =>
    isBrowserFile(defaultValues.vodFile) ? defaultValues.vodFile : null
  );
  const [vodError, setVodError] = useState("");

  const existingManual = defaultValues.existingManual || null;
  const existingManualCover = defaultValues.existingManualCover || null;
  const hasExistingMaterial = Boolean(
    existingManual?.fileName ||
    existingManual?.name ||
    existingManualCover?.url ||
    Number(defaultValues.manualPrice || 0) > 0
  );

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      priceInput: formatAmountDisplay(defaultValues.price ?? 0) || "0",
      maxTickets: defaultValues.maxTickets || "unlimited",
      ticketLimit:
        defaultValues.ticketLimit !== undefined && defaultValues.ticketLimit !== null
          ? String(defaultValues.ticketLimit)
          : "",
      currencyCode: defaultValues.currencyCode === "USD" ? "USD" : "NGN",
      deliveryType: defaultValues.deliveryType || "live",
      visibility: defaultValues.visibility || "public",
      attendanceType: defaultValues.attendanceType || "online",
      hasMaterials:
        typeof defaultValues.hasMaterials === "boolean"
          ? defaultValues.hasMaterials
          : hasExistingMaterial,
      enableReplay:
        typeof defaultValues.enableReplay === "boolean"
          ? defaultValues.enableReplay
          : false,
      replayAvailableAfterMinutes: String(
        defaultValues.replayAvailableAfterMinutes || 120
      ),
      replayAvailableForMinutes: String(
        defaultValues.replayAvailableForMinutes || 1440
      ),
      matureContent: !!defaultValues.matureContent,
      manualPriceInput:
        defaultValues.manualPrice !== undefined && defaultValues.manualPrice !== null
          ? formatAmountDisplay(defaultValues.manualPrice)
          : "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedCurrencyCode = watch("currencyCode");
  const deliveryType = watch("deliveryType");
  const maxTickets = watch("maxTickets");
  const visibility = watch("visibility");
  const attendanceType = watch("attendanceType");
  const hasMaterials = watch("hasMaterials");
  const enableReplay = watch("enableReplay");
  const selectedCurrency = useMemo(
    () =>
      DISPLAY_CURRENCIES.find((currency) => currency.value === selectedCurrencyCode) ||
      DISPLAY_CURRENCIES[0],
    [selectedCurrencyCode]
  );

  const manualCoverPreview = useMemo(() => {
    if (!manualCover) return "";
    return URL.createObjectURL(manualCover);
  }, [manualCover]);

  useEffect(() => {
    return () => {
      if (manualCoverPreview) {
        URL.revokeObjectURL(manualCoverPreview);
      }
    };
  }, [manualCoverPreview]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/v1/currency", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = res?.data?.currencies || res?.data?.data || [];
        if (!mounted) return;

        const normalized = Array.isArray(list) ? list : [];
        setCurrencies(normalized);

        if (!defaultValues.currencyCode && defaultValues.currency) {
          const matchedById = normalized.find(
            (currency) => String(currency.id) === String(defaultValues.currency)
          );
          if (matchedById?.code) {
            const code = String(matchedById.code).toUpperCase();
            if (code === "NGN" || code === "USD") {
              setValue("currencyCode", code, { shouldValidate: true });
            }
          }
        }
      } catch {
        showError("Failed to load currencies");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [defaultValues.currency, defaultValues.currencyCode, setValue, token]);

  const clearManualError = (key) => {
    setManualErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = (values) => {
    const matchedCurrency = findCurrencyByCode(currencies, values.currencyCode);
    if (!matchedCurrency?.id) {
      showError("Currency setup is not ready yet. Please try again.");
      return;
    }

    if (!values.hasMaterials) {
      if (values.deliveryType === "vod" && !vodFile) {
        setVodError("Choose the VOD video before continuing.");
        return;
      }

      setManualErrors({});
      onNext({
        price: parseAmount(values.priceInput) ?? 0,
        maxTickets: values.maxTickets,
        ticketLimit:
          values.maxTickets === "limited" ? Number(values.ticketLimit || 0) : undefined,
        currency: String(matchedCurrency.id),
        currencyCode: values.currencyCode,
        deliveryType: values.deliveryType,
        vodFile: values.deliveryType === "vod" ? vodFile : null,
        visibility: values.visibility,
        attendanceType: values.attendanceType,
        hasMaterials: false,
        enableReplay: values.enableReplay,
        replayAvailableAfterMinutes: Number(
          values.replayAvailableAfterMinutes || 120
        ),
        replayAvailableForMinutes: Number(
          values.replayAvailableForMinutes || 1440
        ),
        matureContent: values.matureContent,
        manualPrice: 0,
        manualFile: null,
        manualCover: null,
        existingManual: null,
        existingManualCover: null,
      });
      return;
    }

    const nextManualErrors = {};
    if (values.deliveryType === "vod" && !vodFile) {
      setVodError("Choose the VOD video before continuing.");
    }
    const manualPrice = parseAmount(values.manualPriceInput);
    const hasExistingManual = Boolean(existingManual?.fileName || existingManual?.name);
    const hasManualSource = Boolean(manualFile || hasExistingManual);

    if (manualFile && !isManualFileAllowed(manualFile)) {
      nextManualErrors.manualFile = `Unsupported material format. Use: ${MANUAL_FILE_EXTENSIONS.join(
        ", "
      )}.`;
    }

    if (manualCover && !String(manualCover.type || "").startsWith("image/")) {
      nextManualErrors.manualCover = "Material cover must be an image file.";
    }

    if (manualPrice !== null && !hasManualSource) {
      nextManualErrors.manualFile = "Upload the material file before setting a material price.";
    }

    if (manualCover && !hasManualSource) {
      nextManualErrors.manualFile = "Upload the material file before adding a cover.";
    }

    const minimumManualPrice =
      MANUAL_PRICE_MINIMUMS[values.currencyCode] ?? 1;

    if (manualFile && (manualPrice === null || manualPrice <= 0)) {
      nextManualErrors.manualPrice = "Material price is required when a material file is uploaded.";
    } else if (manualFile && manualPrice < minimumManualPrice) {
      nextManualErrors.manualPrice = `Minimum material price is ${selectedCurrency.symbol}${minimumManualPrice.toLocaleString(
        "en-NG"
      )}.`;
    }

    setManualErrors(nextManualErrors);
    if (Object.keys(nextManualErrors).length > 0 || (values.deliveryType === "vod" && !vodFile)) {
      return;
    }

    onNext({
      price: parseAmount(values.priceInput) ?? 0,
      maxTickets: values.maxTickets,
      ticketLimit: values.maxTickets === "limited" ? Number(values.ticketLimit || 0) : undefined,
      currency: String(matchedCurrency.id),
      currencyCode: values.currencyCode,
      deliveryType: values.deliveryType,
      vodFile: values.deliveryType === "vod" ? vodFile : null,
      visibility: values.visibility,
      attendanceType: values.attendanceType,
      hasMaterials: true,
      enableReplay: values.enableReplay,
      replayAvailableAfterMinutes: Number(
        values.replayAvailableAfterMinutes || 120
      ),
      replayAvailableForMinutes: Number(
        values.replayAvailableForMinutes || 1440
      ),
      matureContent: values.matureContent,
      manualPrice: manualPrice ?? 0,
      manualFile,
      manualCover,
      existingManual,
      existingManualCover,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="tw:rounded-4xl tw:border tw:border-gray-100 tw:bg-[#ffffff] tw:p-5 tw:shadow-[0_20px_60px_rgba(15,23,42,0.05)] tw:sm:p-7"
    >
      <div className="tw:mb-6 tw:flex tw:flex-col tw:gap-2">
        <span className="tw:text-lg tw:font-semibold tw:text-slate-900 tw:lg:text-2xl">
          Ticketing
        </span>
        <span className="tw:text-sm tw:text-slate-500">
          Set pricing, ticket availability, and optional material access.
        </span>
      </div>

      <div className="tw:space-y-5">
        <SelectField
          label="Event format"
          value={deliveryType}
          onChange={(value) => {
            setValue("deliveryType", value, { shouldValidate: true });
            if (value !== "vod") {
              setVodError("");
            }
          }}
          options={[
            { value: "live", label: "Live event" },
            { value: "vod", label: "Video on demand" },
          ]}
          error={errors?.deliveryType?.message}
        />

        {deliveryType === "vod" && (
          <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4">
            <div className="tw:text-[15px] tw:font-medium tw:text-slate-900">
              Upload Video
            </div>
            {/* <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
              The video uploads directly to Bunny Stream after the event is created.
            </div> */}
            <button
              style={{ borderRadius: 36 }}
              type="button"
              onClick={() => vodInputRef.current?.click()}
              className="tw:mt-4 tw:flex tw:min-h-[104px] tw:w-full tw:flex-col tw:justify-center tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:px-4 tw:py-3 tw:text-left hover:tw:border-primary/40"
            >
              <span className="tw:block tw:text-sm tw:font-medium tw:text-slate-700">
                {vodFile?.name || "Choose VOD video"}
              </span>
              <span className="tw:mt-1 tw:block tw:text-xs tw:text-slate-500">
                Bunny Stream supports up to 72 hours and 2160p source videos.
              </span>
            </button>
            <input
              ref={vodInputRef}
              type="file"
              accept="video/*"
              className="tw:sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setVodFile(file);
                setVodError("");
              }}
            />
            {vodError ? (
              <span className="tw:mt-2 tw:text-xs tw:text-red-500">{vodError}</span>
            ) : null}
          </div>
        )}

        <SelectField
          label="Event location"
          value={attendanceType}
          onChange={(value) => setValue("attendanceType", value, { shouldValidate: true })}
          options={[
            { value: "online", label: "Online" },
            { value: "physical", label: "Physical" },
            { value: "both", label: "Both online and physical" },
          ]}
          error={errors?.attendanceType?.message}
        />

        <SelectField
          label="Currency"
          value={selectedCurrencyCode}
          onChange={(value) => setValue("currencyCode", value, { shouldValidate: true })}
          options={DISPLAY_CURRENCIES}
          error={errors?.currencyCode?.message}
        />

        <div>
          <label className="tw:mb-1 tw:block tw:text-[15px]">Ticket price</label>
          <Controller
            name="priceInput"
            control={control}
            render={({ field }) => (
              <div className="tw:relative">
                <span className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-slate-500">
                  {selectedCurrency.symbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={field.value}
                  onChange={(event) => {
                    const normalized = normalizeAmountInput(event.target.value);
                    field.onChange(normalized ? formatAmountDisplay(normalized) : "");
                  }}
                  className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-9 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
                  placeholder={`Enter ticket price in ${selectedCurrency.label}`}
                />
              </div>
            )}
          />
          {errors.priceInput && (
            <p className="tw:mt-1 tw:text-xs tw:text-red-500">{errors.priceInput.message}</p>
          )}
        </div>

        <SelectField
          label="Ticket availability"
          value={maxTickets}
          onChange={(value) => setValue("maxTickets", value, { shouldValidate: true })}
          options={[
            { value: "unlimited", label: "Unlimited tickets" },
            { value: "limited", label: "Limited tickets" },
          ]}
          error={errors?.maxTickets?.message}
        />

        {maxTickets === "limited" && (
          <div>
            <label className="tw:mb-1 tw:block tw:text-[15px]">Total number of tickets</label>
            <input
              type="number"
              min="1"
              {...register("ticketLimit")}
              className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
            />
            {errors.ticketLimit && (
              <p className="tw:mt-1 tw:text-xs tw:text-red-500">{errors.ticketLimit.message}</p>
            )}
          </div>
        )}

        <SelectField
          label="Event visibility"
          value={visibility}
          onChange={(value) => setValue("visibility", value, { shouldValidate: true })}
          options={VISIBILITY_OPTIONS}
          error={errors?.visibility?.message}
        />

        <div className="tw:flex tw:items-center tw:justify-between tw:py-3">
          <label className="tw:text-[15px]">This event has materials</label>
          <input
            type="checkbox"
            {...register("hasMaterials")}
            className="tw:h-4 tw:w-4 tw:accent-primary"
          />
        </div>

        {hasMaterials && (
          <div className=" ">
            <div className="tw:flex tw:flex-col tw:gap-1">
              <div className="tw:text-[15px] tw:font-medium tw:text-slate-900">
                Event material
              </div>
              <div className="tw:text-sm tw:text-slate-500">
                Attach an optional paid soft-copy material buyers can purchase with or after the
                ticket.
              </div>
            </div>

            <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2">
              <div>
                <label className="tw:mb-1 tw:block tw:text-[15px]">Material file</label>
                <label className="tw:flex tw:min-h-[104px] tw:cursor-pointer tw:flex-col tw:justify-center tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-[#ffffff] tw:px-4 tw:py-3 hover:tw:border-primary/40">
                  <span className="tw:text-sm tw:font-medium tw:text-slate-700">
                    {fileLabel(manualFile) || existingManual?.fileName || "Choose document"}
                  </span>
                  <span className="tw:block tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-500">
                    Accepted: {MANUAL_FILE_EXTENSIONS.join(", ")}
                  </span>
                  <input
                    type="file"
                    accept={MANUAL_FILE_ACCEPT}
                    className="tw:hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setManualFile(file);
                      clearManualError("manualFile");
                    }}
                  />
                </label>
                {manualErrors.manualFile && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-500">{manualErrors.manualFile}</p>
                )}
              </div>

              <div>
                <label className="tw:mb-1 tw:block tw:text-[15px]">Material cover</label>
                <label className="tw:flex tw:min-h-[104px] tw:cursor-pointer tw:flex-col tw:justify-center tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-[#ffffff] tw:px-4 tw:py-3 hover:tw:border-primary/40">
                  <span className="tw:text-sm tw:font-medium tw:text-slate-700">
                    {fileLabel(manualCover) || existingManualCover?.fileName || "Choose cover image"}
                  </span>
                  <span className="tw:block tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-500">
                    Optional image shown before purchase and download.
                  </span>
                  <input
                    type="file"
                    accept={MANUAL_COVER_ACCEPT}
                    className="tw:hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setManualCover(file);
                      clearManualError("manualCover");
                    }}
                  />
                </label>
                {manualErrors.manualCover && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-500">{manualErrors.manualCover}</p>
                )}
              </div>
            </div>

            <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <label className="tw:mb-1 tw:block tw:text-[15px]">Material price</label>
                <Controller
                  name="manualPriceInput"
                  control={control}
                  render={({ field }) => (
                    <div className="tw:relative">
                      <span className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-slate-500">
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={field.value || ""}
                        onChange={(event) => {
                          const normalized = normalizeAmountInput(event.target.value);
                          field.onChange(normalized ? formatAmountDisplay(normalized) : "");
                          clearManualError("manualPrice");
                        }}
                        className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-9 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
                        placeholder="Set material price"
                      />
                    </div>
                  )}
                />
                {(manualErrors.manualPrice || errors.manualPriceInput?.message) && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-500">
                    {manualErrors.manualPrice || errors.manualPriceInput?.message}
                  </p>
                )}
              </div>

              {(manualCoverPreview || existingManualCover?.url) && (
                <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white">
                  <img
                    src={manualCoverPreview || existingManualCover?.url}
                    alt="Material cover preview"
                    className="tw:h-full tw:max-h-40 tw:w-full tw:object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="tw:flex tw:items-center tw:justify-between tw:py-3">
          <label className="tw:text-[15px]">Enable event replay</label>
          <input
            type="checkbox"
            {...register("enableReplay")}
            className="tw:h-4 tw:w-4 tw:accent-primary"
          />
        </div>

        {enableReplay && (
          <div className="tw:space-y-5 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-slate-50/80 tw:p-4">
            <div>
              <div className="tw:text-[15px] tw:font-medium tw:text-slate-900">
                Replay becomes available after
              </div>
              <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                Choose when the replay should unlock after the event ends.
              </div>
              <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2">
                {REPLAY_MINUTE_PRESETS.map((minutes) => (
                  <button
                    key={`after-${minutes}`}
                    type="button"
                    onClick={() =>
                      setValue("replayAvailableAfterMinutes", String(minutes), {
                        shouldValidate: true,
                      })
                    }
                    className={`tw:rounded-full tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition ${String(watch("replayAvailableAfterMinutes")) === String(minutes)
                        ? "tw:bg-slate-900 tw:text-white"
                        : "tw:bg-white tw:text-slate-700 tw:ring-1 tw:ring-slate-200 hover:tw:bg-slate-100"
                      }`}
                  >
                    {minutes} minutes
                  </button>
                ))}
              </div>
              <div className="tw:mt-3">
                <input
                  type="number"
                  min="1"
                  {...register("replayAvailableAfterMinutes")}
                  className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
                  placeholder="Minutes after the event ends"
                />
                {errors.replayAvailableAfterMinutes && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-500">
                    {errors.replayAvailableAfterMinutes.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="tw:text-[15px] tw:font-medium tw:text-slate-900">
                Replay stays available for
              </div>
              <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                Choose how long the replay should stay online before automatic deletion.
              </div>
              <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2">
                {REPLAY_MINUTE_PRESETS.map((minutes) => (
                  <button
                    key={`for-${minutes}`}
                    type="button"
                    onClick={() =>
                      setValue("replayAvailableForMinutes", String(minutes), {
                        shouldValidate: true,
                      })
                    }
                    className={`tw:rounded-full tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition ${String(watch("replayAvailableForMinutes")) === String(minutes)
                        ? "tw:bg-slate-900 tw:text-white"
                        : "tw:bg-white tw:text-slate-700 tw:ring-1 tw:ring-slate-200 hover:tw:bg-slate-100"
                      }`}
                  >
                    {minutes} minutes
                  </button>
                ))}
              </div>
              <div className="tw:mt-3">
                <input
                  type="number"
                  min="1"
                  {...register("replayAvailableForMinutes")}
                  className="tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:px-3 tw:py-2.5 tw:text-[15px] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary"
                  placeholder="Minutes replay stays online"
                />
                {errors.replayAvailableForMinutes && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-500">
                    {errors.replayAvailableForMinutes.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="tw:flex tw:items-center tw:justify-between tw:py-3">
          <label className="tw:text-[15px]">This event contains mature content</label>
          <input
            type="checkbox"
            {...register("matureContent")}
            className="tw:h-4 tw:w-4 tw:accent-primary"
          />
        </div>
      </div>

      <div className="tw:mt-6 tw:flex tw:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="tw:rounded-full tw:border tw:border-gray-200 tw:px-4 tw:py-2.5 hover:tw:bg-gray-50"
          style={{ borderRadius: 20 }}
        >
          Back
        </button>
        <button
          type="submit"
          className="tw:rounded-full tw:bg-primary tw:px-5 tw:py-2.5 tw:text-white hover:tw:bg-primarySecond"
          style={{ borderRadius: 20 }}
        >
          Continue to preview
        </button>
      </div>
    </form>
  );
}
