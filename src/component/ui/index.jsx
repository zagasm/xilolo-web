/**
 * Xilolo UI primitives — the web mirror of the app's component language.
 *
 * Every value here comes from DESIGN.md / AppDesignTokens (teal #0EA5B4 accent,
 * Work Sans, radius 12 cards, pill buttons, flat surfaces + hairline borders).
 * Rules that matter:
 *   - `accent` is a FILL. Accent-coloured TEXT uses `accent-deep` (AA on white).
 *   - No shadows except on real overlays. Depth = surface + hairline.
 *   - One accent element per visual group.
 *
 * Tailwind is `tw:` prefixed in this repo — keep the prefix on every class.
 */
import { forwardRef } from "react";

/* ── Button ───────────────────────────────────────────────────────────────── */
const buttonBase =
  "tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:font-semibold " +
  "tw:rounded-pill tw:transition-colors tw:duration-150 tw:select-none " +
  "tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent " +
  "tw:focus-visible:ring-offset-2 tw:disabled:cursor-not-allowed";

const buttonVariants = {
  // accent fill + INK text = 6.27:1 (white on accent is only 2.97:1 — never do it)
  primary:
    "tw:bg-accent tw:text-ink tw:hover:bg-ink tw:hover:text-paper-raised tw:disabled:bg-accent/35",
  secondary:
    "tw:bg-paper-raised tw:text-accent-deep tw:border tw:border-accent/64 tw:hover:bg-accent-soft",
  ghost:
    "tw:bg-transparent tw:text-ink tw:hover:bg-chip tw:border tw:border-hairline",
  danger:
    "tw:bg-danger tw:text-paper-raised tw:hover:bg-ink tw:disabled:bg-danger/35",
};

const buttonSizes = {
  sm: "tw:h-9 tw:px-4 tw:text-sm",
  md: "tw:h-[46px] tw:px-5 tw:text-[15px]",
  lg: "tw:h-[50px] tw:px-6 tw:text-base",
};

export const Button = forwardRef(function Button(
  { as: Tag = "button", variant = "primary", size = "lg", className = "", loading, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={`${buttonBase} ${buttonVariants[variant] ?? buttonVariants.primary} ${
        buttonSizes[size] ?? buttonSizes.lg
      } ${className}`}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </Tag>
  );
});

export function Spinner({ className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`tw:inline-block tw:size-4 tw:animate-spin tw:rounded-full tw:border-2 tw:border-current tw:border-t-transparent ${className}`}
    />
  );
}

/* ── Surfaces ─────────────────────────────────────────────────────────────── */
export function Card({ dark = false, className = "", children, ...rest }) {
  return (
    <div
      className={`tw:rounded-card tw:border tw:p-4 ${
        dark
          ? "tw:bg-ink-raised tw:border-hairline-dark tw:text-paper"
          : "tw:bg-paper-raised tw:border-hairline tw:text-ink"
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Status ───────────────────────────────────────────────────────────────── */
export function LiveBadge({ label = "LIVE", className = "" }) {
  return (
    <span
      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-pill tw:bg-danger tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised ${className}`}
    >
      <span className="tw:relative tw:flex tw:size-1.5">
        <span className="tw:absolute tw:inline-flex tw:size-full tw:animate-ping tw:rounded-full tw:bg-paper-raised/80 tw:motion-reduce:animate-none" />
        <span className="tw:relative tw:inline-flex tw:size-1.5 tw:rounded-full tw:bg-paper-raised" />
      </span>
      {label}
    </span>
  );
}

