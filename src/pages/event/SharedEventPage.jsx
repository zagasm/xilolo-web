import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Share2,
} from "lucide-react";
import SEO from "../../component/SEO";
import EventShareModal from "../../component/Events/EvenetShareModal";
import TicketPromptModal from "../../component/Events/TicketPromptModal";
import YouMayAlsoLike from "../../component/Events/YouMayAlsoLike";
import EventReviewsSection from "../../component/Events/EventReviewsSection.jsx";
import SubscriptionBadge from "../../component/ui/SubscriptionBadge.jsx";
import { formatEventDateTime } from "../../utils/ui";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showSuccess } from "../../component/ui/toast";
import FundWalletModal from "../../features/wallet/components/FundWalletModal";
import TicketPurchaseSuccessModal from "../../features/wallet/components/TicketPurchaseSuccessModal";
import WalletFundingRequiredModal from "../../features/wallet/components/WalletFundingRequiredModal";
import { useSharedEventPage } from "../../features/eventShare/hooks/useSharedEventPage";
import { useEventShareFlow } from "../../features/eventShare/hooks/useEventShareFlow";
import {
  useClaimSponsoredTicket,
  usePurchaseTicketWithWallet,
} from "../../features/wallet/hooks/usePurchaseTicketWithWallet";
import { useAuth } from "../auth/AuthContext";
import {
  getEventDescription,
  normalizeSharePayload,
} from "../../features/eventShare/shareUtils";
import {
  eventStartDate,
  formatMetaLine,
  priceText,
} from "../../component/Events/SingleEvent";
import {
  clearPendingPurchaseIntent,
  setPendingPurchaseIntent,
} from "../../features/wallet/store/walletFlowSlice";
import {
  formatWalletMoney,
  getApiErrorCode,
  getApiErrorMessage,
  getFundingRequiredDetails,
} from "../../features/wallet/walletUtils";

function firstPosterUrl(event) {
  return (
    event?.poster?.find((item) => item?.type === "image" && item?.url)?.url ||
    ""
  );
}

