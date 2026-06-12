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

function sponsorDisplayName(sponsor) {
  return sponsor?.username || sponsor?.user_name || sponsor?.name || "Someone";
}

function sponsorProfilePath(sponsor) {
  const id = sponsor?.user_id || sponsor?.id || sponsor?.sponsor_user_id;
  return id ? `/profile/${id}` : null;
}

function SponsorProfileLink({ sponsor, className = "" }) {
  const name = sponsorDisplayName(sponsor);
  const path = sponsorProfilePath(sponsor);

  if (!path) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link to={path} className={className}>
      {name}
    </Link>
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

              <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2 xl:tw:grid-cols-4">
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

  if (loading) {
    return <EventDetailShimmer />;
  }

  if (error) {
    return (
      <div className="tw:flex tw:h-[60vh] tw:w-full tw:items-center tw:justify-center tw:bg-[#FEF2F2]">
        <p className="tw:px-4 tw:text-center tw:text-sm tw:text-red-600">
          {error}
        </p>
      </div>
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

      <div className="tw:min-h-screen tw:w-full tw:bg-[#ffffff] tw:pb-32 tw:pt-20 tw:font-sans tw:text-slate-900 tw:md:pb-12">
        <div className="tw:mx-auto tw:max-w-7xl tw:px-2 tw:md:px-6 tw:lg:px-8">
          <div className="tw:mb-4 tw:mt-4 tw:sm:mt-10 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-1 tw:py-2 tw:md:mb-6 tw:md:rounded-[28px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:px-4 tw:md:py-3 tw:md:shadow-[0_24px_60px_rgba(148,163,184,0.10)]">
            <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="tw:inline-flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-[#ffffff]/80 tw:bg-[#ffffff]/80 tw:text-slate-700 tw:shadow-sm tw:hover:bg-[#ffffff] tw:md:size-11"
                style={{ borderRadius: "9999px" }}
              >
                <ArrowLeft className="tw:h-3.5 tw:w-3.5 tw:md:h-4 tw:md:w-4" />
              </button>
              <div className="tw:min-w-0">
                <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-slate-500">
                  Event Detail
                </div>
                <div className="tw:truncate tw:text-base tw:font-semibold tw:text-slate-900 tw:md:text-lg">
                  {event.title}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareEvent}
              disabled={shareFlow.shareInProgress}
              className="tw:inline-flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-[#ffffff]/80 tw:bg-[#ffffff]/80 tw:text-slate-700 tw:shadow-sm tw:hover:bg-[#ffffff] tw:disabled:cursor-not-allowed tw:disabled:opacity-75 tw:md:size-11"
              aria-label="Share event"
              style={{ borderRadius: "9999px" }}
            >
              {shareFlow.shareInProgress ? (
                <span className="tw:h-3.5 tw:w-3.5 tw:animate-spin tw:rounded-full tw:border-2 tw:border-slate-500/70 tw:border-t-transparent tw:md:h-4 tw:md:w-4" />
              ) : (
                <Share2 className="tw:h-3.5 tw:w-3.5 tw:md:h-4 tw:md:w-4" />
              )}
            </button>
          </div>

          <section className="tw:relative tw:overflow-hidden tw:md:rounded-[36px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:shadow-[0_30px_90px_rgba(15,23,42,0.06)]">
            <div className="tw:absolute tw:-left-20 tw:top-16 tw:hidden tw:h-56 tw:w-56 tw:rounded-full tw:bg-white tw:blur-3xl tw:md:block" />
            <div className="tw:absolute tw:right-0 tw:top-0 tw:hidden tw:h-64 tw:w-64 tw:rounded-full tw:bg-white tw:blur-3xl tw:md:block" />

            <div className="tw:relative tw:grid tw:grid-cols-1 tw:gap-5 tw:p-0 tw:md:gap-8 tw:md:p-8 tw:xl:grid-cols-[1.25fr_0.75fr]">
              <div className="tw:space-y-6">
                <div className="tw:relative tw:overflow-hidden tw:rounded-[28px] tw:bg-[#FFFFFF] tw:md:rounded-4xl tw:md:border tw:md:border-[#f1f5f9] tw:md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="tw:relative tw:h-80 tw:w-full tw:overflow-hidden tw:md:h-[520px]">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={event.title}
                        className="tw:h-full tw:w-full tw:object-cover"
                      />
                    ) : (
                      <div className="tw:h-full tw:w-full tw:bg-[linear-gradient(135deg,#dbeafe_0%,#f8fafc_50%,#f3e8ff_100%)]" />
                    )}

                    <div className="tw:absolute tw:inset-0 tw:bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.08)_42%,rgba(15,23,42,0.62)_100%)] tw:md:bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.18)_35%,rgba(15,23,42,0.75)_100%)]" />

                    <div className="tw:absolute tw:left-4 tw:top-4 tw:flex tw:flex-wrap tw:gap-2">

                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-[#ffffff]/20 tw:bg-[#ffffff]/18 tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-[#ffffff] tw:backdrop-blur-xl">
                        <Ticket className="tw:h-3 tw:w-3" />
                        {event.eventType}
                      </span>
                      {event.genre && (
                        <span className="tw:rounded-full tw:border tw:border-[#ffffff]/20 tw:bg-[#ffffff]/18 tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-[#ffffff] tw:backdrop-blur-xl">
                          {event.genre}
                        </span>
                      )}
                    </div>

                    <div className="tw:absolute tw:right-4 tw:top-4 tw:flex tw:flex-col tw:items-end tw:gap-2">
                      {isSoldOut && !hasPaid && (
                        <span className="tw:rounded-full tw:bg-[#ef4444] tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-[#ffffff] tw:shadow-lg">
                          Sold out
                        </span>
                      )}
                      {hasPaid && (
                        <span className="tw:rounded-full tw:bg-emerald-500/90 tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-[#ffffff] tw:shadow-lg">
                          Ticket purchased
                        </span>
                      )}
                    </div>

                    <div className="tw:absolute tw:bottom-0 tw:left-0 tw:right-0 tw:p-2.5 tw:md:p-6">
                      <div className="tw:rounded-3xl tw:border tw:border-[#ffffff]/12 tw:bg-[#ffffff]/10 tw:p-3 tw:text-[#ffffff] tw:shadow-[0_18px_40px_rgba(15,23,42,0.16)] tw:backdrop-blur-xl tw:md:rounded-[28px] tw:md:border-[#ffffff]/15 tw:md:bg-[#ffffff]/14 tw:md:p-6 tw:md:shadow-[0_20px_50px_rgba(15,23,42,0.18)] tw:md:backdrop-blur-2xl">
                        <div className="tw:flex tw:flex-col tw:gap-3 tw:md:gap-5">
                          <div className="tw:space-y-2 tw:md:space-y-3">
                            <div className="tw:hidden tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.24em] tw:text-[#ffffff]/72 tw:md:block">
                              Featured Experience
                            </div>
                            <span className="tw:block tw:max-w-3xl tw:text-[19px] tw:font-semibold tw:leading-tight tw:text-[#ffffff] tw:md:text-3xl">
                              {event.title}
                            </span>
                            <span className="tw:hidden tw:max-w-2xl tw:text-sm tw:leading-6 tw:text-[#ffffff]/84 tw:md:block tw:md:text-base">
                              {event.description ||
                                "No description available for this event yet."}
                            </span>
                          </div>

                          <div className="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:md:grid-cols-3 tw:md:gap-3">
                            <div className="tw:rounded-[18px] tw:border tw:border-[#ffffff]/12 tw:bg-black/18 tw:p-3 tw:md:rounded-2xl tw:md:border-[#ffffff]/15 tw:md:p-3.5">
                              <div className="tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-[#ffffff]/55">
                                Date & Time
                              </div>
                              <div className="tw:mt-1.5 tw:text-[13px] tw:font-medium tw:leading-5 tw:text-[#ffffff] tw:md:mt-2 tw:md:text-sm">
                                {formattedDateTime || formatMetaLine(event)}
                              </div>
                            </div>

                            <div className="tw:rounded-[18px] tw:border tw:border-[#ffffff]/12 tw:bg-black/18 tw:p-3 tw:md:rounded-2xl tw:md:border-[#ffffff]/15 tw:md:p-3.5">
                              <div className="tw:text-[11px] tw:uppercase tw:tracking-[0.18em] tw:text-[#ffffff]/55">
                                Ticket Price
                              </div>
                              <div className="tw:mt-1.5 tw:text-[13px] tw:font-medium tw:leading-5 tw:text-[#ffffff] tw:md:mt-2 tw:md:text-sm">
                                {priceDisplay}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:gap-4 tw:md:grid-cols-2 xl:tw:grid-cols-5">
                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[26px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-5 tw:md:shadow-[0_18px_50px_rgba(148,163,184,0.10)]">
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Event Schedule
                    </div>
                    <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                      {formatMetaLine(event)}
                    </div>
                  </div>

                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[26px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-5 tw:md:shadow-[0_18px_50px_rgba(148,163,184,0.10)]">
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Access Window
                    </div>
                    <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                      {event.status === "ended"
                        ? "Event has ended"
                        : hasPaid
                          ? isLiveNow
                            ? "Join now"
                            : "Ticket secured"
                          : "Tickets are available for purchase"}
                    </div>
                  </div>

                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[26px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-5 tw:md:shadow-[0_18px_50px_rgba(148,163,184,0.10)]">
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Hosted By
                    </div>
                    <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                      {event.hostName || "Event Organizer"}
                    </div>
                  </div>

                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[26px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-5 tw:md:shadow-[0_18px_50px_rgba(148,163,184,0.10)]">
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Countdown
                    </div>
                    <div className="tw:mt-3">
                      {event.status !== "ended" ? (
                        <CountdownPill target={startDate} />
                      ) : (
                        <span className="tw:text-sm tw:font-medium tw:text-slate-900">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[26px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-5 tw:md:shadow-[0_18px_50px_rgba(148,163,184,0.10)]">
                    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                      Reviews
                    </div>
                    <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-slate-900">
                      <Star className="tw:h-4 tw:w-4 tw:fill-amber-400 tw:text-amber-400" />
                      {reviewCount > 0
                        ? `${reviewAverage.toFixed(1)} / 5`
                        : "No reviews yet"}
                    </div>
                    <div className="tw:mt-1 tw:text-xs tw:text-slate-500">
                      {reviewCount > 0
                        ? `${reviewCount} attendee review${reviewCount === 1 ? "" : "s"}`
                        : "Be the first attendee to share feedback."}
                    </div>
                  </div>
                </div>

                <div className="tw:px-1 tw:py-2 tw:md:rounded-[30px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-7 tw:md:shadow-[0_20px_60px_rgba(148,163,184,0.10)]">
                  <div className="tw:flex tw:flex-col tw:gap-6 tw:md:flex-row tw:md:items-start tw:md:justify-between">
                    <div className="tw:max-w-3xl">
                      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                        About This Event
                      </div>
                      <spam className="tw:block tw:mt-4 tw:text-sm tw:leading-7 tw:text-slate-600 tw:md:text-[15px]">
                        {event.description ||
                          "This event does not have a published description yet."}
                      </spam>
                    </div>

                    <div className="tw:w-full tw:max-w-sm tw:rounded-[22px] tw:bg-[linear-gradient(180deg,#fff7f7_0%,#fffdfd_100%)] tw:p-4 tw:md:rounded-3xl tw:md:border tw:md:border-[#fee2e2]">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-[#dc2626]">
                        <Flag className="tw:h-4 tw:w-4" />
                        Need to flag this event?
                      </div>
                      <span className="tw:block tw:mt-2 tw:text-sm tw:leading-6 tw:text-slate-600">
                        Report suspicious or inappropriate listings and our team will review them.
                      </span>
                      <button
                        style={{
                          borderRadius: 12
                        }}
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="tw:mt-4 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#ffffff] tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-[#dc2626] tw:shadow-sm tw:hover:bg-red-50 tw:md:gap-2 tw:md:px-4 tw:md:py-2 tw:md:text-sm"
                      >
                        Report this event
                      </button>
                    </div>
                  </div>
                </div>

                {(isVodEvent || vodIsReady) && (
                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[30px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-7 tw:md:shadow-[0_20px_60px_rgba(148,163,184,0.10)]">
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
                      <div>
                        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                          Event Video
                        </div>
                        <div className="tw:mt-2 tw:text-lg tw:font-semibold tw:text-slate-900">
                          {vodIsReady ? "Video is ready" : "Video will be available soon"}
                        </div>
                        <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                          {vodIsReady
                            ? "Ticket holders can stream this event on now."
                            : "We will make the video available here as soon as it is ready."}
                        </div>
                      </div>
                      <button
                        style={{ borderRadius: 24, fontSize: 12 }}
                        type="button"
                        onClick={() => navigate(`/event/vod/${event.id}`)}
                        disabled={!vodIsReady || (!canWatchVod && !event?.hasPaid)}
                        className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-slate-900 tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-slate-800 disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                      >
                        <Video className="tw:h-4 tw:w-4" />
                        <span>{vodIsReady ? "Watch video" : "Available soon"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {replayEnabled && (
                  <div className="tw:px-1 tw:py-2 tw:md:rounded-[30px] tw:md:border tw:md:border-[#f1f5f9] tw:md:bg-[#FFFFFF] tw:md:p-7 tw:md:shadow-[0_20px_60px_rgba(148,163,184,0.10)]">
                    <div className="tw:flex tw:flex-col tw:gap-6 tw:md:flex-row tw:md:items-start tw:md:justify-between">
                      <div className="tw:max-w-3xl tw:flex-1">
                        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                          Event Replay
                        </div>

                        {replayIsAvailable ? (
                          <div className="tw:mt-4 tw:space-y-4">
                            <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
                              <div>
                                <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                                  Replay is available
                                </div>
                                <div className="tw:mt-1 tw:text-sm tw:text-slate-500">
                                  {replayExpiresAt
                                    ? `Replay expires at ${formatReplayDateTime(replayExpiresAt)}`
                                    : "Replay is ready to watch."}
                                </div>
                              </div>
                              <button
                                style={{ borderRadius: 24, fontSize: 12 }}
                                type="button"
                                onClick={() => navigate(`/event/vod/${event.id}`)}
                                className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-slate-900 tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-slate-800"
                              >
                                <Video className="tw:h-4 tw:w-4" />
                                <span>Watch replay</span>
                              </button>
                            </div>

                            <div className="tw:overflow-hidden tw:rounded-3xl tw:bg-black tw:shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
                              <div className="tw:aspect-video">
                                <ReactPlayer
                                  url={replayUrl}
                                  controls
                                  width="100%"
                                  height="100%"
                                />
                              </div>
                            </div>
                          </div>
                        ) : replayExpired ? (
                          <div className="tw:mt-4 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-5">
                            <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                              Replay is no longer available.
                            </div>
                            <div className="tw:mt-2 tw:text-sm tw:text-slate-500">
                              The backend has already cleared access for this replay.
                            </div>
                          </div>
                        ) : hasReplay ? (
                          <div className="tw:mt-4 tw:rounded-3xl tw:border tw:border-amber-100 tw:bg-amber-50 tw:p-5">
                            <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                              Replay will be available soon
                            </div>
                            <div className="tw:mt-2 tw:text-sm tw:text-slate-600">
                              Replay is scheduled but not available yet.
                            </div>
                            {replayAvailableAt && (
                              <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                                Available at {formatReplayDateTime(replayAvailableAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="tw:mt-4 tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-5">
                            <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
                              Replay not uploaded yet
                            </div>
                            <div className="tw:mt-2 tw:text-sm tw:text-slate-500">
                              The organiser has enabled replay, but the replay video has not been uploaded yet.
                            </div>
                          </div>
                        )}
                      </div>

                      {isOwnerEvent && isEnded && replayEnabled && (
                        <div className="tw:w-full tw:max-w-sm tw:rounded-[22px] tw:bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] tw:p-4 tw:md:rounded-3xl tw:md:border tw:md:border-slate-200">
                          <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                            Replay management
                          </div>
                          <div className="tw:mt-3 tw:space-y-3 tw:text-sm tw:text-slate-600">
                            <div>
                              <div className="tw:text-xs tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                                Unlock delay
                              </div>
                              <div className="tw:mt-1 tw:font-medium tw:text-slate-900">
                                {formatReplayMinutes(event?.replay_available_after_minutes)}
                              </div>
                            </div>
                            <div>
                              <div className="tw:text-xs tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                                Expiry duration
                              </div>
                              <div className="tw:mt-1 tw:font-medium tw:text-slate-900">
                                {formatReplayMinutes(event?.replay_available_for_minutes)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplayUploadOpen(true)}
                            className="tw:mt-4 tw:inline-flex tw:h-11 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond"
                          >
                            <Upload className="tw:h-4 tw:w-4" />
                            <span>Upload replay video</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <aside className="tw:flex tw:flex-col tw:gap-6">
                <div className="tw:px-1 tw:py-2 tw:md:sticky tw:md:top-28">
                  <div className="tw:rounded-3xl tw:bg-[#FFFFFF] tw:p-4 tw:md:rounded-3xl tw:md:border tw:md:border-[#f1f5f9] tw:md:p-5">
                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                      <div>
                        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                          Ticket Access
                        </div>
                        <div className="tw:mt-3 tw:text-3xl tw:font-semibold tw:text-slate-900">
                          {priceDisplay}
                        </div>
                      </div>
                      <div className="tw:text-[11px] tw:font-medium">
                        <span className={`tw:px-3 tw:py-1 tw:rounded-full ${isEnded === "ended" ? "tw:bg-gray-500/20 tw:text-gray-700" : isLiveNow ? "tw:bg-red-500/20 tw:text-red-600" : isPaused ? "tw:bg-blue-300/30 tw:text-blue-800" : "tw:bg-amber-300/30 tw:text-amber-800"}`}>

                          {isLiveNow ? "Happening now" : event.status || "Upcoming"}
                        </span>
                      </div>
                    </div>

                    <div className="tw:mt-5 tw:space-y-3">
                      <div className="tw:flex tw:items-start tw:gap-3 tw:py-3">
                        <CalendarDays className="tw:mt-0.5 tw:h-4 tw:w-4 tw:text-primary" />
                        <div>
                          <div className="tw:text-xs tw:text-slate-500">When</div>
                          <div className="tw:text-sm tw:font-medium tw:text-slate-900">
                            {formattedDateTime || "Date not available"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasPaid && !isOwnerEvent && (
                      <div className="tw:mt-4 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-emerald-50 tw:px-3 tw:py-1.5 tw:text-[11px] tw:text-emerald-700">
                        <span className="tw:inline-block tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-500" />
                        <span>You already paid for this event</span>
                      </div>
                    )}

                    {manualAvailable && (
                      <div className="tw:my-6">
                        <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                          <div>
                            <div className="tw:text-xs tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                              Event Manual
                            </div>
                            <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                              {manual?.file_name || "Soft-copy manual"}
                            </div>
                            <div className="tw:my-1 tw:text-xs tw:text-slate-500">
                              {manualHasAccess
                                ? "You already have access to this manual."
                                : `Available for ${manualPriceDisplay}.`}
                            </div>
                          </div>
                          {manual?.cover_url && (
                            <img
                              src={manual.cover_url}
                              alt="Manual cover"
                              className="tw:h-16 tw:w-16 tw:rounded-2xl tw:object-cover"
                            />
                          )}
                        </div>

                        {canDownloadManual && (
                          <button
                            style={{
                              borderRadius: 24, marginTop: 12
                            }}
                            type="button"
                            onClick={handleDownloadManual}
                            className=" tw:w-full tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-primary/5 tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-primary tw:hover:bg-primary/10"
                          >
                            Download manual
                          </button>
                        )}
                      </div>
                    )}

                    {hasSponsoredTicketsAvailable && !hasPaid && (
                      <div className="tw:mb-4 tw:rounded-[18px] tw:border tw:border-primary/20 tw:bg-primary/5 tw:p-4">
                        <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                          {sponsoredTicketSponsors.length ? (
                            <>
                              <SponsorProfileLink sponsor={firstSponsor} className="tw:text-primary tw:hover:underline" />
                              {sponsorHeadlineSuffix}
                            </>
                          ) : (
                            "A kind person has bought tickets for others for this event."
                          )}
                        </div>
                        <div className="tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-600">
                          You can grab one of the free tickets, get your own ticket, or chip in to buy for others!
                        </div>
                        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                          <span className="tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-slate-700">
                            {sponsoredTicketsAvailableCount} available
                          </span>
                          {sponsoredTicketSponsors.slice(0, 3).map((sponsor) => (
                            <SponsorProfileLink
                              key={sponsor.id || sponsor.username}
                              sponsor={sponsor}
                              className="tw:rounded-full tw:bg-white/80 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-primary tw:hover:bg-white tw:hover:underline"
                            />
                          ))}

                        </div>
                      </div>
                    )}

                    {isOwnerEvent ? (
                      <>
                        {!isVodEvent && (
                          <>
                            <button
                              style={{
                                borderRadius: 24
                              }}
                              type="button"
                              disabled={startingStream}
                              onClick={handleOwnerStreamAction}
                              className="tw:mt-5 tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:text-xs tw:font-semibold tw:text-[#ffffff] tw:transition tw:hover:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:opacity-70 tw:md:h-12 tw:md:px-5 tw:md:text-sm"
                            >
                              {startingStream
                                ? "Starting stream..."
                                : isLiveNow || isPaused
                                  ? "Manage stream"
                                  : isEnded
                                    ? "View stream"
                                    : "Start stream"}
                            </button>

                            <span className="tw:mt-3 tw:text-xs tw:leading-6 tw:text-slate-500">
                              Open the stream control page to manage OBS credentials, go live, pause, resume, or end this event.
                            </span>
                          </>
                        )}

                        {isVodEvent && (
                          <span className="tw:block tw:mt-3 tw:text-xs tw:leading-6 tw:text-slate-500">
                            This is a VOD event. Stream controls are not needed.
                          </span>
                        )}

                        {canSponsorOwnEvent && (
                          <button
                            style={{
                              borderRadius: 24,
                              marginTop: 12
                            }}
                            type="button"
                            disabled={purchaseTicketMutation.isPending}
                            onClick={() => {
                              setPreferredPurchaseType("sponsored_only");
                              setPurchaseModalOpen(true);
                              setModalAutoTrigger(false);
                            }}
                            className="tw:mt-3 tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-white tw:px-4 tw:text-xs tw:font-semibold tw:text-primary tw:transition tw:hover:bg-primary/5 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:md:h-12 tw:md:px-5 tw:md:text-sm"
                          >
                            {purchaseTicketMutation.isPending ? "Processing..." : "Buy Tickets for Others"}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          style={{
                            borderRadius: 24
                          }}
                          type="button"
                          disabled={ctaDisabled}
                          onClick={handlePrimaryAction}
                          className={`tw:mt-5 tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:px-4 tw:text-xs tw:font-semibold tw:transition tw:md:h-12 tw:md:px-5 tw:md:text-sm ${ctaDisabled
                            ? "tw:cursor-not-allowed tw:bg-slate-200 tw:text-slate-500"
                            : "tw:bg-primary tw:text-[#ffffff] tw:hover:bg-primarySecond"
                            }`}
                        >
                          {primaryCtaLabel}
                          {!ctaDisabled && !hasPaid && !canClaimSponsoredTicket && !shouldChoosePurchaseType && (
                            <span className="tw:ml-1 tw:text-[11px] tw:opacity-80 tw:md:text-xs">
                              ({priceText(event)})
                            </span>
                          )}
                        </button>

                        {canClaimSponsoredTicket && canOpenPurchaseOptions ? (
                          <button
                            style={{
                              borderRadius: 24,
                              marginTop: 12
                            }}
                            type="button"
                            disabled={purchaseTicketMutation.isPending}
                            onClick={handleOpenPurchaseOptions}
                            className="tw:mt-3 tw:flex tw:h-10 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-white tw:px-4 tw:text-xs tw:font-semibold tw:text-primary tw:transition tw:hover:bg-primary/5 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:md:h-12 tw:md:px-5 tw:md:text-sm"
                          >
                            {purchaseTicketMutation.isPending
                              ? "Processing..."
                              : "Buy Tickets or Buy for Others"}
                          </button>
                        ) : null}

                        <span className="tw:block tw:mt-3 tw:text-xs tw:leading-6 tw:text-slate-500">
                          {hasPaid
                            ? isLiveNow
                              ? "You already have access. Tap the button above to join the live experience."
                              : canBuyManualOnly
                                ? "Your ticket is secured. You can still buy the event manual."
                                : "Your ticket is secured. We will notify you when the event starts."
                            : canClaimSponsoredTicket
                              ? "A free ticket is available for you to claim now. You can still buy a ticket or buy for others from the purchase options."
                              : shouldChoosePurchaseType
                                ? "Choose whether you want the ticket only, ticket plus manual, or manual access where available."
                                : "Secure checkout and fast access to your purchased ticket."}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="tw:mt-4 tw:rounded-3xl tw:bg-[#FFFFFF] tw:p-4 tw:md:mt-5 tw:md:rounded-3xl tw:md:border tw:md:border-[#f1f5f9] tw:md:p-5 tw:md:shadow-[0_12px_30px_rgba(148,163,184,0.10)]">
                    <div className="tw:flex tw:items-start tw:gap-4">
                      <div className="tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-white">
                        {hostHasImage ? (
                          <img
                            src={event.hostImage}
                            alt={hostName}
                            className="tw:h-full tw:w-full tw:object-cover"
                          />
                        ) : (
                          <span className="tw:text-sm tw:font-semibold tw:text-primary">
                            {hostInitials}
                          </span>
                        )}
                      </div>

                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                          Organizer
                        </div>
                        <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:text-lg tw:font-semibold tw:text-slate-900">
                          <span className="tw:truncate">
                            {event.hostName || "Organizer"}
                          </span>
                          {event.hostHasActiveSubscription && (
                            <SubscriptionBadge className="tw:size-4" />
                          )}
                        </div>

                      </div>
                    </div>

                    <div className="tw:mt-4 tw:flex tw:flex-wrap tw:gap-2">

                      {isSaved && (
                        <div className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-[#eef4ff] tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-[#3158c9]">
                          Saved
                        </div>
                      )}
                    </div>

                    <div className="tw:mt-5 tw:grid tw:grid-cols-2 tw:md:grid-cols-2 tw:gap-3">
                      <button
                        style={{
                          borderRadius: 24
                        }}
                        type="button"
                        onClick={handleToggleFollow}
                        disabled={followLoading || !event.hostId}
                        className={`tw:flex tw:h-10 tw:items-center tw:justify-center tw:rounded-2xl tw:border tw:px-3 tw:text-xs tw:font-medium tw:transition tw:md:h-11 tw:md:text-sm ${isFollowing
                          ? "tw:border-primary/25 tw:bg-[#ffffff] tw:text-primary"
                          : "tw:border-transparent tw:bg-[#f4f7fb] tw:text-slate-800 tw:hover:bg-[#ebf1f8]"
                          } ${followLoading ? "tw:cursor-not-allowed tw:opacity-70" : ""
                          }`}
                      >
                        {followLoading
                          ? "Updating..."
                          : isFollowing
                            ? "Following"
                            : "Follow Organizer"}
                      </button>

                      <Link
                        style={{
                          color: "#ffffff"
                        }}
                        to={
                          event.organiserUserId || event.organiserId
                            ? `/profile/${event.organiserUserId || event.organiserId}`
                            : "/organizers"
                        }
                        className="tw:flex tw:h-10 tw:items-center tw:justify-center tw:rounded-3xl tw:px-3 tw:bg-primary tw:text-xs tw:font-medium tw:text-[#ffffff] tw:hover:bg-primarySecond tw:md:h-11 tw:md:text-sm"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <EventReviewsSection
            eventId={event?.id}
            eventSummary={event?.reviews}
            token={token}
            currentUser={user}
            onReviewMutationSuccess={refreshEventDetailSilently}
          />
        </div>
      </div>

      <div className="tw:fixed tw:bottom-20 tw:left-0 tw:right-0 tw:z-40 tw:px-3 tw:md:hidden">
        <div className="tw:rounded-[28px] tw:border tw:border-[#ffffff]/80 tw:bg-[#ffffff]/88 tw:p-3 tw:shadow-[0_18px_45px_rgba(15,23,42,0.18)] tw:backdrop-blur-2xl">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <div className="tw:min-w-0">
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                Ticket Access
              </div>
              <div className="tw:truncate tw:text-lg tw:font-semibold tw:text-slate-900">
                {priceDisplay}
              </div>
            </div>

            {isOwnerEvent ? (
              <button
                style={{ borderRadius: 18 }}
                type="button"
                disabled={startingStream}
                onClick={handleOwnerStreamAction}
                className="tw:flex tw:h-10 tw:min-w-[138px] tw:shrink-0 tw:items-center tw:justify-center tw:bg-primary tw:px-3 tw:text-xs tw:font-semibold tw:text-[#ffffff] tw:transition tw:hover:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:opacity-70"
              >
                {startingStream ? "Starting..." : isLiveNow || isPaused ? "Manage stream" : "Start stream"}
              </button>
            ) : (
              <div className="tw:flex tw:shrink-0 tw:flex-col tw:gap-2">
                <button
                  style={{ borderRadius: 18 }}
                  type="button"
                  disabled={ctaDisabled}
                  onClick={handlePrimaryAction}
                  className={`tw:flex tw:h-10 tw:min-w-[138px] tw:items-center tw:justify-center tw:px-3 tw:text-xs tw:font-semibold tw:transition ${ctaDisabled
                    ? "tw:cursor-not-allowed tw:bg-slate-200 tw:text-slate-500"
                    : "tw:bg-primary tw:text-[#ffffff] tw:hover:bg-primarySecond"
                    }`}
                >
                  {primaryCtaLabel}
                </button>
                {canClaimSponsoredTicket && canOpenPurchaseOptions ? (
                  <button
                    style={{ borderRadius: 18 }}
                    type="button"
                    disabled={purchaseTicketMutation.isPending}
                    onClick={handleOpenPurchaseOptions}
                    className="tw:flex tw:h-9 tw:min-w-[138px] tw:items-center tw:justify-center tw:border tw:border-primary/20 tw:bg-white tw:px-3 tw:text-[11px] tw:font-semibold tw:text-primary tw:transition tw:hover:bg-primary/5 tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
                  >
                    Buy for others
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

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
