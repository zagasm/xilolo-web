import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button, Chip, Skeleton } from "../../component/ui";
import { formatCount } from "../../utils/countFormat";
import { resolveMediaUrl } from "../../utils/media";
import { getContest, getSharedContest } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import Leaderboard from "./components/Leaderboard";
import VoteSheet from "./components/VoteSheet";
import { money, timeLeft } from "./components/ContestCard";

const TABS = [
  { key: "leaderboard", label: "Leaderboard" },
  { key: "prizes", label: "Prizes" },
  { key: "rules", label: "Rules" },
];

function coverUrl(media) {
  const raw = media?.hero || media?.cover || media?.url || media?.path || null;
  return raw ? resolveMediaUrl(raw) : null;
}

/**
 * Contest page.
 *
 * One component, two doors:
 *   - `sharedToken` present  → a visitor with a link and no account. Read-only,
 *     with a sign-in prompt where the Vote buttons would be.
 *   - otherwise              → signed-in view by slug, voting enabled.
 */
export default function ContestPage({ sharedToken = null }) {
  const { slug } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("leaderboard");
  const [activeEntry, setActiveEntry] = useState(null);

  const isShared = Boolean(sharedToken);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = isShared ? await getSharedContest(sharedToken) : await getContest(slug, token);
      setContest(data);
    } catch (err) {
      setError(err?.response?.status === 404 ? "This contest could not be found." : "Something went wrong loading this contest.");
    } finally {
      setLoading(false);
    }
  }, [isShared, sharedToken, slug, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[900px] tw:px-4 tw:pb-24 tw:pt-24 tw:font-sans">
        <Skeleton className="tw:h-[220px] tw:w-full" />
        <Skeleton className="tw:mt-4 tw:h-8 tw:w-2/3" />
        <Skeleton className="tw:mt-3 tw:h-4 tw:w-1/2" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4 tw:pb-16 tw:pt-28 tw:text-center tw:font-sans">
        <span className="tw:block tw:text-[17px] tw:font-semibold tw:text-ink">{error}</span>
        <Button as={Link} to="/vote" variant="secondary" className="tw:mt-5">
          Back to Vote
        </Button>
      </div>
    );
  }

  const cover = coverUrl(contest.cover_media);
  const entriesClosing = timeLeft(contest.entries_window?.closes_at);
  const votingClosing = timeLeft(contest.voting_window?.closes_at);
  const board = contest.leaderboard ?? { entries: [], counts_visible: false };
  const canVote = Boolean(contest.voting_window?.open) && !isShared;
  const myEntry = contest.my_entry;

  return (
    <div className="tw:mx-auto tw:w-full tw:max-w-[900px] tw:px-4 tw:pb-24 tw:pt-24 tw:font-sans sm:tw:px-6">
      {/* There was no way back to the list once you opened a contest. */}
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/vote"))}
        className="tw:mb-3 tw:-ml-1 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2 tw:py-1 tw:text-[13px] tw:font-medium tw:text-muted tw:transition-colors tw:hover:bg-inner tw:hover:text-ink"
      >
        <ChevronLeft className="tw:size-4" aria-hidden="true" />
        All contests
      </button>

      <div className="tw:relative tw:aspect-[16/9] tw:w-full tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-inner md:tw:aspect-[21/9]">
        {cover ? (
          <img src={cover} alt="" className="tw:size-full tw:object-cover" />
        ) : (
          <div className="tw:flex tw:size-full tw:items-center tw:justify-center tw:text-[13px] tw:text-muted">
            <span>{contest.title}</span>
          </div>
        )}
      </div>

      <header className="tw:mt-5">
        <h1 className="tw:m-0 tw:text-[24px] tw:font-semibold tw:leading-tight tw:text-ink sm:tw:text-[30px]">
          {contest.title}
        </h1>

        <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <Chip>{contest.organiser?.name || "Organiser"}</Chip>
          <Chip>{`${money(contest.vote_price, contest.currency)} per vote`}</Chip>
          <Chip>{contest.is_refundable ? "Refundable" : "Non-refundable"}</Chip>
          {contest.entries_window?.open ? <Chip>Entries open</Chip> : <Chip>Entries closed</Chip>}
        </div>

        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-1">
          <span className="tw:text-[13px] tw:text-muted">
            {entriesClosing ? `Entries close in ${entriesClosing}` : "Entries closed"}
          </span>
          <span className="tw:text-[13px] tw:text-muted">
            {votingClosing ? `Voting closes in ${votingClosing}` : "Voting closed"}
          </span>
          {board.counts_visible && board.total_votes !== null ? (
            <span className="tw:text-[13px] tw:text-muted">
              {formatCount(board.total_votes)} votes cast
            </span>
          ) : null}
        </div>

        {isShared ? (
          <div className="tw:mt-4 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
            <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-ink">
              Sign in to vote
            </span>
            <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
              You can follow this contest without an account, but every vote is cast by a registered
              member.
            </span>
            <Button as={Link} to="/auth/signin" className="tw:mt-3">
              Sign in
            </Button>
          </div>
        ) : myEntry ? (
          <div className="tw:mt-4 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
            <span className="tw:block tw:text-[13px] tw:text-muted">Your entry</span>
            <span className="tw:mt-0.5 tw:block tw:text-[14px] tw:font-semibold tw:text-ink">
              {myEntry.status === "approved"
                ? "Approved — you are in the running"
                : myEntry.status === "pending"
                  ? "Waiting for the organiser to review it"
                  : myEntry.status === "rejected"
                    ? "Not accepted for this contest"
                    : "Disqualified"}
            </span>
            {myEntry.rejection_reason ? (
              <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted">
                Reason: {myEntry.rejection_reason}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <nav className="tw:mt-6 tw:flex tw:gap-2 tw:border-b tw:border-hairline tw:pb-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`tw:rounded-pill tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium tw:transition-colors ${
              tab === item.key
                ? "tw:bg-ink tw:text-paper-raised"
                : "tw:bg-transparent tw:text-muted tw:hover:bg-inner"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="tw:mt-4">
        {tab === "leaderboard" ? (
          <>
            {!board.counts_visible ? (
              <span className="tw:mb-3 tw:block tw:text-[12px] tw:text-muted">
                The organiser has hidden vote counts. Positions and gaps are shown instead.
              </span>
            ) : null}

            <Leaderboard
              board={board}
              canVote={canVote}
              onVote={(entry) => setActiveEntry(entry)}
              emptyBody="Entries approved by the organiser will appear here."
            />
          </>
        ) : null}

        {tab === "prizes" ? (
          <div className="tw:flex tw:flex-col tw:gap-3">
            {contest.prizes?.length ? (
              contest.prizes.map((prize) => (
                <div
                  key={`${prize.rank_from}-${prize.rank_to}`}
                  className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4"
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                    <span className="tw:text-[14px] tw:font-semibold tw:text-ink">
                      {prize.rank_from === prize.rank_to
                        ? `Position ${prize.rank_from}`
                        : `Positions ${prize.rank_from}–${prize.rank_to}`}
                    </span>
                    {prize.amount !== null && prize.amount !== undefined ? (
                      <span className="tw:text-[15px] tw:font-semibold tw:text-ink">
                        {money(prize.amount, contest.currency)}
                      </span>
                    ) : null}
                  </div>
                  <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">{prize.title}</span>
                  {prize.description ? (
                    <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted">
                      {prize.description}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <span className="tw:text-[13px] tw:text-muted">
                {contest.prizes?.length === 0 ? "The organiser has not listed prizes yet." : ""}
              </span>
            )}
          </div>
        ) : null}

        {tab === "rules" ? (
          <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
            <span className="tw:block tw:whitespace-pre-wrap tw:text-[13px] tw:leading-relaxed tw:text-ink">
              {contest.rules || "The organiser has not added rules yet."}
            </span>
            <span className="tw:mt-3 tw:block tw:text-[12px] tw:text-muted">
              You are paying for a vote, not for a chance to win. Winners are decided by the number
              of votes cast, not by chance.
            </span>
          </div>
        ) : null}
      </div>

      {!isShared ? (
        <VoteSheet
          open={Boolean(activeEntry)}
          onClose={() => setActiveEntry(null)}
          contest={contest}
          entry={activeEntry}
          token={token}
          onVoted={load}
        />
      ) : null}
    </div>
  );
}
