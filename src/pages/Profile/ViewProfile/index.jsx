// src/pages/Profile/ViewProfile/index.jsx
//
// /profile/:profileId — the web user profile page.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   Own profile  lib/features/presentation/screens/profile/screens/
//                user_and_organizer_profile_screen/user_main_profile_screen_revamp.dart
//                  app bar (back 42 circle card fill + hairline, title "Profile"
//                  21/w700, "Edit" pill r16)                     :259-326
//                  stack order: header card -> followers/following -> about ->
//                  ranking, gutters 14                     :163-193, :332-346
//   Other user   lib/.../profile/screens/organizer_profile.dart
//                  app bar (back 40 circle chip, "Profile" 20/w600, share 40
//                  circle chip)                                   :186-265
//                  stack order: header -> followers -> about (only if a bio) ->
//                  ranking, gutters 16                      :132-163, :271-296
//                  error/loading shimmer               :97-130, organizer_profile_shimmer
//   Plain user   lib/.../profile/screens/user_profile_screen.dart
//                  error state: error_outline 64 faint, message 16 muted, Go Back
//                  button                                        :110-136
//   L10n         lib/l10n/app_en.arb — "Profile", "More From Organizer",
//                "Organizer's Ranking", "View Top Organizers", "No events found"
//
// RESPONSIVENESS: the app is a single column at every width (horizontal padding
// only), so this page is too — one column capped at 560px and centred, the same
// convention the rebuilt /tickets screen uses (TicketsPage.jsx:261-262). The
// previous two-column 35%/flex layout was a web-only arrangement the app does
// not have.
//
// Data is untouched: same useProfile() hook, same GET /api/v1/organiser/:id +
// 404 fallback to the shared-user profile, same GET /api/v1/follow/:id, same
// share helpers, same KYC / become-an-organiser branches.
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Share2, TriangleAlert } from "lucide-react";

import useProfile from "../../../hooks/useProfile";
import ProfileHeader, {
  ProfileRanking,
  profileHasSubscription,
  profileIsOrganiser,
} from "../../../component/Profile/ProfileHeader";
import AboutPanel from "../../../component/Profile/AboutPanel";
import ProfileTabs from "../../../component/Profile/ProfileTab";
import { useAuth } from "../../auth/AuthContext";
import { api, authHeaders } from "../../../lib/apiClient";
import { showError, showSuccess } from "../../../component/ui/toast";
import {
  getOrganiserProfileShare,
  getUserProfileShare,
} from "../../../api/profileShareApi";
import "./profile.css";

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

/** app: organizer_profile.dart:97-130 shells the pending organiser profile with
 *  OrganizerProfileShimmer; this is the same skeleton in web tokens. */
const ProfileSkeleton = () => (
  <div className="tw:animate-pulse tw:flex tw:flex-col tw:gap-[10px]">
    <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[14px] tw:md:p-[18px]">
      <div className="tw:size-[84px] tw:shrink-0 tw:rounded-full tw:bg-inner" />
      <div className="tw:min-w-0 tw:flex-1 tw:space-y-3">
        <div className="tw:h-5 tw:w-1/2 tw:rounded-full tw:bg-inner" />
        <div className="tw:h-5 tw:w-24 tw:rounded-full tw:bg-chip" />
        <div className="tw:h-px tw:w-full tw:bg-hairline" />
        <div className="tw:flex tw:gap-4">
          <div className="tw:h-9 tw:w-28 tw:rounded-lg tw:bg-chip" />
          <div className="tw:h-9 tw:w-28 tw:rounded-lg tw:bg-chip" />
        </div>
      </div>
    </div>
    <div className="tw:grid tw:grid-cols-2 tw:gap-[10px]">
      {["f1", "f2"].map((k) => (
        <div
          key={k}
          className="tw:h-[90px] tw:rounded-[20px] tw:border tw:border-hairline tw:bg-paper-raised"
        />
      ))}
    </div>
    <div className="tw:h-[120px] tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised" />
  </div>
);

/** app: user_profile_screen.dart:110-136 / organizer_profile.dart:97-130. */
function ProfileErrorState({ message, onBack }) {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:px-8 tw:py-16 tw:text-center">
      <TriangleAlert className="tw:size-16 tw:text-faint" strokeWidth={1.5} />
      <div className="tw:mt-4 tw:text-[16px] tw:text-muted">{message}</div>
      <button
        type="button"
        onClick={onBack}
        className="tw:mt-4 tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent tw:px-6 tw:text-[14px] tw:font-semibold tw:text-white"
      >
        Go Back
      </button>
    </div>
  );
}

/**
 * Presentation only. Exported so /dev/profile-preview can render the REAL page
 * markup at any width without a session — the preview must not be able to drift
 * from production.
 */
