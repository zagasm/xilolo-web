import React, { useEffect, useState } from "react";
import "./zagasm-landing.css";
import HeroV2 from "../../component/landing/HeroV2";
import AutomationSection from "../../component/landing/AutomationSection";
import ThreeStepSection from "../../component/landing/ThreeStepSection";
import LiveHighlightsSection from "../../component/landing/LiveHighlightSection";
import LivePipelineSection from "../../component/landing/LivePipelineSection";
import XiloloAiSection from "../../component/landing/XiloloAiSection";

/**
 * Landing page.
 *
 * Revamp notes (see DESIGN.md + docs/design-revamp-plan.md):
 *   - Hero replaced with HeroV2: single focal mockup, one accent, no orbiting chips.
 *   - BlurBackdrop (multi-layer glow) replaced by ONE soft radial tint. Depth in
 *     this design system comes from surface colour + hairlines, not glow stacks.
 *   - The old `tw:bg-white` (which used to mean #e5e4e2) now resolves to the
 *     token paper surface, so the page sits on #F3F2F0 with white cards on top.
 */
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
    <div className="tw:relative tw:min-h-screen tw:overflow-x-hidden tw:bg-paper">
      {/* One soft accent tint — the only decorative layer on the page. */}
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[520px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,165,180,0.10),rgba(14,165,180,0)_70%)]"
      />

      <div className="tw:relative tw:z-10 tw:pt-6 tw:md:pt-28">
        <HeroV2 />

        <XiloloAiSection />

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

        <AutomationSection
          title="Go live once. We handle the setup"
          subtitle="Start your event and we generate your stream details, keep everything organized, and help you go live without the usual confusion."
          ctaTo="/auth/signup"
          ctaLabel="Start free"
          mediaSrc="/images/z1.png"
          mediaAlt="Stream setup made simple on Xilolo"
        />

        <LivePipelineSection />
        <ThreeStepSection />
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="tw:fixed tw:bottom-6 tw:right-6 tw:z-50 tw:flex tw:size-11 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-ink tw:transition-colors tw:hover:bg-accent tw:hover:text-ink tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent tw:focus-visible:ring-offset-2"
        >
          <span className="tw:-mt-px tw:text-lg" aria-hidden="true">
            ↑
          </span>
        </button>
      )}
    </div>
  );
}
