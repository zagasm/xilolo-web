import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Card, SectionHeading } from "../ui";

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
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="tw:group tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-4 tw:text-left"
        >
          <span className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-ink tw:transition-colors tw:group-hover:text-accent-deep tw:md:text-[15px]">
            {item.q}
          </span>
          <span
            aria-hidden="true"
            className="tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-chip tw:text-muted-strong"
          >
            {open ? <Minus className="tw:size-3.5" /> : <Plus className="tw:size-3.5" />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeInOut" }}
              className="tw:overflow-hidden"
            >
              {/* span, not <p>: `#root p { color: inherit }` beats tw:text-* on paragraphs */}
              <span className="tw:block tw:max-w-[62ch] tw:pt-3 tw:text-[13px] tw:leading-relaxed tw:text-muted">
                {item.a}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function AboutFaqSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <SectionHeading
          eyebrow="FAQ"
          title="Quick answers before you start."
          subtitle="These are the questions people ask before their first event."
        />
      </motion.div>

      <div className="tw:flex tw:flex-col tw:gap-3">
        {faqs.map((item, index) => (
          <FaqItem key={item.q} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
