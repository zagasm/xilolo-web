import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";


export default function ThreeStepSection({
  imageSrc = "/images/threesteps.png",
  imageAlt = "Preview",
  stepDuration = 2.4,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: false });
  const [active, setActive] = useState(0);
  const [runKey, setRunKey] = useState(0); // bumps to retrigger bar anim
  const steps = ["Registration", "Verification", "Start Streaming"];

  // drive the loop only when in view
  useEffect(() => {
    let timeout;
    if (inView) {
      // restart from current active step and keep looping
      timeout = scheduleNext(stepDuration);
    } else {
      // pause + reset progress visually by bumping key
      clearTimeout(timeout);
      setRunKey((k) => k + 1);
    }
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, active]);

  // schedules the next step after the bar finishes
  const scheduleNext = (secs) => {
    return setTimeout(() => {
      setActive((idx) => {
        const next = (idx + 1) % steps.length;
        // when moving to next step, bump key to replay the bar animation
        setRunKey((k) => k + 1);
        return next;
      });
    }, secs * 1000);
  };

  // restart the loop when section becomes visible again
  useEffect(() => {
    if (inView) setRunKey((k) => k + 1);
  }, [inView]);

  return (
    <section
      ref={ref}
      className="tw:relative tw:md:mt-44 tw:py-14 tw:md:py-24 tw:px-5 tw:mx-auto tw:max-w-7xl"
    >
      {/* subtle backdrop glows */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-0"
      >
        <div className="tw:absolute tw:left-[-12%] tw:top-6 tw:h-[420px] tw:w-[420px] tw:rounded-full tw:blur-[100px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,17,0.16),transparent_70%)]" />
        <div className="tw:absolute tw:right-[-10%] tw:bottom-0 tw:h-[520px] tw:w-[520px] tw:rounded-full tw:blur-[120px] tw:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(193,21,181,0.16),transparent_70%)]" />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:lg:flex-row tw:gap-10 tw:items-center">
        {/* LEFT: Image card */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ amount: 0.35, once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="tw:relative tw:rounded-2xl tw:overflow-hidden tw:ring-1 tw:ring-black/5 tw:shadow-lg"
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="tw:block tw:w-full tw:lg:max-w-2xl tw:h-auto tw:aspect-video tw:md:aspect-4/3 tw:object-cover"
            loading="lazy"
          />
        </motion.div>

        {/* RIGHT: Steps + progress */}
        <div className="tw:flex tw:flex-col tw:gap-8">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="tw:text-sm tw:tracking-widest tw:uppercase tw:text-primary"
          >
            Three steps to go live
          </motion.h3>

          <div className="tw:space-y-8">
            {steps.map((label, i) => {
              const isActive = active === i;
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 18,
                    delay: i * 0.06,
                  }}
                >
                  <div className="tw:font-league tw:relative tw:inline-block">
                    <div
                      className={[
                        "tw:font-extrabold tw:leading-tight tw:tracking-tight tw:transition-all tw:duration-300",
                        isActive ? "tw:text-gray-900 tw:text-[32px] tw:md:text-5xl tw:lg:text-6xl" : "tw:text-gray-400 tw:text-3xl tw:md:text-4xl tw:lg:text-5xl",
                      ].join(" ")}
                    >
                      {label}
                    </div>

                    {/* underline track */}
                    <div className="tw:mt-2 tw:h-[3px] tw:w-full tw:bg-gray-200 tw:rounded-full tw:overflow-hidden">
                      {/* animated fill — reset via runKey to replay */}
                      <motion.div
                        key={`${i}-${runKey}-${isActive}`} // ensures re-run on each step change
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

                </motion.div>
              );
            })}
          </div>

          {/* CTA row (optional) */}
          
        </div>
      </div>
    </section>
  );
}
