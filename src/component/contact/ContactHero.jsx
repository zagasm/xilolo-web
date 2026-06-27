import React from "react";
import { Sparkles, Radio, Waves, Clock, HeadphonesIcon } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ContactHero() {
  return (
    <motion.section
      className="tw:relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Soft background glow */}
      <div className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:-top-24 tw:-z-10 tw:flex tw:justify-center">
        <motion.div
          className="tw:h-72 tw:w-72 tw:rounded-full tw:bg-neon/12 tw:blur-3xl tw:opacity-60"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
      </div>

      <div className="tw:flex tw:flex-col tw:gap-10 tw:md:flex-row tw:md:items-center">
        {/* Left: text */}
        <motion.div className="tw:flex-1" variants={itemVariants}>
          <motion.div
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary/5 tw:px-3 tw:py-1 tw:border tw:border-neon/20 tw:mb-4 tw:shadow-[0_0_18px_rgba(0,245,255,0.08)]"
            whileHover={{ y: -1, scale: 1.01 }}
          >
            <Sparkles className="tw:w-3.5 tw:h-3.5 tw:text-primary" />
            <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.22em] tw:text-primary tw:font-semibold">
              Contact Xilolo
            </span>
          </motion.div>

          <span className="tw:font-league tw:block tw:text-3xl tw:md:text-4xl tw:lg:text-[52px] tw:font-black tw:leading-[1] tw:mb-4">
            Let's plan your next{" "}
            <span className="tw:text-red-600">live event</span>.
          </span>

          <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-600 tw:max-w-xl tw:mb-5 tw:leading-relaxed">
            Tell us what you want to host and how soon it is. We will suggest a
            simple setup, help you run a clean show, and guide you on ticketing
            if you want to charge for access.
          </span>

          <motion.div
            className="tw:flex tw:flex-wrap tw:gap-3 tw:text-[11px] tw:text-slate-500"
            variants={itemVariants}
          >
            <motion.div
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-3 tw:py-1.5 tw:border tw:border-slate-200/80"
              style={{ boxShadow: "0 10px 30px rgba(15,23,42,0.07)" }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <Radio className="tw:w-3.5 tw:h-3.5 tw:text-primary" />
              <span>Concerts · Shows · Talk sessions · Communities</span>
            </motion.div>

            <motion.div
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-slate-900 tw:px-3 tw:py-1.5 tw:text-white tw:text-[11px]"
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <Waves className="tw:w-3.5 tw:h-3.5 tw:text-white/60" />
              <span className="tw:text-white/80">Ticketing · Live chat · Replays</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right: highlight card */}
        <motion.div
          className="tw:flex-1 tw:max-w-md tw:mx-auto tw:w-full"
          variants={itemVariants}
        >
          <motion.div
            className="tw:rounded-3xl tw:bg-primary tw:text-white tw:p-5 tw:md:p-6 tw:relative tw:overflow-hidden"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            style={{ boxShadow: "0 32px 80px rgba(5,5,5,0.55), 0 0 30px rgba(0,245,255,0.10)" }}
          >
            {/* Inner glow accents */}
            <div aria-hidden className="tw:absolute tw:-right-12 tw:-top-12 tw:h-44 tw:w-44 tw:rounded-full tw:bg-neon/10 tw:blur-2xl" />
            <div aria-hidden className="tw:absolute tw:-left-12 tw:bottom-0 tw:h-40 tw:w-40 tw:rounded-full tw:bg-white/4 tw:blur-2xl" />

            <div className="tw:relative">
              <span className="tw:block tw:text-[10px] tw:uppercase tw:tracking-[0.22em] tw:text-white/50 tw:mb-3 tw:font-semibold">
                Quick check-in
              </span>

              <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:mb-5 tw:text-white/95 tw:leading-snug">
                Share your event date and what you want to host. We'll reply
                with the best way to set it up on Xilolo.
              </span>

              <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mb-4">
                <div className="tw:rounded-2xl tw:bg-white/8 tw:border tw:border-white/10 tw:px-3 tw:py-3">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
                    <Clock className="tw:w-3 tw:h-3 tw:text-white/50" />
                    <span className="tw:block tw:text-[10px] tw:text-white/50">Reply time</span>
                  </div>
                  <span className="tw:block tw:text-xl tw:font-black tw:font-league">&lt; 24 hrs</span>
                  <span className="tw:block tw:text-[10px] tw:text-white/45 tw:mt-0.5">
                    Same-day on weekdays.
                  </span>
                </div>

                <div className="tw:rounded-2xl tw:bg-white/8 tw:border tw:border-white/10 tw:px-3 tw:py-3">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
                    <HeadphonesIcon className="tw:w-3 tw:h-3 tw:text-white/50" />
                    <span className="tw:block tw:text-[10px] tw:text-white/50">Support</span>
                  </div>
                  <span className="tw:block tw:text-xl tw:font-black tw:font-league">7 days</span>
                  <span className="tw:block tw:text-[10px] tw:text-white/45 tw:mt-0.5">
                    Available when it matters.
                  </span>
                </div>
              </div>

              <div className="tw:rounded-2xl tw:bg-white/8 tw:border tw:border-white/10 tw:px-3 tw:py-2.5 tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-[11px] tw:text-white/60">Prefer email?</span>
                <span className="tw:text-[11px] tw:font-semibold tw:text-white">
                  support@xilolo.com
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
