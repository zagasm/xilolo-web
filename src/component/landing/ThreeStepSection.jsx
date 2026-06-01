import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle, Radio, Ticket, Video } from "lucide-react";

/* CSS-only creator setup visual that replaces the old threesteps.png */
function CreatorSetupMockup({ activeStep }) {
  const stepScreens = [
    /* Step 0 — Registration */
    <div key="reg" className="tw:flex tw:flex-col tw:h-full tw:bg-[#f8f7f6] tw:rounded-2xl tw:overflow-hidden tw:border tw:border-black/8">
      <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:bg-white tw:border-b tw:border-gray-100">
        <img src="/logo.png" alt="Xilolo" className="tw:h-6 tw:w-auto" />
        <span className="tw:text-[11px] tw:text-gray-400">Create account</span>
      </div>
      <div className="tw:flex-1 tw:p-5 tw:flex tw:flex-col tw:gap-4">
        <div>
          <span className="tw:block tw:text-[11px] tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wider tw:mb-1.5">Full name</span>
          <div className="tw:h-9 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:flex tw:items-center">
            <span className="tw:text-[13px] tw:text-gray-700">Adaeze Obi</span>
          </div>
        </div>
        <div>
          <span className="tw:block tw:text-[11px] tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wider tw:mb-1.5">Email</span>
          <div className="tw:h-9 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:flex tw:items-center">
            <span className="tw:text-[13px] tw:text-gray-700">ada@shows.co</span>
          </div>
        </div>
        <div>
          <span className="tw:block tw:text-[11px] tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wider tw:mb-1.5">Password</span>
          <div className="tw:h-9 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:flex tw:items-center tw:gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-gray-400" />
            ))}
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="tw:h-10 tw:rounded-xl tw:bg-[#050505] tw:flex tw:items-center tw:justify-center tw:text-white tw:text-[13px] tw:font-bold tw:cursor-pointer tw:mt-1"
        >
          Create Account →
        </motion.div>
      </div>
    </div>,

    /* Step 1 — Verification */
    <div key="verify" className="tw:flex tw:flex-col tw:h-full tw:bg-[#f8f7f6] tw:rounded-2xl tw:overflow-hidden tw:border tw:border-black/8">
      <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:bg-white tw:border-b tw:border-gray-100">
        <img src="/logo.png" alt="Xilolo" className="tw:h-6 tw:w-auto" />
        <span className="tw:text-[11px] tw:text-gray-400">Verify identity</span>
      </div>
      <div className="tw:flex-1 tw:p-5 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-5">
        <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:rounded-full tw:bg-primary/10">
          <CheckCircle className="tw:w-8 tw:h-8 tw:text-primary" />
          <motion.div
            className="tw:absolute tw:inset-0 tw:rounded-full tw:border-2 tw:border-primary/30"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="tw:text-center">
          <span className="tw:block tw:text-[15px] tw:font-bold tw:text-gray-900">Check your email</span>
          <span className="tw:block tw:text-[12px] tw:text-gray-500 tw:mt-1">We sent a 6-digit code to ada@shows.co</span>
        </div>
        <div className="tw:flex tw:gap-2">
          {[4, 7, 2, 9, 1, 8].map((d, i) => (
            <div key={i} className="tw:w-9 tw:h-11 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:flex tw:items-center tw:justify-center tw:text-[16px] tw:font-black tw:text-gray-800">
              {d}
            </div>
          ))}
        </div>
        <div className="tw:h-10 tw:w-full tw:rounded-xl tw:bg-[#050505] tw:flex tw:items-center tw:justify-center tw:text-white tw:text-[13px] tw:font-bold">
          Verify Code ✓
        </div>
      </div>
    </div>,

    /* Step 2 — Start Streaming */
    <div key="stream" className="tw:flex tw:flex-col tw:h-full tw:bg-[#0d0d0d] tw:rounded-2xl tw:overflow-hidden tw:border tw:border-white/10">
      <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:bg-[#0a0a0a] tw:border-b tw:border-white/[0.06]">
        <div className="tw:flex tw:items-center tw:gap-2">
          <img src="/logo2.png" alt="Xilolo" className="tw:h-5 tw:w-auto tw:opacity-80" />
        </div>
        <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-red-600 tw:px-2.5 tw:py-0.5 tw:text-[10px] tw:font-black tw:text-white">
          <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-white tw:animate-pulse" />
          LIVE
        </span>
      </div>
      <div
        className="tw:relative tw:overflow-hidden tw:bg-gradient-to-br tw:from-[#1a1a1a] tw:via-[#111] tw:to-[#060606]"
        style={{ flex: 1 }}
      >
        <div aria-hidden className="tw:absolute tw:inset-0">
          <div className="tw:absolute tw:top-0 tw:left-1/2 tw:-translate-x-1/2 tw:w-48 tw:h-28 tw:bg-white/[0.05] tw:blur-2xl tw:rounded-full" />
          <div className="tw:absolute tw:bottom-0 tw:inset-x-0 tw:h-1/2 tw:bg-gradient-to-t tw:from-black/60 tw:to-transparent" />
        </div>
        <div className="tw:absolute tw:bottom-3 tw:left-3 tw:flex tw:items-center tw:gap-2">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:bg-black/70 tw:rounded-full tw:px-2.5 tw:py-1">
            <svg className="tw:w-3 tw:h-3 tw:text-white/70" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            <span className="tw:text-[10px] tw:text-white tw:font-semibold">1,204</span>
          </div>
          <div className="tw:bg-black/70 tw:rounded-full tw:px-2 tw:py-1">
            <span className="tw:text-[10px] tw:text-white">❤️ 248</span>
          </div>
        </div>
      </div>
      <div className="tw:px-4 tw:py-3 tw:bg-[#0a0a0a] tw:border-t tw:border-white/[0.05] tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:gap-2">
          <div className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/10">
            <Radio className="tw:w-3.5 tw:h-3.5 tw:text-white/60" />
          </div>
          <div className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/10">
            <Ticket className="tw:w-3.5 tw:h-3.5 tw:text-white/60" />
          </div>
        </div>
        <div className="tw:rounded-full tw:bg-white/10 tw:border tw:border-white/10 tw:px-3 tw:py-1 tw:flex tw:items-center tw:gap-1">
          <span className="tw:text-[9px] tw:text-white/40">$</span>
          <span className="tw:text-[12px] tw:font-black tw:text-white">924</span>
          <span className="tw:text-[9px] tw:text-white/40 tw:ml-0.5">earned</span>
        </div>
      </div>
    </div>,
  ];

  return (
    <motion.div
      key={activeStep}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="tw:w-full tw:h-[340px] tw:md:h-[400px]"
    >
      {stepScreens[activeStep]}
    </motion.div>
  );
}

