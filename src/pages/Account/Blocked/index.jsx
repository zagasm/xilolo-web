// src/pages/user/BlockedUsers.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { api, authHeaders } from "../../../lib/apiClient";
import { showError, showSuccess } from "../../../component/ui/toast";
import { useAuth } from "../../auth/AuthContext";
import SubscriptionBadge from "../../../component/ui/SubscriptionBadge.jsx";

const CACHE_KEY = "Xilolo_blocked_users";

function BlockedUsersPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true); // initial shimmer
  const [networkBusy, setNetworkBusy] = useState(false); // background refresh / pagination / unblock
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlockedUsers = useCallback(
    async (page = 1) => {
      try {
        setNetworkBusy(true);

        const res = await api.get("/api/v1/blocks/users", {
          params: { page },
          ...authHeaders(token),
        });

        const list = res?.data?.data || [];
        const metaData = res?.data?.meta || null;

        setUsers(Array.isArray(list) ? list : []);
        setMeta(metaData);

        // cache both list + meta
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ list, meta: metaData })
        );
      } catch (err) {
        console.error(err);
        if (!users.length) {
          showError("Could not load blocked users.");
        }
      } finally {
        setLoading(false);
        setNetworkBusy(false);
      }
    },
    [token, users.length]
  );

  useEffect(() => {
    // 1. try cache first
    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached.list)) {
          setUsers(cached.list);
          setMeta(cached.meta || null);
          setLoading(false);
        }
      } catch {
        // ignore bad cache
      }
    }

    // 2. always hit API
    if (!cachedRaw) setLoading(true);
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = async (user) => {
    if (!user?.id) return;

    try {
      setUnblockingId(user.id);

      // toggle block state via backend
      const res = await api.post(
        "/api/v1/unblockUserOrEvent",
        {
          blockable_id: user.id,
          blockable_type: "user", // adjust if your backend expects a different key
        },
        authHeaders(token)
      );

      // you can inspect res.data if you want to be more strict
      const updated = users.filter((u) => u.id !== user.id);
      setUsers(updated);

      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ list: updated, meta })
      );

      showSuccess("User unblocked successfully.");
    } catch (err) {
      console.error(err);
      showError("Could not unblock user. Please try again.");
    } finally {
      setUnblockingId(null);
    }
  };

  const handlePageChange = (nextPage) => {
    if (!meta) return;
    if (nextPage < 1 || nextPage > meta.last_page) return;
    loadBlockedUsers(nextPage);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:xl:grid-cols-6 tw:gap-3 tw:md:gap-4 tw:px-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="tw:flex tw:pb-1">
              <SkeletonCard />
            </div>
          ))}
        </div>
      );
    }

    if (!users.length) {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:text-center tw:px-4">
          <span className="tw:block tw:text-lg tw:font-medium tw:text-gray-900">
            You don’t have any blocked users.
          </span>
          <span className="tw:block tw:mt-2 tw:text-sm tw:text-gray-500">
            If you block someone in the future, they’ll show up here so you can
            manage and unblock them later.
          </span>
        </div>
      );
    }

    return (
      <>
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:xl:grid-cols-5 tw:gap-3 tw:px-0 tw:md:px-4 tw:md:gap-4">
          {users.map((user) => (
            <div key={user.id} className="tw:flex tw:pb-1">
              <BlockedUserCard
                user={user}
                onUnblock={() => handleUnblock(user)}
                isUnblocking={unblockingId === user.id}
              />
            </div>
          ))}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-3 tw:mt-6 tw:px-4">
            <button
              type="button"
              onClick={() => handlePageChange(meta.current_page - 1)}
              disabled={meta.current_page <= 1 || networkBusy}
              className="tw:px-3 tw:py-1.5 tw:text-xs tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:text-gray-700 tw:disabled:opacity-40 tw:disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="tw:text-xs tw:text-gray-500">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page || networkBusy}
              className="tw:px-3 tw:py-1.5 tw:text-xs tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:text-gray-700 tw:disabled:opacity-40 tw:disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="tw:bg-[#F5F5F7] tw:min-h-screen tw:pb-12">
      <div className="tw:pt-20">
        {/* Top bar */}
        <div className="tw:bg-white tw:py-4 tw:px-4 tw:md:px-0 tw:text-center tw:mb-6">
          <div className="tw:flex tw:items-center tw:md:justify-between tw:max-w-2xl tw:mx-auto tw:gap-4">
            <button
              type="button"
              style={{ borderRadius: "50%" }}
              onClick={() => navigate(-1)}
              className="tw:inline-flex tw:items-center tw:justify-center tw:size-10 tw:rounded-full tw:bg-white tw:border tw:border-gray-200 tw:text-sm tw:font-medium tw:hover:bg-gray-50 tw:transition"
            >
              <ChevronLeft className="tw:w-5 tw:h-5 tw:text-gray-500" />
            </button>
            <span className="tw:text-[22px] tw:md:text-xl tw:font-semibold tw:text-gray-900 tw:text-center">
              Blocked Users
            </span>
            <div className="tw:lg:w-20" />
          </div>

          {networkBusy && !loading && (
            <span className="tw:block tw:mt-2 tw:text-[11px] tw:text-gray-400">
              Syncing latest blocked users…
            </span>
          )}
        </div>

        <div>
          <div className="tw:mb-4 tw:px-4">
            <span className="tw:block tw:mt-3 tw:px-5 tw:py-2 tw:rounded-full tw:bg-[#f0f0f0] tw:text-xs tw:text-gray-500 tw:text-center tw:shadow-sm">
              Tapping <span className="tw:mx-1 tw:font-semibold">Unblock</span>{" "}
              will restore this user’s ability to see you and your content
              again, based on your privacy settings.
            </span>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}

/* ---------- Card Components ---------- */

function BlockedUserCard({ user, onUnblock, isUnblocking }) {
  const navigate = useNavigate();

  const {
    id,
    name,
    userName,
    profileUrl,
    followers_count,
    events_count,
    has_active_subscription,
  } = user;

  const initials = name
    ? name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "?";

  const followersLabel = formatFollowers(followers_count);

  return (
    <div className="tw:w-full tw:bg-white tw:rounded-3xl tw:p-3 tw:flex tw:flex-col tw:h-full tw:shadow-[0_8px_24px_rgba(0,0,0,0.04)] tw:border tw:border-[#EFEFEF] tw:transition-transform hover:-tw:translate-y-1 tw:hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      {/* Avatar / cover */}
      <button
        style={{
          borderRadius: 12,
        }}
        type="button"
        onClick={() => navigate(`/profile/${id}`)}
        className="tw:block tw:relative tw:overflow-hidden tw:w-full tw:h-[148px] tw:rounded-[18px] tw:mb-3 tw:bg-gray-100"
      >
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={name}
            className="tw:w-full tw:h-full tw:object-cover"
          />
        ) : (
          <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-linear-to-br tw:from-primary/10 tw:to-primarySecond/10">
            <span className="tw:text-lg tw:font-semibold tw:text-gray-700">
              {initials}
            </span>
          </div>
        )}
      </button>

      {/* Name + username */}
      <div className="tw:mt-2 tw:mb-1">
        <div className="tw:flex tw:items-center tw:gap-0.5">
          <span className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:truncate">
            {name}
          </span>
          {has_active_subscription && (
            <SubscriptionBadge className="tw:size-4" />
          )}
        </div>
        {userName && (
          <span className="tw:block tw:text-[11px] tw:text-gray-500 tw:truncate">
            {userName}
          </span>
        )}
      </div>

      {/* Followers / events pill */}
      <div className="tw:flex tw:items-center tw:justify-between tw:bg-[#f5f5f5] tw:rounded-lg tw:px-2.5 tw:py-2 tw:mb-3">
        <span className="tw:text-[11px] tw:text-black tw:font-medium tw:truncate tw:pr-2">
          {followersLabel}
        </span>
        <span className="tw:text-[10px] tw:text-gray-600 tw:whitespace-nowrap">
          {events_count || 0} events
        </span>
      </div>

      {/* Unblock button */}
      <button
        style={{ borderRadius: 8 }}
        type="button"
        disabled={isUnblocking}
        onClick={onUnblock}
        className="tw:mt-auto tw:w-full tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:px-3 tw:py-2.5 tw:rounded-[18px] tw:bg-white tw:border tw:border-gray-200 tw:text-xs tw:font-medium tw:text-gray-800 tw:hover:bg-gray-50 disabled:tw:opacity-60 disabled:tw:cursor-not-allowed tw:transition"
      >
        <span>{isUnblocking ? "Unblocking…" : "Unblock"}</span>
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="tw:bg-white tw:rounded-3xl tw:p-3 tw:h-full tw:border tw:border-[#EFEFEF] tw:shadow-[0_8px_24px_rgba(0,0,0,0.03)] tw:animate-pulse tw:flex tw:flex-col">
      <div className="tw:w-full tw:aspect-3/4 tw:rounded-[18px] tw:bg-gray-200 tw:mb-3" />
      <div className="tw:h-3 tw:w-24 tw:bg-gray-200 tw:rounded-full tw:mb-2" />
      <div className="tw:h-3 tw:w-20 tw:bg-gray-200 tw:rounded-full tw:mb-3" />
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
        <div className="tw:h-3 tw:w-24 tw:bg-gray-200 tw:rounded-full" />
        <div className="tw:h-3 tw:w-14 tw:bg-gray-200 tw:rounded-full" />
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

export default BlockedUsersPage;
