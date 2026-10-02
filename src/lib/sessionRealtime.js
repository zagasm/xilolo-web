import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echoInstance = null;

function buildApiUrl(apiUrl, path) {
  const normalizedBase = String(apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = String(path || "").startsWith("/")
    ? path
    : `/${path}`;

  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase.slice(0, -4)}${normalizedPath}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

export function connectSessionRealtime({
  apiUrl,
  token,
  userId,
  reverbKey,
  reverbHost,
  reverbPort,
  forceTLS,
  onRevoked,
}) {
  if (!token || !userId || !reverbKey || !reverbHost || !reverbPort) {
    return null;
  }

  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  echoInstance = new Echo({
    broadcaster: "pusher",
    key: reverbKey,
    cluster: "mt1",
    wsHost: reverbHost,
    wsPort: Number(reverbPort),
    wssPort: Number(reverbPort),
    forceTLS: Boolean(forceTLS),
    encrypted: Boolean(forceTLS),
    /* NOT `enabledTransports: ["wss"]` — see src/lib/liveEventRealtime.js:
       restricting pusher-js to the wss transport alone leaves every strategy
       branch unsupported and the socket dies in `failed` with no error event
       (measured 2026-10-02). That silently killed forced-logout/support-chat
       realtime on the web build. Unset = wss is still chosen first. */
    authEndpoint: buildApiUrl(apiUrl, "/api/v1/realtime/pusher/auth"),
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  echoInstance.private(`user.${userId}`).listen(".session.revoked", (payload) => {
    onRevoked?.(payload);
  });

  return echoInstance;
}

export function disconnectSessionRealtime() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