function formatStartsInLabel(startDate) {
  if (!startDate) return "Schedule pending";

  const diff = startDate.getTime() - Date.now();
  if (diff <= 0) return "Starting soon";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function SharedEventShimmer() {
  return (
    <div className="tw:min-h-screen tw:bg-[radial-gradient(circle_at_top_left,#d9ebff_0%,#f6f9fc_34%,#eef4fb_72%,#f8fbff_100%)] tw:pt-20 tw:pb-14">
      <div className="tw:mx-auto tw:max-w-7xl tw:px-4 tw:md:px-6">
        <div className="tw:h-12 tw:w-40 tw:animate-pulse tw:rounded-full tw:bg-white/70" />
        <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-8 tw:xl:grid-cols-[1.2fr_0.8fr]">
          <div className="tw:h-[440px] tw:animate-pulse tw:rounded-[34px] tw:bg-white/75" />
          <div className="tw:space-y-5">
            <div className="tw:h-52 tw:animate-pulse tw:rounded-[30px] tw:bg-white/75" />
            <div className="tw:h-72 tw:animate-pulse tw:rounded-[30px] tw:bg-white/75" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharedEventPage() {
  const { shareKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { token, user } = useAuth();
  const sharedEventQuery = useSharedEventPage(shareKey);
  const shareFlow = useEventShareFlow();
  const [localEvent, setLocalEvent] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseSuccessOpen, setPurchaseSuccessOpen] = useState(false);
  const [fundingRequiredOpen, setFundingRequiredOpen] = useState(false);
  const [fundWalletOpen, setFundWalletOpen] = useState(false);
  const [fundingRequiredDetails, setFundingRequiredDetails] = useState(null);
  const [purchaseSummary, setPurchaseSummary] = useState(null);

  const event = localEvent || sharedEventQuery.data?.event;
  const sharePayload = sharedEventQuery.data?.share;
  const recommended = sharedEventQuery.data?.recommended || [];
  const coverUrl = sharePayload?.coverUrl || firstPosterUrl(event);
  const description = getEventDescription(event);
  const formattedDateTime = formatEventDateTime(
    event?.eventDate,
    event?.startTime
  );
  const startDate = eventStartDate(event);
  const startsInLabel = formatStartsInLabel(startDate);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setLocalEvent(sharedEventQuery.data?.event || null);
  }, [sharedEventQuery.data?.event]);

  const purchaseTicketMutation = usePurchaseTicketWithWallet({
    onSuccess: (payload) => {
      const purchaseData = payload?.data || payload || {};
      const purchaseType = purchaseData?.purchase_type || "ticket_only";
      const includesManual = !!purchaseData?.includes_manual;

      setLocalEvent((previous) =>
        previous
          ? {
              ...previous,
              hasPaid: purchaseType === "manual_only" ? !!previous?.hasPaid : true,
              manual: previous?.manual
                ? {
                    ...previous.manual,
                    viewer_has_access:
                      includesManual || previous.manual.viewer_has_access,
                    viewer_has_purchased:
                      includesManual || previous.manual.viewer_has_purchased,
                    viewer_has_ticket: true,
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
      showSuccess(
        purchaseType === "manual_only"
          ? "Manual purchased successfully."
          : includesManual
            ? "Ticket and manual purchased successfully."
            : "Ticket purchased successfully."
      );
    },
  });

  const claimSponsoredTicketMutation = useClaimSponsoredTicket({
    onSuccess: () => {
      setLocalEvent((previous) =>
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
            }
          : previous
      );
      showSuccess("Paid ticket claimed successfully.");
    },
  });

  const structuredData = useMemo(() => {
    if (!event) return [];

    return [
      {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event?.title,
        description,
        image: coverUrl ? [coverUrl] : undefined,
        startDate: event?.eventDate && event?.startTime
          ? `${event.eventDate} ${event.startTime}`
          : undefined,
        eventAttendanceMode:
          event?.eventType?.toLowerCase() === "virtual"
            ? "https://schema.org/OnlineEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
        location:
          event?.eventType?.toLowerCase() === "virtual"
            ? { "@type": "VirtualLocation", url: sharePayload?.url || "" }
            : {
              "@type": "Place",
              name: event?.location || "Event location",
              address: event?.address || "",
            },
        organizer: {
          "@type": "Organization",
          name: event?.hostName || "Xilolo",
        },
      },
    ];
  }, [coverUrl, description, event, sharePayload?.url]);

  const handleShare = async () => {
    if (!event && !sharePayload) return;

    await shareFlow.startShare({
      eventId: event?.id,
      initialPayload:
        sharePayload || normalizeSharePayload({ event, share: sharePayload }),
    });
  };

  const manual = event?.manual || {};
  const purchaseOptions = event?.purchase_options || {};
  const manualAvailable = !!manual?.available;
  const manualHasAccess = !!manual?.viewer_has_access;
  const ticketOnlyAvailable =
    !event?.is_sold_out &&
    (!!purchaseOptions.ticket_only ||
      (!event?.hasPaid && Number(event?.price ?? 0) > 0));
  const ticketAndManualAvailable =
    manualAvailable && !!purchaseOptions.ticket_and_manual && !manualHasAccess;
  const manualOnlyAvailable =
    manualAvailable && !!purchaseOptions.manual_only && !manualHasAccess;
  const purchaseChoiceCount = [
    ticketOnlyAvailable,
    ticketAndManualAvailable,
    manualOnlyAvailable,
  ].filter(Boolean).length;
  const shouldChoosePurchaseType =
    purchaseChoiceCount > 1 || ticketAndManualAvailable || manualOnlyAvailable;
  const priceDisplay =
    event?.price_display ||
    `${event?.currency?.symbol || "₦"}${event?.price || "0"}`;
  const isSoldOut = !!event?.is_sold_out;
  const hasPaid = !!event?.hasPaid;
  const hasSponsoredTicketsAvailable = !!event?.has_sponsored_tickets_available;
  const sponsoredTicketsAvailableCount = Number(event?.sponsored_tickets_available_count || 0);
  const canClaimSponsoredTicket = !!event?.can_claim_sponsored_ticket;

  const handleDownloadManual = async () => {
    if (!event?.id) return;

    if (!token) {
      navigate("/auth/signin", { state: { from: location.pathname } });
      return;
    }

    try {
      const endpoint =
        manual?.download_endpoint || `/api/v1/events/${event.id}/manual/download`;
      const response = await api.get(endpoint, authHeaders(token));
      const payload = response?.data?.data || response?.data || {};
      const downloadUrl = payload?.download_url;

      if (!downloadUrl) {
        showError("Manual download is not available right now.");
        return;
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
      setLocalEvent((previous) =>
        previous
          ? {
              ...previous,
              manual: previous.manual
                ? {
                    ...previous.manual,
                    viewer_has_access: true,
                    download_endpoint: endpoint,
                  }
                : previous.manual,
            }
          : previous
      );
    } catch (error) {
      showError(
        getApiErrorMessage(error, "Unable to download the event manual.")
      );
    }
  };

  const handleGetTicket = async (purchaseType = "ticket_only", quantity = 1) => {
    if (!event?.id || event?.is_sold_out || purchaseTicketMutation.isPending) {
      return;
    }

    if (!token) {
      navigate("/auth/signin", {
        state: { from: location.pathname },
      });
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
            sourcePage: "shared_event",
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
        setLocalEvent((previous) =>
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
    }
  };

  const handleClaimSponsoredTicket = async () => {
    if (!event?.id || claimSponsoredTicketMutation.isPending) return;

    if (!token) {
      navigate("/auth/signin", {
        state: { from: location.pathname },
      });
      return;
    }

    try {
      await claimSponsoredTicketMutation.mutateAsync(event.id);
    } catch (claimError) {
      showError(getApiErrorMessage(claimError, "Unable to claim paid ticket."));
    }
  };

  const handlePrimaryAction = () => {
    if (hasPaid) {
      navigate("/tickets");
      return;
    }

    if (isSoldOut || purchaseTicketMutation.isPending || claimSponsoredTicketMutation.isPending) return;

    if (shouldChoosePurchaseType) {
      setPurchaseModalOpen(true);
      return;
    }

    handleGetTicket(ticketAndManualAvailable ? "ticket_and_manual" : "ticket_only");
  };

  const primaryActionLabel = hasPaid
    ? "View my ticket"
    : isSoldOut
      ? "Sold out"
      : purchaseTicketMutation.isPending
        ? "Processing..."
        : shouldChoosePurchaseType
          ? "Buy Ticket"
          : `Buy Ticket (${priceDisplay})`;

  if (sharedEventQuery.isLoading) {
    return <SharedEventShimmer />;
  }

  if (sharedEventQuery.isError || !event) {
    return (
      <div className="tw:min-h-screen tw:bg-[radial-gradient(circle_at_top_left,#d9ebff_0%,#f6f9fc_34%,#eef4fb_72%,#f8fbff_100%)] tw:pt-24 tw:pb-16">
        <div className="tw:mx-auto tw:max-w-3xl tw:px-4">
          <div className="tw:rounded-[34px] tw:border tw:border-white/80 tw:bg-white/80 tw:p-8 tw:text-center tw:shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
            <span className="tw:block tw:text-2xl tw:font-semibold tw:text-slate-900">
              Event unavailable
            </span>
            <span className="tw:block tw:mt-3 tw:text-sm tw:leading-7 tw:text-slate-600">
              This shared event link is unavailable or may have expired.
            </span>
            <button
            style={{
              borderRadius: 16
            }}
              type="button"
              onClick={() => navigate(-1)}
              className="tw:mt-6 tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-5 tw:py-3 tw:text-sm tw:font-semibold tw:text-white hover:tw:bg-primarySecond"
            >
              <ArrowLeft className="tw:h-4 tw:w-4" />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={event?.title || "Shared Event"}
        description={description}
        image={coverUrl || "/images/event-dummy.jpg"}
        url={sharePayload?.url}
        type="article"
        structuredData={structuredData}
      />

      <Helmet>
        <meta property="og:title" content={event?.title || "Shared Event"} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={coverUrl || "/images/event-dummy.jpg"} />
        <meta property="og:url" content={sharePayload?.url || ""} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event?.title || "Shared Event"} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={coverUrl || "/images/event-dummy.jpg"}
        />
      </Helmet>

      <div className="tw:min-h-screen tw:bg-[radial-gradient(circle_at_top_left,#d9ebff_0%,#f6f9fc_34%,#eef4fb_72%,#f8fbff_100%)] tw:pb-16 tw:pt-20">
        <div className="tw:mx-auto tw:max-w-7xl tw:px-4 tw:md:px-6 tw:lg:px-8">
          <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[28px] tw:border tw:border-white/70 tw:bg-white/55 tw:px-4 tw:py-3 tw:shadow-[0_24px_60px_rgba(148,163,184,0.15)] tw:backdrop-blur-2xl">
            <button
            style={{
  borderRadius: 16
            }}
              type="button"
              onClick={() => navigate(-1)}
              className="tw:inline-flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-white/80 tw:bg-white/80 tw:text-slate-700 tw:shadow-sm hover:tw:bg-white"
            >
              <ArrowLeft className="tw:h-4 tw:w-4" />
            </button>

            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-slate-500">
                Shared Event
              </div>
              <div className="tw:truncate tw:text-base tw:font-semibold tw:text-slate-900 tw:md:text-lg">
                {event?.title}
              </div>
            </div>

            <button
            style={{
  borderRadius: 16
            }}
              type="button"
              onClick={handleShare}
              disabled={shareFlow.shareInProgress}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white hover:tw:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:opacity-80"
            >
              {shareFlow.shareInProgress ? (
                <span className="tw:h-4 tw:w-4 tw:animate-spin tw:rounded-full tw:border-2 tw:border-white/80 tw:border-t-transparent" />
              ) : (
                <Share2 className="tw:h-4 tw:w-4" />
              )}
              {shareFlow.shareInProgress ? "Sharing..." : "Share"}
            </button>
          </div>

          <section className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-8 tw:xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="tw:min-w-0 tw:space-y-6">
              <div className="tw:overflow-hidden tw:rounded-[34px] tw:border tw:border-white/70 tw:bg-white/60 tw:shadow-[0_30px_90px_rgba(15,23,42,0.08)] tw:backdrop-blur-2xl">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={event?.title || "Event cover"}
                    className="tw:h-[280px] tw:w-full tw:object-cover tw:md:h-[520px]"
                  />
                ) : (
                  <div className="tw:flex tw:h-[280px] tw:items-center tw:justify-center tw:bg-white/75 tw:text-slate-500 tw:md:h-[520px]">
                    Event cover unavailable
                  </div>
                )}
              </div>

              <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
                <div className="tw:rounded-[26px] tw:border tw:border-white/75 tw:bg-white/68 tw:p-5 tw:shadow-[0_18px_50px_rgba(148,163,184,0.12)] tw:backdrop-blur-xl">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-slate-500">
                    <CalendarDays className="tw:h-4 tw:w-4" />
                    <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em]">
                      Schedule
                    </span>
                  </div>
                  <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                    {formattedDateTime || formatMetaLine(event)}
                  </div>
                </div>

                <div className="tw:rounded-[26px] tw:border tw:border-white/75 tw:bg-white/68 tw:p-5 tw:shadow-[0_18px_50px_rgba(148,163,184,0.12)] tw:backdrop-blur-xl">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-slate-500">
                    <Clock className="tw:h-4 tw:w-4" />
                    <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em]">
                      Starts In
                    </span>
                  </div>
                  <div className="tw:mt-3 tw:text-sm tw:font-medium tw:text-slate-900">
                    {startsInLabel}
                  </div>
                </div>
              </div>

              <div className="tw:rounded-[30px] tw:border tw:border-white/75 tw:bg-white/68 tw:p-7 tw:shadow-[0_20px_60px_rgba(148,163,184,0.12)] tw:backdrop-blur-2xl">
                <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                  About This Event
                </div>
                <p className="tw:mt-4 tw:text-sm tw:leading-7 tw:text-slate-600 tw:md:text-[15px]">
                  {event?.description ||
                    "This event does not have a published description yet."}
                </p>
              </div>
            </div>

            <aside className="tw:min-w-0 tw:flex tw:flex-col tw:gap-6">
              <div className="tw:rounded-[30px] tw:border tw:border-white/75 tw:bg-white/70 tw:p-5 tw:shadow-[0_20px_60px_rgba(148,163,184,0.14)] tw:backdrop-blur-2xl">
                <div className="tw:rounded-3xl tw:bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] tw:p-5 tw:border tw:border-white/80">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                    <div>
                      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
                        Shared By
                      </div>
                      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:text-2xl tw:font-semibold tw:text-slate-900">
                        <span className="tw:truncate">
                          {event?.hostName || "Event Organizer"}
                        </span>
                        {event?.hostHasActiveSubscription && (
                          <SubscriptionBadge className="tw:size-5" />
                        )}
                      </div>
                    </div>

                    <div className="tw:rounded-2xl tw:bg-slate-950 tw:px-4 tw:py-3 tw:text-right">
                      <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-white/60">
                        Ticket
                      </div>
                      <div className="tw:mt-1 tw:break-words tw:text-lg tw:font-semibold tw:text-white">
                        {priceText(event)}
                      </div>
                    </div>
                  </div>

                  <p className="tw:mt-4 tw:text-sm tw:leading-6 tw:text-slate-600">
                    Open this event in Xilolo to follow the organizer, buy access, and keep up with live updates.
                  </p>

                  <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-3">
                    {hasSponsoredTicketsAvailable && !hasPaid && (
                      <div className="tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-primary/5 tw:p-4">
                        <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                          Someone has paid for tickets for this event.
                        </div>
                        <div className="tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-600">
                          You can claim one free paid ticket, buy your own ticket, or sponsor tickets for others.
                        </div>
                        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                          <span className="tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-slate-700">
                            {sponsoredTicketsAvailableCount} available
                          </span>
                          {canClaimSponsoredTicket && (
                            <button
                              type="button"
                              onClick={handleClaimSponsoredTicket}
                              disabled={claimSponsoredTicketMutation.isPending}
                              className="tw:rounded-full tw:bg-primary tw:px-3 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-white hover:tw:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:opacity-70"
                            >
                              {claimSponsoredTicketMutation.isPending ? "Claiming..." : "Claim paid ticket"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                    style={{

        borderRadius: 16
                    }}
                      type="button"
                      onClick={handlePrimaryAction}
                      disabled={isSoldOut || purchaseTicketMutation.isPending || claimSponsoredTicketMutation.isPending}
                      className="tw:flex tw:min-h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-white hover:tw:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:bg-slate-300 tw:disabled:text-slate-600"
                    >
                      {primaryActionLabel}
                    </button>

                    <button
                    style={{

        borderRadius: 16
                    }}
                      type="button"
                      onClick={handleShare}
                      disabled={shareFlow.shareInProgress}
                      className="tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:text-sm tw:font-semibold tw:text-slate-900 hover:tw:bg-slate-50 tw:disabled:cursor-not-allowed tw:disabled:opacity-80"
                    >
                      {shareFlow.shareInProgress ? (
                        <span className="tw:h-4 tw:w-4 tw:animate-spin tw:rounded-full tw:border-2 tw:border-slate-500/70 tw:border-t-transparent" />
                      ) : (
                        <Share2 className="tw:h-4 tw:w-4" />
                      )}
                      {shareFlow.shareInProgress ? "Sharing..." : "Share event"}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <div className="tw:mt-10">
            <YouMayAlsoLike
              recs={recommended}
              posterFallback={coverUrl}
              title="You may also like"
            />
          </div>

          <EventReviewsSection
            eventId={event?.id}
            eventSummary={event?.reviews}
            token={token}
            currentUser={user}
            onReviewMutationSuccess={async () => {
              await sharedEventQuery.refetch();
            }}
          />
        </div>
      </div>

      <div className="tw:fixed tw:bottom-5 tw:left-0 tw:right-0 tw:z-40 tw:px-4 tw:xl:hidden">
        <div className="tw:rounded-[24px] tw:border tw:border-white/80 tw:bg-white/90 tw:p-3 tw:shadow-[0_18px_45px_rgba(15,23,42,0.18)] tw:backdrop-blur-2xl">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <div className="tw:min-w-0">
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-500">
                Ticket Access
              </div>
              <div className="tw:truncate tw:text-lg tw:font-semibold tw:text-slate-900">
                {priceDisplay}
              </div>
            </div>

            <button
            style={{
  borderRadius: 16
            }}
              type="button"
              onClick={handlePrimaryAction}
              disabled={isSoldOut || purchaseTicketMutation.isPending || claimSponsoredTicketMutation.isPending}
              className="tw:flex tw:min-w-[168px] tw:items-center tw:justify-center tw:rounded-[18px] tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:disabled:cursor-not-allowed tw:disabled:bg-slate-300 tw:disabled:text-slate-600"
            >
              {hasPaid ? "View my ticket" : isSoldOut ? "Sold out" : "Buy ticket"}
            </button>
          </div>
        </div>
      </div>

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
        onClose={() => setPurchaseModalOpen(false)}
        event={event}
        onBuy={(purchaseType, quantity) => handleGetTicket(purchaseType, quantity)}
        onDownloadManual={handleDownloadManual}
        buying={purchaseTicketMutation.isPending}
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
        prefilledAmount={fundingRequiredDetails?.deficit_amount || 0}
        source="shared_event_purchase"
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
    </>
  );
}
