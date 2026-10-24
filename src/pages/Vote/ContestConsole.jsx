import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Chip,
  Field,
  Input,
  Modal,
  SectionHeading,
  Skeleton,
} from "../../component/ui";
import { showError, showSuccess } from "../../component/ui/toast";
import {
  approveEntry,
  declineEntry,
  disqualifyBelow,
  disqualifyEntry,
  extendVoting,
  getContestDashboard,
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
      const [board, queue] = await Promise.all([
        getContestDashboard(id, token),
        getOrganiserEntries(id, "pending", token),
      ]);
      setDashboard(board);
      setPending(queue || []);
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

        <div className="tw:mt-8 tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-2">
          <section>
            <SectionHeading
              eyebrow="Moderation"
              title={pending.length ? `${pending.length} waiting` : "Nothing waiting"}
            />

            <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3">
              {pending.length === 0 ? (
                <Card className="tw:p-4">
                  <span className="tw:text-[13px] tw:text-muted">
                    Every entry has been reviewed. New ones will appear here.
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

          <section>
            <SectionHeading eyebrow="Standings" title="Top five" />
            <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
              {(dashboard.top_entries || []).length === 0 ? (
                <Card className="tw:p-4">
                  <span className="tw:text-[13px] tw:text-muted">No approved contestants yet.</span>
                </Card>
              ) : (
                dashboard.top_entries.map((entry, index) => (
                  <Card key={entry.id} className="tw:flex tw:items-center tw:justify-between tw:p-3">
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <span className="tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-inner tw:text-[12px] tw:font-semibold tw:text-muted-strong">
                        {index + 1}
                      </span>
                      <span className="tw:text-[13px] tw:font-medium tw:text-ink">
                        {entry.display_name}
                      </span>
                    </div>
                    <span className="tw:text-[13px] tw:font-semibold tw:text-ink">
                      {entry.votes} votes
                    </span>
                  </Card>
                ))
              )}
            </div>

            <SectionHeading eyebrow="Last 7 days" title="Vote flow" className="tw:mt-6" />
            <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-1">
              {(dashboard.votes?.last_7_days || []).length === 0 ? (
                <Card className="tw:p-4">
                  <span className="tw:text-[13px] tw:text-muted">No votes in the last week.</span>
                </Card>
              ) : (
                dashboard.votes.last_7_days.map((day) => (
                  <div key={day.day} className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-1">
                    <span className="tw:text-[12px] tw:text-muted">{day.day}</span>
                    <span className="tw:text-[12px] tw:font-medium tw:text-ink">
                      {day.votes} votes · {money(day.earned, "NGN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
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
                {(dashboard?.top_entries || []).map((entry) => (
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
