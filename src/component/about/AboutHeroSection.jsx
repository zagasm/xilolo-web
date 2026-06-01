import React from "react";
import { motion } from "framer-motion";
import { Radio, TrendingUp, Users, Ticket } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const stats = [
  { value: "2,500+", label: "Creators & teams", icon: Users },
  { value: "$480K+", label: "Revenue generated", icon: TrendingUp },
  { value: "98%", label: "Stream uptime", icon: Radio },
  { value: "12K+", label: "Tickets sold", icon: Ticket },
];

export default function AboutHeroSection() {
  return (
    <section className="tw:space-y-14">
      {/* Top — headline + card */}
      <div className="tw:flex tw:flex-col tw:gap-10 tw:md:flex-row tw:items-start tw:justify-between">
        <motion.div
          className="tw:max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          custom={0}
          variants={fadeUp}
        >
          <span className="tw:block tw:text-[10px] tw:md:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-primary tw:mb-3 tw:font-semibold">
            About Xilolo
          </span>

          <span className="tw:font-league tw:block tw:text-3xl tw:md:text-4xl tw:lg:text-[52px] tw:font-black tw:leading-[1] tw:mb-4">
            Turning{" "}
            <span className="tw:text-red-600">LIVE shows</span>
            <br />
            into a real business.
          </span>

          <span className="tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-xl tw:leading-relaxed">
            Xilolo is a home for live events that feel premium. Host shows,
            sell tickets, and build a real audience that keeps coming back —
            all from one clean platform.
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
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="tw:relative tw:rounded-3xl tw:bg-[#050505] tw:text-white tw:p-5 tw:overflow-hidden"
            style={{ boxShadow: "0 24px 70px rgba(5,5,5,0.45)" }}
          >
            <div aria-hidden className="tw:absolute tw:-right-10 tw:-top-10 tw:h-32 tw:w-32 tw:rounded-full tw:bg-white/[0.06] tw:blur-2xl" />
            <div aria-hidden className="tw:absolute tw:-left-8 tw:bottom-0 tw:h-24 tw:w-24 tw:rounded-full tw:bg-white/[0.04] tw:blur-2xl" />

            <div className="tw:relative">
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white/10 tw:border tw:border-white/10 tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-semibold tw:text-white/70 tw:mb-3">
                <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-red-500 tw:animate-pulse" />
                Built for live shows
              </span>

              <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-white tw:leading-snug">
                Built for creators and teams who want consistent shows, not
                random lives.
              </span>

              <span className="tw:mt-3 tw:block tw:text-[12px] tw:text-white/60 tw:leading-relaxed">
                Plan events, manage your show, and keep everything in one place
                — from setup to payout.
              </span>

              {/* Live indicator */}
              <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between tw:rounded-2xl tw:bg-white/5 tw:border tw:border-white/10 tw:px-3 tw:py-2">
                <span className="tw:text-[11px] tw:text-white/60">Next show</span>
                <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:text-white">
                  <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-green-400 tw:animate-pulse" />
                  Fri 8 PM WAT
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats grid */}
      <motion.div
        className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i * 0.07}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="tw:relative tw:rounded-2xl tw:bg-white tw:border tw:border-slate-200/80 tw:p-4 tw:overflow-hidden"
              style={{ boxShadow: "0 14px 40px rgba(15,23,42,0.07)" }}
            >
              <div aria-hidden className="tw:absolute tw:-right-6 tw:-top-6 tw:h-16 tw:w-16 tw:rounded-full tw:bg-primary/5 tw:blur-xl" />
              <div className="tw:flex tw:items-start tw:justify-between tw:mb-2">
                <span className="tw:block tw:text-[28px] tw:font-black tw:text-slate-900 tw:font-league tw:leading-none">
                  {stat.value}
                </span>
                <div className="tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/8">
                  <Icon className="tw:w-3.5 tw:h-3.5 tw:text-primary" />
                </div>
              </div>
              <span className="tw:block tw:text-[11px] tw:text-slate-500 tw:font-medium">{stat.label}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
