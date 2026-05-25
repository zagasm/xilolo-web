// src/pages/contact/ContactMetaSection.jsx
import React from "react";
import { Clock, LayoutTemplate, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactMetaSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="tw:rounded-3xl tw:bg-slate-50/80 tw:border tw:border-slate-200/80 tw:px-5 tw:py-6 tw:md:px-7 tw:md:py-7 tw:shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:justify-between tw:gap-6">
          <div className="tw:max-w-md">
            <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
              What happens after you reach out
            </span>
            <span className="tw:font-league tw:block tw:mt-2 tw:text-base tw:md:text-lg tw:font-semibold tw:text-slate-900">
              A short call, a clear plan, and a smooth launch.
            </span>
            <span className="tw:block tw:mt-1.5 tw:text-[12px] tw:md:text-[13px] tw:text-slate-600">
              We keep it simple. We will understand your event, suggest the
              right setup, and help you decide how to run it on Xilolo, free or
              ticketed.
            </span>
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-3 tw:w-full tw:max-w-xl">
            <MetaCard
              icon={Clock}
              title="Fast response"
              body="We reply within 24 hours. If your event is close, include the date."
            />
            <MetaCard
              icon={LayoutTemplate}
              title="Clear plan"
              body="We outline the steps from setup to going live, based on your exact needs."
            />
            <MetaCard
              icon={Users}
              title="Made for real teams"
              body="Solo host or full crew, we help you run the show without confusion."
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MetaCard({ icon: Icon, title, body }) {
  return (
    <motion.div
      className="tw:rounded-2xl tw:bg-white tw:border tw:border-slate-200/80 tw:px-3.5 tw:py-3.5 tw:text-[12px] tw:text-slate-600 tw:shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1.5">
        <div className="tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary/10 tw:text-primary">
          <Icon className="tw:w-3.5 tw:h-3.5" />
        </div>
        <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-slate-900">
          {title}
        </span>
      </div>
      <span className="tw:block">{body}</span>
    </motion.div>
  );
}
