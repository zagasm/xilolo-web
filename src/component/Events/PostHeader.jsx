import React from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import ShareIcon from "../../assets/navbar_icons/Share.png";
import { api, authHeaders } from "../../lib/apiClient";
import { showSuccess, showError } from "../../component/ui/toast";
import { useAuth } from "../../pages/auth/AuthContext";

export default function PosterHeader({
  eventId,
  posterUrl,
  title,
  isSaved,
  setIsSaved,
  shareLink,
}) {
  const { token } = useAuth();
  // console.log(posterUrl, 's')
  const toggleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      await api.post(
        `/api/v1/events/${eventId}/toggle`,
        null,
        authHeaders(token)
      );
      showSuccess(next ? "Saved to your list" : "Removed from saved");
    } catch (e) {
      setIsSaved(!next);
      showError(e?.response?.data?.message || "Could not toggle save");
    }
  };

  const handleShare = async () => {
    const link = shareLink || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url: link });
      else {
        await navigator.clipboard.writeText(link);
        showSuccess("Share link copied");
      }
    } catch {
      await navigator.clipboard.writeText(link);
      showSuccess("Share link copied");
    }
  };

  return (
    <div className="tw:relative">
      <img
        src={posterUrl ? posterUrl : '/images/event-dummy.jpg'}
        alt={title}
        className="tw:w-full tw:h-80 tw:md:h-[380px] tw:object-cover tw:bg-[#f6f6f6]"
        loading="lazy"
      />
      <div className="tw:absolute tw:top-4 tw:left-4 tw:bg-white tw:px-3 tw:py-1.5 tw:rounded-full tw:text-sm tw:shadow">
        <span className="tw:inline-block tw:h-2 tw:w-2 tw:rounded-full tw:bg-primary tw:mr-2" />
        Poster
      </div>
      <div className="tw:absolute tw:top-4 tw:right-4 tw:flex tw:gap-2">
        <button
          type="button"
          className="tw:h-10 tw:w-10 tw:rounded-full! tw:bg-white tw:flex tw:items-center tw:justify-center tw:shadow"
          onClick={handleShare}
          aria-label="Share"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="tw:size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="tw:h-10 tw:w-10 tw:rounded-full! tw:bg-white tw:flex tw:items-center tw:justify-center tw:shadow"
          onClick={toggleSave}
          aria-label="Save"
          title={isSaved ? "Saved" : "Save"}
        >
          {isSaved ? (
            <AiFillHeart className="tw:h-5 tw:w-5 tw:text-primary" />
          ) : (
            <AiOutlineHeart className="tw:h-5 tw:w-5 tw:text-gray-700" />
          )}
        </button>
      </div>
    </div>
  );
}
