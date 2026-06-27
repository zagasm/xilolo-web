import React, { useState } from "react";
import { Mail, Phone, ArrowRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showSuccess } from "../ui/toast";

const inputBase =
  "tw:w-full tw:rounded-2xl tw:border tw:border-slate-200/80 tw:bg-white/70 tw:px-3.5 tw:py-2.5 tw:text-sm tw:text-slate-900 tw:outline-none tw:transition-all tw:duration-200 focus:tw:border-primary/40 focus:tw:ring-2 focus:tw:ring-primary/10 placeholder:tw:text-slate-400";

const labelBase =
  "tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500 tw:mb-1.5";

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
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="tw:grid tw:grid-cols-1 tw:gap-5 tw:md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.25fr)]">

        {/* Form card */}
        <motion.div
          className="tw:relative tw:rounded-3xl tw:bg-white tw:border tw:border-slate-200/70 tw:p-5 tw:md:p-7 tw:overflow-hidden"
          style={{ boxShadow: "0 24px 70px rgba(15,23,42,0.08), 0 0 22px rgba(0,245,255,0.05)" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Top glow accent */}
          <div
            aria-hidden
            className="tw:pointer-events-none tw:absolute tw:-top-20 tw:left-1/2 tw:-translate-x-1/2 tw:w-72 tw:h-40 tw:rounded-full tw:blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(5,5,5,0.04), transparent 70%)" }}
          />

          <div className="tw:relative tw:mb-6">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
              <span className="tw:block tw:text-base tw:md:text-lg tw:font-semibold tw:text-slate-900 tw:leading-snug">
                Tell us about your event
              </span>
            </div>
            <span className="tw:block tw:text-[12px] tw:md:text-[13px] tw:text-slate-500">
              A few details help us respond with something useful, not a generic reply.
            </span>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:gap-3"
              >
                <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-primary tw:flex tw:items-center tw:justify-center tw:shadow-[0_0_30px_rgba(5,5,5,0.25)]">
                  <Send className="tw:w-6 tw:h-6 tw:text-white" />
                </div>
                <span className="tw:block tw:text-base tw:font-semibold tw:text-slate-900">Message sent</span>
                <span className="tw:block tw:text-sm tw:text-slate-500 tw:text-center tw:max-w-xs">
                  We will get back to you within 24 hours. Check your inbox.
                </span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="tw:space-y-4"
                onSubmit={handleSubmit}
              >
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
                  <div>
                    <span className={labelBase}>Full name</span>
                    <input type="text" required placeholder="Your name" className={inputBase} />
                  </div>
                  <div>
                    <span className={labelBase}>Email</span>
                    <input type="email" required placeholder="you@brand.com" className={inputBase} />
                  </div>
                </div>

                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
                  <div>
                    <span className={labelBase}>You are</span>
                    <select className={inputBase} defaultValue="" required>
                      <option value="" disabled>Choose one</option>
                      <option value="creator">Creator / Host</option>
                      <option value="agency">Agency</option>
                      <option value="brand">Brand / Organisation</option>
                      <option value="event">Event organiser</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <span className={labelBase}>How often do you host?</span>
                    <select className={inputBase} defaultValue="" required>
                      <option value="" disabled>Select one</option>
                      <option value="once">One-off / occasional</option>
                      <option value="monthly">1 to 3 times per month</option>
                      <option value="weekly">Weekly</option>
                      <option value="often">Multiple times per week</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className={labelBase}>What do you want to host?</span>
                  <textarea
                    rows={4}
                    required
                    placeholder="Concert, talk show, church service, comedy night, community hangout, training, panel…"
                    className={`${inputBase} tw:resize-none`}
                  />
                </div>

                <div>
                  <span className={labelBase}>When is your next event?</span>
                  <textarea
                    rows={2}
                    placeholder="Date, time, and any deadlines you are working with"
                    className={`${inputBase} tw:resize-none`}
                  />
                </div>

                <div className="tw:flex tw:flex-col tw:items-start tw:gap-2 tw:pt-3 tw:border-t tw:border-slate-100">
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-6 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:disabled:opacity-60 tw:disabled:cursor-not-allowed"
                    style={{ boxShadow: "0 16px 48px rgba(5,5,5,0.3), 0 0 18px rgba(0,245,255,0.10)" }}
                    whileHover={{ scale: submitting ? 1 : 1.02, y: submitting ? 0 : -1 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                  >
                    <span>{submitting ? "Sending…" : "Send message"}</span>
                    <motion.span
                      animate={submitting ? { rotate: 360 } : { rotate: 0 }}
                      transition={submitting ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                    >
                      <ArrowRight className="tw:w-4 tw:h-4" />
                    </motion.span>
                  </motion.button>

                  <span className="tw:block tw:text-[11px] tw:text-slate-400">
                    We only use your details to reply to this message.
                  </span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right column */}
        <motion.div
          className="tw:space-y-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        >
          {/* Dark info card */}
          <div
            className="tw:relative tw:rounded-3xl tw:overflow-hidden tw:p-5 tw:md:p-6 tw:text-white"
            style={{
              background: "#050505",
              boxShadow: "0 28px 70px rgba(5,5,5,0.5), 0 0 28px rgba(0,245,255,0.10)",
            }}
          >
            <div
              aria-hidden
              className="tw:absolute tw:-right-12 tw:-top-12 tw:w-48 tw:h-48 tw:rounded-full tw:blur-3xl tw:pointer-events-none"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <div
              aria-hidden
              className="tw:absolute tw:-left-8 tw:bottom-0 tw:w-40 tw:h-40 tw:rounded-full tw:blur-3xl tw:pointer-events-none"
              style={{ background: "rgba(0,245,255,0.05)" }}
            />

            <div className="tw:relative">
              <span className="tw:block tw:text-[10px] tw:uppercase tw:tracking-[0.2em] tw:text-white/50 tw:mb-3 tw:font-semibold">
                Xilolo contact
              </span>
              <span className="tw:block tw:text-sm tw:md:text-[15px] tw:font-medium tw:text-white/90 tw:leading-snug tw:mb-5">
                If you already have a fixed date, include it. We prioritize messages with clear timelines.
              </span>

              <div className="tw:space-y-3">
                <div
                  className="tw:flex tw:items-start tw:gap-3 tw:rounded-2xl tw:p-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Mail className="tw:w-3.5 tw:h-3.5 tw:text-white/60" />
                  </div>
                  <div>
                    <span className="tw:block tw:text-[10px] tw:text-white/45 tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:mb-0.5">Email</span>
                    <span className="tw:block tw:text-[13px] tw:text-white tw:font-semibold">support@xilolo.com</span>
                  </div>
                </div>

                <div
                  className="tw:flex tw:items-start tw:gap-3 tw:rounded-2xl tw:p-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Phone className="tw:w-3.5 tw:h-3.5 tw:text-white/60" />
                  </div>
                  <div>
                    <span className="tw:block tw:text-[10px] tw:text-white/45 tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:mb-0.5">Xilolo line</span>
                    <span className="tw:block tw:text-[13px] tw:text-white tw:font-semibold">+234 (0) 802 379 7265</span>
                    <span className="tw:block tw:text-[11px] tw:text-white/45 tw:mt-0.5">Mon – Sat, 10:00 – 17:00 WAT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small note card */}
          <div
            className="tw:rounded-3xl tw:bg-white tw:border tw:border-slate-200/70 tw:p-4 tw:text-[12px] tw:text-slate-600"
            style={{ boxShadow: "0 16px 40px rgba(15,23,42,0.05)" }}
          >
            <span className="tw:block tw:text-[10px] tw:uppercase tw:tracking-[0.18em] tw:text-slate-400 tw:mb-1.5 tw:font-semibold">
              Already using Xilolo?
            </span>
            <span className="tw:block tw:leading-relaxed">
              For billing or show-day issues, use the in-app help section. This form is best for new projects and collaborations.
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
