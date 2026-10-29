import React from "react";
import { randomAvatar } from "../../utils/ui";
import { api, authHeaders } from "../../lib/apiClient";
import { showPromise, showError } from "../../component/ui/toast";
import { useAuth } from "../../pages/auth/AuthContext";

export default function OrganizerCard({
  hostImage,
  hostId,
  hostName,
  isFollowing,
  setIsFollowing,
}) {
    const {token} = useAuth();
  const toggleFollow = async () => {
    try {
      const p = api.post(`/api/v1/follow/${hostId}`, null, authHeaders(token));
      const res = await showPromise(p, {
        loading: isFollowing ? "Unfollowing…" : "Following…",
        success: "Done",
        error: "Failed",
      });
      setIsFollowing(!!res?.data?.following);
    } catch (e) {
      showError(e?.response?.data?.message || "Unable to follow");
    }
  };

  return (
    <div className="tw:px-5 tw:md:px-7 tw:pb-6">
      <div className="tw:bg-white tw:border tw:border-gray-100 tw:rounded-2xl tw:p-4 tw:flex tw:flex-col  tw:gap-4">
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
          <img
            src={hostImage || randomAvatar(hostId)}
            alt={hostName}
            className="tw:h-44 tw:w-44 tw:rounded-2xl tw:object-cover"
          />
          <div>
            <div className="tw:text-gray-900 tw:text-center tw:font-semibold tw:text-lg">
              {hostName}
            </div>
            <div className="tw:text-sm tw:text-gray-500 tw:text-center">The Trail Band</div>
          </div>
        </div>
        <div className="tw:flex tw:justify-center tw:gap-3">
          <button
          style={{
            borderRadius: 20
          }}
            onClick={toggleFollow}
            className="tw:px-6 tw:h-10 tw:bg-primary tw:text-white tw:rounded-full!"
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
}
