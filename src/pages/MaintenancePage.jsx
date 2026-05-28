import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function MaintenancePage() {
  const navigate = useNavigate();
  const message =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("xilolo_maintenance_message")
      : "";
  const redirectedAt = useMemo(
    () =>
      typeof window !== "undefined"
        ? Number(window.sessionStorage.getItem("xilolo_maintenance_redirected_at") || 0)
        : 0,
    []
  );
  const wasRedirectedRecently = redirectedAt && Date.now() - redirectedAt < 10 * 60 * 1000;

  useEffect(() => {
    if (!wasRedirectedRecently) {
      navigate("/", { replace: true });
    }
  }, [navigate, wasRedirectedRecently]);

  if (!wasRedirectedRecently) return null;

  return (
    <main className="tw:min-h-screen tw:bg-[#0d0f14] tw:px-6 tw:py-10 tw:text-white">
      <section className="tw:mx-auto tw:flex tw:min-h-[calc(100vh-5rem)] tw:w-full tw:max-w-5xl tw:items-center">
        <div className="tw:grid tw:w-full tw:gap-8 tw:lg:grid-cols-[1fr_360px] tw:lg:items-center">
          <div>
            <div className="tw:mb-8 tw:inline-grid tw:size-16 tw:place-items-center tw:rounded-2xl tw:bg-white tw:text-2xl tw:font-black tw:text-[#050505]">
              XI
            </div>
            <p className="tw:text-sm tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-[#9bd2ff]">
              Scheduled maintenance
            </p>
            <h1 className="tw:mt-4 tw:max-w-3xl tw:text-4xl tw:font-black tw:leading-tight tw:md:text-6xl">
              Xilolo is getting a quick tune-up.
            </h1>
            <p className="tw:mt-6 tw:max-w-2xl tw:text-base tw:font-medium tw:leading-8 tw:text-white/70 tw:md:text-lg">
              {message || "Xilolo is currently on maintenance. Please try again later."}
            </p>
          </div>

          <div className="tw:rounded-[28px] tw:border tw:border-white/10 tw:bg-white/[0.06] tw:p-6 tw:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="tw:grid tw:gap-4">
              {["Securing active sessions", "Refreshing event services", "Checking ticket access"].map((item) => (
                <div key={item} className="tw:flex tw:items-center tw:gap-3 tw:rounded-2xl tw:bg-white/[0.07] tw:p-4">
                  <span className="tw:size-3 tw:rounded-full tw:bg-[#9bd2ff]" />
                  <span className="tw:text-sm tw:font-semibold tw:text-white/85">{item}</span>
                </div>
              ))}
            </div>
            <div className="tw:mt-6 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-white/10">
              <div className="tw:h-full tw:w-2/3 tw:rounded-full tw:bg-[#9bd2ff]" />
            </div>
            <p className="tw:mt-4 tw:text-sm tw:leading-6 tw:text-white/55">
              Access will resume automatically when maintenance mode is turned off.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default MaintenancePage;
