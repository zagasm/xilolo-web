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
    <section className="tw:relative tw:overflow-hidden tw:bg-[#0f0f10] tw:px-4 tw:py-20 tw:text-white tw:md:px-10 tw:md:py-32 tw:lg:px-20">
      <div className="tw:mx-auto tw:grid tw:max-w-6xl tw:grid-cols-1 tw:items-center tw:gap-10 tw:lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="tw:max-w-2xl"
        >
          <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/10 tw:bg-white/5 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-white">
            <Sparkles className="tw:h-3.5 tw:w-3.5" />
            Xilolo AI beta
          </span>

          <span className="tw:font-league tw:mt-5 tw:block tw:text-3xl tw:font-[900] tw:leading-[0.96] tw:tracking-tight tw:md:text-4xl tw:lg:text-5xl">
            Your event co-pilot is already warming up.
          </span>

          <span className="tw:mt-5 tw:block tw:max-w-xl tw:text-sm tw:leading-7 tw:text-white/72 tw:md:text-base">
            Xilolo AI launches fully next month. A beta version is live now for all subscribed users, built to help with tickets, wallet questions, event setup, streaming guidance, and faster support inside Xilolo.
          </span>

          <div className="tw:mt-8 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <Link
              to="/subscription"
              className="tw:inline-flex tw:h-12 tw:items-center tw:gap-3 tw:rounded-full tw:bg-white tw:px-5 tw:text-sm tw:font-black tw:text-primary tw:shadow-[0_18px_45px_rgba(0,0,0,0.28)] tw:transition hover:tw:translate-y-[-2px]"
            >
              Unlock beta
              <span className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                <ArrowRight className="tw:h-4 tw:w-4" />
              </span>
            </Link>

            <Link
              to="/xilolo-ai"
              className="tw:inline-flex tw:h-12 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-white/15 tw:bg-white/5 tw:px-5 tw:text-sm tw:font-black text-white tw:transition hover:tw:bg-white/10"
            >
              Try beta
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 150, damping: 18 }}
          className="tw:relative"
        >
          <div className="tw:overflow-hidden tw:rounded-[30px] tw:border tw:border-white/10 tw:bg-[#e5e4e2] tw:p-3 tw:text-primary tw:shadow-[0_26px_90px_rgba(0,0,0,0.38)] tw:md:p-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:rounded-[22px] tw:bg-white/70 tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:grid tw:h-10 tw:w-10 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                  <Bot className="tw:h-5 tw:w-5" />
                </span>
                <div>
                  <span className="tw:block tw:text-sm tw:font-black">Xilolo AI</span>
                  <span className="tw:block tw:text-xs tw:font-semibold tw:text-[#6b625a]">Beta access for subscribers</span>
                </div>
              </div>
              <span className="tw:rounded-full tw:bg-emerald-50 tw:px-3 tw:py-1 tw:text-[11px] tw:font-black tw:text-emerald-700">
                Live
              </span>
            </div>

            <div className="tw:mt-4 tw:space-y-3 tw:px-1 tw:pb-1">
              <div className="tw:max-w-[82%] tw:text-sm tw:font-semibold tw:leading-6 tw:text-[#5f5a55]">
                Ask me about tickets, events, wallet balance, stream setup, or subscription access.
              </div>
              <div className="tw:ml-auto tw:max-w-[82%] tw:rounded-[18px] tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:leading-6 tw:text-white">
                Help me prepare my next paid live event.
              </div>
              <div className="tw:max-w-[88%] tw:text-sm tw:font-semibold tw:leading-6 tw:text-[#5f5a55]">
                Start with the event title, ticket price, replay plan, and how you want your audience to join.
              </div>
            </div>

            <div className="tw:mt-5 tw:grid tw:grid-cols-[1fr_42px] tw:gap-2">
              <div className="tw:flex tw:h-11 tw:items-center tw:rounded-[16px] tw:border tw:border-[#d8d0c5] tw:bg-white/60 tw:px-3 tw:text-sm tw:font-semibold tw:text-[#8b8580]">
                Ask Xilolo AI...
              </div>
              <span className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                <MessageCircle className="tw:h-4 tw:w-4" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="tw:mx-auto tw:mt-10 tw:grid tw:max-w-6xl tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3">
        {aiBenefits.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="tw:rounded-2xl tw:border tw:border-white/10 tw:bg-white/5 tw:p-5"
            >
              <span className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-full tw:bg-white tw:text-primary">
                <Icon className="tw:h-5 tw:w-5" />
              </span>
              <span className="tw:mt-4 tw:block tw:text-base tw:font-semibold">{benefit.title}</span>
              <span className="tw:mt-2 tw:block tw:text-sm tw:leading-6 tw:text-white/68">{benefit.description}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
