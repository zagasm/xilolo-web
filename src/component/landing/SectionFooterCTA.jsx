import React from "react";
import { Link } from "react-router-dom";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui";

/**
 * Site footer — sleek pass.
 *
 * Previous version was a heavy slab: py-14/py-12/py-6 padding, an h-8 logo, an
 * h-11 app-button row and 40px social targets, which made the footer shout
 * louder than the page above it. This keeps the same content and the same dark
 * ink surface (the design system's one deliberate break) but tightens the
 * rhythm so it reads as a quiet close rather than a second page.
 *
 * All social URLs, the support email and the address are carried over verbatim
 * from the original footer — do not replace them with guesses.
 *
 * showCta={false} drops the closing CTA band; the auth pages use that, since
 * "Ready to host your first event? Get started" is pointless on a signup page.
 */
const APP_STORE_URL = "https://apps.apple.com/ng/app/zagasm-studios/id6755035145";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.zagasmstudio.app";

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

const linkClass =
  "tw:text-[13px] tw:text-muted-dark tw:transition-colors tw:hover:text-paper-raised";

export default function SectionFooterCTA({ showCta = true }) {
  return (
    <footer className="tw:bg-ink tw:text-body-dark">
      {showCta ? (
        <div className="tw:border-b tw:border-hairline-dark">
          <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw-flex-col tw:items-start tw:justify-between tw:gap-4 tw:px-4 tw:py-8 tw:md:flex-row tw:md:items-center tw:md:px-8">
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
          {/* Brand */}
          <div className="tw:flex tw:flex-col tw:gap-3">
            <img
              src="/logo.png"
              alt="Xilolo"
              className="tw:h-6 tw:w-auto tw:brightness-0 tw:invert"
            />
            <a href="mailto:support@xilolo.com" className={linkClass}>
              support@xilolo.com
            </a>
            <p className="tw:text-xs tw:leading-relaxed tw:text-muted-dark">
              16192 Coastal Highway, Lewes
              <br />
              Delaware 19958
            </p>
          </div>

          {/* Links — compact columns, same destinations as the nav */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="tw:flex tw:flex-col tw:gap-2.5">
              <p className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:text-faint-dark">
                {heading}
              </p>
              <ul className="tw:flex tw:flex-col tw:gap-1.5">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* One quiet utility row: apps left, socials right */}
        <div className="tw:mt-9 tw:flex tw:flex-col tw:gap-4 tw:border-t tw:border-hairline-dark tw:pt-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-5 tw:gap-y-2">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              iOS app
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Android app
            </a>
          </div>

          <ul className="tw:flex tw:items-center tw:gap-1">
            {SOCIALS.map(({ name, Icon, href }) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Xilolo on ${name}`}
                  className="tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-pill tw:text-muted-dark tw:transition-colors tw:hover:bg-ink-raised tw:hover:text-paper-raised"
                >
                  <Icon className="tw:size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tw:border-t tw:border-hairline-dark">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw-flex-col tw:gap-2 tw:px-4 tw:py-4 tw:text-xs tw:text-faint-dark tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:px-8">
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
