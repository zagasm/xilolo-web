import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Gavel, Lock, Trophy, TrendingUp } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  Modal,
  Skeleton,
} from "../../component/ui";
import { showError, showSuccess } from "../../component/ui/toast";
import {
  approveEntry,
  bulkApproveEntries,
  closeContestEntries,
  closeContestVoting,
  declineEntry,
  disqualifyBelow,
  disqualifyEntry,
  extendVoting,
  getContestDashboard,
  getContestVoteTrend,
  getOrganiserEntries,
  publishContest,
} from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import { HOME_CONTAINER } from "../Home/index.jsx";
import { money, timeLeft } from "./components/ContestCard";
import DeleteContestSheet from "./components/DeleteContestSheet";
import { friendlyError } from "../../lib/errors";

function Stat({ label, value, hint }) {
  return (
    <Card className="tw:p-4">
      <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.08em] tw:text-muted">
        {label}
      </span>
      <span className="tw:mt-1 tw:block tw:text-[22px] tw:font-semibold tw:leading-tight tw:text-ink">
        {value}
      </span>
      {hint ? <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted">{hint}</span> : null}
    </Card>
  );
}

/**
 * Contest console.
 *
 * One screen for the things an organiser actually does while a contest runs:
 * read the numbers, clear the pending queue, and move the voting deadline.
 *
 * Decline is deliberately heavier than approve — a written reason plus the
 * account password (or a TOTP code when 2FA is on), because that decision gets
 * screenshotted and appealed.
 */
