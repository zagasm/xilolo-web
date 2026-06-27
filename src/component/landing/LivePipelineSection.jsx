import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    id: 1,
    label: "Creator",
    title: "Start your event",
    description:
      "Go live from your phone or studio setup in minutes. No confusing setup.",
    badge: "Start",
  },
  {
    id: 2,
    label: "Xilolo",
    title: "We keep it smooth",
    description:
      "Your stream stays clear and stable so your audience enjoys the show, not the struggle.",
    badge: "Quality",
  },
  {
    id: 3,
    label: "Ticketing",
    title: "Sell tickets. Get paid",
    description:
      "Set a price, sell tickets to your audience, and earn directly from your event.",
    badge: "Revenue",
  },
  {
    id: 4,
    label: "Audience",
    title: "Fans join and engage",
    description:
      "Viewers watch, chat, and react in real time, making the moment feel alive.",
    badge: "Engagement",
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.12,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

export default function LivePipelineSection() {
  return (
    <section className="tw:relative tw:py-16 tw:md:py-44 tw:px-4 tw:md:px-10 tw:lg:px-20 tw:bg-black tw:overflow-hidden">
      {/* soft bg gradients (now animated) */}
      <div className="tw:pointer-events-none tw:absolute tw:inset-0">
        <motion.div
          className="tw:absolute tw:-left-24 tw:top-4 tw:h-64 tw:w-64 tw:bg-neon/10 tw:blur-3xl tw:opacity-60"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="tw:absolute tw:-right-24 tw:-bottom-16 tw:h-72 tw:w-72 tw:bg-neon/12 tw:blur-3xl tw:opacity-70"
          animate={{ x: [0, -24, 0], y: [0, 18, 0] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="tw:relative tw:z-10 tw:max-w-6xl tw:mx-auto"
      >
        {/* Header */}
        <motion.div className="tw:text-center tw:space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:text-white"
          >
            <span className="tw:size-1.5 tw:rounded-full tw:bg-white tw:animate-pulse" />
            Live signal pipeline
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="tw:font-league tw:block tw:text-4xl tw:md:text-5xl tw:lg:text-6xl tw:font-[900] tw:text-white tw:tracking-tight"
          >
            From
            <strong className="tw:font-semibold tw:text-red-600">
              {" "}
              “Go Live”
            </strong>{" "}
            to thousands of viewers in seconds.
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="tw:max-w-2xl tw:mx-auto tw:text-sm tw:md:text-base tw:text-white"
          >
            Every show flows through a carefully engineered pipeline designed to
            keep your stream stable, crisp, and ridiculously engaging.
          </motion.p>
        </motion.div>

        {/* Animated pipeline line */}
        <div className="tw:relative tw:mt-10 tw:mb-8">
          {/* main glowing line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="tw:origin-left tw:h-px tw:w-full tw:bg-linear-to-r tw:from-primary/10 tw:via-neon tw:to-primary/10 tw:shadow-[0_0_25px_rgba(0,245,255,0.22)]"
          />

          {/* shimmering band running along the line */}
          <motion.div
            className="tw:absolute tw:inset-0 tw:h-px tw:bg-linear-to-r tw:from-transparent tw:via-white tw:to-transparent tw:mix-blend-screen tw:opacity-60"
            initial={{ backgroundPositionX: "0%" }}
            animate={{ backgroundPositionX: ["0%", "200%", "0%"] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
            style={{ backgroundSize: "200% 100%" }}
          />

          {/* moving “signal” dot (now pulsing) */}
          <motion.div
            initial={{ x: "0%" }}
            animate={{
              x: ["0%", "100%"],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
            className="tw:absolute tw:-top-1 tw:h-3 tw:w-3 tw:rounded-full tw:bg-neon tw:shadow-[0_0_18px_rgba(0,245,255,0.5)]"
          />
        </div>

        {/* Steps: stacked on mobile, pipeline-feel on md+ */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={stepVariants}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="tw:relative tw:flex tw:flex-col tw:gap-3 tw:rounded-2xl tw:bg-white/5 tw:border tw:border-white/10 tw:p-4 tw:backdrop-blur-xl tw:overflow-hidden tw:shadow-[0_18px_45px_rgba(0,0,0,0.18),0_0_18px_rgba(0,245,255,0.05)]"
            >
              {/* floating ring behind icon (also gently animating) */}
              <motion.div
                className="tw:absolute tw:-right-8 tw:-top-8 tw:h-20 tw:w-20 tw:rounded-full tw:border tw:border-neon/20 tw:bg-neon/8 tw:blur-xl"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: index * 0.3,
                }}
              />

              {/* inner content with subtle bobbing */}
              <motion.div
                className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-3"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: index * 0.4,
                }}
              >
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:inline-flex tw:items-center tw:gap-2">
                    <div className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/20 tw:text-[11px] tw:font-semibold tw:text-white">
                      {step.id}
                    </div>
                    <span className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-white">
                      {step.label}
                    </span>
                  </div>

                  <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-white tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-medium tw:text-primary">
                    {step.badge}
                  </span>
                </div>

                <div>
                  <span className="tw:text-sm tw:md:text-base tw:lg:text-[20px] tw:font-semibold text-white">
                    {step.title}
                  </span>
                  <p className="tw:mt-1 tw:text-xs tw:md:text-sm tw:text-white/70">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
