import React from "react";
import { Link } from "react-router-dom";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/**
 * Site footer — two variants, one visual language.
 *
 * FULL (default): brand block + four link columns + utility row + copyright.
 * For content pages (/about, /contact, legal, marketing) where scrolling is normal.
 *
 * COMPACT: one slim bar — wordmark, the four top-level destinations, socials.
 * Used on the auth screens, where the founder's standing requirement is that the
 * page fits ONE viewport and the footer is visible without scrolling. It is
 * deliberately ~60px tall so it can sit under a 26px-heading card on a 700px
 * laptop without pushing the page into a scrollbar.
 *
 * Colour: text colour is set INLINE on the <footer> so every child inherits it.
 * Utility classes on the links keep losing to the legacy stylesheet's
 * `a{color:#333}`. #C4C4CC is 10.7:1 on ink; #7C7C82 (4.49:1) and #444 (1.91:1)
 * both fail.
 *
 * All social URLs, the support email and the registered address are carried
 * over verbatim from the original footer — do not replace them with guesses.
 */
const APP_STORE_URL = "https://apps.apple.com/ng/app/zagasm-studios/id6755035145";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.zagasmstudio.app";

const FOOTER_TEXT = "#C4C4CC";

const SOCIALS = [
  { name: "Facebook", Icon: SiFacebook, href: "https://web.facebook.com/xilolohq" },
  { name: "X", Icon: SiX, href: "https://x.com/xilolo_hq?s=20" },
  { name: "Instagram", Icon: SiInstagram, href: "https://www.instagram.com/xilolo_hq" },
  { name: "YouTube", Icon: SiYoutube, href: "https://www.youtube.com/@xilolo_hq" },
  { name: "TikTok", Icon: SiTiktok, href: "https://www.tiktok.com/@xilolo_hq" },
];

/**
 * PUBLIC destinations only (founder, 2026-11-15: "the links on the footer should
 * not include anything that would require authentication").
 *
 * /feed, /tickets, /search, /vote, /me/organisers, /xilolo-ai and
 * /become-an-organiser all sit inside MainLayout/Sessionpage, i.e. they redirect
 * a signed-out visitor to sign-in — so none of them belong in a public footer.
 * Everything listed here is inside LandingLayout or AuthLayout and renders for
 * anyone. Adding a link? Check which layout wraps the route in app.jsx first.
 */
const COLUMNS = [
  {
    heading: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/support", label: "Support" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { to: "/auth/signup", label: "Create an account" },
      { to: "/auth/signin", label: "Sign in" },
      { to: "/auth/forget-password", label: "Forgot password" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/privacy-policy", label: "Privacy" },
      { to: "/terms-of-service", label: "Terms" },
      { to: "/community-guidelines", label: "Guidelines" },
      { to: "/data-protection", label: "Data protection" },
    ],
  },
];

/* Compact bar links — public only, same rule as above. */
const COMPACT_LINKS = [
  { to: "/about", label: "About" },
  { to: "/support", label: "Support" },
  { to: "/contact", label: "Contact" },
  { to: "/auth/signin", label: "Sign in" },
];

const linkBase =
  "tw:inline-flex tw:items-center tw:text-[13px] tw:leading-none tw:transition-colors tw:hover:text-paper-raised";

