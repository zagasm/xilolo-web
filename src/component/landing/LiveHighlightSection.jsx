import React from "react";
import { motion } from "framer-motion";
import { Ticket, Users, Zap } from "lucide-react";

const pills = [
  "Low-latency streaming",
  "Ticketed events",
  "Live chat & reactions",
  "Multi-host sessions",
  "Mobile-friendly",
  "Replay scheduling",
  "Creator analytics",
];

const features = [
  {
    title: "Ultra-smooth streams",
    badge: "Low delay",
    description:
      "Deliver clean video with minimal delay, perfect for concerts, podcasts, and live shows.",
    icon: Zap,
  },
  {
    title: "Sell tickets, get paid",
    badge: "Built-in ticketing",
    description:
      "Create paid events, set your price, and earn from your audience directly on Xilolo.",
    icon: Ticket,
  },
  {
    title: "Interactive by design",
    badge: "Real-time engagement",
    description:
      "Live chat and reactions keep your community locked in and part of the moment.",
    icon: Users,
  },
];

/* CSS-only live player mockup */
function LivePlayerMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="tw:relative tw:mx-auto tw:max-w-2xl tw:my-10"
    >
      {/* Outer glow */}
      <div
        aria-hidden
        className="tw:absolute tw:inset-x-10 tw:top-6 tw:h-full tw:rounded-full tw:bg-white/10 tw:blur-3xl tw:pointer-events-none"
      />

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="tw:relative"
      >
        {/* Player container */}
        <div
          className="tw:rounded-[20px] tw:overflow-hidden tw:border tw:border-white/10"
          style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}
        >
          {/* Top chrome bar */}
          <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-2.5 tw:bg-[#0a0a0a] tw:border-b tw:border-white/[0.06]">
            <div className="tw:flex tw:items-center tw:gap-2">
              <img src="/logo2.png" alt="Xilolo" className="tw:h-5 tw:w-auto tw:opacity-80" />
            </div>
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <span className="tw:text-[11px] tw:text-white/30">Lagos, NG</span>
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-red-600 tw:px-2.5 tw:py-0.5 tw:text-[10px] tw:font-black tw:text-white">
                <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-white tw:animate-pulse" />
                LIVE
              </span>
            </div>
          </div>

          {/* Video stage */}
          <div
            className="tw:relative tw:bg-gradient-to-br tw:from-[#1a1a1a] tw:via-[#111] tw:to-[#060606] tw:overflow-hidden"
            style={{ aspectRatio: "16/8" }}
          >
            {/* Cinematic stage lights */}
            <div aria-hidden className="tw:absolute tw:inset-0">
              <div className="tw:absolute tw:-top-6 tw:left-1/3 tw:w-56 tw:h-36 tw:bg-white/[0.06] tw:blur-3xl tw:rounded-full" />
              <div className="tw:absolute tw:-top-4 tw:left-1/2 tw:-translate-x-1/2 tw:w-72 tw:h-44 tw:bg-white/[0.04] tw:blur-3xl tw:rounded-full" />
              <div className="tw:absolute tw:-top-6 tw:right-1/3 tw:w-56 tw:h-36 tw:bg-white/[0.05] tw:blur-3xl tw:rounded-full" />

              {/* Stage floor gradient */}
              <div className="tw:absolute tw:bottom-0 tw:inset-x-0 tw:h-2/3 tw:bg-gradient-to-t tw:from-black/80 tw:to-transparent" />

              {/* Perspective grid floor */}
              <div
                aria-hidden
                className="tw:absolute tw:bottom-0 tw:inset-x-0 tw:h-2/5 tw:opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                  transform: "perspective(200px) rotateX(30deg)",
                  transformOrigin: "bottom center",
                }}
              />
            </div>

            {/* Center stage silhouette */}
            <div aria-hidden className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:opacity-[0.18]">
              <div className="tw:w-12 tw:h-12 tw:rounded-full tw:border-2 tw:border-white tw:mb-2" />
              <div className="tw:w-px tw:h-16 tw:bg-white" />
              <div className="tw:w-10 tw:h-px tw:bg-white tw:-mt-0.5" />
              <div className="tw:flex tw:gap-10 tw:mt-2">
                <div className="tw:w-px tw:h-4 tw:bg-white tw:-rotate-12" />
                <div className="tw:w-px tw:h-4 tw:bg-white tw:rotate-12" />
              </div>
            </div>

            {/* Live chat stream (right side) */}
            <div className="tw:absolute tw:right-3 tw:top-3 tw:bottom-8 tw:w-28 tw:hidden tw:lg:flex tw:flex-col tw:justify-end tw:gap-1.5 tw:overflow-hidden">
              {[
                { name: "@kola_f", msg: "fire set tonight!! 🔥" },
                { name: "@ada.k", msg: "stream is perfect 🎵" },
                { name: "@bro_jay", msg: "ticketed!! worth it 👏" },
                { name: "@yemi_l", msg: "sound quality 💯" },
              ].map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.3, duration: 0.4 }}
                  className="tw:bg-black/60 tw:backdrop-blur-sm tw:rounded-lg tw:px-2 tw:py-1.5"
                >
                  <span className="tw:block tw:text-[9px] tw:text-white/50">{c.name}</span>
                  <span className="tw:block tw:text-[9px] tw:text-white/80 tw:leading-tight">{c.msg}</span>
                </motion.div>
              ))}
            </div>

            {/* Bottom HUD */}
            <div className="tw:absolute tw:bottom-2 tw:left-3 tw:right-3 tw:flex tw:items-end tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:bg-black/65 tw:backdrop-blur-sm tw:rounded-full tw:px-3 tw:py-1">
                  <svg className="tw:w-3 tw:h-3 tw:text-white/70" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="tw:text-[11px] tw:text-white tw:font-semibold">3,812</span>
                </div>
                <div className="tw:bg-black/65 tw:backdrop-blur-sm tw:rounded-full tw:px-2.5 tw:py-1">
                  <span className="tw:text-[11px] tw:text-white">❤️ 742</span>
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:bg-black/65 tw:backdrop-blur-sm tw:rounded-xl tw:px-2.5 tw:py-1">
                <div className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-green-400" />
                <span className="tw:text-[10px] tw:text-white/80 tw:font-semibold">1080p</span>
              </div>
            </div>
          </div>

          {/* Progress / controls bar */}
          <div className="tw:px-4 tw:py-3 tw:bg-[#0c0c0c] tw:border-t tw:border-white/[0.04] tw:flex tw:items-center tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:w-7 tw:h-7 tw:rounded-full tw:bg-white/10 tw:flex tw:items-center tw:justify-center">
                <svg className="tw:w-3 tw:h-3 tw:text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="tw:flex-1 tw:h-1 tw:bg-white/10 tw:rounded-full tw:overflow-hidden">
              <motion.div
                className="tw:h-full tw:rounded-full"
                style={{ background: "linear-gradient(90deg,#e5e4e2,#2b2b2b)" }}
                initial={{ width: "0%" }}
                animate={{ width: "55%" }}
                transition={{ duration: 3, delay: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="tw:text-[10px] tw:text-white/40 tw:shrink-0">52:14 / 1:34:00</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FloatingPillRow() {
  const marqueePills = [...pills, ...pills];

  return (
    <div className="tw:mt-8 tw:overflow-hidden">
      <motion.div
        className="tw:flex tw:gap-3 tw:min-w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {marqueePills.map((pill, idx) => (
          <div
            key={`${pill}-${idx}`}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-[12px] tw:text-white tw:backdrop-blur-xl"
          >
            <span className="tw:size-1.5 tw:rounded-full tw:bg-primary" />
            <span>{pill}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function LiveHighlightsSection() {
  return (
    <motion.section
      className="tw:relative tw:py-16 tw:md:py-44 tw:px-4 tw:md:px-10 tw:lg:px-20 tw:bg-black tw:overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Animated gradient bg */}
      <motion.div
        className="tw:absolute tw:inset-0 tw:bg-gradient-to-b tw:from-primary/10 tw:via-black tw:to-black tw:pointer-events-none"
        aria-hidden="true"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft glow blob */}
      <motion.div
        className="tw:absolute tw:-right-20 tw:top-10 tw:h-72 tw:w-72 tw:bg-primary/20 tw:blur-3xl tw:rounded-full tw:pointer-events-none"
        aria-hidden="true"
        animate={{ y: [0, 20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="tw:absolute tw:-left-20 tw:bottom-10 tw:h-64 tw:w-64 tw:bg-white/[0.03] tw:blur-3xl tw:rounded-full tw:pointer-events-none"
        aria-hidden="true"
        animate={{ y: [0, -16, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
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
          <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-white">
            <span className="tw:size-1.5 tw:rounded-full tw:bg-red-500 tw:animate-pulse" />
            Live streaming, reimagined
          </span>

          <span className="tw:font-league tw:block tw:text-4xl tw:md:text-5xl tw:lg:text-6xl tw:font-black tw:text-white tw:tracking-tight">
            Make every{" "}
            <span className="tw:text-red-600">LIVE</span>{" "}
            moment unforgettable
          </span>

          <span className="tw:max-w-2xl tw:mx-auto tw:block tw:text-sm tw:md:text-base tw:text-white/70">
            Xilolo gives creators and brands everything they need to host
            cinematic live shows, connect with fans, and grow real-time
            communities.
          </span>
        </motion.div>

        {/* Pill marquee */}
        <FloatingPillRow />

        {/* Live player mockup */}
        <LivePlayerMockup />

        {/* Feature cards */}
        <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="tw:relative tw:rounded-2xl tw:bg-white/5 tw:border tw:border-white/10 tw:p-5 tw:backdrop-blur-xl tw:overflow-hidden tw:flex tw:flex-col tw:gap-3 tw:transition-shadow tw:hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                {/* Glow accent */}
                <div className="tw:absolute tw:-right-10 tw:-top-10 tw:h-24 tw:w-24 tw:bg-primary/30 tw:blur-3xl tw:opacity-70" />

                <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-3">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span className="tw:inline-flex tw:self-start tw:rounded-full tw:bg-white/80 tw:text-primary tw:text-[11px] tw:font-semibold tw:px-2.5 tw:py-1">
                      {feature.badge}
                    </span>
                    <div className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/10">
                      <Icon className="tw:w-4 tw:h-4 tw:text-white/70" />
                    </div>
                  </div>

                  <span className="tw:text-base tw:md:text-lg tw:font-semibold tw:text-white">
                    {feature.title}
                  </span>
                  <span className="tw:text-xs tw:md:text-sm tw:text-white/60">
                    {feature.description}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
