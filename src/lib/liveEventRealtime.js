import Echo from "laravel-echo";
import Pusher from "pusher-js";

/* laravel-echo 2.x's pusher connector resolves the client from `window.Pusher`
   (`node_modules/laravel-echo/dist/echo.js`: `typeof window.Pusher < "u"`), NOT
   from a bundled import — so without this assignment the connector silently
   never starts and the channel sits at "connecting" forever. Same line as
   src/lib/sessionRealtime.js. */
window.Pusher = Pusher;

/**
 * Realtime subscription for the host's live console.
 *
 * The channel is `private-live-event.{eventId}` — the same one the Flutter app
 * subscribes to (lib/features/event/widgets/player/live_chat_reverb_client.dart).
 * It is served by Reverb, NOT by Pusher cloud, so the Echo broadcaster config is
 * built from the VITE_REVERB_* values that CI injects (deploy-prod.yml).
 *
 * IMPORTANT — the auth endpoint is `/broadcasting/auth`, not
 * `/api/v1/realtime/pusher/auth`. That custom controller hardcodes a whitelist
 * (`private-user.*`, `private-support.*`) and 403s every `private-live-event.*`
 * subscription for every user, owner included (verified 2026-10-02: owner 403,
 * non-owner 403, no token 401). Laravel's own channel route is registered by
 * BroadcastServiceProvider with `['api', 'auth:sanctum']` and authorizes
 * live-event through LiveStreamAccessService::canAccessChannel (organiser/admin
 * always, viewers only while the stream is live AND they hold a ticket).
 * Verified 2026-10-02: owner -> 200 + signature, non-owner -> 403, no token -> 401.
 *
 * When the REVERB_* env is absent (a local dev server has no key), this returns
 * null and callers fall back to polling — never a silent dead panel.
 */

const T = (value) => String(value ?? "").trim();

function reverbConfig() {
  const key = T(import.meta.env.VITE_REVERB_APP_KEY);
  const host = T(import.meta.env.VITE_REVERB_HOST);
  const rawScheme = T(import.meta.env.VITE_REVERB_SCHEME).toLowerCase();
  const forceTLS = ["https", "wss", "tls", "true", "1"].includes(rawScheme);
  const port = Number(T(import.meta.env.VITE_REVERB_PORT)) || (forceTLS ? 443 : 80);

  if (!key || !host) return null;

  return { key, host, port, forceTLS };
}

export function canUseLiveRealtime() {
  return !!reverbConfig();
}

/**
 * `/broadcasting/auth` on the API host. VITE_API_URL ends in `/api`, which has
 * to come off before appending the Laravel route.
 */
export function broadcastingAuthUrl() {
  const raw = T(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL);
  const base = raw.replace(/\/+$/, "").replace(/\/api$/, "");
  return `${base}/broadcasting/auth`;
}

/**
 * Subscribe to one event's live channel.
 *
 * @returns {{disconnect: Function}|null} null when realtime is not configured
 *          (callers must then poll).
 */
export function subscribeToLiveEvent({
  eventId,
  token,
  onComment,
  onLike,
  onSession,
  onPinned,
  onUnpinned,
  onStreamState,
  onStatus,
}) {
  const config = reverbConfig();
  if (!config || !eventId || !token) return null;

  let echo;
  try {
    echo = new Echo({
      broadcaster: "pusher",
      key: config.key,
      cluster: "mt1",
      wsHost: config.host,
      wsPort: config.port,
      wssPort: config.port,
      forceTLS: config.forceTLS,
      encrypted: config.forceTLS,
      /* Do NOT set `enabledTransports: ["wss"]`. pusher-js's web strategy tests
         the non-TLS `ws` transport first and falls through to its http
         fallbacks; disabling everything but `wss` makes every branch
         unsupported and the connection lands in `failed` with no error event —
         silent, and it looks exactly like "the server refused us". Measured
         2026-10-02 in headless Chrome against the real Reverb host:
         ["wss"] -> failed, ["ws","wss"] -> connected + subscription ok,
         unset -> connected + subscription ok. Leave it unset. */
      authEndpoint: broadcastingAuthUrl(),
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });
  } catch (error) {
    console.warn("[live-console] realtime unavailable", error);
    onStatus?.("unavailable");
    return null;
  }

  const channelName = `live-event.${eventId}`;
  let channel;
  try {
    channel = echo.private(channelName);
  } catch (error) {
    console.warn("[live-console] could not open channel", error);
    onStatus?.("unavailable");
    try {
      echo.disconnect();
    } catch {
      /* ignore */
    }
    return null;
  }

  const unwrap = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    return payload.comment && typeof payload.comment === "object" ? payload.comment : payload;
  };

  channel.listen(".live.comment.created", (payload) => {
    const comment = unwrap(payload);
    if (comment?.id) onComment?.(comment);
  });

  channel.listen(".live.comment.pinned", (payload) => {
    const comment = unwrap(payload);
    if (comment?.id) onPinned?.(comment);
  });

  channel.listen(".live.comment.unpinned", (payload) => {
    const comment = unwrap(payload);
    if (comment?.id) onUnpinned?.(comment);
  });

  channel.listen(".live.like.toggled", (payload) => {
    if (payload && typeof payload === "object") onLike?.(payload);
  });

  channel.listen(".live.session.updated", (payload) => {
    if (payload && typeof payload === "object") onSession?.(payload);
  });

  channel.listen(".stream.paused", (payload) => onStreamState?.("paused", payload));
  channel.listen(".stream.resumed", (payload) => onStreamState?.("live", payload));

  channel.subscribed(() => onStatus?.("subscribed"));
  channel.error?.(() => onStatus?.("error"));

  const pusher = echo.connector?.pusher;
  /* Dev-only handle so a verification sweep can read the live socket state
     (the production build never sets this). */
  if (import.meta.env.DEV) {
    window.__liveEcho = echo;
    window.__liveEchoState = () => pusher?.connection?.state;
  }
  pusher?.connection?.bind?.("state_change", (states) => {
    const next = states?.current;
    if (next === "connected") onStatus?.("connected");
    else if (next === "connecting") onStatus?.("connecting");
    else if (next === "unavailable" || next === "failed") onStatus?.("unavailable");
    else if (next === "disconnected") onStatus?.("disconnected");
  });
  pusher?.connection?.bind?.("error", (error) => {
    if (import.meta.env.DEV) {
      window.__liveEchoError = {
        message: error?.error?.message || error?.message || String(error),
        data: error?.error?.data || error?.data || null,
        type: error?.type || null,
      };
    }
    onStatus?.("error");
  });

  return {
    disconnect() {
      try {
        echo.leave(channelName);
      } catch {
        /* ignore */
      }
      try {
        echo.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}
