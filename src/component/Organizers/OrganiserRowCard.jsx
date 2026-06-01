import React from "react";
import { useNavigate } from "react-router-dom";
import {
  getFollowState,
  getInitials,
  hasProfileImage,
} from "./organiser.utils";
import { Ticket } from "lucide-react";
import { useAuth } from "../../pages/auth/AuthContext";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";

export default function OrganizerRowCard({ org, onToggleFollow }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = org?.userName || org?.organiser || "Organizer";
  const initials = getInitials(displayName);
  const showImage = hasProfileImage(org?.profileImage);
  const followersCount = org?.numberOfFollowers ?? 0;
  const { buttonClass, label: followLabel } = getFollowState(org);

  return (
    <div
      onClick={() => navigate(`/profile/${org.id}`)}
      className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-gray-100 tw:bg-white tw:p-3 tw:shadow-sm tw:sm:gap-4 tw:sm:p-4"
    >
      <div className="tw:relative tw:size-20 tw:shrink-0 tw:overflow-hidden tw:rounded-2xl tw:bg-[#d8d6d2] tw:sm:h-[110px] tw:sm:w-[110px]">
        {showImage ? (
          <img
            src={org.profileImage}
            alt={displayName}
            className="tw:h-full tw:w-full tw:object-cover"
            loading="lazy"
          />
        ) : (
          <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center">
            <span className="tw:text-xl tw:font-semibold tw:text-primary tw:sm:text-2xl">
              {initials}
            </span>
          </div>
        )}

        {Number.isFinite(Number(org?.rank)) && (
          <div className="tw:absolute tw:left-2 tw:top-2 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-white/90 tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-gray-900 tw:backdrop-blur tw:sm:text-xs">
            #{org.rank}
          </div>
        )}
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:items-center">
          <span className="tw:block tw:truncate tw:first-letter:uppercase tw:text-[13px] tw:font-semibold tw:text-gray-900 tw:sm:text-lg">
            {displayName}
          </span>
          {org.has_active_subscription && (
            <SubscriptionBadge className="tw:size-2 tw:md:size-3" />
          )}
        </div>

        <span className="tw:mt-1 tw:block tw:text-[10px] tw:text-gray-600 tw:sm:text-xs">
          {followersCount} <span className="tw:text-gray-500">followers</span>
        </span>

        <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1 tw:md:gap-2">
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[9px] tw:sm:text-xs">
            <Ticket className="tw:size-3 tw:text-emerald-600 tw:sm:size-4" />
            <span className="tw:text-emerald-600">
              {org?.tickets_total ?? 0}
            </span>
            Tickets Sold
          </span>
        </div>
      </div>

      {user.id !== org?.userId && (
        <div className="tw:w-24 tw:shrink-0 tw:sm:w-[120px]">
          <button
            style={{ borderRadius: 16, fontSize: 11 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(org.userId);
            }}
            className={`tw:w-full tw:rounded-2xl tw:px-2.5 tw:py-1.5 tw:text-[11px] tw:font-medium tw:leading-tight tw:ring-1 tw:transition tw:sm:px-3 tw:sm:py-2 tw:sm:text-sm ${buttonClass}`}
          >
            {followLabel}
          </button>
        </div>
      )}
    </div>
  );
}
