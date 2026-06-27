import React from "react";
import { motion } from "framer-motion";
import { Wifi, Settings, DollarSign } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const steps = [
  {
    num: "01",
    label: "Setup",
    title: "Connect and go LIVE.",
    body: "Connect OBS, Ecamm, or hardware encoders. Route to a private stage in a few clicks.",
    icon: Wifi,
    dark: true,
  },
  {
    num: "02",
    label: "Control Room",
    title: "Run your show cleanly.",
    body: "Manage guests, keep the stream steady, and stay focused while the show is live.",
    icon: Settings,
    dark: false,
  },
  {
    num: "03",
    label: "Tickets",
    title: "Sell tickets and keep earning.",
    body: "Create ticketed events, sell access, and keep your content working after the show ends.",
    icon: DollarSign,
    dark: false,
    border: true,
  },
];

export default function AboutPipelineSection() {
  return (
    <section className="tw:space-y-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={item}
      >
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-primary tw:font-semibold">
          How it works
        </span>

        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-3xl tw:font-black tw:text-slate-900">
          From setup to showtime, all in one flow.
        </span>

        <span className="tw:mt-2 tw:block tw:text-sm tw:md:text-[15px] tw:text-slate-600 tw:max-w-2xl tw:leading-relaxed">
          Create an event, go live, and keep the whole production organized in
          one place. Your show stays smooth and your audience stays locked in.
        </span>
      </motion.div>

      <motion.div
        className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              variants={item}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className={[
                "tw:relative tw:rounded-2xl tw:p-5 tw:overflow-hidden tw:min-h-[180px] tw:flex tw:flex-col tw:justify-between",
                step.dark
                  ? "tw:bg-primary tw:text-white"
                  : step.border
                  ? "tw:bg-white tw:border tw:border-slate-200/80 tw:shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
                  : "tw:bg-linear-to-b tw:from-primary/8 tw:to-primarySecond/5 tw:border tw:border-primary/15",
              ].join(" ")}
            >
              {/* Background accent */}
              <div
                aria-hidden
                className={[
                  "tw:absolute tw:-left-10 tw:-top-10 tw:h-24 tw:w-24 tw:rounded-full tw:blur-2xl",
                  step.dark ? "tw:bg-white/6" : "tw:bg-primary/10",
                ].join(" ")}
              />

              <div className="tw:relative tw:z-10">
                <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                  <span
                    className={[
                      "tw:block tw:text-[10px] tw:uppercase tw:tracking-[0.18em] tw:font-semibold",
                      step.dark ? "tw:text-white/50" : "tw:text-primary",
                    ].join(" ")}
                  >
                    {step.num} · {step.label}
                  </span>
                  <div
                    className={[
                      "tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full",
                      step.dark ? "tw:bg-white/10" : "tw:bg-primary/10",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "tw:w-4 tw:h-4",
                        step.dark ? "tw:text-white/70" : "tw:text-primary",
                      ].join(" ")}
                    />
                  </div>
                </div>

                <span
                  className={[
                    "tw:block tw:text-[15px] tw:font-semibold",
                    step.dark ? "tw:text-white" : "tw:text-slate-900",
                  ].join(" ")}
                >
                  {step.title}
                </span>
                <span
                  className={[
                    "tw:mt-2 tw:block tw:text-[12px] tw:leading-relaxed",
                    step.dark ? "tw:text-white/60" : "tw:text-slate-600",
                  ].join(" ")}
                >
                  {step.body}
                </span>
              </div>

              {/* Step number badge */}
              <div className="tw:relative tw:z-10 tw:mt-4">
                <span
                  className={[
                    "tw:inline-flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-black",
                    step.dark
                      ? "tw:bg-white/10 tw:text-white/60"
                      : "tw:bg-primary/10 tw:text-primary",
                  ].join(" ")}
                >
                  {idx + 1}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
