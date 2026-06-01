import React from "react";
import { ArrowRight, Bot, CalendarCheck, MessageCircle, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const aiBenefits = [
  {
    title: "Ask about your account",
    description: "Get quick answers about wallet balance, subscriptions, tickets, and profile actions.",
    icon: ShieldCheck,
  },
  {
    title: "Plan better events",
    description: "Use AI support for event ideas, ticketing decisions, descriptions, and launch steps.",
    icon: CalendarCheck,
  },
  {
    title: "Move faster live",
    description: "Get guidance for streaming setup, OBS basics, replays, and event access questions.",
    icon: Ticket,
  },
];

export default function XiloloAiSection() {
  return (
    <section className="tw:relative tw:overflow-hidden tw:bg-[#0a0a0b] tw:px-4 tw:py-20 tw:text-white tw:md:px-10 tw:md:py-32 tw:lg:px-20">
      {/* Neon ambient glow — top center */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:flex tw:justify-center tw:overflow-hidden"
      >
        <div
          style={{
            width: "900px",
            height: "280px",
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,255,209,0.09) 0%, transparent 65%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Neon glow — bottom right */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:bottom-0 tw:right-0 tw:overflow-hidden"
        style={{ width: "500px", height: "400px" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(ellipse at 100% 100%, rgba(0,255,209,0.06) 0%, transparent 60%)",
            filter: "blur(30px)",
          }}
        />
      </div>

      {/* Subtle scan-line grid */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-0 tw:opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="tw:relative tw:mx-auto tw:grid tw:max-w-6xl tw:grid-cols-1 tw:items-center tw:gap-10 tw:lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="tw:max-w-2xl"
        >
          <motion.span
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em]"
            style={{
              background: "rgba(0,255,209,0.07)",
              border: "1px solid rgba(0,255,209,0.18)",
              color: "rgba(0,255,209,0.9)",
            }}
            whileHover={{ scale: 1.03 }}
          >
            <Sparkles className="tw:h-3.5 tw:w-3.5" />
            Xilolo AI beta
          </motion.span>

          <span className="tw:font-league tw:mt-5 tw:block tw:text-3xl tw:font-black tw:leading-[0.96] tw:tracking-tight tw:md:text-4xl tw:lg:text-5xl">
            Your event co-pilot is already warming up.
          </span>

          <span className="tw:mt-5 tw:block tw:max-w-xl tw:text-sm tw:leading-7 tw:text-white/65 tw:md:text-base">
            Xilolo AI launches fully next month. A beta version is live now for all subscribed users, built to help with tickets, wallet questions, event setup, streaming guidance, and faster support inside Xilolo.
          </span>

          <div className="tw:mt-8 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <Link
              to="/subscription"
              className="tw:inline-flex tw:h-12 tw:items-center tw:gap-3 tw:rounded-full tw:bg-white tw:px-5 tw:text-sm tw:font-black tw:text-primary tw:transition hover:tw:-translate-y-0.5"
              style={{ boxShadow: "0 18px 45px rgba(0,0,0,0.3), 0 0 20px rgba(0,255,209,0.08)" }}
            >
              Unlock beta
              <span className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                <ArrowRight className="tw:h-4 tw:w-4" />
              </span>
            </Link>

            <Link
              to="/xilolo-ai"
              className="tw:inline-flex tw:h-12 tw:items-center tw:gap-2 tw:rounded-full tw:px-5 tw:text-sm tw:font-black tw:text-white tw:transition hover:tw:bg-white/8"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Try beta
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 130, damping: 20 }}
          className="tw:relative"
        >
          {/* Card glow aura */}
          <div
            aria-hidden
            className="tw:absolute tw:inset-x-8 tw:-bottom-6 tw:h-24 tw:rounded-full tw:blur-2xl tw:pointer-events-none"
            style={{ background: "rgba(0,255,209,0.08)" }}
          />

          <div
            className="tw:overflow-hidden tw:rounded-[28px] tw:p-3 tw:text-primary tw:md:p-4"
            style={{
              background: "rgba(229,228,226,0.96)",
              border: "1px solid rgba(0,255,209,0.12)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,255,209,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="tw:flex tw:items-center tw:justify-between tw:rounded-[20px] tw:px-4 tw:py-3"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:grid tw:h-10 tw:w-10 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                  <Bot className="tw:h-5 tw:w-5" />
                </span>
                <div>
                  <span className="tw:block tw:text-sm tw:font-black">Xilolo AI</span>
                  <span className="tw:block tw:text-xs tw:font-semibold tw:text-[#6b625a]">Beta access for subscribers</span>
                </div>
              </div>
              <span
                className="tw:rounded-full tw:px-3 tw:py-1 tw:text-[11px] tw:font-black"
                style={{
                  background: "rgba(0,255,209,0.1)",
                  color: "rgba(5,100,80,1)",
                  border: "1px solid rgba(0,255,209,0.25)",
                  boxShadow: "0 0 10px rgba(0,255,209,0.1)",
                }}
              >
                Live
              </span>
            </div>

            {/* Chat messages */}
            <div className="tw:mt-4 tw:space-y-3 tw:px-1 tw:pb-1">
              <div className="tw:max-w-[82%] tw:text-sm tw:font-semibold tw:leading-6 tw:text-[#5f5a55]">
                Ask me about tickets, events, wallet balance, stream setup, or subscription access.
              </div>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="tw:ml-auto tw:max-w-[82%] tw:rounded-[18px] tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:leading-6 tw:text-white"
                style={{ background: "#050505" }}
              >
                Help me prepare my next paid live event.
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="tw:max-w-[88%] tw:text-sm tw:font-semibold tw:leading-6 tw:text-[#5f5a55]"
              >
                Start with the event title, ticket price, replay plan, and how you want your audience to join.
              </motion.div>
            </div>

            {/* Input bar */}
            <div className="tw:mt-5 tw:grid tw:grid-cols-[1fr_42px] tw:gap-2">
              <div
                className="tw:flex tw:h-11 tw:items-center tw:rounded-[16px] tw:px-3 tw:text-sm tw:font-semibold tw:text-[#8b8580]"
                style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                Ask Xilolo AI...
              </div>
              <span
                className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white"
                style={{ boxShadow: "0 0 14px rgba(0,255,209,0.12)" }}
              >
                <MessageCircle className="tw:h-4 tw:w-4" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Benefit cards */}
      <div className="tw:relative tw:mx-auto tw:mt-12 tw:grid tw:max-w-6xl tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3">
        {aiBenefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="tw:rounded-2xl tw:p-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                transition: "border-color 0.2s",
              }}
            >
              <span
                className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-full tw:bg-white tw:text-primary"
                style={{ boxShadow: "0 0 16px rgba(0,255,209,0.1)" }}
              >
                <Icon className="tw:h-5 tw:w-5" />
              </span>
              <span className="tw:mt-4 tw:block tw:text-base tw:font-semibold">{benefit.title}</span>
              <span className="tw:mt-2 tw:block tw:text-sm tw:leading-6 tw:text-white/60">{benefit.description}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
