/**
 * Hand a web link to the Xilolo app.
 *
 * The web cannot render some destinations for a visitor with no session — a shared
 * profile link, for example, sends them to sign-in. On a phone that is the wrong
 * answer: the app can open the profile straight away, and the visitor almost
 * certainly has it installed.
 *
 * Two rules, learned the hard way:
 *  - never navigate the tab to the store automatically. The banner used to do that
 *    900ms after firing the scheme, so with the app installed the page behind it
 *    still went to the App Store;
 *  - fire once per destination per session. A redirect that re-fires on every render
 *    is a loop, and on iOS Safari a programmatic scheme navigation without a user
 *    gesture is usually ignored anyway — so the page must remain usable underneath.
 */

const APP_STORE = "https://apps.apple.com/ng/app/zagasm-studio/id6755035145";

export function detectPlatform() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

export function isMobile() {
  return detectPlatform() !== "other";
}

/**
 * Builds the URL that opens [target] (a path such as "/users/adaeze") in the app.
 *
 * Android answers `intent://` even when the app is absent, running the fallback —
 * which is this same page, so the visitor simply stays where they were. iOS has no
 * equivalent: the custom scheme is all there is, and the caller keeps the page.
 */
export function appUrlFor(target) {
  const path = target.startsWith("/") ? target : `/${target}`;
  if (detectPlatform() === "android") {
    return (
      `intent://xilolo.com${path}#Intent;scheme=https;` +
      `package=com.zagasmstudio.app;` +
      `S.browser_fallback_url=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : "https://xilolo.com"
      )};end`
    );
  }
  return `xilolo://${path.replace(/^\//, "")}`;
}

const ATTEMPTED = new Set();

/**
 * Fires the handoff at most once per destination per session.
 *
 * Returns true when an attempt was made. The caller decides what the page shows if
 * the app does not come to the front — this never navigates the tab by itself.
 */
export function openInAppOnce(target) {
  if (typeof window === "undefined") return false;
  if (!isMobile()) return false;
  if (ATTEMPTED.has(target)) return false;

  ATTEMPTED.add(target);
  const url = appUrlFor(target);
  // Observable, and cheap: a QA run (or a console) can see which handoff fired without
  // guessing from a blank screen. No user data — the destination path only.
  try {
    window.__xiloloAppHandoff = { target, url, at: Date.now() };
    // eslint-disable-next-line no-console
    console.info("[handoff] opening in app:", target);
  } catch {
    /* nothing to record; the navigation below is what matters */
  }
  try {
    window.location.href = url;
  } catch {
    return false;
  }
  return true;
}

export function appStoreUrl() {
  return APP_STORE;
}
