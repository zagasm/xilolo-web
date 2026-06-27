import React from "react";
import defaultProfile from "../../assets/avater_pix.avif";
import { ArrowUpRight, Share2, Ticket } from "lucide-react";
import { Edit } from "react-feather";
import { Link, useNavigate } from "react-router-dom";
import "./profile.css";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";

export default function ProfileHeader({
  user,
  organiser,
  isOwnProfile = true,
  isFollowing = false,
  followLoading = false,
  onToggleFollow,
  onShare,
  shareLoading = false,
}) {
  // console.log(user);
  const computedIsFollowing =
    typeof isFollowing === "boolean"
      ? isFollowing
      : typeof user?.isFollowing === "boolean"
      ? user.isFollowing
      : typeof user?.is_following === "boolean"
      ? user.is_following
      : !!user?.following;
  // organiser response vs normal user response
  const isOrganiserProfileData =
    !!user?.organiser ||
    (!!user?.userId && (!!user?.events || !!user?.allEvents));

  const navigate = useNavigate();

  const img = user?.profileImage || user?.profileUrl || null;

  const displayName =
    user?.name || user?.organiser || user?.userName || "Your Name";

  function initialsFromName(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "?";
  }

  const initials = initialsFromName(displayName);

  const followersCount = user?.numberOfFollowers ?? user?.followers_count ?? 0;

  const followingCount = user?.followings_count ?? 0;

  const ticketsSold = user?.successfulPayments ?? user?.tickets_sold ?? 0;
  const rankValue =
    user?.organiser?.rank ??
    user?.organiser?.rank_global ??
    user?.rank ??
    user?.rank_global ??
    null;

  const rankingLabel = isOwnProfile ? "My Ranking" : "Organizer Ranking";
  const followersLabel = isOwnProfile ? "Followers" : "Followers";
  const hasActiveSubscription = !!(
    user?.subscription?.isActive ||
    user?.has_active_subscription ||
    user?.organiser?.has_active_subscription ||
    (isOwnProfile && organiser?.has_active_subscription)
  );

  const handleEditClick = () => {
    navigate("/profile/edit-profile");
  };

  const handleFollowersClick = () => {
    if (!isOwnProfile) return;
    navigate("/me/organisers/followers");
  };

  const handleFollowingClick = () => {
    if (!isOwnProfile) return;
    navigate("/me/organisers");
  };

  const showFollowButton = !isOwnProfile && isOrganiserProfileData;
  const canShare = typeof onShare === "function";

  return (
    <div className="tw:rounded-3xl tw:border tw:border-gray-100 tw:bg-[#ffffff] tw:py-6 tw:px-3 tw:shadow-[0_10px_28px_rgba(15,23,42,0.04),0_0_18px_rgba(0,245,255,0.04)]">
      <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
        {/* avatar + edit / follow */}
        <div className="tw:relative">
          <div className="tw:h-24 tw:w-24 tw:rounded-full tw:border tw:border-gray-200 tw:bg-lightPurple tw:overflow-hidden tw:flex tw:items-center tw:justify-center">
            {img ? (
              <img
                src={img}
                alt={displayName}
                className="tw:h-full tw:w-full tw:object-cover"
                loading="lazy"
              />
            ) : (
              <span className="tw:text-2xl tw:font-semibold tw:text-primary">
                {initials}
              </span>
            )}
          </div>

          {isOwnProfile ? (
            // edit button for your own profile
            <button
              type="button"
              onClick={handleEditClick}
              className="tw:absolute tw:-right-1 tw:-top-1 tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:shadow-md tw:hover:bg-gray-50"
            >
              <Edit size={18} />
            </button>
          ) : null}
        </div>

        {/* name + meta */}
        <div className="tw:text-center tw:w-full">
          <span className="tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-gray-900 tw:flex tw:items-center tw:gap-0.5 tw:justify-center">
            <span>{displayName}</span>
            {hasActiveSubscription && (
              <SubscriptionBadge className="tw:size-5" />
            )}
          </span>

          {user?.userName && !isOrganiserProfileData && (
            <span className="tw:block tw:mt-1 tw:text-sm tw:text-gray-500">
              {user.userName}
            </span>
          )}

          {/* chip: simple tag – you can swap later */}
          <div className="tw:mt-3 tw:flex tw:items-center tw:justify-center tw:gap-2">
            <span className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-700">
              {isOrganiserProfileData ? "Organizer" : "Member"}
            </span>
          </div>

          {canShare && (
            <div className="tw:mt-4 tw:flex tw:items-center tw:justify-center">
              <button
                type="button"
                onClick={onShare}
                disabled={shareLoading}
                className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:px-4 tw:py-2 tw:text-xs tw:font-medium tw:text-gray-800 tw:hover:bg-gray-50 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
                style={{ borderRadius: 20 }}
              >
                <Share2 size={14} />
                {shareLoading ? "Preparing..." : "Share Profile"}
              </button>
            </div>
          )}

          {/* follow CTA for organiser profile (not your own) */}
          {showFollowButton && (
            <div className="tw:mt-4 tw:flex tw:items-center tw:justify-center">
              <button
                style={{
                  borderRadius: 20,
                }}
                type="button"
                disabled={followLoading}
                onClick={onToggleFollow}
                className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-xs tw:font-medium tw:text-white tw:shadow-[0_12px_28px_rgba(0,0,0,0.16),0_0_18px_rgba(0,245,255,0.14)] tw:hover:bg-primary/80 tw:transition tw:disabled:opacity-60 tw:disabled:cursor-not-allowed"
              >
                {followLoading
                  ? "Please wait..."
                  : computedIsFollowing
                  ? "Unfollow"
                  : "Follow Organizer"}
              </button>
            </div>
          )}

          {/* tickets / payments */}
          <div className="tw:mt-3 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:text-xs tw:md:text-sm">
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-emerald-600">
              <Ticket size={14} />
              <span className="tw:font-semibold">{ticketsSold}</span>
              <span className="tw:text-gray-500">
                {isOrganiserProfileData
                  ? "Tickets Sold"
                  : "Tickets Sold"}
              </span>
            </span>
          </div>
        </div>

        {/* followers / following cards */}
        <div className="tw:mt-5 tw:grid tw:w-full tw:grid-cols-2 tw:gap-3">
          <button
            type="button"
            onClick={handleFollowersClick}
            className="tw:flex tw:flex-col tw:justify-between tw:rounded-2xl tw:bg-gray-50 tw:px-4 tw:py-3 tw:text-left tw:hover:bg-gray-100 disabled:tw:cursor-default disabled:tw:hover:bg-gray-50"
            disabled={!isOwnProfile}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-gray-500">
              <span className="tw:inline-flex tw:items-center tw:gap-1">
                {followersLabel}
              </span>
              <ArrowUpRight size={14} />
            </div>
            <span className="tw:mt-1 tw:text-lg tw:font-semibold tw:text-gray-900">
              {followersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={handleFollowingClick}
            className="tw:flex tw:flex-col tw:justify-between tw:rounded-2xl tw:bg-gray-50 tw:px-4 tw:py-3 tw:text-left tw:hover:bg-gray-100 disabled:tw:cursor-default disabled:tw:hover:bg-gray-50"
            disabled={!isOwnProfile}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-gray-500">
              <span className="tw:inline-flex tw:items-center tw:gap-1">
                Following
              </span>
              <ArrowUpRight size={14} />
            </div>
            <span className="tw:mt-1 tw:text-lg tw:font-semibold tw:text-gray-900">
              {followingCount}
            </span>
          </button>
        </div>

        {/* ranking bar */}
        <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:mt-5 tw:w-full tw:rounded-2xl tw:bg-black tw:px-5 tw:py-4 tw:text-white tw:shadow-[0_18px_42px_rgba(0,0,0,0.24),0_0_24px_rgba(0,245,255,0.10)]">
          <span className="tw:text-sm tw:font-medium tw:mb-2">
            {rankingLabel}
          </span>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-4 tw:text-sm">
            <span className="tw:inline-flex tw:items-center tw:gap-2">
              <img src="/images/globe.svg" alt="" />
              <span>
                #{" "}
                {rankValue !== null && rankValue !== undefined
                  ? rankValue
                  : "—"}
              </span>
            </span>
          </div>
          <Link className="text-dark tw:bg-white tw:py-2 tw:w-full tw:rounded-xl text-center tw:mt-3 tw:font-semibold" to={'/organizers'}>
              View Top Organisers
          </Link>
        </div>
      </div>
    </div>
  );
}
