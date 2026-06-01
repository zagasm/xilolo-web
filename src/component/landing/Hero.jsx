import React, { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import RatingBar from "./RatingBar";
import CTAButton from "./CTAButton";
import {
  Music,
  Video,
  Radio,
  Tv,
  Mic,
  Users,
  Globe,
  Sparkles,
  Film,
  Zap,
} from "lucide-react";

const word = {
  hidden: { y: 22, opacity: 0, filter: "blur(3px)", rotateX: 15 },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    rotateX: 0,
    transition: { type: "spring", stiffness: 150, damping: 20 },
  },
};

function FlowHeadline({ line1Words, line2Words, highlightWord, initialDelay = 0.25, stagger = 0.07 }) {
  const localSentence = useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: stagger, delayChildren: initialDelay } },
    }),
    [initialDelay, stagger]
  );

  return (
    <div className="tw:relative tw:mb-4 tw:font-bold tw:font-league" style={{ perspective: "800px" }}>
      {/* Shimmer sweep */}
      <motion.span
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-0 tw:rounded-lg"
        initial={{ x: "-120%" }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
        style={{
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span
          variants={localSentence}
          initial="hidden"
          animate="show"
          className="tw:block tw:text-center tw:font-black tw:leading-[0.94] tw:tracking-tight tw:text-[30px] tw:md:text-[40px] tw:lg:text-[54px] tw:text-gray-900"
        >
          {line1Words.map((w, i) => (
            <motion.span key={i} variants={word} className="tw:inline-block tw:mr-[0.35ch]">
              <span className={highlightWord && w === highlightWord ? "tw:text-primary" : ""}>{w}</span>
            </motion.span>
          ))}
        </motion.span>

        <motion.span
          variants={localSentence}
          initial="hidden"
          animate="show"
          className="tw:block tw:text-center tw:font-extrabold tw:leading-[0.94] tw:tracking-tight tw:text-[30px] tw:md:text-[40px] tw:lg:text-[54px] tw:text-gray-900"
        >
          {line2Words.map((w, i) => (
            <motion.span key={i} variants={word} className="tw:inline-block tw:mr-[0.35ch]">
              {w}
            </motion.span>
          ))}
        </motion.span>
      </motion.div>
    </div>
  );
}

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: "blur(6px)",
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.6, ease: [0.23, 0.9, 0.25, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    filter: "blur(6px)",
    scale: 0.98,
    transition: { duration: 0.4, ease: [0.23, 0.9, 0.25, 1] },
  }),
};

