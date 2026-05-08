export function getWebDeviceName() {
  if (typeof navigator === "undefined") {
    return "React Web";
  }

  const uaData = navigator.userAgentData;
  const browser =
    uaData?.brands?.find((brand) => !/chromium|not/i.test(brand.brand))?.brand ||
    (navigator.userAgent.includes("Firefox")
      ? "Firefox"
      : navigator.userAgent.includes("Safari") &&
          !navigator.userAgent.includes("Chrome")
        ? "Safari"
        : navigator.userAgent.includes("Edg")
          ? "Edge"
          : navigator.userAgent.includes("Chrome")
            ? "Chrome"
            : "Browser");

  return `React Web - ${browser}`;
}

const DEVICE_ID_STORAGE_KEY = "xilolo_web_device_id";

function createDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getWebDeviceId() {
  if (typeof window === "undefined" || !window.localStorage) {
    return createDeviceId();
  }

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const nextDeviceId = createDeviceId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
}

export function getWebDevicePayload() {
  return {
    device_name: getWebDeviceName(),
    device_id: getWebDeviceId(),
  };
}
