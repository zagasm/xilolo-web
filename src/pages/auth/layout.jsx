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
    <div className="tw:flex tw:min-h-screen tw:flex-col">
      {/* flex-1 on the content pushes the slim footer to the bottom of the viewport
          without creating a scrollbar, because the auth screens no longer force
          90vh and the footer is a single strip. Together they fill exactly one
          screen — which is the requirement for these pages. */}
      <div className="tw:flex-1">
        <Outlet />
      </div>
      {showFooter ? <SectionFooterCTA compact /> : null}
    </div>
  );
}

export default AuthLayout;
