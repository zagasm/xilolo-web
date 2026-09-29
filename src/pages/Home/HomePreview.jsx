/**
 * /dev/home-preview — DEV-ONLY preview of the signed-in home (/feed).
 *
 * WHY IT EXISTS: /feed sits behind the auth gate, so the real page cannot be
 * screenshotted or measured without an account, and "it looks fine" could not be
 * checked at all. This route renders the REAL presentation components from
 * ./index.jsx (HomeHeader, WalletStrip, TabPill, HeroFeedCard, LiveFeedCard,
 * HeroSkeleton, FeedGrid, CtaButton) with hardcoded mock events, inside the REAL
 * shell (the same Navbar, the same page offset, the same .home-feed-shell).
 *
 * It is registered in App.jsx behind `import.meta.env.DEV`, so it 404s in
 * production and cannot affect any shipped behaviour. It is intentionally kept:
 * it is how a human (or the next agent) verifies this page's layout at 1440,
 * 1024 and 390 without signing in.
 *
 * Query options:
 *   /dev/home-preview                 All tab, 4 mock events
 *   /dev/home-preview?tab=live        Live tab (live cards + paid state)
 *   /dev/home-preview?state=loading   shimmer skeletons
 *   /dev/home-preview?state=empty     empty state
 *   /dev/home-preview?state=error     error state
 *   /dev/home-preview?chip=1          side-by-side check for defect 4: it mounts
 *                                     the REAL <WalletBalanceChip> the shell puts
 *                                     in the Navbar and prints whether the
 *                                     /feed rule hides it (exactly one balance).
 *   /dev/home-preview?organizers=1    the REAL "Organizers you may know" rail
 *                                     (component/Organizers/ForMobile/OrganisersForYou.jsx)
 *                                     with fixtures, in its real position below
 *                                     the grid — the section is otherwise only
 *                                     visible on the auth-gated /feed after a
 *                                     scroll (pages/Home/index.jsx `showOrganizers`).
 *   /dev/home-preview?organizers=1&orgstate=loading
 *                                     the app's 3-card shimmer state.
 */
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarX2, VideoOff } from "lucide-react";

import SEO from "../../component/SEO";
import Navbar from "../pageAssets/Navbar";
import WalletBalanceChip from "../../features/wallet/components/WalletBalanceChip";
import { Button, EmptyState } from "../../component/ui";
import {
  FeedGrid,
  HeroFeedCard,
  HeroSkeleton,
  HOME_CONTAINER,
  HomeHeader,
  InlineErrorCard,
  LiveFeedCard,
  OrganizersRailHeading,
} from "./index.jsx";
import MobileSingleOrganizers from "../../component/Organizers/ForMobile/OrganisersForYou";

/* Organisers fixture for the preview only (?organizers=1). Field names mirror
   the real payload (xilolo backend app/Http/Resources/OrganiserResource.php):
   organiser, userName, userId, profileImage, numberOfFollowers, tickets_total,
   has_active_subscription, plan, isFollowing. It deliberately covers the card's
   branches: photo vs initials (a null profileImage), verified vs not, following
   vs not, 0 / K / M follower bands, a numeric tickets count and the public
   milestone label string. */
