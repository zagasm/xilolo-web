import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card, Chip, Eyebrow, StatTile } from "../ui";

/**
 * About hero.
 *
 * NOTE — the old "$480K+ / Revenue generated" stat tile was REMOVED on purpose
 * (founder instruction: no revenue figure on this page). Do not re-add it, and do
 * not substitute another number. The three stats below are the ones that were
 * already on the page, carried over verbatim.
 *
 * Text note — body copy is rendered with <span className="tw:block"> rather than
 * <p>: the template stylesheet's `#root p { color: inherit }` (specificity 1,0,1)
 * silently beats any `tw:text-*` utility on a paragraph, so a <p> would ignore the
 * muted/accent tokens. Spans keep the token colours. (Primitives in ../ui still use
 * <p> internally — that is theirs to fix, not this page's.)
 */
const stats = [
  { value: "2,500+", label: "Creators & teams" },
  { value: "98%", label: "Stream uptime" },
  { value: "12K+", label: "Tickets sold" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay },
  }),
};

export default function AboutHeroSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-10 tw:md:gap-12">
      <div className="tw:grid tw:items-start tw:gap-8 tw:md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] tw:md:gap-10">
        {/* Headline */}
        <motion.div
          className="tw:flex tw:flex-col tw:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
          variants={fadeUp}
        >
          <Eyebrow>About Xilolo</Eyebrow>

          <h1 className="tw:mb-0 tw:font-display tw:text-[clamp(2rem,5vw,3.25rem)] tw:font-extrabold tw:leading-[1.06] tw:tracking-[-0.02em] tw:text-ink">
            Turning <span className="tw:text-accent-deep">LIVE shows</span> into a real
            business.
          </h1>

          <span className="tw:block tw:max-w-[58ch] tw:text-[15px] tw:leading-relaxed tw:text-muted">
            Xilolo is a home for live events that feel premium. Host shows, sell tickets,
            and build a real audience that keeps coming back — all from one clean
            platform.
          </span>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:pt-1">
            <Button as={Link} to="/auth/signup" size="md">
              Get started
            </Button>
            <Button as={Link} to="/contact" variant="secondary" size="md">
              Contact
            </Button>
          </div>
        </motion.div>

        {/* Dark surface — the one "on-air" moment in the hero, as in the app */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0.12}
          variants={fadeUp}
        >
          <Card dark className="tw:flex tw:flex-col tw:gap-4">
            <Chip className="tw:self-start">Built for live shows</Chip>

            <span className="tw:block tw:text-[15px] tw:font-semibold tw:leading-snug tw:text-paper-raised">
              Built for creators and teams who want consistent shows, not random lives.
            </span>

            <span className="tw:block tw:text-[13px] tw:leading-relaxed tw:text-ink-muted">
              Plan events, manage your show, and keep everything in one place — from
              setup to payout.
            </span>

            <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-hairline-dark tw:pt-3">
              <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-ink-muted">
                Next show
              </span>
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-semibold tw:text-paper-raised">
                <span
                  aria-hidden="true"
                  className="tw:size-1.5 tw:rounded-pill tw:bg-success"
                />
                Fri 8 PM WAT
              </span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Stats — 3 tiles. No revenue tile: it was removed deliberately. */}
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={i * 0.06}
            variants={fadeUp}
          >
            <StatTile label={stat.label} value={stat.value} className="tw:h-full" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
