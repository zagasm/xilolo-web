import React from "react";

export default function OrganiserSidebarCard() {
  return (
    <div className="tw:rounded-3xl tw:px-4 tw:py-5 tw:md:px-6 tw:md:py-6 tw:text-white tw:bg-linear-to-br tw:from-[#050505] tw:via-[#1d1d1d] tw:to-[#2b2b2b] tw:shadow-[0_18px_45px_rgba(15,23,42,0.5)] tw:relative tw:overflow-hidden">
      <div className="tw:absolute tw:inset-0 tw:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14)_0,transparent_55%)] tw:pointer-events-none" />
      <div className="tw:relative tw:space-y-4">
        <span className="tw:block tw:text-[11px] tw:uppercase tw:text-gray-200 tw:font-medium tw:tracking-[0.16em]">
          Why we verify organisers
        </span>
        <h3 className="tw:text-xl tw:md:text-2xl tw:font-semibold tw:mb-2">
          Build trust with attendees and get paid faster
        </h3>

        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:mt-3">
          <div className="tw:bg-white/5 tw:rounded-2xl tw:px-4 tw:py-3 tw:border tw:border-white/10">
            <span className="tw:block tw:text-xs tw:font-semibold tw:mb-1">
              What you&apos;ll need
            </span>
            <span className="tw:block tw:text-[11px] tw:text-gray-100 tw:leading-relaxed">
              • The country you are streaming from
              <br />• A government-issued ID
              <br />• A Nigerian bank account and BVN if you choose the Nigeria
              BVN flow
            </span>
          </div>
          <div className="tw:bg-white/5 tw:rounded-2xl tw:px-4 tw:py-3 tw:border tw:border-white/10">
            <span className="tw:block tw:text-xs tw:font-semibold tw:mb-1">
              What you get
            </span>
            <span className="tw:block tw:text-[11px] tw:text-gray-100 tw:leading-relaxed">
              • Faster organiser review
              <br />• Better trust with attendees
              <br />• Access to organiser analytics and payout tools
            </span>
          </div>
        </div>

        <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-white/10 tw:flex tw:flex-col tw:gap-1 tw:text-[11px] tw:text-gray-100">
          <span>DIDIT handles document capture for supported countries.</span>
          <span className="tw:opacity-80">
            Need help? Update your profile details first if your name does not
            match your verification documents.
          </span>
        </div>
      </div>
    </div>
  );
}
