// src/page/Home/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import EventTemplate from "../../component/Events/SingleEvent";
import MobileSingleOrganizers from "../../component/Organizers/ForMobile/OrganisersForYou";
import SEO from "../../component/SEO";
import { Link } from "react-router-dom";
import "./Homestyle.css";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [showOrganizers, setShowOrganizers] = useState(false);
  const eventsScrollRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const area = eventsScrollRef.current;
    if (!area) return;

    const onScroll = () => {
      if (area.scrollTop > 10) setShowOrganizers(true);
    };

    area.addEventListener("scroll", onScroll);
    return () => area.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = 0;
    }

    setShowOrganizers(false);
  };

  return (
    <>
      <SEO title="Discover Events - Xilolo" />

      <div className="tw:w-full tw:min-h-screen tw:bg-white tw:pt-24 tw:md:pt-24 tw:px-4 tw:sm:px-6 tw:lg:px-10 tw:xl:px-12 tw:font-sans">
        <div className="tw:mx-auto tw:w-full tw:max-w-[1480px]">
          <div className="home-hero">
            <span className="tw:text-2xl tw:font-semibold tw:text-[#111827]">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good Evening"}, {user?.firstName || user?.username || "there"}!
            </span>
            <span className="tw:block tw:mb-3 tw:md:mb-5 tw:font-bold tw:text-lg tw:md:text-xl tw:text-[#1f2937]">
              Explore events
            </span>
          </div>

          {/* TABS */}
          <div className="tw:flex tw:gap-3 tw:pb-6">
            <button
              style={{ borderRadius: 16 }}
              onClick={() => handleTabChange("all")}
              className={`tw:px-5 tw:md:px-6 tw:py-2 tw:rounded-xl tw:text-[10px] tw:md:text-sm tw:font-medium tw:transition ${activeTab === "all"
                ? "tw:bg-primary tw:text-white tw:shadow-[0_12px_26px_rgba(0,0,0,0.16),0_0_18px_rgba(0,245,255,0.14)]"
                : "tw:bg-[#ffffff] tw:text-gray-500 tw:border tw:border-gray-200 tw:hover:border-neon/40 tw:hover:shadow-[0_0_18px_rgba(0,245,255,0.08)]"
                }`}
            >
              For You
            </button>
            <button
              style={{ borderRadius: 16 }}
              onClick={() => handleTabChange("live")}
              className={`tw:px-5 tw:md:px-6 tw:py-2 tw:rounded-xl tw:text-[10px] tw:md:text-sm tw:font-medium tw:transition ${activeTab === "live"
                ? "tw:bg-primary tw:text-white tw:shadow-[0_12px_26px_rgba(0,0,0,0.16),0_0_18px_rgba(0,245,255,0.14)]"
                : "tw:bg-[#ffffff] tw:text-gray-500 tw:border tw:border-gray-200 tw:hover:border-neon/40 tw:hover:shadow-[0_0_18px_rgba(0,245,255,0.08)]"
                }`}
            >
              Live
            </button>
          </div>
        </div>

        <div className="tw:mx-auto tw:w-full tw:max-w-[1480px]">
          {/* SCROLL AREA */}
          <div
            ref={eventsScrollRef}
            className="tw:-mt-2 tw:h-[calc(100vh-120px)] tw:overflow-y-auto tw-no-scrollbar tw:pr-1 tw:pb-20"
          >
            <EventTemplate
              endpoint={
                activeTab === "live"
                  ? "/api/v1/events/view/live"
                  : "/api/v1/events/all/get"
              }
              live={activeTab === "live"}
              upcoming={false}
              all={activeTab === "all"}
            />

            {showOrganizers && (
              <div className="tw:mt-12">
                <div className="tw:flex tw:justify-between tw:px-2 tw:mb-3">
                  <small className="tw:font-semibold">
                    Organizers you may know
                  </small>
                  <Link to="/organizers" className="tw:text-sm tw:text-black">
                    View all
                  </Link>
                </div>
                <MobileSingleOrganizers />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
