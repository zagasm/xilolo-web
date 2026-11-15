import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Minimal public header — the wordmark plus a way back to sign-in.
 *
 * This replaces BOTH the marketing nav and having nothing at all. The founder's
 * two instructions (2026-11-15) were "remove the top menu on each of the pages"
 * and "let there be a way to get users back to the login page from all 5 pages".
 * A full nav above a hero was the complaint; a page with no exit at all would
 * strand a visitor who landed from search or the footer.
 *
 * So: no menu, no mega-menu, no hamburger — a 64px bar with the brand and the
 * two auth doors. It is in normal document flow (NOT fixed), which is why the
 * pages below it need no nav-offset padding: the bar occupies its own space.
 *
 * Do not add nav links here. If a destination is needed, it goes in the footer.
 */
export default function BrandBar() {
  return (
    <header className="tw:w-full tw:border-b tw:border-hairline tw:bg-paper">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3.5 tw:md:px-8 tw:md:py-4">
        <Link to="/" aria-label="Xilolo — sign in" className="tw:flex tw:shrink-0 tw:items-center">
          <img
            src="/logo.png"
            alt="Xilolo"
            className="tw:h-6 tw:w-auto tw:object-contain tw:md:h-8"
          />
        </Link>

        {/* Phones: the two doors must stay on ONE line. At 390px the labels used
            to wrap to two lines and squeeze the bar — hence nowrap + tighter
            padding below md, and the arrow is desktop-only. */}
        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:md:gap-3">
          <Link
            to="/auth/signin"
            className="tw:whitespace-nowrap tw:rounded-full tw:px-3 tw:py-2 tw:text-[13px] tw:font-semibold tw:text-ink tw:transition-colors tw:hover:bg-chip tw:md:px-4"
          >
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="tw:inline-flex tw:whitespace-nowrap tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-accent tw:px-3.5 tw:py-2 tw:text-[13px] tw:font-semibold tw:text-white tw:transition-colors tw:hover:bg-accent-deep tw:md:px-4"
          >
            Get started
            <ArrowRight className="tw:hidden tw:size-3.5 tw:md:block" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
