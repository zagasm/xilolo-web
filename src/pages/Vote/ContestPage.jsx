import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Share2, Wifi } from "lucide-react";
import { Button, Chip, Skeleton } from "../../component/ui";
import { showSuccess, showError } from "../../component/ui/toast";
import { getContest, getSharedContest } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import { formatCount } from "../../utils/countFormat";
import { resolveMediaUrl } from "../../utils/media";
import Leaderboard from "./components/Leaderboard";
import VoteSheet from "./components/VoteSheet";
import EntrySheet from "./components/EntrySheet";
import { money, timeLeft } from "./components/ContestCard";

/* ── The event detail page's small parts, reused so both surfaces match ───── */

function SectionLabel({ children }) {
  return (
    <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1.2px] tw:text-muted!">
      {children}
    </span>
  );
}

function MetaSection({ label, children }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="tw:mt-2">{children}</div>
    </div>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="tw:min-w-0 tw:flex-1">
      <span className="tw:block tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-[1px] tw:text-white/70">
        {label}
      </span>
      <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[12px] tw:font-bold tw:text-white">
        {value}
      </span>
    </div>
  );
}

function ordinal(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "";
  const suffix = ["th", "st", "nd", "rd"][(value % 100 > 10 && value % 100 < 14) ? 0 : value % 10] || "th";
  return `${value}${suffix}`;
}

function prizeRange(prize) {
  const from = ordinal(prize.rank_from);
  const to = prize.rank_to ? ordinal(prize.rank_to) : null;

  // "1st place", "2nd – 10th place". The label IS the meaning; printing a
  // separate title like "winner" next to 1st place said the same thing twice.
  if (to && to !== from) return `${from} – ${to} place`;
  return `${from} place`;
}

/** Auto-generated titles ("Prize 1") are noise; only show a real one. */
function prizeLabel(prize) {
  const title = (prize.title || "").trim();
  if (!title || /^Prize \d+$/i.test(title)) return null;
  return title;
}

function coverUrl(media) {
  const raw = media?.card || media?.cover || media?.url || media?.path || null;
  return raw ? resolveMediaUrl(raw) : null;
}

/**
 * A contest, presented the way the event page is.
 *
 * Same shell (paper background, pt-20, 560px column that becomes two columns on
 * desktop), same hero treatment (poster, scrim, glass summary card), same
 * MetaSection labels, same Hosted By block with the organiser as a link, and a
 * sticky bottom action bar. A contest is a thing on Xilolo, so it should not
 * look like a different product.
 */
