import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import SEO from "../../../component/SEO";
import { Helmet } from "react-helmet-async";
import { api, authHeaders } from "../../../lib/apiClient";
import { showSuccess, showError, showPromise } from "../../../component/ui/toast";
import EventReviewsSection from "../../../component/Events/EventReviewsSection.jsx";
import ReportModal from "../../../component/Events/ReportModal";
import LiveAppDownloadModal from "../../../component/Events/LiveAppDownloadModal";
import SubscriptionBadge from "../../../component/ui/SubscriptionBadge.jsx";
import { formatEventDateTime } from "../../../utils/ui";
import { useAuth } from "../../auth/AuthContext";
import {
  eventStartDate,
  formatMetaLine,
  priceText,
} from "../../../component/Events/SingleEvent";
import {
  CalendarDays,
  Share2,
  Flag,
  ArrowLeft,
  Ticket,
  MapPin,
  Clock,
  Star,
  Upload,
  Video,
} from "lucide-react";
import EventShareModal from "../../../component/Events/EvenetShareModal";
import TicketPromptModal from "../../../component/Events/TicketPromptModal";
import Countdown from "react-countdown";
import FundWalletModal from "../../../features/wallet/components/FundWalletModal";
import TicketPurchaseSuccessModal from "../../../features/wallet/components/TicketPurchaseSuccessModal";
import WalletFundingRequiredModal from "../../../features/wallet/components/WalletFundingRequiredModal";
import { useEventShareFlow } from "../../../features/eventShare/hooks/useEventShareFlow";
import { normalizeEventRecord } from "../../../features/eventShare/shareUtils";
import {
  useClaimSponsoredTicket,
  usePurchaseTicketWithWallet,
} from "../../../features/wallet/hooks/usePurchaseTicketWithWallet";
import {
  clearPendingPurchaseIntent,
  setPendingPurchaseIntent,
} from "../../../features/wallet/store/walletFlowSlice";
import {
  formatWalletMoney,
  getApiErrorCode,
  getApiErrorMessage,
  getFundingRequiredDetails,
} from "../../../features/wallet/walletUtils";
import ReplayUploadModal from "../../../component/Events/ReplayUploadModal";
import ReactPlayer from "react-player";
import EventDetailView, { EventStateScaffold } from "./EventDetailView.jsx";
import { SponsorProfileLink } from "./sponsorLink.jsx";

export function CountdownPill({ target }) {
  if (!target) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-medium tw:border tw:border-[#ffffff]/30 tw:backdrop-blur">
      <Clock className="tw:w-4 tw:h-4 tw:opacity-80" />

      <Countdown
        date={target.getTime()}
        daysInHours={false}
        renderer={({ days, hours, minutes, seconds }) => {
          return (
            <span>
              {String(days).padStart(2, "0")}D:
              {String(hours).padStart(2, "0")}H:
              {String(minutes).padStart(2, "0")}M:
              {String(seconds).padStart(2, "0")}S
            </span>
          );
        }}
      />
    </div>
  );
}

