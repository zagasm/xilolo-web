import { Link } from "react-router-dom";
import { formatCount } from "../../../utils/countFormat";
import { resolveMediaUrl } from "../../../utils/media";

/**
 * Contest card.
 *
 * Structure, in order: artwork → title (two lines, fixed height so a row of
 * cards lines up) → organiser → price and time left on one baseline. No chip
 * pile: the card carries three facts a voter decides on, and nothing else.
 */

function coverUrl(media) {
  const raw = media?.card || media?.thumb || media?.cover || media?.url || media?.path || null;
  return raw ? resolveMediaUrl(raw) : null;
}

export function timeLeft(closesAt) {
  if (!closesAt) return null;

  const ms = new Date(closesAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "Closed";

  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h left`;

  return `${Math.floor(hours / 24)}d left`;
}

export function money(amount, currency = "NGN") {
  const value = Number(amount || 0);
  const symbol = currency === "NGN" ? "₦" : `${currency} `;

  return `${symbol}${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export default function ContestCard({ contest }) {
  const cover = coverUrl(contest.cover_media);
  const closing = timeLeft(contest.voting?.closes_at);
  const entrants = Number(contest.entry_count || 0);
  const organiser = contest.organiser?.name || "Organiser";
  const initial = organiser.trim().charAt(0).toUpperCase() || "X";

  return (
    <Link
      to={`/vote/${contest.slug}`}
      className="tw:group tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:text-ink tw:no-underline tw:transition-colors tw:hover:border-accent/50"
    >
      <div className="tw:relative tw:aspect-[4/3] tw:w-full tw:overflow-hidden tw:bg-inner">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="tw:size-full tw:object-cover tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="tw:flex tw:size-full tw:items-center tw:justify-center tw:bg-accent/10">
            <span className="tw:text-[44px] tw:font-[800] tw:leading-none tw:text-accent-deep/35">
              {initial}
            </span>
          </div>
        )}

        {contest.trending ? (
          <span className="tw:absolute tw:left-2.5 tw:top-2.5 tw:rounded-pill tw:bg-ink/92 tw:px-2 tw:py-[3px] tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised">
            Trending
          </span>
        ) : null}

        {contest.entries?.open ? (
          <span className="tw:absolute tw:right-2.5 tw:top-2.5 tw:rounded-pill tw:bg-paper-raised/95 tw:px-2 tw:py-[3px] tw:text-[10px] tw:font-semibold tw:text-accent-deep">
            Entries open
          </span>
        ) : null}
      </div>

      <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:p-3.5">
        <h3 className="tw:m-0 tw:line-clamp-2 tw:min-h-[38px] tw:text-[15px] tw:font-semibold tw:leading-[1.25] tw:text-ink">
          {contest.title}
        </h3>

        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
          <span className="tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent/15 tw:text-[10px] tw:font-bold tw:text-accent-deep">
            {initial}
          </span>
          <span className="tw:truncate tw:text-[12px] tw:text-muted">{organiser}</span>
        </div>

        <div className="tw:mt-auto tw:flex tw:items-end tw:justify-between tw:gap-2 tw:border-t tw:border-hairline tw:pt-2.5">
          <span className="tw:text-[14px] tw:font-semibold tw:leading-none tw:text-ink">
            {money(contest.vote_price, contest.currency)}
            <span className="tw:ml-1 tw:text-[11px] tw:font-medium tw:text-muted">/vote</span>
          </span>
          <span className="tw:text-[11px] tw:leading-none tw:text-muted">
            {closing || `${formatCount(entrants)} in`}
          </span>
        </div>
      </div>
    </Link>
  );
}
