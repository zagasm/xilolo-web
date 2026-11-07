import React from "react";

/**
 * The brand glyph that sits next to a payment method.
 *
 * `mark` comes from the API (payment method metadata); unknown or missing marks fall back to
 * the rail's initial on a neutral tile, so a rail added tomorrow still looks deliberate.
 */
const TILES = {
  paystack: {
    bg: "#011B33",
    render: () => (
      <svg viewBox="0 0 24 24" className="tw:h-5 tw:w-5" aria-hidden="true">
        <rect x="2" y="5" width="20" height="4" rx="1.2" fill="#00C3F7" />
        <rect x="2" y="10.5" width="14" height="4" rx="1.2" fill="#00C3F7" opacity=".72" />
        <rect x="2" y="16" width="9" height="3" rx="1.1" fill="#00C3F7" opacity=".45" />
      </svg>
    ),
  },
  card: {
    bg: "#FFFFFF",
    border: true,
    render: () => (
      <svg viewBox="0 0 24 24" className="tw:h-6 tw:w-6" aria-hidden="true">
        <circle cx="8.6" cy="12" r="6.4" fill="#EB001B" />
        <circle cx="15.4" cy="12" r="6.4" fill="#F79E1B" opacity=".9" />
        <path d="M12 6.9a6.4 6.4 0 0 0 0 10.2 6.4 6.4 0 0 0 0-10.2Z" fill="#FF5F00" />
      </svg>
    ),
  },
  usdt: {
    bg: "#26A17B",
    render: () => (
      <svg viewBox="0 0 24 24" className="tw:h-5 tw:w-5" aria-hidden="true">
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#fff"
          fontFamily="system-ui, sans-serif"
        >
          ₮
        </text>
      </svg>
    ),
  },
};

export default function PaymentMark({ mark, label = "", className = "" }) {
  const tile = TILES[String(mark || "").toLowerCase()];

  if (!tile) {
    const initial = String(label).trim().charAt(0).toUpperCase() || "₦";
    return (
      <span
        className={`tw:inline-flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:bg-chip tw:text-sm tw:font-semibold tw:text-muted-strong ${className}`}
        style={{ borderRadius: 12 }}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={`tw:inline-flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center ${className}`}
      style={{
        borderRadius: 12,
        backgroundColor: tile.bg,
        border: tile.border ? "1px solid rgba(17,19,22,0.10)" : "none",
      }}
      aria-hidden="true"
    >
      {tile.render()}
    </span>
  );
}
