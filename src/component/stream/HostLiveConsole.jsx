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

/* Polling cadences, kept inside the backend's own rate limits
   (AppServiceProvider: live-polling 20/min, live-actions 30/min):
   5s comments + 10s viewers = 12 + 6 requests/min, and the comments call only
   polls this fast while realtime is NOT carrying the channel. */
const COMMENT_POLL_INTERVAL = 7000;
const COMMENT_POLL_INTERVAL_WITH_REALTIME = 20000;
const VIEWER_POLL_INTERVAL = 10000;
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
  return String(label || "?")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
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

/* ── Own-stream player ──────────────────────────────────────────────────────
   The host watches back exactly what viewers get. `playbackUrl` is
   `event.stream.playback.hls` from GET /api/v1/events/{id}/streams — the same
   call this page already makes to build its controls. Muted by default (the
   host is the source of the audio) and `controls` stays on so they can unmute. */
function LivePreviewCard({ playbackUrl, isLive, isPaused, hasStartedStream }) {
  const status = isLive ? "Live" : isPaused ? "Paused" : hasStartedStream ? "Ready" : "Off air";
  const tone = isLive
    ? "tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
    : isPaused
      ? "tw:border-amber-200 tw:bg-amber-50 tw:text-amber-800"
      : "tw:border-[#ded6cd] tw:bg-white tw:text-gray-600";

  return (
    <section className="tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
      <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
        <div>
          <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
            Your live preview
          </span>
          <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
            The picture your viewers are watching right now.
          </p>
        </div>

        <span
          className={cx(
            "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold",
            tone,
          )}
        >
          <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-current" />
          {status}
        </span>
      </div>

      <div className="tw:mt-4" data-console-part="player">
        {playbackUrl ? (
          <HlsVideoPlayer src={playbackUrl} autoPlay muted controls />
        ) : (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:rounded-3xl tw:border tw:border-dashed tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:px-6 tw:py-14 tw:text-center">
            <span className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep tw:shadow-sm">
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
    </section>
  );
}

/* ── Live analytics strip ─────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm">
      <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
        <Icon className="tw:h-4 tw:w-4" />
      </span>
      <span className="tw:min-w-0">
        <span className="tw:block tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900">
          {value}
        </span>
        <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-gray-500">
          {label}
        </span>
      </span>
    </div>
  );
}

function LiveStatsStrip({ eventId, viewerCount, likesTotal, commentsTotal, realtime }) {
  return (
    <section
      className="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center"
      data-console-part="stats"
    >
      <div className="tw:grid tw:flex-1 tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-3">
        <StatTile icon={Eye} label="Viewers now" value={viewerCount} />
        <StatTile icon={Heart} label="Likes" value={likesTotal} />
        <StatTile icon={MessageCircle} label="Comments" value={commentsTotal} />
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
              ? "Comments arrive the moment they are sent"
              : "Comments refresh every few seconds"
          }
        >
          <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-current" />
          {/* Deliberately NOT the word "Live": on a page that can read "Off air"
              at the same time, a pill saying "Live" reads as "your event is
              live". This describes the chat connection, not the broadcast. */}
          {realtime === "subscribed" ? "Live updates" : "Refreshing"}
        </span>

        <Link
          to={`/event/analytics/${eventId}`}
          data-console-part="analytics-link"
          /* Deliberately NOT a filled brand button: this repo has an unlayered
             `div a { color }` rule that beats layered Tailwind, so a white label
             on a filled anchor renders near-black-on-dark (invisible). The
             bordered-light pattern is the one EventDetailView's own analytics
             link uses and it measures readable. */
          className="tw:inline-flex tw:h-11 tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-4 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:border-gray-400"
        >
          <BarChart3 className="tw:h-4 tw:w-4 tw:text-accent-deep" />
          View full analytics
        </Link>
      </div>
    </section>
  );
}

