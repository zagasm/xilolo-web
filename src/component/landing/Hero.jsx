import React, { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  hidden: { y: 18, opacity: 0, filter: "blur(2px)" },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 140, damping: 18 },
  },
};

/* Headline that takes dynamic text per slide */
function FlowHeadline({
  line1Words,
  line2Words,
  highlightWord,
  initialDelay = 0.25,
  stagger = 0.08,
}) {
  const localSentence = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: { staggerChildren: stagger, delayChildren: initialDelay },
      },
    }),
    [initialDelay, stagger]
  );

  return (
    <div className="tw:relative tw:mb-4 tw:font-bold tw:font-league">
      {/* Continuous sheen across the whole headline */}
      <motion.span
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-0 tw:rounded-lg"
        initial={{ x: "-120%" }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* subtle breathing */}
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Line 1 */}
        <motion.span
          variants={localSentence}
          initial="hidden"
          animate="show"
          className="tw:block tw:text-center tw:font-[900] tw:leading-[0.95] tw:tracking-tight tw:text-[30px] tw:md:text-[40px] tw:lg:text-[53px] tw:text-gray-900"
        >
          {line1Words.map((w, i) => (
            <motion.span
              key={i}
              variants={word}
              className="tw:inline-block tw:mr-[0.35ch]"
            >
              <span
                className={
                  highlightWord && w === highlightWord
                    ? "tw:text-primary"
                    : ""
                }
              >
                {w}
              </span>
            </motion.span>
          ))}
        </motion.span>

        {/* Line 2 */}
        <motion.span
          variants={localSentence}
          initial="hidden"
          animate="show"
          className="tw:block tw:text-center tw:font-extrabold tw:leading-[0.95] tw:tracking-tight tw:text-[30px] tw:md:text-[40px] tw:lg:text-[53px] tw:text-gray-900"
        >
          {line2Words.map((w, i) => (
            <motion.span
              key={i}
              variants={word}
              className="tw:inline-block tw:mr-[0.35ch]"
            >
              {w}
            </motion.span>
          ))}
        </motion.span>
      </motion.div>
    </div>
  );
}

/* Slide-level variants for the whole block */
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: [0.23, 0.9, 0.25, 1],
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.45,
      ease: [0.23, 0.9, 0.25, 1],
    },
  }),
};

