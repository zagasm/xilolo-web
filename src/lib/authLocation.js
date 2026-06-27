const GEOLOCATION_TIMEOUT_MS = 3500;

function getTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function getBrowserPosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), GEOLOCATION_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve(position);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: GEOLOCATION_TIMEOUT_MS,
      }
    );
  });
}

export async function getAuthLocationPayload() {
  const timezone = getTimezone();
  const position = await getBrowserPosition();

  if (!position?.coords) {
    return timezone
      ? {
          client_location: {
            timezone,
            source: "browser_timezone",
          },
        }
      : {};
  }

  return {
    client_location: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timezone,
      source: "browser_geolocation",
    },
  };
}
