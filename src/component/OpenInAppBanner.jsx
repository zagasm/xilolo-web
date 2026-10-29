import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";

const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.zagasmstudio.app";
const APP_STORE = "https://apps.apple.com/ng/app/zagasm-studios/id6755035145";

/**
 * "Open in the app" for links that the app can render.
 *
 * Verified App Links / Universal Links already hand these URLs to the app when
 * it is installed from the store — but not when it was installed another way,
 * when iOS hasn't refreshed its association cache, or when the link is opened in
 * an in-app browser (WhatsApp, Instagram) that never consults the association
 * file. In those cases the visitor lands on the web page and, without this bar,
 * has no idea an app exists.
 *
 * It is a banner, not a redirect: auto-redirecting a web page is hostile, can
 * loop, and steals the page from someone who wanted to read it.
 */
const APP_PREFIXES = ["/vote/", "/event/", "/events/", "/users/", "/organisers/"];

/**
 * The mobile tab bar is `position: fixed; bottom: 0; z-999` (MobileNav.jsx).
 * The banner used to be `bottom: 0; z-60` too, so the bar painted straight over
 * its lower half — "Open in the Xilolo app" was half-swallowed and the Open
 * button sat behind the tabs. It now docks *above* the bar, measured rather than
 * hardcoded: the tab bar's own height (56px today) plus whatever height a page
 * owns at the bottom (the event page's ticket bar, the contest page's vote bar),
 * so the two never overlap on the pages where both exist.
 */
const NAV_FALLBACK = 56;

function isAppRoute(pathname) {
  if (pathname === "/vote") return false;
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
  );
}

function platform() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

export default function OpenInAppBanner() {
  const { pathname, search } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [dockOffset, setDockOffset] = useState(NAV_FALLBACK);

  const device = useMemo(platform, []);
  // The /dev/* previews are DEV-only shells that render the real Navbar (and so
  // the real mobile tab bar) without an account. Letting this bar mount there
  // keeps the banner-vs-tab-bar stack measurable at 390px — it 404s in prod.
  const devPreview = import.meta.env.DEV && pathname.startsWith("/dev/");
  const eligible = (isAppRoute(pathname) || devPreview) && device !== "other";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem("xilolo:open-in-app") === "1");
  }, [pathname]);

  // How much of the viewport bottom is already occupied: the tab bar, plus a
  // page-owned bar sitting on top of it. Both are marked with data attributes so
  // nothing here hardcodes a bar that a designer may resize tomorrow.
  useEffect(() => {
    if (!eligible) return;

    const measure = () => {
      const nav = document.querySelector("[data-mobile-nav]");
      const navH = nav ? nav.getBoundingClientRect().height || NAV_FALLBACK : NAV_FALLBACK;

      let pageDock = 0;
      document.querySelectorAll("[data-bottom-dock]").forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.height > 0) {
          pageDock = Math.max(pageDock, window.innerHeight - box.top - navH);
        }
      });

      setDockOffset(Math.round(navH + Math.max(0, pageDock)));
    };

    measure();
    // Bars mount after their data arrives, and the contest bar only exists on
    // some tabs, so watch the DOM instead of measuring once on mount.
    let pending = 0;
    const debounced = () => {
      window.clearTimeout(pending);
      pending = window.setTimeout(measure, 200);
    };
    const observer = new MutationObserver(debounced);
    observer.observe(document.body, { childList: true, subtree: true });

    const timers = [300, 1200].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(pending);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [eligible, pathname]);

  if (!eligible || dismissed) return null;

  const target = `${pathname}${search || ""}`;

  // Android answers `intent://` even when the app is not installed: the OS runs
  // the fallback URL instead. iOS has no equivalent, so the custom scheme is
  // tried and the store is the fallback after a short wait.
  const href =
    device === "android"
      ? `intent://xilolo.com${target}#Intent;scheme=https;package=com.zagasmstudio.app;S.browser_fallback_url=${encodeURIComponent(
          PLAY_STORE
        )};end`
      : `xilolo://${target.replace(/^\//, "")}`;

  const onOpen = () => {
    if (device !== "ios") return;
    window.setTimeout(() => {
      window.location.href = APP_STORE;
    }, 900);
  };

  const close = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem("xilolo:open-in-app", "1");
    } catch {
      /* private mode — the banner simply returns next visit */
    }
  };

  return (
    <div
      style={{ "--xilolo-app-banner-dock": `${dockOffset}px` }}
      className="tw:fixed tw:inset-x-0 tw:bottom-[var(--xilolo-app-banner-dock)] tw:z-[60] tw:px-3 tw:pb-[max(12px,env(safe-area-inset-bottom))] tw:md:bottom-0"
    >
      <div className="tw:mx-auto tw:flex tw:max-w-md tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:shadow-lg">
        <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-accent/12 tw:text-accent">
          <svg viewBox="0 0 24 24" className="tw:size-[18px]" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 16h4v-1.5h-4V19Z"
            />
          </svg>
        </span>

        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-[13px] tw:font-semibold tw:text-ink">
            Open in the Xilolo app
          </p>
          <p className="tw:text-[11.5px] tw:text-muted">
            Faster voting, tickets and live streams.
          </p>
        </div>

        <a
          href={href}
          onClick={onOpen}
          className="tw:rounded-pill tw:bg-accent tw:px-3.5 tw:py-2 tw:text-[12.5px] tw:font-semibold tw:text-white"
        >
          Open
        </a>

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-full! tw:text-muted"
        >
          <X className="tw:size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
