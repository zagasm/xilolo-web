import { Link } from "react-router-dom";
import { Flame, Lock, LogIn, Share2, Timer, Users, Vote } from "lucide-react";
import { formatCount } from "../../../utils/countFormat";
import { resolveMediaUrl } from "../../../utils/media";
import { showError, showSuccess } from "../../../component/ui/toast";
import { shareContest } from "../contestShare";

/**
 * Contest card.
 *
 * Mirrors the app's live feed card (`lib/features/contest/widgets/contest_card.dart`,
 * commits fd9b1bc + c1ba287): artwork → title (two lines, fixed height so a row
 * of cards lines up) → organiser with the STATUS BADGE beside the name → price
 * and contestant count on one baseline — plus a share button on the artwork.
 *
 * Three things here are deliberate, all from the app:
 *  - the status lives beside the organiser, never on the cover, because busy
 *    artwork swallowed it;
 *  - the status has a COLOUR (ongoing green, closing-soon amber, closed red,
 *    entries-open accent), so a badge tells states apart at a glance;
 *  - every contest is shareable from the list — you should not have to open one
 *    to send its link.
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

/** Status tones, straight from `ContestSummary.statusTone` (contest_models.dart:123). */
const TONES = {
  success: { label: "tw:text-[#15803D]", ring: "tw:border-[#15803D]/30", fill: "tw:bg-[#15803D]/12" },
  warning: { label: "tw:text-[#B45309]", ring: "tw:border-[#B45309]", fill: "tw:bg-[#B45309]" },
  danger: { label: "tw:text-[#B3261E]", ring: "tw:border-[#B3261E]/30", fill: "tw:bg-[#B3261E]/12" },
  accent: { label: "tw:text-accent-deep", ring: "tw:border-accent/30", fill: "tw:bg-accent/12" },
};

/**
 * What this contest is doing right now, in the words the app uses: "Voting
 * ongoing" (never "voting live" — live means a stream is running), "Closing
 * soon" inside 48 hours, "Entries open", "Voting closed".
 *
 * The list endpoint sends `voting` / `entries`; the detail endpoint sends
 * `voting_window` / `entries_window`. One helper reads both.
 */
export function contestStatus(contest) {
  const voting = contest?.voting_window ?? contest?.voting ?? {};
  const entries = contest?.entries_window ?? contest?.entries ?? {};
  const votingOpen = Boolean(voting.open);
  const entriesOpen = Boolean(entries.open);
  const closesAt = voting.closes_at ? new Date(voting.closes_at).getTime() : null;
  const closingSoon =
    votingOpen && closesAt !== null && !Number.isNaN(closesAt) && closesAt - Date.now() <= 48 * 3600 * 1000;

  if (votingOpen) {
    return closingSoon
      ? { label: "Closing soon", tone: "warning", icon: Timer, filled: true }
      : { label: "Voting ongoing", tone: "success", icon: Vote, filled: false };
  }
  if (entriesOpen) return { label: "Entries open", tone: "accent", icon: LogIn, filled: false };
  return { label: "Voting closed", tone: "danger", icon: Lock, filled: false };
}

export function StatusPill({ contest, className = "" }) {
  const status = contestStatus(contest);
  const tone = TONES[status.tone] || TONES.accent;
  const Icon = status.icon;

  return (
    <span
      className={`tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-pill tw:border tw:px-[9px] tw:py-[5px] tw:text-[11px] tw:font-bold ${tone.ring} ${
        status.filled ? `${tone.fill} tw:text-white` : `${tone.fill} ${tone.label}`
      } ${className}`}
    >
      <Icon className="tw:size-3" aria-hidden="true" />
      {status.label}
    </span>
  );
}

export default function ContestCard({ contest, token = null }) {
  const cover = coverUrl(contest.cover_media);
  const entrants = Number(contest.entry_count || 0);
  const organiser = contest.organiser?.name || "Organiser";
  const initial = organiser.trim().charAt(0).toUpperCase() || "X";

  const onShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const result = await shareContest({
        title: contest.title,
        slug: contest.slug,
        token,
      });

      if (result === "copied") showSuccess("Link copied.");
      if (result === "none") showError("This contest has no link yet.");
    } catch {
      showError("The link could not be shared — long-press the address bar instead.");
    }
  };

  return (
    <Link
      to={`/vote/${contest.slug}`}
      className="tw:group tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:text-ink tw:no-underline tw:transition-colors tw:hover:border-accent/50"
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
          <div className="tw:flex tw:size-full tw:items-center tw:justify-center tw:bg-[linear-gradient(135deg,rgba(22,144,156,0.22),rgba(22,144,156,0.06))]">
            <span className="tw:text-[44px] tw:font-[800] tw:leading-none tw:text-[#16909C]">
              {initial}
            </span>
          </div>
        )}

        <div className="tw:absolute tw:left-2.5 tw:right-2.5 tw:top-2.5 tw:flex tw:items-start">
          {contest.trending ? (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-pill tw:bg-ink/92 tw:px-2 tw:py-[3px] tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-paper-raised">
              <Flame className="tw:size-2.5" aria-hidden="true" />
              Trending
            </span>
          ) : null}

          <button
            type="button"
            onClick={onShare}
            aria-label={`Share ${contest.title}`}
            className="tw:ml-auto tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border-0 tw:bg-black/40 tw:text-white tw:backdrop-blur-[2px] tw:transition-colors tw:hover:bg-black/60"
          >
            <Share2 className="tw:size-[15px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-1.5 tw:p-3.5">
        <h3 className="tw:m-0! tw:line-clamp-2 tw:min-h-[38px] tw:text-[15.5px]! tw:font-semibold! tw:leading-[1.3]! tw:text-ink!">
          {contest.title}
        </h3>

        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-[7px]">
          <span className="tw:flex tw:size-[18px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent/12 tw:text-[9px] tw:font-bold tw:text-accent-deep">
            {initial}
          </span>
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:text-muted">
            {organiser}
          </span>
          <StatusPill contest={contest} />
        </div>

        <div className="tw:mt-auto tw:flex tw:items-center tw:gap-2 tw:border-t tw:border-hairline tw:pt-2.5">
          <span className="tw:text-[12.5px] tw:font-semibold tw:leading-none tw:text-ink">
            {money(contest.vote_price, contest.currency)} a vote
          </span>
          <span className="tw:size-[3px] tw:shrink-0 tw:rounded-full tw:bg-faint" aria-hidden="true" />
          <span className="tw:inline-flex tw:min-w-0 tw:items-center tw:gap-1 tw:text-[12.5px] tw:leading-none tw:text-muted">
            <Users className="tw:size-3 tw:shrink-0" aria-hidden="true" />
            <span className="tw:truncate">
              {entrants === 1 ? "1 contestant" : `${formatCount(entrants)} contestants`}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
