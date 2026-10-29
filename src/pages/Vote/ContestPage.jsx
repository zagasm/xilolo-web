import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Share2, Trophy, UserX, Wifi } from "lucide-react";
import { Button, Chip, Input, Skeleton } from "../../component/ui";
import { showError, showSuccess } from "../../component/ui/toast";
import { getContest, getSharedContest } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import { formatCount } from "../../utils/countFormat";
import { resolveMediaUrl } from "../../utils/media";
import EntrySheet from "./components/EntrySheet";
import VoteSheet from "./components/VoteSheet";
import DeleteContestSheet from "./components/DeleteContestSheet";
import { contestStatus, money, timeLeft } from "./components/ContestCard";
import { shareContest } from "./contestShare";
import { friendlyError } from "../../lib/errors";

/* ── the event page's small parts, reused so both surfaces match ─────────── */

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
  if (to && to !== from) return `${from} – ${to} place`;
  return `${from} place`;
}

function prizeLabel(prize) {
  const title = (prize.title || "").trim();
  if (!title || /^Prize \d+$/i.test(title)) return null;
  return title;
}

function coverUrl(media) {
  const raw = media?.card || media?.cover || media?.url || media?.path || null;
  return raw ? resolveMediaUrl(raw) : null;
}

function photoUrl(entry) {
  const raw = entry?.media?.photo?.url || entry?.media?.photo?.path || null;
  return raw ? resolveMediaUrl(raw) : null;
}

/** Initials stand in for a photo, so two contestants with one name differ. */
function Avatar({ entry, size = 44 }) {
  const photo = photoUrl(entry);
  const initials = (entry.display_name || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-hairline tw:bg-accent/12"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img src={photo} alt="" className="tw:size-full tw:object-cover" />
      ) : (
        <span className="tw:text-[13px] tw:font-bold tw:text-accent-deep">{initials}</span>
      )}
    </span>
  );
}

