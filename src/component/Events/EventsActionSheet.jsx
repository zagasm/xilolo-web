// src/component/EventsActionSheet/index.jsx (or wherever this lives)
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import { showSuccess, showError, showPromise } from "../../component/ui/toast";
import {
  Heart,
  Share2,
  TriangleAlert,
  X,
  Link as LinkIcon,
  Shield,
  Ticket,
} from "lucide-react";
import SubscriptionBadge from "../ui/SubscriptionBadge.jsx";

const REASONS = [
  "Spam",
  "Inappropriate content",
  "Scam or fraud",
  "Harassment or bullying",
  "Hate speech",
  "Misinformation",
  "Impersonation",
  "Violence or dangerous acts",
  "Illegal activity",
  "Other",
];

const CHANNEL_ICON = {
  whatsapp: "/images/icons/whatsapp.png",
  facebook: "/images/icons/facebook.png",
  x: "/images/icons/x.png",
  linkedIn: "/images/icons/linkedin.png",
  telegram: "/images/icons/telegram.png",
  copy_link: null,
};

function firstImageFromPosterLocal(poster = []) {
  const arr = Array.isArray(poster) ? poster : [];
  const img = arr.find((p) => p?.type === "image" && p?.url);
  return img?.url || "/images/event-dummy.jpg";
}

