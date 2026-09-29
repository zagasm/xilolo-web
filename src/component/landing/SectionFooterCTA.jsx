import React from "react";
import { Link } from "react-router-dom";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui";

/**
 * Site footer — two variants.
 *
 * FULL (default): brand block + four link columns + a utility row + copyright.
 * For content pages (/about, /contact, legal, marketing) where scrolling is normal.
 *
 * COMPACT (compact): a single slim bar — mark, key links, socials, copyright — for
 * the signup / sign-in / reset-password screens. Per the founder those pages must
 * fit ONE screen with no scrolling, so the footer has to be a strip, not a block.
 *
 * Colour note (learned the hard way): the footer's text colour is set INLINE on the
 * <footer> so every child inherits it. Utility classes on the links kept losing to
 * the legacy stylesheet's `a{color:#333}`, and relying on `color: inherit` alone
 * inherited a dark body colour and rendered everything invisible. Hover classes
 * still work because a real declaration beats an inherited value. #C4C4CC is 10.7:1
 * on ink; the values I tried first were 4.49:1 (#7C7C82) and 1.91:1 (#444444).
 *
 * All social URLs, the support email and the address are carried over verbatim
 * from the original footer — do not replace them with guesses.
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

const COLUMNS = [
  {
    heading: "Watch",
    links: [
      { to: "/feed", label: "Live & upcoming" },
      { to: "/search", label: "Discover" },
      { to: "/tickets", label: "My tickets" },
    ],
  },
  {
    heading: "Host",
    links: [
      { to: "/become-an-organiser", label: "Host your first event" },
      { to: "/me/organisers", label: "My events" },
      { to: "/xilolo-ai", label: "Xilolo AI" },
    ],
  },
  {
    heading: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/support", label: "Support" },
      { to: "/contact", label: "Contact" },
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

const COMPACT_LINKS = [
  { to: "/feed", label: "Discover" },
  { to: "/become-an-organiser", label: "Host your first event" },
  { to: "/support", label: "Support" },
  { to: "/terms-of-service", label: "Terms" },
  { to: "/privacy-policy", label: "Privacy" },
];

const item = "tw:text-[13px] tw:transition-colors tw:hover:text-paper-raised";

function SocialRow({ size = 8, icon = 3.5 }) {
  return (
    <ul className="tw:flex tw:items-center tw:gap-0.5">
      {SOCIALS.map(({ name, Icon, href }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Xilolo on ${name}`}
            className="tw:flex tw:items-center tw:justify-center tw:rounded-pill tw:transition-colors tw:hover:text-paper-raised"
            style={{ width: size * 4, height: size * 4 }}
          >
            <Icon style={{ width: icon * 4, height: icon * 4 }} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function SectionFooterCTA({ showCta = true, compact = false }) {
  /* ── Compact strip: one screen, no scrolling ───────────────────────────── */
  if (compact) {
    return (
      <footer className="tw:bg-ink" style={{ color: FOOTER_TEXT }}>
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-center tw:gap-3 tw:px-4 tw:py-4 tw:md:flex-row tw:md:justify-between tw:md:px-8">
          <img
            src="/logo.png"
            alt="Xilolo"
            className="tw:h-5 tw:w-[76px] tw:shrink-0 tw:object-contain tw:brightness-0 tw:invert"
          />
          <nav className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-x-5 tw:gap-y-1">
            {COMPACT_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={item}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="tw:flex tw:items-center tw:gap-4">
            <SocialRow />
            <span className="tw:text-[11px]">© {new Date().getFullYear()} Xilolo</span>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full footer: content pages ────────────────────────────────────────── */
  return (
    <footer className="tw:bg-ink" style={{ color: FOOTER_TEXT }}>
      {showCta ? (
        <div className="tw:border-b tw:border-hairline-dark">
          <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-start tw:justify-between tw:gap-4 tw:px-4 tw:py-8 tw:md:flex-row tw:md:items-center tw:md:px-8">
            <p className="tw:font-display tw:text-lg tw:font-bold tw:tracking-[-0.01em] tw:text-paper-raised">
              Ready to host your first event?
            </p>
            <Button as={Link} to="/auth/signup" size="md" className="tw:shrink-0">
              Get started
              <ArrowRight className="tw:size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-4 tw:py-9 tw:md:px-8">
        <div className="tw:grid tw:gap-8 tw:md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="tw:flex tw:flex-col tw:gap-3">
            <img
              src="/logo.png"
              alt="Xilolo"
              className="tw:h-6 tw:w-[92px] tw:shrink-0 tw:object-contain tw:brightness-0 tw:invert"
            />
            <a href="mailto:support@xilolo.com" className={item}>
              support@xilolo.com
            </a>
            <p className="tw:text-xs tw:leading-relaxed">
              16192 Coastal Highway, Lewes
              <br />
              Delaware 19958
            </p>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="tw:flex tw:flex-col tw:gap-2.5">
              <p className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:opacity-70">
                {heading}
              </p>
              <ul className="tw:flex tw:flex-col tw:gap-1.5">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className={item}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tw:mt-9 tw:flex tw:flex-col tw:gap-4 tw:border-t tw:border-hairline-dark tw:pt-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-5 tw:gap-y-2">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={item}>
              iOS app
            </a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={item}>
              Android app
            </a>
          </div>
          <SocialRow />
        </div>
      </div>

      <div className="tw:border-t tw:border-hairline-dark">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:gap-2 tw:px-4 tw:py-4 tw:text-xs tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:px-8">
          <p>© {new Date().getFullYear()} Xilolo Technologies</p>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-4">
            <Link to="/terms-of-service" className="tw:hover:text-paper-raised">
              Terms
            </Link>
            <Link to="/privacy-policy" className="tw:hover:text-paper-raised">
              Privacy
            </Link>
            <Link to="/community-guidelines" className="tw:hover:text-paper-raised">
              Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
