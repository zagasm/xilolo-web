import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  KeyRound,
  LoaderCircle,
  MonitorPlay,
  PauseCircle,
  PlayCircle,
  QrCode,
  Radio,
  RotateCcw,
  Signal,
  ShieldCheck,
  Square,
  Video,
} from "lucide-react";
import SideBarNav from "../pageAssets/SideBarNav";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import {
  showError,
  showPromise,
  showSuccess,
} from "../../component/ui/toast";
import StartStreamAppDownloadModal from "../../component/Events/StartStreamAppDownloadModal";
import HostLiveConsole from "../../component/stream/HostLiveConsole.jsx";
import LiveControlBar from "../../component/stream/LiveControlBar.jsx";
import { formatEventDateTime } from "../../utils/ui";

const cx = (...classes) => classes.filter(Boolean).join(" ");

/* The broadcasting tools we support today, in the order they are offered. Both
   publish the SAME RTMP stream; only the setup path differs. `steps` receives
   the resolved server/key so the copy can embed them (or tell the creator to
   press Start stream first). */
const STREAM_PROVIDERS = [
  {
    id: "obs",
    name: "OBS Studio",
    tagline: "Desktop app",
    blurb: "Free and the most flexible: multiple cameras, screen share, pro audio routing.",
    badge: "Recommended",
    buildSteps: ({ server, key }) => [
      {
        title: "Open OBS Studio",
        description: "Launch OBS Studio on your computer and select the scene you want to stream.",
      },
      {
        title: "Add your video and audio sources",
        description:
          'In the "Sources" panel, click "+" to add your camera, screen capture or media sources, and check the audio mixer.',
      },
      {
        title: "Open Settings → Stream",
        description: 'Click "Settings" in the bottom-right corner of OBS, then choose the "Stream" tab.',
      },
      {
        title: "Paste your stream details",
        description:
          server && key
            ? `Set "Service" to "Custom". Paste ${server} into "Server" and ${key} into "Stream Key".`
            : "Press Start stream above to generate your server and stream key — they appear here immediately.",
      },
      {
        title: "Apply and close",
        description: 'Click "Apply", then "OK" to save the configuration.',
      },
      {
        title: "Check your output settings",
        description:
          'In "Settings" → "Output", use 3500-6000 Kbps for 1080p, keep the keyframe interval at 2 seconds, and a hardware encoder where available.',
      },
      {
        title: "Start streaming, then go live",
        description:
          'Click "Start Streaming" in OBS. Once the encoder is connected, come back here and press "Go Live" so viewers can join.',
      },
    ],
  },
  {
    id: "streamyard",
    name: "StreamYard",
    tagline: "Runs in your browser",
    blurb: "Nothing to install, and easy to bring guests or co-hosts on screen.",
    badge: "",
    buildSteps: ({ server, key }) => [
      {
        title: "Open StreamYard",
        description: "Sign in at streamyard.com and create a broadcast, or open the studio you want to go live from.",
      },
      {
        title: "Add a custom RTMP destination",
        description:
          'Open "Destinations", click "Add a destination" and choose "Custom RTMP" (not YouTube/Facebook — Xilolo is your destination).',
      },
      {
        title: "Paste your stream details",
        description:
          server && key
            ? `Paste ${server} into "RTMP URL" and ${key} into "Stream key", then save the destination.`
            : "Press Start stream above to generate your RTMP URL and stream key — they appear here immediately.",
      },
      {
        title: "Add your camera and guests",
        description: "Invite guests or share your screen, and check that your microphone and camera are picked up in the studio.",
      },
      {
        title: "Go live in StreamYard, then here",
        description:
          'Press "Go Live" in StreamYard. When it reports that it is streaming, come back here and press "Go Live" so viewers can join.',
      },
    ],
  },
];

// The RTMP ingest endpoint is owned by the backend, not by this file. It comes
// back on the stream/credentials payloads as `credentials.rtmp.server` /
// `credentials.rtmp.url` and `stream.rtmp_server` / `stream.rtmp_link` /
// `stream.rtmp_url` (backend: config('streaming.ingest.rtmp'), which resolves
// to the ingest HOSTNAME plus the `live` SRS app — e.g.
// rtmp://ingest.xilolo.com:1935/live). Creators must publish into the `live`
// app or the stream lands in `__defaultApp__` and plays nowhere.
//
// This file previously hardcoded `rtmp://173.199.93.204/live`: a retired raw
// node address, plain rtmp with no TLS, and not the ingest endpoint at all.
// Never reintroduce a literal here — read it from the API response.
function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function resolveStreamKey(event) {
  return firstNonEmptyString(
    event?.credentials?.rtmp?.stream_key,
    event?.stream?.streaming_api?.rtmp_key,
    event?.stream?.streaming_api?.streamKey,
    event?.stream?.rtmp_key,
    event?.stream?.stream_key,
  );
}

// A "server" field must carry only host + app; if a payload ever returns a URL
// that already has the stream key appended, strip it so the key does not end up
// in the OBS Server field as well as the Stream Key field.
function resolveRtmpServer(event) {
  const stream = event?.stream || {};
  const streamingApi = stream?.streaming_api || {};

  const server = firstNonEmptyString(
    event?.credentials?.rtmp?.server,
    stream.rtmp_server,
    streamingApi.rtmp_server,
    stream.rtmp_url,
    stream.rtmp_link,
    event?.credentials?.rtmp?.url,
  ).replace(/\/+$/, "");

  const streamKey = resolveStreamKey(event);

  if (streamKey && server.endsWith(`/${streamKey}`)) {
    return server.slice(0, -(streamKey.length + 1));
  }

  return server;
}