function ContestantRow({ entry, canVote, onVote, leaderVotes = 0 }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-hairline tw:py-3 last:tw:border-b-0">
      <span className="tw:w-5 tw:shrink-0 tw:text-center tw:text-[12px] tw:font-bold tw:text-muted!">
        {entry.rank}
      </span>

      <Avatar entry={entry} />

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <span className="tw:truncate tw:text-[14px] tw:font-semibold tw:text-ink!">
            {entry.display_name}
          </span>
          {entry.entry_number ? (
            <span className="tw:shrink-0 tw:text-[11px] tw:text-muted!">#{entry.entry_number}</span>
          ) : null}
        </div>
        <span className="tw:block tw:truncate tw:text-[12px] tw:text-muted!">
          {(() => {
            const votes =
              entry.votes !== null && entry.votes !== undefined
                ? `${formatCount(entry.votes)} votes`
                : null;
            // "0 votes · No votes yet" says the same thing twice.
            const status = entry.status_text === "No votes yet" ? null : entry.status_text;

            return [votes, status].filter(Boolean).join(" · ") || "No votes yet";
          })()}
        </span>

        {/* A race reads as a distance, not two numbers to compare — the bar is
            relative to the leader, exactly as the app draws it. */}
        {leaderVotes > 0 && entry.votes !== null && entry.votes !== undefined ? (
          <div className="tw:mt-1.5 tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-pill tw:bg-inner">
            <div
              className="tw:h-full tw:rounded-pill tw:bg-accent"
              style={{
                width: `${Math.max(2, Math.min(100, (Number(entry.votes) / leaderVotes) * 100))}%`,
              }}
            />
          </div>
        ) : null}
      </div>

      {canVote ? (
        <Button size="sm" variant="secondary" onClick={() => onVote(entry)} className="tw:shrink-0">
          Vote
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Contest page.
 *
 * Tabs first — Contestants, then About — because a contest IS its contestants;
 * the story of the contest is secondary and lives behind the second tab. The
 * active tab is marked with a slim rule that sits on the divider, so the line
 * reads as one continuous rule with a highlighted segment rather than a
 * separate pill.
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
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("contestants");
  const [query, setQuery] = useState("");

  const isShared = Boolean(sharedToken);

  const load = useCallback(async () => {
    setError(null);

    try {
      const data = isShared ? await getSharedContest(sharedToken) : await getContest(slug, token);
      setContest(data);
      setBoard(data.leaderboard ?? null);
      setMyEntry(data.my_entry ?? null);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "This contest could not be found."
          : friendlyError(err, "The contest could not be loaded right now.")
      );
    } finally {
      setLoading(false);
    }
  }, [isShared, sharedToken, slug, token]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * The app shares through the system share sheet rather than only copying
   * (contest_share_helper.dart, commit fd9b1bc): sending a contest to WhatsApp
   * is the whole point of the link. The web keeps its unguessable /v/{token}
   * link, because contest reads otherwise need an account.
   */
  const share = async () => {
    try {
      const result = await shareContest({
        title: contest?.title,
        slug: contest?.slug,
        shareToken: contest?.share_token,
        token,
      });

      if (result === "copied") showSuccess("Link copied.");
      if (result === "none") showError("This contest has no link yet.");
    } catch {
      showError("Could not share the link — long-press the address bar instead.");
    }
  };

  const entries = board?.entries ?? [];

  // Who is out, and why. Disqualified and rejected entries are kept separate
  // from the ranking by the API (ContestLeaderboardService::excludedEntries) so
  // nothing here can be counted — but a removal must stay visible, or an
  // organiser could delete a contestant and nobody could tell it happened.
  const excluded = board?.excluded ?? [];
  const excludedReason = (entry) => {
    const state = String(entry.status || "").toLowerCase();
    const why =
      state === "disqualified"
        ? "Disqualified"
        : state === "rejected"
          ? "Not admitted"
          : "Out of the contest";

    return entry.votes === null || entry.votes === undefined
      ? why
      : `${why} · ${entry.votes} ${entry.votes === 1 ? "vote" : "votes"} void`;
  };
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      [entry.display_name, entry.share_slug].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      )
    );
  }, [entries, query]);

  // The leader's count sets the scale for every progress bar.
  const leaderVotes = entries.reduce(
    (best, entry) =>
      entry.votes !== null && entry.votes !== undefined
        ? Math.max(best, Number(entry.votes))
        : best,
    0
  );

  const cover = contest ? coverUrl(contest.cover_media) : null;
  const votingOpen = Boolean(contest?.voting_window?.open);
  const entriesOpen = Boolean(contest?.entries_window?.open);
  const votingClosing = contest ? timeLeft(contest.voting_window?.closes_at) : null;
  const canVote = votingOpen && Boolean(user) && !isShared;
  const organiserHref = contest?.organiser?.id ? `/profile/${contest.organiser.id}` : null;
  // "Voting ongoing", never "voting live" — live means a stream is running.
  const status = contestStatus(contest);
  const statusColour =
    { success: "#22C55E", warning: "#B45309", danger: "#B3261E", accent: "#16909C" }[
      status.tone
    ] || "#16909C";

  if (loading) {
    return (
      <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-32 tw:pt-20 tw:font-sans tw:md:pb-24">
        <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4">
          <Skeleton className="tw:h-[200px] tw:w-full tw:rounded-[20px]" />
          <Skeleton className="tw:mt-3 tw:h-9 tw:w-full" />
          <Skeleton className="tw:mt-3 tw:h-16 tw:w-full" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-32 tw:pt-20 tw:font-sans tw:md:pb-24">
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
    <div className="tw:min-h-screen tw:w-full tw:bg-paper tw:pb-[240px] tw:pt-20 tw:font-sans tw:text-body tw:md:pb-[150px]">
      {/* top bar */}
      <div className="tw:border-b tw:border-hairline tw:bg-paper-raised tw:md:sticky tw:md:top-20">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:items-center tw:gap-1.5 tw:px-2 tw:py-1.5 tw:md:max-w-[1040px]">
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

      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:pb-6 tw:md:max-w-[1040px] tw:md:px-6">
        {/* hero — no padding above it, so it meets the bar instead of floating */}
        <div className="tw:relative tw:h-[150px] tw:w-full tw:overflow-hidden tw:bg-ink tw:md:h-[240px] tw:md:rounded-b-[24px]">
          {cover ? (
            <img src={cover} alt="" className="tw:h-full tw:w-full tw:object-cover" />
          ) : (
            <div className="tw:h-full tw:w-full tw:bg-[linear-gradient(135deg,#1F2328_0%,#111316_100%)]" />
          )}

          <div className="tw:absolute tw:inset-0 tw:bg-[linear-gradient(180deg,rgba(17,19,22,0.06)_0%,rgba(17,19,22,0.22)_45%,rgba(17,19,22,0.78)_100%)]" />

          <div className="tw:absolute tw:bottom-2.5 tw:left-2.5 tw:right-2.5">
            <div className="tw:rounded-[18px] tw:border tw:border-white/30 tw:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] tw:p-3 tw:backdrop-blur-[10px]">
              <div className="tw:line-clamp-1 tw:font-display tw:text-[19px] tw:font-bold tw:leading-tight tw:text-white">
                {contest.title}
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:gap-3">
                <SummaryPill label="Per vote" value={money(contest.vote_price, contest.currency)} />
                <SummaryPill label="Voting" value={votingClosing || (votingOpen ? "Open" : "Closed")} />
                <span
                  className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:px-2 tw:py-1 tw:text-[10px] tw:font-bold tw:text-white"
                  style={{ backgroundColor: statusColour }}
                >
                  <Wifi className="tw:size-2.5 tw:text-white" aria-hidden="true" />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: slim rule on the divider, active segment highlighted. */}
        <div className="tw:relative tw:border-b tw:border-hairline">
          <div className="tw:flex">
            {[
              { key: "contestants", label: `Contestants${entries.length ? ` (${entries.length})` : ""}` },
              { key: "about", label: "About the contest" },
            ].map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className="tw:relative tw:flex-1 tw:px-3 tw:py-3 tw:text-center tw:text-[13px] tw:font-semibold"
                  style={{ color: active ? "#111316" : "#6B7280" }}
                >
                  {item.label}
                  {active ? (
                    <span className="tw:absolute tw:inset-x-0 tw:-bottom-px tw:h-[2px] tw:bg-accent" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "contestants" ? (
          <div className="tw:px-4 tw:pt-3 tw:md:px-0">
            {entries.length === 0 ? (
              <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-6 tw:text-center">
                <Trophy className="tw:mx-auto tw:size-8 tw:text-faint" aria-hidden="true" />
                <span className="tw:mt-2 tw:block tw:text-[14px] tw:font-semibold tw:text-body!">
                  No contestants yet
                </span>
                <span className="tw:mt-1 tw:block tw:text-[12px] tw:text-muted!">
                  {entriesOpen
                    ? "Entries are open — approved contestants appear here."
                    : "Nobody entered this contest."}
                </span>
              </div>
            ) : (
              <>
                {/* Search, so a voter with a name in mind does not scroll. */}
                <div className="tw:relative tw:mt-1">
                  <Search
                    className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:size-4 tw:-translate-y-1/2 tw:text-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="contestant-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search a contestant"
                    aria-label="Search contestants"
                    className="tw:pl-9! tw:text-[14px]"
                  />
                </div>

                <div className="tw:mt-1">
                  {filtered.length === 0 ? (
                    <span className="tw:block tw:py-6 tw:text-center tw:text-[13px] tw:text-muted!">
                      No contestant matches “{query}”.
                    </span>
                  ) : (
                    filtered.map((entry) => (
                      <ContestantRow
                        key={entry.entry_id}
                        entry={entry}
                        canVote={canVote}
                        leaderVotes={leaderVotes}
                        onVote={(picked) => setVoting(picked)}
                      />
                    ))
                  )}
                </div>

                {/* Who is out: faded, at the bottom, never counted. */}
                {excluded.length > 0 ? (
                  <div className="tw:mt-6 tw:opacity-55">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <UserX className="tw:size-3.5 tw:text-muted!" aria-hidden="true" />
                      <span className="tw:text-[13px] tw:font-semibold tw:text-muted-strong!">
                        Didn&apos;t make it
                      </span>
                      <span className="tw:rounded-pill tw:bg-inner tw:px-[9px] tw:py-[3px] tw:text-[10px] tw:font-bold tw:text-muted!">
                        {excluded.length}
                      </span>
                    </div>

                    <div className="tw:mt-2">
                      {excluded.map((entry) => (
                        <div
                          key={entry.entry_id}
                          className="tw:flex tw:items-center tw:gap-3 tw:py-2"
                        >
                          <Avatar entry={entry} size={32} />
                          <div className="tw:min-w-0 tw:flex-1">
                            <span className="tw:block tw:truncate tw:text-[13px] tw:font-semibold tw:text-muted-strong!">
                              {entry.display_name}
                            </span>
                            <span className="tw:block tw:truncate tw:text-[11px] tw:text-muted!">
                              {excludedReason(entry)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-6 tw:px-4 tw:pt-4 tw:md:px-0">
            {contest.prizes?.length ? (
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
            ) : null}

            <MetaSection label="Key dates">
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <span className="tw:text-[13px] tw:text-muted!">Entries close</span>
                  <span className="tw:text-[13px] tw:font-semibold tw:text-body!">
                    {contest.entries_window?.closes_at
                      ? new Date(contest.entries_window.closes_at).toLocaleString(undefined, {
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
                      ? new Date(contest.voting_window.closes_at).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </MetaSection>

            <MetaSection label="Hosted By">
              <div className="tw:flex tw:items-center tw:gap-2">
                {organiserHref ? (
                  <Link
                    to={organiserHref}
                    className="tw:flex tw:min-w-0 tw:items-center tw:gap-1"
                  >
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
            </MetaSection>

            <MetaSection label="About this contest">
              <div className="tw:whitespace-pre-line tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted!">
                {contest.description ||
                  contest.subtitle ||
                  "The organiser has not added a description yet."}
              </div>
            </MetaSection>

            {contest.rules ? (
              <MetaSection label="Rules">
                <div className="tw:whitespace-pre-line tw:text-[13px] tw:leading-[1.6] tw:font-medium tw:text-muted!">
                  {contest.rules}
                </div>
              </MetaSection>
            ) : null}

            {entriesOpen && user && !myEntry && !isShared ? (
              <MetaSection label="Take part">
                <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
                  <span className="tw:block tw:text-[13px] tw:leading-relaxed tw:text-muted!">
                    Entries are open. Send yours and the organiser will review it.
                  </span>
                  <Button size="sm" className="tw:mt-3" onClick={() => setEntering(true)}>
                    Enter this contest
                  </Button>
                </div>
              </MetaSection>
            ) : null}

            {myEntry ? (
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
                    {myEntry.status === "rejected"
                      ? myEntry.rejection_reason || "The organiser did not give a reason."
                      : myEntry.status === "pending"
                        ? "The organiser reviews every entry by hand."
                        : "Contact the organiser if you believe this is a mistake."}
                  </span>
                </div>
              </MetaSection>
            ) : null}

            {/* Owner-only: remove a contest nobody has voted in. */}
            {contest.can_delete ? (
              <MetaSection label="Danger zone">
                <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
                  <span className="tw:block tw:text-[12px] tw:text-muted!">
                    Nobody has voted in this contest, so it can be deleted. Once the first vote is
                    paid, it can only be cancelled.
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="tw:mt-3"
                    onClick={() => setDeleting(true)}
                  >
                    Delete this contest
                  </Button>
                </div>
              </MetaSection>
            ) : null}
          </div>
        )}
      </div>

      {/* Action bar only where it adds something: the About tab and the empty
          state. On the contestants list every row already carries its own Vote
          button, and the bar was covering the second contestant on a phone. */}
      {tab === "about" || entries.length === 0 ? (
      <div className="tw:fixed tw:inset-x-0 tw:bottom-[72px] tw:z-40 tw:border-t tw:border-hairline tw:bg-paper-raised/95 tw:backdrop-blur tw:md:bottom-0">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[560px] tw:items-center tw:gap-3 tw:px-3 tw:py-2.5 tw:md:max-w-[1040px]">
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
          ) : entriesOpen && !myEntry ? (
            <Button size="md" className="tw:shrink-0" onClick={() => setEntering(true)}>
              Enter contest
            </Button>
          ) : (
            <Button
              size="md"
              className="tw:shrink-0"
              disabled={!votingOpen || entries.length === 0}
              onClick={() => {
                setTab("contestants");
                document.getElementById("contestant-search")?.focus();
              }}
            >
              {!votingOpen ? "Voting closed" : entries.length === 0 ? "No contestants" : "Choose a contestant"}
            </Button>
          )}
        </div>
      </div>
      ) : null}

      <EntrySheet
        open={entering}
        onClose={() => setEntering(false)}
        contest={contest}
        onSubmitted={load}
      />

      <DeleteContestSheet
        contest={{ id: contest.id, title: contest.title }}
        open={deleting}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate("/account/contests")}
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
