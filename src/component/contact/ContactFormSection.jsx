import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight, Send, MessagesSquare } from "lucide-react";
import { Button, Card, Chip, Field, Input, SectionHeading } from "../ui";
import { showSuccess } from "../ui/toast";

/**
 * Contact form + contact details.
 *
 * STYLING PASS ONLY. The form logic is untouched: same `submitting` / `sent`
 * state, same `handleSubmit` (preventDefault → 900ms simulated submit →
 * showSuccess), same control types, `required` flags, default values and
 * placeholder copy. There is no API call to preserve — this screen has always
 * been the simulated-submit version.
 *
 * Presentation uses the shared primitives (Card / Field / Input / Button / Chip
 * / SectionHeading): flat, hairline borders, 12px cards, pill buttons, accent as
 * a fill with ink on top. The retired cyan glow blobs, #050505 panels,
 * `0 24px 70px` shadows and white-on-accent button are gone.
 *
 * Real, verified contact details only (as already carried in this repo):
 * support@xilolo.com · +234 802 379 7265 · 16192 Coastal Highway, Lewes,
 * Delaware 19958, Sussex County, United States — plus the existing
 * support-hours line and a link to the existing /support route.
 *
 * ── Why the `!` suffixes ────────────────────────────────────────────────────
 * Tailwind ships in `@layer utilities`; Bootstrap's reboot and the template
 * stylesheet are unlayered and therefore win on the properties their ELEMENT
 * rules declare (`#root p{color:inherit}`, `a{color}`, `h1..h6{font-weight:500;
 * margin-bottom:.5rem}`, `button{border-radius:0}`). Utilities that collide with
 * those carry Tailwind's important modifier so the tokens land. Arbitrary child
 * variants are used to reach inside the shared SectionHeading, whose internal
 * <p>/<h2> hit the same trap; the primitive itself is not modified.
 */

const micro = "tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em]";

/* Selects and textareas are not part of the Input primitive, so they reuse its
   exact token recipe rather than inventing a second input look. */
const controlBase =
  "tw:w-full tw:rounded-control tw:border tw:border-hairline tw:bg-paper-raised " +
  "tw:px-3.5 tw:text-base! tw:text-ink tw:outline-none tw:placeholder:text-faint " +
  "tw:focus:border-accent tw:focus:ring-2 tw:focus:ring-accent/25";

const selectClass = `${controlBase} tw:h-12`;
const textareaClass = `${controlBase} tw:min-h-[112px] tw:resize-none tw:py-2.5`;

/* SectionHeading internals: kill Bootstrap's heading margin/weight and the
   greyscale on its paragraph. */
const headingFixes =
  "tw:[&>h2]:m-0! tw:[&>h2]:font-extrabold! tw:[&>p]:m-0! tw:[&>p]:text-muted-strong!";

const detailRow = "tw:flex tw:items-start tw:gap-3 tw:rounded-card tw:border tw:border-hairline-dark tw:p-3";
const detailIcon =
  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-paper-raised/10 tw:text-ink-muted";

