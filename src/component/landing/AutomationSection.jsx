import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AutomationSection({
  title = "Save 4+ hours every day",
  subtitle = "Let our intelligent automation tools handle repetitive tasks, so you can reclaim your time and focus on strategic initiatives.",
  ctaTo = "/auth/signup",
  ctaLabel = "Get Started for Free",
  mediaSrc,
  mediaAlt = "Automation preview",
  right = false,
}) {
  const isVideo =
    typeof mediaSrc === "string" && /\.(mp4|webm|ogg)$/i.test(mediaSrc || "");

  const textVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: "spring", stiffness: 140, damping: 18 },
    }),
  };

  /* metric chips shown floating over the image */
  const metrics = right
    ? [
        { label: "Tickets sold", value: "234", change: "+18%", pos: "tw:top-4 tw:left-4" },
        { label: "Revenue", value: "$4,120", change: "This month", pos: "tw:bottom-4 tw:right-4", dark: true },
      ]
    : [
        { label: "Stream started", value: "01:24", change: "On time ✓", pos: "tw:top-4 tw:right-4", dark: true },
        { label: "Viewers live", value: "1,850", change: "↑ 22%", pos: "tw:bottom-4 tw:left-4" },
      ];

  return (
    <section className="tw:relative tw:mt-24 tw:mb-44 tw:md:mt-56">
      {/* Section blur backdrops */}
      <div aria-hidden className="tw:pointer-events-none tw:absolute tw:inset-0">
        <div className="tw:absolute tw:-left-40 tw:top-10 tw:h-[420px] tw:w-[420px] tw:rounded-full tw:blur-[90px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,17,0.14),rgba(43,43,43,0.07)_55%,transparent_70%)]" />
        <div className="tw:absolute tw:-right-28 tw:bottom-0 tw:h-[520px] tw:w-[520px] tw:rounded-full tw:blur-[110px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(43,43,43,0.12),rgba(17,17,17,0.06)_55%,transparent_70%)]" />
      </div>

      <div className="tw:relative tw:z-10 tw:mx-auto tw:max-w-6xl tw:px-5">
        <div
          className={`tw:flex tw:flex-col ${
            right ? "tw:md:flex-row-reverse" : "tw:md:flex-row"
          } tw:justify-between tw:items-center tw:gap-10`}
        >
          {/* Copy */}
          <motion.div
            className="tw:max-w-xl tw:text-center tw:md:text-left"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.span
              className="tw:font-league tw:block tw:mb-4 tw:text-3xl tw:md:text-[40px] tw:lg:text-5xl tw:font-black tw:leading-[0.95] tw:tracking-tight tw:text-gray-900"
              variants={textVariants}
              custom={1}
            >
              {title}
            </motion.span>

            <motion.span
              className="tw:block tw:text-gray-600 tw:text-sm tw:md:text-lg tw:lg:text-xl tw:mb-8 tw:max-w-[52ch]"
              variants={textVariants}
              custom={2}
            >
              {subtitle}
            </motion.span>

            <motion.div
              variants={textVariants}
              custom={3}
              animate={{ y: -2 }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <Link
                to={ctaTo}
                className="tw:group tw:inline-flex tw:items-center tw:gap-3 tw:rounded-full tw:bg-white tw:px-5 tw:py-3 tw:border tw:border-primary/20 tw:text-primary tw:font-semibold tw:shadow-lg tw:hover:shadow-xl tw:transition"
              >
                {ctaLabel}
                <span className="tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-[linear-gradient(135deg,#050505,#2b2b2b)] tw:text-white">
                  <ArrowRight size={18} />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Media + floating metrics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: right ? -1.5 : 1.5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            className="tw:relative tw:w-full tw:max-w-[500px]"
          >
            {/* Glow behind card */}
            <div
              aria-hidden
              className="tw:absolute tw:-inset-4 tw:rounded-3xl tw:blur-2xl tw:pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(5,5,5,0.12), transparent 65%)",
              }}
            />

            {/* Media card */}
            <motion.div
              whileHover={{ y: -4 }}
              className="tw:relative tw:rounded-2xl tw:overflow-hidden tw:shadow-[0_24px_70px_rgba(0,0,0,0.15)] tw:ring-1 tw:ring-black/8"
              animate={{ y: -2 }}
              transition={{
                default: {
                  duration: 0.3,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                },
              }}
            >
              {isVideo ? (
                <video
                  src={mediaSrc}
                  playsInline
                  muted
                  loop
                  autoPlay
                  className="tw:w-full tw:h-full tw:block"
                />
              ) : (
                <img
                  src={mediaSrc}
                  alt={mediaAlt}
                  className="tw:w-full tw:h-full tw:block"
                  loading="lazy"
                />
              )}

              {/* Subtle image overlay gradient */}
              <div className="tw:absolute tw:inset-0 tw:pointer-events-none tw:bg-gradient-to-t tw:from-black/10 tw:to-transparent" />
            </motion.div>

            {/* Floating metric chips */}
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.88, y: idx === 0 ? -10 : 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.5 + idx * 0.15, type: "spring", stiffness: 180 }}
                className={`tw:absolute ${m.pos}`}
              >
                <motion.div
                  animate={{ y: [0, idx === 0 ? -5 : 5, 0] }}
                  transition={{
                    duration: 4 + idx,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.8,
                  }}
                  className={[
                    "tw:rounded-2xl tw:px-3.5 tw:py-2.5 tw:shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
                    m.dark
                      ? "tw:bg-[#050505] tw:text-white tw:border tw:border-white/10"
                      : "tw:bg-white tw:text-gray-900 tw:border tw:border-black/5",
                  ].join(" ")}
                >
                  <span className={`tw:block tw:text-[9px] tw:uppercase tw:tracking-widest tw:font-semibold ${m.dark ? "tw:text-white/40" : "tw:text-gray-400"}`}>
                    {m.label}
                  </span>
                  <span className="tw:block tw:text-lg tw:font-black tw:mt-0.5 tw:font-league">{m.value}</span>
                  <span className={`tw:block tw:text-[10px] tw:mt-0.5 ${m.dark ? "tw:text-white/50" : "tw:text-gray-400"}`}>
                    {m.change}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