const MOCK_ORGANISERS = [
  {
    id: "mock-org-1",
    userId: "mock-user-1",
    organiser: "Ada Obi",
    userName: "ada_obi",
    profileImage: "/images/photos/art.jpg",
    numberOfFollowers: 12400,
    tickets_total: 9,
    has_active_subscription: true,
    isFollowing: false,
  },
  {
    id: "mock-org-2",
    userId: "mock-user-2",
    organiser: "Emeka Nwosu",
    userName: "emekan",
    profileImage: null,
    numberOfFollowers: 980,
    tickets_total: "Under 1,000 tickets sold",
    has_active_subscription: false,
    isFollowing: true,
  },
  {
    id: "mock-org-3",
    userId: "mock-user-3",
    organiser: "Halima Bello",
    userName: "halimab",
    profileImage: "/images/photos/first.jpg",
    numberOfFollowers: 1250000,
    tickets_total: 2400,
    has_active_subscription: true,
    isFollowing: false,
  },
  {
    id: "mock-org-4",
    userId: "mock-user-4",
    organiser: "Tunde Adebayo",
    userName: "tunde",
    profileImage: "",
    numberOfFollowers: 0,
    tickets_total: 0,
    has_active_subscription: false,
    plan: { id: "mock-plan", name: "Pro" },
    isFollowing: false,
  },
  {
    id: "mock-org-5",
    userId: "mock-user-5",
    organiser: "Ngozi Umeh",
    userName: "ngoziu",
    profileImage: "null",
    numberOfFollowers: 5400,
    tickets_total: 1500000,
    has_active_subscription: true,
    isFollowing: true,
  },
];

/* Mock events — fixtures for the preview only, never rendered in production.
   Deliberately covers every `_resolveCta` branch: live ("Watch live now"), paid
   ("Buy Ticket"), free ("Reserve free seat"), ended + replay ("Watch replay"),
   already paid ("Ticket Purchased") and a poster-less card (gradient fallback).
   `poster`/`price`/`status` shapes mirror what /api/v1/events/all/get returns. */
const MOCK_EVENTS = [
  {
    id: "mock-live-1",
    title: "lagos tech summit — day two",
    status: "live",
    hostName: "Ada Obi",
    hostHasActiveSubscription: true,
    poster: [{ url: "/images/photos/livemusic.jpg", type: "image" }],
    price: "₦15,000",
    eventDate: "2026-09-20",
    startTime: "19:00",
  },
  {
    id: "mock-paid-1",
    title: "afrobeats night with the lagos philharmonic",
    status: "upcoming",
    hostName: "Emeka Nwosu",
    hostHasActiveSubscription: true,
    poster: [{ url: "/images/photos/first.jpg", type: "image" }],
    price: "₦7,500",
    eventDate: "2026-11-12",
    startTime: "20:00",
  },
  {
    id: "mock-free-1",
    title: "creators in abuja: free community meetup",
    status: "upcoming",
    hostName: "Halima Bello",
    poster: [],
    price: "Free",
    eventDate: "2026-11-20",
    startTime: "17:30",
  },
  {
    id: "mock-poster-1",
    title: "studio lighting workshop (with poster)",
    status: "upcoming",
    hostName: "Tunde Adebayo",
    poster: [{ url: "/images/photos/art.jpg", type: "image" }],
    price: "₦3,000",
    eventDate: "2026-12-01",
    startTime: "18:00",
  },
];

const MOCK_LIVE_EVENTS = [
  MOCK_EVENTS[0],
  {
    id: "mock-live-paid",
    title: "paystack product clinic — live",
    status: "live",
    hostName: "Ngozi Umeh",
    hostHasActiveSubscription: true,
    poster: [{ url: "/images/photos/third.jpg", type: "image" }],
    price: "₦5,000",
    eventDate: "2026-09-22",
    startTime: "16:00",
    hasPaid: true,
  },
  {
    id: "mock-live-3",
    title: "replay: product builders salon",
    status: "ended",
    enableReplay: true,
    hostName: "Kwame Mensah",
    poster: [{ url: "/images/photos/second.jpg", type: "image" }],
    price: "₦2,000",
    eventDate: "2026-09-10",
    startTime: "18:00",
  },
];

/** Shows whether the shell's own balance chip is hidden here (defect 4). */
function ChipProbe() {
  const ref = useRef(null);
  const [readout, setReadout] = useState("measuring…");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chip = el.querySelector('a[href="/account/wallet"]');
    if (!chip) {
      setReadout("chip node missing");
      return;
    }
    const visible = getComputedStyle(chip).display !== "none" && chip.offsetParent !== null;
    setReadout(
      visible
        ? "shell chip VISIBLE — two balances on this route"
        : "shell chip hidden — exactly one balance on this route",
    );
  }, []);

  return (
    <div
      ref={ref}
      className="tw:fixed tw:bottom-3 tw:right-3 tw:z-[9999] tw:flex tw:max-w-[320px] tw:flex-col tw:gap-1 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[11px] tw:text-body"
    >
      <span className="tw:font-bold">dev-only: shell wallet chip (defect 4)</span>
      <WalletBalanceChip />
      <span>{readout}</span>
    </div>
  );
}

