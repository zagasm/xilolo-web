import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Copy,
  Facebook,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { getChannelLabel, normalizeChannelName } from "../../features/eventShare/shareUtils";

const CHANNEL_ICON_MAP = {
  copy_link: Copy,
  whatsapp: MessageCircle,
  telegram: Send,
  linkedin: Linkedin,
  x: FaXTwitter,
  facebook: Facebook,
  email: Mail,
};

function ShareModalSkeleton() {
  return (
    <div className="tw:space-y-4 tw:animate-pulse">
      <div className="tw:h-24 tw:rounded-3xl tw:bg-slate-100" />
      <div className="tw:h-4 tw:w-2/3 tw:rounded-full tw:bg-slate-100" />
      <div className="tw:h-3 tw:w-full tw:rounded-full tw:bg-slate-100" />
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="tw:h-14 tw:rounded-2xl tw:bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

function ChannelButton({ channel, onClick }) {
  const channelKey = normalizeChannelName(channel?.key);
  const Icon = CHANNEL_ICON_MAP[channelKey] || LinkIcon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(channel)}
      className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-[#ffffff] tw:px-4 tw:py-3 tw:text-left tw:transition tw:hover:border-primary/30 tw:hover:bg-primary/5"
    >
      <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-slate-100 tw:text-slate-700">
        <Icon className="tw:h-4 tw:w-4" />
      </span>
      <span className="tw:flex-1">
        <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
          {getChannelLabel(channel)}
        </span>
        <span className="tw:block tw:text-xs tw:text-slate-500">
          Share through {getChannelLabel(channel)}
        </span>
      </span>
    </button>
  );
}

export default function EventShareModal({
  open,
  onClose,
  payload,
  loading = false,
  error = null,
  onRetry,
  onCopyLink,
  onChannelClick,
  title = "Share this event",
}) {
  const [copied, setCopied] = useState(false);
  const channels = Array.isArray(payload?.channels) ? payload.channels : [];
  const hasShareUrl = Boolean(payload?.url);
  const sharePreviewText = payload?.text || payload?.url || "";

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    setCopied(false);
  }, [payload?.url]);

  useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await onCopyLink?.();
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-slate-950/45 tw:backdrop-blur-sm" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto tw:p-4">
          <div className="tw:flex tw:min-h-full tw:items-end tw:justify-center tw:md:items-center">
            <Transition.Child
              as={Fragment}
              enter="tw:transition tw:duration-200 tw:ease-out"
              enterFrom="tw:opacity-0 tw:translate-y-6 tw:md:translate-y-0 tw:md:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:md:scale-100"
              leave="tw:transition tw:duration-150 tw:ease-in"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:md:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-6 tw:md:translate-y-0 tw:md:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-xl tw:overflow-hidden tw:rounded-[30px] tw:bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] tw:shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
                <div className="tw:flex tw:items-center tw:justify-between tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <span className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary">
                      <Share2 className="tw:h-5 tw:w-5" />
                    </span>
                    <div>
                      <span className="tw:block tw:text-xl tw:font-semibold tw:text-slate-900">
                        {title}
                      </span>
                      <p className="tw:text-sm tw:text-slate-500">
                        Choose how you want to share this event.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-slate-600 transition tw:hover:bg-slate-200"
                    aria-label="Close share dialog"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:max-h-[78vh] tw:overflow-y-auto tw:px-5 tw:py-5">
                  {loading ? (
                    <ShareModalSkeleton />
                  ) : error ? (
                    <div className="tw:rounded-[26px] tw:border tw:border-red-100 tw:bg-red-50 tw:p-5">
                      <p className="tw:text-sm tw:font-medium tw:text-red-700">
                        We couldn&apos;t prepare the share link right now.
                      </p>
                      <p className="tw:mt-2 tw:text-sm tw:text-red-600">
                        {error?.response?.data?.message ||
                          error?.message ||
                          "Please try again in a moment."}
                      </p>
                      <div className="tw:mt-4">
                        <button
                          type="button"
                          onClick={onRetry}
                          className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="tw:space-y-5">

                      {hasShareUrl && (
                        <div className="tw:rounded-[24px] tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4">
                          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                            Share Link
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between">
                            <div className="tw:mt-2 tw:break-all tw:text-sm tw:text-slate-700">
                            {payload.url}
                          </div>
                          <button
                            style={{
                              borderRadius: 16,
                              marginTop: 10
                            }}
                            type="button"
                            onClick={handleCopyLink}
                            className="tw:mt-4 tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                          >
                            <Copy className="tw:h-4 tw:w-4" />
                            {copied ? "Copied" : "Copy link"}
                          </button>
                          </div>
                          
                        </div>
                      )}

                      {channels.length > 0 && (
                        <div className="tw:space-y-3">
                          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                            Share To
                          </div>
                          <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2">
                            {channels.map((channel) => (
                              <ChannelButton
                                key={`${channel.key}-${channel.link || channel.name}`}
                                channel={channel}
                                onClick={onChannelClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasShareUrl && channels.length === 0 && (
                        <div className="tw:rounded-[24px] tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4 tw:text-sm tw:text-slate-600">
                          Share options are not available for this event right now.
                        </div>
                      )}
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