export default function ContestConsole() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [pending, setPending] = useState([]);
  // The queue only ever held PENDING entries, so approving someone removed them
  // from the console along with every control over them (app commit 0d6b072).
  const [approved, setApproved] = useState([]);
  // Who is out, so a removal is never invisible (app commits 184c664 / d866a9c).
  const [disqualified, setDisqualified] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [declining, setDeclining] = useState(null);
  const [declineForm, setDeclineForm] = useState({ reason: "", password: "", code: "" });
  const [busy, setBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cutOpen, setCutOpen] = useState(false);
  const [cutForm, setCutForm] = useState({
    mode: "entry",
    entryId: "",
    value: "",
    reason: "",
    password: "",
    code: "",
  });
  const [disqualifying, setDisqualifying] = useState(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({ voting_close_at: "", reason: "" });

  const load = useCallback(async () => {
    setError(null);

    try {
      // Four independent reads: one slow list must not blank the console, so
      // each auxiliary list degrades to [] on its own.
      const [board, queue, running, out, series] = await Promise.all([
        getContestDashboard(id, token),
        getOrganiserEntries(id, "pending", token),
        getOrganiserEntries(id, "approved", token).catch(() => []),
        getOrganiserEntries(id, "disqualified", token).catch(() => []),
        getContestVoteTrend(id, token, 30).catch(() => []),
      ]);
      setDashboard(board);
      setPending(queue || []);
      setApproved(running || []);
      setDisqualified(out || []);
      setTrend(series || []);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "This contest could not be found."
          : "The console could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const contest = dashboard?.contest;
  const votes = dashboard?.votes;
  const entries = dashboard?.entries;

  const votingLabel = useMemo(() => {
    if (!contest) return "";
    if (!contest.voting_window?.open) return "Voting closed";
    const left = timeLeft(contest.voting_window?.closes_at);
    return left ? `Voting closes in ${left}` : "Voting open";
  }, [contest]);

  /**
   * Ranked, not approval order. A list in approval order answered "who
   * entered", never "who is winning" — the question an organiser opens the
   * console with (app commit 6a49d19).
   */
  const ranked = useMemo(
    () => [...approved].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0)),
    [approved]
  );
  const leaderVotes = ranked.length ? Number(ranked[0].votes || 0) : 0;

  const trendTotals = useMemo(() => {
    const votes = trend.map((row) => Number(row.votes || 0));
    const max = votes.reduce((best, value) => Math.max(best, value), 0);
    const total = votes.reduce((sum, value) => sum + value, 0);
    return { votes, max, total, bestIndex: max > 0 ? votes.indexOf(max) : -1 };
  }, [trend]);

  const approveAll = async () => {
    if (!pending.length) return;
    setBusy(true);
    try {
      const count = await bulkApproveEntries(id, pending.map((entry) => entry.id), token);
      showSuccess(`${count} ${count === 1 ? "entry" : "entries"} approved.`);
      await load();
    } catch (err) {
      showError(friendlyError(err, "Those entries could not be approved."));
    } finally {
      setBusy(false);
    }
  };

  /** Lifecycle: end entries, or end voting. Both are on the page, not in a "…". */
  const runLifecycle = async (action, success) => {
    setBusy(true);
    try {
      await action();
      showSuccess(success);
      await load();
    } catch (err) {
      showError(friendlyError(err, "That change did not go through."));
    } finally {
      setBusy(false);
    }
  };

  const openDisqualify = (entry) => {
    setCutForm({ mode: "entry", entryId: entry.id, value: "", reason: "", password: "", code: "" });
    setCutOpen(true);
  };

  const approve = async (entry) => {
    setBusy(true);
    try {
      await approveEntry(id, entry.id, token);
      showSuccess(`${entry.display_name} is live.`);
      await load();
    } catch (err) {
      showError(friendlyError(err, "That entry could not be approved."));
    } finally {
      setBusy(false);
    }
  };

  const submitDecline = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await declineEntry(
        id,
        declining.id,
        {
          reason: declineForm.reason,
          password: declineForm.password || undefined,
          code: declineForm.code || undefined,
        },
        token
      );
      showSuccess("Entry declined and the contestant has been notified.");
      setDeclining(null);
      setDeclineForm({ reason: "", password: "", code: "" });
      await load();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(friendlyError(err, "That did not go through. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitCut = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      if (cutForm.mode === "entry") {
        await disqualifyEntry(
          id,
          cutForm.entryId,
          {
            reason: cutForm.reason,
            password: cutForm.password || undefined,
            code: cutForm.code || undefined,
          },
          token
        );
        showSuccess("Contestant disqualified and notified.");
      } else {
        const result = await disqualifyBelow(
          id,
          {
            mode: cutForm.mode,
            value: Number(cutForm.value),
            reason: cutForm.reason,
            password: cutForm.password || undefined,
            code: cutForm.code || undefined,
          },
          token
        );

        showSuccess(
          `${result.count} contestant${result.count === 1 ? "" : "s"} disqualified and notified.`
        );
      }

      setCutOpen(false);
      setCutForm({ mode: "rank", value: "", reason: "", password: "", code: "" });
      await load();
    } catch (err) {
      showError(friendlyError(err, "That change did not go through."));
    } finally {
      setBusy(false);
    }
  };

  const submitExtend = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await extendVoting(id, extendForm.voting_close_at, extendForm.reason || null, token);
      showSuccess("Voting deadline moved.");
      setExtendOpen(false);
      setExtendForm({ voting_close_at: "", reason: "" });
      await load();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(friendlyError(err, "That did not go through. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="tw:w-full tw:bg-paper tw:min-h-screen tw:pb-32 tw:pt-24 tw:md:pb-24 tw:font-sans">
        <div className={HOME_CONTAINER}>
          <Skeleton className="tw:h-10 tw:w-1/2" />
          <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-3 tw:md:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="tw:h-[96px] tw:w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="tw:w-full tw:bg-paper tw:min-h-screen tw:pb-32 tw:pt-24 tw:md:pb-24 tw:font-sans">
        <div className={HOME_CONTAINER}>
          <Card className="tw:p-6 tw:text-center">
            <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-ink">{error}</span>
            <Button as={Link} to="/account/contests" variant="secondary" className="tw:mt-4">
              Back to my contests
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="tw:w-full tw:bg-paper tw:min-h-screen tw:pb-32 tw:pt-24 tw:md:pb-24 tw:font-sans">
      <div className={HOME_CONTAINER}>
        <div className="tw:flex tw:flex-col tw:gap-3 tw:pb-5 tw:md:flex-row tw:md:items-start tw:md:justify-between">
          <div className="tw:min-w-0">
            <Link to="/account/contests" className="tw:text-[12px] tw:font-medium tw:text-accent-deep tw:no-underline">
              ← My contests
            </Link>
            <h1 className="tw:m-0! tw:mt-1! tw:text-[24px]! tw:font-[800]! tw:leading-[1.1]! tw:tracking-[-0.02em]! tw:text-ink!">
              {contest.title}
            </h1>
            <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <Chip>{contest.status.replace(/_/g, " ")}</Chip>
              <Chip>{votingLabel}</Chip>
              <Chip>{`${money(contest.vote_price, "NGN")} per vote`}</Chip>
              <Chip>{`Counts: ${contest.vote_visibility}`}</Chip>
            </div>
          </div>

          <div className="tw:flex tw:shrink-0 tw:flex-wrap tw:items-center tw:gap-2">
            {contest.status === "draft" ? (
              <Button
                size="sm"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await publishContest(id, token);
                    showSuccess("Contest is live.");
                    await load();
                  } catch (err) {
                    const errors = err?.response?.data?.errors;
                    showError(
                      (errors ? Object.values(errors)[0]?.[0] : null) || "Could not publish yet."
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Publish
              </Button>
            ) : null}

            <Button size="sm" variant="secondary" onClick={() => setExtendOpen(true)}>
              Extend voting
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCutOpen(true)}>
              Disqualify
            </Button>
            {/* Only shown while the contest has taken no votes — the API refuses
                the request once money is involved. */}
            {dashboard.can_delete ? (
              <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
            <Button as={Link} to={`/vote/${contest.slug}`} size="sm" variant="ghost">
              View page
            </Button>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:md:grid-cols-4">
          <Stat
            label="Earned"
            value={money(dashboard.amount_earned, "NGN")}
            hint="Released after voting closes and prizes are recorded"
          />
          <Stat label="Votes" value={votes?.total ?? 0} hint={`${votes?.last_24h ?? 0} in the last 24h`} />
          <Stat
            label="Contestants"
            value={entries?.approved ?? 0}
            hint={`${entries?.pending ?? 0} waiting for review`}
          />
          <Stat
            label="Entry window"
            value={contest.entries_window?.open ? "Open" : "Closed"}
            hint={contest.entries_window?.closes_at ? `until ${new Date(contest.entries_window.closes_at).toLocaleDateString()}` : undefined}
          />
        </div>

        {/* Who is leading, and by how much. The first question an organiser
            opens the console with, answered at the top (app commit 6a49d19). */}
        {ranked.length > 0 ? (
          <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:rounded-[14px] tw:border tw:border-accent/25 tw:bg-accent-soft tw:px-[13px] tw:py-[11px]">
            <Trophy className="tw:size-4 tw:shrink-0 tw:text-accent" aria-hidden="true" />
            <span className="tw:min-w-0 tw:text-[12.5px] tw:text-muted-strong!">
              Leading:{" "}
              <span className="tw:font-bold tw:text-ink!">{ranked[0].display_name}</span>
              {ranked.length > 1
                ? ` · ${ranked[0].votes} votes, ${leaderVotes - Number(ranked[1].votes || 0)} ahead`
                : ` · ${ranked[0].votes} votes`}
            </span>
          </div>
        ) : null}

        {/* Votes per day — bars, not a table of numbers (app commit df4c6c9). */}
        {trend.length > 0 ? (
          <Card className="tw:mt-3 tw:p-[14px]">
            <div className="tw:flex tw:items-center tw:gap-2">
              <TrendingUp className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
              <span className="tw:text-[13px] tw:font-semibold tw:text-ink">Votes per day</span>
              <span className="tw:ml-auto tw:text-[11px] tw:font-semibold tw:text-muted">
                {trendTotals.total} total
              </span>
            </div>

            <div className="tw:mt-3 tw:flex tw:h-16 tw:items-end tw:gap-[1.5px]">
              {trendTotals.votes.map((count, index) => {
                const height =
                  trendTotals.max === 0 ? 3 : Math.min(64, Math.max(3, (count / trendTotals.max) * 64));

                return (
                  <div
                    key={trend[index]?.day || index}
                    title={`${trend[index]?.day || ""} · ${count} votes`}
                    className={`tw:min-h-[3px] tw:flex-1 tw:rounded-[3px] ${
                      count === 0
                        ? "tw:bg-hairline"
                        : index === trendTotals.bestIndex
                          ? "tw:bg-accent"
                          : "tw:bg-accent/45"
                    }`}
                    style={{ height }}
                  />
                );
              })}
            </div>

            <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-[9.5px] tw:text-faint">
                {String(trend[0]?.day || "").slice(5)}
              </span>
              {trendTotals.bestIndex >= 0 ? (
                <span className="tw:mx-auto tw:text-[9.5px] tw:font-semibold tw:text-muted">
                  Best: {String(trend[trendTotals.bestIndex]?.day || "").slice(5)} ·{" "}
                  {trendTotals.max} votes
                </span>
              ) : null}
              <span className="tw:text-[9.5px] tw:text-faint">
                {String(trend[trend.length - 1]?.day || "").slice(5)}
              </span>
            </div>
          </Card>
        ) : null}

        {/* Lifecycle belongs on the page: ending entries and ending voting are
            the two decisions an organiser comes here to make. */}
        {contest.status !== "voting_closed" && contest.status !== "settled" ? (
          <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2">
            {contest.status === "entries_open" ? (
              <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3.5 tw:py-3">
                <Lock className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
                <div className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink">
                    Close entries
                  </span>
                  <span className="tw:block tw:text-[11px] tw:text-muted">
                    Stops new contestants and fixes the field. Voting continues.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="tw:shrink-0"
                  loading={busy}
                  onClick={() => runLifecycle(() => closeContestEntries(id, token), "Entries closed.")}
                >
                  Close
                </Button>
              </div>
            ) : null}

            <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3.5 tw:py-3">
              <Lock className="tw:size-4 tw:shrink-0 tw:text-muted" aria-hidden="true" />
              <div className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink">
                  Close voting
                </span>
                <span className="tw:block tw:text-[11px] tw:text-muted">
                  Ends the contest now. Votes stop and the ranking is final.
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="tw:shrink-0"
                loading={busy}
                onClick={() => {
                  if (window.confirm("Close voting now? Nobody can vote after this.")) {
                    runLifecycle(() => closeContestVoting(id, token), "Voting closed.");
                  }
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}

        <section className="tw:mt-8">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-[15px] tw:font-semibold tw:text-ink">Needs review</span>
            {pending.length > 0 ? (
              <span className="tw:rounded-pill tw:bg-accent tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-white">
                {pending.length}
              </span>
            ) : null}
            {pending.length > 1 ? (
              <button
                type="button"
                onClick={approveAll}
                disabled={busy}
                className="tw:ml-auto tw:border-0 tw:bg-transparent tw:text-[12.5px] tw:font-semibold tw:text-accent-deep tw:disabled:opacity-60"
              >
                Approve all
              </button>
            ) : null}
          </div>

          <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-3">
            {pending.length === 0 ? (
              <Card className="tw:p-4">
                <span className="tw:text-[13px] tw:text-muted">
                  Nothing waiting — every entry has been reviewed.
                </span>
              </Card>
            ) : (
              pending.map((entry) => (
                <Card key={entry.id} className="tw:p-4">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                    <div className="tw:min-w-0">
                      <span className="tw:block tw:truncate tw:text-[14px] tw:font-semibold tw:text-ink">
                        {entry.display_name}
                      </span>
                      <span className="tw:block tw:text-[12px] tw:text-muted">
                        Entry #{entry.entry_number}
                        {entry.location ? ` · ${entry.location}` : ""}
                      </span>
                      {entry.bio ? (
                        <span className="tw:mt-1 tw:block tw:line-clamp-2 tw:text-[12px] tw:text-muted">
                          {entry.bio}
                        </span>
                      ) : null}
                    </div>

                    <div className="tw:flex tw:shrink-0 tw:flex-col tw:gap-2">
                      <Button size="sm" loading={busy} onClick={() => approve(entry)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDeclining(entry);
                          setDeclineForm({ reason: "", password: "", code: "" });
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* The people actually in the running, in rank order, each with the
            control that used to vanish on approval (app commit 0d6b072). */}
        {ranked.length > 0 ? (
          <section className="tw:mt-8">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-[15px] tw:font-semibold tw:text-ink">In the running</span>
              <span className="tw:rounded-pill tw:bg-inner tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-muted">
                {ranked.length}
              </span>
            </div>

            <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
              {ranked.map((entry, index) => {
                const votes = Number(entry.votes || 0);

                return (
                  <div
                    key={entry.id}
                    className={`tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:bg-paper-raised tw:px-3 tw:py-2.5 ${
                      index === 0 ? "tw:border-accent/45" : "tw:border-hairline"
                    }`}
                  >
                    <span
                      className={`tw:w-6 tw:shrink-0 tw:text-[12px] tw:font-bold ${
                        index === 0 ? "tw:text-accent" : "tw:text-ink-muted"
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <div className="tw:min-w-0 tw:flex-1">
                      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
                        <span className="tw:min-w-0 tw:truncate tw:text-[13px] tw:font-semibold tw:text-ink">
                          {entry.display_name}
                        </span>
                        {index === 0 ? (
                          <span className="tw:shrink-0 tw:rounded-pill tw:bg-accent tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-white">
                            Leading
                          </span>
                        ) : null}
                      </div>
                      <span className="tw:block tw:text-[11px] tw:text-ink-muted">
                        {index === 0
                          ? `${votes} ${votes === 1 ? "vote" : "votes"}`
                          : `${votes} ${votes === 1 ? "vote" : "votes"} · ${leaderVotes - votes} behind`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDisqualify(entry)}
                      className="tw:shrink-0 tw:border-0 tw:bg-transparent tw:text-[11.5px] tw:font-semibold tw:text-danger"
                    >
                      Disqualify
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Who is out: faded, below the queue. History to consult, not work to
            do — but an organiser must be able to see it without asking. */}
        {disqualified.length > 0 ? (
          <section className="tw:mt-6 tw:opacity-62">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Gavel className="tw:size-3.5 tw:text-muted" aria-hidden="true" />
              <span className="tw:text-[13px] tw:font-semibold tw:text-muted-strong">
                Disqualified
              </span>
              <span className="tw:rounded-pill tw:bg-inner tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-muted">
                {disqualified.length}
              </span>
            </div>

            <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
              {disqualified.map((entry) => (
                <div
                  key={entry.id}
                  className="tw:rounded-[12px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                >
                  <span className="tw:block tw:truncate tw:text-[12.5px] tw:font-semibold tw:text-muted-strong">
                    {entry.display_name}
                  </span>
                  {String(entry.reason || "").trim() ? (
                    <span className="tw:mt-0.5 tw:block tw:line-clamp-2 tw:text-[11px] tw:text-muted">
                      {entry.reason}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Decline: reason + second factor. */}
      <Modal
        open={Boolean(declining)}
        onClose={() => setDeclining(null)}
        title={`Decline ${declining?.display_name || "entry"}`}
      >
        <form onSubmit={submitDecline} className="tw:flex tw:flex-col tw:gap-3">
          <span className="tw:text-[12px] tw:text-muted">
            The contestant sees this reason in their email. Be specific and fair — this is the
            decision people appeal.
          </span>

          <Field label="Reason">
            <textarea
              required
              minLength={20}
              rows={3}
              value={declineForm.reason}
              onChange={(event) => setDeclineForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent"
            />
          </Field>

          <Field label="Your password" hint="Or your 6-digit authenticator code if 2FA is on.">
            <Input
              type="password"
              value={declineForm.password}
              onChange={(event) => setDeclineForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </Field>

          <Field label="2FA code (only if enabled)">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={declineForm.code}
              onChange={(event) => setDeclineForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </Field>

          <Button type="submit" variant="danger" loading={busy}>
            Decline entry
          </Button>
        </form>
      </Modal>

      {/* Disqualification: one contestant, or everyone below a line. Every
          affected person is emailed and notified with this reason. */}
      <Modal open={cutOpen} onClose={() => setCutOpen(false)} title="Disqualify contestants">
        <form onSubmit={submitCut} className="tw:flex tw:flex-col tw:gap-3">
          <span className="tw:text-[12px] tw:leading-relaxed tw:text-muted!">
            Votes cast for a disqualified entry stop counting. This cannot be undone, and each
            contestant is told why.
          </span>

          <Field label="Who">
            <select
              value={cutForm.mode}
              onChange={(event) =>
                setCutForm((prev) => ({ ...prev, mode: event.target.value }))
              }
              className="tw:h-12 tw:w-full tw:rounded-control tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[15px] tw:text-ink tw:outline-none"
            >
              <option value="entry">One contestant</option>
              <option value="rank">Everyone from a position down</option>
              <option value="votes">Everyone under a number of votes</option>
            </select>
          </Field>

          {cutForm.mode === "entry" ? (
            <Field label="Contestant">
              <select
                required
                value={cutForm.entryId}
                onChange={(event) =>
                  setCutForm((prev) => ({ ...prev, entryId: event.target.value }))
                }
                className="tw:h-12 tw:w-full tw:rounded-control tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[15px] tw:text-ink tw:outline-none"
              >
                <option value="">Choose…</option>
                {ranked.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.display_name} · {entry.votes} votes
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field
              label={cutForm.mode === "rank" ? "From this position down" : "Under this many votes"}
              hint={
                cutForm.mode === "rank"
                  ? "3 means 3rd place and everyone below it."
                  : "100 means anyone with fewer than 100 votes."
              }
            >
              <Input
                type="number"
                min={1}
                required
                value={cutForm.value}
                onChange={(event) => setCutForm((prev) => ({ ...prev, value: event.target.value }))}
              />
            </Field>
          )}

          <Field label="Reason (they see this)">
            <textarea
              required
              minLength={20}
              rows={3}
              value={cutForm.reason}
              onChange={(event) => setCutForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none"
            />
          </Field>

          <Field label="Your password" hint="Or your 6-digit authenticator code if 2FA is on.">
            <Input
              type="password"
              value={cutForm.password}
              onChange={(event) => setCutForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </Field>

          <Field label="2FA code (only if enabled)">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={cutForm.code}
              onChange={(event) => setCutForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </Field>

          <Button type="submit" variant="danger" loading={busy}>
            Disqualify
          </Button>
        </form>
      </Modal>

      <DeleteContestSheet
        contest={{ id: contest.id, title: contest.title }}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/account/contests")}
      />

      {/* Extend voting: forward only. */}
      <Modal open={extendOpen} onClose={() => setExtendOpen(false)} title="Extend voting">
        <form onSubmit={submitExtend} className="tw:flex tw:flex-col tw:gap-3">
          <span className="tw:text-[12px] tw:text-muted">
            Current deadline:{" "}
            {contest.voting_window?.closes_at
              ? new Date(contest.voting_window.closes_at).toLocaleString()
              : "not set"}
            . A deadline can move later, never earlier.
          </span>

          <Field label="New voting close">
            <Input
              type="datetime-local"
              required
              value={extendForm.voting_close_at}
              onChange={(event) =>
                setExtendForm((prev) => ({ ...prev, voting_close_at: event.target.value }))
              }
            />
          </Field>

          <Field label="Why (optional, kept on the record)">
            <Input
              value={extendForm.reason}
              onChange={(event) => setExtendForm((prev) => ({ ...prev, reason: event.target.value }))}
              maxLength={500}
            />
          </Field>

          <Button type="submit" loading={busy}>
            Move the deadline
          </Button>
        </form>
      </Modal>
    </div>
  );
}
