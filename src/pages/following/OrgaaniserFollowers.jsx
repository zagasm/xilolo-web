import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import { ChevronLeft } from "lucide-react";
import { getInitials, hasProfileImage } from "../../component/Organizers/organiser.utils";
import SubscriptionBadge from "../../component/ui/SubscriptionBadge.jsx";

const CACHE_KEY = "xilolo_followers_organisers";

function OrganiserFollowers() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkBusy, setNetworkBusy] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadOrganisers = useCallback(async () => {
    try {
      setNetworkBusy(true);

      const res = await api.get(
        "/api/v1/organisers/followers",
        authHeaders(token)
      );

      const list = res?.data?.data || [];
      setOrganisers(list);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error(err);
      if (!organisers.length) {
        showError("Could not load organisers that follow you.");
      }
    } finally {
      setLoading(false);
      setNetworkBusy(false);
    }
  }, [token, organisers.length]);

  const handleToggleFollow = useCallback(
    async (org) => {
      if (!org?.userId) return;
      setTogglingId(org.userId);
      try {
        const res = await api.post(
          `/api/v1/follow/${org.userId}`,
          {},
          authHeaders(token)
        );

        const following =
          typeof res?.data?.following === "boolean"
            ? res.data.following
            : typeof res?.data?.data?.following === "boolean"
              ? res.data.data.following
              : !org.isFollowing;

        setOrganisers((prev) => {
          const updated = prev.map((item) =>
            item.userId === org.userId ? { ...item, isFollowing: following } : item
          );
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
          return updated;
        });

        showSuccess(
          following ? "Organizer followed" : "Organizer unfollowed"
        );
      } catch (error) {
        console.error(error);
        showError("Could not update follow state. Please try again.");
      } finally {
        setTogglingId(null);
      }
    },
    [token]
  );

  useEffect(() => {
    // 1. use cache for instant paint
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setOrganisers(parsed);
          setLoading(false);
        }
      } catch (_) {
        // ignore bad cache
      }
    }

    // 2. always refresh from API
    if (!cached) setLoading(true);
    loadOrganisers();
  }, [loadOrganisers]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:xl:grid-cols-6 tw:gap-3 tw:px-0 tw:md:px-4 tw:md:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="tw:flex tw:pb-1">
              <SkeletonCard />
            </div>
          ))}
        </div>
      );
    }

    if (!organisers.length) {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:text-center tw:px-4">
          <span className="tw:text-lg tw:font-medium tw:text-gray-900">
            No organisers follow you yet.
          </span>
          <span className="tw:mt-2 tw:text-sm tw:text-gray-500">
            As you host or join more events, organisers who like your engagement
            will start following you here.
          </span>
        </div>
      );
    }

    return (
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:xl:grid-cols-6 tw:gap-3 tw:px-0 tw:md:px-4 tw:md:gap-4">
        {organisers.map((org) => (
          <div key={org.id} className="tw:flex tw:pb-1">
            <OrganiserCard
              organiser={org}
              onToggleFollow={handleToggleFollow}
              isToggling={togglingId === org.userId}
              onCardClick={() => navigate(`/profile/${org.id}`)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tw:bg-[#F5F5F7] tw:min-h-screen tw:pb-20">
      <div className="tw:pt-20">
        {/* Header */}
        <div className="tw:bg-white tw:py-4 tw:px-4 tw:md:px-0 tw:text-center tw:mb-6">
          <div className="tw:flex tw:items-center tw:md:justify-between tw:max-w-2xl tw:mx-auto tw:gap-4">
            <button
              type="button"
              style={{ borderRadius: "50%" }}
              onClick={() => navigate(-1)}
              className="tw:inline-flex tw:items-center tw:justify-center tw:size-10 tw:rounded-full tw:bg-white tw:border tw:border-gray-200 tw:text-sm tw:font-medium tw:tw:hover:bg-gray-50 tw:transition"
            >
              <ChevronLeft className="tw:w-5 tw:h-5 tw:text-gray-500" />
            </button>
            <span className="tw:text-lg tw:text-center tw:md:text-xl tw:font-semibold tw:text-gray-900">
              Organizers Following Me
            </span>
            <div className="tw:lg:w-20" />
          </div>
        </div>

        <div>
          <div className="tw:mb-4 tw:px-4">
            <span className="tw:text-center tw:block tw:mt-3 tw:px-5 tw:py-2 tw:rounded-full tw:bg-[#f0f0f0] tw:text-xs tw:text-gray-500 tw:shadow-sm">
              These are organisers who follow your profile on Xilolo.
            </span>
          </div>

          {networkBusy && !loading && (
            <div className="tw:px-4 tw:mb-2">
              <span className="tw:text-[11px] tw:text-gray-400">
                Syncing latest followers…
              </span>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}

/* ---------- Card Components ---------- */

function OrganiserCard({
  organiser,
  onToggleFollow,
  isToggling = false,
  onCardClick = () => { },
}) {
  const {
    organiser: name,
    profileImage,
    numberOfFollowers,
    rank,
    has_active_subscription,
  } = organiser;

  const initials = getInitials(name);
  const showImage = hasProfileImage(profileImage);
  const followersLabel = formatFollowers(numberOfFollowers);
  const showVerified = !!has_active_subscription;
  const isFollowing = !!organiser.isFollowing;
  const buttonLabel = isFollowing ? "Unfollow" : "Follow";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      className="tw:w-full tw:bg-white tw:rounded-3xl tw:p-3 tw:flex tw:flex-col tw:h-full tw:shadow-[0_8px_24px_rgba(0,0,0,0.04)] tw:border tw:border-[#EFEFEF] tw:transition-transform tw:hover:-tw:translate-y-1 tw:tw:hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] tw:cursor-pointer"
    >
      {/* Image / initials */}
      <div className="tw:relative tw:overflow-hidden tw:w-full tw:h-[148px] tw:rounded-[18px] tw:mb-3 tw:bg-lightPurple tw:flex tw:items-center tw:justify-center">
        {showImage ? (
          <img
            src={profileImage}
            alt={name}
            className="tw:w-full tw:h-full tw:object-cover"
            loading="lazy"
          />
        ) : (
          <span className="tw:text-primary tw:text-2xl tw:font-semibold">
            {initials}
          </span>
        )}
      </div>

      {/* Name + rank */}
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-gray-900 tw:truncate tw:pr-2">
          {name}
          {showVerified && (
            <SubscriptionBadge className="tw:size-3" />
          )}
        </span>

        <div className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:rounded-lg tw:bg-black tw:text-[10px] tw:text-white tw:shrink-0">
          <img width={21} height={21} src="/images/globe.svg" alt="" />
          <span className="tw:font-semibold tw:text-[10px]">
            #{rank ?? "–"}
          </span>
        </div>
      </div>

      {/* Followers strip */}
      <div className="tw:flex tw:items-center tw:justify-center tw:bg-[#f5f5f5] tw:rounded-lg tw:py-2 tw:mb-3">
        <span className="tw:text-[11px] tw:text-black tw:font-medium">
          {followersLabel}
        </span>
      </div>

      <button
        type="button"
        disabled={isToggling}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFollow?.(organiser);
        }}
        className={[
          "tw:mt-auto tw:w-full tw:inline-flex tw:items-center tw:justify-center tw:px-3 tw:py-2.5 tw:rounded-[18px] tw:text-[11px] tw:font-semibold tw:transition",
          isFollowing
            ? "tw:bg-white tw:border tw:border-gray-200 tw:text-gray-800"
            : "tw:bg-primary tw:text-white tw:border tw:border-primary",
          isToggling ? "tw:opacity-60 tw:cursor-not-allowed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isToggling ? "Processing…" : buttonLabel}
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="tw:bg-white tw:rounded-3xl tw:p-3 tw:h-full tw:border tw:border-[#EFEFEF] tw:shadow-[0_8px_24px_rgba(0,0,0,0.03)] tw:animate-pulse tw:flex tw:flex-col">
      <div className="tw:w-full tw:aspect-3/4 tw:rounded-[18px] tw:bg-gray-200 tw:mb-3" />
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <div className="tw:h-3 tw:w-24 tw:bg-gray-200 tw:rounded-full" />
        <div className="tw:h-4 tw:w-10 tw:bg-gray-200 tw:rounded-full" />
      </div>
      <div className="tw:h-4 tw:w-16 tw:bg-gray-200 tw:rounded-full tw:mb-3" />
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
        <div className="tw:flex tw:gap-[-8px]">
          <div className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-gray-200" />
          <div className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-gray-200" />
          <div className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-gray-200" />
        </div>
        <div className="tw:h-3 tw:w-20 tw:bg-gray-200 tw:rounded-full" />
      </div>
      <div className="tw:mt-auto tw:h-9 tw:w-full tw:bg-gray-200 tw:rounded-[18px]" />
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatFollowers(count) {
  const n = Number(count) || 0;
  if (n >= 1000000) {
    return `+${(n / 1000000).toFixed(1)}M followers`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K followers`;
  }
  if (n === 1) return "1 follower";
  return `${n} followers`;
}

export default OrganiserFollowers;