export default function ThreeStepSection({
  stepDuration = 2.8,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: false });
  const [active, setActive] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const steps = [
    { label: "Registration", icon: CheckCircle, desc: "Create your free account in under a minute." },
    { label: "Verification", icon: CheckCircle, desc: "Confirm your identity and unlock all features." },
    { label: "Start Streaming", icon: Video, desc: "Go live and reach your audience worldwide." },
  ];

  useEffect(() => {
    let timeout;
    if (inView) {
      timeout = scheduleNext(stepDuration);
    } else {
      clearTimeout(timeout);
      setRunKey((k) => k + 1);
    }
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, active]);

  const scheduleNext = (secs) => {
    return setTimeout(() => {
      setActive((idx) => {
        const next = (idx + 1) % steps.length;
        setRunKey((k) => k + 1);
        return next;
      });
    }, secs * 1000);
  };

  useEffect(() => {
    if (inView) setRunKey((k) => k + 1);
  }, [inView]);

  return (
    <section
      ref={ref}
      className="tw:relative tw:md:mt-44 tw:py-14 tw:md:py-24 tw:px-5 tw:mx-auto tw:max-w-7xl"
    >
      {/* Backdrop glows */}
      <div aria-hidden className="tw:pointer-events-none tw:absolute tw:inset-0">
        <div className="tw:absolute tw:left-[-12%] tw:top-6 tw:h-[420px] tw:w-[420px] tw:rounded-full tw:blur-[100px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,17,0.16),transparent_70%)]" />
        <div className="tw:absolute tw:right-[-10%] tw:bottom-0 tw:h-[520px] tw:w-[520px] tw:rounded-full tw:blur-[120px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,17,0.12),transparent_70%)]" />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:lg:flex-row tw:gap-12 tw:items-center">

        {/* LEFT: mockup */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ amount: 0.35, once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="tw:relative tw:w-full tw:lg:max-w-[480px] tw:shrink-0"
        >
          {/* Outer glow ring */}
          <div
            aria-hidden
            className="tw:absolute tw:-inset-3 tw:rounded-3xl tw:blur-2xl tw:pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(5,5,5,0.12), transparent 70%)" }}
          />

          <div className="tw:relative tw:rounded-3xl tw:overflow-hidden tw:ring-1 tw:ring-black/8 tw:shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <AnimatedMockup active={active} steps={steps} />
          </div>
        </motion.div>

        {/* RIGHT: steps */}
        <div className="tw:flex tw:flex-col tw:gap-8 tw:w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="tw:text-[11px] tw:tracking-widest tw:uppercase tw:text-primary tw:font-semibold">Three steps to go live</span>
            <p className="tw:mt-2 tw:text-sm tw:text-gray-500 tw:max-w-sm">
              From signing up to streaming live — it takes minutes, not hours.
            </p>
          </motion.div>

          <div className="tw:space-y-8">
            {steps.map((step, i) => {
              const isActive = active === i;
              return (
                <motion.button
                  key={step.label}
                  type="button"
                  onClick={() => { setActive(i); setRunKey((k) => k + 1); }}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 140, damping: 18, delay: i * 0.07 }}
                  className="tw:text-left tw:w-full"
                >
                  <div className="tw:font-league tw:relative tw:inline-block tw:w-full">
                    <div
                      className={[
                        "tw:font-extrabold tw:leading-tight tw:tracking-tight tw:transition-all tw:duration-300",
                        isActive
                          ? "tw:text-gray-900 tw:text-[32px] tw:md:text-5xl tw:lg:text-6xl"
                          : "tw:text-gray-300 tw:text-3xl tw:md:text-4xl tw:lg:text-5xl tw:hover:text-gray-400",
                      ].join(" ")}
                    >
                      {step.label}
                    </div>

                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="tw:mt-1 tw:text-sm tw:text-gray-500 tw:font-sans tw:font-normal"
                      >
                        {step.desc}
                      </motion.p>
                    )}

                    {/* Progress bar */}
                    <div className="tw:mt-2 tw:h-[3px] tw:w-full tw:bg-gray-200 tw:rounded-full tw:overflow-hidden">
                      <motion.div
                        key={`${i}-${runKey}-${isActive}`}
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: isActive ? 1 : 0 }}
                        transition={{
                          duration: isActive ? stepDuration : 0.2,
                          ease: "easeInOut",
                        }}
                        className="tw:h-full tw:bg-primary"
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Animated mockup wrapper — swaps screens per active step */
function AnimatedMockup({ active }) {
  return (
    <motion.div
      key={active}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className="tw:w-full tw:h-[340px] tw:md:h-[400px]"
    >
      <CreatorSetupMockup activeStep={active} />
    </motion.div>
  );
}
