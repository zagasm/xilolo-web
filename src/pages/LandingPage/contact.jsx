import React from "react";
import ContactHero from "../../component/contact/ContactHero";
import ContactFormSection from "../../component/contact/ContactFormSection";
import ContactMetaSection from "../../component/contact/ContactMetaSection";

/**
 * /contact — marketing page inside LandingLayout (Nav + footer come from there).
 *
 * One column on mobile, hero → form+details → "what happens next" on desktop.
 * The single soft radial tint below is the only gradient on the page and the
 * only decorative layer DESIGN.md permits behind a hero; everything else is
 * paper surfaces separated by hairlines. No glow stacks, no drop shadows.
 *
 * `tw:font-sans` on this root is deliberate: the legacy template sheet sets
 * `body{font-family:Inter}` (unlayered, so it beats the layered Tailwind
 * default), and tailwind.css's own `html`/`:root` rules reference the
 * unprefixed `--font-sans`, which Tailwind renamed to `--tw-font-sans` because
 * of the `tw` prefix — so the page would otherwise render in Inter, not the
 * design's Work Sans.
 */
export default function ContactPage() {
  return (
    <div className="tw:relative tw:min-h-screen tw:overflow-x-hidden tw:bg-paper tw:font-sans tw:text-ink">
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[380px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(14,165,180,0.10),rgba(14,165,180,0)_70%)]"
      />

      <div className="tw:relative tw:z-10 tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-4 tw:pb-16 tw:pt-10 tw:md:px-8 tw:md:pb-24 tw:md:pt-16">
        <div className="tw:flex tw:flex-col tw:gap-12 tw:md:gap-16">
          <ContactHero />
          <ContactFormSection />
          <ContactMetaSection />
        </div>
      </div>
    </div>
  );
}
