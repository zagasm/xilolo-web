import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isMobile, openInAppOnce } from "../lib/appHandoff";
import { useAuth } from "../pages/auth/AuthContext/index.jsx";

/**
 * Shared links opened by a signed-out visitor on a phone belong in the app.
 *
 * The web cannot render most share destinations without a session — a profile link
 * sent a visitor to a sign-in form — and the app can open them immediately. This fires
 * the handoff once per destination per session and never navigates the tab by itself,
 * so the page stays as the fallback when the app is absent, the scheme is ignored
 * (iOS Safari without a gesture), or the visitor deliberately stays on the web.
 *
 * Signed-in visitors are left alone: they have an account here, and yanking them into
 * the app mid-browse is not an improvement.
 */
const SHARE_PREFIXES = ["/event/", "/events/", "/users/", "/organisers/", "/v/"];

function isShareDestination(pathname) {
  if (!pathname) return false;
  if (pathname === "/vote" || pathname.startsWith("/vote/receipt/")) return false;
  return SHARE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function ShareLinkHandoff() {
  const { pathname, search } = useLocation();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (token || user) return;
    if (!isMobile()) return;
    if (!isShareDestination(pathname)) return;

    openInAppOnce(`${pathname}${search || ""}`);
  }, [isLoading, pathname, search, token, user]);

  return null;
}