export default function ContestPage({ sharedToken = null }) {
  const { slug } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [board, setBoard] = useState(null);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(null);
  const [entering, setEntering] = useState(false);

  const isShared = Boolean(sharedToken);

  const load = useCallback(async () => {
    setError(null);

    try {
      const data = isShared
        ? await getSharedContest(sharedToken)
        : await getContest(slug, token);

      setContest(data);
      setBoard(data.leaderboard ?? null);
      setMyEntry(data.my_entry ?? null);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "This contest could not be found."
          : "The contest could not be loaded right now."
      );
    } finally {
      setLoading(false);
    }
  }, [isShared, sharedToken, slug, token]);

  useEffect(() => {
    load();
  }, [load]);

  const share = async () => {
    const url = contest?.share_token
      ? `${window.location.origin}/v/${contest.share_token}`
      : window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Link copied.");
    } catch {
      showError("Could not copy the link — long-press the address bar instead.");
    }
  };

  const cover = contest ? coverUrl(contest.cover_media) : null;
  const votingClosing = contest ? timeLeft(contest.voting_window?.closes_at) : null;
  const entriesClosing = contest ? timeLeft(contest.entries_window?.closes_at) : null;
  const votingOpen = Boolean(contest?.voting_window?.open);
  const entriesOpen = Boolean(contest?.entries_window?.open);
  const entries = board?.entries ?? [];
  const leader = entries[0];
  const canVote = votingOpen && Boolean(user) && !isShared;

  const organiserHref = contest?.organiser?.id ? `/profile/${contest.organiser.id}` : null;

  const statusLabel = votingOpen ? "Voting open" : entriesOpen ? "Entries open" : "Voting closed";

  if (loading) {
    return (
      <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-32 tw:pt-20 tw:md:pb-24 tw:font-sans">
        <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4">
          <Skeleton className="tw:h-[210px] tw:w-full tw:rounded-[24px]" />
          <Skeleton className="tw:mt-4 tw:h-6 tw:w-2/3" />
          <Skeleton className="tw:mt-3 tw:h-4 tw:w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-32 tw:pt-20 tw:md:pb-24 tw:font-sans">
        <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4 tw:py-16 tw:text-center">
          <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-body!">{error}</span>
          <Button as={Link} to="/vote" variant="secondary" className="tw:mt-4">
            All contests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-[250px] tw:pt-20 tw:font-sans tw:text-body tw:md:pb-[150px]">
      {/* Top bar — identical anatomy to the event page's. */}
      <div className="tw:border-b tw:border-hairline tw:bg-paper-raised tw:md:sticky tw:md:top-20">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:items-center tw:gap-1.5 tw:px-2 tw:py-2 md:tw:max-w-[1040px]">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/vote"))}
            aria-label="Go back"
            className="tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-transparent tw:text-body"
          >
            <ChevronLeft className="tw:size-5" aria-hidden="true" />
          </button>

          <div className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1.2px] tw:text-muted!">
              Contest
            </span>
            <span className="tw:mt-0.5 tw:block tw:truncate tw:font-display tw:text-[16px] tw:font-bold tw:text-body!">
              {contest.title}
            </span>
          </div>

          <button
            type="button"
            onClick={share}
            aria-label="Share contest"
            className="tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-transparent tw:text-body"
          >
            <Share2 className="tw:size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:pb-8 md:tw:max-w-[1040px] md:tw:px-6">
        {/* Hero: poster, scrim, glass summary — the event page's treatment. */}
        <div className="tw:px-2 tw:pt-1.5">
          <div className="tw:relative tw:h-[210px] tw:w-full tw:overflow-hidden tw:rounded-[24px] tw:bg-ink md:tw:h-[280px]">
            {cover ? (
              <img src={cover} alt="" className="tw:h-full tw:w-full tw:object-cover" />
            ) : (
              <div className="tw:h-full tw:w-full tw:bg-[linear-gradient(135deg,#1F2328_0%,#111316_100%)]" />
            )}

            <div className="tw:absolute tw:inset-0 tw:bg-[linear-gradient(180deg,rgba(17,19,22,0.06)_0%,rgba(17,19,22,0.20)_42%,rgba(17,19,22,0.74)_100%)]" />

            <div className="tw:absolute tw:bottom-3 tw:left-1.5 tw:right-1.5">
              <div className="tw:rounded-[22px] tw:border tw:border-white/30 tw:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] tw:p-3.5 tw:backdrop-blur-[10px]">
                <div className="tw:line-clamp-2 tw:font-display tw:text-[22px] tw:font-bold tw:leading-tight tw:text-white">
                  {contest.title}
                </div>

                <div className="tw:mt-2.5 tw:flex tw:gap-3">
                  <SummaryPill label="Per vote" value={money(contest.vote_price, contest.currency)} />
                  <SummaryPill
                    label="Voting"
                    value={votingClosing ? votingClosing : votingOpen ? "Open" : "Closed"}
                  />
                </div>

                <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-2.5">
                  <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#22C55E] tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-white">
                    <Wifi className="tw:size-3 tw:text-white" aria-hidden="true" />
                    {statusLabel}
                  </span>
                  <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[11px] tw:font-semibold tw:text-white/85">
                    {[
                      `${formatCount(contest.entry_count ?? entries.length ?? 0)} contestants`,
                      board?.counts_visible && board?.total_votes !== null
                        ? `${formatCount(board.total_votes)} votes cast`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two columns from md up, single column on phones — as the event page. */}
        <div className="tw:md:columns-2 md:tw:gap-x-8">
          {contest.prizes?.length ? (
            <div className="tw:break-inside-avoid tw:px-2 tw:pt-5">
              <MetaSection label="Prizes">
                <div className="tw:flex tw:flex-col tw:gap-2">
                  {contest.prizes.map((prize, index) => (
                    <div
                      key={`${prize.rank_from}-${index}`}
                      className="tw:flex tw:items-baseline tw:justify-between tw:gap-3 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-2.5"
                    >
                      <span className="tw:text-[13px] tw:font-semibold tw:text-body!">
                        {prizeRange(prize)}
                        {prizeLabel(prize) ? (
                          <span className="tw:ml-1.5 tw:font-medium tw:text-muted!">
                            {prizeLabel(prize)}
                          </span>
                        ) : null}
                      </span>
                      {prize.amount !== null && prize.amount !== undefined ? (
                        <span className="tw:shrink-0 tw:text-[13px] tw:font-bold tw:text-accent-deep!">
                          {money(prize.amount, contest.currency)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </MetaSection>
            </div>
          ) : null}

          <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
            <MetaSection label="Key dates">
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <span className="tw:text-[13px] tw:text-muted!">Entries close</span>
                  <span className="tw:text-[13px] tw:font-semibold tw:text-body!">
                    {contest.entries_window?.closes_at
                      ? new Date(contest.entries_window.closes_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <span className="tw:text-[13px] tw:text-muted!">Voting closes</span>
                  <span className="tw:text-[13px] tw:font-semibold tw:text-body!">
                    {contest.voting_window?.closes_at
                      ? new Date(contest.voting_window.closes_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                {entriesClosing ? (
                  <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted!">
                    {entriesOpen ? `Entries close in ${entriesClosing}` : "Entries are closed"}
                  </span>
                ) : null}
              </div>
            </MetaSection>
          </div>

          {/* Hosted By — the organiser is a link here, exactly as on events. */}
          {entriesOpen && user && !myEntry && !isShared ? (
            <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
              <MetaSection label="Take part">
                <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
                  <span className="tw:block tw:text-[13px] tw:leading-relaxed tw:text-muted!">
                    Entries are open. Send yours and the organiser will review it — approved
                    entries appear on the leaderboard and can start collecting votes.
                  </span>
                  <Button size="sm" className="tw:mt-3" onClick={() => setEntering(true)}>
                    Enter this contest
                  </Button>
                </div>
              </MetaSection>
            </div>
          ) : null}

          <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
            <MetaSection label="Hosted By">
              <div className="tw:flex tw:items-center tw:gap-2">
                {organiserHref ? (
                  <Link
                    to={organiserHref}
                    className="tw:flex tw:size-6 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-hairline tw:bg-paper-raised"
                  >
                    <span className="tw:text-[10px] tw:font-bold tw:text-muted!">
                      {(contest.organiser?.name || "X").trim().charAt(0).toUpperCase()}
                    </span>
                  </Link>
                ) : null}

                {organiserHref ? (
                  <Link to={organiserHref} className="tw:flex tw:min-w-0 tw:items-center tw:gap-1">
                    <span className="tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold tw:text-accent-deep!">
                      {contest.organiser?.name}
                    </span>
                    <ChevronRight className="tw:size-3.5 tw:shrink-0 tw:text-accent-deep" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="tw:text-sm tw:font-semibold tw:text-body!">
                    {contest.organiser?.name || "Organiser"}
                  </span>
                )}
              </div>

              {organiserHref ? (
                <Link
                  to={organiserHref}
                  className="tw:mt-3 tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-xl tw:bg-[#16909C] tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-[#06707D]"
                >
                  View organiser
                </Link>
              ) : null}
            </MetaSection>
          </div>

          <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
            <MetaSection label="About this contest">
              <div className="tw:whitespace-pre-line tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted!">
                {contest.description || contest.subtitle || "The organiser has not added a description yet."}
              </div>
            </MetaSection>
          </div>

          {contest.rules ? (
            <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
              <MetaSection label="Rules">
                <div className="tw:whitespace-pre-line tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted!">
                  {contest.rules}
                </div>
              </MetaSection>
            </div>
          ) : null}

          <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
            <MetaSection label="Leaderboard">
              {isShared && !user ? (
                <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
                  <span className="tw:block tw:text-[13px] tw:text-muted!">
                    Sign in to vote and to see where your contestant stands.
                  </span>
                  <Button as={Link} to="/auth/signin" size="sm" className="tw:mt-3">
                    Sign in
                  </Button>
                </div>
              ) : (
                <Leaderboard
                  board={board}
                  canVote={canVote}
                  onVote={(entry) => setVoting(entry)}
                  emptyBody={
                    entriesOpen
                      ? "Entries approved by the organiser will appear here."
                      : "No contestants took part in this contest."
                  }
                />
              )}
            </MetaSection>
          </div>

          {myEntry ? (
            <div className="tw:break-inside-avoid tw:px-2 tw:pt-[22px]">
              <MetaSection label="Your entry">
                <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
                  <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-body!">
                    {myEntry.status === "approved"
                      ? "You are in this contest"
                      : myEntry.status === "pending"
                        ? "Your entry is waiting for review"
                        : myEntry.status === "rejected"
                          ? "Your entry was not approved"
                          : "You were disqualified"}
                  </span>
                  <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted!">
                    {myEntry.status === "pending"
                      ? "The organiser reviews every entry by hand. You will be notified by email."
                      : myEntry.status === "rejected"
                        ? myEntry.rejection_reason || "The organiser did not give a reason."
                        : myEntry.status === "approved"
                          ? "Your entry appears on the leaderboard once approved."
                          : "Contact the organiser if you believe this is a mistake."}
                  </span>
                </div>
              </MetaSection>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky action bar, mirroring the event page's bottom bar. */}
      <div className="tw:fixed tw:inset-x-0 tw:bottom-[72px] tw:z-40 tw:md:bottom-0 tw:border-t tw:border-hairline tw:bg-paper-raised/95 tw:backdrop-blur">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:items-center tw:gap-3 tw:px-3 tw:py-3 md:tw:max-w-[1040px]">
          <div className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1px] tw:text-muted!">
              Per vote
            </span>
            <span className="tw:block tw:text-[16px] tw:font-bold tw:text-body!">
              {money(contest.vote_price, contest.currency)}
            </span>
          </div>

          {isShared && !user ? (
            <Button as={Link} to="/auth/signin" size="md" className="tw:shrink-0">
              Sign in to vote
            </Button>
          ) : (
            <Button
              size="md"
              disabled={!canVote || !leader}
              onClick={() => leader && setVoting(leader)}
              className="tw:shrink-0"
            >
              {!votingOpen ? "Voting closed" : leader ? `Vote for ${leader.display_name}` : "No contestants yet"}
            </Button>
          )}
        </div>
      </div>

      <EntrySheet
        open={entering}
        onClose={() => setEntering(false)}
        contest={contest}
        onSubmitted={load}
      />

      {voting ? (
        <VoteSheet
          open={Boolean(voting)}
          onClose={() => setVoting(null)}
          contest={contest}
          entry={voting}
          token={token}
          onVoted={load}
        />
      ) : null}
    </div>
  );
}
