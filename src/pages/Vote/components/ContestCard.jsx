import { Link } from "react-router-dom";
import { Card, Chip, CreatorRow, LiveBadge } from "../../../component/ui";
import { formatCount } from "../../../utils/countFormat";
import { resolveMediaUrl } from "../../../utils/media";

/**
 * A contest on the vote home.
 *
 * Deliberately the same anatomy as the event card the rest of the product uses
 * (EventCard in component/ui): poster → badge → title → creator → one meta line
 * → one chip. One focal element, hairline border, no shadow. A contest should
 * feel like something Xilolo made, not like a generic card grid.
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

  return (
    <Link
      to={`/vote/${contest.slug}`}
      className="tw:group tw:block tw:h-full tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:text-ink tw:no-underline tw:transition-colors tw:hover:border-accent/40"
    >
      <div className="tw:relative tw:aspect-video tw:overflow-hidden tw:bg-inner">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="tw:size-full tw:object-cover tw:transition-transform tw:duration-300 tw:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="tw:flex tw:size-full tw:items-center tw:justify-center tw:px-6 tw:text-center">
            <span className="tw:text-[13px] tw:text-muted">{contest.title}</span>
          </div>
        )}

        {contest.trending ? (
          <span className="tw:absolute tw:left-2.5 tw:top-2.5 tw:inline-flex tw:items-center tw:rounded-pill tw:bg-ink tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised">
            Trending
          </span>
        ) : contest.entries?.open ? (
          <LiveBadge label="Entries open" className="tw:absolute tw:left-2.5 tw:top-2.5 tw:bg-accent tw:text-ink" />
        ) : null}
      </div>

      <div className="tw:flex tw:h-[calc(100%-0px)] tw:flex-col tw:gap-2 tw:p-4">
        <h3 className="tw:m-0 tw:line-clamp-2 tw:text-base tw:font-semibold tw:leading-snug tw:text-ink">
          {contest.title}
        </h3>

        <CreatorRow name={contest.organiser?.name || "Organiser"} />

        <div className="tw:mt-auto tw:flex tw:items-center tw:justify-between tw:gap-3 tw:pt-1">
          <span className="tw:truncate tw:text-xs tw:text-muted">
            {[
              `${formatCount(entrants)} contestant${entrants === 1 ? "" : "s"}`,
              closing,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <Chip>{`${money(contest.vote_price, contest.currency)}/vote`}</Chip>
        </div>
      </div>
    </Link>
  );
}
