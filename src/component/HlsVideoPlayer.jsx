import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { LoaderCircle, Radio, RefreshCw, TriangleAlert } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

/* Backoff between rebuilds. Live streams keep retrying forever (a broadcast can
   start late, and a CDN blip must not kill the host's own preview); recorded
   sources give up after these steps so a dead VOD URL cannot loop all day. */
const RETRY_STEPS = [1000, 2000, 4000, 8000, 10000, 15000];
const MAX_VOD_RETRIES = 3;
const WATCHDOG_MS = 5000;
const STALL_AFTER_MS = 25000;

const MESSAGES = {
  connecting: {
    icon: LoaderCircle,
    title: "Connecting to your stream…",
    hint: "This usually takes a few seconds.",
  },
  waiting: {
    icon: Radio,
    title: "Waiting for your stream to start",
    hint: "The player picks the feed up by itself the moment it is published.",
  },
  reconnecting: {
    icon: LoaderCircle,
    title: "Reconnecting…",
    hint: "The picture comes back on its own — nothing to press.",
  },
  unsupported: {
    icon: TriangleAlert,
    title: "Playback is not supported in this browser",
    hint: "Your viewers are unaffected.",
  },
  error: {
    icon: TriangleAlert,
    title: "Could not play this stream",
    hint: "Retrying stopped. Press try again to restart the player.",
  },
};

/**
 * HLS player with self-healing reconnect, built for the host's own live preview.
 *
 * Why it is not a bare `<video>` + hls.js: the host watches this while
 * broadcasting, and the two things that actually happen on air are (1) the feed
 * is not published yet when the page mounts, and (2) the CDN/broadcast hiccups
 * mid-stream. Both used to end in a dead black box with no way back, because
 * hls.js's fatal errors were answered with a single `startLoad()`. Here every
 * fatal error rebuilds the player after a backoff, a watchdog catches streams
 * that stop advancing without raising an error, and the browser coming back
 * online triggers an immediate retry.
 */