function isUuid(value = "") {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function getTicketPromptStorageKey(eventIdentifier) {
  return `xilolo:event-ticket-prompt-seen:${eventIdentifier}`;
}

function getViewerId(user = {}) {
  return (
    user?.id ||
    user?.user_id ||
    user?.userId ||
    user?.uuid ||
    user?.data?.id ||
    ""
  );
}

function resolveManualDownloadUrl(manual = {}) {
  const directCandidates = [
    manual?.cdn_url,
    manual?.cdn_link,
    manual?.document_url,
    manual?.document_link,
    manual?.file_url,
    manual?.file_link,
    manual?.download_url,
    manual?.url,
    manual?.link,
    manual?.path,
    manual?.document?.cdn_url,
    manual?.document?.cdn_link,
    manual?.document?.url,
    manual?.document?.link,
    manual?.document?.file_url,
    manual?.file?.cdn_url,
    manual?.file?.cdn_link,
    manual?.file?.url,
    manual?.file?.link,
    manual?.file?.file_url,
    manual?.manual_document?.cdn_url,
    manual?.manual_document?.cdn_link,
    manual?.manual_document?.url,
    manual?.manual_document?.link,
    manual?.asset?.url,
    manual?.asset?.cdn_url,
    manual?.asset?.cdn_link,
  ];

  return (
    directCandidates.find(
      (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim())
    ) || ""
  );
}

function formatReplayMinutes(value) {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return "Not set";
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function formatReplayDateTime(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EventDetailShimmer() {
  return (
    <div className="tw:min-h-screen tw:w-full tw:pb-12 tw:pt-20">
      <div className="tw:mx-auto tw:max-w-7xl tw:px-2 tw:md:px-6 tw:lg:px-8">
        <div className="tw:mb-4 tw:mt-10 tw:h-16 tw:animate-pulse tw:md:rounded-[28px] tw:md:border tw:md:border-[#ffffff]/70 tw:md:bg-[#ffffff]/55 tw:md:shadow-[0_24px_60px_rgba(148,163,184,0.15)] tw:md:backdrop-blur-2xl" />

        <div className="tw:overflow-hidden tw:md:rounded-[36px] tw:md:border tw:md:border-[#ffffff]/70 tw:md:bg-[#ffffff]/50 tw:md:shadow-[0_30px_90px_rgba(15,23,42,0.09)] tw:md:backdrop-blur-2xl">
          <div className="tw:grid tw:grid-cols-1 tw:gap-5 tw:p-0 tw:md:gap-8 tw:md:p-8 tw:xl:grid-cols-[1.25fr_0.75fr]">
            <div className="tw:space-y-6">
              <div className="tw:h-80 tw:animate-pulse tw:rounded-[28px] tw:bg-[#ffffff]/70 tw:md:h-[520px] tw:md:rounded-4xl" />

              <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2 tw:xl:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="tw:h-[116px] tw:animate-pulse tw:rounded-[26px] tw:bg-[#ffffff]/70"
                  />
                ))}
              </div>

              <div className="tw:py-2 tw:md:rounded-[30px] tw:md:bg-[#ffffff]/70 tw:md:p-6">
                <div className="tw:h-4 tw:w-28 tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
                <div className="tw:mt-5 tw:h-8 tw:w-3/4 tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
                <div className="tw:mt-4 tw:space-y-3">
                  <div className="tw:h-4 tw:w-full tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
                  <div className="tw:h-4 tw:w-full tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
                  <div className="tw:h-4 tw:w-5/6 tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
                </div>
              </div>
            </div>

            <div className="tw:space-y-6">
              <div className="tw:h-[360px] tw:animate-pulse tw:rounded-[28px] tw:bg-[#ffffff]/70 tw:md:rounded-[30px]" />
              <div className="tw:h-[280px] tw:animate-pulse tw:rounded-[28px] tw:bg-[#ffffff]/70 tw:md:rounded-[30px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewEvent() {
  const { eventId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseSuccessOpen, setPurchaseSuccessOpen] = useState(false);
  const [fundingRequiredOpen, setFundingRequiredOpen] = useState(false);
  const [fundWalletOpen, setFundWalletOpen] = useState(false);
  const [fundingRequiredDetails, setFundingRequiredDetails] = useState(null);
  const [modalAutoTrigger, setModalAutoTrigger] = useState(true);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [replayUploadOpen, setReplayUploadOpen] = useState(false);
  const [preferredPurchaseType, setPreferredPurchaseType] = useState(null);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const shareFlow = useEventShareFlow();
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [startingStream, setStartingStream] = useState(false);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const purchaseTicketMutation = usePurchaseTicketWithWallet({
    onSuccess: (payload) => {
      const purchaseData = payload?.data || payload || {};
      const purchaseType = purchaseData?.purchase_type || "ticket_only";
      const includesManual = !!purchaseData?.includes_manual;

      setEvent((previous) =>
        previous
          ? {
            ...previous,
            hasPaid:
              purchaseType === "manual_only" || purchaseType === "sponsored_only"
                ? !!previous?.hasPaid
                : true,
            user_has_sponsored_tickets:
              purchaseType === "sponsored_only"
                ? true
                : previous?.user_has_sponsored_tickets,
            manual: previous?.manual
              ? {
                ...previous.manual,
                viewer_has_access:
                  includesManual || previous.manual.viewer_has_access,
                viewer_has_purchased:
                  includesManual || previous.manual.viewer_has_purchased,
                viewer_has_ticket:
                  purchaseType === "sponsored_only"
                    ? previous.manual.viewer_has_ticket
                    : true,
              }
              : previous?.manual,
          }
          : previous
      );
      setPurchaseSummary(purchaseData);
      setPurchaseSuccessOpen(true);
      setPurchaseModalOpen(false);
      setFundingRequiredOpen(false);
      dispatch(clearPendingPurchaseIntent());
      refreshEventDetailSilently();
      showSuccess(
        purchaseType === "manual_only"
          ? "Manual purchased successfully."
          : purchaseType === "sponsored_only"
            ? "Tickets bought for others successfully."
            : includesManual
              ? "Ticket and manual purchased successfully."
              : "Ticket purchased successfully."
      );
    },
  });

  const claimSponsoredTicketMutation = useClaimSponsoredTicket({
    onSuccess: () => {
      setEvent((previous) =>
        previous
          ? {
            ...previous,
            hasPaid: true,
            user_has_ticket: true,
            can_claim_sponsored_ticket: false,
            sponsored_tickets_available_count: Math.max(
              0,
              Number(previous.sponsored_tickets_available_count || 0) - 1
            ),
            manual: previous?.manual
              ? {
                ...previous.manual,
                viewer_has_ticket: true,
              }
              : previous?.manual,
          }
          : previous
      );
      refreshEventDetailSilently();
      showSuccess("Paid ticket claimed successfully.");
    },
  });

  function initialsFromName(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "?";
  }

  const hostName = event?.hostName || "Organizer";
  const hostInitials = initialsFromName(hostName);
  const hostHasImage = !!event?.hostImage;
  const hostAbout = String(event?.hostAbout || "").trim();

  function syncEventPayload(data = {}) {
    const ev =
      data?.currentEvent || data?.event || data?.data?.event || null;

    setEvent(normalizeEventRecord(ev));
    setIsSaved(!!ev?.is_saved);
    setIsFollowing(!!(ev?.is_following_organizer || ev?.is_following));
  }

  async function fetchEventPayload() {
    const isId = isUuid(eventId);
    const res = isId
      ? await api.get(`/api/v1/events/${eventId}/view`, authHeaders(token))
      : await api.get(
        `/api/v1/event/recommended/${eventId}`,
        authHeaders(token)
      );

    return res?.data?.data || res?.data || {};
  }

  async function refreshEventDetailSilently() {
    if (!eventId) return;

    try {
      const data = await fetchEventPayload();
      syncEventPayload(data);
    } catch (refreshError) {
      console.error("Failed to refresh event detail", refreshError);
    }
  }

  useEffect(() => {
    if (!eventId) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setModalAutoTrigger(true);
        setPurchaseModalOpen(false);
        setPurchaseSummary(null);
        const data = await fetchEventPayload();

        if (!mounted) return;
        syncEventPayload(data);
      } catch (e) {
        setError(
          e?.response?.data?.message || e?.message || "Failed to fetch event"
        );
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [eventId, token]);

  useEffect(() => {
    if (!event || !modalAutoTrigger) return;

    const priceValue = Number(event?.price ?? 0);
    const hasPrice = priceValue > 0 || Boolean(event?.price_display);
    const hasPurchaseOptions =
      event?.purchase_options?.ticket_only ||
      event?.purchase_options?.ticket_and_manual ||
      event?.purchase_options?.manual_only ||
      hasPrice;
    const promptKey = getTicketPromptStorageKey(event?.id || eventId);
    const hasSeenPrompt =
      typeof window !== "undefined" &&
      window.localStorage.getItem(promptKey) === "1";

    if (
      !event?.hasPaid &&
      !event?.can_claim_sponsored_ticket &&
      hasPurchaseOptions &&
      !hasSeenPrompt
    ) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(promptKey, "1");
      }
      setPurchaseModalOpen(true);
    }
  }, [event, eventId, modalAutoTrigger]);

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false);
    setModalAutoTrigger(false);
  };

  const priceDisplay =
    event?.price_display ||
    `${event?.currency?.symbol || "₦"}${event?.price || "0"}`;

  const posterUrl = useMemo(() => event?.poster?.[0]?.url, [event]);
  const manual = event?.manual || {};
  const purchaseOptions = event?.purchase_options || {};
  const hasPaid = !!event?.hasPaid || !!event?.user_has_ticket;
  const manualAvailable = !!manual?.available;
  const manualHasAccess = !!manual?.viewer_has_access;
  const ticketOnlyAvailable =
    !event?.is_sold_out &&
    !hasPaid &&
    (!!purchaseOptions.ticket_only || Number(event?.price ?? 0) > 0);
  const ticketAndManualAvailable =
    !hasPaid &&
    manualAvailable &&
    !!purchaseOptions.ticket_and_manual &&
    !manualHasAccess;
  const manualOnlyAvailable =
    manualAvailable && !!purchaseOptions.manual_only && !manualHasAccess;
  const purchaseChoiceCount = [
    ticketOnlyAvailable,
    ticketAndManualAvailable,
    manualOnlyAvailable,
  ].filter(Boolean).length;
  const shouldChoosePurchaseType =
    purchaseChoiceCount > 1 || ticketAndManualAvailable || manualOnlyAvailable;
  const manualPriceDisplay =
    manual?.price_display ||
    formatWalletMoney(
      Number(manual?.price || 0),
      manual?.currency_code || event?.currency?.code || "NGN"
    );
  const manualDownloadUrl = resolveManualDownloadUrl(manual);

  const handleDownloadManual = () => {
    if (!token) {
      showError("Please log in to access the event manual.");
      navigate("/auth/signin");
      return;
    }

    if (!manualDownloadUrl) {
      showError("Manual CDN file link is missing from the event response.");
      return;
    }

    window.open(manualDownloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleGetTicket = async (purchaseType = "ticket_only", quantity = 1) => {
    if (event?.is_sold_out || purchaseTicketMutation.isPending) return;

    if (!token) {
      showError("Please log in to purchase a ticket.");
      navigate("/auth/signin");
      return;
    }

    try {
      await purchaseTicketMutation.mutateAsync({
        event_id: event.id,
        quantity,
        purchase_type: purchaseType,
      });
    } catch (paymentError) {
      const errorCode = getApiErrorCode(paymentError);
      const errorMessage = getApiErrorMessage(
        paymentError,
        "Failed to purchase ticket."
      );

      if (errorCode === "WALLET_FUNDING_REQUIRED") {
        const details = getFundingRequiredDetails(paymentError);
        setFundingRequiredDetails(details);
        setFundingRequiredOpen(true);
        setPurchaseModalOpen(false);
        dispatch(
          setPendingPurchaseIntent({
            eventId: event.id,
            eventTitle: event.title,
            quantity,
            purchaseType,
            sourcePage: "event_detail",
            eventPath: location.pathname,
            deficitAmount: details?.deficit_amount || 0,
            requiredAmount: details?.required_amount || 0,
            walletBalance: details?.wallet_balance || 0,
          })
        );
        return;
      }

      if (errorCode === "EVENT_NOT_PURCHASABLE") {
        showError(errorMessage || "This event is not available for purchase.");
        return;
      }

      if (errorCode === "EVENT_MANUAL_NOT_AVAILABLE") {
        showError(errorMessage || "This manual is not available for purchase.");
        return;
      }

      if (errorCode === "TICKET_SOLD_OUT") {
        setEvent((previous) =>
          previous
            ? {
              ...previous,
              is_sold_out: true,
            }
            : previous
        );
        showError(errorMessage || "This event is sold out.");
        return;
      }

      showError(errorMessage);
      console.error("Wallet purchase error:", paymentError);
    }
  };

  const handleClaimSponsoredTicket = async () => {
    if (!event?.id || claimSponsoredTicketMutation.isPending) return;

    if (!token) {
      showError("Please log in to claim a paid ticket.");
      navigate("/auth/signin");
      return;
    }

    try {
      await claimSponsoredTicketMutation.mutateAsync(event.id);
    } catch (claimError) {
      showError(getApiErrorMessage(claimError, "Unable to claim paid ticket."));
      refreshEventDetailSilently();
    }
  };

  const handleToggleFollow = async () => {
    if (!event?.hostId) return;

    if (!token) {
      showError("Please log in to follow organizers.");
      navigate("/login");
      return;
    }

    try {
      setFollowLoading(true);
      const res = await api.post(
        `/api/v1/follow/${event.hostId}`,
        null,
        authHeaders(token)
      );

      const isNowFollowing =
        res?.data?.data?.is_following ??
        res?.data?.is_following ??
        !isFollowing;

      setIsFollowing(isNowFollowing);
      showSuccess(
        isNowFollowing
          ? "You're now following this organizer."
          : "You've unfollowed this organizer."
      );
    } catch (followError) {
      console.error(followError);
      showError("Unable to update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  const isLiveNow = event?.status === "live";
  const isUpcoming = event?.status === "upcoming";
  const isPaused = event?.status === "paused";
  const isEnded = event?.status === "ended";
  const isSoldOut = !!event?.is_sold_out;
  const isOwnerEvent = !!(
    event?.isOwner ||
    event?.is_owner ||
    event?.is_my_event ||
    event?.isMine ||
    event?.is_current_user_event
  );
  const canBuyManualOnly = hasPaid && manualOnlyAvailable;
  const canDownloadManual = manualAvailable && manualHasAccess;
  const hasSponsoredTicketsAvailable = !!event?.has_sponsored_tickets_available;
  const sponsoredTicketsAvailableCount = Number(event?.sponsored_tickets_available_count || 0);
  const sponsoredTicketSponsors = Array.isArray(event?.sponsored_ticket_sponsors)
    ? event.sponsored_ticket_sponsors
    : [];
  const viewerId = String(getViewerId(user));
  const viewerHasSponsoredTickets =
    !!event?.user_has_sponsored_tickets ||
    (!!viewerId &&
      sponsoredTicketSponsors.some(
        (sponsor) => String(sponsor?.id || sponsor?.user_id || "") === viewerId
      ));
  const firstSponsor = sponsoredTicketSponsors[0];
  const sponsorHeadlineSuffix =
    sponsoredTicketSponsors.length > 1
      ? ` and ${sponsoredTicketSponsors.length - 1} other${sponsoredTicketSponsors.length === 2 ? "" : "s"} bought tickets for others for this event.`
      : " bought tickets for others for this event.";
  const canClaimSponsoredTicket = !!event?.can_claim_sponsored_ticket;
  const canSponsorOwnEvent = !!(isOwnerEvent && event?.user_can_sponsor_tickets && !isSoldOut);
  const canOpenPurchaseOptions =
    (!isOwnerEvent || canSponsorOwnEvent) &&
    !isSoldOut &&
    (ticketOnlyAvailable ||
      ticketAndManualAvailable ||
      manualOnlyAvailable ||
      !!event?.user_can_sponsor_tickets ||
      viewerHasSponsoredTickets);
  const replay = event?.replay || {};
  const vod = event?.vod || {};
  const isVodEvent = event?.delivery_type === "vod";
  const vodIsReady = !!vod?.is_ready;
  const canWatchVod = !!vod?.can_watch || !!event?.hasPaid || !!event?.isOwner;
  const replayEnabled = !!event?.enable_replay;
  const hasReplay = !!event?.has_replay;
  const replayAvailableAt =
    event?.replay_available_at || replay?.available_at || "";
  const replayExpiresAt =
    event?.replay_expires_at || replay?.expires_at || "";
  const replayUrl = event?.replay_url || replay?.url || "";
  const replayIsAvailable = !!((replay?.is_available && replayUrl) || (vod?.source_type === "live_replay" && vodIsReady));
  const replayExpired = !!(
    replayEnabled &&
    !replayUrl &&
    replayExpiresAt &&
    !Number.isNaN(new Date(replayExpiresAt).getTime()) &&
    new Date(replayExpiresAt).getTime() <= Date.now()
  );

  let primaryCtaLabel;
  if (hasPaid && isLiveNow) {
    primaryCtaLabel = "Join Live Event";
  } else if (canBuyManualOnly) {
    primaryCtaLabel = "Buy Manual";
  } else if (viewerHasSponsoredTickets) {
    primaryCtaLabel = "Buy More for Others";
  } else if (hasPaid && !isLiveNow) {
    primaryCtaLabel = event?.user_can_sponsor_tickets ? "Buy for Others" : "Ticket Purchased";
  } else if (canClaimSponsoredTicket) {
    primaryCtaLabel = claimSponsoredTicketMutation.isPending ? "Claiming..." : "Claim Paid Ticket";
  } else if (isSoldOut) {
    primaryCtaLabel = "Sold Out";
  } else if (purchaseTicketMutation.isPending) {
    primaryCtaLabel = "Processing...";
  } else if (shouldChoosePurchaseType) {
    primaryCtaLabel = "Buy Ticket";
  } else {
    primaryCtaLabel = "Buy Ticket";
  }

  const ctaDisabled =
    purchaseTicketMutation.isPending ||
    claimSponsoredTicketMutation.isPending ||
    (!canClaimSponsoredTicket &&
      ((!hasPaid && isSoldOut && !ticketOnlyAvailable && !ticketAndManualAvailable) ||
        (hasPaid &&
          !isLiveNow &&
          !canBuyManualOnly &&
          !event?.user_can_sponsor_tickets &&
          !viewerHasSponsoredTickets)));

  const handleEnterLive = () => {
    if (hasPaid && isLiveNow) {
      setDownloadModalOpen(true);
    }
  };

  const handlePrimaryAction = () => {
    if (ctaDisabled) return;

    if (hasPaid && isLiveNow) {
      handleEnterLive();
      return;
    }

    if (canClaimSponsoredTicket) {
      handleClaimSponsoredTicket();
      return;
    }

    if (viewerHasSponsoredTickets) {
      setPreferredPurchaseType("sponsored_only");
      setPurchaseModalOpen(true);
      setModalAutoTrigger(false);
      return;
    }

    if (shouldChoosePurchaseType || canBuyManualOnly || (hasPaid && event?.user_can_sponsor_tickets)) {
      setPreferredPurchaseType(
        hasPaid && event?.user_can_sponsor_tickets ? "sponsored_only" : null
      );
      setPurchaseModalOpen(true);
      setModalAutoTrigger(false);
      return;
    }

    handleGetTicket(ticketAndManualAvailable ? "ticket_and_manual" : "ticket_only");
  };

  const handleOpenPurchaseOptions = () => {
    if (!canOpenPurchaseOptions || purchaseTicketMutation.isPending) return;

    if (!token) {
      showError("Please log in to buy tickets or buy for others.");
      navigate("/auth/signin");
      return;
    }

    setPurchaseModalOpen(true);
    setPreferredPurchaseType(
      viewerHasSponsoredTickets ? "sponsored_only" : null
    );
    setModalAutoTrigger(false);
  };

  const handleOwnerStreamAction = async () => {
    if (!event?.id) return;

    if (isVodEvent) {
      navigate(`/event/view/${event.id}`);
      return;
    }

    if (isEnded) {
      navigate(`/event/stream/${event.id}`);
      return;
    }

    setStartingStream(true);
    try {
      await showPromise(
        api.post(`/api/v1/events/${event.id}/streams/start`, {}, authHeaders(token)),
        {
          loading: "Starting stream...",
          success: "Stream ready",
          error: (err) =>
            err?.response?.data?.message ||
            err?.message ||
            "Unable to start stream.",
        }
      );
      navigate(`/event/stream/${event.id}`);
    } finally {
      setStartingStream(false);
    }
  };


  /* ---- sections whose inner markup stays owned by this data layer ---- */

  // details_screen.dart:1874-1906 _buildSponsoredTicketSection()
  const sponsoredNode =
    hasSponsoredTicketsAvailable && !hasPaid ? (
      <div className="tw:mt-5 tw:px-4">
        <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
          Sponsored Tickets
        </div>
        <div className="tw:mt-2.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
          <div className="tw:text-sm tw:font-bold tw:text-body">
            {sponsoredTicketSponsors.length ? (
              <>
                <SponsorProfileLink
                  sponsor={firstSponsor}
                  className="tw:text-accent-deep tw:font-bold"
                />
                {sponsorHeadlineSuffix}
              </>
            ) : (
              "A kind person has bought tickets for others for this event."
            )}
          </div>
          <div className="tw:mt-1 tw:text-[12px] tw:leading-[1.6] tw:text-muted">
            You can grab one of the free tickets, get your own ticket, or chip in to buy for
            others!
          </div>
          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <span className="tw:rounded-full tw:bg-accent-soft tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-accent-deep">
              {sponsoredTicketsAvailableCount} available
            </span>
            {sponsoredTicketSponsors.slice(0, 3).map((sponsor) => (
              <SponsorProfileLink
                key={sponsor.id || sponsor.username}
                sponsor={sponsor}
                className="tw:rounded-full tw:border tw:border-hairline tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-body"
              />
            ))}
          </div>
        </div>
      </div>
    ) : null;

  // details_screen.dart:1913-2041 _buildManualAccessSection()
  const manualNode = manualAvailable ? (
    <div className="tw:mt-5 tw:px-4">
      <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
        Event Manual
      </div>
      <div className="tw:mt-2.5 tw:flex tw:items-start tw:gap-3 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
        {manual?.cover_url ? (
          <img
            src={manual.cover_url}
            alt="Manual cover"
            className="tw:h-[72px] tw:w-[58px] tw:shrink-0 tw:rounded-xl tw:object-cover"
          />
        ) : (
          <div className="tw:flex tw:h-[72px] tw:w-[58px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-[#E9E9EC]">
            <BookOpen className="tw:h-5 tw:w-5 tw:text-muted" />
          </div>
        )}
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-sm tw:font-bold tw:text-body">
            {manual?.file_name || "Event Manual"}
          </div>
          <div className="tw:mt-1 tw:text-[12px] tw:font-medium tw:text-[#6B7280]">
            {manualHasAccess
              ? "You already have access to this manual."
              : `Available for ${manualPriceDisplay}.`}
          </div>
          {canDownloadManual && (
            <button
              type="button"
              onClick={handleDownloadManual}
              className="tw:mt-2.5 tw:flex tw:h-11 tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-lg tw:border-0 tw:bg-[#16909C] tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-[#06707D]"
            >
              Download manual
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  // details_screen.dart:6455-6703 _buildReplaySection() (rendered at :5841-5844)
  const replayNode = replayEnabled ? (
    <div className="tw:px-4">
      <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
        Replay
      </div>
      <div className="tw:mt-2.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
        {replayIsAvailable ? (
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-body">Replay is available</div>
            <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
              {replayExpiresAt
                ? `Replay expires at ${formatReplayDateTime(replayExpiresAt)}`
                : "Replay is ready to watch."}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/event/vod/${event.id}`)}
              className="tw:mt-3 tw:flex tw:h-11 tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border-0 tw:bg-[#16909C] tw:text-[13px] tw:font-bold tw:text-white tw:hover:bg-[#06707D]"
            >
              <Video className="tw:h-4 tw:w-4" />
              <span>Watch replay</span>
            </button>
            <div className="tw:mt-3 tw:overflow-hidden tw:rounded-xl tw:bg-black">
              <div className="tw:aspect-video">
                <ReactPlayer url={replayUrl} controls width="100%" height="100%" />
              </div>
            </div>
          </div>
        ) : replayExpired ? (
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-body">
              Replay is no longer available.
            </div>
            <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
              The backend has already cleared access for this replay.
            </div>
          </div>
        ) : hasReplay ? (
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-body">
              Replay will be available soon
            </div>
            <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
              Replay is scheduled but not available yet.
            </div>
            {replayAvailableAt && (
              <div className="tw:mt-2 tw:text-[12px] tw:font-semibold tw:text-body">
                Available at {formatReplayDateTime(replayAvailableAt)}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-body">Replay not uploaded yet</div>
            <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
              The organiser has enabled replay, but the replay video has not been uploaded yet.
            </div>
          </div>
        )}

        {isOwnerEvent && isEnded && (
          <div className="tw:mt-3 tw:border-t tw:border-hairline tw:pt-3">
            <div className="tw:text-[13px] tw:font-bold tw:text-body">Replay management</div>
            <div className="tw:mt-2 tw:text-[12px] tw:text-muted">
              <div>
                <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
                  Unlock delay
                </div>
                <div className="tw:mt-0.5 tw:font-semibold tw:text-body">
                  {formatReplayMinutes(event?.replay_available_after_minutes)}
                </div>
              </div>
              <div className="tw:mt-2">
                <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
                  Expiry duration
                </div>
                <div className="tw:mt-0.5 tw:font-semibold tw:text-body">
                  {formatReplayMinutes(event?.replay_available_for_minutes)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplayUploadOpen(true)}
              className="tw:mt-3 tw:flex tw:h-11 tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-accent tw:bg-paper-raised tw:text-[13px] tw:font-bold tw:text-accent-deep tw:hover:bg-accent-soft"
            >
              <Upload className="tw:h-4 tw:w-4" />
              <span>Upload replay video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // VOD delivery (app routes VOD to _buildVodEventDetailView, details_screen.dart:4917-4924)
  const vodNode =
    isVodEvent || vodIsReady ? (
      <div className="tw:mt-5 tw:px-4">
        <div className="tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-[1.4px] tw:text-muted">
          Event Video
        </div>
        <div className="tw:mt-2.5 tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-3.5">
          <div className="tw:text-sm tw:font-bold tw:text-body">
            {vodIsReady ? "Video is ready" : "Video will be available soon"}
          </div>
          <div className="tw:mt-1 tw:text-[12px] tw:text-muted">
            {vodIsReady
              ? "Ticket holders can stream this event on now."
              : "We will make the video available here as soon as it is ready."}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/event/vod/${event.id}`)}
            disabled={!vodIsReady || (!canWatchVod && !event?.hasPaid)}
            className={`tw:mt-3 tw:flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border-0 tw:text-[13px] tw:font-bold tw:text-white ${
              !vodIsReady || (!canWatchVod && !event?.hasPaid)
                ? "tw:cursor-not-allowed tw:bg-[#2F2F2F]"
                : "tw:cursor-pointer tw:bg-[#16909C] tw:hover:bg-[#06707D]"
            }`}
          >
            <Video className="tw:h-4 tw:w-4" />
            <span>{vodIsReady ? "Watch video" : "Available soon"}</span>
          </button>
        </div>
      </div>
    ) : null;

  // details_screen.dart:4987 _buildReviewsSection()
  const reviewsNode = (
    <EventReviewsSection
      eventId={event?.id}
      eventSummary={event?.reviews}
      token={token}
      currentUser={user}
      onReviewMutationSuccess={refreshEventDetailSilently}
    />
  );

  if (loading) {
    return <EventDetailShimmer />;
  }

  /* App parity: _EventDetailStateScaffold (details_screen.dart:6942-6994) - centred icon,
     message and a 180px button; label flips to 'Try again' when offline. */
  const handleRetryLoad = () => {
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const data = await fetchEventPayload();
        syncEventPayload(data);
      } catch (retryError) {
        setError(
          retryError?.response?.data?.message ||
            retryError?.message ||
            "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    })();
  };

  if (error) {
    return (
      <EventStateScaffold
        message={error}
        isOffline={typeof navigator !== "undefined" && navigator.onLine === false}
        onRetry={handleRetryLoad}
      />
    );
  }

  if (!event) return null;

  const formattedDateTime = formatEventDateTime(
    event.eventDate,
    event.startTime
  );
  const reviewStats = event?.reviews || {};
  const reviewCount = Number(reviewStats?.count ?? 0) || 0;
  const reviewAverage = Number(reviewStats?.average_rating ?? 0) || 0;

  const startDate = eventStartDate(event);
  const formattedLocation =
    event.location ||
    event.address ||
    (event.eventType?.toLowerCase() === "virtual"
      ? "Online event"
      : "Location to be announced");

  const handleShareEvent = async () => {
    await shareFlow.startShare({ eventId: event?.id });
  };
  return (
    <>
      <SEO
        title={
          event?.title ? `${event.title} - Event Details` : "Event Details"
        }
        description={
          event?.description
            ? event.description.slice(0, 155)
            : "Discover event details, get tickets, and connect with attendees at Xilolo. Join the experience!"
        }
        keywords={`Xilolo, ${event?.title || "event"}, ${event?.eventType || "event"
          }, event tickets, ${event?.hostName || "event organizer"
          }, live events, entertainment`}
        image={posterUrl}
        type="article"
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            description: event.description,
            image: posterUrl,
            startDate: `${event.eventDate} ${event.startTime}`,
            endDate: event.endDate
              ? `${event.endDate} ${event.endTime}`
              : undefined,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              event.eventType?.toLowerCase() === "virtual"
                ? "https://schema.org/OnlineEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
            location:
              event.eventType?.toLowerCase() === "virtual"
                ? { "@type": "VirtualLocation", url: event.streamUrl || "" }
                : {
                  "@type": "Place",
                  name: event.location || "Event Location",
                  address: event.address || "",
                },
            offers: {
              "@type": "Offer",
              price: event.price || 0,
              priceCurrency: event.currency?.code || "NGN",
              availability: "https://schema.org/InStock",
              url: typeof window !== "undefined" ? window.location.href : "",
            },
            organizer: {
              "@type": "Organization",
              name: event.hostName || "Xilolo",
            },
            performer: {
              "@type": "PerformingGroup",
              name: event.hostName || "Event Host",
            },
          })}
        </script>
      </Helmet>

      {/* App→web parity screen: EventDetailView mirrors
          lib/features/presentation/screens/home/screen/details_screen.dart
          (section order = details_screen.dart:4969-5257, bottom bar = :5265-5628). */}
      <EventDetailView
        v={{
          event,
          posters: event?.poster || [],
          formattedDateTime,
          formattedLocation,
          priceDisplay,
          reviewCount,
          reviewAverage,
          countdownTarget: startDate,
          description:
            String(event?.description || "").trim() ||
            "This event does not have a published description yet.",
          accessLabel: hasPaid
            ? "Ticket secured"
            : manualHasAccess
              ? "Manual unlocked"
              : isLiveNow
                ? "Live"
                : isPaused
                  ? "Paused"
                  : isEnded
                    ? "Ended"
                    : "Upcoming",
          statusLabel: isLiveNow
            ? "Live"
            : isPaused
              ? "Paused"
              : isEnded
                ? "Ended"
                : "Upcoming",
          hostName,
          hostInitials,
          hostHasImage,
          hostAbout,
          hostHasActiveSubscription: !!event?.hostHasActiveSubscription,
          profileHref:
            event?.organiserUserId || event?.organiserId
              ? `/profile/${event.organiserUserId || event.organiserId}`
              : "/organizers",
          isLiveNow,
          isPaused,
          isEnded,
          isSoldOut,
          isOwnerEvent,
          isVodEvent,
          hasPaid,
          manualHasAccess,
          canWatchVod,
          replayEnabled,
          hasReplay,
          replayIsAvailable,
          replayExpired,
          replayUrl,
          canOpenPurchaseOptions,
          canBuyManualOnly,
          canSponsorOwnEvent,
          viewerHasSponsoredTickets,
          shouldChoosePurchaseType,
          primaryCtaLabel,
          ctaDisabled,
          startingStream,
          followLoading,
          isFollowing,
          isSaved,
          ownerStreamLabel:
            isLiveNow || isPaused ? "Manage stream" : isEnded ? "View stream" : "Start stream",
          sponsoredNode,
          manualNode,
          replayNode,
          vodNode,
          reviewsNode,
          onBack: () => navigate(-1),
          onShare: handleShareEvent,
          onToggleFollow: handleToggleFollow,
          onOwnerStreamAction: handleOwnerStreamAction,
          onPrimaryAction: handlePrimaryAction,
          onOpenPurchaseOptions: handleOpenPurchaseOptions,
          onGetTicket: () =>
            handleGetTicket(ticketAndManualAvailable ? "ticket_and_manual" : "ticket_only"),
          onWatchVod: () => navigate(`/event/vod/${event.id}`),
          onReport: () => setReportOpen(true),
        }}
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason) => {
          const url = `/api/v1/report/register?reportable_type=event&reportable_id=${encodeURIComponent(
            eventId
          )}&reason=${encodeURIComponent(reason)}`;
          await api.post(url, null, authHeaders(token));
          setReportOpen(false);
          navigate("/feed");
          showSuccess("Report submitted. Thank you.");
        }}
      />
      <EventShareModal
        open={shareFlow.shareModalOpen}
        onClose={shareFlow.closeShareModal}
        payload={shareFlow.sharePayload}
        loading={shareFlow.sharePayloadLoading}
        error={shareFlow.sharePayloadError}
        onRetry={shareFlow.retryShare}
        onCopyLink={shareFlow.handleCopyLink}
        onChannelClick={shareFlow.handleChannelShare}
        title="Share this event"
      />
      <TicketPromptModal
        open={purchaseModalOpen}
        onClose={closePurchaseModal}
        event={event}
        onBuy={(purchaseType, quantity) => handleGetTicket(purchaseType, quantity)}
        onDownloadManual={handleDownloadManual}
        buying={purchaseTicketMutation.isPending}
        preferredPurchaseType={preferredPurchaseType}
      />
      <WalletFundingRequiredModal
        open={fundingRequiredOpen}
        onClose={() => setFundingRequiredOpen(false)}
        details={fundingRequiredDetails}
        formatAmount={(amount) =>
          formatWalletMoney(amount, event?.currency?.code || "NGN")
        }
        onFundWallet={() => {
          setFundingRequiredOpen(false);
          setFundWalletOpen(true);
        }}
      />
      <FundWalletModal
        open={fundWalletOpen}
        onClose={() => setFundWalletOpen(false)}
        prefilledAmount={fundingRequiredDetails?.deficit_amount || ""}
        source="ticket_purchase"
      />
      <TicketPurchaseSuccessModal
        open={purchaseSuccessOpen}
        onClose={() => setPurchaseSuccessOpen(false)}
        eventTitle={event?.title}
        purchaseType={purchaseSummary?.purchase_type || "ticket_only"}
        includesManual={!!purchaseSummary?.includes_manual}
        onDownloadManual={
          purchaseSummary?.includes_manual ? handleDownloadManual : undefined
        }
      />
      <LiveAppDownloadModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
      <ReplayUploadModal
        open={replayUploadOpen}
        event={event}
        token={token}
        onClose={() => setReplayUploadOpen(false)}
        onUploaded={() => {
          refreshEventDetailSilently();
        }}
      />
    </>
  );
}
