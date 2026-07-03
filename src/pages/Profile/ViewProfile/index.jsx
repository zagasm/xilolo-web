import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import useProfile from "../../../hooks/useProfile";
import ProfileHeader from "../../../component/Profile/ProfileHeader";
import AboutPanel from "../../../component/Profile/AboutPanel";
import ProfileTabs from "../../../component/Profile/ProfileTab";
import "./profile.css";
import { ChevronLeft } from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import { api, authHeaders } from "../../../lib/apiClient";
import { showError, showSuccess } from "../../../component/ui/toast";
import { Edit } from "react-feather";
import {
  getOrganiserProfileShare,
  getUserProfileShare,
} from "../../../api/profileShareApi";

const pickIsFollowing = (data) => {
  if (!data) return false;
  if (typeof data.isFollowing === "boolean") return data.isFollowing;
  if (typeof data.is_following === "boolean") return data.is_following;
  if (typeof data.following === "boolean") return data.following;
  if (typeof data.is_following_organizer === "boolean") {
    return data.is_following_organizer;
  }
  return false;
};

const normalizeViewedOrganiserProfile = (response) => {
  const payload = response?.data?.data ?? null;
  const organiserData =
    payload?.organiser ??
    response?.data?.data ??
    response?.data?.user ??
    response?.data ??
    null;
  const eventsBuckets = payload?.events ?? null;

  if (!organiserData) return null;

  return {
    ...organiserData,
    events: eventsBuckets || organiserData?.events || null,
    allEvents:
      eventsBuckets?.all ??
      organiserData?.allEvents ??
      organiserData?.events?.all ??
      [],
    upcomingEvents:
      eventsBuckets?.upcoming ??
      organiserData?.upcomingEvents ??
      organiserData?.events?.upcoming ??
      [],
  };
};

const normalizeSharedUserProfile = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  return {
    ...payload,
    allEvents: payload?.allEvents ?? payload?.events?.all ?? [],
    upcomingEvents: payload?.upcomingEvents ?? payload?.events?.upcoming ?? [],
  };
};