/* The host's own view of what viewers get. Sourced from the SAME streams call
   this page already makes (`GET /events/{id}/streams` ->
   `event.stream.playback.{hls,master,abr}`; verified 2026-10-02 on an event
   with a finished broadcast). Empty until the stream has actually been started,
   which is what makes the console show its "preview appears here" state. */
/* "9:16" / "9x16" -> a CSS aspect-ratio, so a portrait broadcast gets a portrait
   preview box instead of a 16:9 letterbox. Empty when the API has no opinion. */
function resolveAspectRatio(event) {
  const raw = firstNonEmptyString(event?.stream?.aspect_ratio);
  const match = /^\s*(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)\s*$/.exec(raw);
  if (!match) return "";

  return `${match[1]} / ${match[2]}`;
}

function resolvePlaybackUrl(event) {
  const stream = event?.stream || {};
  const playback = stream.playback || {};

  return firstNonEmptyString(
    playback.hls,
    playback.master,
    playback.abr,
    stream.hls_url,
    stream.playback_url,
  );
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  const code = getErrorCode(error);

  if (code === "TICKET_PURCHASE_REQUIRED") {
    return "At least one ticket must be purchased before this event can start streaming.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getErrorCode(error) {
  return (
    error?.response?.data?.code ||
    error?.response?.data?.error_code ||
    error?.code ||
    ""
  );
}

function getEventFromViewResponse(payload) {
  return (
    payload?.data?.currentEvent ||
    payload?.data?.event ||
    payload?.currentEvent ||
    payload?.event ||
    payload?.data ||
    null
  );
}

function getEventFromStreamResponse(payload) {
  if (payload?.event || payload?.data?.event || payload?.data) {
    return payload?.event || payload?.data?.event || payload?.data || null;
  }

  if (payload?.stream) {
    return {
      stream: payload.stream,
      credentials: payload.credentials || null,
      stream_status: payload.stream?.status || null,
      status: payload.stream?.status || null,
    };
  }

  return null;
}

function mergeEventData(baseEvent, streamEvent) {
  if (!baseEvent && !streamEvent) return null;

  return {
    ...(baseEvent || {}),
    ...(streamEvent || {}),
    poster:
      streamEvent?.poster ||
      baseEvent?.poster ||
      [],
    stream: streamEvent?.stream || baseEvent?.stream || null,
    credentials: streamEvent?.credentials || baseEvent?.credentials || null,
    stream_status:
      streamEvent?.stream_status ||
      baseEvent?.stream_status ||
      null,
  };
}

function streamExists(event) {
  return Boolean(
    event?.stream?.id ||
    event?.stream?.stream_key ||
    event?.stream_status ||
    event?.credentials?.rtmp?.stream_key,
  );
}

function hasStreamAccessDetails(event) {
  const stream = event?.stream;
  const streamingApi = stream?.streaming_api;

  // Mirror the fields resolveRtmpServer() reads, so a stream the API describes
  // with `rtmp_link` only (GET /streams) still counts as having credentials.
  // `streaming_api` is a legacy field the backend no longer returns.
  return Boolean(
    event?.credentials?.rtmp?.server ||
    stream?.rtmp_server ||
    streamingApi?.rtmp_server ||
    stream?.rtmp_url ||
    stream?.rtmp_link,
  );
}

function shouldHydrateStartedStream(event) {
  const eventStatus = String(event?.status || "").toLowerCase();
  const streamStatus = String(event?.stream_status || "").toLowerCase();
  const isPaused = eventStatus === "paused" || Boolean(event?.stream?.is_paused);

  if (isPaused) return false;

  return (
    eventStatus === "live" ||
    (streamStatus && streamStatus !== "not_started" && streamStatus !== "ended")
  );
}

function formatStartedAt(value) {
  if (!value) return "Not started yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractPoster(event) {
  return event?.poster?.find?.((item) => item?.type === "image")?.url || "";
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getTicketSalesCount(event) {
  const candidates = [
    event?.ticket_sales_count,
    event?.tickets_sold_count,
    event?.tickets_sold,
    event?.ticketsSold,
    event?.successful_payments_count,
    event?.successfulPayments,
    event?.paid_tickets_count,
    event?.total_tickets_sold,
    event?.sales?.tickets_sold,
    event?.sales?.ticketsSold,
    event?.ticket_sales?.count,
    event?.ticket_sales?.tickets_sold,
    event?.stats?.tickets_sold,
    event?.stats?.ticket_sales_count,
    event?.payments?.successful_count,
  ];

  for (const candidate of candidates) {
    const parsed = toFiniteNumber(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();

  if (value === "live") return "tw:bg-red-50 tw:text-red-700 tw:border-red-200";
  if (value === "paused")
    return "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200";
  if (value === "ended")
    return "tw:bg-gray-100 tw:text-gray-700 tw:border-gray-200";

  return "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-200";
}

function DetailCard({
  icon: Icon,
  label,
  value,
  helperText,
  onCopy,
  copied,
  children,
}) {
  return (
    <div className="tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4 tw:shadow-sm">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-gray-700">
          <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-lightPurple tw:text-primary">
            <Icon className="tw:h-4 tw:w-4" />
          </span>
          <span>{label}</span>
        </div>

        {onCopy ? (
          <button
            style={{ borderRadius: 20, fontSize: 12 }}
            type="button"
            onClick={() => onCopy?.(value, label)}
            className="tw:inline-flex tw:h-10 tw:min-w-[88px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:px-3 tw:text-primary tw:hover:bg-white"
            aria-label={`Copy ${label}`}
          >
            <Copy className="tw:h-4 tw:w-4" />
            <span className="tw:text-xs tw:font-semibold">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        ) : null}
      </div>

      {children ? (
        <div className="tw:mt-4">{children}</div>
      ) : (
        <div className="tw:mt-4 tw:break-all tw:text-sm tw:font-semibold tw:text-gray-900">
          {value || "Will appear after you start the stream."}
        </div>
      )}

      {helperText ? (
        <div className="tw:mt-2 tw:text-xs tw:text-gray-500">{helperText}</div>
      ) : null}
    </div>
  );
}

function StepItem({ index, title, description }) {
  return (
    <div className="tw:flex tw:gap-4">
      <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-sm tw:font-semibold tw:text-white">
        {index}
      </div>

      <div>
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {title}
        </div>
        <div className="tw:mt-1 tw:text-sm tw:leading-6 tw:text-gray-600">
          {description}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  loading,
  disabled,
  className,
  icon: Icon,
}) {
  return (
    <button
      style={{
        fontSize: 12,
        borderRadius: 20,
      }}
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        "tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:transition tw:disabled:cursor-not-allowed tw:disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
      ) : Icon ? (
        <Icon className="tw:h-4 tw:w-4" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

function CheckinAccessPanel({
  accessList,
  stats,
  loading,
  generatedCode,
  copiedLabel,
  onGenerate,
  onRotate,
  onRevoke,
  onCopy,
  pendingAction,
}) {
  const activeAccess =
    accessList.find((access) => access.is_active && !access.revoked_at) ||
    accessList[0] ||
    null;

  const activeSessions = stats?.active_sessions ?? activeAccess?.active_sessions_count ?? 0;

  return (
    <section className="tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
      <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-start tw:lg:justify-between">
        <div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <ShieldCheck className="tw:h-5 tw:w-5 tw:text-primary" />
            <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
              Ticket check-in access
            </span>
          </div>
          <p className="tw:mt-1 tw:max-w-2xl tw:text-sm tw:leading-6 tw:text-gray-600">
            Generate a check-in code for gate staff without sharing your organiser login.
          </p>
        </div>

        <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row">
          <ActionButton
            onClick={onGenerate}
            loading={pendingAction === "checkin-generate"}
            className="tw:bg-primary tw:text-white tw:hover:bg-primary/90"
            icon={QrCode}
          >
            Generate code
          </ActionButton>

          {activeAccess ? (
            <ActionButton
              onClick={() => onRotate(activeAccess)}
              loading={pendingAction === "checkin-rotate"}
              className="tw:bg-lightPurple tw:text-primary tw:hover:bg-[#e2d9ce]"
              icon={RotateCcw}
            >
              Rotate
            </ActionButton>
          ) : null}
        </div>
      </div>

      {generatedCode ? (
        <div className="tw:mt-5 tw:rounded-3xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:p-4">
          <div className="tw:text-sm tw:font-semibold tw:text-emerald-900">
            Copy this code now. It will not be shown again.
          </div>
          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
            <code className="tw:break-all tw:text-base tw:font-black tw:text-emerald-950">
              {generatedCode}
            </code>
            <button
              type="button"
              onClick={() => onCopy(generatedCode, "Check-in Code")}
              className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:text-sm tw:font-semibold tw:text-white"
            >
              <Copy className="tw:h-4 tw:w-4" />
              {copiedLabel === "Check-in Code" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="tw:mt-5 tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4">
        <div className="tw:rounded-3xl tw:bg-white tw:p-4">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-gray-500">
            Sold
          </div>
          <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900">
            {stats?.tickets_sold ?? 0}
          </div>
        </div>
        <div className="tw:rounded-3xl tw:bg-white tw:p-4">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-gray-500">
            Checked in
          </div>
          <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900">
            {stats?.checked_in ?? 0}
          </div>
        </div>
        <div className="tw:rounded-3xl tw:bg-white tw:p-4">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-gray-500">
            Remaining
          </div>
          <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900">
            {stats?.remaining ?? 0}
          </div>
        </div>
        <div className="tw:rounded-3xl tw:bg-white tw:p-4">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-gray-500">
            Sessions
          </div>
          <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900">
            {activeSessions}
          </div>
        </div>
      </div>

      <div className="tw:mt-5 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4">
        {loading ? (
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-gray-600">
            <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
            Loading check-in access
          </div>
        ) : activeAccess ? (
          <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                <span
                  className={cx(
                    "tw:rounded-full tw:px-3 tw:py-1 tw:text-xs tw:font-bold",
                    activeAccess.is_active
                      ? "tw:bg-emerald-100 tw:text-emerald-700"
                      : "tw:bg-red-100 tw:text-red-700",
                  )}
                >
                  {activeAccess.is_active ? "Active" : "Inactive"}
                </span>
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {activeAccess.label || "Event check-in code"}
                </span>
              </div>
              <div className="tw:mt-2 tw:text-sm tw:leading-6 tw:text-gray-600">
                Last four: {activeAccess.plain_code_last_four || "----"} · Last used:{" "}
                {activeAccess.last_used_at
                  ? new Date(activeAccess.last_used_at).toLocaleString()
                  : "Never"}{" "}
                · Expires:{" "}
                {activeAccess.expires_at
                  ? new Date(activeAccess.expires_at).toLocaleString()
                  : "No expiry"}
              </div>
            </div>

            {activeAccess.is_active ? (
              <button
                type="button"
                onClick={() => onRevoke(activeAccess)}
                disabled={pendingAction === "checkin-revoke"}
                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-red-200 tw:px-4 tw:text-sm tw:font-semibold tw:text-red-700 tw:hover:bg-red-50 tw:disabled:opacity-60"
              >
                {pendingAction === "checkin-revoke" ? (
                  <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
                ) : null}
                Revoke
              </button>
            ) : null}
          </div>
        ) : (
          <div className="tw:text-sm tw:leading-6 tw:text-gray-600">
            No check-in access code has been generated for this event yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default function EventStreamControlPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState("");
  const [stageOverride, setStageOverride] = useState("");
  const [closeTicketSalesOnGoLive, setCloseTicketSalesOnGoLive] = useState(false);
  const [checkinAccessList, setCheckinAccessList] = useState([]);
  const [checkinStats, setCheckinStats] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [generatedCheckinCode, setGeneratedCheckinCode] = useState("");
  const copyTimeoutRef = useRef(null);

  const loadEventDetails = useCallback(
    async ({ background = false } = {}) => {
      if (!eventId) return;

      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const viewResult = await api.get(
          `/api/v1/events/${eventId}/view`,
          authHeaders(token),
        );
        const viewPayload = viewResult?.data;

        let merged = getEventFromViewResponse(viewPayload);

        if (merged) {
          const streamResult = await api.get(
            `/api/v1/events/${eventId}/streams`,
            authHeaders(token),
          );

          merged = mergeEventData(
            merged,
            getEventFromStreamResponse(streamResult?.data),
          );

          if (
            shouldHydrateStartedStream(merged) &&
            !hasStreamAccessDetails(merged) &&
            !streamExists(merged)
          ) {
            const startResult = await api.post(
              `/api/v1/events/${eventId}/streams/start`,
              {},
              authHeaders(token),
            );

            merged = mergeEventData(
              merged,
              getEventFromStreamResponse(startResult?.data),
            );
          }
        }

        if (!merged) {
          throw new Error("Could not load stream details for this event.");
        }

        setEventData((currentEvent) => mergeEventData(currentEvent, merged));
      } catch (err) {
        setError(getErrorMessage(err, "Could not load this stream page."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, token],
  );

  const loadCheckinData = useCallback(async () => {
    if (!eventId || !token) return;

    setCheckinLoading(true);
    try {
      const [accessResponse, statsResponse] = await Promise.all([
        api.get(`/api/v1/events/${eventId}/checkin-access`, authHeaders(token)),
        api.get(`/api/v1/events/${eventId}/checkin-stats`, authHeaders(token)),
      ]);

      setCheckinAccessList(accessResponse?.data?.data || []);
      setCheckinStats(statsResponse?.data?.data || null);
    } catch (err) {
      showError(getErrorMessage(err, "Could not load check-in access."));
    } finally {
      setCheckinLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const stream = eventData?.stream || {};
  const credentials = eventData?.credentials || {};
  const rtmpCredentials = credentials?.rtmp || {};
  const streamingApi = stream?.streaming_api || {};

  const status = String(eventData?.status || "upcoming").toLowerCase();
  const isLive = status === "live";
  const isPaused = status === "paused" || !!stream?.is_paused;
  const isExpired = status === "expired";
  const isEnded = status === "ended" || isExpired;
  const hasStartedStream = Boolean(
    stream?.id ||
    stream?.stream_key ||
    rtmpCredentials?.stream_key ||
    rtmpCredentials?.url ||
    streamingApi?.streamKey ||
    stream?.rtmp_url ||
    streamingApi?.rtmp_server,
  );

  const shouldShowStreamDetails = hasStartedStream && !isEnded;
  // Server AND key are read from the API response (see resolveRtmpServer /
  // resolveStreamKey above). There is deliberately no hardcoded fallback host:
  // a wrong server is worse than none, because creators publish into it and it
  // silently fails.
  /* Which tool the creator broadcasts with. Founders' ask (2026-09-30): the
     screen assumed OBS everywhere ("OBS details", "How to stream this event
     using OBS Studio") even though Xilolo accepts any RTMP encoder, so the
     copy now names the chosen tool and the steps switch with it. The stream
     itself is identical either way — same server, same key, same SRS app. */
  const [streamProvider, setStreamProvider] = useState("obs");

  const rtmpServer = shouldShowStreamDetails ? resolveRtmpServer(eventData) : "";
  const rtmpKey = shouldShowStreamDetails ? resolveStreamKey(eventData) : "";
  const isPreLiveStage =
    hasStartedStream && !isEnded && stageOverride === "started";
  const showGoLive =
    hasStartedStream && !isEnded && (isPreLiveStage || (!isLive && !isPaused));
  const showPause =
    hasStartedStream &&
    !isEnded &&
    !isPreLiveStage &&
    (isLive || isPaused || stageOverride === "live");
  const showEnd = hasStartedStream && !isEnded;
  const showWatch = hasStartedStream && !isEnded;
  /* The console (own preview + reactions + live numbers) is for events that can
     still broadcast: a host waiting to start sees the shape of the room and the
     preview fills in the moment the feed is up. Expired/ended events keep the
     existing screens — there is nothing to watch back there. */
  const playbackUrl = resolvePlaybackUrl(eventData);
  const streamAspectRatio = resolveAspectRatio(eventData);
  const showLiveConsole = !isEnded && !isExpired;
  /* Sticky while broadcasting: pause/resume, end, chat and analytics stay in
     reach no matter how far down the page the host has scrolled. */
  const showStickyControls = hasStartedStream && !isEnded && (isLive || isPaused);
  const ticketSalesCount = getTicketSalesCount(eventData);
  const hasKnownTicketSalesCount = ticketSalesCount !== null;
  const streamStartRequiresTicketPurchase =
    hasKnownTicketSalesCount && ticketSalesCount <= 0;
  const ticketSalesClosed = Boolean(eventData?.ticket_sales_closed);
  const ticketGateMessage =
    "At least one ticket must be purchased before this event can start streaming.";
  const expiredEventMessage =
    "This event has expired and can no longer be started or taken live.";

  const handleCopy = async (value, label) => {
    if (!value) {
      showError(`No ${label.toLowerCase()} available yet.`);
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedLabel(label);
      // showSuccess(`${label} copied to clipboard.`);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopiedLabel("");
      }, 900);
    } catch {
      showError(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const handleGenerateCheckinAccess = async () => {
    setPendingAction("checkin-generate");
    try {
      const response = await api.post(
        `/api/v1/events/${eventId}/checkin-access`,
        { label: "Event check-in" },
        authHeaders(token),
      );
      setGeneratedCheckinCode(response?.data?.data?.access_code || "");
      showSuccess("Check-in code generated.");
      await loadCheckinData();
    } catch (err) {
      showError(getErrorMessage(err, "Could not generate check-in code."));
    } finally {
      setPendingAction("");
    }
  };

  const handleRotateCheckinAccess = async (access) => {
    const confirmed = window.confirm(
      "Rotate this check-in code? Existing staff sessions using this code will be revoked.",
    );

    if (!confirmed) return;

    setPendingAction("checkin-rotate");
    try {
      const response = await api.post(
        `/api/v1/events/${eventId}/checkin-access/${access.id}/rotate`,
        {},
        authHeaders(token),
      );
      setGeneratedCheckinCode(response?.data?.data?.access_code || "");
      showSuccess("Check-in code rotated.");
      await loadCheckinData();
    } catch (err) {
      showError(getErrorMessage(err, "Could not rotate check-in code."));
    } finally {
      setPendingAction("");
    }
  };

  const handleRevokeCheckinAccess = async (access) => {
    const confirmed = window.confirm(
      "Revoke this check-in code? Active staff scanner sessions will stop working.",
    );

    if (!confirmed) return;

    setPendingAction("checkin-revoke");
    try {
      await api.patch(
        `/api/v1/events/${eventId}/checkin-access/${access.id}/revoke`,
        {},
        authHeaders(token),
      );
      setGeneratedCheckinCode("");
      showSuccess("Check-in access revoked.");
      await loadCheckinData();
    } catch (err) {
      showError(getErrorMessage(err, "Could not revoke check-in access."));
    } finally {
      setPendingAction("");
    }
  };

  const activeProvider =
    STREAM_PROVIDERS.find((provider) => provider.id === streamProvider) ||
    STREAM_PROVIDERS[0];

  const instructionSteps = useMemo(
    () =>
      activeProvider.buildSteps({ server: rtmpServer, key: rtmpKey }),
    [activeProvider, rtmpKey, rtmpServer],
  );

  const runAction = async ({
    key,
    request,
    loadingText,
    successText,
  }) => {
    setPendingAction(key);

    try {
      const response = await showPromise(request(), {
        loading: loadingText,
        success: successText,
        error: (err) => getErrorMessage(err),
      });

      const responsePayload = response?.data;
      const streamEvent = getEventFromStreamResponse(responsePayload);

      if (streamEvent) {
        setEventData((currentEvent) => mergeEventData(currentEvent, streamEvent));
      }

      await loadEventDetails({ background: true });
    } finally {
      setPendingAction("");
    }
  };

  const handleStart = async () => {
    if (isExpired) {
      showError(expiredEventMessage);
      return;
    }

    if (streamStartRequiresTicketPurchase) {
      showError(ticketGateMessage);
      return;
    }

    await runAction({
      key: "start",
      request: () =>
        api.post(`/api/v1/events/${eventId}/streams/start`, {}, authHeaders(token)),
      loadingText: "Generating stream credentials…",
      successText: "Stream details ready. Configure your streaming tool, then go live.",
    });
  };

  const handleGoLive = async () => {
    if (isExpired) {
      showError(expiredEventMessage);
      return;
    }

    if (streamStartRequiresTicketPurchase) {
      showError(ticketGateMessage);
      return;
    }

    const payload = closeTicketSalesOnGoLive
      ? { close_ticket_sales: true }
      : {};

    setStageOverride("live");
    try {
      await runAction({
        key: "go-live",
        request: () =>
          api.post(
            `/api/v1/events/${eventId}/streams/go-live`,
            payload,
            authHeaders(token),
          ),
        loadingText: "Taking event live…",
        successText: closeTicketSalesOnGoLive
          ? "Event is now live. Ticket sales are closed."
          : "Event is now live.",
      });
    } catch (error) {
      setStageOverride("started");
      throw error;
    }
  };

  const handleTogglePause = () =>
    runAction({
      key: "pause",
      request: () =>
        api.post(
          `/api/v1/events/${eventId}/streams/toggle-pause`,
          {},
          authHeaders(token),
        ),
      loadingText: isPaused ? "Resuming event…" : "Pausing event…",
      successText: isPaused ? "Event resumed." : "Event paused.",
    });

  const handleEnd = async () => {
    const confirmed = window.confirm(
      "End this stream? Viewers will no longer be able to watch it live.",
    );

    if (!confirmed) return;

    await runAction({
      key: "end",
      request: () =>
        api.post(`/api/v1/events/${eventId}/streams/end`, {}, authHeaders(token)),
      loadingText: "Ending stream…",
      successText: "Stream ended.",
    });
    setStageOverride("");
  };

  if (loading) {
    return (
      <div className="tw:px-3 tw:py-6 tw:md:px-6">
        <div className="col-md-12 col-lg-10 col-xl-10 tw:lg:ml-30 tw:py-24">
          <div className="tw:animate-pulse tw:space-y-4">
            <div className="tw:h-10 tw:w-64 tw:rounded-2xl tw:bg-gray-200" />
            <div className="tw:h-56 tw:rounded-4xl tw:bg-gray-200" />
            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2">
              <div className="tw:h-64 tw:rounded-4xl tw:bg-gray-200" />
              <div className="tw:h-64 tw:rounded-4xl tw:bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="row tw:px-3 tw:py-6 tw:md:px-6">
        <div className="col-md-1 col-lg-2 col-xl-2 tw:hidden tw:lg:block">
          <SideBarNav />
        </div>

        <div className="col-md-12 col-lg-10 col-xl-10 tw:lg:ml-30 tw:py-24">
          <div className="tw:rounded-4xl tw:border tw:border-red-100 tw:bg-red-50 tw:p-6 tw:text-red-700">
            <div className="tw:text-lg tw:font-semibold">
              Could not load stream details
            </div>
            <div className="tw:mt-2 tw:text-sm">{error}</div>
            <div className="tw:mt-4">
              <button
                type="button"
                onClick={() => loadEventDetails()}
                className="tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-white"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const posterUrl = extractPoster(eventData);
  const formattedDate = formatEventDateTime(
    eventData?.eventDateISO || eventData?.date || eventData?.eventDate,
    eventData?.startTime || eventData?.time || "",
  );
  return (
    <>
      <div className="tw:px-3 tw:py-4 tw:md:px-6">
        {/* <div className="col-md-1 col-lg-2 col-xl-2 tw:hidden tw:lg:block">
          <SideBarNav />
        </div> */}

        <div className="col-md-12 col-lg-10 col-xl-10 tw:lg:ml-30 tw:py-24">
          <div className="tw:mx-auto tw:max-w-[1240px] tw:space-y-6 tw:2xl:max-w-[1520px]">
            <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-gray-500 tw:hover:text-gray-900"
                >
                  <ArrowLeft className="tw:h-4 tw:w-4" />
                  <span>Back</span>
                </button>

                <span className="tw:mt-3 tw:text-2xl tw:md:text-3xl tw:font-bold tw:text-gray-900 tw:block">
                  Stream Event
                </span>
                <p className="tw:mt-2 tw:max-w-2xl tw:text-sm tw:text-gray-600 tw:md:text-base">
                  {status === "expired"
                    ? "This event expired because it did not go live. Streaming controls and setup are no longer available."
                    : isEnded
                      ? "This event has ended. Streaming controls and setup are no longer available for this session."
                    : "Start the stream to generate your stream credentials, then switch the event live when you are ready for viewers."}
                </p>
              </div>

              <div className="tw:flex tw:items-center tw:gap-3 tw:self-start tw:lg:self-auto">
                <span
                  className={cx(
                    "tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-4 tw:py-2 tw:text-sm tw:font-semibold",
                    getStatusTone(status),
                  )}
                >
                  <span className="tw:h-2.5 tw:w-2.5 tw:rounded-full tw:bg-current" />
                  {status === "paused" ? "Paused" : status === "live" ? "Live" : status === "ended" ? "Ended" : status === "expired" ? "Expired" : status === "ready_to_go_live" ? "Ready to go live" : "Upcoming"}
                </span>

                {refreshing ? (
                  <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:text-gray-500">
                    <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
                    Refreshing
                  </span>
                ) : null}
              </div>
            </div>

            {/* ── Host live console (founder's brief, 2026-09-30) ─────────────
                While the host is broadcasting nothing may scroll out of reach:
                the sticky bar keeps Pause / End / Chat / Analytics pinned, and
                the console below holds the own-stream preview, the live numbers
                and the reactions panel. Measured before/after 2026-10-02. */}
            {showStickyControls ? (
              <LiveControlBar
                statusTone={getStatusTone(status)}
                isPaused={isPaused}
                showPause={showPause}
                showEnd={showEnd}
                pendingAction={pendingAction}
                onTogglePause={handleTogglePause}
                onEnd={handleEnd}
                onJumpToChat={() =>
                  document
                    .getElementById("live-chat")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                onOpenAnalytics={() => navigate(`/event/analytics/${eventId}`)}
              />
            ) : null}

            {showLiveConsole ? (
              <HostLiveConsole
                eventId={eventId}
                token={token}
                isLive={isLive}
                isPaused={isPaused}
                hasStartedStream={hasStartedStream}
                playbackUrl={playbackUrl}
                aspectRatio={streamAspectRatio}
              />
            ) : null}

            {isEnded ? (
              <section className="tw:overflow-hidden tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-[linear-gradient(135deg,#ffffff_0%,#e5e4e2_52%,#e5e4e2_100%)] tw:p-6 tw:shadow-sm tw:md:p-8">
                <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white/90 tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-700 tw:shadow-sm">
                      <CheckCircle2 className="tw:h-4 tw:w-4 tw:text-primary" />
                      Broadcast complete
                    </div>

                    <span className="tw:block tw:mt-5 tw:text-2xl tw:font-semibold tw:text-gray-900 tw:md:text-3xl">
                      This live session has ended
                    </span>
                    <p className="tw:mt-3 tw:max-w-2xl tw:text-sm tw:leading-7 tw:text-gray-600 tw:md:text-base">
                      Stream connection details, stream controls, and setup instructions are hidden because this event is no longer active. If you need help reviewing what happened or have feedback about the streaming experience, contact{" "}
                      <a
                        href="mailto:support@xilolo.com"
                        className="tw:font-semibold tw:text-primary tw:hover:underline"
                      >
                        support@xilolo.com
                      </a>
                      .
                    </p>

                    <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-3">
                      <div className="tw:rounded-3xl tw:border tw:border-white/80 tw:bg-white/90 tw:p-4">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900">
                          <CalendarDays className="tw:h-4 tw:w-4 tw:text-primary" />
                          Event date
                        </div>
                        <div className="tw:mt-2 tw:text-sm tw:leading-6 tw:text-gray-600">
                          {formattedDate || "Date not available"}
                        </div>
                      </div>

                      <div className="tw:rounded-3xl tw:border tw:border-white/80 tw:bg-white/90 tw:p-4">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900">
                          <Signal className="tw:h-4 tw:w-4 tw:text-primary" />
                          Final status
                        </div>
                        <div className="tw:mt-2 tw:text-sm tw:leading-6 tw:text-gray-600">
                          Ended
                        </div>
                      </div>

                      <div className="tw:rounded-3xl tw:border tw:border-white/80 tw:bg-white/90 tw:p-4">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900">
                          <Video className="tw:h-4 tw:w-4 tw:text-primary" />
                          Event title
                        </div>
                        <div className="tw:mt-2 tw:text-sm tw:leading-6 tw:text-gray-600">
                          {eventData?.title || "Untitled event"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="tw:rounded-[28px] tw:border tw:border-white/80 tw:bg-white/90 tw:p-5 tw:shadow-sm tw:md:p-6">
                    <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                      Need anything after the event?
                    </div>
                    <div className="tw:mt-3 tw:space-y-3 tw:text-sm tw:leading-7 tw:text-gray-600">
                      <p>Share any issues you noticed during setup, broadcast, or wrap-up.</p>
                      <p>Include the event title and what happened so support can investigate faster.</p>
                      <p>
                        Email{" "}
                        <a
                          href="mailto:support@xilolo.com"
                          className="tw:font-semibold tw:text-primary tw:hover:underline"
                        >
                          support@xilolo.com
                        </a>
                        {" "}if you need help.
                      </p>
                    </div>
                  </aside>
                </div>
              </section>
            ) : (
              <>
                <div className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-[1.1fr_0.9fr]">
                  <section>
                    <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-end tw:md:justify-between">
                      <div>
                        <span className="tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-gray-900">
                          Stream details
                        </span>
                        <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
                          Start the stream first, then paste these into your streaming tool.
                        </p>
                      </div>
                    </div>

                    <div className="tw:mt-6">
                      <DetailCard
                        icon={KeyRound}
                        label="RTMP Server and Stream Key"
                        helperText="Both StreamYard (custom RTMP) and OBS (Service: Custom) use exactly these two values."
                      >
                        <div className="tw:space-y-4">
                          <div>
                            <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-gray-500">
                              RTMP Server
                            </div>
                            <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
                              <div className="tw:break-all tw:text-sm tw:font-semibold tw:text-gray-900">
                                {rtmpServer || "Will appear after you start the stream."}
                              </div>
                              <button
                                style={{ borderRadius: 20, fontSize: 12 }}
                                type="button"
                                onClick={() => handleCopy(rtmpServer, "RTMP Server")}
                                className="tw:inline-flex tw:h-10 tw:min-w-[88px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:px-3 tw:text-primary tw:hover:bg-white"
                                aria-label="Copy RTMP Server"
                              >
                                <Copy className="tw:h-4 tw:w-4" />
                                <span className="tw:text-xs tw:font-semibold">
                                  {copiedLabel === "RTMP Server" ? "Copied" : "Copy"}
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="tw:border-t tw:border-[#f0ebff] tw:pt-4">
                            <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-gray-500">
                              Stream Key
                            </div>
                            <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
                              <div className="tw:break-all tw:text-sm tw:font-semibold tw:text-gray-900">
                                {rtmpKey || "Will appear after you start the stream."}
                              </div>
                              <button
                                style={{ borderRadius: 20, fontSize: 12 }}
                                type="button"
                                onClick={() => handleCopy(rtmpKey, "Stream Key")}
                                className="tw:inline-flex tw:h-10 tw:min-w-[88px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:px-3 tw:text-primary tw:hover:bg-white"
                                aria-label="Copy Stream Key"
                              >
                                <Copy className="tw:h-4 tw:w-4" />
                                <span className="tw:text-xs tw:font-semibold">
                                  {copiedLabel === "Stream Key" ? "Copied" : "Copy"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </DetailCard>
                    </div>
                  </section>

                  <aside className="tw:rounded-4xl tw:border tw:border-[#ede7ff] tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                      <div>
                        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                          Stream actions
                        </div>
                        <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
                          Start the stream, switch live, pause, resume, or end it from here.
                        </div>
                      </div>
                    </div>

                    {(isExpired || streamStartRequiresTicketPurchase || ticketSalesClosed || showGoLive) ? (
                      <div className="tw:mt-5 tw:space-y-3">
                        {isExpired ? (
                          <div className="tw:rounded-3xl tw:border tw:border-red-200 tw:bg-red-50 tw:p-4 tw:text-sm tw:leading-6 tw:text-red-700">
                            {expiredEventMessage}
                          </div>
                        ) : null}

                        {streamStartRequiresTicketPurchase ? (
                          <div className="tw:rounded-3xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-4 tw:text-sm tw:leading-6 tw:text-amber-800">
                            {ticketGateMessage}
                          </div>
                        ) : null}

                        {ticketSalesClosed ? (
                          <div className="tw:rounded-3xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:p-4 tw:text-sm tw:leading-6 tw:text-emerald-800">
                            Ticket sales are closed for new buyers. Existing ticket holders still keep access.
                          </div>
                        ) : null}

                        {showGoLive && !ticketSalesClosed && !streamStartRequiresTicketPurchase ? (
                          <label className="tw:flex tw:items-start tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4">
                            <input
                              type="checkbox"
                              checked={closeTicketSalesOnGoLive}
                              onChange={(event) =>
                                setCloseTicketSalesOnGoLive(event.target.checked)
                              }
                              className="tw:mt-1 tw:h-4 tw:w-4 tw:accent-primary"
                            />
                            <span>
                              <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-900">
                                Close ticket sales
                              </span>
                              <span className="tw:mt-1 tw:block tw:text-sm tw:leading-6 tw:text-gray-600">
                                New users will not be able to buy tickets after the event goes live. Existing ticket holders keep their tickets.
                              </span>
                            </span>
                          </label>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
                      {!hasStartedStream && !isExpired ? (
                        <ActionButton
                          onClick={async () => {
                            setStageOverride("started");
                            try {
                              await handleStart();
                            } catch (error) {
                              setStageOverride("");
                              throw error;
                            }
                          }}
                          loading={pendingAction === "start"}
                          disabled={isExpired || streamStartRequiresTicketPurchase}
                          className="tw:bg-primary tw:text-white tw:hover:bg-primary/90"
                          icon={Radio}
                        >
                          Start stream
                        </ActionButton>
                      ) : null}

                      {showGoLive ? (
                        <ActionButton
                          onClick={handleGoLive}
                          loading={pendingAction === "go-live"}
                          disabled={isExpired || streamStartRequiresTicketPurchase}
                          className="tw:bg-red-500 tw:text-white tw:hover:bg-red-600"
                          icon={PlayCircle}
                        >
                          Go live
                        </ActionButton>
                      ) : null}

                      {showPause ? (
                        <ActionButton
                          onClick={handleTogglePause}
                          loading={pendingAction === "pause"}
                          className="tw:bg-lightPurple tw:text-primary tw:hover:bg-[#e2d9ce]"
                          icon={PauseCircle}
                        >
                          {isPaused ? "Resume stream" : "Pause stream"}
                        </ActionButton>
                      ) : null}

                      {showEnd ? (
                        <ActionButton
                          onClick={handleEnd}
                          loading={pendingAction === "end"}
                          className="tw:bg-gray-900 tw:text-white tw:hover:bg-black"
                          icon={Square}
                        >
                          End stream
                        </ActionButton>
                      ) : null}

                      {showWatch ? (
                        <ActionButton
                          onClick={() => setWatchModalOpen(true)}
                          className="tw:bg-[#fff4f2] tw:text-[#d93a23] tw:hover:bg-[#ffe9e4]"
                          icon={MonitorPlay}
                        >
                          Join live
                        </ActionButton>
                      ) : null}
                    </div>

                    <div className="tw:mt-5 tw:rounded-3xl tw:bg-white tw:p-4">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-900">
                        <CheckCircle2 className="tw:h-4 tw:w-4 tw:text-primary" />
                        What to do next
                      </div>

                      <div className="tw:mt-3 tw:text-sm tw:leading-7 tw:text-gray-600">
                        {!hasStartedStream
                          ? "Use Start stream to generate the RTMP server and stream key. Your stream details will appear here immediately after."
                          : isLive
                            ? "Your event is live. You can pause it temporarily, let viewers join, or end it when the broadcast is over."
                            : isPaused
                              ? "The event is currently paused. Resume it when you are ready for viewers to continue watching."
                              : "Stream details are ready. Start broadcasting, then press Go Live here when the feed is stable."}
                      </div>
                    </div>
                  </aside>
                </div>

                <section className="tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-5 tw:shadow-sm tw:md:p-6">
                  <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                    <div>
                      <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
                        How to stream this event
                      </span>
                      <p className="tw:mt-1 tw:text-sm tw:text-gray-600">
                        Pick the tool you will broadcast with, then follow its steps. The stream details are the same for both.
                      </p>
                    </div>

                  </div>

                  {/* ── Which tool? (founder, 2026-09-30) ────────────────────
                      Xilolo accepts any RTMP encoder, so the screen asks instead
                      of assuming OBS. Both options publish the SAME stream; only
                      the setup path differs, which is why the steps below swap. */}
                  <div
                    role="radiogroup"
                    aria-label="Which tool are you streaming with?"
                    className="tw:mt-5 tw:grid tw:gap-3 tw:sm:grid-cols-2"
                  >
                    {STREAM_PROVIDERS.map((provider) => {
                      const selected = provider.id === activeProvider.id;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setStreamProvider(provider.id)}
                          className={cx(
                            "tw:rounded-3xl tw:border tw:p-4 tw:text-left tw:transition-colors tw:duration-200 tw:cursor-pointer",
                            selected
                              ? "tw:border-[#16909C] tw:bg-[#16909C]/5"
                              : "tw:border-[#ded6cd] tw:bg-white tw:hover:border-gray-400",
                          )}
                        >
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                            <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                              {provider.name}
                            </span>
                            <span className="tw:flex tw:items-center tw:gap-2">
                              {provider.badge ? (
                                <span className="tw:rounded-full tw:bg-[#16909C] tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-bold tw:text-white">
                                  {provider.badge}
                                </span>
                              ) : null}
                              {selected ? (
                                <CheckCircle2 className="tw:h-4 tw:w-4 tw:text-primary" />
                              ) : null}
                            </span>
                          </div>

                          <p className="tw:mt-1 tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
                            {provider.tagline}
                          </p>
                          <p className="tw:mt-2 tw:text-xs tw:leading-5 tw:text-gray-600">
                            {provider.blurb}
                          </p>

                          <span
                            className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold"
                            style={{ color: "#16909C" }}
                          >
                            {selected
                              ? `Steps below are for ${provider.name}`
                              : `Use ${provider.name} instead`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="tw:mt-8 tw:space-y-6">
                    {instructionSteps.map((step, index) => (
                      <StepItem
                        key={step.title}
                        index={index + 1}
                        title={step.title}
                        description={step.description}
                      />
                    ))}
                  </div>
                </section>

              </>
            )}

          </div>
        </div>
      </div>

      <StartStreamAppDownloadModal
        open={watchModalOpen}
        onClose={() => setWatchModalOpen(false)}
        title="Watch this event live on mobile"
        description="Watching live is currently available in the Xilolo mobile app. Download the app to continue."
        dismissLabel="Maybe later"
      />
    </>
  );
}