export function ProfileScreenView({
  profile = null,
  kycStatus = null,
  isOwnProfile = true,
  isLoading = false,
  error = null,
  isFollowing = false,
  followLoading = false,
  shareLoading = false,
  onToggleFollow,
  onShare,
  onBack,
  previewEvents = null,
}) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate(-1));

  const isOrganiser = isOwnProfile && profileIsOrganiser(profile);
  const isKycVerified = kycStatus === "verified";
  const shouldShowBecomeOrganiser =
    isOwnProfile && !isOrganiser && !isKycVerified;
  const isSharedOrganiserProfile =
    !!profile?.organiser ||
    (!!profile?.userId && (!!profile?.events || !!profile?.allEvents));

  const appBarAction = isOwnProfile ? (
    /* app: own profile app bar "Edit" pill, r16 (revamp:300-320) */
    <Link
      to="/profile/edit-profile"
      className="tw:ml-auto tw:inline-flex tw:h-[38px] tw:items-center tw:gap-2 tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[13px] tw:font-semibold tw:text-body"
    >
      <Pencil className="tw:size-[18px]" />
      Edit
    </Link>
  ) : (
    /* app: public profile app bar share chip 40x40 (organizer_profile.dart:234-260) */
    <button
      type="button"
      onClick={onShare}
      disabled={shareLoading}
      aria-label="Share profile"
      className="tw:ml-auto tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-chip tw:text-body tw:disabled:opacity-60"
    >
      <Share2 className="tw:size-5" />
    </button>
  );

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pt-24 tw:pb-8 tw:font-sans">
      <div className="tw:mx-auto tw:w-full tw:max-w-[560px] tw:px-4">
        {/* app bar — organizer_profile.dart:186-265 / revamp:259-326 */}
        <div className="tw:flex tw:h-14 tw:items-center tw:gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline tw:bg-chip tw:text-body"
          >
            <ChevronLeft className="tw:size-5" />
          </button>
          <h1 className="tw:m-0! tw:text-[20px]! tw:font-bold! tw:leading-none tw:text-body">
            Profile
          </h1>
          {appBarAction}
        </div>

        <div className="tw:mt-3">
          {isLoading ? (
            <ProfileSkeleton />
          ) : error ? (
            <ProfileErrorState
              message={`Failed to load profile: ${error}`}
              onBack={goBack}
            />
          ) : !profile ? (
            <ProfileErrorState message="No profile data found." onBack={goBack} />
          ) : shouldShowBecomeOrganiser ? (
            // 1) Your own profile + NOT organiser + KYC not verified
            <div className="tw:space-y-[10px]">
              <div className="tw:flex flex-col items-center tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[18px]">
                <div className="tw:size-[114px] tw:overflow-hidden tw:rounded-full">
                  <img
                    src={profile?.profileUrl || "/images/avater_pix.avif"}
                    alt=""
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                </div>
                <div className="tw:mt-3 tw:text-center">
                  <span className="tw:block tw:text-[16px] tw:font-semibold tw:text-body">
                    {profile?.name}
                  </span>
                  <span className="tw:block tw:text-[12px] tw:text-muted">
                    {profile?.email}
                  </span>
                </div>
                <div className="tw:mt-6 tw:w-full tw:rounded-[16px] tw:bg-chip tw:px-4 tw:py-3">
                  <span className="tw:block tw:text-[12px] tw:text-muted">
                    Following
                  </span>
                  <span className="tw:block tw:text-[20px] tw:font-semibold tw:text-body">
                    {profile?.followings_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-4 tw:py-3">
                <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-body">
                  About Me
                </span>
                <span className="tw:block tw:text-[12px] tw:text-muted">
                  {profile?.about}
                </span>
              </div>

              <div className="tw:rounded-[22px] tw:bg-ink tw:px-4 tw:py-4 tw:text-center">
                <span className="tw:block tw:text-[20px] tw:font-semibold tw:uppercase tw:text-white">
                  Do you have an event?
                </span>
                <span className="tw:block tw:text-[12px] tw:text-ink-muted">
                  You can be an organizer and drive more audience to your event.
                  People all over the world can’t wait to attend!!
                </span>
                <Link
                  to="/become-an-organiser"
                  className="tw:mt-5 tw:block tw:rounded-[12px] tw:bg-white tw:p-3 tw:text-center tw:text-[15px] tw:font-semibold tw:text-body"
                >
                  Become an Organizer
                </Link>
              </div>
            </div>
          ) : isOwnProfile && isOrganiser && !isKycVerified ? (
            // 2) Your own profile + organiser but KYC not verified
            <div className="tw:flex tw:justify-center tw:py-6">
              <div className="tw:w-full tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-6 tw:md:p-8">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
                  <div className="tw:flex tw:size-12 tw:items-center tw:justify-center tw:rounded-[16px] tw:bg-accent-soft">
                    <span className="tw:size-6 tw:animate-spin tw:rounded-full tw:border-[3px] tw:border-accent tw:border-t-transparent" />
                  </div>

                  <div className="tw:min-w-0 tw:text-center">
                    <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-success/10 tw:px-3 tw:py-1">
                      <span className="tw:size-2 tw:animate-pulse tw:rounded-full tw:bg-success" />
                      <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-success">
                        KYC in progress
                      </span>
                    </span>

                    <span className="tw:mt-3 tw:block tw:text-[20px] tw:font-semibold tw:text-body tw:md:text-2xl">
                      Your organiser account is under review
                    </span>

                    <div className="tw:mt-2 tw:text-[14px] tw:text-muted">
                      We&apos;re currently verifying the details you submitted.
                      Once your KYC is approved, you&apos;ll unlock organiser
                      tools like event creation, payouts and more.
                    </div>
                  </div>
                </div>

                <div className="tw:mt-6 tw:space-y-3 tw:rounded-[16px] tw:bg-chip tw:px-4 tw:py-4">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-[12px] tw:font-medium tw:text-body">
                      Verification status
                    </span>
                    <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-muted">
                      Under review
                    </span>
                  </div>

                  <div className="tw:h-2.5 tw:w-full tw:rounded-full tw:bg-inner">
                    <div className="tw:h-full tw:w-2/3 tw:rounded-full tw:bg-accent tw:transition-all tw:duration-500" />
                  </div>

                  <div className="tw:space-y-1.5 tw:text-[12px] tw:text-muted">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:size-1.5 tw:rounded-full tw:bg-accent" />
                      ID &amp; bank details submitted
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:size-1.5 tw:rounded-full tw:bg-success" />
                      Our compliance team is reviewing your information
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:size-1.5 tw:rounded-full tw:bg-faint" />
                      You&apos;ll be notified once a decision is made
                    </div>
                  </div>
                </div>

                <div className="tw:mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline tw:px-4 tw:text-[12px] tw:font-medium tw:text-body"
                  >
                    Go to home
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // 3) Normal profile layout — app section order, one column
            <div className="tw:space-y-[10px]">
              <ProfileHeader
                user={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                followLoading={followLoading}
                onToggleFollow={onToggleFollow}
              />

              <AboutPanel user={profile} isOwnProfile={isOwnProfile} />

              {/* app: ranking follows the about block
                  (revamp:343, organizer_profile.dart:287-292) */}
              {profileHasSubscription(profile) || profile?.rank ? null : null}
              <ProfileRanking user={profile} isOwnProfile={isOwnProfile} />
            </div>
          )}

          {/* events block — hidden while the profile is still loading / broken /
              while the KYC gates are showing, exactly as the app splits the
              profile screen from the events list */}
          {!isLoading &&
            !error &&
            profile &&
            !shouldShowBecomeOrganiser &&
            !(isOwnProfile && isOrganiser && !isKycVerified) && (
              <div className="tw:mt-4">
                <ProfileTabs
                  user={profile}
                  isOwnProfile={isOwnProfile}
                  previewEvents={previewEvents}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ViewProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profileId: routeUserId } = useParams();

  // logged-in user (you)
  const { user: me, token } = useAuth() || {};

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
      try {
        const res = await api.get(
          `/api/v1/organiser/${routeUserId}`,
          authHeaders(token)
        );

        return normalizeViewedOrganiserProfile(res);
      } catch (error) {
        // Not an organiser (404) → fall back to the regular user profile so
        // clicking a non-organiser opens their profile instead of erroring.
        if (error?.response?.status === 404) {
          const userRes = await getUserProfileShare(routeUserId, token);
          const userData = userRes?.user || null;

          if (userData) {
            return {
              __isRegularUserProfile: true,
              ...normalizeSharedUserProfile(userData),
            };
          }
        }

        throw error;
      }
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
  const isSharedOrganiserProfile =
    sharedProfileType === "organiser" ||
    !!finalProfileUser?.organiser ||
    (!!finalProfileUser?.userId &&
      (!!finalProfileUser?.events || !!finalProfileUser?.allEvents));
  const shareTargetId = isSharedOrganiserProfile
    ? finalProfileUser?.organiser?.id ||
      finalProfileUser?.organiser?.user_id ||
      finalProfileUser?.userId ||
      finalProfileUser?.id
    : finalProfileUser?.id ||
      finalProfileUser?.user_id ||
      finalProfileUser?.userId;

  const kycStatus = isOwnProfile ? finalProfileUser?.kyc?.status || null : null;

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
    <div data-bounce-page="profile">
      <ProfileScreenView
        profile={finalProfileUser}
        kycStatus={kycStatus}
        isOwnProfile={isOwnProfile}
        isLoading={isLoading}
        error={profileError}
        isFollowing={isFollowing}
        followLoading={followLoading}
        shareLoading={shareLoading}
        onToggleFollow={handleToggleFollow}
        onShare={handleShareProfile}
      />
    </div>
  );
}
