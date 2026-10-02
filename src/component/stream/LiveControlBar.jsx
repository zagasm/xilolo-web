import React from "react";
import {
  BarChart3,
  LoaderCircle,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Square,
} from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

/**
 * The host's pinned control bar, shown only while an event is actually on air
 * (live or paused). It sticks to the top of the scroll container so Pause,
 * Resume, End, Chat and Analytics stay reachable however far down the console
 * the host has scrolled — the point of the "everything must stay in reach"
 * brief, and the reason it is a separate component: `/dev/stream-console-preview`
 * renders it too, so its stickiness is measurable without taking an event live.
 *
 * `stick` is the class that pins it. The preview passes the same value the real
 * page uses, so what is measured is what ships.
 */
export const LIVE_CONTROL_BAR_STICKY_CLASS = "tw:sticky tw:top-2 tw:z-30";

export default function LiveControlBar({
  statusTone = "",
  isPaused = false,
  showPause = false,
  showEnd = false,
  pendingAction = "",
  onTogglePause,
  onEnd,
  onJumpToChat,
  onOpenAnalytics,
}) {
  return (
    <div
      data-console-part="sticky-controls"
      className={cx(
        LIVE_CONTROL_BAR_STICKY_CLASS,
        "tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-white/95 tw:px-4 tw:py-3 tw:shadow-md tw:backdrop-blur",
      )}
    >
      <span
        className={cx(
          "tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold",
          statusTone,
        )}
      >
        <span className="tw:h-2.5 tw:w-2.5 tw:rounded-full tw:bg-current" />
        {isPaused ? "Paused" : "Live"}
      </span>

      <span className="tw:hidden tw:text-sm tw:text-gray-600 tw:sm:inline">
        {isPaused
          ? "Viewers are seeing your pause screen."
          : "You are on air — the controls stay here as you scroll."}
      </span>

      <div className="tw:ml-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <button
          type="button"
          onClick={onJumpToChat}
          className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-3 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:border-gray-400"
        >
          <MessageCircle className="tw:h-4 tw:w-4" />
          Chat
        </button>

        <button
          type="button"
          onClick={onOpenAnalytics}
          className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-white tw:px-3 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:border-gray-400"
        >
          <BarChart3 className="tw:h-4 tw:w-4" />
          Analytics
        </button>

        {showPause ? (
          <button
            type="button"
            onClick={onTogglePause}
            disabled={pendingAction === "pause"}
            className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-accent tw:px-4 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-accent-deep tw:disabled:opacity-60"
          >
            {pendingAction === "pause" ? (
              <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
            ) : isPaused ? (
              <PlayCircle className="tw:h-4 tw:w-4" />
            ) : (
              <PauseCircle className="tw:h-4 tw:w-4" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </button>
        ) : null}

        {showEnd ? (
          <button
            type="button"
            onClick={onEnd}
            disabled={pendingAction === "end"}
            className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-gray-900 tw:px-4 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-black tw:disabled:opacity-60"
          >
            <Square className="tw:h-4 tw:w-4" />
            End stream
          </button>
        ) : null}
      </div>
    </div>
  );
}
