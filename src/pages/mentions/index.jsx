// e.g. src/module/tagged/pages/TaggedMentionsPage.jsx
import React, { act, useEffect, useState } from "react";

import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../../component/ui/toast";
import { useAuth } from "../auth/AuthContext";
import MentionShimmerCard from "../../component/mentions/MentionShimmerCard";
import MentionCard from "../../component/mentions/MentionCard";
import EmptyState from "../../component/mentions/EmptyState";
import { ChevronLeft } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

const STATUS_TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

export default function TaggedMentionsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [grouped, setGrouped] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [activeStatus, setActiveStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const counts = {
    pending: grouped.pending?.length || 0,
    approved: grouped.approved?.length || 0,
    rejected: grouped.rejected?.length || 0,
  };

  // initial load: grouped endpoint
  useEffect(() => {
    let cancelled = false;

    async function fetchGrouped() {
      if (!token) return;
      setLoading(true);

      try {
        const res = await api.get("/api/v1/tagged/grouped", authHeaders(token));
        const data = res.data?.data || {};
        const nextGrouped = {
          pending: data.pending || [],
          approved: data.approved || [],
          rejected: data.rejected || [],
        };

        if (!cancelled) {
          setGrouped(nextGrouped);
          setActiveStatus("pending");
          setItems(nextGrouped.pending || []);
        }
      } catch (err) {
        if (!cancelled) {
          showError(
            err?.response?.data?.message || "Failed to load your mentions."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGrouped();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // change status tab: uses /api/v1/tagged?status=pending|approved|rejected
  const handleChangeStatus = async (status) => {
    if (status === activeStatus) return;
    if (!token) return;

    setActiveStatus(status);
    setLoading(true);

    try {
      const res = await api.get(`/api/v1/tagged`, {
        ...authHeaders(token),
        params: { status },
      });

      const list = res.data?.data || [];
      setItems(list);
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Failed to load mentions for this filter."
      );
    } finally {
      setLoading(false);
    }
  };

  // Accept / reject
  const respondToMention = async (item, decision) => {
    if (!token) return;

    // decision: "approved" | "rejected"
    const actionSlug = decision === "approved" ? "approve" : "reject";

    setProcessingId(item.id);
    try {
      await api.post(
        `/api/v1/events/${item.event.id}/performers/respond`,
        {
          action: decision,
        },
        authHeaders(token)
      );

      showSuccess(
        decision === "approved"
          ? "Invitation accepted."
          : "Invitation rejected."
      );

      // Refresh current tab using the status endpoint
      try {
        const res = await api.get(`/api/v1/tagged`, {
          ...authHeaders(token),
          params: { status: activeStatus },
        });
        setItems(res.data?.data || []);
      } catch {
        // ignore secondary failure, user already got a main toast
      }

      // Also refresh grouped, so counts stay accurate
      try {
        const resGrouped = await api.get(
          "/api/v1/tagged/grouped",
          authHeaders(token)
        );
        const data = resGrouped.data?.data || {};
        setGrouped({
          pending: data.pending || [],
          approved: data.approved || [],
          rejected: data.rejected || [],
        });
      } catch {
        // silent
      }
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Could not update this invitation. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="tw:min-h-screen tw:bg-[#f5f5f7] tw:py-6 tw:lg:py-8">
      <div className="tw:mx-auto tw:max-w-5xl tw:px-4 tw:sm:px-6 tw:lg:px-0 tw:pt-20 tw:md:pt-24">
        {/* Header */}
        <div className="tw:mb-6 tw:flex tw:flex-col tw:gap-3 tw:sm:mb-8 tw:sm:flex-row tw:sm:items-end tw:sm:justify-between">
          <div>
            <div className="tw:flex tw:items-center tw:gap-3">
              <div onClick={() => navigate(-1)}>
                <ChevronLeft className="" size={20} />
              </div>

              <span className="tw:text-xl tw:font-semibold tw:text-gray-900 tw:sm:text-2xl">
                Tagged performances
              </span>
            </div>
            <p className="tw:mt-1 tw:max-w-xl tw:text-sm tw:text-gray-500">
              See every event where organisers have tagged you as a performer,
              speaker or special guest. Accept or reject invitations in one
              place.
            </p>
          </div>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-[11px] tw:text-gray-500">
            <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:shadow-sm tw:ring-1 tw:ring-black/5">
              Total pending:
              <span className="tw:ml-1 tw:font-semibold tw:text-primary">
                {counts.pending}
              </span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tw:mb-5 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:inline-flex tw:overflow-hidden tw:rounded-full tw:bg-gray-100 tw:p-1">
            {STATUS_TABS.map((tab) => {
              const isActive = tab.id === activeStatus;
              const count = counts[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleChangeStatus(tab.id)}
                  className={`tw:relative tw:flex tw:items-center tw:gap-1.5 tw:rounded-full! tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-all ${
                    isActive
                      ? "tw:bg-primary tw:text-white tw:shadow-sm"
                      : "tw:text-gray-600 tw:hover:text-gray-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`tw:inline-flex tw:h-4 tw:min-w-[1.4rem] tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] ${
                      isActive
                        ? "tw:bg-white/15 tw:text-white"
                        : "tw:bg-white tw:text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="tw:text-[11px] tw:text-gray-500">
            Status is controlled by your response to each invitation.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="tw:grid tw:gap-4 tw:md:grid-cols-1">
            <MentionShimmerCard />
            <MentionShimmerCard />
            <MentionShimmerCard />
          </div>
        ) : items.length === 0 ? (
          <EmptyState status={activeStatus} />
        ) : (
          <div className="tw:grid tw:gap-4 tw:md:grid-cols-1">
            {items.map((item) => (
              <MentionCard
                key={item.id}
                item={item}
                isProcessing={processingId === item.id}
                onAccept={(mention) => respondToMention(mention, "approved")}
                onReject={(mention) => respondToMention(mention, "rejected")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
