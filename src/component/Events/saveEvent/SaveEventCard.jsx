import React from "react";
import { Play } from "lucide-react";
import heart_icon from "../../../assets/navbar_icons/heart_icon.png";

const FALLBACK_IMG = "/images/event-dummy.jpg";
const FALLBACK_AVATAR = "https://placehold.co/50x50?text=No+Image";

function fmtDateTime(dateStr, timeStr) {
  if (!dateStr) return "Date not available";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()))
    return timeStr ? `${dateStr} • ${timeStr}` : dateStr;

  const day = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!timeStr) return day;

  const [hm, maybePeriod] = timeStr.split(" ");
  let [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  const isPM = (maybePeriod || "").toLowerCase().includes("pm");
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;
  const hh = String(h).padStart(2, "0");
  const mm = String(m ?? 0).padStart(2, "0");
  return `${day} • ${hh}:${mm}`;
}

function getCtaConfig(status, hasPaid, priceLabel) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "live") {
    return {
      label: "Join Live",
      variant: "live",
      disabled: false,
    };
  }

  if (
    normalized === "ended" ||
    normalized === "completed" ||
    normalized === "past"
  ) {
    return {
      label: "Ended",
      variant: "ended",
      disabled: true,
    };
  }

  // default / upcoming
  return {
    label: hasPaid ? "View Ticket" : `Buy Ticket (${priceLabel})`,
    variant: "upcoming",
    disabled: false,
  };
}

export default function SavedEventCard({
  event,
  onToggleSave,
  onPrimaryAction,
  onOpenDetails,
}) {
  const {
    id,
    title,
    image,
    hostImage,
    hostName,
    priceLabel,
    status,
    hasPaid,
    liveViewers,
    eventDate,
    startTime,
  } = event;

  const isLive = (status || "").toLowerCase() === "live";
  const { label, variant, disabled } = getCtaConfig(
    status,
    hasPaid,
    priceLabel
  );

  const liveViewersLabel =
    typeof liveViewers === "number" && liveViewers > 0
      ? `${liveViewers.toLocaleString()} viewers`
      : "Live now";

  return (
    <div className="tw:bg-white tw:rounded-2xl tw:p-3 tw:flex tw:flex-col tw:h-full tw:shadow-[0_12px_30px_rgba(15,23,42,0.10)] tw:border tw:border-gray-100">
      {/* Poster + heart */}
      <div
        className="tw:relative tw:rounded-lg tw:overflow-hidden tw:cursor-pointer"
        onClick={() => onOpenDetails?.(id)}
      >
        <img
          src={image || FALLBACK_IMG}
          alt={title}
          className="tw:w-full tw:h-[180px] tw:object-cover"
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.dataset.fallback) {
              e.currentTarget.src = FALLBACK_IMG;
              e.currentTarget.dataset.fallback = "1";
            }
          }}
        />

        {/* live badge */}
        {isLive && (
          <div className="tw:absolute tw:left-3 tw:bottom-3 tw:px-3 tw:py-1.5 tw:bg-white tw:rounded-full tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:font-medium tw:shadow-[0_6px_20px_rgba(15,23,42,0.20)]">
            <span className="tw:inline-flex tw:w-2.5 tw:h-2.5 tw:bg-[#22C55E] tw:rounded-full" />
            <span className="tw:text-gray-900">{liveViewersLabel}</span>
          </div>
        )}

        {/* heart */}
        <button
          style={{
            borderRadius: "50%",
          }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(id);
          }}
          className="tw:absolute tw:right-3 tw:top-3 tw:size-9 tw:rounded-full! tw:bg-black/40 tw:flex tw:items-center tw:justify-center tw:backdrop-blur tw:border tw:border-white/40"
          aria-label="Toggle saved"
        >
          <img src={heart_icon} alt="saved" className="tw:w-5 tw:h-5" />
        </button>
      </div>

      {/* title + price */}
      <div className="tw:flex tw:items-center tw:justify-between tw:mt-3 tw:gap-2">
        <span
          className="tw:text-[15px] tw:font-semibold tw:text-gray-900 tw:truncate tw:max-w-[65%]"
          title={title}
        >
          {title}
        </span>
        <span className="tw:text-[15px] tw:font-semibold tw:text-gray-900">
          {priceLabel}
        </span>
      </div>

      {/* host pill */}
      <div className="tw:mt-2">
        <div className="tw:inline-flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 tw:bg-lightPurple tw:rounded-lg tw:max-w-full">
          <img
            src={hostImage || FALLBACK_AVATAR}
            alt={hostName}
            className="tw:w-7 tw:h-7 tw:rounded-full tw:object-cover"
            onError={(e) => {
              if (!e.currentTarget.dataset.fallback) {
                e.currentTarget.src = FALLBACK_AVATAR;
                e.currentTarget.dataset.fallback = "1";
              }
            }}
          />
          <span
            className="tw:text-[12px] tw:font-medium tw:text-gray-900 tw:truncate"
            title={hostName}
          >
            {hostName}
          </span>
        </div>
      </div>

      {/* date */}
      <p className="tw:mt-3 tw:text-[12px] tw:text-gray-500">
        {fmtDateTime(eventDate, startTime)}
      </p>

      {/* CTA */}
      <button
        style={{
          borderRadius: 8,
        }}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) onPrimaryAction?.(event);
        }}
        className={[
          "tw:mt-3 tw:w-full tw:h-12 tw:rounded-[18px]! tw:text-[14px] tw:font-semibold tw:flex tw:items-center tw:justify-center tw:gap-2 tw:transition tw:duration-150",
          variant === "upcoming" &&
            "tw:bg-primary tw:text-white tw:hover:opacity-90",
          variant === "live" &&
            "tw:bg-[#FF3B30] tw:text-white tw:hover:brightness-110",
          variant === "ended" &&
            "tw:bg-gray-300 tw:text-gray-600 tw:cursor-not-allowed",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {variant === "live" && <Play className="tw:w-4 tw:h-4" />}
        {label}
      </button>
    </div>
  );
}
