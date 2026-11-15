import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import BrandBar from "../component/landing/BrandBar";
import SectionFooterCTA from "../component/landing/SectionFooterCTA";

/**
 * Public content shell: a minimal brand bar + the site footer.
 *
 * There is NO marketing nav here any more. The founder's instruction
 * (2026-11-15) was explicit and repeated: "remove the top menu on each of the
 * pages" for /about, /support, /contact and the legal pages. A mega-menu above
 * a hero is the thing he kept objecting to.
 *
 * What replaces it is <BrandBar>: wordmark + "Sign in" + "Get started". That
 * satisfies his other requirement — "let there be a way to get users back to
 * the login page from all 5 pages" — without putting a menu back.
 *
 * BrandBar sits in normal flow, so no layout-level top offset is needed. Pages
 * own their own top padding (`tw:pt-8 tw:md:pt-12` is the content-page rhythm).
 *
 * Editing this file? The nav component (src/component/landing/Nav.jsx) still
 * exists and is used by the /design showcase only. Do not re-mount it here.
 */
export default function LandingLayout() {
  useEffect(() => {
    document.documentElement.classList.add("xilolo-landing-scrollbar-hidden");
    document.body.classList.add("xilolo-landing-scrollbar-hidden");

    return () => {
      document.documentElement.classList.remove("xilolo-landing-scrollbar-hidden");
      document.body.classList.remove("xilolo-landing-scrollbar-hidden");
    };
  }, []);

  return (
    <div className="xilolo-landing-scrollbar-hidden tw:min-h-screen tw:max-w-full tw:overflow-x-clip tw:bg-paper">
      <BrandBar />
      <main className="tw:flex-1">
        <Outlet />
      </main>
      {/* Minimal bar footer on every public page (founder, 2026-11-15: "all 5
          pages footer should be like the signin or signup footer very minimal").
          Same component the auth screens use, so the two can never drift. */}
      <SectionFooterCTA compact />
    </div>
  );
}
