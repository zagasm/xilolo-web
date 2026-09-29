import { Fragment, useState, useEffect, useMemo } from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { Routes, Route, useLocation } from "react-router-dom";
import AuthLayout from "./pages/auth/layout";
import { SignUp } from "./pages/auth/signup/SignupPage.jsx";
import { Signin } from "./pages/auth/signin/SigninPage.jsx";
import { CodeVerification } from "./pages/auth/CodeVerification";
import { ForgetPassword } from "./pages/auth/Forgetpassword";
import { Error404 } from "./pages/errors/pagenotfound";
import Sidebar from "./component/assets/sidebar/sidebar";
import { Outlet } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import { ChangePassword } from "./pages/auth/ChangePassword";
import "react-toastify/dist/ReactToastify.css";
import NetworkStatus from "./component/assets/NetworkStatus";
import Home from "./pages/Home/index.jsx";

import FullpagePreloader from "./component/assets/FullPagePreloader/index.jsx";

import { SigninWithCode } from "./pages/auth/signin/SignCode.jsx";
import { ChangePasswordSuccesffully } from "./pages/auth/ChangePassword/successPasswordChange.jsx";
import AppleCallbackPage from "./pages/auth/AppleCallbackPage.jsx";
import Navbar from "./pages/pageAssets/Navbar.jsx";
import PostSignupForm from "./component/assets/ModalContext/signupForm/PostSignUpForm.jsx";
import Sessionpage from "./pages/auth/SessionPage/index.jsx";
import Event from "./pages/event/EventOutlet.jsx";
import ViewEvent from "./pages/event/ViewEvent/index.jsx";
import CreateEvent from "./pages/event/CreateEvent/index.jsx";
import SaveEvents from "./pages/event/SaveEvent/index.jsx";
import AllOrganizers from "./pages/Organizers/index.jsx";
import AccountOutlet from "./pages/Account/AccountOutlet.jsx";
import Account from "./pages/Account/index.jsx";
import AccountInterest from "./pages/Account/interest/index.jsx";
import AccountNotification from "./pages/Account/manageNotification/index.jsx";
import EditProfile from "./pages/Profile/editProfile/index.jsx";
import Profile from "./pages/Profile/index.jsx";
import EditPassword from "./pages/Profile/EditPassword/index.jsx";
import AllNotification from "./pages/Notification/AllNotification/index.jsx";
import Notification from "./pages/Notification/index.jsx";
import EventType from "./pages/event/CreateEvent/event_types.jsx";
import ViewProfile from "./pages/Profile/ViewProfile/index.jsx";
import Landing from "./pages/LandingPage/index.jsx";
import { ToastHost } from "./component/ui/toast.jsx";
import Support from "./pages/support/index.jsx";
import SupportChatPage from "./pages/support/SupportChatPage.jsx";
import Marketing from "./pages/marketing/index.jsx";
import StreamingPage from "./pages/Streaming/index.jsx";
import DataProtectionPage from "./pages/DataProtection/index.jsx";
import TicketsPage from "./pages/tickets/TicketsPage.jsx";
import TicketReceiptScreen from "./pages/tickets/TicketReceiptScreen.jsx";
import PaymentCallback from "./pages/payment/PaymentCallback.jsx";
import SearchPage from "./pages/Search/index.jsx";
import OrganisersIFollow from "./pages/following/OrganisersIFollow.jsx";
import OrganiserFollowers from "./pages/following/OrgaaniserFollowers.jsx";
import BecomeOrganiser from "./pages/Organizers/BecomeOrganizer.jsx";
import DiditCallback from "./pages/Organizers/DiditCallback.jsx";
import SubscriptionsPage from "./pages/subscription/index.jsx";
import PrivacyPolicyPage from "./pages/privacy/index.jsx";
import CommunityGuidelinesPage from "./pages/communityGuideline/index.jsx";
import TermsOfServicePage from "./pages/terms/index.jsx";
import TaggedMentionsPage from "./pages/mentions/index.jsx";
import LandingLayout from "./layouts/LandingLayout.jsx";
import AboutPage from "./pages/LandingPage/about.jsx";
import ContactPage from "./pages/LandingPage/contact.jsx";
import AdsPage from "./pages/LandingPage/ads.jsx";
// Dev-only design showcase: /design (primitives + nav states). Registered below
// behind import.meta.env.DEV so it can never ship to production.
import DesignSystem from "./pages/DesignSystem/index.jsx";
// Dev-only preview of the AUTH-GATED signed-in home (/feed), so its layout can be
// screenshotted and measured without an account. DEV-gated below; never shipped.
import HomePreview from "./pages/Home/HomePreview.jsx";
// Dev-only preview of the AUTH-GATED tickets screen (/tickets), so its layout can
// be screenshotted and measured without an account. DEV-gated below; never shipped.
import TicketsPreview from "./pages/tickets/TicketsPreview.jsx";
import CreateEventPreview from "./pages/event/CreateEvent/CreateEventPreview.jsx";
import BlockedUsersPage from "./pages/Account/Blocked/index.jsx";
import CryptoWalletsPage from "./pages/crypto/index.jsx";
import FundWalletPage from "./pages/Account/FundWallet/index.jsx";
import EventEditPage from "./pages/event/EventEditPage.jsx";
// import DisableRightClick from "./component/DisableRightClick.jsx";
import ScrollToTop from "./component/ScrollToTop.jsx";
import EventShareRedirect from "./component/Events/EventShareRedirect.jsx";
import EventStreamControlPage from "./pages/event/EventStreamControlPage.jsx";
import EventStreamAnalyticsPage from "./pages/event/EventStreamAnalyticsPage.jsx";
import EventCheckinControlPage from "./pages/event/EventCheckinControlPage.jsx";
import VodWatchPage from "./pages/event/VodWatchPage.jsx";
import BankAccountsPage from "./pages/Account/BankAccountsPage.jsx";
import WalletPage from "./features/wallet/pages/WalletPage.jsx";
import WalletFundingCallbackPage from "./features/wallet/pages/WalletFundingCallbackPage.jsx";
import WalletFundingCancelPage from "./features/wallet/pages/WalletFundingCancelPage.jsx";
import SharedEventPage from "./pages/event/SharedEventPage.jsx";
import EventDeepLinkPage from "./pages/event/EventDeepLinkPage.jsx";

