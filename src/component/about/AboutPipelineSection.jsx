// src/pages/about/AboutPipelineSection.jsx
import React from "react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

export default function AboutPipelineSection() {
  return (
    <section className="tw:space-y-7">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={item}
      >
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-primarySecond">
          How it works
        </span>

        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
          From setup to showtime, all in one flow.
        </span>

        <span className="tw:mt-2 tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-2xl">
          Create an event, go live, and keep the whole production organized in
          one place. Your show stays smooth and your audience stays locked in.
        </span>
      </motion.div>

      <motion.div
        className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={container}
      >
        {/* Step 1 */}
        <motion.div
          variants={item}
          className="tw:relative tw:rounded-2xl tw:bg-slate-900 tw:text-white tw:p-5 tw:overflow-hidden tw:min-h-[170px]"
        >
          <span className="tw:absolute tw:-left-10 tw:-top-10 tw:h-24 tw:w-24 tw:rounded-full tw:bg-primary/40 tw:blur-2xl" />
          <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-white/60">
            01 · Setup
          </span>
          <span className="tw:mt-3 tw:block tw:text-[15px] tw:font-medium">
            Connect and go LIVE.
          </span>
          <span className="tw:mt-2 tw:block tw:text-[12px] tw:text-white/70">
            Connect OBS, Ecamm, or hardware encoders. Route to YouTube, Twitch,
            or a private stage in a few clicks.
          </span>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          variants={item}
          className="tw:relative tw:rounded-2xl tw:bg-linear-to-b tw:from-primary/10 tw:to-primarySecond/10 tw:border tw:border-primary/20 tw:p-5 tw:min-h-[170px]"
        >
          <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-primary">
            02 · Control Room
          </span>
          <span className="tw:mt-3 tw:block tw:text-[15px] tw:font-medium tw:text-slate-900">
            Run your show cleanly.
          </span>
          <span className="tw:mt-2 tw:block tw:text-[12px] tw:text-slate-700">
            Manage guests, keep the stream steady, and stay focused while the
            show is live.
          </span>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          variants={item}
          className="tw:relative tw:rounded-2xl tw:bg-white tw:border tw:border-slate-200/80 tw:p-5 tw:min-h-[170px] tw:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
        >
          <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.16em] tw:text-slate-500">
            03 · Tickets
          </span>
          <span className="tw:mt-3 tw:block tw:text-[15px] tw:font-medium tw:text-slate-900">
            Sell tickets and keep earning.
          </span>
          <span className="tw:mt-2 tw:block tw:text-[12px] tw:text-slate-700">
            Create ticketed events, sell access, and keep your content working.
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
