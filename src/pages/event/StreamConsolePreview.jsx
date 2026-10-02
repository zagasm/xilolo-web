import React from "react";
import { useSearchParams } from "react-router-dom";
import HostLiveConsole from "../../component/stream/HostLiveConsole.jsx";
import LiveControlBar from "../../component/stream/LiveControlBar.jsx";

/**
 * DEV-ONLY preview of the host live console.
 *
 * `/event/stream/:eventId` is owner-only AND only shows the console's live state
 * once the host is actually broadcasting — and taking an event live with no
 * ingest is forbidden (a dead "live" event lands in the public feed). So the
 * live state of this console has no other way to be measured or screenshotted.
 * This renders the REAL component (`HostLiveConsole`, same markup that ships)
 * against fixtures: no fetching, no writes, every handler local-only.
 *
 * Registered as /dev/stream-console-preview in src/app.jsx behind
 * import.meta.env.DEV and 404s in production, like /dev/event-preview.
 *
 * ?state=live (default) | upcoming   — switches which console state is shown.
 * ?rt=1                              — force the "Live" realtime indicator.
 */

/* A public HLS ladder used ONLY so the fixture's player really plays (it is the
   only way to measure the player end-to-end: /dev routes are dev-only and the
   host's own feed needs a live broadcast, which is forbidden to fake).
   NOTE: every historical `studios1.b-cdn.net/live/*_master.m3u8` path on this
   account is a 404 today — the VOD retention cleanup removed them (checked
   2026-10-02, 13/13 dead), so a captured Xilolo URL cannot serve as the fixture. */
const FIXTURE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const minutesAgo = (m) => Math.floor(Date.now() / 1000) - m * 60;
const iso = (m) => new Date(Date.now() - m * 60000).toISOString();

function viewer(index, name, userName, options = {}) {
  return {
    id: `preview-user-${index}`,
    name,
    userName,
    profileUrl: "",
    ...options,
  };
}

const LIVE_COMMENTS = [
  {
    id: "preview-comment-4",
    body: "This is exactly what I needed, thank you for breaking it down slowly.",
    is_pinned: true,
    pinned_at: iso(2),
    likes_count: 12,
    replies_count: 1,
    is_event_organizer: false,
    author_role: "viewer",
    created_at: iso(4),
    created_at_unix: minutesAgo(4),
    user: viewer(1, "Miracle Chigozie", "mrgils"),
  },
  {
    id: "preview-comment-3",
    body: "Can you repeat the last chart when you get a moment?",
    is_pinned: false,
    likes_count: 3,
    replies_count: 0,
    is_event_organizer: false,
    author_role: "viewer",
    created_at: iso(3),
    created_at_unix: minutesAgo(3),
    user: viewer(2, "Henry Falolu", "henryfalolu"),
    parent: {
      id: "preview-comment-1",
      user_id: "preview-user-3",
      user: viewer(3, "Adaeze Okonkwo", "adaeze"),
    },
  },
  {
    id: "preview-comment-2",
    body: "Sure — I will go back to it right after this slide.",
    is_pinned: false,
    likes_count: 5,
    replies_count: 0,
    is_event_organizer: true,
    author_role: "organizer",
    created_at: iso(2),
    created_at_unix: minutesAgo(2),
    user: viewer(3, "You", "yourusername"),
  },
  {
    id: "preview-comment-1",
    body: "Joining from Aba, the audio is clear over here.",
    is_pinned: false,
    likes_count: 1,
    replies_count: 2,
    is_event_organizer: false,
    author_role: "viewer",
    created_at: iso(1),
    created_at_unix: minutesAgo(1),
    user: viewer(4, "Ngozi Bell", "ngozibell"),
  },
];

export default function StreamConsolePreview() {
  const [params] = useSearchParams();
  const state = params.get("state") || "live";
  const live = state !== "upcoming";
  const forceRealtime = params.get("rt") === "1";

  return (
    <div className="tw:bg-paper tw:px-3 tw:py-6 tw:md:px-6">
      <div className="tw:mx-auto tw:max-w-[1240px]">
        <div className="tw:mb-4 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.16em] tw:text-gray-500">
          Dev preview — host live console ({live ? "live" : "not started"})
        </div>

        {live ? (
          <LiveControlBar
            statusTone="tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
            isPaused={false}
            showPause
            showEnd
            onJumpToChat={() =>
              document
                .getElementById("live-chat")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            onOpenAnalytics={() => {}}
          />
        ) : null}

        <div className={live ? "tw:mt-6" : ""}>
          <HostLiveConsole
            eventId="preview-event-1"
            token=""
            isLive={live}
            isPaused={false}
            hasStartedStream={live}
            playbackUrl={live ? FIXTURE_HLS : ""}
            canModerate
            fixture={{
              comments: live ? LIVE_COMMENTS : [],
              likesTotal: live ? 47 : 0,
              likedByMe: false,
              viewerCount: live ? 128 : 0,
              realtime: forceRealtime ? "subscribed" : "off",
            }}
          />
        </div>

        {/* Filler: the sticky control bar can only be proven on a page that
            actually scrolls. Nothing below is shipped code. */}
        <div
          data-console-part="scroll-filler"
          className="tw:mt-6 tw:flex tw:h-[1200px] tw:items-start tw:justify-center tw:rounded-4xl tw:border tw:border-dashed tw:border-[#ded6cd] tw:bg-white/60 tw:p-6 tw:text-center tw:text-sm tw:text-gray-400"
        >
          Below the console — scroll down and the control bar stays pinned at the top.
        </div>
      </div>
    </div>
  );
}
