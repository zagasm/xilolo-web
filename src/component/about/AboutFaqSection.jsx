import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay },
  }),
};

const faqs = [
  {
    q: "Who is Xilolo for?",
    a: "For organisers, studios, and creators who want to run proper live events. If you care about quality, consistency, and selling tickets, you will feel at home here.",
  },
  {
    q: "Can I start without fancy equipment?",
    a: "Yes. You can start with your phone and upgrade later. If you already have a studio setup with OBS or similar software, that works too.",
  },
  {
    q: "Can I sell tickets for my events?",
    a: "Yes. You can create ticketed events, set your price, and earn directly from your audience. Payouts are handled cleanly inside the platform.",
  },
  {
    q: "Does Xilolo support replays and recorded content?",
    a: "Yes. After your live event ends, you can schedule replay windows and share highlights to keep your content earning beyond the live moment.",
  },
  {
    q: "Where is Xilolo based?",
    a: "16192 Coastal Highway Lewes, Delaware 19958 Sussex County, United States.",
  },
];

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="tw:border-b tw:border-slate-100 last:tw:border-0"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-4 tw:py-4 tw:text-left tw:group"
      >
        <span className="tw:text-[13px] tw:md:text-[14px] tw:font-semibold tw:text-slate-900 tw:group-hover:text-primary tw:transition-colors tw:duration-200">
          {item.q}
        </span>
        <span className="tw:shrink-0 tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-slate-500 tw:group-hover:bg-primary/10 tw:group-hover:text-primary tw:transition-colors tw:duration-200">
          {open ? <Minus className="tw:w-3.5 tw:h-3.5" /> : <Plus className="tw:w-3.5 tw:h-3.5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="tw:overflow-hidden"
          >
            <p className="tw:pb-4 tw:text-[12px] tw:md:text-[13px] tw:text-slate-600 tw:leading-relaxed tw:max-w-2xl">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AboutFaqSection() {
  return (
    <section className="tw:space-y-5">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        custom={0}
        variants={fadeUp}
      >
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-slate-500 tw:font-semibold">
          FAQ
        </span>
        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-3xl tw:font-black tw:text-slate-900">
          Quick answers before you start.
        </span>
        <span className="tw:mt-1 tw:block tw:text-sm tw:text-slate-600 tw:max-w-xl">
          These are the questions people ask before their first event.
        </span>
      </motion.div>

      <motion.div
        className="tw:rounded-3xl tw:bg-white tw:border tw:border-slate-200/80 tw:px-5 tw:md:px-6 tw:divide-y tw:divide-slate-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        custom={0.1}
        variants={fadeUp}
        style={{ boxShadow: "0 18px 50px rgba(15,23,42,0.07)" }}
      >
        {faqs.map((item, index) => (
          <FaqItem key={item.q} item={item} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