export function Chip({ icon: Icon, active = false, className = "", children, ...rest }) {
  const Tag = rest.onClick ? "button" : "span";
  return (
    <Tag
      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-pill tw:px-3 tw:py-1.5 tw:text-xs ${
        active
          ? "tw:bg-accent tw:text-ink tw:font-semibold"
          : "tw:bg-chip tw:text-muted-strong"
      } ${rest.onClick ? "tw:transition-colors tw:hover:bg-inner" : ""} ${className}`}
      {...rest}
    >
      {Icon ? <Icon className="tw:size-3.5" aria-hidden="true" /> : null}
      {children}
    </Tag>
  );
}

/* ── Type ─────────────────────────────────────────────────────────────────── */
export function Eyebrow({ className = "", children }) {
  return (
    <p
      className={`tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep ${className}`}
    >
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "left", className = "" }) {
  const centre = align === "center";
  return (
    <div className={`tw:flex tw:flex-col tw:gap-3 ${centre ? "tw:items-center tw:text-center" : ""} ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="tw:font-display tw:text-[clamp(1.5rem,3vw,2rem)] tw:font-extrabold tw:leading-tight tw:tracking-[-0.01em]">
        {title}
      </h2>
      {subtitle ? (
        <p className={`tw:max-w-[62ch] tw:text-sm tw:leading-relaxed tw:text-muted ${centre ? "tw:mx-auto" : ""}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function StatTile({ label, value, delta, dark = false, className = "" }) {
  return (
    <div
      className={`tw:rounded-card tw:border tw:px-4 tw:py-3 ${
        dark ? "tw:border-hairline-dark tw:bg-ink-raised" : "tw:border-hairline tw:bg-paper-raised"
      } ${className}`}
    >
      <p className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
        {label}
      </p>
      <p className={`tw:mt-1 tw:text-xl tw:font-bold ${dark ? "tw:text-paper" : "tw:text-ink"}`}>{value}</p>
      {delta ? <p className="tw:mt-0.5 tw:text-xs tw:text-accent-deep">{delta}</p> : null}
    </div>
  );
}

/* ── Identity ─────────────────────────────────────────────────────────────── */
export function Avatar({ src, alt = "", size = 24, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{ width: size, height: size }}
      className={`tw:shrink-0 tw:rounded-pill tw:object-cover tw:bg-chip ${className}`}
    />
  );
}

export function CreatorRow({ name, avatar, verified = false, meta, className = "" }) {
  return (
    <div className={`tw:flex tw:items-center tw:gap-2 ${className}`}>
      {avatar ? <Avatar src={avatar} alt={name} /> : null}
      <span className="tw:truncate tw:text-sm tw:font-medium">{name}</span>
      {verified ? (
        <svg viewBox="0 0 24 24" className="tw:size-4 tw:shrink-0 tw:fill-accent" aria-label="Verified">
          <path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.4-1.2 2.9 1.2 2.9-2.8 1.4-1 3-3.1-.4L12 22l-2.4-2.1-3.1.4-1-3L2.7 15.9 3.9 13 2.7 10.1l2.8-1.4 1-3 3.1.4L12 2z" />
        </svg>
      ) : null}
      {meta ? <span className="tw:truncate tw:text-xs tw:text-muted">{meta}</span> : null}
    </div>
  );
}

/* ── EventCard — the web mirror of the app's card ─────────────────────────────
   Anatomy, in order and not negotiable: poster → LIVE badge → title → creator → meta → one chip.
   One focal element per card; no shadow, hairline border, radius 12.
   ------------------------------------------------------------------------- */
export function EventCard({
  poster,
  title,
  creator,
  creatorAvatar,
  verified,
  date,
  location,
  price,
  isLive = false,
  onClick,
  className = "",
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`tw:group tw:block tw:w-full tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:text-left tw:transition-colors tw:hover:border-accent/40 ${
        onClick ? "tw:cursor-pointer" : ""
      } ${className}`}
    >
      <div className="tw:relative tw:aspect-video tw:overflow-hidden tw:bg-inner">
        {poster ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="tw:size-full tw:object-cover tw:transition-transform tw:duration-300 tw:group-hover:scale-[1.02]"
          />
        ) : null}
        {isLive ? <LiveBadge className="tw:absolute tw:left-2.5 tw:top-2.5" /> : null}
      </div>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:p-4">
        <h3 className="tw:line-clamp-2 tw:text-base tw:font-semibold tw:leading-snug">{title}</h3>
        {creator ? (
          <CreatorRow name={creator} avatar={creatorAvatar} verified={verified} />
        ) : null}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:pt-1">
          <p className="tw:truncate tw:text-xs tw:text-muted">
            {[date, location].filter(Boolean).join(" · ")}
          </p>
          {price ? <Chip>{price}</Chip> : null}
        </div>
      </div>
    </Tag>
  );
}

/* ── Forms ────────────────────────────────────────────────────────────────── */
export const Input = forwardRef(function Input({ className = "", invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`tw:h-12 tw:w-full tw:rounded-control tw:border tw:bg-paper-raised tw:px-3.5 tw:text-base tw:text-ink tw:placeholder:text-faint tw:outline-none tw:focus:border-accent tw:focus:ring-2 tw:focus:ring-accent/25 ${
        invalid ? "tw:border-danger" : "tw:border-hairline"
      } ${className}`}
      {...rest}
    />
  );
});

export function Field({ label, error, hint, children }) {
  return (
    <label className="tw:flex tw:w-full tw:flex-col tw:gap-1.5">
      {label ? (
        <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
          {label}
        </span>
      ) : null}
      {children}
      {error ? <span className="tw:text-xs tw:text-danger">{error}</span> : null}
      {!error && hint ? <span className="tw:text-xs tw:text-muted">{hint}</span> : null}
    </label>
  );
}

/* ── Loading ──────────────────────────────────────────────────────────────── */
export function Skeleton({ className = "" }) {
  return (
    <span
      className={`tw:relative tw:block tw:overflow-hidden tw:rounded-card tw:bg-inner ${className}`}
    >
      <span className="tw:absolute tw:inset-0 tw:-translate-x-full tw:animate-[shimmer_1.6s_infinite] tw:bg-gradient-to-r tw:from-transparent tw:via-paper-raised/60 tw:to-transparent tw:motion-reduce:animate-none" />
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-12 tw:text-center">
      {Icon ? <Icon className="tw:size-8 tw:text-faint" aria-hidden="true" /> : null}
      <p className="tw:text-base tw:font-semibold">{title}</p>
      {body ? <p className="tw:max-w-[46ch] tw:text-sm tw:text-muted">{body}</p> : null}
      {action}
    </div>
  );
}

/* ── Overlay ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, className = "" }) {
  if (!open) return null;
  return (
    <div className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-end tw:justify-center tw:sm:items-center">
      <div className="tw:absolute tw:inset-0 tw:bg-ink/48" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`tw:relative tw:w-full tw:max-w-md tw:rounded-t-sheet tw:bg-paper-raised tw:p-6 tw:shadow-[0_8px_24px_rgba(17,19,22,0.12)] tw:sm:rounded-sheet ${className}`}
      >
        {title ? <h3 className="tw:mb-3 tw:text-lg tw:font-bold">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
