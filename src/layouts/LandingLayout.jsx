import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Nav from "../component/landing/Nav";
import SectionFooterCTA from "../component/landing/SectionFooterCTA";

export default function LandingLayout() {
  useEffect(() => {
    document.documentElement.classList.add("xilolo-landing-scrollbar-hidden");
    document.body.classList.add("xilolo-landing-scrollbar-hidden");

    return () => {
      document.documentElement.classList.remove("xilolo-landing-scrollbar-hidden");
      document.body.classList.remove("xilolo-landing-scrollbar-hidden");
    };
  }, []);

  return (
    <>
      <div className="xilolo-landing-scrollbar-hidden tw:min-h-screen tw:max-w-full tw:overflow-x-clip tw:bg-white">

        {/* Top navigation */}
        <Nav />

        {/* Page content */}
        <main className="tw:flex-1 tw:lg:pt-20">
          <Outlet />
        </main>

        {/* Global footer */}
        <SectionFooterCTA />
      </div>
    </>
  );
}