import SEO from "./component/SEO/index.jsx";
import DownloadAppModal from "./component/DownloadAppModal.jsx";
import SignalDeck from "./pages/SignalDeck/index.jsx";
import AccountPayouts from "./pages/Account/AccountPayouts.jsx";
import AccountPayoutHistory from "./pages/Account/AccountPayoutHistory.jsx";
import WalletHub from "./pages/Account/WalletHub.jsx";
import ForcedLogoutModalHost from "./component/auth/ForcedLogoutModalHost.jsx";
import SharedProfileRedirectPage from "./pages/Profile/SharedProfileRedirectPage.jsx";
import SecurityPage from "./pages/Account/SecurityPage.jsx";
import TwoFactorSecurityPrompt from "./component/auth/TwoFactorSecurityPrompt.jsx";
import XiloloAssistantWidget from "./features/xiloloAssistant/XiloloAssistantWidget.jsx";
import MaintenancePage from "./pages/MaintenancePage.jsx";

const MainLayout = () => (
  <>
    <PostSignupForm />
    <Navbar />
    <Outlet />
  </>
);

export function App() {
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Detects route changes
  const state = location.state;
  if (typeof global === "undefined") {
    window.global = window;
  }
  useEffect(() => {
    setLoading(true); // Show preloader
    const timer = setTimeout(() => setLoading(false), 100); // Simulate load time

    return () => clearTimeout(timer);
  }, [location.pathname]); // Runs on every route change
  const background = location.state?.background;
  const canonicalUrl = `${window?.location?.origin || ""}${location.pathname}`;

  const pageMetadata = useMemo(() => {
    const routes = [
      {
        matcher: /^\/$/,
        meta: {
          title: "Discover Live Events, Creators & Tickets",
          description:
            "Discover live events, streamable experiences, creator communities, and ticketed moments on Xilolo.",
          keywords:
            "Xilolo, live events, event tickets, online events, event creators, event discovery, streaming events",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/about$/,
        meta: {
          title: "About Xilolo",
          description:
            "Learn how Xilolo helps people discover events, connect with organizers, buy tickets, and follow live experiences.",
          keywords:
            "about Xilolo, event platform, creator platform, live experiences",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/contact$/,
        meta: {
          title: "Contact Xilolo",
          description:
            "Contact Xilolo for support, partnerships, organizer help, ticket questions, and platform enquiries.",
          keywords:
            "contact Xilolo, Xilolo support, event platform support, organizer help",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/ads$/,
        meta: {
          title: "Advertise Events on Xilolo",
          description:
            "Promote events, creators, campaigns, and experiences to the Xilolo community with advertising placements.",
          keywords:
            "event advertising, promote events, Xilolo ads, creator marketing",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/support$/,
        meta: {
          title: "Xilolo Support Center",
          description:
            "Get help with tickets, organizers, event discovery, privacy, and account questions from Xilolo support.",
          keywords:
            "Xilolo support, ticket help, organizer help, event platform help",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/marketing$/,
        meta: {
          title: "Event Marketing on Xilolo",
          description:
            "Use Xilolo marketing tools to reach event audiences, grow organizer visibility, and promote live experiences.",
          keywords:
            "event marketing, creator marketing, promote live events, Xilolo marketing",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/data-protection$/,
        meta: {
          title: "Data Protection",
          description:
            "Read how Xilolo handles privacy rights, data requests, account deletion, and personal information protection.",
          keywords:
            "Xilolo data protection, privacy rights, data request, account deletion",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/privacy-policy$/,
        meta: {
          title: "Privacy Policy",
          description:
            "Review Xilolo's privacy policy for details about personal data, platform security, and user privacy choices.",
          keywords:
            "Xilolo privacy policy, privacy, personal data, platform security",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/terms-of-service$/,
        meta: {
          title: "Terms of Service",
          description:
            "Read the Xilolo terms of service for platform usage, event participation, ticketing, and account rules.",
          keywords:
            "Xilolo terms, terms of service, event platform rules, ticketing terms",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/community-guidelines$/,
        meta: {
          title: "Community Guidelines",
          description:
            "Review Xilolo's community guidelines for safe events, respectful creator engagement, and platform conduct.",
          keywords:
            "Xilolo community guidelines, event safety, platform conduct",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/events\/.+$/,
        meta: {
          title: "Shared Event on Xilolo",
          description:
            "View shared event details, organizer information, ticket options, and live experience updates on Xilolo.",
          keywords:
            "shared event, event details, tickets, live event, Xilolo",
          image: "/images/event-tile.jpg",
          type: "article",
        },
      },
      {
        matcher: /^\/(users|organisers)\/.+$/,
        meta: {
          title: "Shared Xilolo Profile",
          description:
            "View a shared Xilolo profile, organizer presence, and connected public experiences.",
          keywords:
            "Xilolo profile, organizer profile, creator profile, shared profile",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/event\/create-event\/.+$/,
        meta: {
          title: "Create an Event on Xilolo",
          description:
            "Launch your own concert, workshop, or meetup with Xilolo' intuitive event builder and ticketing tools.",
          keywords:
            "create event, ticketing, event hosting, Xilolo, organizer tools",
          noIndex: true,
        },
      },
      {
        matcher: /^\/organizers/,
        meta: {
          title: "Meet Top Organizers",
          description:
            "Discover verified organizers, follow their upcoming experiences, and collaborate with the Xilolo community.",
          keywords: "organizers, follow, streaming, community, Xilolo",
          noIndex: true,
        },
      },
      {
        matcher: /^\/account/,
        meta: {
          title: "Your Profile & Wallet",
          description:
            "Manage your profile, wallets, subscriptions, and saved events securely from your Xilolo account panel.",
          keywords:
            "profile, account, wallet, settings, subscriptions, Xilolo",
          noIndex: true,
        },
      },
      {
        matcher: /^\/tickets/,
        meta: {
          title: "Tickets & Passes",
          description:
            "Access all your purchased tickets and upcoming experiences at a glance.",
          keywords: "tickets, passes, QR code, events, Xilolo",
          noIndex: true,
        },
      },
      {
        matcher: /^\/xilolo-ai/,
        meta: {
          title: "Xilolo AI Assistant",
          description:
            "Chat with Xilolo AI for help with your wallet, events, streaming, KYC, and event setup.",
          keywords: "Xilolo AI, assistant, events help, wallet help, streaming setup",
          noIndex: true,
        },
      },
      {
        matcher: /^\/landing/,
        meta: {
          title: "Xilolo",
          description:
            "Plan, promote, and experience unforgettable events with Xilolo's all-in-one platform.",
          keywords: "landing, Xilolo, events platform, social tickets",
        },
      },
      {
        matcher: /^\/signal-deck/,
        meta: {
          title: "Xilolo Signal Deck",
          description:
            "Download Xilolo and follow every official channel from the Signal Deck.",
          keywords:
            "Xilolo, Signal Deck, app download, social links, community",
          image: "/img/logo.png",
        },
      },
      {
        matcher: /^\/(auth|feed|profile|search|payment|wallet|kyc|notifications|mentions|tickets|organizers|event\/(view|select-event-type|create-event|edit|stream|analytics|saved-events)|creator\/channel\/new|subscription|support-chat|me|become-an-organiser)\b/,
        meta: {
          title: "Xilolo",
          description:
            "Secure Xilolo account area for tickets, events, wallet, and profile settings.",
          noIndex: true,
        },
      },
    ];

    const match = routes.find((route) => route.matcher.test(location.pathname));
    return match?.meta || {};
  }, [location.pathname]);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState("all");

  const APP_STORE_URL =
    "https://apps.apple.com/ng/app/zagasm-studios/id6755035145";

  const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.zagasmstudio.app";

  function detectDownloadPlatform() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return "all";
    }

    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const isIpadOS =
      platform === "MacIntel" && maxTouchPoints > 1 && /Safari/i.test(userAgent);
    const isIos = /iPad|iPhone|iPod/i.test(userAgent) || isIpadOS;
    const isAndroid = /Android/i.test(userAgent);

    if (isIos) return "ios";
    if (isAndroid) return "android";
    return "all";
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Shown after ENGAGEMENT, never on first paint (DESIGN.md + revamp plan §5).
    // A modal at t=0 costs the first impression, competes with the hero, and
    // delays first contentful paint. Trigger: 35% scroll or 20s dwell.
    const dismissFlag = "xilolo-download-modal-dismissed-at";
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(dismissFlag) || 0);
    } catch {
      /* storage unavailable (private mode): treat as never dismissed */
    }
    const recentlyDismissed = dismissedAt > 0 && Date.now() - dismissedAt < FOURTEEN_DAYS;

    setDownloadPlatform(detectDownloadPlatform());
    if (recentlyDismissed) return;

    let shown = false;
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    function show() {
      if (shown) return;
      shown = true;
      setShowDownloadModal(true);
      cleanup();
    }
    function onScroll() {
      const reached = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight || 1;
      if (reached / total >= 0.35) show();
    }
    const timer = window.setTimeout(show, 20000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, []);

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    try {
      // Remember the dismissal so the ask doesn't return every visit.
      localStorage.setItem("xilolo-download-modal-dismissed-at", String(Date.now()));
    } catch {
      /* storage unavailable — the modal may ask again next visit */
    }
  };

  const handleAppStoreDownload = () => {
    if (APP_STORE_URL) {
      window.open(APP_STORE_URL, "_blank", "noopener,noreferrer");
    }
    closeDownloadModal();
  };

  const handleApkDownload = () => {
    if (PLAY_STORE_URL) {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }

    closeDownloadModal();
  };

  const handleSkip = () => {
    closeDownloadModal();
  };

  return (
    <Fragment>
      {loading && <FullpagePreloader loading={loading} />}

      <ToastHost />
      <ToastContainer />
      <ForcedLogoutModalHost />
      <TwoFactorSecurityPrompt />
      <NetworkStatus />
      <ScrollToTop />
      <SEO {...pageMetadata} url={canonicalUrl} />
      {/* <DisableRightClick /> */}
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/event/:id" element={<EventDeepLinkPage />} />
        <Route path="/signal-deck" element={<SignalDeck />} />
        <Route element={<LandingLayout />}>
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route
            path="/community-guidelines"
            element={<CommunityGuidelinesPage />}
          />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/support" element={<Support />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/data-protection" element={<DataProtectionPage />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/event/view/share/:slug" element={<EventShareRedirect />} />
          <Route path="/events/:shareKey" element={<SharedEventPage />} />
        </Route>
        <Route
          path="/users/:shareKey"
          element={<SharedProfileRedirectPage type="user" />}
        />
        <Route
          path="/organisers/:shareKey"
          element={<SharedProfileRedirectPage type="organiser" />}
        />
        {/* No landing page: the root goes straight to SIGN IN. Deliberately the
            same <Signin /> inside the same <AuthLayout /> as /auth/signin, so
            the two entry points can never diverge. Deep links that must survive
            (/event/:id, /events/:shareKey, legal, /about, /contact) are untouched. */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Signin />} />
        </Route>

        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Signin />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="signin" element={<Signin />} />
          <Route path="apple/callback" element={<AppleCallbackPage />} />
          <Route path="signinwithcode" element={<SigninWithCode />} />
          <Route path="forget-password" element={<ForgetPassword />} />
          <Route path="code-verification" element={<CodeVerification />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route
            path="change-password-success"
            element={<ChangePasswordSuccesffully />}
          />
          {/*
          {/* <Route path="onboarding" element={<Onboarding />} /> */}
        </Route>
        {/* location={state?.backgroundLocation || location} */}
        <Route element={<Sessionpage />}>
          <Route element={<MainLayout />}>
            <Route index exact path="/feed" element={<Home />} />
            <Route path="organizers" element={<AllOrganizers />} />
            <Route path="/become-an-organiser" element={<BecomeOrganiser />} />
            <Route path="/kyc/didit/callback" element={<DiditCallback />} />
            <Route path="/profile" element={<Profile />}>
              <Route index exact path=":profileId" element={<ViewProfile />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="edit-password" element={<EditPassword />} />
            </Route>
            <Route path="/tickets" element={<TicketsPage />} />
            {/* Ticket detail — the app pushes a full screen for a tap on a
                ticket (ticket_screen.dart:226-230 -> ReceiptScreen), so this is
                a route, not the modal it replaced. */}
            <Route path="/tickets/:ticketId" element={<TicketReceiptScreen />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route
              path="/wallet/funding/callback"
              element={<WalletFundingCallbackPage />}
            />
            <Route
              path="/wallet/funding/cancel"
              element={<WalletFundingCancelPage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/xilolo-ai" element={<XiloloAssistantWidget />} />
            <Route path="/mentions" element={<TaggedMentionsPage />} />

            <Route path="/event" element={<Event />}>
              <Route path="view/:eventId" element={<ViewEvent />} />
              <Route path="vod/:eventId" element={<VodWatchPage />} />
              <Route path="stream/:eventId" element={<EventStreamControlPage />} />
              <Route path="analytics/:eventId" element={<EventStreamAnalyticsPage />} />
              <Route path="checkin/:eventId" element={<EventCheckinControlPage />} />
              <Route path="edit/:eventId" element={<EventEditPage />} />
              <Route path="select-event-type" element={<EventType />} />
              <Route
                path="create-event/:eventTypeId"
                element={<CreateEvent />}
              />
              {/* CreateEvent */}
              <Route path="saved-events" element={<SaveEvents />} />
            </Route>
            <Route path="/creator/channel/new" element={<StreamingPage />} />
            <Route path="/subscription" element={<SubscriptionsPage />} />
            <Route path="/support-chat" element={<SupportChatPage />} />
            <Route path="/account" element={<AccountOutlet />}>
              <Route index exact path="/account" element={<Account />} />
              <Route path="interest" element={<AccountInterest />} />
              <Route path="blocked" element={<BlockedUsersPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="bank-accounts" element={<BankAccountsPage />} />
              <Route path="crypto-wallet" element={<CryptoWalletsPage />} />
              <Route path="fund-wallet" element={<FundWalletPage />} />
              <Route path="payouts" element={<WalletHub />} />
              <Route path="payouts/request" element={<AccountPayouts />} />
              <Route
                path="payouts/history"
                element={<AccountPayoutHistory />}
              />
              <Route
                path="manage-notification"
                element={<AccountNotification />}
              />
            </Route>
            <Route path="/notifications" element={<Notification />}>
              <Route index exact element={<AllNotification />} />
            </Route>
            <Route path="/me/organisers" element={<Notification />}>
              <Route index exact element={<OrganisersIFollow />} />
              <Route path="followers" element={<OrganiserFollowers />} />
            </Route>
          </Route>
        </Route>

        {/* Dev-only design showcase — outside LandingLayout so it renders its own Nav,
            and 404s in production where import.meta.env.DEV is false. */}
        <Route
          path="/design"
          element={import.meta.env.DEV ? <DesignSystem /> : <Error404 />}
        />

        {/* Dev-only preview of the signed-in home (/feed). Its own route because
            /feed is auth-gated — this renders the same presentation components
            with mock events, so the layout can be measured + screenshotted at any
            width without an account. 404s in production. */}
        <Route
          path="/dev/home-preview"
          element={import.meta.env.DEV ? <HomePreview /> : <Error404 />}
        />

        {/* Dev-only preview of the signed-in tickets screen (/tickets). Same
            reason as above: /tickets is auth-gated, so this renders the real
            presentation pieces with mock tickets so the layout can be measured +
            screenshotted at any width without an account. 404s in production. */}
        <Route
          path="/dev/tickets-preview"
          element={import.meta.env.DEV ? <TicketsPreview /> : <Error404 />}
        />

        {/* Dev-only preview of the create-event flow. /event/create-event/:eventTypeId
            is auth-gated, so this renders the REAL wizard with a fixture event and a
            forced step (?step=1|2|3) so each step can be measured + screenshotted at
            any width without an account. 404s in production. */}
        <Route
          path="/dev/create-event-preview"
          element={import.meta.env.DEV ? <CreateEventPreview /> : <Error404 />}
        />

        <Route path="/page-not-found" element={<Error404 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route
            // path="/posts/:postId"
            element={<PostViewModal show={true} onHide={() => navigate(-1)} />}
          />
        </Routes>
      )}

      <DownloadAppModal
        open={showDownloadModal}
        onClose={closeDownloadModal}
        onSkip={handleSkip}
        onAppStoreDownload={handleAppStoreDownload}
        onApkDownload={handleApkDownload}
        platform={downloadPlatform}
      />
    </Fragment>
  );
}