const slides = [
  {
    id: 0,
    line1: ["Welcome", "to", "Xilolo"],
    line2: ["Go", "live.", "Look", "premium.", "Reach", "everywhere."],
    highlightWord: "live.",
    subText: "High-quality live streaming for concerts, shows, and creators. Simple setup. Solid delivery.",
    ctaLabel: "Get Started",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Sparkles, delay: 0.2, yOffset: -20, curve: 30 },
      { Icon: Video, delay: 0.4, yOffset: 0, curve: -20 },
      { Icon: Music, delay: 0.6, yOffset: 0, curve: 40 },
    ],
  },
  {
    id: 1,
    line1: ["Your", "Show.", "Your", "Stage."],
    line2: ["Concerts,", "talks,", "hangouts,", "seminars."],
    highlightWord: "Stage.",
    subText: "Host any kind of event and stream it cleanly to your audience, anywhere.",
    ctaLabel: "Go Live",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Mic, delay: 0.2, yOffset: 30, curve: -25 },
      { Icon: Tv, delay: 0.4, yOffset: 10, curve: 35 },
      { Icon: Users, delay: 0.6, yOffset: 20, curve: -30 },
    ],
  },
  {
    id: 2,
    line1: ["Stream", "Beyond", "Borders"],
    line2: ["From", "anywhere", "to", "everywhere."],
    highlightWord: "Borders",
    subText: "Go live from your city and reach fans across countries in seconds.",
    ctaLabel: "Stream Worldwide",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Globe, delay: 0.2, yOffset: -30, curve: 40 },
      { Icon: Radio, delay: 0.4, yOffset: 0, curve: -35 },
      { Icon: Zap, delay: 0.6, yOffset: -5, curve: 30 },
    ],
  },
  {
    id: 3,
    line1: ["First", "stream", "or", "pro", "level"],
    line2: ["Create", "something", "worth", "replaying."],
    highlightWord: "replaying.",
    subText: "No stress setup. Just a smooth flow that helps you deliver a great show.",
    ctaLabel: "Start Streaming",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Film, delay: 0.2, yOffset: 15, curve: -20 },
      { Icon: Sparkles, delay: 0.4, yOffset: -5, curve: 45 },
      { Icon: Video, delay: 0.6, yOffset: 35, curve: -25 },
    ],
  },
  {
    id: 4,
    line1: ["Smooth", "Streams.", "Sharp", "Visuals."],
    line2: ["No", "glitches.", "No", "drama."],
    highlightWord: "Smooth",
    subText: "Stable streaming that keeps your audience locked in from start to finish.",
    ctaLabel: "See How It Works",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Zap, delay: 0.2, yOffset: -15, curve: 35 },
      { Icon: Music, delay: 0.4, yOffset: -30, curve: -40 },
      { Icon: Sparkles, delay: 0.6, yOffset: -35, curve: 25 },
    ],
  },
  {
    id: 5,
    line1: ["Bring", "the", "Energy"],
    line2: ["Premium", "video.", "Clean", "sound.", "Big", "feel."],
    highlightWord: "Energy",
    subText: "Make every stream feel like a real production, not a random live video.",
    ctaLabel: "Upgrade Your Streams",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Film, delay: 0.2, yOffset: 25, curve: -30 },
      { Icon: Mic, delay: 0.4, yOffset: 20, curve: 40 },
      { Icon: Tv, delay: 0.6, yOffset: 10, curve: -35 },
    ],
  },
];

/* Tilt card hook */
function useTilt(strength = 8) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [strength, -strength]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-strength, strength]), { stiffness: 200, damping: 20 });

  const handlers = {
    onMouseMove: (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    onMouseLeave: () => { mx.set(0); my.set(0); },
  };

  return { rotateX, rotateY, handlers };
}

