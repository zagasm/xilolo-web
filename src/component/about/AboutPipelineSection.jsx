import React from "react";
import { motion } from "framer-motion";
import { Wifi, Settings, DollarSign } from "lucide-react";
import { Card, Chip, SectionHeading } from "../ui";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const steps = [
  {
    num: "01",
    label: "Setup",
    title: "Connect and go LIVE.",
    body: "Connect OBS, Ecamm, or hardware encoders. Route to a private stage in a few clicks.",
    icon: Wifi,
  },
  {
    num: "02",
    label: "Control Room",
    title: "Run your show cleanly.",
    body: "Manage guests, keep the stream steady, and stay focused while the show is live.",
    icon: Settings,
  },
  {
    num: "03",
    label: "Tickets",
    title: "Sell tickets and keep earning.",
    body: "Create ticketed events, sell access, and keep your content working after the show ends.",
    icon: DollarSign,
  },
];

export default function AboutPipelineSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={item}
      >
        <SectionHeading
          eyebrow="How it works"
          title="From setup to showtime, all in one flow."
          subtitle="Create an event, go live, and keep the whole production organized in one place. Your show stays smooth and your audience stays locked in."
        />
      </motion.div>

      <motion.div
        className="tw:grid tw:grid-cols-1 tw:gap-5 tw:md:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
      >
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div key={step.num} variants={item}>
              <Card className="tw:flex tw:h-full tw:flex-col tw:gap-3">
                <Chip icon={Icon} className="tw:self-start">
                  {step.num} · {step.label}
                </Chip>

                <h3 className="tw:mb-0 tw:font-display tw:text-lg tw:font-bold tw:leading-snug tw:tracking-[-0.01em] tw:text-ink">
                  {step.title}
                </h3>

                {/* span, not <p>: `#root p { color: inherit }` beats tw:text-* on paragraphs */}
                <span className="tw:block tw:text-[13px] tw:leading-relaxed tw:text-muted">
                  {step.body}
                </span>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
