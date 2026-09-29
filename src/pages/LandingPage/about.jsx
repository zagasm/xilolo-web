import React from "react";
import AboutHeroSection from "../../component/about/AboutHeroSection";
import AboutPipelineSection from "../../component/about/AboutPipelineSection";
import AboutEcosystemSection from "../../component/about/AboutEcosystemSection";
import AboutFaqSection from "../../component/about/AboutFaqSection";

export default function AboutPage() {
  return (
    <div className="tw:relative tw:overflow-x-hidden tw:min-h-screen">
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[420px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,165,180,0.10),rgba(14,165,180,0)_70%)]"
      />

      <div className="tw:mx-auto tw:max-w-6xl tw:px-5 tw:py-16 tw:md:py-20 tw:space-y-16 tw:md:space-y-20">
        <AboutHeroSection />
        <AboutPipelineSection />
        <AboutEcosystemSection />
        <AboutFaqSection />
      </div>
    </div>
  );
}