export default function ContactFormSection() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      showSuccess("Message sent. We will get back to you soon.");
    }, 900);
  };

  return (
    <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] tw:lg:items-start tw:lg:gap-8">
      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <Card className="tw:p-5 tw:md:p-6">
        <SectionHeading
          title="Tell us about your event"
          subtitle="A few details help us respond with something useful, not a generic reply."
          className={headingFixes}
        />

        {sent ? (
          /* Success state — flat; accent FILL with ink icon (white on accent is 2.97:1) */
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-14 tw:text-center">
            <span className="tw:flex tw:size-12 tw:items-center tw:justify-center tw:rounded-pill tw:bg-accent tw:text-ink">
              <Send className="tw:size-5" aria-hidden="true" />
            </span>
            <p className="tw:m-0! tw:font-display tw:text-lg tw:font-bold tw:text-ink!">
              Message sent
            </p>
            <p className="tw:m-0! tw:max-w-[42ch] tw:text-sm tw:text-muted-strong!">
              We will get back to you within 24 hours. Check your inbox.
            </p>
          </div>
        ) : (
          <form className="tw:mt-6 tw:flex tw:flex-col tw:gap-4" onSubmit={handleSubmit}>
            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
              <Field label="Full name">
                <Input type="text" required placeholder="Your name" className="tw:text-base!" />
              </Field>
              <Field label="Email">
                <Input type="email" required placeholder="you@brand.com" className="tw:text-base!" />
              </Field>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
              <Field label="You are">
                <select className={selectClass} defaultValue="" required>
                  <option value="" disabled>Choose one</option>
                  <option value="creator">Creator / Host</option>
                  <option value="agency">Agency</option>
                  <option value="brand">Brand / Organisation</option>
                  <option value="event">Event organiser</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="How often do you host?">
                <select className={selectClass} defaultValue="" required>
                  <option value="" disabled>Select one</option>
                  <option value="once">One-off / occasional</option>
                  <option value="monthly">1 to 3 times per month</option>
                  <option value="weekly">Weekly</option>
                  <option value="often">Multiple times per week</option>
                </select>
              </Field>
            </div>

            <Field label="What do you want to host?">
              <textarea
                rows={4}
                required
                placeholder="Concert, talk show, church service, comedy night, community hangout, training, panel…"
                className={textareaClass}
              />
            </Field>

            <Field label="When is your next event?">
              <textarea
                rows={2}
                placeholder="Date, time, and any deadlines you are working with"
                className={textareaClass}
              />
            </Field>

            <div className="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:border-t tw:border-hairline tw:pt-4">
              {/* 50px pill — Bootstrap's `button{border-radius:0}` is neutralised */}
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="tw:rounded-pill! tw:text-base! tw:w-full tw:sm:w-auto"
              >
                {submitting ? "Sending…" : "Send message"}
                <ArrowRight className="tw:size-4" aria-hidden="true" />
              </Button>
              <p className="tw:m-0! tw:text-xs tw:text-muted-strong!">
                We only use your details to reply to this message.
              </p>
            </div>
          </form>
        )}
      </Card>

      {/* ── Details (the page's one dark break) ───────────────────────────── */}
      <div className="tw:flex tw:flex-col tw:gap-4">
        <Card dark className="tw:p-5 tw:md:p-6">
          <p className={`tw:m-0! tw:text-ink-muted! ${micro}`}>Xilolo contact</p>
          <p className="tw:mt-3! tw:mb-0! tw:text-sm tw:leading-snug tw:text-paper! tw:md:text-[15px]">
            If you already have a fixed date, include it. We prioritize messages
            with clear timelines.
          </p>

          <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-3">
            <div className={detailRow}>
              <span className={detailIcon}>
                <Mail className="tw:size-3.5" aria-hidden="true" />
              </span>
              <div className="tw:flex tw:flex-col">
                <span className={micro + " tw:text-ink-muted"}>Email</span>
                <a
                  href="mailto:support@xilolo.com"
                  className="tw:inline-flex tw:h-11 tw:items-center tw:text-sm tw:font-semibold tw:text-paper-raised! tw:hover:underline!"
                >
                  support@xilolo.com
                </a>
              </div>
            </div>

            <div className={detailRow}>
              <span className={detailIcon}>
                <Phone className="tw:size-3.5" aria-hidden="true" />
              </span>
              <div className="tw:flex tw:flex-col">
                <span className={micro + " tw:text-ink-muted"}>Xilolo line</span>
                <a
                  href="tel:+2348023797265"
                  className="tw:inline-flex tw:h-11 tw:items-center tw:text-sm tw:font-semibold tw:text-paper-raised! tw:hover:underline!"
                >
                  +234 802 379 7265
                </a>
                <span className="tw:text-xs tw:text-ink-muted">Mon – Sat, 10:00 – 17:00 WAT</span>
              </div>
            </div>

            <div className={detailRow}>
              <span className={detailIcon}>
                <MapPin className="tw:size-3.5" aria-hidden="true" />
              </span>
              <div className="tw:flex tw:flex-col">
                <span className={micro + " tw:text-ink-muted"}>Office</span>
                <span className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-paper-raised">
                  16192 Coastal Highway, Lewes
                </span>
                <span className="tw:text-xs tw:leading-relaxed tw:text-ink-muted">
                  Delaware 19958, Sussex County
                  <br />
                  United States
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="tw:flex tw:flex-col tw:gap-2">
          <p className={`tw:m-0! tw:text-muted-strong! ${micro}`}>Already using Xilolo?</p>
          <p className="tw:m-0! tw:text-sm tw:leading-relaxed tw:text-muted-strong!">
            For billing or show-day issues, use the in-app help section. This form
            is best for new projects and collaborations.
          </p>
          <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <Chip icon={MessagesSquare}>In-app help</Chip>
            <Link
              to="/support"
              className="tw:inline-flex tw:h-11 tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:text-accent-deep! tw:hover:underline!"
            >
              Open support
              <ArrowRight className="tw:size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
