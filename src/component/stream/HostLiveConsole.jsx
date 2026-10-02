import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  CornerDownRight,
  Eye,
  Heart,
  LoaderCircle,
  MessageCircle,
  Pin,
  PinOff,
  Radio,
  RefreshCw,
  Send,
  Trash2,
  TriangleAlert,
  Users,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import HlsVideoPlayer from "../HlsVideoPlayer.jsx";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../ui/toast";
import {
  canUseLiveRealtime,
  subscribeToLiveEvent,
} from "../../lib/liveEventRealtime";

const cx = (...classes) => classes.filter(Boolean).join(" ");

/* Polling is the guaranteed path and the fallback, so the intervals live inside
   the backend's own limits (AppServiceProvider: live-polling 20/min per user,
   live-actions 30/min, live-likes 30/min):
     - viewers + likes  every 5s  -> 12/min each (separate buckets)
     - comments         every 7s  ->  8.6/min   (20s once realtime carries it)
     - viewer list      every 8s, only while its panel is open -> 7.5/min
   Realtime events overwrite these instantly; the poll is just the floor. */
const VIEWER_POLL_INTERVAL = 5000;
const COMMENT_POLL_INTERVAL = 7000;
const COMMENT_POLL_INTERVAL_WITH_REALTIME = 20000;
const VIEWER_LIST_POLL_INTERVAL = 8000;
const NEAR_BOTTOM_PX = 96;

function timeValue(comment) {
  if (Number.isFinite(comment?.created_at_unix)) return comment.created_at_unix;
  const parsed = Date.parse(comment?.created_at || "");
  return Number.isFinite(parsed) ? parsed / 1000 : 0;
}

function mergeComments(previous, incoming) {
  const map = new Map(previous.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!item?.id) continue;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  }
  return Array.from(map.values()).sort((a, b) => timeValue(a) - timeValue(b));
}

function displayName(user, fallback = "Viewer") {
  return user?.userName || user?.name || fallback;
}

