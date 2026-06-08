import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Edit } from "react-feather";
import { useAuth } from "../../auth/AuthContext";
import "./eventTypeStyling.css";

function EventType() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, organiser, token } = useAuth();
  const navigate = useNavigate();
  const organiserProfile =
    organiser || user?.organiser || user?.organizer || null;
  const isOrganiser =
    user?.is_organiser_verified ||
    user?.roles?.includes("organiser") ||
    user?.roles?.includes("organizer") ||
    organiserProfile?.is_organiser_verified ||
    organiserProfile?.roles?.includes?.("organiser") ||
    organiserProfile?.roles?.includes?.("organizer");

  // console.log("Is Organiser:", user);

  const kycStatus = user?.kyc?.status || organiserProfile?.kyc?.status || null;
  const isKycVerified = kycStatus === "verified";

  const shouldShowBecomeOrganiser = !isOrganiser && !isKycVerified;

  useEffect(() => {
    if (shouldShowBecomeOrganiser) {
      setLoading(false);
      return;
    }

    const fetchEventTypes = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/event/type/view`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const uniqueEvents = Array.from(
          new Set(response.data.events.map((e) => e.name))
        ).map((name) => response.data.events.find((e) => e.name === name));

        setEventTypes(uniqueEvents);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load event types");
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, [token, shouldShowBecomeOrganiser]);

  if (loading) {
    return (
      <div className="tw:font-sans tw:w-full tw:min-h-screen tw:bg-white tw:py-24 tw:md:pt-28 tw:px-4 tw:lg:px-4">
        <div className="tw:max-w-7xl tw:mx-auto">
          <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-6">
            <div className="tw:h-8 tw:w-52 tw:rounded-xl tw:bg-gray-200 tw:animate-pulse" />
            <div className="tw:h-4 tw:w-72 tw:rounded-xl tw:bg-gray-200 tw:animate-pulse" />
            <div className="tw:h-3 tw:w-96 tw:max-w-full tw:rounded-xl tw:bg-gray-200 tw:animate-pulse" />
          </div>

          <div className="tw:mt-6 tw:grid! tw:grid-cols-1 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:gap-4 tw:pb-10">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:border tw:border-[#f0f0f3] tw:animate-pulse"
                style={{ borderRadius: 16 }}
              >
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
                    <div className="tw:h-10 tw:w-10 tw:rounded-full tw:bg-lightPurple" />
                    <div className="tw:flex-1">
                      <div className="tw:h-4 tw:w-24 tw:rounded-full tw:bg-gray-200" />
                      <div className="tw:mt-2 tw:h-3 tw:w-full tw:max-w-[150px] tw:rounded-full tw:bg-gray-100" />
                    </div>
                  </div>
                  <div className="tw:h-8 tw:w-8 tw:rounded-full tw:bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw:w-full tw:min-h-screen tw:flex tw:items-center tw:justify-center">
        <span className="tw:block tw:text-red-500">Error: {error}</span>
      </div>
    );
  }

  // 1) NOT organiser + KYC not verified → "Become an Organizer"
  if (shouldShowBecomeOrganiser) {
    return (
      <div className="tw:w-full tw:min-h-screen tw:pt-20 tw:md:pt-24 tw:px-4 tw:lg:px-4">
        <div className="tw:relative tw:bg-[#ffffff] tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-10 tw:rounded-3xl tw:px-4 tw:py-3">
          <button
            type="button"
            onClick={() => navigate("/profile/edit-profile")}
            aria-label="Edit profile"
            className="tw:absolute tw:right-4 tw:top-4 tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-slate-700 tw:shadow-md tw:hover:bg-slate-50 tw:transition"
          >
            <Edit size={18} />
          </button>
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center">
            <div className="tw:size-[114px] tw:rounded-full tw:overflow-hidden">
              <img
                src={user?.profileUrl || "/images/avater_pix.avif"}
                alt=""
                className="tw:w-full tw:h-full tw:object-cover"
              />
            </div>
            <div className="tw:mt-1 tw:text-center">
              <span className="tw:block tw:font-semibold tw:text-[16px]">
                {user?.name}
              </span>
              <span className="tw:block tw:text-xs">{user?.email}</span>
            </div>
            <div className="tw:bg-[#f5f5f5] tw:relative tw:px-4 tw:py-3 tw:rounded-2xl tw:mt-6 tw:w-full">
              <div>
                <span className="tw:block tw:text-xs">Following</span>
                <span className="tw:block tw:font-semibold tw:text-[20px]">
                  {user?.followings_count ?? 0}
                </span>
              </div>
              <img
                className="tw:size-3 tw:absolute tw:top-4 tw:right-4"
                src="/images/arrowrightbend.png"
                alt=""
              />
            </div>
          </div>
        </div>
        {
          user?.about && (
            <div className="tw:bg-[#ffffff] tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-2 tw:rounded-2xl tw:px-4 tw:py-3">
              <span className="tw:block tw:font-semibold">About Me</span>
              <span className="tw:block tw:text-xs">{user?.about}</span>
            </div>
          )
        }


        <div className="tw:bg-linear-to-r tw:from-[#050505] tw:via-[#1d1d1d] tw:to-[#2b2b2b] tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-4 tw:rounded-2xl tw:px-4 tw:py-4 tw:text-center tw:text-white">
          <span className="tw:block tw:font-semibold tw:uppercase tw:text-xl">
            Do you have an event?
          </span>
          <span className="tw:block tw:text-xs">
            You can be an organizer and drive more audience to your event.
            People all over the world can’t wait to attend!!
          </span>

          <Link
            to="/become-an-organiser"
            className="tw:p-3 tw:block tw:bg-white tw:text-black tw:mt-5 tw:rounded-lg tw:text-center"
          >
            <span className="tw:block tw:font-semibold">
              Become an Organizer
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // 2) Organiser role exists locally but KYC is not verified → send them back to setup.
  if (isOrganiser && !isKycVerified) {
    return (
      <div className="tw:min-h-screen tw:bg-white tw:flex tw:items-center tw:justify-center tw:px-4 tw:py-10">
        <div className="tw:w-full tw:max-w-xl tw:bg-white tw:rounded-3xl tw:p-6 tw:md:p-8 tw:shadow-[0_18px_60px_rgba(15,23,42,0.18)] tw:space-y-6">
          <div className="tw:flex tw:items-center tw:flex-col tw:gap-4">
            <div className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/5">
              <Edit size={22} className="tw:text-primary" />
            </div>

            <div className="tw:flex-1 tw:text-center">
              <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-emerald-50 tw:px-3 tw:py-1">
                <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-500" />
                <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.16em] tw:uppercase tw:text-emerald-700">
                  Setup required
                </span>
              </div>

              <span className="tw:block tw:mt-3 tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                Complete organiser verification
              </span>

              <p className="tw:mt-2 tw:text-sm tw:text-slate-600">
                Organiser access is activated instantly after a successful
                verification. Finish setup to start creating events.
              </p>
            </div>
          </div>

          <div className="tw:rounded-2xl tw:bg-slate-50 tw:px-4 tw:py-4 tw:space-y-3">
            <ul className="tw:mt-1 tw:space-y-1.5 tw:text-[12px] tw:text-slate-600">
              <li className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-primary" />
                Choose BVN or identity verification.
              </li>
              <li className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-400" />
                Submit successfully and organiser tools unlock immediately.
              </li>
              <li className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-400" />
                Then you can create events as usual.
              </li>
            </ul>
          </div>

          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:justify-between tw:gap-4">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <button
                style={{
                  borderRadius: 12,
                }}
                type="button"
                className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:text-white tw:hover:shadow-md tw:transition"
                onClick={() => navigate("/become-an-organiser")}
              >
                Complete setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3) Organiser + KYC verified → modern card grid for event types
  return (
    <div className="tw:font-sans tw:w-full tw:min-h-screen tw:bg-white tw:py-24 tw:md:pt-28 tw:px-2 tw:lg:px-4">
      <div className="tw:max-w-7xl tw:mx-auto">
        <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-6">
          <span className="tw:block tw:text-2xl tw:md:text-3xl tw:font-semibold">
            Select Event Type
          </span>
          <span className="tw:block tw:font-medium">
            What type of events are you creating?
          </span>
        </div>

        {eventTypes.length === 0 ? (
          <div className="tw:w-full tw:mt-10 tw:flex tw:items-center tw:justify-center">
            <div className="tw:bg-white tw:rounded-2xl tw:px-6 tw:py-8 tw:max-w-md tw:text-center tw:shadow-sm">
              <span className="tw:text-sm tw:font-semibold tw:mb-2">
                No event types available yet
              </span>
              <span className="tw:text-xs tw:text-gray-600">
                Please check back later or contact support if you think this is
                a mistake.
              </span>
            </div>
          </div>
        ) : (
          <div className="tw:grid! tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:gap-2 tw:pb-10">
            {eventTypes.map((event) => (
              <button
                style={{
                  borderRadius: 16,
                }}
                key={event.id}
                type="button"
                onClick={() => navigate(`/event/create-event/${event.id}`)}
                className="tw:group tw:relative tw:w-full tw:rounded-2xl tw:bg-[#ffffff] tw:p-4 tw:text-left tw:shadow-sm tw:border tw:border-[#f0f0f3] tw:hover:border-primary tw:hover:shadow-md tw:transition tw:duration-200 tw:flex tw:flex-col tw:gap-3 tw:text-primary"
              >
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-left tw:md:items-center tw:gap-3">
                    <div className="tw:flex tw:size-6 tw:md:size-10 tw:items-center tw:justify-center tw:rounded-full tw:text-primary tw:text-sm tw:font-semibold">
                      {/* {event.name?.[0]?.toUpperCase()} */}
                      <img src={event.icon_url} alt="" />
                    </div>
                    <div>
                      <span className="tw:text-xs tw:font-semibold">
                        {event.name}
                      </span>
                      <span className="tw:hidden tw:md:block tw:text-[11px] tw:text-gray-500 tw:mt-0.5">
                        Click to create a {event.name?.toLowerCase()} event.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tw:hidden tw:md:flex tw:items-center tw:justify-between tw:mt-2">
                  <span className="tw:text-[10px] tw:text-gray-400">
                    Tap to continue
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventType;
