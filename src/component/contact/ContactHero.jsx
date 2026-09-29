import React from "react";
import { Radio, Waves, Clock, HeadphonesIcon } from "lucide-react";
import { Card, Chip } from "../ui";

/**
 * Contact hero.
 *
 * DESIGN.md: flat surfaces + hairline borders, no shadows, one accent per
 * group, accent as a FILL only (accent TEXT uses accent-deep). The old version
 * of this file carried the retired tells — neon-cyan glow blobs, a
 * white-on-accent card, a coral/red headline span and a dozen drop shadows.
 *
 * Contact details here are the real ones already in the repo
 * (support@xilolo.com) — nothing invented.
 *
 * ── Why the `!` suffixes ────────────────────────────────────────────────────
 * Tailwind ships in `@layer utilities` while Bootstrap's reboot and the legacy
 * template sheet are UNLAYERED, and unlayered declarations outrank layered ones
 * in the cascade. So on element selectors their rules win on the properties they
 * declare: `h1..h6{font-weight:500;margin-bottom:.5rem}`, `button{border-radius:0}`,
 * `a{color:…}` and `#root p{color:inherit}`. Utilities that collide with those get
 * Tailwind's important modifier so the design tokens actually land.
 */

const micro = "tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em]";

const CHECK_INS = [
  {
    icon: Clock,
    label: "Reply time",
    value: "< 24 hrs",
    note: "Same-day on weekdays.",
  },
  {
    icon: HeadphonesIcon,
    label: "Support",
    value: "7 days",
    note: "Available when it matters.",
  },
];

export default function ContactHero() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-10 tw:lg:flex-row tw:lg:items-start tw:lg:gap-12">
      {/* ── Left: copy ─────────────────────────────────────────────────────── */}
      <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-5">
        <p className={`tw:m-0! tw:text-accent-deep! ${micro}`}>Contact Xilolo</p>

        <h1 className="tw:m-0! tw:font-display tw:text-[clamp(2rem,4.2vw,3rem)]! tw:font-extrabold! tw:leading-[1.05]! tw:tracking-[-0.02em] tw:text-ink!">
          Let&rsquo;s plan your next live event.
        </h1>

        <p className="tw:m-0! tw:max-w-[62ch] tw:text-sm tw:leading-relaxed tw:text-muted-strong! tw:md:text-base">
          Tell us what you want to host and how soon it is. We will suggest a
          simple setup, help you run a clean show, and guide you on ticketing if
          you want to charge for access.
        </p>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <Chip icon={Radio}>Concerts · Shows · Talk sessions · Communities</Chip>
          <Chip icon={Waves}>Ticketing · Live chat · Replays</Chip>
        </div>
      </div>

      {/* ── Right: quick check-in card ─────────────────────────────────────── */}
      <Card className="tw:flex tw:w-full tw:max-w-md tw:flex-col tw:gap-4 tw:p-5 tw:md:p-6">
        <div className="tw:flex tw:flex-col tw:gap-2">
          <p className={`tw:m-0! tw:text-accent-deep! ${micro}`}>Quick check-in</p>
          <p className="tw:m-0! tw:text-[15px] tw:font-semibold tw:leading-snug tw:text-ink!">
            Share your event date and what you want to host. We&rsquo;ll reply
            with the best way to set it up on Xilolo.
          </p>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-3">
          {CHECK_INS.map(({ icon: Icon, label, value, note }) => (
            <div
              key={label}
              className="tw:flex tw:flex-col tw:gap-1 tw:rounded-card tw:border tw:border-hairline tw:bg-paper tw:px-3 tw:py-3"
            >
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <Icon className="tw:size-3.5 tw:text-accent-deep" aria-hidden="true" />
                <span className={`${micro} tw:text-muted-strong`}>{label}</span>
              </span>
              <span className="tw:font-display tw:text-xl tw:font-extrabold tw:tracking-[-0.01em] tw:text-ink">
                {value}
              </span>
              <span className="tw:text-xs tw:leading-snug tw:text-muted-strong">{note}</span>
            </div>
          ))}
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-hairline tw:pt-3">
          <span className="tw:text-sm tw:text-muted-strong">Prefer email?</span>
          {/* 44px tap target; accent TEXT uses accent-deep, never the accent fill */}
          <a
            href="mailto:support@xilolo.com"
            className="tw:inline-flex tw:h-11 tw:items-center tw:text-sm tw:font-semibold tw:text-accent-deep! tw:hover:underline!"
          >
            support@xilolo.com
          </a>
        </div>
      </Card>
    </section>
  );
}
