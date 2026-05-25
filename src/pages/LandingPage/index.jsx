import React, { useEffect, useState } from "react";
import "./zagasm-landing.css";
import BlurBackdrop from "../../component/landing/BlurBackdrop";
import Hero from "../../component/landing/Hero";
import AutomationSection from "../../component/landing/AutomationSection";
import ThreeStepSection from "../../component/landing/ThreeStepSection";
import LiveHighlightsSection from "../../component/landing/LiveHighlightSection";
import LivePipelineSection from "../../component/landing/LivePipelineSection";
import XiloloAiSection from "../../component/landing/XiloloAiSection";

export default function ZagasmLanding() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="tw:bg-white tw:relative tw:min-h-screen tw:overflow-x-hidden">
      <BlurBackdrop />

      <div className="tw:relative tw:z-10 tw:pt-8 tw:md:pt-52">
        <Hero />

        <AutomationSection
          title="Sell tickets. Stream. Get paid"
          subtitle="Create ticketed events, schedule replays, post highlights, share everywhere, and track results in one place. Less work. More revenue."
          ctaTo="/auth/signup"
          ctaLabel="Start free"
          mediaSrc="/images/z2.png"
          mediaAlt="Ticketing, replays, highlights, and cross-posting automation"
          right
        />

        <LiveHighlightsSection />

        <XiloloAiSection />

        <AutomationSection
          title="Go live once. We handle the setup"
          subtitle="Start your event and we generate your stream details, keep everything organized, and help you go live without the usual confusion."
          ctaTo="/auth/signup"
          ctaLabel="Start free"
          mediaSrc="/images/z1.png"
          mediaAlt="Stream setup made simple on Zagasm"
        />

        <LivePipelineSection />
        <ThreeStepSection />
      </div>

      {showBackToTop && (
        <button
          style={{ borderRadius: "50%" }}
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="tw:fixed tw:bottom-6 tw:right-6 tw:z-50 tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-white tw:shadow-[0_18px_40px_rgba(0,0,0,0.25)] tw:transition tw:hover:scale-105 tw:hover:shadow-[0_22px_55px_rgba(0,0,0,0.3)] tw:focus-visible:tw:outline-none tw:focus-visible:tw:ring-2 tw:focus-visible:tw:ring-primarySecond tw:focus-visible:tw:ring-offset-2 tw:focus-visible:tw:ring-offset-[#faf7ff]"
        >
          <span className="tw:-mt-0.5 tw:text-lg">↑</span>
        </button>
      )}
    </div>
  );
}