function ActionCard({ icon, title, subtitle, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tw:w-full tw:text-left`}
    >
      <div
        className={`tw:w-full tw:flex tw:items-center tw:gap-3 tw:px-2 tw:py-3 tw:bg-[#f1f3f5] tw:rounded-lg tw:shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${
          danger ? "tw:text-red-600" : "tw:text-black"
        }`}
      >
        <span className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-white">
          {icon}
        </span>

        <div className="tw:flex-1 tw:flex tw:flex-col">
          <span className="tw:text-xs tw:sm:text-sm tw:font-semibold">
            {title}
          </span>
          {subtitle && (
            <span className="tw:text-[10px] tw:sm:text-xs tw:text-zinc-500">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function EventActionsSheet({
  open,
  onClose,
  event = {},
  onEventReported,
  onSaveChange,
}) {
  const { token: ctxToken } = useAuth();
  const token =
    ctxToken ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    "";

  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(!!event?.is_saved);
  const [followed, setFollowed] = useState(!!event?.is_following_organizer);

  React.useEffect(() => {
    setSaved(!!event?.is_saved);
  }, [event?.id, event?.is_saved, open]);

  React.useEffect(() => {
    setFollowed(!!event?.is_following_organizer);
  }, [event?.id, event?.is_following_organizer, open]);

  const [shareState, setShareState] = useState({
    loading: false,
    channels: null,
    error: null,
  });

  const [reporting, setReporting] = useState(false);
  const [selectedReason, setSelectedReason] = useState("Spam");

  const hostId =
    event?.organiserUserId ||
    event?.hostId ||
    event?.organiserId ||
    event?.organiser_id;
  const hostName = event?.hostName || "Organizer";
  const hostImage = event?.hostImage;
  const posterUrl = firstImageFromPosterLocal(event?.poster);

  async function onToggleSave() {
    if (!event?.id) return;
    setBusy(true);
    const nextSaved = !saved;
    try {
      await showPromise(
        api.post(`/api/v1/events/${event.id}/toggle`, {}, authHeaders(token)),
        {
          loading: nextSaved ? "Saving…" : "Unsaving…",
          success: nextSaved ? "Event saved" : "Event removed from saved",
          error: "Could not toggle save",
        }
      );
      setSaved(nextSaved);
      if (onSaveChange) {
        onSaveChange(event.id, nextSaved);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!event?.id) return;

    setShareState({ loading: true, channels: null, error: null });

    try {
      const res = await api.get(
        `/api/v1/event/share/${event.id}`,
        authHeaders(token)
      );

      // NEW SHAPE: channels is top-level
      const channels = res?.data?.channels || [];

      setShareState({
        loading: false,
        channels,
        error: null,
      });
    } catch (e) {
      console.error(e);
      setShareState({
        loading: false,
        channels: null,
        error: "Failed to load share channels.",
      });
      showError("Failed to load share channels.");
    }
  }

  function openShareLink(ch) {
    try {
      const fullLink = ch?.link; // already correct from backend

      if (!fullLink) {
        showError("Share link not available.");
        return;
      }

      if (ch?.key === "copy_link") {
        navigator.clipboard.writeText(fullLink);
        showSuccess("Link copied!");
        return;
      }

      window.open(fullLink, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      showError("Could not open share link.");
    }
  }

  async function onReport() {
    if (!event?.id) return;
    setBusy(true);
    try {
      await showPromise(
        api.post(
          `/api/v1/report/register`,
          {},
          {
            ...authHeaders(token),
            params: {
              reportable_type: "event",
              reportable_id: event.id,
              reason: selectedReason,
            },
          }
        ),
        {
          loading: "Submitting report…",
          success: "Thanks, your report was submitted.",
          error: "Could not submit report.",
        }
      );

      setReporting(false);

      if (onEventReported && event.id) {
        onEventReported(event.id);
      }

      onClose();
    } finally {
      setBusy(false);
    }
  }

  // adjust URL to your real block endpoint
  async function onBlockOrganiser() {
    if (!hostId) return;
    setBusy(true);
    try {
      const payload = {
        blockable_type: "user",
        blockable_id: hostId,
      };

      await showPromise(
        api.post(`/api/v1/blockUserOrEvent`, payload, authHeaders(token)),
        {
          loading: "Blocking organizer…",
          success: "Organizer blocked successfully.",
          error: "Could not block organizer.",
        }
      );
      onClose();
    } catch (e) {
      console.error("Block error", e);
    } finally {
      setBusy(false);
    }
  }

  function resetShare() {
    setShareState({ loading: false, channels: null, error: null });
  }

  const isMainView = !shareState.channels && !reporting;

  const goToHostProfile = (e) => {
    e?.stopPropagation?.();
    if (!hostId) return;
    navigate(`/profile/${hostId}`);
    onClose?.();
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog
        as="div"
        className="tw:relative tw:z-50"
        onClose={() => !busy && onClose()}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
        </Transition.Child>

        {/* Panel */}
        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto tw:font-sans">
          <div className="tw:flex tw:min-h-full tw:items-end tw:md:items-center tw:justify-center tw:p-0 tw:pb-16 tw:md:pb-0 tw:md:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:transition tw:duration-200 tw:ease-out"
              enterFrom="tw:opacity-0 tw:translate-y-[20%] tw:md:translate-y-0 tw:md:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:md:scale-100"
              leave="tw:transition tw:duration-150 tw:ease-in"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:md:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-[20%] tw:md:translate-y-0 tw:md:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-md tw:bg-white tw:shadow-xl tw:rounded-t-2xl tw:md:rounded-2xl tw:overflow-hidden tw:flex tw:flex-col tw:max-h-[80vh]">
                {/* Close button */}
                <div className="tw:flex tw:justify-end">
                  <button
                    className=" tw:p-2 tw:rounded-full! tw:bg-white tw:hover:bg-gray-100 tw:z-999"
                    onClick={() => !busy && onClose()}
                    aria-label="Close"
                  >
                    <X className="tw:size-5" />
                  </button>
                </div>

                {/* Header: event + host */}
                <div className="tw:px-4 tw:pt-4 tw:pb-3 tw:border-b tw:border-zinc-100">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:size-12 tw:rounded-xl tw:overflow-hidden tw:bg-zinc-200 tw:shrink-0">
                      <img
                        src={posterUrl}
                        alt={event?.title || "Event"}
                        className="tw:w-full tw:h-full tw:object-cover"
                      />
                    </div>

                    <div className="tw:flex tw:flex-col tw:gap-1 tw:min-w-0">
                      <span className="tw:text-sm tw:sm:text-lg tw:font-semibold tw:text-black tw:truncate tw:uppercase">
                        {event?.title || "Event"}
                      </span>

                      <button
                        type="button"
                        onClick={goToHostProfile}
                        className="tw:flex tw:items-center tw:gap-1 tw:min-w-0 tw:text-left"
                      >
                        {hostImage ? (
                          <img
                            src={hostImage}
                            alt={hostName}
                            className="tw:w-4 tw:h-4 tw:rounded-full tw:object-cover tw:ring-2 tw:ring-white"
                          />
                        ) : (
                          <div className="tw:w-4 tw:h-4 tw:rounded-full tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:text-[11px] tw:font-medium tw:text-primary">
                            {hostName?.[0]?.toUpperCase() || "O"}
                          </div>
                        )}

                        <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-black tw:truncate">
                          <span className="tw:truncate">{hostName}</span>
                          {!!event?.hostHasActiveSubscription && (
                            <SubscriptionBadge className="tw:size-3.5" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable body */}
                <div className="tw:flex-1 tw:overflow-y-auto tw:px-4 tw:py-4 tw:space-y-4">
                  {/* Main actions */}
                  {isMainView && (
                    <div className="tw:flex tw:flex-col tw:gap-3">
                      <ActionCard
                        title="Buy Ticket"
                        subtitle="Purchase your ticket and watch live."
                        onClick={() => {
                          if (event?.id) navigate(`/event/view/${event.id}`);
                          onClose();
                        }}
                        icon={<Ticket className="tw:size-5" />}
                      />

                      <ActionCard
                        title={saved ? "Unsave Event" : "Save Event"}
                        subtitle="Add this event to your saved list."
                        onClick={onToggleSave}
                        icon={
                          <Heart
                            className={`tw:size-5 ${
                              saved ? "tw:fill-current tw:text-primary" : ""
                            }`}
                          />
                        }
                      />

                      <ActionCard
                        title="Share Event"
                        subtitle="Share via WhatsApp, Instagram, X, Copy Link, etc."
                        onClick={onShare}
                        icon={<Share2 className="tw:size-5 tw:text-primary" />}
                      />

                      <ActionCard
                        title="Report Event"
                        subtitle="Report issues like scam, inappropriate content, wrong information."
                        onClick={() => setReporting(true)}
                        danger
                        icon={
                          <TriangleAlert className="tw:size-5 tw:text-red-500" />
                        }
                      />

                      <ActionCard
                        title="Block Organizer"
                        subtitle="Stop seeing content from this organizer."
                        onClick={onBlockOrganiser}
                        danger
                        icon={<Shield className="tw:size-5 tw:text-red-500" />}
                      />
                    </div>
                  )}

                  {/* Share view */}
                  {shareState.channels && (
                    <div className="tw:space-y-3">
                      <div className="tw:flex tw:items-center tw:justify-between">
                        <p className="tw:text-sm tw:text-gray-600">Share via</p>
                        <button
                          className="tw:text-sm tw:text-gray-500 tw:underline"
                          onClick={resetShare}
                        >
                          Back
                        </button>
                      </div>

                      <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:pb-2">
                        {shareState.channels.map((ch) => {
                          const iconSrc = CHANNEL_ICON[ch.key];
                          return (
                            <button
                              key={ch.key}
                              className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:p-3 tw:bg-[#F9FAFB] tw:border tw:border-gray-100 tw:rounded-xl! tw:hover:bg-gray-50"
                              onClick={() => openShareLink(ch)}
                            >
                              {iconSrc ? (
                                <img
                                  src={iconSrc}
                                  alt={ch.name}
                                  className="tw:size-10 tw:rounded"
                                />
                              ) : (
                                <div className="tw:flex tw:items-center tw:justify-center tw:size-10 tw:rounded tw:bg-gray-100">
                                  <LinkIcon className="tw:size-5 tw:text-gray-700" />
                                </div>
                              )}
                              <span className="tw:text-xs">{ch.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Report view */}
                  {reporting && (
                    <div className="tw:space-y-3">
                      <div className="tw:flex tw:items-center tw:justify-between">
                        <p className="tw:text-sm tw:text-gray-600">
                          Select a reason
                        </p>
                        <button
                          className="tw:text-sm tw:text-gray-500 tw:underline"
                          onClick={() => setReporting(false)}
                        >
                          Back
                        </button>
                      </div>

                      <div className="tw:max-h-56 tw:overflow-y-auto tw:space-y-2">
                        {REASONS.map((r) => (
                          <label
                            key={r}
                            className={`tw:flex tw:items-center tw:gap-3 tw:p-2 tw:border tw:rounded-xl ${
                              selectedReason === r
                                ? "tw:border-primary tw:bg-lightPurple/50"
                                : "tw:border-gray-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="report-reason"
                              className="tw:size-4"
                              checked={selectedReason === r}
                              onChange={() => setSelectedReason(r)}
                            />
                            <span className="tw:text-sm tw:ml-1.5">{r}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        disabled={busy}
                        onClick={onReport}
                        className="tw:w-full tw:bg-primary tw:text-white tw:rounded-xl! tw:py-3 tw:font-medium tw:disabled:opacity-60"
                      >
                        {busy ? "Submitting…" : "Submit Report"}
                      </button>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