const slides = [
  {
    id: 0,
    line1: ["Welcome", "to", "Xilolo"],
    line2: ["Go", "live.", "Look", "premium.", "Reach", "everywhere."],
    highlightWord: "live.",
    subText:
      "High-quality live streaming for concerts, shows, and creators. Simple setup. Solid delivery.",
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
    subText:
      "Host any kind of event and stream it cleanly to your audience, anywhere.",
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
    subText:
      "Go live from your city and reach fans across countries in seconds.",
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
    subText:
      "No stress setup. Just a smooth flow that helps you deliver a great show.",
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
    subText:
      "Stable streaming that keeps your audience locked in from start to finish.",
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
    subText:
      "Make every stream feel like a real production, not a random live video.",
    ctaLabel: "Upgrade Your Streams",
    ctaTo: "/auth/signin",
    icons: [
      { Icon: Film, delay: 0.2, yOffset: 25, curve: -30 },
      { Icon: Mic, delay: 0.4, yOffset: 20, curve: 40 },
      { Icon: Tv, delay: 0.6, yOffset: 10, curve: -35 },
    ],
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // autoplay
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
    <section className="tw:mx-auto tw:max-w-7xl tw:px-5 tw:pt-8 tw:pb-6 tw:relative tw:overflow-hidden">
      <RatingBar />

      {/* Floating Icons - Right Side */}
      <div className="tw:absolute tw:right-4 tw:lg:right-12 tw:top-1/2 tw:-translate-y-1/2 tw:w-24 tw:lg:w-32 tw:h-full tw:pointer-events-none tw:hidden tw:md:block">
        <AnimatePresence mode="wait">
          {currentSlide.icons.map((iconData, idx) => {
            const { Icon, delay, yOffset, curve } = iconData;
            return (
              <motion.div
                key={`${currentSlide.id}-icon-${idx}`}
                initial={{
                  x: 200,
                  y: yOffset,
                  opacity: 0,
                  scale: 0.3,
                  rotate: -90,
                }}
                animate={{
                  x: [200, curve, 0],
                  y: yOffset,
                  opacity: [0, 0.7, 1],
                  scale: [0.3, 1.1, 1],
                  rotate: [-90, 15, 0],
                }}
                exit={{
                  x: [-20, -150],
                  opacity: [1, 0],
                  scale: [1, 0.4],
                  rotate: [0, 90],
                  transition: {
                    duration: 0.6,
                    ease: [0.23, 0.9, 0.25, 1],
                  },
                }}
                transition={{
                  duration: 1.2,
                  delay: delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="tw:absolute tw:left-0"
                style={{
                  top: `${30 + idx * 20}%`,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 8, -8, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.4,
                  }}
                  className="tw:relative tw:w-12 tw:h-12 tw:lg:w-16 tw:lg:h-16 tw:rounded-2xl tw:bg-linear-to-br tw:from-primary/15 tw:to-primarySecond/15 tw:backdrop-blur-sm tw:border tw:border-primary/15 tw:shadow-xl tw:flex tw:items-center tw:justify-center"
                >
                  <Icon
                    className="tw:w-6 tw:h-6 tw:lg:w-8 tw:lg:h-8 tw:text-primary"
                    strokeWidth={2}
                  />

                  {/* Glow effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.3,
                    }}
                    className="tw:absolute tw:inset-0 tw:rounded-2xl tw:bg-primary/20 tw:blur-lg tw:-z-10"
                  />

                  {/* Sparkle effect */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="tw:absolute tw:inset-0"
                  >
                    <div className="tw:absolute tw:top-1 tw:right-1 tw:w-1 tw:h-1 tw:bg-white tw:rounded-full tw:opacity-80" />
                    <div className="tw:absolute tw:bottom-2 tw:left-2 tw:w-1 tw:h-1 tw:bg-white tw:rounded-full tw:opacity-60" />
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Icons - Left Side (Mirror) */}
      <div className="tw:absolute tw:left-4 tw:lg:left-12 tw:top-1/2 tw:-translate-y-1/2 tw:w-24 tw:lg:w-32 tw:h-full tw:pointer-events-none tw:hidden tw:lg:block">
        <AnimatePresence mode="wait">
          {currentSlide.icons.map((iconData, idx) => {
            const { Icon, delay, yOffset, curve } = iconData;
            return (
              <motion.div
                key={`${currentSlide.id}-icon-left-${idx}`}
                initial={{
                  x: -200,
                  y: yOffset + 30,
                  opacity: 0,
                  scale: 0.3,
                  rotate: 90,
                }}
                animate={{
                  x: [-200, -curve, 0],
                  y: yOffset + 30,
                  opacity: [0, 0.6, 0.9],
                  scale: [0.3, 1.1, 1],
                  rotate: [90, -15, 0],
                }}
                exit={{
                  x: [20, 150],
                  opacity: [0.9, 0],
                  scale: [1, 0.4],
                  rotate: [0, -90],
                  transition: {
                    duration: 0.6,
                    ease: [0.23, 0.9, 0.25, 1],
                  },
                }}
                transition={{
                  duration: 1.2,
                  delay: delay + 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="tw:absolute tw:right-0"
                style={{
                  top: `${35 + idx * 20}%`,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, -8, 8, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.5,
                  }}
                  className="tw:relative tw:w-14 tw:h-14 tw:rounded-2xl tw:bg-linear-to-br tw:from-primarySecond/15 tw:to-primary/20 tw:backdrop-blur-sm tw:border tw:border-primarySecond/15 tw:shadow-xl tw:flex tw:items-center tw:justify-center"
                >
                  <Icon
                    className="tw:w-7 tw:h-7 tw:text-primarySecond"
                    strokeWidth={2}
                  />

                  {/* Glow effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.4,
                    }}
                    className="tw:absolute tw:inset-0 tw:rounded-2xl tw:bg-primarySecond/20 tw:blur-lg tw:-z-10"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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
            {/* Headline (per-slide text) */}
            <FlowHeadline
              line1Words={currentSlide.line1}
              line2Words={currentSlide.line2}
              highlightWord={currentSlide.highlightWord}
            />

            {/* Sub text with shimmer */}
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 18,
                delay: 0.2,
              }}
              className="tw:relative tw:block tw:mx-auto tw:max-w-3xl tw:text-center tw:text-base tw:text-gray-600 tw:mb-4 tw:px-4"
            >
              <motion.span
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #6B7280 0%, #111827 50%, #6B7280 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  backgroundSize: "200% 100%",
                }}
              >
                {currentSlide.subText}
              </motion.span>
            </motion.span>

            {/* CTA */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 18,
                delay: 0.3,
              }}
              className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-center tw:gap-4"
            >
              <CTAButton
                to={currentSlide.ctaTo}
                label={currentSlide.ctaLabel}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slider dots */}
        <div className="tw:mt-8 tw:flex tw:items-center tw:justify-center tw:gap-3">
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleDotClick(i)}
                className="tw:relative tw:h-2.5 tw:rounded-full tw:overflow-hidden tw:bg-gray-200 tw:transition-[width] tw:duration-300 tw:cursor-pointer tw:hover:bg-gray-300"
                style={{ width: isActive ? "32px" : "10px" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="hero-slider-dot"
                    className="tw:absolute tw:inset-0 tw:rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#111111,#2b2b2b)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
