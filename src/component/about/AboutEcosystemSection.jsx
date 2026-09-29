import React from "react";
import { motion } from "framer-motion";
import { Card, Chip, SectionHeading } from "../ui";

/**
 * "Made for real events" — who the platform is for.
 *
 * The intro line used to end with "...real audiences and real revenue." The
 * revenue claim was removed (founder instruction); the rest of the copy is
 * carried over verbatim.
 *
 * Body copy uses <span className="tw:block">, not <p>: `#root p { color: inherit }`
 * outranks every tw:text-* utility on a paragraph, so <p> would lose the tokens.
 */
const FEATURES = [
  "Creator tools",
  "Ticketing",
  "Live chat",
  "Replays",
  "Analytics",
  "Payouts",
];

const FLAGS = ["🇳🇬", "🇺🇸", "🇬🇧", "🇿🇦"];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay },
  }),
};

export default function AboutEcosystemSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        custom={0}
        variants={fadeUp}
      >
        <SectionHeading
          eyebrow="Made for real events"
          title="Built for organisers, performers, and fans."
          subtitle="Xilolo is a platform for recurring events and serious creators. We built it for the way live shows actually run."
        />
      </motion.div>

      <div className="tw:grid tw:items-start tw:gap-8 tw:md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] tw:md:gap-10">
        {/* Copy + feature tags */}
        <motion.div
          className="tw:flex tw:flex-col tw:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0.08}
          variants={fadeUp}
        >
          <span className="tw:block tw:max-w-[62ch] tw:text-[15px] tw:leading-relaxed tw:text-muted">
            Xilolo is built for organisers who run shows regularly. Plan your calendar,
            manage performers, sell tickets, and pay out smoothly.
          </span>

          <span className="tw:block tw:max-w-[62ch] tw:text-[15px] tw:leading-relaxed tw:text-muted">
            After each event, you can see what worked. Who showed up, where people stayed
            engaged, and what to improve for the next show.
          </span>

          <span className="tw:block tw:max-w-[62ch] tw:text-[15px] tw:leading-relaxed tw:text-muted">
            The goal is simple. Run a professional live show from one place and stay in
            control of your brand, your audience, and your money.
          </span>

          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:pt-1">
            {FEATURES.map((feature) => (
              <Chip key={feature}>{feature}</Chip>
            ))}
          </div>
        </motion.div>

        {/* Supporting facts already on the page — carried over verbatim */}
        <motion.div
          className="tw:flex tw:flex-col tw:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0.16}
          variants={fadeUp}
        >
          <div className="tw:grid tw:gap-4 tw:sm:grid-cols-2">
            <Card dark className="tw:flex tw:flex-col tw:justify-between tw:gap-6">
              <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-ink-muted">
                Reliability
              </span>
              <div className="tw:flex tw:flex-col tw:gap-1">
                <span className="tw:block tw:font-display tw:text-3xl tw:font-extrabold tw:leading-none tw:tracking-[-0.02em] tw:text-paper-raised">
                  24/7
                </span>
                <span className="tw:block tw:text-[11px] tw:leading-relaxed tw:text-ink-muted">
                  Your events stay stable and supported.
                </span>
              </div>
            </Card>

            <Card className="tw:flex tw:flex-col tw:justify-between tw:gap-6">
              <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
                Team-ready
              </span>
              <div className="tw:flex tw:flex-col tw:gap-1">
                <span className="tw:block tw:text-sm tw:font-semibold tw:leading-snug tw:text-ink">
                  Roles for your team and collaborators.
                </span>
                <span className="tw:block tw:text-[11px] tw:leading-relaxed tw:text-muted">
                  Invite people in without losing control.
                </span>
              </div>
            </Card>
          </div>

          <Card className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
            <div className="tw:flex tw:flex-col tw:gap-1">
              <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink">
                Built for creators everywhere.
              </span>
              <span className="tw:block tw:text-[11px] tw:text-muted">
                From small rooms to big stages.
              </span>
            </div>

            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:flex tw:-space-x-2">
                {FLAGS.map((flag) => (
                  <span
                    key={flag}
                    className="tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-hairline tw:bg-chip tw:text-[12px]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
              <span className="tw:text-[11px] tw:text-muted">+42 countries</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