export default function HomePreview() {
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "live" ? "live" : "all";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [moreEvent, setMoreEvent] = useState(null);
  const showChipProbe = params.get("chip") === "1";
  const showOrganizers = params.get("organizers") === "1";
  const orgLoading = params.get("orgstate") === "loading";
  const state = params.get("state") || "";

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const liveCount = MOCK_LIVE_EVENTS.filter((e) => e.status === "live").length;

  return (
    <>
      <SEO title="Home preview (dev) - Xilolo" noIndex />

      {/* The real shell, so the greeting-vs-Navbar geometry is production-true. */}
      <Navbar />

      <div className="tw:w-full tw:bg-paper tw:pt-24 tw:font-sans">
        <div className="home-feed-shell">
          <HomeHeader
            firstName="Ada"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            liveCount={liveCount}
          />

          <div className="home-feed tw-no-scrollbar">
            <div className={`${HOME_CONTAINER} tw:pt-3 tw:pb-7`}>
              {state === "error" && activeTab === "all" ? (
                <div className="tw:mb-4">
                  <InlineErrorCard
                    message="Network error. Please try again later."
                    onRetry={() => {}}
                  />
                </div>
              ) : null}

              <FeedGrid>
                {state === "loading" ? (
                  <>
                    <HeroSkeleton />
                    <HeroSkeleton />
                    <HeroSkeleton />
                    <HeroSkeleton />
                  </>
                ) : null}

                {state === "empty" ? (
                  <div className="tw:col-span-full">
                    <EmptyState
                      icon={activeTab === "live" ? VideoOff : CalendarX2}
                      title={
                        activeTab === "live"
                          ? "No live events available"
                          : "No events available"
                      }
                      body="Events will appear here once they are available. Please check back soon."
                    />
                  </div>
                ) : null}

                {state === "error" ? (
                  <div className="tw:col-span-full">
                    <EmptyState
                      icon={CalendarX2}
                      title="Can't load events right now"
                      body="Network error. Please try again later."
                      action={
                        <Button variant="primary" size="md" onClick={() => {}}>
                          Retry
                        </Button>
                      }
                    />
                  </div>
                ) : null}

                {!state && activeTab === "live"
                  ? MOCK_LIVE_EVENTS.map((event) => (
                      <LiveFeedCard
                        key={event.id}
                        event={event}
                        onMore={() => setMoreEvent(event.id)}
                      />
                    ))
                  : null}

                {!state && activeTab === "all"
                  ? MOCK_EVENTS.map((event) => (
                      <HeroFeedCard key={event.id} event={event} />
                    ))
                  : null}

                <div className="tw:col-span-full tw:mt-2 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[11px] tw:text-muted-strong">
                  <span className="tw:block">
                    DEV-ONLY preview (import.meta.env.DEV). Renders the real /feed
                    presentation with mock events and no API calls. Tab: {activeTab}
                    {moreEvent ? ` · last "more" tap: ${moreEvent}` : ""}
                  </span>
                </div>
              </FeedGrid>

              {/* ?organizers=1 — the real rail from the signed-in home with the
                  fixture above. `orgstate=loading` shows the app's 3-card shimmer.
                  Placement matches /feed: below the grid, inside HOME_CONTAINER. */}
              {showOrganizers ? (
                <div className="tw:mt-12">
                  <OrganizersRailHeading />
                  <MobileSingleOrganizers
                    previewOrganisers={orgLoading ? [] : MOCK_ORGANISERS}
                    previewLoading={orgLoading}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showChipProbe ? <ChipProbe /> : null}
    </>
  );
}
