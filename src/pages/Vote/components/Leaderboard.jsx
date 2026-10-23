import { Button } from "../../../component/ui";
import { formatCount } from "../../../utils/countFormat";

/**
 * The ranked board.
 *
 * Two things come from the server and are never recomputed here: the number
 * (or null when the organiser hid counts) and the gap copy. If this component
 * started deriving gaps from counts, hiding counts would become a client-side
 * promise instead of a server guarantee.
 */
export default function Leaderboard({ board, onVote, canVote = true, emptyBody }) {
  const entries = board?.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-6 tw:text-center">
        <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-ink">
          No contestants yet
        </span>
        <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
          {emptyBody || "Approved entries will appear here."}
        </span>
      </div>
    );
  }

  return (
    <ol className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
      {entries.map((entry) => {
        const isLeader = entry.rank === 1;
        const width = Math.max(2, Math.min(100, Number(entry.progress || 0)));

        return (
          <li
            key={entry.entry_id}
            className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <span
                className={`tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[13px] tw:font-semibold ${
                  isLeader ? "tw:bg-accent tw:text-ink" : "tw:bg-inner tw:text-muted-strong"
                }`}
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="tw:truncate tw:text-[15px] tw:font-semibold tw:text-ink">
                    {entry.display_name}
                    {entry.is_me ? (
                      <span className="tw:ml-2 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
                        You
                      </span>
                    ) : null}
                  </span>

                  {entry.votes !== null && entry.votes !== undefined ? (
                    <span className="tw:shrink-0 tw:text-[13px] tw:font-semibold tw:text-ink">
                      {formatCount(entry.votes)} {entry.votes === 1 ? "vote" : "votes"}
                    </span>
                  ) : null}
                </div>

                <div className="tw:mt-2 tw:h-2 tw:w-full tw:overflow-hidden tw:rounded-pill tw:bg-inner">
                  <div
                    className="tw:h-full tw:rounded-pill tw:bg-accent"
                    style={{ width: `${width}%` }}
                    role="presentation"
                  />
                </div>

                <span className="tw:mt-2 tw:block tw:text-[12px] tw:text-muted">
                  {entry.status_text}
                </span>
              </div>

              {onVote ? (
                <Button
                  type="button"
                  size="sm"
                  variant={isLeader ? "secondary" : "primary"}
                  disabled={!canVote}
                  onClick={() => onVote(entry)}
                  className="tw:shrink-0"
                >
                  Vote
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
