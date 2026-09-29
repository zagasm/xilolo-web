import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import confetti from "canvas-confetti";
import { useAuth } from "../../../../../pages/auth/AuthContext";
import { api } from "../../../../../lib/apiClient";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { showError } from "../../../../../component/ui/toast";
import { ArrowRight, PlayCircle, Radio } from "lucide-react";
import {
  APP_INPUT,
  APP_INPUT_ERROR,
  Chip,
  ChipGroup,
  EventSelect,
  EventSurface,
  Field,
  FieldError,
  FieldHint,
  OptionCard,
  StepCtaBar,
  StepCtaButton,
  SurfaceTitle,
  SwitchRow,
} from "./EventUI";

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
    subLabel: "Coming later",
    symbol: "$",
    minimum: 3,
    disabled: true,
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
// create_event_three.dart:847-849 — app splits the presets into two groups.
const REPLAY_AFTER_PRESETS = [30, 60, 120, 180];
const REPLAY_FOR_PRESETS = [720, 1440];

const VOD_UPLOAD_PHRASES = [
  "Rolling out the red carpet for your video...",
  "Polishing the spotlight...",
  "Warming up the big screen...",
  "Getting your video ready for its debut...",
  "Setting the stage for your audience...",
  "Packing the good stuff safely...",
  "Your video is making its grand entrance...",
  "Sprinkling a little launch-day magic...",
  "Almost time for the premiere...",
  "Making sure every moment arrives nicely...",
  "Your audience is going to love this...",
  "The show is loading into place...",
  "Putting the final touches on the upload...",
  "Saving your masterpiece...",
  "Keeping things moving behind the curtain...",
  "Your event video is on its way...",
];

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

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatReplayMinutes(minutes) {
  const value = Number(minutes || 0);
  if (!Number.isFinite(value) || value < 60) {
    return `${value} minute${value === 1 ? "" : "s"}`;
  }

  const hours = value / 60;
  if (Number.isInteger(hours)) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${hours.toFixed(1)} hours`;
}

function VideoUploadSuccessModal({ open, fileName, onClose }) {
  useEffect(() => {
    if (!open) return;

    const end = Date.now() + 900;
    const colors = ["#050505", "#10b981", "#f59e0b", "#0ea5e9"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.72 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.72 },
        colors,
      });

      if (Date.now() < end) {
        window.requestAnimationFrame(frame);
      }
    };

    frame();
  }, [open]);

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:bg-black/45" />
        </TransitionChild>

        <div className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:px-4">
          <TransitionChild
            as={Fragment}
            enter="tw:ease-out tw:duration-200"
            enterFrom="tw:opacity-0 tw:scale-95"
            enterTo="tw:opacity-100 tw:scale-100"
            leave="tw:ease-in tw:duration-150"
            leaveFrom="tw:opacity-100 tw:scale-100"
            leaveTo="tw:opacity-0 tw:scale-95"
          >
            <DialogPanel className="tw:relative tw:w-full tw:max-w-md tw:overflow-hidden tw:rounded-[28px] tw:bg-white tw:p-6 tw:text-center tw:shadow-2xl">
              <div className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-3xl tw:text-white tw:shadow-lg">
                ✓
              </div>
              <span className="tw:block tw:mt-5 tw:text-xl tw:font-bold tw:text-slate-950">
                Video uploaded
              </span>
              <span className="tw:block tw:mt-2 tw:text-sm tw:leading-6 tw:text-slate-500">
                {fileName || "Your VOD video"} uploaded successfully. You can continue to the review step.
              </span>
              <button
              style={{ borderRadius: 36, fontSize: 12 }}
                type="button"
                onClick={onClose}
                className="tw:mt-6 tw:inline-flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
              >
                Continue
              </button>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function isBrowserFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

const schema = z
  .object({
    priceInput: z.string().min(1, "Enter a ticket price"),
    maxTickets: z.enum(["limited", "unlimited"]),
    ticketLimit: z.string().optional(),
    currencyCode: z.literal("NGN"),
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

// create_event_three.dart:1783-1858 — _ManualPickerTile
function ManualTile({ title, subtitle, actionLabel, onPick, onClear, accept }) {
  const inputRef = useRef(null);
  return (
    <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:rounded-[12px] tw:border tw:border-hairline tw:bg-inner tw:p-3.5">
      <div className="tw:min-w-0">
        <span className="tw:block tw:text-[14px] tw:font-bold tw:text-body">{title}</span>
        <span className="tw:mt-1 tw:block tw:text-[12px] tw:font-medium tw:text-muted">
          {subtitle}
        </span>
      </div>
      <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="tw:rounded-full tw:border tw:border-accent tw:px-3 tw:py-1.5 tw:text-[12px] tw:font-bold tw:text-accent-deep"
        >
          {actionLabel}
        </button>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="tw:rounded-full tw:border tw:border-hairline tw:px-3 tw:py-1.5 tw:text-[12px] tw:font-semibold tw:text-muted"
          >
            Clear
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="tw:hidden"
          onChange={(event) => onPick?.(event.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

export default function TicketingStep({
  defaultValues = {},
  onBack,
  onNext,
  isUploadingVod = false,
  vodUploadState,
  onCancelVodUpload,
  onVodFileChanged,
}) {
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
  const [uploadPhraseIndex, setUploadPhraseIndex] = useState(0);
  const [showVodSuccessModal, setShowVodSuccessModal] = useState(false);
  const previousVodStatusRef = useRef(vodUploadState?.status || "idle");

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
      currencyCode: "NGN",
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
  const vodUploadMustFinish =
    deliveryType === "vod" &&
    Boolean(vodFile) &&
    vodUploadState?.status !== "complete";
  const uploadProgress = Math.max(0, Math.min(100, Number(vodUploadState?.progress || 0)));
  const uploadPhrase = VOD_UPLOAD_PHRASES[uploadPhraseIndex % VOD_UPLOAD_PHRASES.length];

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
    if (!isUploadingVod) {
      setUploadPhraseIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setUploadPhraseIndex((current) => current + 1);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [isUploadingVod]);

  useEffect(() => {
    const previousStatus = previousVodStatusRef.current;
    const currentStatus = vodUploadState?.status || "idle";

    if (previousStatus !== "complete" && currentStatus === "complete") {
      setShowVodSuccessModal(true);
    }

    previousVodStatusRef.current = currentStatus;
  }, [vodUploadState?.status]);

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
            if (code === "NGN") {
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
    <form onSubmit={handleSubmit(onSubmit)} className="tw:pb-0">
      <VideoUploadSuccessModal
        open={showVodSuccessModal}
        fileName={vodFile?.name}
        onClose={() => setShowVodSuccessModal(false)}
      />

      {/* create_event_three.dart:133-184 — "Event format" surface */}
      <EventSurface title="Event format" className="tw:p-3">
        <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
          <OptionCard
            selected={deliveryType === "live"}
            title="Live Event"
            subtitle="Realtime stream setup"
            icon={Radio}
            onClick={() => setValue("deliveryType", "live", { shouldValidate: true })}
          />
          <OptionCard
            selected={deliveryType === "vod"}
            title="Video On Demand"
            subtitle="Upload before review"
            icon={PlayCircle}
            onClick={() => setValue("deliveryType", "vod", { shouldValidate: true })}
          />
        </div>

        {deliveryType === "vod" ? (
          <div className="tw:mt-3.5">
            <SurfaceTitle>Upload Video</SurfaceTitle>
            <button
              type="button"
              onClick={() => vodInputRef.current?.click()}
              className="tw:mt-3 tw:flex tw:min-h-[104px] tw:w-full tw:flex-col tw:justify-center tw:rounded-[12px] tw:border tw:border-dashed tw:border-hairline tw:px-4 tw:py-3 tw:text-left tw:transition tw:hover:border-accent"
            >
              <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-body">
                {vodFile?.name || "Choose VOD video"}
              </span>
              <span className="tw:mt-1 tw:block tw:text-[12px] tw:font-medium tw:text-muted">
                Bunny Stream supports up to 72 hours and 2160p source videos.
              </span>
            </button>
            <input
              ref={vodInputRef}
              type="file"
              accept="video/*"
              className="tw:hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setVodFile(file);
                setVodError("");
                onVodFileChanged?.(file);
              }}
            />
            <FieldError>{vodError}</FieldError>
            {vodUploadState?.status && vodUploadState.status !== "idle" ? (
              <div className="tw:mt-3.5 tw:rounded-[12px] tw:border tw:border-hairline tw:p-3.5">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div className="tw:min-w-0">
                    <div className="tw:text-[14px] tw:font-bold tw:text-body">
                      {vodUploadState.message || "Preparing upload..."}
                    </div>
                    <div className="tw:mt-1 tw:text-[12px] tw:font-medium tw:text-muted">
                      {vodUploadState.status === "complete"
                        ? "You can continue to the review step."
                        : uploadPhrase}
                    </div>
                    <div className="tw:mt-2 tw:text-[12px] tw:font-semibold tw:text-body">
                      {formatBytes(vodUploadState.loaded)} / {formatBytes(vodUploadState.total || vodFile?.size)}
                      <span className="tw:ml-2 tw:text-muted">{uploadProgress}%</span>
                    </div>
                  </div>
                  {isUploadingVod ? (
                    <button
                      type="button"
                      onClick={onCancelVodUpload}
                      className="tw:shrink-0 tw:rounded-full tw:border tw:border-danger tw:px-3 tw:py-1.5 tw:text-[12px] tw:font-semibold tw:text-danger"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                <div className="tw:mt-3 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-inner">
                  <div
                    className="tw:h-full tw:rounded-full tw:bg-accent tw:transition-all tw:duration-300 tw:ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="tw:mt-3 tw:text-[12px] tw:font-semibold tw:text-muted">
            Live events continue through the standard publishing flow.
          </p>
        )}
      </EventSurface>

      {/* create_event_three.dart:186-300 — price + maximum tickets row */}
      <EventSurface>
        <div className="tw:grid tw:grid-cols-2 tw:gap-3.5">
          <Field label="Ticket Price" error={errors.priceInput?.message}>
            <div className="tw:relative">
              <span className="tw:pointer-events-none tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-[15px] tw:text-muted">
                {selectedCurrency.symbol}
              </span>
              <Controller
                name="priceInput"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(event) => {
                      const normalized = normalizeAmountInput(event.target.value);
                      field.onChange(normalized ? formatAmountDisplay(normalized) : "");
                    }}
                    className={`${errors.priceInput ? APP_INPUT_ERROR : APP_INPUT} tw:pl-9`}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </Field>

          <EventSelect
            label="Maximum Tickets"
            value={maxTickets === "limited" ? "Limited" : "Unlimited"}
            onChange={(value) =>
              setValue("maxTickets", value === "Limited" ? "limited" : "unlimited", {
                shouldValidate: true,
              })
            }
            options={[
              { value: "Unlimited", label: "Unlimited" },
              { value: "Limited", label: "Limited" },
            ]}
            placeholder="Select Limit"
          />
        </div>

        {maxTickets === "limited" ? (
          <div className="tw:mt-3">
            <Field
              label="Ticket Limit"
              error={errors.ticketLimit?.message}
            >
              <input
                type="number"
                min="1"
                {...register("ticketLimit")}
                placeholder="Enter number of tickets available"
                className={errors.ticketLimit ? APP_INPUT_ERROR : APP_INPUT}
              />
            </Field>
          </div>
        ) : null}
      </EventSurface>

      {/* create_event_three.dart:301-332 — currency */}
      <EventSurface>
        <EventSelect
          label="Currency"
          value={selectedCurrencyCode}
          onChange={(value) => setValue("currencyCode", value, { shouldValidate: true })}
          options={DISPLAY_CURRENCIES}
          error={errors?.currencyCode?.message}
        />
        <FieldHint>
          Currency locks your payouts and ticket display. Choose what your audience expects.
        </FieldHint>
      </EventSurface>

      {/* create_event_three.dart:333-359 — replay */}
      <EventSurface>
        <SwitchRow
          title="Make Replay Available"
          checked={enableReplay}
          onChange={(next) => setValue("enableReplay", next, { shouldValidate: true })}
        />
        {enableReplay ? (
          <div className="tw:mt-3">
            <ChipGroup title="Available after" subtitle="Unlocks after the event ends.">
              {REPLAY_AFTER_PRESETS.map((minutes) => (
                <Chip
                  key={`after-${minutes}`}
                  label={formatReplayMinutes(minutes)}
                  selected={String(watch("replayAvailableAfterMinutes")) === String(minutes)}
                  onClick={() =>
                    setValue("replayAvailableAfterMinutes", String(minutes), {
                      shouldValidate: true,
                    })
                  }
                />
              ))}
            </ChipGroup>
            <ChipGroup title="Available for" subtitle="Stays online before deletion.">
              {REPLAY_FOR_PRESETS.map((minutes) => (
                <Chip
                  key={`for-${minutes}`}
                  label={formatReplayMinutes(minutes)}
                  selected={String(watch("replayAvailableForMinutes")) === String(minutes)}
                  onClick={() =>
                    setValue("replayAvailableForMinutes", String(minutes), {
                      shouldValidate: true,
                    })
                  }
                />
              ))}
            </ChipGroup>
            <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
              <Field label="Available after (minutes)" error={errors.replayAvailableAfterMinutes?.message}>
                <input
                  type="number"
                  min="1"
                  {...register("replayAvailableAfterMinutes")}
                  className={errors.replayAvailableAfterMinutes ? APP_INPUT_ERROR : APP_INPUT}
                />
              </Field>
              <Field label="Available for (minutes)" error={errors.replayAvailableForMinutes?.message}>
                <input
                  type="number"
                  min="1"
                  {...register("replayAvailableForMinutes")}
                  className={errors.replayAvailableForMinutes ? APP_INPUT_ERROR : APP_INPUT}
                />
              </Field>
            </div>
          </div>
        ) : null}
      </EventSurface>

      {/* create_event_three.dart:360-476 — paid soft-copy manual */}
      <EventSurface>
        <SwitchRow
          title="Attach a paid soft-copy manual to this event."
          checked={hasMaterials}
          onChange={(next) => setValue("hasMaterials", next, { shouldValidate: true })}
        />

        {hasMaterials ? (
          <div className="tw:mt-3">
            <ManualTile
              title="Manual File"
              subtitle={
                fileLabel(manualFile) ||
                existingManual?.fileName ||
                "PDF, DOC, XLS, CSV, TXT, PPT and similar formats"
              }
              actionLabel={manualFile ? "Change" : "Select file"}
              onClear={manualFile ? () => setManualFile(null) : null}
              accept={MANUAL_FILE_ACCEPT}
              onPick={(file) => {
                setManualFile(file);
                clearManualError("manualFile");
              }}
            />
            <FieldError>{manualErrors.manualFile}</FieldError>

            <div className="tw:mt-3">
              <ManualTile
                title="Manual Cover"
                subtitle={
                  fileLabel(manualCover) ||
                  existingManualCover?.fileName ||
                  "Optional cover image for the manual"
                }
                actionLabel={manualCover ? "Change" : "Select image"}
                onClear={manualCover ? () => setManualCover(null) : null}
                accept={MANUAL_COVER_ACCEPT}
                onPick={(file) => {
                  setManualCover(file);
                  clearManualError("manualCover");
                }}
              />
              <FieldError>{manualErrors.manualCover}</FieldError>
            </div>

            {manualCoverPreview || existingManualCover?.url ? (
              <div className="tw:mt-3 tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-hairline">
                <img
                  src={manualCoverPreview || existingManualCover?.url}
                  alt="Material cover preview"
                  className="tw:h-full tw:max-h-40 tw:w-full tw:object-cover"
                />
              </div>
            ) : null}

            <div className="tw:mt-3">
              <Field
                label="Manual Price"
                error={manualErrors.manualPrice || errors.manualPriceInput?.message}
              >
                <Controller
                  name="manualPriceInput"
                  control={control}
                  render={({ field }) => (
                    <div className="tw:relative">
                      <span className="tw:pointer-events-none tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-[15px] tw:text-muted">
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
                        className={`${
                          manualErrors.manualPrice || errors.manualPriceInput
                            ? APP_INPUT_ERROR
                            : APP_INPUT
                        } tw:pl-9`}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </Field>
            </div>
          </div>
        ) : null}
      </EventSurface>

      {/*
        Visibility + content safety now live on the Review & Publish screen
        (preview_screen.dart:367-424 and :426-488). These hidden fields keep the
        step_2 payload keys (visibility / matureContent / attendanceType, the last
        one owned by step 1) flowing exactly as before.
      */}
      <input type="hidden" {...register("attendanceType")} />
      <input type="hidden" {...register("visibility")} />
      <input type="hidden" {...register("matureContent")} />

      <StepCtaBar>
        <StepCtaButton disabled={isUploadingVod || vodUploadMustFinish}>
          {isUploadingVod || vodUploadMustFinish ? "Uploading video..." : "Review & Publish"}
          <ArrowRight className="tw:size-[18px]" aria-hidden="true" />
        </StepCtaButton>
      </StepCtaBar>
    </form>
  );
}
