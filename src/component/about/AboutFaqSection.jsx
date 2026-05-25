// src/pages/about/AboutFaqSection.jsx
import React from "react";
import { motion } from "framer-motion";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
    a: "Yes. You can start with your phone and upgrade later. If you already have a Xilolo setup, that works too.",
  },
  {
    q: "Can I sell tickets for my events?",
    a: "Yes. You can create ticketed events, set your price, and earn directly from your audience.",
  },
  {
    q: "Where is Xilolo based?",
    a: "16192 Coastal Highway Lewes, Delaware 19958 Sussex County United States",
  },
];

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
        <span className="tw:block tw:text-[11px] tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
          FAQ
        </span>
        <span className="tw:font-league tw:mt-2 tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
          Quick answers before you start.
        </span>
        <span className="tw:mt-1 tw:block tw:text-sm tw:text-slate-600 tw:max-w-xl">
          These are the questions people ask before their first event.
        </span>
      </motion.div>

      <motion.div
        className="tw:rounded-3xl tw:bg-white tw:border tw:border-slate-200/80 tw:p-3 tw:md:p-4 tw:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        custom={0.1}
        variants={fadeUp}
      >
        {faqs.map((item, index) => (
          <Accordion
            key={item.q}
            disableGutters
            square={false}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  marginY: 0.5,
                },
              }}
            >
              <span className="tw:text-[13px] tw:md:text-[14px] tw:font-medium tw:text-slate-900">
                {item.q}
              </span>
            </AccordionSummary>

            <AccordionDetails sx={{ paddingTop: 0, paddingBottom: 1.5 }}>
              <span className="tw:block tw:text-[12px] tw:md:text-[13px] tw:text-slate-700">
                {item.a}
              </span>
            </AccordionDetails>

            {index !== faqs.length - 1 && (
              <span className="tw:block tw:h-px tw:bg-slate-100 tw:mx-3" />
            )}
          </Accordion>
        ))}
      </motion.div>
    </section>
  );
}
