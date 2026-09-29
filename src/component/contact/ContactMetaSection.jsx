import React from "react";
import { Clock, LayoutTemplate, Users } from "lucide-react";
import { Card, Chip, SectionHeading } from "../ui";

/**
 * "What happens after you reach out".
 *
 * Flat: hairline cards on the paper page, one accent element per card (an
 * accent-soft icon pill with accent-deep iconography, or a single chip). The
 * hardcoded #050505 panel, the cyan glow blob and the `0 14px 40px` shadows from
 * the previous version are gone.
 *
 * `!` suffixes: Tailwind utilities sit in `@layer utilities` while Bootstrap's
 * reboot / the template sheet are unlayered, so their element rules win on
 * headings, paragraphs, anchors and buttons — including the arbitrary child
 * variants used to reach inside the shared SectionHeading.
 */

const headingFixes =
  "tw:[&>h2]:m-0! tw:[&>h2]:font-extrabold! tw:[&>p]:m-0! tw:[&>p]:text-muted-strong!";

const cards = [
  {
    icon: Clock,
    title: "Fast response",
    body: "We reply within 24 hours. If your event is close, include the date.",
    chip: "< 24 hrs avg. reply",
  },
  {
    icon: LayoutTemplate,
    title: "Clear plan",
    body: "We outline the steps from setup to going live, based on your exact needs.",
    chip: null,
  },
  {
    icon: Users,
    title: "Made for real teams",
    body: "Solo host or full crew, we help you run the show without confusion.",
    chip: null,
  },
];

export default function ContactMetaSection() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-6">
      <SectionHeading
        eyebrow="What happens after you reach out"
        title="A short call, a clear plan, and a smooth launch."
        subtitle="We keep it simple. We will understand your event, suggest the right setup, and help you decide how to run it on Xilolo."
        className={headingFixes}
      />

      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-3">
        {cards.map(({ icon: Icon, title, body, chip }) => (
          <Card key={title} className="tw:flex tw:flex-col tw:gap-3">
            <span className="tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-pill tw:bg-accent-soft tw:text-accent-deep">
              <Icon className="tw:size-4" aria-hidden="true" />
            </span>

            <h3 className="tw:m-0! tw:font-display tw:text-base! tw:font-bold! tw:leading-snug! tw:tracking-[-0.01em] tw:text-ink!">
              {title}
            </h3>

            <p className="tw:m-0! tw:text-sm tw:leading-relaxed tw:text-muted-strong!">{body}</p>

            {chip ? (
              <div className="tw:mt-auto tw:pt-1">
                <Chip>{chip}</Chip>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
