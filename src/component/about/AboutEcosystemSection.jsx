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
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-slate-500 tw:font-semibold">
          Made for real events
        </span>

        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-3xl tw:font-black tw:text-slate-900">
          Built for organisers, performers, and fans.
        </span>

        <span className="tw:mt-2 tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-2xl tw:leading-relaxed">
          Xilolo is a platform for recurring events and serious creators. We
          built it for the way live shows actually run — with real audiences
          and real revenue.
        </span>
      </motion.div>

      <motion.div
        className="tw:grid tw:grid-cols-1 tw:md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] tw:gap-8 tw:items-start"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Left: text */}
        <motion.div
          className="tw:space-y-4 tw:text-sm tw:md:text-[15px] tw:text-slate-700 tw:leading-relaxed"
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

          {/* Inline feature chips */}
          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:pt-2">
            {["Creator tools", "Ticketing", "Live chat", "Replays", "Analytics", "Payouts"].map((chip) => (
              <span
                key={chip}
                className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-1 tw:text-[11px] tw:text-slate-700 tw:font-medium tw:shadow-sm"
              >
                <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-neon tw:shadow-[0_0_8px_rgba(0,245,255,0.45)]" />
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right: metric cards grid */}
        <motion.div
          className="tw:grid tw:grid-cols-2 tw:gap-4"
          variants={fadeUp}
          custom={0.18}
        >
          {/* 24/7 card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="tw:rounded-2xl tw:bg-primary tw:text-white tw:p-4 tw:flex tw:flex-col tw:justify-between tw:min-h-[140px] tw:relative tw:overflow-hidden tw:shadow-[0_18px_45px_rgba(0,0,0,0.22),0_0_24px_rgba(0,245,255,0.10)]"
          >
            <div aria-hidden className="tw:absolute tw:-right-6 tw:-top-6 tw:h-20 tw:w-20 tw:rounded-full tw:bg-neon/10 tw:blur-xl" />
            <span className="tw:text-[10px] tw:uppercase tw:tracking-[0.18em] tw:text-white/50 tw:font-semibold">
              Reliability
            </span>
            <div>
              <span className="tw:block tw:text-[32px] tw:font-black tw:font-league tw:leading-none">
                24/7
              </span>
              <span className="tw:block tw:text-[11px] tw:text-white/60 tw:mt-1">
                Your events stay stable and supported.
              </span>
            </div>
          </motion.div>

          {/* Team-ready card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="tw:rounded-2xl tw:bg-white tw:border tw:border-slate-200/80 tw:p-4 tw:min-h-[140px] tw:relative tw:overflow-hidden"
            style={{ boxShadow: "0 14px 40px rgba(15,23,42,0.06)" }}
          >
            <div aria-hidden className="tw:absolute tw:-right-6 tw:-top-6 tw:h-20 tw:w-20 tw:rounded-full tw:bg-primary/5 tw:blur-xl" />
            <span className="tw:text-[10px] tw:uppercase tw:tracking-[0.18em] tw:text-slate-500 tw:font-semibold">
              Team-ready
            </span>
            <span className="tw:mt-3 tw:block tw:text-[14px] tw:font-semibold tw:text-slate-900">
              Roles for your team and collaborators.
            </span>
            <span className="tw:mt-1 tw:block tw:text-[11px] tw:text-slate-600">
              Invite people in without losing control.
            </span>
          </motion.div>

          {/* Full-width global card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="tw:col-span-2 tw:rounded-2xl tw:bg-linear-to-r tw:from-slate-900 tw:to-primarySecond tw:text-white tw:p-4 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:relative tw:overflow-hidden"
          >
            <div aria-hidden className="tw:absolute tw:-right-10 tw:top-0 tw:h-20 tw:w-32 tw:bg-neon/10 tw:blur-2xl tw:rounded-full" />
            <div className="tw:relative">
              <span className="tw:block tw:text-[13px] tw:font-semibold tw:max-w-xs">
                Built for creators everywhere.
              </span>
              <span className="tw:block tw:text-[11px] tw:text-white/60 tw:mt-0.5">
                From small rooms to big stages.
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2 tw:relative">
              <div className="tw:flex tw:-space-x-2">
                {["🇳🇬", "🇺🇸", "🇬🇧", "🇿🇦"].map((flag, i) => (
                  <div
                    key={i}
                    className="tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/10 tw:border tw:border-white/20 tw:text-[12px]"
                  >
                    {flag}
                  </div>
                ))}
              </div>
              <span className="tw:text-[11px] tw:text-white/60">+42 countries</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
