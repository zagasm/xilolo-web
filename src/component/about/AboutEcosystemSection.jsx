// src/pages/about/AboutEcosystemSection.jsx
import React from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay },
  }),
};

export default function AboutEcosystemSection() {
  return (
    <section className="tw:space-y-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        custom={0}
        variants={fadeUp}
      >
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
          Made for real events
        </span>

        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
          Built for organisers, performers, and fans.
        </span>

        <span className="tw:mt-2 tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-2xl">
          Xilolo is a platform for recurring
          events and serious creators. We built it for the way live shows
          actually run, with real audiences and real revenue.
        </span>
      </motion.div>

      <motion.div
        className="tw:grid tw:grid-cols-1 tw:md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] tw:gap-8 tw:items-start"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.div
          className="tw:space-y-4 tw:text-sm tw:md:text-[15px] tw:text-slate-700"
          variants={fadeUp}
          custom={0.1}
        >
          <span className="tw:block">
            Xilolo is built for organisers who run shows regularly. Plan your
            calendar, manage performers, sell tickets, and pay out smoothly.
          </span>

          <span className="tw:block">
            After each event, you can see what worked. Who showed up, where
            people stayed engaged, and what to improve for the next show.
          </span>

          <span className="tw:block">
            The goal is simple. Run a professional live show from one place and
            stay in control of your brand, your audience, and your money.
          </span>
        </motion.div>

        <motion.div
          className="tw:grid tw:grid-cols-2 tw:gap-4"
          variants={fadeUp}
          custom={0.18}
        >
          <div className="tw:rounded-2xl tw:bg-slate-900 tw:text-white tw:p-4 tw:flex tw:flex-col tw:justify-between tw:min-h-[130px]">
            <span className="tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-white/60">
              Reliability
            </span>
            <span className="tw:mt-3 tw:block tw:text-[24px] tw:font-semibold">
              24 / 7
            </span>
            <span className="tw:mt-1 tw:block tw:text-[11px] tw:text-white/70">
              Your events stay stable and supported.
            </span>
          </div>

          <div className="tw:rounded-2xl tw:bg-white tw:border tw:border-slate-200/80 tw:p-4 tw:min-h-[130px] tw:shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <span className="tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
              Team-ready
            </span>
            <span className="tw:mt-3 tw:block tw:text-[14px] tw:font-medium tw:text-slate-900">
              Roles for your team and collaborators.
            </span>
            <span className="tw:mt-1 tw:block tw:text-[11px] tw:text-slate-700">
              Invite people in without losing control.
            </span>
          </div>

          <div className="tw:col-span-2 tw:rounded-2xl tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:text-white tw:p-4 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
            <span className="tw:block tw:text-[13px] tw:font-medium tw:max-w-xs">
              Built for creators everywhere.
            </span>
            <span className="tw:block tw:text-[11px] tw:text-white/80 tw:max-w-sm">
              From small rooms to big stages, Xilolo grows with your audience.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
