import React from "react";
import ContactHero from "../../component/contact/ContactHero";
import ContactFormSection from "../../component/contact/ContactFormSection";
import ContactMetaSection from "../../component/contact/ContactMetaSection";

export default function ContactPage() {
  return (
    <div className="tw:relative tw:min-h-screen tw:overflow-x-hidden">
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[420px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,165,180,0.10),rgba(14,165,180,0)_70%)]"
      />

      <div className="tw:relative tw:z-10 tw:pt-10 tw:md:pt-24 tw:pb-20 tw:px-4">
        <div className="tw:mx-auto tw:max-w-6xl tw:space-y-14 tw:md:space-y-16">
          <ContactHero />
          <ContactFormSection />
          <ContactMetaSection />
        </div>
      </div>
    </div>
  );
}