/* ── Reactions panel: comments + likes + moderation ───────────────────────── */
function ChatRow({ comment, canModerate, onPin, onUnpin, onDelete, onReply, busy }) {
  const name = displayName(comment.user);
  const avatar = comment.user?.profileUrl || comment.user?.profile_url || "";
  const pinned = Boolean(comment.is_pinned);

  return (
    <div className="tw:group tw:flex tw:gap-3 tw:rounded-3xl tw:px-2 tw:py-2 tw:hover:bg-[#faf8f6]">
      <span className="tw:mt-0.5 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-accent-soft tw:text-[11px] tw:font-bold tw:text-accent-deep">
        {avatar ? (
          <img src={avatar} alt="" className="tw:h-8 tw:w-8 tw:object-cover" />
        ) : (
          initialsOf(name)
        )}
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

          <span className="tw:text-[11px] tw:text-gray-400">{clockLabel(comment.created_at)}</span>
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

function LiveChatPanel({
  eventId,
  comments,
  canModerate,
  loading,
  errorText,
  onRetry,
  onSend,
  onPin,
  onUnpin,
  onDelete,
  sending,
  busy,
  realtime,
  viewerCount,
  likesTotal,
  likedByMe,
  onToggleLike,
  likeBusy,
  newBelow,
  onJumpToLatest,
  listRef,
  onListScroll,
  onReply,
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
      className="tw:flex tw:min-h-[520px] tw:flex-col tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6"
      data-console-part="chat"
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <span className="tw:text-xl tw:font-semibold tw:text-gray-900">Live chat</span>
          <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
            Everything your viewers say, while it happens.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleLike}
          disabled={likeBusy}
          aria-label={likedByMe ? "Remove your like" : "Like this event"}
          className={cx(
            "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition tw:disabled:opacity-60",
            likedByMe
              ? "tw:border-accent tw:bg-accent-soft tw:text-accent-deep"
              : "tw:border-[#ded6cd] tw:bg-white tw:text-gray-600 tw:hover:border-gray-400",
          )}
        >
          <Heart
            className="tw:h-3.5 tw:w-3.5"
            fill={likedByMe ? "currentColor" : "none"}
          />
          {likesTotal}
        </button>
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

      <div className="tw:relative tw:mt-4 tw:flex-1">
        <div
          ref={listRef}
          onScroll={onListScroll}
          data-console-part="chat-list"
          className="tw:h-[380px] tw:overflow-y-auto tw:pr-1 tw:xl:h-[420px]"
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
        {viewerCount} watching now · comments refresh automatically
          {realtime === "subscribed" ? " as they arrive" : " every few seconds"}.
      </p>
    </section>
  );
}

/**
 * Host live console for /event/stream/:eventId — owner-only surface.
 *
 * Player + reactions + live analytics in one block so the host never has to
 * scroll between "am I on air", "what are they saying" and "how many are
 * watching" while broadcasting. Data comes from the existing live endpoints
 * (comments / likes / viewers) plus `private-live-event.{eventId}` for push.
 *
 * `fixture` renders the identical markup against fixed data with no fetching
 * and no writes — that is what the /dev/stream-console-preview route uses to
 * measure this screen at real widths without taking an event live.
 */
export default function HostLiveConsole({
  eventId,
  token,
  isLive = false,
  isPaused = false,
  hasStartedStream = false,
  playbackUrl = "",
  canModerate = true,
  fixture = null,
}) {
  const demo = Boolean(fixture);

  const [comments, setComments] = useState(fixture?.comments || []);
  const [likesTotal, setLikesTotal] = useState(fixture?.likesTotal ?? 0);
  const [likedByMe, setLikedByMe] = useState(Boolean(fixture?.likedByMe));
  const [viewerCount, setViewerCount] = useState(fixture?.viewerCount ?? 0);
  const [loading, setLoading] = useState(!demo);
  const [errorText, setErrorText] = useState("");
  const [realtime, setRealtime] = useState(fixture?.realtime || "off");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [newBelow, setNewBelow] = useState(false);

  const listRef = useRef(null);
  const atBottomRef = useRef(true);

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

  const applyComments = useCallback(
    (incoming) => {
      setComments((previous) => {
        const next = mergeComments(previous, incoming);
        if (next.length > previous.length && !atBottomRef.current) setNewBelow(true);
        return next;
      });
    },
    [],
  );

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

  const loadLikes = useCallback(async () => {
    if (demo || !eventId || !token) return;
    try {
      const response = await api.get(
        `/api/v1/events/${eventId}/live/likes?per_page=500`,
        authHeaders(token),
      );
      const payload = response?.data;
      setLikesTotal(Number(payload?.meta?.total ?? payload?.data?.length ?? 0));
    } catch {
      /* likes are cosmetic here — the strip keeps its last value */
    }
  }, [demo, eventId, token]);

  const loadViewers = useCallback(async () => {
    if (demo || !eventId || !token) return;
    try {
      const response = await api.get(
        `/api/v1/events/${eventId}/live/viewers/count`,
        authHeaders(token),
      );
      const count = response?.data?.data?.viewer_count;
      if (Number.isFinite(Number(count))) setViewerCount(Number(count));
    } catch {
      /* keep the last known count */
    }
  }, [demo, eventId, token]);

  /* Poll — the guaranteed path (works with or without Reverb configured). */
  useEffect(() => {
    if (demo) return undefined;

    loadComments();
    loadLikes();
    loadViewers();

    const commentMs =
      realtime === "subscribed" ? COMMENT_POLL_INTERVAL_WITH_REALTIME : COMMENT_POLL_INTERVAL;
    const commentTimer = setInterval(() => loadComments({ silent: true }), commentMs);
    const viewerTimer = setInterval(loadViewers, VIEWER_POLL_INTERVAL);

    return () => {
      clearInterval(commentTimer);
      clearInterval(viewerTimer);
    };
  }, [demo, loadComments, loadLikes, loadViewers, realtime]);

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
        if (Number.isFinite(Number(payload?.likes_count))) {
          setLikesTotal(Number(payload.likes_count));
        } else {
          loadLikes();
        }
        if (payload?.liked === false && payload?.user) {
          const mine = String(payload.user.id) === String(fixture?.viewerId || "");
          if (mine) setLikedByMe(false);
        }
      },
      onSession: (payload) => {
        const count = payload?.viewer_count ?? payload?.metrics?.viewer_count;
        if (Number.isFinite(Number(count))) setViewerCount(Number(count));
      },
      onStatus: (status) => {
        setRealtime(status === "subscribed" ? "subscribed" : status);
      },
    });

    if (!subscription) {
      setRealtime("off");
      return undefined;
    }

    return () => subscription.disconnect();
  }, [applyComments, demo, eventId, loadLikes, token, fixture?.viewerId]);

  /* Keep the newest comment in view — but never yank the host away from a
     message they scrolled back to read. */
  useLayoutEffect(() => {
    if (comments.length === 0) return;
    if (atBottomRef.current) scrollToLatest();
  }, [comments, scrollToLatest]);

  const handleSend = useCallback(
    async (body, parentId) => {
      if (demo) {
        const localComment = {
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
        };
        applyComments([localComment]);
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
        applyComments([
          { ...comment, is_pinned: true, pinned_at: new Date().toISOString() },
        ]);
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

  const handleToggleLike = useCallback(async () => {
    if (demo) {
      setLikedByMe((current) => {
        setLikesTotal((total) => Math.max(0, total + (current ? -1 : 1)));
        return !current;
      });
      return;
    }

    setLikeBusy(true);
    try {
      const response = await api.post(
        `/api/v1/events/${eventId}/live/likes/toggle`,
        {},
        authHeaders(token),
      );
      const payload = response?.data?.data || {};
      if (Number.isFinite(Number(payload.likes_count))) {
        setLikesTotal(Number(payload.likes_count));
      } else {
        await loadLikes();
      }
      if (typeof payload.liked === "boolean") setLikedByMe(payload.liked);
    } catch (error) {
      showError(describeError(error, "Could not register that like."));
    } finally {
      setLikeBusy(false);
    }
  }, [demo, eventId, loadLikes, token]);

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
      />

      <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <LivePreviewCard
          playbackUrl={playbackUrl}
          isLive={isLive}
          isPaused={isPaused}
          hasStartedStream={hasStartedStream}
        />

        <LiveChatPanel
          eventId={eventId}
          comments={comments}
          canModerate={canModerate}
          loading={loading}
          errorText={errorText}
          onRetry={() => loadComments()}
          onSend={handleSend}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onDelete={handleDelete}
          sending={sending}
          busy={busy}
          realtime={realtime}
          viewerCount={viewerCount}
          likesTotal={likesTotal}
          likedByMe={likedByMe}
          onToggleLike={handleToggleLike}
          likeBusy={likeBusy}
          newBelow={newBelow}
          onJumpToLatest={() => scrollToLatest(true)}
          listRef={listRef}
          onListScroll={handleListScroll}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