/* Premium live streaming dashboard mockup */
function LiveDashboardMockup() {
  const { rotateX, rotateY, handlers } = useTilt(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.65, type: "spring", stiffness: 75, damping: 20 }}
      className="tw:relative tw:mt-16 tw:mx-auto tw:max-w-3xl tw:px-6 tw:pb-20"
    >
      {/* Neon + dark background glow */}
      <div aria-hidden className="tw:absolute tw:inset-x-0 tw:top-12 tw:pointer-events-none">
        <div
          className="tw:absolute tw:inset-x-16 tw:h-48 tw:rounded-full tw:blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(0,255,209,0.07) 0%, rgba(5,5,5,0.12) 55%, transparent 80%)" }}
        />
      </div>

      {/* Floating wrapper — looping bob */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="tw:relative"
        style={{ perspective: "1200px" }}
        {...handlers}
      >
        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
          {/* Dashboard card */}
          <div
            className="tw:rounded-3xl tw:overflow-hidden tw:bg-[#111111] tw:border tw:border-white/7"
            style={{
              boxShadow:
                "0 50px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px rgba(0,255,209,0.04)",
            }}
          >
            {/* Title bar */}
            <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-2.5 tw:bg-[#0d0d0d] tw:border-b tw:border-white/5">
              <div className="tw:flex tw:items-center tw:gap-2.5">
                <div className="tw:flex tw:gap-1.5">
                  <div className="tw:w-3 tw:h-3 tw:rounded-full" style={{ background: "#FF5F57" }} />
                  <div className="tw:w-3 tw:h-3 tw:rounded-full" style={{ background: "#FFBD2E" }} />
                  <div className="tw:w-3 tw:h-3 tw:rounded-full" style={{ background: "#28C840" }} />
                </div>
                <span className="tw:text-[11px] tw:text-white/30 tw:font-medium">Xilolo Studio</span>
              </div>
              <div className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:text-[11px] tw:text-white/30">01:24:36</span>
                <span
                  className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-red-600 tw:px-2.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-white"
                  style={{ boxShadow: "0 0 10px rgba(220,38,38,0.4)" }}
                >
                  <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-white tw:animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            {/* Video canvas */}
            <div
              className="tw:relative tw:overflow-hidden"
              style={{
                aspectRatio: "16/7",
                background: "linear-gradient(135deg, #1c1c1e 0%, #141416 50%, #090909 100%)",
              }}
            >
              {/* Stage atmosphere */}
              <div aria-hidden className="tw:absolute tw:inset-0">
                <div className="tw:absolute tw:top-0 tw:left-1/4 tw:w-48 tw:h-32 tw:bg-linear-to-b tw:from-white/6 tw:to-transparent tw:blur-2xl" />
                <div className="tw:absolute tw:top-0 tw:left-1/2 tw:-translate-x-1/2 tw:w-72 tw:h-40 tw:bg-linear-to-b tw:from-primary/12 tw:to-transparent tw:blur-3xl" />
                <div className="tw:absolute tw:top-0 tw:right-1/4 tw:w-48 tw:h-32 tw:bg-linear-to-b tw:from-white/4 tw:to-transparent tw:blur-2xl" />
                {/* Subtle neon accent beam */}
                <div
                  className="tw:absolute tw:top-0 tw:right-1/3 tw:w-32 tw:h-24 tw:blur-3xl tw:opacity-40"
                  style={{ background: "linear-gradient(180deg, rgba(0,255,209,0.08), transparent)" }}
                />
                <div className="tw:absolute tw:bottom-0 tw:inset-x-0 tw:h-1/2 tw:bg-linear-to-t tw:from-black/70 tw:to-transparent" />
                {/* Subtle scan grid */}
                <div
                  aria-hidden
                  className="tw:absolute tw:inset-0 tw:opacity-[0.025]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
                    backgroundSize: "44px 44px",
                  }}
                />
              </div>

              {/* Performer silhouette */}
              <div aria-hidden className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:opacity-[0.12]">
                <div className="tw:w-10 tw:h-10 tw:rounded-full tw:border-2 tw:border-white tw:mb-1" />
                <div className="tw:w-px tw:h-14 tw:bg-white" />
                <div className="tw:w-8 tw:h-px tw:bg-white" />
              </div>

              {/* Quality badge */}
              <div
                className="tw:absolute tw:top-3 tw:right-3 tw:flex tw:items-center tw:gap-1.5 tw:rounded-xl tw:px-2.5 tw:py-1"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,255,209,0.12)",
                  boxShadow: "0 0 12px rgba(0,255,209,0.08)",
                }}
              >
                <div className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-green-400 tw:animate-pulse" />
                <span className="tw:text-[10px] tw:text-white/80 tw:font-semibold">1080p HD</span>
              </div>

              {/* Chat bubbles */}
              <div className="tw:absolute tw:top-3 tw:left-3 tw:space-y-1.5 tw:hidden tw:md:block">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8, duration: 0.4 }}
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                  className="tw:rounded-xl tw:px-2.5 tw:py-1.5 tw:text-[10px] tw:text-white/70 tw:border tw:border-white/8"
                >
                  <span className="tw:text-white/45 tw:mr-1">@maya_j</span>fire set 🔥
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.1, duration: 0.4 }}
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                  className="tw:rounded-xl tw:px-2.5 tw:py-1.5 tw:text-[10px] tw:text-white/70 tw:border tw:border-white/8"
                >
                  <span className="tw:text-white/45 tw:mr-1">@sam</span>tune in!!! 🎵
                </motion.div>
              </div>

              {/* Viewer count + reactions */}
              <div className="tw:absolute tw:bottom-3 tw:left-3 tw:flex tw:items-center tw:gap-2">
                <div
                  className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-3 tw:py-1"
                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  <svg className="tw:w-3 tw:h-3 tw:text-white/70" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="tw:text-[11px] tw:text-white tw:font-semibold">2,451</span>
                </div>
                <div
                  className="tw:rounded-full tw:px-3 tw:py-1"
                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  <span className="tw:text-[11px] tw:text-white">❤️ 384</span>
                </div>
              </div>
            </div>

            {/* Control bar */}
            <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:bg-[#0c0c0c] tw:border-t tw:border-white/4">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:w-7 tw:h-7 tw:rounded-full tw:bg-white/8 tw:flex tw:items-center tw:justify-center tw:border tw:border-white/8">
                  <svg className="tw:w-3.5 tw:h-3.5 tw:text-white/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="tw:w-7 tw:h-7 tw:rounded-full tw:bg-white/8 tw:flex tw:items-center tw:justify-center tw:border tw:border-white/8">
                  <svg className="tw:w-3.5 tw:h-3.5 tw:text-white/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="tw:flex-1 tw:h-1 tw:bg-white/8 tw:rounded-full tw:overflow-hidden tw:relative">
                <motion.div
                  className="tw:h-full tw:rounded-full tw:relative"
                  initial={{ width: "0%" }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 2.8, delay: 1.4, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, #1a1a1a 0%, #2b2b2b 60%, rgba(0,255,209,0.7) 100%)",
                  }}
                >
                  {/* Neon tip glow */}
                  <div
                    className="tw:absolute tw:right-0 tw:top-1/2 tw:-translate-y-1/2 tw:w-2 tw:h-3 tw:rounded-full"
                    style={{ background: "#00ffd1", boxShadow: "0 0 8px rgba(0,255,209,0.9)", opacity: 0.8 }}
                  />
                </motion.div>
              </div>
              <div
                className="tw:flex tw:items-center tw:gap-1 tw:rounded-full tw:px-3 tw:py-1.5 tw:border"
                style={{
                  background: "rgba(0,255,209,0.04)",
                  borderColor: "rgba(0,255,209,0.12)",
                  boxShadow: "0 0 12px rgba(0,255,209,0.06)",
                }}
              >
                <span className="tw:text-[9px] tw:text-white/40">$</span>
                <span className="tw:text-[12px] tw:font-bold tw:text-white">1,850</span>
                <span className="tw:text-[9px] tw:text-white/40 tw:ml-0.5">earned</span>
              </div>
            </div>
          </div>

          {/* Floating card — Viewers (glassmorphic) */}
          <motion.div
            initial={{ opacity: 0, x: -28, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 110, damping: 18 }}
            className="tw:absolute tw:-left-3 tw:md:-left-16 tw:top-10 tw:hidden tw:sm:block"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.06, rotateY: -4 }}
              className="tw:rounded-2xl tw:p-3 tw:min-w-[120px]"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.6)",
              }}
            >
              <span className="tw:block tw:text-[9px] tw:text-gray-400 tw:uppercase tw:tracking-widest tw:font-semibold">Live viewers</span>
              <span className="tw:block tw:text-[26px] tw:font-black tw:text-gray-900 tw:mt-0.5 tw:leading-none tw:font-league">2,451</span>
              <div className="tw:flex tw:items-center tw:gap-1 tw:mt-1.5">
                <div className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
                <span className="tw:text-[10px] tw:text-green-600 tw:font-semibold">+12% now</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating card — Revenue (glassmorphic dark) */}
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1.25, type: "spring", stiffness: 110, damping: 18 }}
            className="tw:absolute tw:-right-3 tw:md:-right-16 tw:top-16 tw:hidden tw:sm:block"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              whileHover={{ scale: 1.06, rotateY: 4 }}
              className="tw:rounded-2xl tw:p-3 tw:min-w-32"
              style={{
                background: "rgba(5,5,5,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,255,209,0.1)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 20px rgba(0,255,209,0.05)",
                color: "white",
              }}
            >
              <span className="tw:block tw:text-[9px] tw:text-white/40 tw:uppercase tw:tracking-widest tw:font-semibold">Revenue</span>
              <span className="tw:block tw:text-[26px] tw:font-black tw:mt-0.5 tw:leading-none tw:font-league">$1,850</span>
              <span className="tw:block tw:text-[10px] tw:text-white/45 tw:mt-1.5">From 92 tickets</span>
            </motion.div>
          </motion.div>

          {/* Floating card — Quality (glassmorphic bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", stiffness: 110, damping: 18 }}
            className="tw:absolute tw:-bottom-8 tw:left-1/2 tw:-translate-x-1/2 tw:hidden tw:sm:block"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              whileHover={{ scale: 1.06 }}
              className="tw:rounded-2xl tw:px-4 tw:py-2.5 tw:flex tw:items-center tw:gap-3 tw:whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 20px 55px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.7)",
              }}
            >
              <div
                className="tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:shrink-0"
                style={{
                  background: "#050505",
                  boxShadow: "0 0 12px rgba(0,255,209,0.15)",
                }}
              >
                <span className="tw:text-[11px] tw:font-black tw:text-white">98%</span>
              </div>
              <div>
                <span className="tw:block tw:text-[12px] tw:font-bold tw:text-gray-900">Stream quality</span>
                <span className="tw:block tw:text-[10px] tw:text-gray-400">No drops detected</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (targetIndex) => {
    if (targetIndex === index) return;
    setDirection(targetIndex > index ? 1 : -1);
    setIndex(targetIndex);
  };

  const currentSlide = slides[index];

  return (
    <section
      className="tw:mx-auto tw:max-w-7xl tw:px-5 tw:pt-8 tw:pb-6 tw:relative tw:overflow-hidden"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Subtle neon top glow */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:flex tw:justify-center tw:-z-10"
      >
        <div
          style={{
            width: "700px",
            height: "180px",
            background: "radial-gradient(ellipse at center, rgba(0,255,209,0.055) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </div>

      <RatingBar />

      {/* Floating Icons — Right */}
      <div className="tw:absolute tw:right-4 tw:lg:right-12 tw:top-1/2 tw:-translate-y-1/2 tw:w-24 tw:lg:w-32 tw:h-full tw:pointer-events-none tw:hidden tw:md:block">
        <AnimatePresence mode="wait">
          {currentSlide.icons.map((iconData, idx) => {
            const { Icon, delay, yOffset, curve } = iconData;
            return (
              <motion.div
                key={`${currentSlide.id}-icon-${idx}`}
                initial={{ x: 200, y: yOffset, opacity: 0, scale: 0.3, rotate: -90 }}
                animate={{ x: [200, curve, 0], y: yOffset, opacity: [0, 0.7, 1], scale: [0.3, 1.1, 1], rotate: [-90, 15, 0] }}
                exit={{ x: [-20, -150], opacity: [1, 0], scale: [1, 0.4], rotate: [0, 90], transition: { duration: 0.6, ease: [0.23, 0.9, 0.25, 1] } }}
                transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
                className="tw:absolute tw:left-0"
                style={{ top: `${30 + idx * 20}%` }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 }}
                  className="tw:relative tw:w-12 tw:h-12 tw:lg:w-16 tw:lg:h-16 tw:rounded-2xl tw:shadow-xl tw:flex tw:items-center tw:justify-center"
                  style={{
                    background: "rgba(5,5,5,0.08)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(5,5,5,0.12)",
                  }}
                >
                  <Icon className="tw:w-6 tw:h-6 tw:lg:w-8 tw:lg:h-8 tw:text-primary" strokeWidth={2} />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                    className="tw:absolute tw:inset-0 tw:rounded-2xl tw:bg-primary/15 tw:blur-lg tw:-z-10"
                  />
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }} className="tw:absolute tw:inset-0">
                    <div className="tw:absolute tw:top-1 tw:right-1 tw:w-1 tw:h-1 tw:bg-white tw:rounded-full tw:opacity-80" />
                    <div className="tw:absolute tw:bottom-2 tw:left-2 tw:w-1 tw:h-1 tw:bg-white tw:rounded-full tw:opacity-60" />
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Icons — Left */}
      <div className="tw:absolute tw:left-4 tw:lg:left-12 tw:top-1/2 tw:-translate-y-1/2 tw:w-24 tw:lg:w-32 tw:h-full tw:pointer-events-none tw:hidden tw:lg:block">
        <AnimatePresence mode="wait">
          {currentSlide.icons.map((iconData, idx) => {
            const { Icon, delay, yOffset, curve } = iconData;
            return (
              <motion.div
                key={`${currentSlide.id}-icon-left-${idx}`}
                initial={{ x: -200, y: yOffset + 30, opacity: 0, scale: 0.3, rotate: 90 }}
                animate={{ x: [-200, -curve, 0], y: yOffset + 30, opacity: [0, 0.55, 0.85], scale: [0.3, 1.1, 1], rotate: [90, -15, 0] }}
                exit={{ x: [20, 150], opacity: [0.85, 0], scale: [1, 0.4], rotate: [0, -90], transition: { duration: 0.6, ease: [0.23, 0.9, 0.25, 1] } }}
                transition={{ duration: 1.2, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="tw:absolute tw:right-0"
                style={{ top: `${35 + idx * 20}%` }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, -8, 8, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                  className="tw:relative tw:w-14 tw:h-14 tw:rounded-2xl tw:shadow-xl tw:flex tw:items-center tw:justify-center"
                  style={{
                    background: "rgba(43,43,43,0.08)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(43,43,43,0.12)",
                  }}
                >
                  <Icon className="tw:w-7 tw:h-7 tw:text-primarySecond" strokeWidth={2} />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 }}
                    className="tw:absolute tw:inset-0 tw:rounded-2xl tw:bg-primarySecond/15 tw:blur-lg tw:-z-10"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Slide content */}
      <div className="tw:relative tw:mt-4 tw:z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="tw:flex tw:flex-col tw:items-center tw:space-y-5"
          >
            <FlowHeadline
              line1Words={currentSlide.line1}
              line2Words={currentSlide.line2}
              highlightWord={currentSlide.highlightWord}
            />

            <motion.span
              initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 130, damping: 18, delay: 0.22 }}
              className="tw:relative tw:block tw:mx-auto tw:max-w-3xl tw:text-center tw:text-base tw:text-gray-600 tw:mb-4 tw:px-4"
            >
              <motion.span
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: "linear-gradient(90deg, #6B7280 0%, #111827 50%, #6B7280 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  backgroundSize: "200% 100%",
                }}
              >
                {currentSlide.subText}
              </motion.span>
            </motion.span>

            <motion.div
              initial={{ y: 12, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 18, delay: 0.32 }}
              className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-center tw:gap-4"
            >
              <CTAButton to={currentSlide.ctaTo} label={currentSlide.ctaLabel} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="tw:mt-8 tw:flex tw:items-center tw:justify-center tw:gap-3">
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleDotClick(i)}
                className="tw:relative tw:h-2 tw:rounded-full tw:overflow-hidden tw:transition-[width] tw:duration-300 tw:cursor-pointer"
                style={{
                  width: isActive ? "30px" : "8px",
                  background: isActive ? "transparent" : "rgba(0,0,0,0.14)",
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="hero-slider-dot"
                    className="tw:absolute tw:inset-0 tw:rounded-full"
                    style={{ background: "linear-gradient(90deg,#050505,#2b2b2b)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Premium live dashboard mockup */}
      <LiveDashboardMockup />
    </section>
  );
}