function SocialRow({ size = 32, icon = 14 }) {
  return (
    <ul
      className="tw:flex tw:items-center tw:gap-1.5"
      style={{ margin: 0, padding: 0, listStyle: "none" }}
    >
      {SOCIALS.map(({ name, Icon, href }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Xilolo on ${name}`}
            className="tw:flex tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline-dark tw:transition-colors tw:hover:border-paper-raised tw:hover:text-paper-raised"
            style={{ width: size, height: size }}
          >
            <Icon style={{ width: icon, height: icon }} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function SectionFooterCTA({ showCta = true, compact = false }) {
  /* ── Compact strip ─────────────────────────────────────────────────────────
     One row, ~60px. The auth screens must fit a single viewport with the
     footer visible, so this variant cannot grow with content. On phones the
     wordmark and links drop out (founder: copyright + socials only). */
  if (compact) {
    return (
      <footer className="tw:border-t tw:border-hairline-dark tw:bg-ink" style={{ color: FOOTER_TEXT }}>
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:gap-3 tw:px-5 tw:py-4 tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:gap-6 tw:md:px-8">
          <div className="tw:flex tw:items-center tw:gap-8">
            <Link to="/" aria-label="Xilolo home" className="tw:hidden tw:md:block">
              <img
                src="/logo.png"
                alt="Xilolo"
                className="tw:h-5 tw:w-auto tw:shrink-0 tw:object-contain tw:brightness-0 tw:invert"
              />
            </Link>
            <nav className="tw:hidden tw:items-center tw:gap-6 tw:md:flex">
              {COMPACT_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className={linkBase}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:md:justify-end">
            <span className="tw:text-[11px] tw:tracking-[0.01em] tw:text-[#C4C4CC]">
              © {new Date().getFullYear()} Xilolo Technologies
            </span>
            <SocialRow size={30} icon={13} />
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full footer: content pages ───────────────────────────────────────── */
  return (
    <footer className="tw:bg-ink" style={{ color: FOOTER_TEXT }}>
      {showCta ? (
        <div className="tw:border-b tw:border-hairline-dark">
          <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-start tw:justify-between tw:gap-5 tw:px-5 tw:py-8 tw:md:flex-row tw:md:items-center tw:md:px-8">
            <div>
              <p className="tw:m-0! tw:font-display tw:text-[19px] tw:font-bold tw:tracking-[-0.015em] tw:text-paper-raised!">
                Creators have something to offer.
              </p>
              <p className="tw:mt-1! tw:mb-0! tw:text-[13px] tw:text-[#C4C4CC]!">
                Audience have something to discover. We bring them together.
              </p>
            </div>
            <Link
              to="/auth/signup"
              className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:bg-accent tw:px-5 tw:py-3 tw:text-[13px] tw:font-semibold tw:text-white tw:transition-colors tw:hover:bg-accent-deep"
            >
              Host your first event
              <ArrowRight className="tw:size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-5 tw:py-10 tw:md:px-8 tw:md:py-12">
        <div className="tw:grid tw:gap-9 tw:md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] tw:md:gap-10">
          <div className="tw:flex tw:flex-col tw:items-start tw:gap-4">
            <Link to="/" aria-label="Xilolo home">
              <img
                src="/logo.png"
                alt="Xilolo"
                className="tw:h-6 tw:w-auto tw:shrink-0 tw:object-contain tw:brightness-0 tw:invert"
              />
            </Link>
            <p className="tw:m-0! tw:max-w-[240px] tw:text-[12.5px] tw:leading-relaxed tw:text-[#9AA0AA]!">
              The home for live experiences — where creators host and audiences discover.
            </p>
            <a
              href="mailto:support@xilolo.com"
              className="tw:text-[13px] tw:text-[#E5E4E2] tw:transition-colors tw:hover:text-paper-raised"
            >
              support@xilolo.com
            </a>
            <SocialRow />
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="tw:flex tw:flex-col tw:gap-3">
              <p className="tw:m-0! tw-text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-[#7C7C82]!">
                {heading}
              </p>
              <ul
                className="tw:flex tw:flex-col tw:gap-2.5"
                style={{ margin: 0, padding: 0, listStyle: "none" }}
              >
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className={linkBase}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tw:mt-10 tw:flex tw:flex-col tw:gap-3 tw:border-t tw:border-hairline-dark tw:pt-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
          <span className="tw:text-[11.5px] tw:text-[#9AA0AA]">
            © {new Date().getFullYear()} Xilolo Technologies · 16192 Coastal Highway, Lewes, DE 19958
          </span>
          <div className="tw:flex tw:items-center tw:gap-5">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11.5px] tw:text-[#C4C4CC] tw:transition-colors tw:hover:text-paper-raised"
            >
              iOS app
              <ArrowUpRight className="tw:size-3" aria-hidden="true" />
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11.5px] tw:text-[#C4C4CC] tw:transition-colors tw:hover:text-paper-raised"
            >
              Android app
              <ArrowUpRight className="tw:size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
