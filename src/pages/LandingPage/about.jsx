import React from "react";
import AboutHeroSection from "../../component/about/AboutHeroSection";
import AboutPipelineSection from "../../component/about/AboutPipelineSection";
import AboutEcosystemSection from "../../component/about/AboutEcosystemSection";
import AboutFaqSection from "../../component/about/AboutFaqSection";

/**
 * About page — LandingLayout wraps this in `Nav` + `SectionFooterCTA`.
 * Page shell mirrors the sibling content page (/contact) so the two can never
 * drift: one soft radial tint at the top (the maximum backdrop DESIGN.md allows),
 * a 1200px container, and 48/64px section rhythm.
 */
export default function AboutPage() {
  return (
    <div className="tw:relative tw:min-h-screen tw:overflow-x-hidden">
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[420px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,165,180,0.10),rgba(14,165,180,0)_70%)]"
      />

      <div className="tw:relative tw:z-10 tw:px-4 tw:pt-10 tw:pb-20 tw:md:pt-24">
        <div className="tw:mx-auto tw:max-w-6xl tw:space-y-12 tw:md:space-y-16">
          <AboutHeroSection />
          <AboutPipelineSection />
          <AboutEcosystemSection />
          <AboutFaqSection />
        </div>
      </div>
    </div>
  );
}
