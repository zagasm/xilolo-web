import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EventDetailView from "./EventDetailView.jsx";

/**
 * DEV-ONLY preview of the event detail screen.
 *
 * `/event/view/:eventId` needs a live API + a session, so this renders the REAL
 * presentation component (`EventDetailView`) with fixtures — same markup that ships,
 * measurable and screenshottable at any width without an account.
 * Registered as /dev/event-preview in src/app.jsx behind import.meta.env.DEV and
 * 404s in production, exactly like /dev/home-preview and /dev/tickets-preview.
 *
 * ?state=upcoming (default) | paid-live  — switches the ticket/price state machine.
 * All handlers are no-ops on purpose: a stray click here can never fire a write.
 */

const POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#123C42"/><stop offset="1" stop-color="#16909C"/>
      </linearGradient></defs>
      <rect width="800" height="420" fill="url(#g)"/>
      <circle cx="640" cy="120" r="150" fill="#ffffff" opacity="0.08"/>
      <circle cx="180" cy="330" r="190" fill="#000000" opacity="0.12"/>
    </svg>`
  );

const noop = () => {};

export default function EventPreview() {
  const [params] = useSearchParams();
  const state = params.get("state") || "upcoming";
  const [isFollowing, setIsFollowing] = useState(false);

  const v = useMemo(() => {
    const paidLive = state === "paid-live";
    /* ?state=owner previews the HOST view. Owner-only affordances — the "View stream
       analytics" link, the start-stream bar — could otherwise only be seen by someone who
       owns a real event, which no test account does. */
    const ownerView = state === "owner";
    return {
      event: {
        id: "preview-event-1",
        title: "Lagos Afrobeat Night — Live Band & DJ Set",
        hostImage: "",
      },
      // the route id the owner-only links build their href from
      eventId: "preview-event-1",
      posters: [{ url: POSTER, type: "image" }],
      formattedDateTime: "12th Sep, 2026 - 8:00 PM",
      formattedLocation: "Eko Hotel & Suites, Victoria Island, Lagos",
      priceDisplay: "₦15,000",
      reviewCount: 24,
      reviewAverage: 4.6,
      countdownTarget: novelDate(),
      description:
        "An intimate evening of live Afrobeat, highlife and amapiano with a full band, guest vocalists and a late DJ set. Doors open one hour before showtime.",
      accessLabel: ownerView ? "You are hosting this event" : paidLive ? "Ticket secured" : "Upcoming",
      statusLabel: paidLive ? "Live" : "Upcoming",
      hostName: "Adaeze Okonkwo",
      hostInitials: "AO",
      hostHasImage: false,
      hostAbout:
        "Adaeze has hosted 40+ live music nights across Lagos and Abuja, with a focus on emerging Afrobeat talent.",
      hostHasActiveSubscription: true,
      profileHref: "/organizers",
      isLiveNow: paidLive,
      isPaused: false,
      isEnded: false,
      isSoldOut: false,
      isOwnerEvent: ownerView,
      isVodEvent: false,
      hasPaid: paidLive,
      manualHasAccess: false,
      canWatchVod: false,
      replayEnabled: true,
      hasReplay: true,
      replayIsAvailable: false,
      replayExpired: false,
      replayUrl: "",
      canOpenPurchaseOptions: true,
      canBuyManualOnly: false,
      canSponsorOwnEvent: ownerView,
      viewerHasSponsoredTickets: false,
      shouldChoosePurchaseType: true,
      primaryCtaLabel: "Buy Ticket",
      ctaDisabled: false,
      startingStream: false,
      followLoading: false,
      isFollowing,
      isSaved: false,
      ownerStreamLabel: "Start stream",
      sponsoredNode: (
        <div className="tw:mt-5 tw:px-4">
          <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
            Sponsored Tickets
          </div>
          <div className="tw:mt-2.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
            <div className="tw:text-sm tw:font-bold tw:text-body">
              <span className="tw:font-bold tw:text-accent-deep">@tunde_beats</span> bought tickets
              for others for this event.
            </div>
            <div className="tw:mt-1 tw:text-[12px] tw:leading-[1.6] tw:text-muted">
              You can grab one of the free tickets, get your own ticket, or chip in to buy for
              others!
            </div>
            <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <span className="tw:rounded-full tw:bg-accent-soft tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-accent-deep">
                5 available
              </span>
              <span className="tw:rounded-full tw:border tw:border-hairline tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-body">
                @tunde_beats
              </span>
              <span className="tw:rounded-full tw:border tw:border-hairline tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-body">
                @amaka
              </span>
            </div>
          </div>
        </div>
      ),
      manualNode: (
        <div className="tw:mt-5 tw:px-4">
          <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
            Event Manual
          </div>
          <div className="tw:mt-2.5 tw:flex tw:items-start tw:gap-3 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
            <div className="tw:flex tw:h-[72px] tw:w-[58px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-[#E9E9EC]">
              <span className="tw:text-lg">📘</span>
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:text-sm tw:font-bold tw:text-body">Afrobeat Night Programme</div>
              <div className="tw:mt-1 tw:text-[12px] tw:font-medium tw:text-[#6B7280]">
                Available for ₦2,500.
              </div>
              <div className="tw:mt-2.5 tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:bg-[#16909C] tw:text-[13px] tw:font-bold tw:text-white">
                Buy Manual
              </div>
            </div>
          </div>
        </div>
      ),
      replayNode: (
        <div className="tw:px-4">
          <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
            Replay
          </div>
          <div className="tw:mt-2.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
            <div className="tw:text-sm tw:font-bold tw:text-body">
              Replay will be available soon
            </div>
            <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
              Replay is scheduled but not available yet.
            </div>
            <div className="tw:mt-2 tw:text-[12px] tw:font-semibold tw:text-body">
              Available at 13 Sep, 2026 9:30 PM
            </div>
          </div>
        </div>
      ),
      vodNode: null,
      reviewsNode: (
        <div className="tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5 tw:text-[13px] tw:text-muted">
          Review list renders here in production (EventReviewsSection).
        </div>
      ),
      onBack: noop,
      onShare: noop,
      onToggleFollow: () => setIsFollowing((s) => !s),
      onOwnerStreamAction: noop,
      onPrimaryAction: noop,
      onOpenPurchaseOptions: noop,
      onGetTicket: noop,
      onWatchVod: noop,
      onReport: noop,
    };
  }, [state, isFollowing]);

  return (
    <div className="tw:bg-paper">
      <EventDetailView v={v} />
    </div>
  );
}

function novelDate() {
  return Date.now() + 1000 * 60 * 60 * 52;
}
