import React from "react";
import { Link } from "react-router-dom";
import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { Button } from "../ui";

/**
 * Site footer.
 *
 * Was: a "social link" placeholder row rendered from PNG icons under
 * public/images/icons/ (facebook.png, x.png, …) — brand marks as bitmaps, which
 * is the single clearest "not a real product" tell in a footer — plus bootstrap
 * grid classes and hardcoded greys.
 *
 * Now: real SVG brand marks, the same link groups as the nav (no invented
 * destinations), a dark ink surface as the one deliberate break in the page, and
 * the contact details that were already in the old footer.
 *
 * All five social URLs, the email and the address are carried over verbatim from
 * the previous footer — do not replace them with guesses.
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
      { to: "/privacy-policy", label: "Privacy policy" },
      { to: "/terms-of-service", label: "Terms of service" },
      { to: "/community-guidelines", label: "Community guidelines" },
      { to: "/data-protection", label: "Data protection" },
    ],
  },
];

export default function SectionFooterCTA() {
  return (
    <footer className="tw:bg-ink tw:text-body-dark">
      {/* Closing CTA — one primary action, as everywhere else. */}
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-start tw:justify-between tw:gap-6 tw:px-4 tw:py-14 tw:md:flex-row tw:md:items-center tw:md:px-8">
        <div>
          <p className="tw:font-display tw:text-[clamp(1.5rem,3vw,2rem)] tw:font-extrabold tw:leading-tight tw:tracking-[-0.01em] tw:text-paper-raised">
            Ready to host your first event?
          </p>
          <p className="tw:mt-2 tw:max-w-[52ch] tw:text-sm tw:text-muted-dark">
            Create an account, set up your event, and go live — ticketing, streaming and payouts in
            one place.
          </p>
        </div>
        <Button as={Link} to="/auth/signup" size="lg" className="tw:shrink-0">
          Get started
          <ArrowRight className="tw:size-4" />
        </Button>
      </div>

      <div className="tw:border-t tw:border-hairline-dark">
        <div className="tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-4 tw:py-12 tw:md:px-8">
          <div className="tw:grid tw:gap-10 tw:md:grid-cols-[1.4fr_repeat(4,1fr)]">
            {/* Brand */}
            <div className="tw:flex tw:flex-col tw:gap-4">
              <img src="/logo.png" alt="Xilolo" className="tw:h-8 tw:w-auto tw:brightness-0 tw:invert" />
              <p className="tw:max-w-[34ch] tw:text-sm tw:text-muted-dark">
                Live events, ticketed shows and payouts for creators and brands.
              </p>
              <div className="tw:flex tw:flex-col tw:gap-2 tw:text-sm">
                <a
                  href="mailto:support@xilolo.com"
                  className="tw:inline-flex tw:items-center tw:gap-2 tw:text-muted-dark tw:transition-colors tw:hover:text-paper-raised"
                >
                  <Mail className="tw:size-4" aria-hidden="true" />
                  support@xilolo.com
                </a>
                <span className="tw:inline-flex tw:items-start tw:gap-2 tw:text-muted-dark">
                  <MapPin className="tw:mt-0.5 tw:size-4 tw:shrink-0" aria-hidden="true" />
                  <span>
                    16192 Coastal Highway
                    <br />
                    Lewes, Delaware 19958
                  </span>
                </span>
              </div>
            </div>

            {/* Link groups — same destinations as the nav */}
            {COLUMNS.map(({ heading, links }) => (
              <div key={heading} className="tw:flex tw:flex-col tw:gap-3">
                <p className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
                  {heading}
                </p>
                <ul className="tw:flex tw:flex-col tw:gap-2.5">
                  {links.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="tw:text-sm tw:text-body-dark tw:transition-colors tw:hover:text-accent"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* App + social row */}
          <div className="tw:mt-12 tw:flex tw:flex-col tw:gap-6 tw:border-t tw:border-hairline-dark tw:pt-8 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:h-11 tw:items-center tw:rounded-pill tw:border tw:border-hairline-dark tw:px-4 tw:text-sm tw:font-medium tw:text-body-dark tw:transition-colors tw:hover:border-accent/40"
              >
                Download for iOS
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:h-11 tw:items-center tw:rounded-pill tw:border tw:border-hairline-dark tw:px-4 tw:text-sm tw:font-medium tw:text-body-dark tw:transition-colors tw:hover:border-accent/40"
              >
                Get it on Google Play
              </a>
            </div>

            <ul className="tw:flex tw:items-center tw:gap-2">
              {SOCIALS.map(({ name, Icon, href }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Xilolo on ${name}`}
                    className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-hairline-dark tw:text-body-dark tw:transition-colors tw:hover:border-accent/40 tw:hover:text-accent"
                  >
                    <Icon className="tw:size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="tw:border-t tw:border-hairline-dark">
        <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col tw:gap-3 tw:px-4 tw:py-6 text-sm tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:px-8">
          <p className="tw:text-xs tw:text-muted-dark">
            © {new Date().getFullYear()} Xilolo Technologies. All rights reserved.
          </p>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-5">
            <Link to="/terms-of-service" className="tw:text-xs tw:text-muted-dark tw:hover:text-accent">
              Terms
            </Link>
            <Link to="/privacy-policy" className="tw:text-xs tw:text-muted-dark tw:hover:text-accent">
              Privacy
            </Link>
            <Link
              to="/community-guidelines"
              className="tw:text-xs tw:text-muted-dark tw:hover:text-accent"
            >
              Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
