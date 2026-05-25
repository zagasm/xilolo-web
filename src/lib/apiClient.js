import axios from "axios";
import { showError } from "../component/ui/toast";
import { emitForcedLogout } from "./authSessionSignals";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export function authHeaders(token) {
  const brToken = localStorage.getItem("token");
  const finalToken = token || brToken;

  return finalToken
    ? {
        headers: { Authorization: `Bearer ${finalToken}` },
      }
    : {};
}

let lastDeactivatedToastAt = 0;
const DEACTIVATED_TOAST_COOLDOWN_MS = 8000;

function maybeToastDeactivated(payload) {
  if (!payload || payload.reactivate !== true) return;

  const now = Date.now();
  if (now - lastDeactivatedToastAt < DEACTIVATED_TOAST_COOLDOWN_MS) return;
  lastDeactivatedToastAt = now;

  const when = payload.deactivation_requested_at || "recently";
  showError(`Account deactivated (${when}). Please reactivate to continue.`);
}

function resolveUnauthorizedReason(payload) {
  const message = String(payload?.message || "").toLowerCase();

  if (
    message.includes("another device") ||
    message.includes("logged in on another") ||
    message.includes("logged in elsewhere") ||
    message.includes("session revoked")
  ) {
    return "another_device";
  }

  return "session_invalid";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (!error.response) {
      if (!import.meta.env.PROD) {
        console.warn("[api] Network or CORS error (no response)", error);
      }
      return Promise.reject(error);
    }

    const payload = error?.response?.data;

    if (!import.meta.env.PROD) {
      console.log("[api] response status:", status, "url:", url);
    }

    if (status === 503 && payload?.code === "MAINTENANCE_MODE") {
      if (typeof window !== "undefined" && window.location.pathname !== "/maintenance") {
        window.sessionStorage.setItem(
          "xilolo_maintenance_message",
          payload?.message || "Xilolo is currently on maintenance please try again later."
        );
        window.sessionStorage.setItem("xilolo_maintenance_redirected_at", String(Date.now()));
        window.location.assign("/maintenance");
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      maybeToastDeactivated(payload);
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (typeof window !== "undefined") {
      const reason = resolveUnauthorizedReason(payload);
      emitForcedLogout({
        reason,
        message:
          reason === "another_device"
            ? "You have been logged out because you have logged in on another device."
            : payload?.message ||
              "Your session is no longer valid. Please sign in again.",
      });
    }

    return Promise.reject(error);
  }
);