export default function HlsVideoPlayer({
  src = "",
  autoPlay = true,
  muted = true,
  controls = true,
  live = false,
  preferHls = false,
  aspectRatio = "16 / 9",
  maxHeight = "78vh",
  onStatus,
  className = "",
  overlayClassName = "",
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const rebuiltRef = useRef(0);
  const lastProgressRef = useRef(Date.now());
  /* Only a stream that HAS played can "stall". Without this, a browser that
     refuses autoplay (or a host who paused on purpose) would look like a dead
     feed to the watchdog and get rebuilt every few seconds. */
  const hasPlayedRef = useRef(false);
  const statusRef = useRef(src ? "connecting" : "idle");
  const onStatusRef = useRef(onStatus);
  const srcRef = useRef(src);

  const [status, setStatus] = useState(src ? "connecting" : "idle");
  const [attempt, setAttempt] = useState(0);
  const [nonce, setNonce] = useState(0);

  const ratio = useMemo(() => {
    const match = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(String(aspectRatio).trim());
    if (!match) return null;
    const value = Number(match[1]) / Number(match[2]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [aspectRatio]);

  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  const publish = useCallback((next) => {
    if (import.meta.env.DEV) {
      window.__statusLog = window.__statusLog || [];
      window.__statusLog.push(next);
    }
    if (statusRef.current === next) return;
    statusRef.current = next;
    setStatus(next);
    onStatusRef.current?.(next);
  }, []);

  useEffect(() => {
    srcRef.current = src;
  }, [src]);

  /* ── player lifecycle ─────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      statusRef.current = "idle";
      setStatus("idle");
      return undefined;
    }

    let cancelled = false;

    const clearRetry = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const teardown = () => {
      clearRetry();
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          /* ignore */
        }
        hlsRef.current = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        /* ignore */
      }
    };

    const attemptPlay = () => {
      if (!autoPlay) return;
      const promise = video.play();
      if (promise?.catch) {
        promise.catch(() => {
          // Autoplay refused (no user gesture yet, or muted not honoured):
          // leave the native controls so the host can press play.
        });
      }
    };

    const scheduleRetry = (nextStatus) => {
      if (cancelled) return;
      if (import.meta.env.DEV) {
        window.__retryLog = window.__retryLog || [];
        const stack = String(new Error().stack || "").split("\n").slice(1, 4).join(" <- ");
        window.__retryLog.push({ status: nextStatus, where: stack.slice(0, 220) });
      }

      attemptsRef.current += 1;
      const tries = attemptsRef.current;

      if (!live && tries > MAX_VOD_RETRIES) {
        publish("error");
        return;
      }

      setAttempt(tries);
      publish(nextStatus);

      const delay = RETRY_STEPS[Math.min(tries - 1, RETRY_STEPS.length - 1)];
      clearRetry();
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        teardown();
        build();
      }, delay);
    };

    const handleError = (_event, data) => {
      const responseCode = data?.response?.code;
      const offline = !navigator.onLine;

      /* Dev-only: a verification sweep reads this to see how a failure was
         classified. The production build never sets it. */
      if (import.meta.env.DEV) {
        window.__hlsError = {
          type: data.type,
          details: data.details,
          code: responseCode ?? null,
          fatal: !!data?.fatal,
          played: hasPlayedRef.current,
        };
        window.__hlsErrorCount = (window.__hlsErrorCount || 0) + 1;
      }

      if (!data?.fatal) {
        // Non-fatal: hls.js recovers most of these, but a stalled buffer is the
        // classic "frozen picture, no error" case — nudge it.
        if (data?.details === "bufferStalledError" && hlsRef.current) {
          try {
            hlsRef.current.startLoad();
          } catch {
            /* ignore */
          }
        }
        return;
      }

      if (offline) {
        scheduleRetry("reconnecting");
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        /* The message the host needs is "your feed is not up yet", not
           "something broke" — and the only thing that separates those is whether
           a picture has EVER come through in this mount. A 404/410 says it
           outright; a cross-origin CDN 404 often arrives with no status at all,
           so classification by response code is not enough (measured: the same
           404 reached the client as an untyped network error). */
        if (!hasPlayedRef.current || responseCode === 404 || responseCode === 410) {
          scheduleRetry("waiting");
          return;
        }
        scheduleRetry("reconnecting");
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        if (rebuiltRef.current < 2 && hlsRef.current) {
          rebuiltRef.current += 1;
          try {
            hlsRef.current.recoverMediaError();
            return;
          } catch {
            /* fall through to a rebuild */
          }
        }
        scheduleRetry("reconnecting");
        return;
      }

      scheduleRetry("reconnecting");
    };

    function build() {
      if (cancelled) return;
      const node = videoRef.current;
      if (!node) return;
      if (import.meta.env.DEV) window.__hlsBuilds = (window.__hlsBuilds || 0) + 1;

      publish(attemptsRef.current === 0 ? "connecting" : statusRef.current);

      /* Order matters, and the old order was why this player never recovered.
         `canPlayType("application/vnd.apple.mpegurl")` answers "maybe" in Chrome
         (measured in the verification browser: hls,mp4 -> "maybe"/"maybe"), so
         the NATIVE branch was the one running on desktop — and the native branch
         has no hls.js error handling or recovery at all, so a dropped feed just
         sat there. hls.js is used whenever it is supported; the native path is
         the Safari/iOS fallback. */
      const nativeHls = node.canPlayType("application/vnd.apple.mpegurl");

      if (Hls.isSupported() && (preferHls || !nativeHls)) {
        // handled below
      } else if (nativeHls) {
        node.src = src;
        node.addEventListener("loadedmetadata", attemptPlay, { once: true });
        node.addEventListener(
          "error",
          () => scheduleRetry(hasPlayedRef.current ? "reconnecting" : "waiting"),
          { once: true },
        );
        return;
      } else {
        publish("unsupported");
        return;
      }

      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 20,
        maxLiveSyncPlaybackRate: 1.5,
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 2,
      });

      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptsRef.current = 0;
        rebuiltRef.current = 0;
        setAttempt(0);
        lastProgressRef.current = Date.now();
        attemptPlay();
        publish("live");
      });
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        lastProgressRef.current = Date.now();
      });
      hls.on(Hls.Events.ERROR, handleError);
      hls.attachMedia(node);
    }

    const onPlaying = () => {
      attemptsRef.current = 0;
      setAttempt(0);
      hasPlayedRef.current = true;
      lastProgressRef.current = Date.now();
      publish("live");
    };
    const onTimeUpdate = () => {
      lastProgressRef.current = Date.now();
    };
    const onStalled = () => {
      if (statusRef.current === "live") lastProgressRef.current = 0;
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("stalled", onStalled);

    build();

    /* Watchdog: a live feed that stops advancing without throwing is the one
       failure mode hls.js will not report. */
    const watchdog = setInterval(() => {
      if (cancelled || !live) return;
      if (document.visibilityState !== "visible") return;
      const node2 = videoRef.current;
      if (!node2) return;
      if (!hasPlayedRef.current) return;
      const noProgress = Date.now() - lastProgressRef.current > STALL_AFTER_MS;
      const stuckBeforeData = !node2.paused && node2.readyState < 2;
      if (noProgress || stuckBeforeData) {
        scheduleRetry("reconnecting");
      }
    }, WATCHDOG_MS);

    /* Network coming back is the most common real cause of a dropped feed. */
    const onOnline = () => {
      if (cancelled) return;
      attemptsRef.current = 0;
      clearRetry();
      teardown();
      publish("connecting");
      build();
    };
    const onVisibility = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      const node2 = videoRef.current;
      if (!node2) return;
      // Coming back to a tab that was throttled: hls.js usually recovers, but a
      // silent gap that has already outlived the stall window needs the rebuild.
      const stale = Date.now() - lastProgressRef.current > STALL_AFTER_MS;
      if (hasPlayedRef.current && (stale || node2.readyState < 2)) onOnline();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(watchdog);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("stalled", onStalled);
      teardown();
    };
  }, [src, autoPlay, live, preferHls, nonce, publish]);

  const retryNow = () => {
    attemptsRef.current = 0;
    rebuiltRef.current = 0;
    hasPlayedRef.current = false;
    lastProgressRef.current = Date.now();
    setAttempt(0);
    publish("connecting");
    setNonce((value) => value + 1);
  };

  const overlay = !src || status === "live" ? null : MESSAGES[status] || MESSAGES.connecting;
  const OverlayIcon = overlay?.icon;

  return (
    <div
      className={cx(
        "tw:relative tw:w-full tw:overflow-hidden tw:rounded-3xl tw:bg-black",
        className,
      )}
      style={{
        aspectRatio,
        maxHeight,
        /* A portrait stream (9:16) at full column width would be absurdly tall,
           so cap the height AND shrink the width to match. min() keeps landscape
           streams filling the width. */
        ...(ratio
          ? { width: `min(100%, calc(${maxHeight} * ${ratio}))`, marginInline: "auto" }
          : {}),
      }}
    >
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="auto"
        className="tw:h-full tw:w-full"
        style={{ objectFit: "contain", background: "#000" }}
      />

      {overlay ? (
        <div
          className={cx(
            "tw:pointer-events-none tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:bg-black/70 tw:px-6 tw:text-center",
            overlayClassName,
          )}
        >
          <OverlayIcon
            className={cx(
              "tw:h-6 tw:w-6 tw:text-white/90",
              status === "connecting" || status === "reconnecting" ? "tw:animate-spin" : "",
            )}
          />
          <div className="tw:text-sm tw:font-semibold tw:text-white">
            {overlay.title}
            {attempt > 1 && (status === "reconnecting" || status === "waiting")
              ? ` (attempt ${attempt})`
              : ""}
          </div>
          <div className="tw:max-w-sm tw:text-xs tw:leading-5 tw:text-white/70">
            {overlay.hint}
          </div>

          {status === "error" ? (
            <button
              type="button"
              onClick={retryNow}
              className="tw:pointer-events-auto tw:mt-1 tw:inline-flex tw:h-9 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-white tw:px-4 tw:text-xs tw:font-semibold tw:text-gray-900"
            >
              <RefreshCw className="tw:h-3.5 tw:w-3.5" />
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
