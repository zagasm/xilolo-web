import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clapperboard, Play } from "lucide-react";
import { LiveDashboardMockup } from "./mockups/LiveDashboardMockup";
import { Button, Chip, Eyebrow, LiveBadge, StatTile } from "../ui";

/**
 * Landing hero — revamped to DESIGN.md.
 *
 * What changed and why:
 *   - The orbiting glass icon chips are gone. The mockup is the single focal
 *     element; the app's own dashboard already carries the live numbers, so
 *     floating stat cards outside it were duplicate decoration.
 *   - One accent (teal #0EA5B4) and one primary CTA. Secondary action is an
 *     outline button, not a second colour.
 *   - Headline now states the marketplace promise (live + tickets + payouts)
 *     instead of three slogans in a row.
 *   - The word-by-word headline carousel was removed: it delayed first paint
 *     and competed with the mockup. One short reveal, then stillness.
 *   - Everything respects prefers-reduced-motion.
 */
export default function HeroV2() {
  const reduce = useReducedMotion();

  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section className="tw:relative tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-4 tw:pb-16 tw:pt-10 tw:md:px-8 tw:md:pb-24">
      <div className="tw:grid tw:items-center tw:gap-12 tw:lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] tw:lg:gap-16">
        {/* ── Copy ─────────────────────────────────────────────────────────── */}
        <div className="tw:flex tw:flex-col tw:gap-6">
          <motion.div {...rise(0)} className="tw:flex tw:items-center tw:gap-3">
            <LiveBadge label="Live now" />
            <Eyebrow className="tw:text-muted">Creators marketplace</Eyebrow>
          </motion.div>

          <motion.h1
            {...rise(0.06)}
            className="tw:font-display tw:text-[clamp(2.25rem,5.2vw,3.5rem)] tw:font-extrabold tw:leading-[1.06] tw:tracking-[-0.02em]"
          >
            Go live. Sell tickets.
            <br />
            <span className="tw:text-accent-deep">Get paid.</span>
          </motion.h1>

          <motion.p
            {...rise(0.12)}
            className="tw:max-w-[52ch] tw:text-base tw:leading-relaxed tw:text-muted tw:md:text-lg"
          >
            Xilolo gives creators and brands everything needed to host ticketed
            live shows — streaming that holds up, replays that keep selling, and
            payouts you can count on.
          </motion.p>

          <motion.div {...rise(0.18)} className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <Button as="a" href="/auth/signup" size="lg">
              Start free
              <ArrowRight className="tw:size-4" />
            </Button>
            <Button as="a" href="#how-it-works" variant="secondary" size="lg">
              <Play className="tw:size-4" />
              See how it works
            </Button>
          </motion.div>

          <motion.div {...rise(0.24)} className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Chip icon={Clapperboard}>Ticketed events</Chip>
            <Chip>Replays</Chip>
            <Chip>Payouts</Chip>
            <Chip>Multi-host</Chip>
          </motion.div>

          <motion.p {...rise(0.3)} className="tw:text-xs tw:text-muted">
            Trusted by 2,500+ creators and teams.
          </motion.p>
        </div>

        {/* ── The single focal element ─────────────────────────────────────── */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 24, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
              })}
          className="tw:relative"
        >
          <LiveDashboardMockup />
        </motion.div>
      </div>

      {/* ── Capability strip — facts, not invented metrics ─────────────────── */}
      <div className="tw:mt-14 tw:grid tw:gap-3 tw:sm:grid-cols-3" id="how-it-works">
        <StatTile label="Create" value="Event in minutes" delta="No encoder setup" />
        <StatTile label="Go live" value="One click" delta="We handle the pipeline" />
        <StatTile label="Get paid" value="Ticket revenue" delta="Tracked per event" />
      </div>
    </section>
  );
}
