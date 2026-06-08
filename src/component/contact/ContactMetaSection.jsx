import React from "react";
import { Clock, LayoutTemplate, Users } from "lucide-react";
import { motion } from "framer-motion";

const cards = [
  {
    icon: Clock,
    title: "Fast response",
    body: "We reply within 24 hours. If your event is close, include the date.",
    stat: "< 24 hrs",
    statLabel: "Avg. reply time",
    dark: true,
  },
  {
    icon: LayoutTemplate,
    title: "Clear plan",
    body: "We outline the steps from setup to going live, based on your exact needs.",
    stat: null,
    statLabel: null,
    dark: false,
  },
  {
    icon: Users,
    title: "Made for real teams",
    body: "Solo host or full crew, we help you run the show without confusion.",
    stat: null,
    statLabel: null,
    dark: false,
  },
];

export default function ContactMetaSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div
        className="tw:rounded-3xl tw:border tw:border-slate-200/70 tw:px-5 tw:py-6 tw:md:px-8 tw:md:py-8"
        style={{ background: "rgba(250,250,250,0.85)", boxShadow: "0 20px 55px rgba(15,23,42,0.06), 0 0 20px rgba(0,245,255,0.04)" }}
      >
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:gap-8">
          {/* Left: label + headline */}
          <div className="tw:max-w-sm tw:shrink-0">
            <span className="tw:block tw:text-[10px] tw:uppercase tw:tracking-[0.2em] tw:text-slate-400 tw:font-semibold tw:mb-2">
              What happens after you reach out
            </span>
            <span className="tw:font-league tw:block tw:text-base tw:md:text-xl tw:font-black tw:text-slate-900 tw:leading-snug">
              A short call, a clear plan, and a smooth launch.
            </span>
            <span className="tw:block tw:mt-2 tw:text-[12px] tw:md:text-[13px] tw:text-slate-500 tw:leading-relaxed">
              We keep it simple. We will understand your event, suggest the right setup, and help you decide how to run it on Xilolo.
            </span>
          </div>

          {/* Right: cards */}
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-3 tw:flex-1 tw:w-full">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="tw:relative tw:rounded-2xl tw:overflow-hidden tw:p-4 tw:flex tw:flex-col tw:gap-2.5"
                  style={
                    card.dark
                      ? {
                          background: "#050505",
                          color: "white",
                          boxShadow: "0 16px 50px rgba(5,5,5,0.4), 0 0 18px rgba(0,245,255,0.10)",
                        }
                      : {
                          background: "white",
                          border: "1px solid rgba(15,23,42,0.08)",
                          boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
                        }
                  }
                >
                  {card.dark && (
                    <div
                      aria-hidden
                      className="tw:absolute tw:-right-8 tw:-top-8 tw:w-24 tw:h-24 tw:rounded-full tw:blur-2xl tw:pointer-events-none"
                      style={{ background: "rgba(0,245,255,0.07)" }}
                    />
                  )}
                  <div className="tw:relative">
                    <div
                      className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-xl"
                      style={
                        card.dark
                          ? { background: "rgba(255,255,255,0.08)" }
                          : { background: "rgba(5,5,5,0.07)" }
                      }
                    >
                      <Icon
                        className="tw:w-4 tw:h-4"
                        style={{ color: card.dark ? "rgba(255,255,255,0.7)" : "#050505" }}
                      />
                    </div>
                  </div>

                  {card.stat && (
                    <div className="tw:relative">
                      <span
                        className="tw:block tw:text-[26px] tw:font-black tw:font-league tw:leading-none"
                        style={{ color: card.dark ? "white" : "#050505" }}
                      >
                        {card.stat}
                      </span>
                      <span
                        className="tw:block tw:text-[10px] tw:mt-0.5 tw:font-semibold"
                        style={{ color: card.dark ? "rgba(255,255,255,0.4)" : "rgba(5,5,5,0.4)" }}
                      >
                        {card.statLabel}
                      </span>
                    </div>
                  )}

                  <div className="tw:relative">
                    <span
                      className="tw:block tw:text-[12px] tw:font-semibold tw:mb-0.5"
                      style={{ color: card.dark ? "rgba(255,255,255,0.9)" : "#0f172a" }}
                    >
                      {card.title}
                    </span>
                    <span
                      className="tw:block tw:text-[11px] tw:leading-relaxed"
                      style={{ color: card.dark ? "rgba(255,255,255,0.5)" : "#64748b" }}
                    >
                      {card.body}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
