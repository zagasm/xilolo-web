import React from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

export default function AboutHeroSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-10 tw:md:flex-row tw:items-start tw:justify-between">
      <motion.div
        className="tw:max-w-3xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        custom={0}
        variants={fadeUp}
      >
        <span className="tw:block tw:text-[10px] tw:md:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-primary tw:mb-3">
          About Xilolo
        </span>

        <span className="tw:font-league tw:block tw:text-3xl tw:md:text-4xl tw:lg:text-5xl tw:font-[900] tw:leading-[1] tw:mb-4">
          Turning{" "}
          <span className="tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:bg-clip-text tw:text-transparent">
            LIVE shows <br />
          </span>{" "}
          into a real business.
        </span>

        <span className="tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-xl">
          Xilolo is a home for live events that feel premium. Host
          shows, sell tickets, and build a real audience that keeps coming back.
        </span>
      </motion.div>

      <motion.div
        className="tw:w-full tw:max-w-sm tw:md:max-w-xs"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        custom={0.15}
        variants={fadeUp}
      >
        <div className="tw:relative tw:rounded-3xl tw:bg-slate-900 tw:text-white tw:p-5 tw:overflow-hidden tw:shadow-[0_18px_60px_rgba(15,23,42,0.45)]">
          <span className="tw:absolute tw:-right-10 tw:-top-10 tw:h-32 tw:w-32 tw:rounded-full tw:bg-primary/40 tw:blur-2xl" />
          <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-white/60">
            Built for live shows
          </span>
          <span className="tw:mt-3 tw:block tw:text-[15px] tw:font-medium">
            Built for creators and teams who want consistent shows, not random
            lives.
          </span>
          <span className="tw:mt-4 tw:block tw:text-[11px] tw:text-white/70">
            Plan events, manage your show, and keep everything in one place from
            setup to payout.
          </span>
        </div>
      </motion.div>
    </section>
  );
}
