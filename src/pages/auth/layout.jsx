import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import SectionFooterCTA from "../../component/landing/SectionFooterCTA";

/**
 * Auth layout.
 *
 * Redirects an authenticated visitor to the feed, so these screens are only ever
 * seen signed out. Per the founder, the site footer belongs on the unauthenticated
 * entry points — signup, sign in, and the password-reset flow — and deliberately
 * NOT on the post-auth experience. That is enforced twice over: the path must be
 * one of the entry flows AND there must be no session. The token check also stops
 * the footer flashing while the redirect above is in flight.
 *
 * Uses the footer without its closing CTA band: "Ready to host your first event?
 * Get started" is pointless on a page whose purpose is already to get started.
 */
const FOOTER_PATHS = [
  "/",
  "/auth",
  "/auth/signup",
  "/auth/signin",
  "/auth/signinwithcode",
  "/auth/forget-password",
  "/auth/code-verification",
];

function AuthLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate("/feed", { replace: true });
    }
  }, [token, navigate]);

  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const showFooter = !token && FOOTER_PATHS.includes(normalised);

  return (
    <div>
      <Outlet />
      {/* No min-h-screen / flex-1 wrapper here: it pushed the footer to the bottom
          of the viewport, leaving a screenful of dead space and keeping the footer
          permanently below the fold. The auth screens own their own height. */}
      {showFooter ? <SectionFooterCTA showCta={false} /> : null}
    </div>
  );
}

export default AuthLayout;
