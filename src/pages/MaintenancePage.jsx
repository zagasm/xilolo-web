import React from "react";

function MaintenancePage() {
  const message =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("xilolo_maintenance_message")
      : "";

  return (
    <main className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:bg-[#f7f2eb] tw:px-6 tw:text-[#111111]">
      <section className="tw:w-full tw:max-w-xl tw:text-center">
        <div className="tw:mx-auto tw:mb-8 tw:grid tw:size-24 tw:place-items-center tw:rounded-full tw:border tw:border-[#111111]/10 tw:bg-white/70 tw:text-4xl tw:font-black">
          XI
        </div>
        <h1 className="tw:text-4xl tw:font-black tw:tracking-normal tw:md:text-5xl">
          Maintenance Mode
        </h1>
        <p className="tw:mx-auto tw:mt-5 tw:max-w-md tw:text-lg tw:font-semibold tw:leading-8 tw:text-[#111111]/70">
          {message || "Xilolo is currently on maintenance please try again later."}
        </p>
      </section>
    </main>
  );
}

export default MaintenancePage;
