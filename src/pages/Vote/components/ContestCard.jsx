import { Link } from "react-router-dom";
import { Button, Card, Chip } from "../../../component/ui";
import { formatCount } from "../../../utils/countFormat";
import { resolveMediaUrl } from "../../../utils/media";

/**
 * A contest on the vote home.
 *
 * Mirrors the app's card language: flat surface, hairline border, cover media,
 * one accent element (the Vote button), metadata in muted ink.
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

  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function money(amount, currency = "NGN") {
  const value = Number(amount || 0);
  const symbol = currency === "NGN" ? "₦" : `${currency} `;

  return `${symbol}${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export default function ContestCard({ contest }) {
  const cover = coverUrl(contest.cover_media);
  const closing = timeLeft(contest.voting?.closes_at);

  return (
    <Card className="tw:overflow-hidden tw:p-0">
      <Link to={`/vote/${contest.slug}`} className="tw:block tw:no-underline tw:text-ink">
        <div className="tw:relative tw:aspect-[16/10] tw:w-full tw:overflow-hidden tw:bg-inner">
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="tw:size-full tw:object-cover"
            />
          ) : (
            <div className="tw:flex tw:size-full tw:items-center tw:justify-center tw:text-[13px] tw:text-muted">
              <span>No cover yet</span>
            </div>
          )}

          {contest.trending ? (
            <span className="tw:absolute tw:left-3 tw:top-3 tw:inline-flex tw:items-center tw:rounded-pill tw:bg-ink tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised">
              Trending
            </span>
          ) : null}

          {closing ? (
            <span className="tw:absolute tw:right-3 tw:top-3 tw:inline-flex tw:items-center tw:rounded-pill tw:bg-paper-raised/92 tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:text-ink">
              {closing}
            </span>
          ) : null}
        </div>

        <div className="tw:p-4">
          <span className="tw:block tw:text-[16px] tw:font-semibold tw:leading-snug tw:text-ink">
            {contest.title}
          </span>

          <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
            {contest.organiser?.name || "Organiser"}
          </span>

          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Chip>{`${formatCount(contest.entry_count || 0)} contestant${contest.entry_count === 1 ? "" : "s"}`}</Chip>
            <Chip>{`${money(contest.vote_price, contest.currency)} per vote`}</Chip>
            {contest.is_refundable ? <Chip>Refundable</Chip> : <Chip>Non-refundable</Chip>}
          </div>
        </div>
      </Link>

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-hairline tw:px-4 tw:py-3">
        <span className="tw:text-[12px] tw:text-muted">
          {contest.entries?.open ? "Entries open" : "Entries closed"}
        </span>
        <Button as={Link} to={`/vote/${contest.slug}`} size="sm" variant="primary">
          Vote
        </Button>
      </div>
    </Card>
  );
}