function initialsOf(label) {
  return (
    String(label || "?")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function clockLabel(iso) {
  const parsed = Date.parse(iso || "");
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeError(error, fallback) {
  const status = error?.response?.status;
  if (status === 429) return "Slow down a moment — you can send again in a few seconds.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That comment is no longer there.";
  return error?.response?.data?.message || fallback;
}

function Avatar({ name, url, size = 8 }) {
  return (
    <span
      className={cx(
        "tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-accent-soft tw:text-[11px] tw:font-bold tw:text-accent-deep",
        size === 8 ? "tw:h-8 tw:w-8" : "tw:h-9 tw:w-9",
      )}
    >
      {url ? (
        <img
          src={url}
          alt=""
          className={cx(size === 8 ? "tw:h-8 tw:w-8" : "tw:h-9 tw:w-9", "tw:object-cover")}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

/* ── Own-stream player ──────────────────────────────────────────────────────
   The host watches back exactly what viewers get. `playbackUrl` is
   `event.stream.playback.hls` from GET /api/v1/events/{id}/streams — the same
   call this page already makes to build its controls. Muted by default (the
   host is the source of the audio); the player reconnects on its own. */
function LivePreviewCard({
  playbackUrl,
  aspectRatio,
  preferHls,
  isLive,
  isPaused,
  hasStartedStream,
  onPlayerStatus,
}) {
  const [playerStatus, setPlayerStatus] = useState(playbackUrl ? "connecting" : "idle");
  /* Expanded preview: the host's own picture, as large as the screen allows.
     Only classes change when this toggles — the player element itself is never
     remounted, so expanding never restarts the stream. */
  const [theatre, setTheatre] = useState(false);

  useEffect(() => {
    setPlayerStatus(playbackUrl ? "connecting" : "idle");
  }, [playbackUrl]);

  useEffect(() => {
    if (!theatre) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setTheatre(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [theatre]);

  const handleStatus = useCallback(
    (next) => {
      setPlayerStatus(next);
      onPlayerStatus?.(next);
    },
    [onPlayerStatus],
  );

  /* The pill tells the truth about the picture, not just about the event status:
     "Reconnecting" / "Waiting for feed" only appear while that is what the host
     is actually looking at. */
  const pill = (() => {
    if (playerStatus === "reconnecting") return { label: "Reconnecting", tone: "warn" };
    if (playerStatus === "waiting") return { label: "Waiting for feed", tone: "warn" };
    if (playerStatus === "connecting") return { label: "Connecting", tone: "warn" };
    if (playerStatus === "error") return { label: "Preview unavailable", tone: "warn" };
    if (isLive) return { label: "Live", tone: "live" };
    if (isPaused) return { label: "Paused", tone: "warn" };
    return { label: hasStartedStream ? "Ready" : "Off air", tone: "idle" };
  })();

  const toneClass =
    pill.tone === "live"
      ? "tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
      : pill.tone === "warn"
        ? "tw:border-amber-200 tw:bg-amber-50 tw:text-amber-800"
        : "tw:border-[#ded6cd] tw:bg-white tw:text-gray-600";

  return (
    /* self-start: the chat rail is the taller column, and letting the grid
       stretch this card left a block of empty white under the player.
       Expanded: the same element turns into an overlay — classes change, the
       subtree does not, so the stream is never restarted by expanding. */
    <section
      data-console-part="player-card"
      data-theatre={theatre ? "1" : "0"}
      className={cx(
        "tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4 tw:shadow-sm tw:md:p-5",
        theatre
          ? "tw:fixed tw:inset-0 tw:z-50 tw:overflow-auto tw:rounded-none tw:border-0 tw:bg-[#faf8f6] tw:p-4 tw:sm:p-6"
          : "tw:self-start",
      )}
    >
      <div
        className={
          theatre
            ? "tw:mx-auto tw:flex tw:h-full tw:w-full tw:max-w-[1680px] tw:flex-col"
            : "tw:flex tw:w-full tw:flex-col"
        }
      >
        <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
          <div>
            <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
              Your live preview
            </span>
            <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
              {theatre
                ? "Expanded to your whole screen. Press Escape to go back."
                : "The picture your viewers are watching right now."}
            </p>
          </div>

          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
            <span
              data-console-part="player-status"
              className={cx(
                "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold",
                toneClass,
              )}
            >
              <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-current" />
              {pill.label}
            </span>

            <button
              type="button"
              onClick={() => setTheatre((value) => !value)}
              aria-label={theatre ? "Exit expanded preview" : "Expand preview"}
              title={theatre ? "Exit expanded preview (Esc)" : "Expand preview"}
              className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:text-gray-700 tw:transition tw:hover:bg-[#f4f1ee]"
            >
              {theatre ? (
                <Minimize2 className="tw:h-4 tw:w-4" />
              ) : (
                <Maximize2 className="tw:h-4 tw:w-4" />
              )}
            </button>
          </div>
        </div>

        <div
          className={
            theatre
              ? "tw:mt-4 tw:flex tw:flex-1 tw:items-center tw:justify-center"
              : "tw:mt-4"
          }
          data-console-part="player"
        >
          {playbackUrl ? (
            <div className={theatre ? "tw:w-full" : ""}>
              <HlsVideoPlayer
                src={playbackUrl}
                live
                preferHls={preferHls}
                autoPlay
                muted
                controls
                aspectRatio={aspectRatio || "16 / 9"}
                maxHeight={theatre ? "80vh" : "72vh"}
                onStatus={handleStatus}
              />
            </div>
          ) : (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:rounded-3xl tw:border tw:border-dashed tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:px-6 tw:py-16 tw:text-center">
            <span className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
              <Radio className="tw:h-5 tw:w-5" />
            </span>
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
              Your preview appears here
            </div>
            <div className="tw:max-w-md tw:text-sm tw:leading-6 tw:text-gray-600">
              {hasStartedStream
                ? "This event is set up but not broadcasting yet. Press Go live and your own feed shows up here, usually within a few seconds."
                : "Press Start stream to generate your stream details, then Go live — your own feed shows up here while you broadcast."}
            </div>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}

/* ── Live analytics strip ─────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, onClick, hint }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick, "aria-label": hint || label } : {})}
      className={cx(
        "tw:flex tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm tw:text-left",
        onClick ? "tw:cursor-pointer tw:transition tw:hover:border-gray-400" : "",
      )}
    >
      <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
        <Icon className="tw:h-4 tw:w-4" />
      </span>
      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:block tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900">
          {value}
        </span>
        <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-gray-500">
          {label}
        </span>
      </span>
      {hint ? (
        <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold tw:text-accent-deep">
          See who
          <ChevronRight className="tw:h-3.5 tw:w-3.5" />
        </span>
      ) : null}
    </Wrapper>
  );
}

function LiveStatsStrip({
  eventId,
  viewerCount,
  likesTotal,
  commentsTotal,
  realtime,
  onOpenViewers,
  likesBusy,
  onLike,
}) {
  return (
    <section
      className="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center"
      data-console-part="stats"
    >
      <div className="tw:grid tw:flex-1 tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-3">
        <StatTile
          icon={Eye}
          label="Viewers now"
          value={viewerCount}
          onClick={onOpenViewers}
          hint="See who is watching this event"
        />
        <StatTile icon={MessageCircle} label="Comments" value={commentsTotal} />
        <div
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm"
          data-console-part="likes-tile"
        >
          <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
            <Heart className="tw:h-4 tw:w-4" />
          </span>
          <span className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900">
              {likesTotal}
            </span>
            <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-gray-500">
              Likes
            </span>
          </span>
          <button
            type="button"
            onClick={onLike}
            disabled={likesBusy}
            aria-label="Add a like to this event"
            className="tw:inline-flex tw:h-9 tw:shrink-0 tw:items-center tw:justify-center tw:gap-1 tw:rounded-full tw:border tw:border-[#ded6cd] tw:px-3 tw:text-[11px] tw:font-semibold tw:text-gray-600 tw:transition tw:hover:border-accent tw:hover:text-accent-deep tw:disabled:opacity-60"
          >
            {likesBusy ? (
              <LoaderCircle className="tw:h-3.5 tw:w-3.5 tw:animate-spin" />
            ) : (
              <Heart className="tw:h-3.5 tw:w-3.5" />
            )}
            Like
          </button>
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-3 tw:lg:shrink-0">
        <span
          className={cx(
            "tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold",
            realtime === "subscribed"
              ? "tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
              : "tw:border-[#ded6cd] tw:bg-white tw:text-gray-500",
          )}
          title={
            realtime === "subscribed"
              ? "Counts and comments update the moment they change"
              : "Counts refresh every few seconds"
          }
        >
          <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-current" />
          {/* Deliberately NOT the word "Live": the owner subscribes before going
              live, so a green pill reading "Live" would claim the event is on air. */}
          {realtime === "subscribed" ? "Live updates" : "Refreshing"}
        </span>

        <Link
          to={`/event/analytics/${eventId}`}
          data-console-part="analytics-link"
          /* Not a filled brand button on purpose: an unlayered `div a { color }`
             rule beats layered Tailwind here, so a white label on a fill renders
             near-black-on-dark. Bordered-light is the pattern that measures
             readable (as EventDetailView's own analytics link does). */
          className="tw:inline-flex tw:h-11 tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:border-gray-400"
        >
          <BarChart3 className="tw:h-4 tw:w-4 tw:text-accent-deep" />
          View full analytics
        </Link>
      </div>
    </section>
  );
}

/* ── Who is watching ──────────────────────────────────────────────────────── */
function ViewersPanel({ open, onClose, viewerCount, viewers, loading, errorText, onRefresh }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const listedCount = viewers.length;
  const guests = Math.max(0, Number(viewerCount || 0) - listedCount);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Who is watching"
      data-console-part="viewers-panel"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-end tw:justify-center tw:bg-black/40 tw:sm:items-center tw:sm:p-6"
    >
      <div className="tw:flex tw:max-h-[85vh] tw:w-full tw:max-w-md tw:flex-col tw:rounded-t-4xl tw:bg-white tw:p-5 tw:shadow-xl tw:sm:rounded-4xl">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
          <div>
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-lg tw:font-semibold tw:text-gray-900">
              <Users className="tw:h-4 tw:w-4 tw:text-accent-deep" />
              Watching now
            </span>
            <p className="tw:mt-1 tw:text-sm tw:text-gray-600" data-console-part="viewers-count">
              {viewerCount} {Number(viewerCount) === 1 ? "person is" : "people are"} in this event.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tw:inline-flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-[#ded6cd] tw:text-gray-600 tw:hover:border-gray-400"
          >
            <X className="tw:h-4 tw:w-4" />
          </button>
        </div>

        <div className="tw:mt-4 tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pr-1">
          {loading && listedCount === 0 ? (
            <div className="tw:flex tw:h-32 tw:items-center tw:justify-center tw:gap-2 tw:text-sm tw:text-gray-500">
              <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
              Loading viewers
            </div>
          ) : errorText ? (
            <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-3xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-[13px] tw:leading-6 tw:text-amber-800">
              <TriangleAlert className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0" />
              <span className="tw:flex-1">{errorText}</span>
              <button
                type="button"
                onClick={onRefresh}
                className="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:hover:underline"
              >
                <RefreshCw className="tw:h-3.5 tw:w-3.5" />
                Retry
              </button>
            </div>
          ) : listedCount === 0 ? (
            <div className="tw:flex tw:h-32 tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:px-6 tw:text-center">
              <span className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
                <Users className="tw:h-5 tw:w-5" />
              </span>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                No one is watching yet
              </div>
              <div className="tw:text-sm tw:leading-6 tw:text-gray-600">
                Names appear here as people join the event.
              </div>
            </div>
          ) : (
            <ul className="tw:space-y-1">
              {viewers.map((viewer) => (
                <li
                  key={viewer.user_id}
                  className="tw:flex tw:items-center tw:gap-3 tw:rounded-2xl tw:px-2 tw:py-2 tw:hover:bg-[#faf8f6]"
                >
                  <Avatar name={viewer.name} url={viewer.avatar} size={9} />
                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="tw:block tw:truncate tw:text-[13px] tw:font-semibold tw:text-gray-900">
                      {viewer.name || "Viewer"}
                    </span>
                  </span>
                  <span className="tw:rounded-full tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-emerald-700">
                    Watching
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Count and list come from two different endpoints: /viewers/count also
            counts anonymous guests, /viewers/list can only name signed-in
            people. Saying so beats a list that looks short for no reason. */}
        {guests > 0 ? (
          <p className="tw:mt-3 tw:rounded-2xl tw:bg-[#faf8f6] tw:px-3 tw:py-2 tw:text-[11px] tw:leading-5 tw:text-gray-500">
            {guests} more {guests === 1 ? "viewer is" : "viewers are"} signed out, so they
            cannot be listed by name. Totals include them.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ── Guests ─────────────────────────────────────────────────────────────────
   Viewers ask to join from the app; the creator answers here. Requests expire
   in about a minute (StreamGuestRequest::TTL_SECONDS), so the card counts down
   rather than showing a stale ask — and the queue refreshes on the realtime
   guest events rather than waiting for the poll. */
function GuestsPanel({ eventId, token, refreshSignal, fixtureRows }) {
  /* Dev fixture: renders the identical markup against fixed rows, no fetching. */
  const demo = Boolean(fixtureRows);
  const [requests, setRequests] = useState(fixtureRows?.requests || []);
  const [guests, setGuests] = useState(fixtureRows?.guests || []);
  const [loading, setLoading] = useState(!demo);
  const [busyId, setBusyId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (demo) return;
    if (!eventId || !token) return;

    try {
      const [pendingResponse, guestsResponse] = await Promise.all([
        api.get(`/api/v1/events/${eventId}/guests/requests`, authHeaders(token)),
        api.get(`/api/v1/events/${eventId}/guests`, authHeaders(token)),
      ]);

      const pendingRows = pendingResponse?.data?.data;
      setRequests(Array.isArray(pendingRows) ? pendingRows : []);

      const guestRows = guestsResponse?.data?.data;
      const list = Array.isArray(guestRows) ? guestRows : guestRows?.guests;
      setGuests(Array.isArray(list) ? list : []);
    } catch (error) {
      // A 404 simply means no stream row exists yet; other errors are noise here.
      if (import.meta.env.DEV) console.warn("[guests] load failed", error);
    } finally {
      setLoading(false);
    }
  }, [demo, eventId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (refreshSignal) load();
  }, [refreshSignal, demo, load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const answer = async (request, accept) => {
    setBusyId(request.id);
    try {
      await api.post(
        `/api/v1/guests/requests/${request.id}/${accept ? "accept" : "decline"}`,
        {},
        authHeaders(token),
      );
      showSuccess(
        accept
          ? `${request.user?.name || "Your guest"} can join — they get the link in the app.`
          : `Request from ${request.user?.name || "that viewer"} declined.`,
      );
      await load();
    } catch (error) {
      showError(describeError(error, "Could not answer that request."));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (guest) => {
    setBusyId(guest.id);
    try {
      await api.post(`/api/v1/guests/${guest.id}/kick`, {}, authHeaders(token));
      showSuccess(`${guest.name || "That guest"} has been removed from the stream.`);
      await load();
    } catch (error) {
      showError(describeError(error, "Could not remove that guest."));
    } finally {
      setBusyId(null);
    }
  };

  const secondsLeft = (request) => {
    const expiry = request?.expires_at ? Date.parse(request.expires_at) : NaN;
    if (Number.isFinite(expiry)) {
      return Math.max(0, Math.round((expiry - now) / 1000));
    }
    return Number(request?.seconds_left ?? 0);
  };

  return (
    <section
      data-console-part="guests"
      className="tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4 tw:shadow-sm tw:md:p-5"
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <span className="tw:text-xl tw:font-semibold tw:text-gray-900">Guests</span>
          <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
            Viewers asking to join your stream.
          </p>
        </div>

        {requests.length ? (
          <span
            data-console-part="guest-pending-count"
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-accent tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white"
          >
            {requests.length} waiting
          </span>
        ) : null}
      </div>

      <div className="tw:mt-4 tw:space-y-2" data-console-part="guest-requests">
        {loading && !requests.length ? (
          <p className="tw:text-sm tw:text-gray-500">Checking for requests…</p>
        ) : requests.length ? (
          requests.map((request) => {
            const left = secondsLeft(request);
            const busy = busyId === request.id;

            return (
              <div
                key={request.id}
                data-console-part="guest-request"
                className="tw:flex tw:flex-col tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:p-3"
              >
                <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
                  <Avatar name={request.user?.name || "Guest"} size={9} />
                  <div className="tw:min-w-0">
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                      {request.user?.name || "A viewer"}
                    </div>
                    <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                      {request.audio_only ? (
                        <span className="tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-gray-600">
                          Audio only
                        </span>
                      ) : null}
                      <span className="tw:text-xs tw:text-gray-500">
                        {left > 0 ? `${left}s left to answer` : "Expiring…"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => answer(request, true)}
                    className="tw:flex-1 tw:rounded-full tw:bg-accent tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:text-white tw:transition tw:hover:bg-accent-deep tw:disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => answer(request, false)}
                    className="tw:flex-1 tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:text-gray-700 tw:transition tw:hover:bg-[#f4f1ee] tw:disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="tw:text-sm tw:text-gray-600">
            No one is waiting to join right now.
          </p>
        )}
      </div>

      <div className="tw:mt-5 tw:border-t tw:border-[#eee7e0] tw:pt-4">
        <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          On stream
        </div>

        <div className="tw:mt-2 tw:space-y-2" data-console-part="guest-on-stream">
          {guests.length ? (
            guests.map((guest) => (
              <div
                key={guest.id}
                className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-2xl tw:bg-[#faf8f6] tw:px-3 tw:py-2"
              >
                <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                  <Avatar name={guest.name || "Guest"} size={8} />
                  <span className="tw:truncate tw:text-sm tw:font-medium tw:text-gray-900">
                    {guest.name || "Guest"}
                  </span>
                  {guest.audio_only ? (
                    <span className="tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-gray-600">
                      Audio only
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={busyId === guest.id}
                  onClick={() => remove(guest)}
                  className="tw:shrink-0 tw:rounded-full tw:border tw:border-red-200 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-red-600 tw:transition tw:hover:bg-red-50 tw:disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="tw:text-sm tw:text-gray-600">No guests on stream yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ChatRow({ comment, canModerate, onPin, onUnpin, onDelete, onReply, busy }) {
  const name = displayName(comment.user);
  const avatar = comment.user?.profileUrl || comment.user?.profile_url || "";
  const pinned = Boolean(comment.is_pinned);

  return (
    <div className="tw:group tw:flex tw:gap-3 tw:rounded-3xl tw:px-2 tw:py-2 tw:hover:bg-[#faf8f6]">
      <span className="tw:mt-0.5">
        <Avatar name={name} url={avatar} />
      </span>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <span className="tw:text-[13px] tw:font-bold tw:text-gray-900">{name}</span>

          {comment.is_event_organizer ? (
            <span className="tw:rounded-full tw:bg-[#16909C] tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-white">
              Host
            </span>
          ) : null}

          {pinned ? (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-[#ded6cd] tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-gray-600">
              <Pin className="tw:h-3 tw:w-3" />
              Pinned
            </span>
          ) : null}

          <span className="tw:text-[11px] tw:text-gray-400">
            {clockLabel(comment.created_at)}
          </span>
        </div>

        {comment.parent ? (
          <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-gray-500">
            <CornerDownRight className="tw:h-3 tw:w-3" />
            Replying to {displayName(comment.parent.user, "a viewer")}
          </div>
        ) : null}

        <div className="tw:mt-1 tw:break-words tw:text-[13.5px] tw:leading-6 tw:text-gray-800">
          {comment.body}
        </div>

        <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-3 tw:text-[11px] tw:text-gray-500">
          <span className="tw:inline-flex tw:items-center tw:gap-1">
            <Heart className="tw:h-3 tw:w-3" />
            {comment.likes_count || 0}
          </span>

          <button
            type="button"
            onClick={() => onReply(comment)}
            className="tw:font-semibold tw:text-gray-500 tw:hover:text-accent-deep"
          >
            Reply
          </button>

          {canModerate ? (
            <span className="tw:flex tw:items-center tw:gap-2 tw:opacity-0 tw:transition-opacity tw:group-hover:opacity-100 tw:focus-within:opacity-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => (pinned ? onUnpin(comment) : onPin(comment))}
                aria-label={pinned ? `Unpin comment from ${name}` : `Pin comment from ${name}`}
                className="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-gray-500 tw:hover:text-accent-deep tw:disabled:opacity-50"
              >
                {pinned ? <PinOff className="tw:h-3 tw:w-3" /> : <Pin className="tw:h-3 tw:w-3" />}
                {pinned ? "Unpin" : "Pin"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(comment)}
                aria-label={`Delete comment from ${name}`}
                className="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-gray-500 tw:hover:text-red-600 tw:disabled:opacity-50"
              >
                <Trash2 className="tw:h-3 tw:w-3" />
                Delete
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Reactions panel: comments + likes + moderation ───────────────────────── */
function LiveChatPanel({
  comments,
  canModerate,
  loading,
  errorText,
  onRetry,
  onSend,
  onPin,
  onUnpin,
  onDelete,
  onReply,
  sending,
  busy,
  realtime,
  viewerCount,
  likesTotal,
  newBelow,
  onJumpToLatest,
  listRef,
  onListScroll,
  replyTo,
  onClearReply,
}) {
  const [draft, setDraft] = useState("");
  const pinnedComment = useMemo(
    () => comments.find((item) => item.is_pinned) || null,
    [comments],
  );

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    const ok = await onSend(body, replyTo?.id || null);
    if (ok) {
      setDraft("");
      onClearReply();
    }
  };

  return (
    <section
      id="live-chat"
      data-console-part="chat"
      className="tw:flex tw:min-h-[520px] tw:flex-col tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-5 tw:shadow-sm tw:xl:h-[calc(100vh-7rem)] tw:xl:max-h-[900px] tw:md:p-6"
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <span className="tw:text-xl tw:font-semibold tw:text-gray-900">Live chat</span>
          <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
            Everything your viewers say, while it happens.
          </p>
        </div>

        <span
          className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-[#ded6cd] tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-600"
          title="Comments"
        >
          <MessageCircle className="tw:h-3.5 tw:w-3.5 tw:text-accent-deep" />
          {comments.length}
        </span>
      </div>

      {pinnedComment && canModerate ? (
        <div className="tw:mt-4 tw:rounded-3xl tw:border tw:border-accent/30 tw:bg-accent-soft tw:p-3">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-accent-deep">
              <Pin className="tw:h-3 tw:w-3" />
              Pinned for viewers
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onUnpin(pinnedComment)}
              className="tw:text-[11px] tw:font-semibold tw:text-gray-500 tw:hover:text-accent-deep tw:disabled:opacity-50"
            >
              Unpin
            </button>
          </div>
          <div className="tw:mt-1.5 tw:break-words tw:text-[13px] tw:leading-6 tw:text-gray-800">
            {pinnedComment.body}
          </div>
        </div>
      ) : null}

      {errorText ? (
        <div className="tw:mt-4 tw:flex tw:items-start tw:gap-2 tw:rounded-3xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3 tw:text-[13px] tw:leading-6 tw:text-amber-800">
          <TriangleAlert className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0" />
          <span className="tw:flex-1">{errorText}</span>
          <button
            type="button"
            onClick={onRetry}
            className="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:hover:underline"
          >
            <RefreshCw className="tw:h-3.5 tw:w-3.5" />
            Retry
          </button>
        </div>
      ) : null}

      <div className="tw:relative tw:mt-4 tw:min-h-0 tw:flex-1">
        <div
          ref={listRef}
          onScroll={onListScroll}
          data-console-part="chat-list"
          className="tw:h-[380px] tw:overflow-y-auto tw:pr-1 tw:xl:h-full"
        >
          {loading ? (
            <div className="tw:flex tw:h-full tw:items-center tw:justify-center tw:gap-2 tw:text-sm tw:text-gray-500">
              <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
              Loading comments
            </div>
          ) : comments.length === 0 ? (
            <div className="tw:flex tw:h-full tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:px-6 tw:text-center">
              <span className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
                <MessageCircle className="tw:h-5 tw:w-5" />
              </span>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                No comments yet
              </div>
              <div className="tw:text-sm tw:leading-6 tw:text-gray-600">
                When viewers comment, they show up here. Anything you reply lands in their
                chat too.
              </div>
            </div>
          ) : (
            <div className="tw:space-y-1">
              {comments.map((comment) => (
                <ChatRow
                  key={comment.id}
                  comment={comment}
                  canModerate={canModerate}
                  busy={busy}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>

        {newBelow ? (
          <button
            type="button"
            onClick={onJumpToLatest}
            className="tw:absolute tw:bottom-2 tw:left-1/2 tw:-translate-x-1/2 tw:rounded-full tw:bg-gray-900 tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-white tw:shadow-lg"
          >
            New comments ↓
          </button>
        ) : null}
      </div>

      {replyTo ? (
        <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:px-3 tw:py-2 tw:text-[12px] tw:text-gray-600">
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:truncate">
            <CornerDownRight className="tw:h-3.5 tw:w-3.5 tw:shrink-0" />
            Replying to {displayName(replyTo.user)}
          </span>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Cancel reply"
            className="tw:text-gray-500 tw:hover:text-gray-900"
          >
            <X className="tw:h-3.5 tw:w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="tw:mt-3 tw:flex tw:items-end tw:gap-2" data-console-part="composer">
        <textarea
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Reply to your viewers…"
          aria-label="Reply to your viewers"
          className="tw:min-h-[48px] tw:max-h-32 tw:flex-1 tw:resize-none tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:text-gray-900 tw:outline-none tw:focus:border-[#16909C]"
        />

        <button
          type="button"
          onClick={submit}
          disabled={sending || !draft.trim()}
          aria-label="Send reply"
          className="tw:inline-flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent tw:text-white tw:transition tw:hover:bg-accent-deep tw:disabled:opacity-50"
        >
          {sending ? (
            <LoaderCircle className="tw:h-5 tw:w-5 tw:animate-spin" />
          ) : (
            <Send className="tw:h-5 tw:w-5" />
          )}
        </button>
      </div>

      <p className="tw:mt-2 tw:text-[11px] tw:text-gray-500">
        {viewerCount} watching · {likesTotal} likes · comments refresh automatically
        {realtime === "subscribed" ? " as they arrive" : " every few seconds"}.
      </p>
    </section>
  );
}

/**
 * Host live console for /event/stream/:eventId — owner-only surface.
 *
 * Player, live counts and reactions in one block so the host never has to scroll
 * between "am I on air", "how many are watching" and "what are they saying".
 * The chat sits beside the player as a rail; the player takes the rest of the
 * width and reconnects by itself.
 *
 * Counts: `live.session.updated` (viewers) and `live.like.toggled` (likes) arrive
 * over `private-live-event.{eventId}` and land instantly; a 5s poll is the floor
 * so nothing is ever stale if the socket is down. Clicking the viewers tile opens
 * the list of who is actually watching.
 *
 * `fixture` renders the identical markup against fixed data with no fetching and
 * no writes — that is what /dev/stream-console-preview uses.
 */
export default function HostLiveConsole({
  eventId,
  token,
  isLive = false,
  isPaused = false,
  hasStartedStream = false,
  playbackUrl = "",
  aspectRatio = "",
  preferHls = true,
  canModerate = true,
  fixture = null,
}) {
  const demo = Boolean(fixture);

  const [comments, setComments] = useState(fixture?.comments || []);
  const [likesTotal, setLikesTotal] = useState(fixture?.likesTotal ?? 0);
  const [viewerCount, setViewerCount] = useState(fixture?.viewerCount ?? 0);
  const [viewers, setViewers] = useState(fixture?.viewers || []);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersError, setViewersError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [errorText, setErrorText] = useState("");
  const [realtime, setRealtime] = useState(fixture?.realtime || "off");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [newBelow, setNewBelow] = useState(false);
  /* Bumped by the realtime guest events so the requests card refreshes at once. */
  const [guestPing, setGuestPing] = useState(0);

  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const viewersOpenRef = useRef(false);
  const lastListFetchRef = useRef(0);

  useEffect(() => {
    viewersOpenRef.current = viewersOpen;
  }, [viewersOpen]);

  const scrollToLatest = useCallback((smooth = false) => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    atBottomRef.current = true;
    setNewBelow(false);
  }, []);

  const handleListScroll = useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    atBottomRef.current = distance < NEAR_BOTTOM_PX;
    if (atBottomRef.current) setNewBelow(false);
  }, []);

  const applyComments = useCallback((incoming) => {
    setComments((previous) => {
      const next = mergeComments(previous, incoming);
      if (next.length > previous.length && !atBottomRef.current) setNewBelow(true);
      return next;
    });
  }, []);

  const loadComments = useCallback(
    async ({ silent = false } = {}) => {
      if (demo || !eventId || !token) return;
      if (!silent) setLoading(true);
      try {
        const response = await api.get(
          `/api/v1/events/${eventId}/live/comments?per_page=50`,
          authHeaders(token),
        );
        applyComments(response?.data?.data || []);
        setErrorText("");
      } catch (error) {
        if (!silent) setErrorText(describeError(error, "Could not load live comments."));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyComments, demo, eventId, token],
  );

  const loadCounts = useCallback(async () => {
    if (demo || !eventId || !token) return;
    const [viewersResult, likesResult] = await Promise.allSettled([
      api.get(`/api/v1/events/${eventId}/live/viewers/count`, authHeaders(token)),
      api.get(`/api/v1/events/${eventId}/live/likes?per_page=1`, authHeaders(token)),
    ]);

    if (viewersResult.status === "fulfilled") {
      const count = viewersResult.value?.data?.data?.viewer_count;
      if (Number.isFinite(Number(count))) setViewerCount(Number(count));
    }
    if (likesResult.status === "fulfilled") {
      const payload = likesResult.value?.data;
      setLikesTotal(Number(payload?.meta?.total ?? payload?.data?.length ?? 0));
    }
  }, [demo, eventId, token]);

  const loadViewers = useCallback(
    async ({ silent = true } = {}) => {
      if (demo || !eventId || !token) return;
      if (!silent) setViewersLoading(true);
      try {
        const response = await api.get(
          `/api/v1/events/${eventId}/live/viewers/list`,
          authHeaders(token),
        );
        const payload = response?.data?.data || {};
        setViewers(Array.isArray(payload.viewers) ? payload.viewers : []);
        setViewersError("");
        lastListFetchRef.current = Date.now();
      } catch (error) {
        if (!silent) setViewersError(describeError(error, "Could not load the viewer list."));
      } finally {
        if (!silent) setViewersLoading(false);
      }
    },
    [demo, eventId, token],
  );

  /* The poll floor: viewers + likes every 5s, comments slower once realtime is
     carrying them, and the viewer list only while its panel is open. */
  useEffect(() => {
    if (demo) return undefined;

    loadComments();
    loadCounts();

    const countsTimer = setInterval(loadCounts, VIEWER_POLL_INTERVAL);
    const commentMs =
      realtime === "subscribed" ? COMMENT_POLL_INTERVAL_WITH_REALTIME : COMMENT_POLL_INTERVAL;
    const commentsTimer = setInterval(() => loadComments({ silent: true }), commentMs);
    const listTimer = setInterval(() => {
      if (viewersOpenRef.current) loadViewers({ silent: true });
    }, VIEWER_LIST_POLL_INTERVAL);

    return () => {
      clearInterval(countsTimer);
      clearInterval(commentsTimer);
      clearInterval(listTimer);
    };
  }, [demo, loadComments, loadCounts, loadViewers, realtime]);

  /* Realtime push over the event's private channel. Degrades to polling. */
  useEffect(() => {
    if (demo) return undefined;

    if (!eventId || !token || !canUseLiveRealtime()) {
      setRealtime("off");
      return undefined;
    }

    setRealtime("connecting");

    const subscription = subscribeToLiveEvent({
      eventId,
      token,
      onComment: (comment) => applyComments([comment]),
      onPinned: (comment) => applyComments([comment]),
      onUnpinned: (comment) => applyComments([{ ...comment, is_pinned: false }]),
      onLike: (payload) => {
        const count = payload?.likes_count ?? payload?.likesCount;
        if (Number.isFinite(Number(count))) setLikesTotal(Number(count));
      },
      onSession: (payload) => {
        const count = payload?.viewer_count ?? payload?.metrics?.viewer_count;
        if (Number.isFinite(Number(count))) setViewerCount(Number(count));
        // Membership changed — refresh the open list, but never faster than the
        // 8s list poll would allow.
        if (viewersOpenRef.current && Date.now() - lastListFetchRef.current > 5000) {
          loadViewers({ silent: true });
        }
      },
      onStatus: (status) => {
        setRealtime(status === "subscribed" ? "subscribed" : status);
      },
      /* A viewer asking to join: refresh the queue now instead of on the next
         poll, and the same for every answer (accepted / declined / left / removed). */
      onGuestRequest: () => setGuestPing((count) => count + 1),
      onGuestChange: () => setGuestPing((count) => count + 1),
    });

    if (!subscription) {
      setRealtime("off");
      return undefined;
    }

    return () => subscription.disconnect();
  }, [applyComments, demo, eventId, loadViewers, token]);

  useLayoutEffect(() => {
    if (comments.length === 0) return;
    if (atBottomRef.current) scrollToLatest();
  }, [comments, scrollToLatest]);

  const handleSend = useCallback(
    async (body, parentId) => {
      if (demo) {
        applyComments([
          {
            id: `local-${Date.now()}`,
            body,
            parent_id: parentId || null,
            is_pinned: false,
            likes_count: 0,
            created_at: new Date().toISOString(),
            created_at_unix: Math.floor(Date.now() / 1000),
            is_event_organizer: true,
            author_role: "organizer",
            user: { id: "preview-host", name: "You", userName: "you" },
          },
        ]);
        return true;
      }

      setSending(true);
      try {
        const response = await api.post(
          `/api/v1/events/${eventId}/live/comments`,
          parentId ? { body, parent_id: parentId } : { body },
          authHeaders(token),
        );
        const created = response?.data?.data;
        if (created?.id) applyComments([created]);
        else await loadComments({ silent: true });
        scrollToLatest(true);
        return true;
      } catch (error) {
        showError(describeError(error, "Could not send that reply."));
        return false;
      } finally {
        setSending(false);
      }
    },
    [applyComments, demo, eventId, loadComments, scrollToLatest, token],
  );

  const runModeration = useCallback(
    async (request, successText) => {
      if (demo) return true;
      setBusy(true);
      try {
        await request();
        showSuccess(successText);
        return true;
      } catch (error) {
        showError(describeError(error, "That action did not go through."));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [demo],
  );

  const handlePin = useCallback(
    async (comment) => {
      const ok = await runModeration(
        () =>
          api.post(
            `/api/v1/events/${eventId}/live/comments/${comment.id}/pin`,
            {},
            authHeaders(token),
          ),
        "Comment pinned for viewers.",
      );
      if (ok) {
        applyComments([{ ...comment, is_pinned: true, pinned_at: new Date().toISOString() }]);
        await loadComments({ silent: true });
      }
    },
    [applyComments, eventId, loadComments, runModeration, token],
  );

  const handleUnpin = useCallback(
    async (comment) => {
      const ok = await runModeration(
        () =>
          api.post(
            `/api/v1/events/${eventId}/live/comments/${comment.id}/unpin`,
            {},
            authHeaders(token),
          ),
        "Comment unpinned.",
      );
      if (ok) {
        applyComments([{ ...comment, is_pinned: false, pinned_at: null }]);
        await loadComments({ silent: true });
      }
    },
    [applyComments, eventId, loadComments, runModeration, token],
  );

  const handleDelete = useCallback(
    async (comment) => {
      if (!demo && !window.confirm("Delete this comment for everyone?")) return;
      setBusy(true);
      try {
        if (!demo) {
          await api.delete(
            `/api/v1/events/${eventId}/live/comments/${comment.id}`,
            authHeaders(token),
          );
        }
        setComments((previous) => previous.filter((item) => item.id !== comment.id));
        if (!demo) showSuccess("Comment deleted.");
      } catch (error) {
        showError(describeError(error, "Could not delete that comment."));
      } finally {
        setBusy(false);
      }
    },
    [demo, eventId, token],
  );

  /* The API's like endpoint ADDS a like (LiveLikeService::like creates rows —
     "toggle" is a misnomer and there is no unlike), so this is a "like" action
     that raises the live total, exactly as viewers' taps do. */
  const handleLike = useCallback(async () => {
    if (demo) {
      setLikesTotal((total) => total + 1);
      return;
    }
    setLikeBusy(true);
    try {
      const response = await api.post(
        `/api/v1/events/${eventId}/live/likes/toggle`,
        { tap_count: 1 },
        authHeaders(token),
      );
      const payload = response?.data?.data || {};
      const count = payload?.likes_count ?? payload?.likesCount;
      if (Number.isFinite(Number(count))) setLikesTotal(Number(count));
      else await loadCounts();
    } catch (error) {
      showError(describeError(error, "Could not register that like."));
    } finally {
      setLikeBusy(false);
    }
  }, [demo, eventId, loadCounts, token]);

  const openViewers = useCallback(() => {
    setViewersOpen(true);
    viewersOpenRef.current = true;
    if (!demo) loadViewers({ silent: false });
  }, [demo, loadViewers]);

  const closeViewers = useCallback(() => {
    setViewersOpen(false);
    viewersOpenRef.current = false;
  }, []);

  return (
    <div
      className="tw:space-y-6"
      id="live-console"
      data-console="host-live-console"
      data-realtime={realtime}
    >
      <LiveStatsStrip
        eventId={eventId}
        viewerCount={viewerCount}
        likesTotal={likesTotal}
        commentsTotal={comments.length}
        realtime={realtime}
        onOpenViewers={openViewers}
        likesBusy={likeBusy}
        onLike={handleLike}
      />

      {/* Player takes the width; chat is a rail beside it and keeps its own
          scroll, so neither pushes the other out of reach. */}
      <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <LivePreviewCard
          playbackUrl={playbackUrl}
          aspectRatio={aspectRatio}
          preferHls={preferHls}
          isLive={isLive}
          isPaused={isPaused}
          hasStartedStream={hasStartedStream}
        />

        <div className="tw:space-y-6 tw:xl:sticky tw:xl:top-4 tw:xl:max-h-[calc(100vh-2rem)] tw:xl:self-start tw:xl:overflow-y-auto tw:xl:pr-1">
          <GuestsPanel
            eventId={eventId}
            token={token}
            refreshSignal={guestPing}
            fixtureRows={
              fixture
                ? {
                    requests: fixture.guestRequests || [],
                    guests: fixture.guests || [],
                  }
                : null
            }
          />

          <LiveChatPanel
            comments={comments}
            canModerate={canModerate}
            loading={loading}
            errorText={errorText}
            onRetry={() => loadComments()}
            onSend={handleSend}
            onPin={handlePin}
            onUnpin={handleUnpin}
            onDelete={handleDelete}
            onReply={setReplyTo}
            sending={sending}
            busy={busy}
            realtime={realtime}
            viewerCount={viewerCount}
            likesTotal={likesTotal}
            newBelow={newBelow}
            onJumpToLatest={() => scrollToLatest(true)}
            listRef={listRef}
            onListScroll={handleListScroll}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </div>
      </div>

      <ViewersPanel
        open={viewersOpen}
        onClose={closeViewers}
        viewerCount={viewerCount}
        viewers={viewers}
        loading={viewersLoading}
        errorText={viewersError}
        onRefresh={() => loadViewers({ silent: false })}
      />
    </div>
  );
}
