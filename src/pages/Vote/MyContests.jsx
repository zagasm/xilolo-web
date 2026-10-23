import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Chip, EmptyState, Skeleton } from "../../component/ui";
import { Trophy } from "lucide-react";
import { listMyContests } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import { HOME_CONTAINER } from "../Home/index.jsx";
import { money, timeLeft } from "./components/ContestCard";

const STATUS_LABEL = {
  draft: "Draft",
  scheduled: "Scheduled",
  entries_open: "Entries open",
  entries_closed: "Entries closed",
  voting_closed: "Voting closed",
  results_published: "Results out",
  paid: "Paid out",
  paused: "Paused",
  cancelled: "Cancelled",
  archived: "Archived",
};

/**
 * My contests — the organiser's list inside the account centre.
 *
 * This is the door to the console: every row carries the numbers an organiser
 * checks first (pending entries, votes, what they've earned) and opens the
 * dashboard for that contest.
 */
export default function MyContests() {
  const { token } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    listMyContests(token)
      .then(({ items }) => {
        if (!cancelled) setContests(items || []);
      })
      .catch(() => {
        if (!cancelled) setError("Your contests could not be loaded right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="tw:w-full tw:bg-paper tw:min-h-screen tw:pb-24 tw:pt-24 tw:font-sans">
      <div className={HOME_CONTAINER}>
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:pb-5">
          <div>
            <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:text-accent-deep">
              Account
            </span>
            <h1 className="tw:m-0! tw:mt-1! tw:text-[24px]! tw:font-[800]! tw:leading-[1.05]! tw:tracking-[-0.02em]! tw:text-ink!">
              My contests
            </h1>
            <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
              Entries, votes and what you have earned — per contest.
            </span>
          </div>

          <Button as={Link} to="/organiser/contests/new" size="sm" className="tw:mt-1 tw:shrink-0">
            New contest
          </Button>
        </div>

        {loading ? (
          <div className="tw:flex tw:flex-col tw:gap-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="tw:h-[104px] tw:w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Trophy} title={error} body="Pull to refresh or try again shortly." />
        ) : contests.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="You have not created a contest yet"
            body="A contest lets you take entries, moderate contestants and sell votes at a price you set."
            action={
              <Button as={Link} to="/organiser/contests/new" size="md">
                Create your first contest
              </Button>
            }
          />
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-3">
            {contests.map((contest) => (
              <Card key={contest.id} className="tw:p-4">
                <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                  <div className="tw:min-w-0">
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                      <span className="tw:truncate tw:text-[15px] tw:font-semibold tw:text-ink">
                        {contest.title}
                      </span>
                      <Chip>{STATUS_LABEL[contest.status] || contest.status}</Chip>
                      {contest.entries?.pending > 0 ? (
                        <Chip active>{`${contest.entries.pending} pending`}</Chip>
                      ) : null}
                    </div>

                    <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted">
                      {[
                        `${contest.entries?.approved ?? 0} approved`,
                        `${money(contest.amount_earned, contest.currency)} earned`,
                        contest.voting_close_at ? `voting ${timeLeft(contest.voting_close_at)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>

                  <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                    <Button
                      as={Link}
                      to={`/account/contests/${contest.id}`}
                      size="sm"
                      variant="secondary"
                    >
                      Open console
                    </Button>
                    <Button as={Link} to={`/vote/${contest.slug}`} size="sm" variant="ghost">
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