const ProfileSkeleton = () => (
  <div className="tw:animate-pulse tw:flex tw:flex-col tw:lg:flex-row tw:gap-6 tw:h-full">
    <div className="tw:w-full tw:lg:w-[35%] tw:space-y-4">
      <div className="tw:bg-white tw:rounded-3xl tw:p-6 tw:border tw:border-gray-100 tw:space-y-4 tw:shadow-sm">
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-3">
          <div className="tw:h-24 tw:w-24 tw:rounded-full tw:bg-gray-200" />
          <div className="tw:h-6 tw:w-1/2 tw:rounded-full tw:bg-gray-200" />
          <div className="tw:h-4 tw:w-1/3 tw:rounded-full tw:bg-gray-200" />
          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
            <span className="tw:h-4 tw:w-20 tw:rounded-full tw:bg-gray-100" />
            <span className="tw:h-4 tw:w-24 tw:rounded-full tw:bg-gray-100" />
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="tw:space-y-2">
              <div className="tw:h-3 tw:w-24 tw:rounded-full tw:bg-gray-100" />
              <div className="tw:h-4 tw:w-full tw:rounded-full tw:bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="tw:bg-white tw:rounded-3xl tw:p-5 tw:border tw:border-gray-100 tw:shadow-sm">
        <div className="tw:h-5 tw:w-40 tw:rounded-full tw:bg-gray-100" />
        <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mt-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="tw:space-y-2">
              <div className="tw:h-3 tw:w-24 tw:rounded-full tw:bg-gray-100" />
              <div className="tw:h-4 tw:w-full tw:rounded-full tw:bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="tw:flex-1 tw:space-y-4">
      <div className="tw:bg-white tw:rounded-3xl tw:p-5 tw:border tw:border-gray-100 tw:shadow-sm tw:space-y-4">
        <div className="tw:flex tw:gap-3">
          {["tab-1", "tab-2", "tab-3"].map((tab) => (
            <span
              key={tab}
              className="tw:h-10 tw:w-24 tw:rounded-full tw:bg-gray-100"
            />
          ))}
        </div>
        <div className="tw:h-52 tw:rounded-2xl tw:bg-gray-100" />
      </div>
      <div className="tw:bg-white tw:rounded-3xl tw:p-5 tw:border tw:border-gray-100 tw:shadow-sm">
        <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:md:grid-cols-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="tw:h-52 tw:rounded-2xl tw:bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function ViewProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profileId: routeUserId } = useParams();

  // logged-in user (you)
  const { user: me, token, organiser } = useAuth() || {};

  // existing hook for "my profile"
  const {
    user: myProfile,
    organiser: myOrganiser,
    loading: myProfileLoading,
    error: myProfileError,
  } = useProfile();

  // follow state (only meaningful when viewing another organiser)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // are we viewing our own profile or another user's?
  const isOwnProfile =
    !routeUserId || (me?.id && routeUserId && routeUserId === me.id);
  const sharedProfileData = location.state?.sharedProfileData || null;
  const sharedProfileType = location.state?.sharedProfileType || null;
  const hydratedSharedProfile = useMemo(() => {
    if (isOwnProfile || !sharedProfileData) return null;
    return normalizeSharedUserProfile(sharedProfileData);
  }, [isOwnProfile, sharedProfileData]);

  const mergedOwnProfile = useMemo(() => {
    if (!isOwnProfile) return null;
    if (!myProfile && !myOrganiser) return null;

    return {
      ...(myProfile || {}),
      organiser: myOrganiser || myProfile?.organiser || null,
    };
  }, [isOwnProfile, myProfile, myOrganiser]);

  const viewedOrganiserProfileQuery = useQuery({
    queryKey: ["profile", "organiser", routeUserId, token ?? "guest"],
    enabled:
      !isOwnProfile &&
      !!routeUserId &&
      !!token &&
      sharedProfileType !== "user" &&
      !hydratedSharedProfile,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/organiser/${routeUserId}`,
        authHeaders(token)
      );

      return normalizeViewedOrganiserProfile(res);
    },
  });

  const finalProfileUser = isOwnProfile
    ? mergedOwnProfile
    : hydratedSharedProfile ?? viewedOrganiserProfileQuery.data ?? null;

  useEffect(() => {
    if (isOwnProfile) return;
    setIsFollowing(pickIsFollowing(finalProfileUser));
  }, [finalProfileUser, isOwnProfile]);

  const isLoading = isOwnProfile
    ? myProfileLoading && !mergedOwnProfile && !myProfileError
    : !hydratedSharedProfile && viewedOrganiserProfileQuery.isLoading;
  const profileError = isOwnProfile
    ? myProfileError
    : viewedOrganiserProfileQuery.error?.message || null;

  /* ------------------ organiser / KYC logic (only for own profile) ------------------ */
  const isOrganiser =
    isOwnProfile &&
    (finalProfileUser?.is_organiser_verified ||
      finalProfileUser?.roles?.includes("organiser") ||
      finalProfileUser?.roles?.includes("organizer") ||
      finalProfileUser?.organiser?.is_organiser_verified || // optional
      finalProfileUser?.organiser?.roles?.includes?.("organiser")); // optional
  const isSharedOrganiserProfile =
    sharedProfileType === "organiser" ||
    !!finalProfileUser?.organiser ||
    (!!finalProfileUser?.userId && (!!finalProfileUser?.events || !!finalProfileUser?.allEvents));
  const shareTargetId = isSharedOrganiserProfile
    ? finalProfileUser?.organiser?.id ||
      finalProfileUser?.organiser?.user_id ||
      finalProfileUser?.userId ||
      finalProfileUser?.id
    : finalProfileUser?.id || finalProfileUser?.user_id || finalProfileUser?.userId;
  const profileHeading = isOwnProfile
    ? "Profile"
    : isSharedOrganiserProfile
      ? "Organizer Profile"
      : "Profile";

  const kycStatus = isOwnProfile ? finalProfileUser?.kyc?.status || null : null;
  const isKycVerified = kycStatus === "verified";

  const shouldShowBecomeOrganiser =
    isOwnProfile && !isOrganiser && !isKycVerified;

  /* ------------------ follow / unfollow organiser ------------------ */
  const handleToggleFollow = async () => {
    if (isOwnProfile) return;
    if (!finalProfileUser?.id) return;

    if (!token) {
      showError("Please log in to follow organizers.");
      navigate("/login");
      return;
    }

    try {
      setFollowLoading(true);

      // endpoint: /api/v1/follow/{organizerId}
      const res = await api.post(
        `/api/v1/follow/${finalProfileUser.userId}`,
        null,
        authHeaders(token)
      );

      const pickFollowFromToggle = (r) => {
        if (typeof r?.data?.following === "boolean") return r.data.following;
        if (typeof r?.following === "boolean") return r.following;
        if (typeof r?.data?.is_following === "boolean")
          return r.data.is_following;
        if (typeof r?.is_following === "boolean") return r.is_following;
        if (typeof r?.data?.isFollowing === "boolean")
          return r.data.isFollowing;
        if (typeof r?.isFollowing === "boolean") return r.isFollowing;
        return null;
      };

      const next = pickFollowFromToggle(res?.data);
      const isNowFollowing = typeof next === "boolean" ? next : !isFollowing;

      setIsFollowing(isNowFollowing);

      queryClient.setQueryData(
        ["profile", "organiser", routeUserId, token ?? "guest"],
        (current) =>
          current
            ? {
              ...current,
              isFollowing: isNowFollowing,
              following: isNowFollowing,
            }
            : current
      );

      if (isNowFollowing) {
        showSuccess("You’re now following this organizer.");
      } else {
        showSuccess("You’ve unfollowed this organizer.");
      }
    } catch (e) {
      console.error(e);
      showError("Unable to update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!token || !shareTargetId) {
      showError("Unable to prepare this profile share right now.");
      return;
    }

    setShareLoading(true);

    try {
      const payload = isSharedOrganiserProfile
        ? await getOrganiserProfileShare(shareTargetId, token)
        : await getUserProfileShare(shareTargetId, token);

      const share = payload?.share || {};
      if (!share?.url) {
        throw new Error("Share URL is missing.");
      }

      if (navigator.share) {
        await navigator.share({
          title: share.title,
          text: share.text,
          url: share.url,
        });
        return;
      }

      await navigator.clipboard.writeText(share.url);
      showSuccess("Profile link copied.");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      showError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to share this profile right now."
      );
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div
      data-bounce-page="profile"
      className="tw:font-sans tw:bg-white tw:min-h-screen tw:py-4 tw:lg:h-[calc(100vh-80px)] tw:lg:overflow-hidden"
    >
      {/* top bar */}
      <div className="tw:bg-white tw:w-full tw:pt-20 tw:lg:pt-24 tw:pb-4 tw:border-b tw:border-gray-100">
        <div className="tw:max-w-2xl tw:flex tw:items-center tw:px-4">
          <button
            style={{ borderRadius: 20 }}
            type="button"
            className="tw:inline-flex tw:items-center tw:justify-center tw:size-10 tw:bg-white tw:border tw:border-gray-200 tw:hover:bg-gray-50 tw:transition"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="tw:w-5 tw:h-5 tw:text-gray-700" />
          </button>
          <span className="tw:text-lg tw:md:text-xl tw:font-semibold tw:text-gray-900">
            {profileHeading}
          </span>
          <div className="tw:size-10" />
        </div>
      </div>

      {/* content */}
      <div className="tw:mt-4 tw:px-2 tw:md:px-6 tw:h-auto tw:lg:h-[calc(100vh-140px)]">
        {isLoading ? (
          <ProfileSkeleton />
        ) : profileError ? (
          <p className="tw:text-red-600 tw:mt-10">
            Failed to load profile: {profileError}
          </p>
        ) : !finalProfileUser ? (
          <p className="tw:text-gray-600 tw:mt-10">No profile data found.</p>
        ) : isOwnProfile && shouldShowBecomeOrganiser ? (
          // 1) Your own profile + NOT organiser + KYC not verified → "Become an Organiser"
          <div className="tw:w-full tw:min-h-screen tw:bg-[#F5F5F7] tw:px-4 tw:pt-5 tw:lg:px-4">
            <div className="tw:relative tw:bg-white tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-10 tw:rounded-3xl tw:px-4 tw:py-3">
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
                    src={
                      finalProfileUser?.profileUrl || "/images/avater_pix.avif"
                    }
                    alt=""
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                </div>
                <div className="tw:mt-1 tw:text-center">
                  <span className="tw:block tw:font-semibold tw:text-[16px]">
                    {finalProfileUser?.name}
                  </span>
                  <span className="tw:block tw:text-xs">
                    {finalProfileUser?.email}
                  </span>
                </div>
                <div className="tw:bg-[#f5f5f5] tw:relative tw:px-4 tw:py-3 tw:rounded-2xl tw:mt-6 tw:w-full">
                  <div>
                    <span className="tw:block tw:text-xs">Following</span>
                    <span className="tw:block tw:font-semibold tw:text-[20px]">
                      {finalProfileUser?.followings_count ?? 0}
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

            <div className="tw:bg-white tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-2 tw:rounded-2xl tw:px-4 tw:py-3">
              <span className="tw:block tw:font-semibold">About Me</span>
              <span className="tw:block tw:text-xs">
                {finalProfileUser?.about}
              </span>
            </div>

            <div className="tw:bg-linear-to-r tw:from-primary tw:via-[#1d1d1d] tw:to-[#2b2b2b] tw:w-full tw:md:max-w-xl tw:mx-auto tw:mt-4 tw:rounded-2xl tw:px-4 tw:py-4 tw:text-center tw:text-white">
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
        ) : isOwnProfile && isOrganiser && !isKycVerified ? (
          // 2) Your own profile + organiser but KYC not verified → notice block
          <div className="tw:h-full tw:flex tw:items-start tw:lg:items-center tw:justify-center tw:py-6">
            <div className="tw:w-full tw:max-w-xl tw:bg-white tw:rounded-3xl tw:p-6 tw:md:p-8 tw:shadow-[0_18px_60px_rgba(15,23,42,0.18)] tw:space-y-6">
              {/* Top: icon + badge */}
              <div className="tw:flex tw:items-center tw:flex-col tw:gap-4">
                <div className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/5">
                  <div className="tw:h-6 tw:w-6 tw:rounded-full tw:border-[3px] tw:border-primary tw:border-t-transparent tw:animate-spin" />
                </div>

                <div className="tw:flex-1 tw:text-center">
                  <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-emerald-50 tw:px-3 tw:py-1">
                    <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-500 tw:animate-pulse" />
                    <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.16em] tw:uppercase tw:text-emerald-700">
                      KYC in progress
                    </span>
                  </div>

                  <span className="tw:block tw:mt-3 tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                    Your organiser account is under review
                  </span>

                  <p className="tw:mt-2 tw:text-sm tw:text-slate-600">
                    We&apos;re currently verifying the details you submitted.
                    Once your KYC is approved, you&apos;ll unlock organiser
                    tools like event creation, payouts and more.
                  </p>
                </div>
              </div>

              {/* Progress bar + copy */}
              <div className="tw:rounded-2xl tw:bg-slate-50 tw:px-4 tw:py-4 tw:space-y-3">
                <div className="tw:flex tw:items-center tw:justify-between">
                  <span className="tw:text-xs tw:font-medium tw:text-slate-700">
                    Verification status
                  </span>
                  <span className="tw:text-[11px] tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-[0.16em]">
                    Under review
                  </span>
                </div>

                <div className="tw:h-2.5 tw:w-full tw:rounded-full tw:bg-slate-200">
                  <div className="tw:h-full tw:w-2/3 tw:rounded-full tw:bg-primary tw:transition-all tw:duration-500" />
                </div>

                <ul className="tw:mt-1 tw:space-y-1.5 tw:text-[12px] tw:text-slate-600">
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-primary" />
                    ID & bank details submitted
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-400" />
                    Our compliance team is reviewing your information
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-slate-300" />
                    You&apos;ll be notified once a decision is made
                  </li>
                </ul>
              </div>

              {/* Info + actions */}
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:justify-between tw:gap-4">
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  <button
                    style={{ borderRadius: 12 }}
                    type="button"
                    className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-slate-200 tw:px-4 tw:py-2 tw:text-xs tw:font-medium tw:text-slate-700 tw:hover:bg-slate-50 tw:transition"
                    onClick={() => navigate("/")}
                  >
                    Go to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 3) Normal profile layout
          // (own profile with KYC verified OR viewing another organiser)
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:gap-6 tw:lg:h-full">
            {/* LEFT: profile card + about */}
            <div className="tw:w-full tw:lg:w-[35%] tw-no-scrollbar tw:lg:pb-10 tw:shrink-0 tw:lg:h-full tw:lg:overflow-y-auto tw:lg:pr-2">
              <div className="tw:space-y-4 tw:lg:pb-6">
                <ProfileHeader
                  user={finalProfileUser}
                  organiser={organiser}
                  isOwnProfile={isOwnProfile}
                  isFollowing={isFollowing}
                  followLoading={followLoading}
                  onToggleFollow={handleToggleFollow}
                  onShare={handleShareProfile}
                  shareLoading={shareLoading}
                />
                <AboutPanel user={finalProfileUser} />
              </div>
            </div>

            {/* RIGHT: events */}
            <div className="tw:flex-1 tw:h-auto tw:lg:h-full tw:pb-20 tw:pr-1 tw:lg:overflow-y-auto">
              <ProfileTabs
                user={finalProfileUser}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
