import React from "react";
import { motion } from "framer-motion";

const pills = [
  "Low-latency streaming",
  "Ticketed events",
  "Live chat & reactions",
  "Multi-host sessions",
  "Mobile-friendly",
];

const features = [
  {
    title: "Ultra-smooth streams",
    badge: "Low delay",
    description:
      "Deliver clean video with minimal delay, perfect for concerts, podcasts, and live shows.",
  },
  {
    title: "Sell tickets, get paid",
    badge: "Built-in ticketing",
    description:
      "Create paid events, set your price, and earn from your audience directly on Xilolo.",
  },
  {
    title: "Interactive by design",
    badge: "Real-time engagement",
    description:
      "Live chat and reactions keep your community locked in and part of the moment.",
  },
];

export default function LiveHighlightsSection() {
  return (
    <motion.section
      className="tw:relative tw:py-16 tw:md:py-44 tw:px-4 tw:md:px-10 tw:lg:px-20 tw:bg-black tw:overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Subtle animated gradient background */}
      <motion.div
        className="tw:absolute tw:inset-0 tw:bg-linear-to-b tw:from-primary/10 tw:via-black tw:to-black tw:pointer-events-none"
        aria-hidden="true"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft moving glow blob */}
      <motion.div
        className="tw:absolute tw:-right-20 tw:top-10 tw:h-64 tw:w-64 tw:bg-primary/25 tw:blur-3xl tw:rounded-full tw:pointer-events-none"
        aria-hidden="true"
        animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="tw:relative tw:z-10 tw:max-w-5xl tw:mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="tw:text-center tw:space-y-4"
        >
          <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-xs tw:font-medium text-white">
            <span className="tw:size-1.5 tw:rounded-full tw:bg-red-500 tw:animate-pulse" />
            Live streaming, reimagined
          </span>
          <span className="tw:font-league tw:block tw:text-4xl tw:md:text-5xl tw:lg:text-6xl tw:font-[900] text-white tw:tracking-tight">
            Make every <span className="tw:text-red-600">LIVE </span> moment
            unforgettable
          </span>
          <span className="tw:max-w-2xl tw:mx-auto tw:text-sm tw:md:text-base text-white">
            Xilolo gives creators and brands everything they need to
            host cinematic live shows, connect with fans, and grow real-time
            communities.
          </span>
        </motion.div>

        {/* Animated marquee pill row */}
        <FloatingPillRow />

        {/* Feature cards */}
        <div className="tw:mt-10 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-5">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              whileHover={{
                y: -6,
                scale: 1.02,
              }}
              className="tw:relative tw:rounded-2xl tw:bg-white/5 tw:border tw:border-white/10 tw:p-5 tw:backdrop-blur-xl tw:overflow-hidden tw:flex tw:flex-col tw:gap-3 tw:transition-shadow tw:hover:shadow-[0_0_40px_rgba(255,255,255,0.12)]"
            >
              {/* Glow accent */}
              <div className="tw:absolute tw:-right-10 tw:-top-10 tw:h-24 tw:w-24 tw:bg-primary/30 tw:blur-3xl tw:opacity-70" />

              <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-3">
                <span className="tw:inline-flex tw:self-start tw:rounded-full tw:bg-white/80 tw:text-primary tw:text-[11px] tw:font-medium tw:px-2.5 tw:py-1">
                  {feature.badge}
                </span>
                <h3 className="tw:text-base tw:md:text-lg tw:font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="tw:text-xs tw:md:text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/**
 * Row of animated pills that scrolls like a marquee
 * Constant, seamless horizontal motion.
 */
function FloatingPillRow() {
  // Duplicate pills so the marquee can loop seamlessly
  const marqueePills = [...pills, ...pills];

  return (
    <div className="tw:mt-8 tw:overflow-hidden">
      <motion.div
        className="tw:flex tw:gap-3 tw:min-w-max"
        // Start at 0, slide left by half the content width, then loop
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {marqueePills.map((pill, idx) => (
          <div
            key={`${pill}-${idx}`}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-[12px] text-white tw:backdrop-blur-xl"
          >
            <span className="tw:size-1.5 tw:rounded-full tw:bg-primary" />
            <span>{pill}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
