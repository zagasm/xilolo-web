/**
 * /dev/profile-preview — DEV-ONLY preview of /profile/:profileId.
 *
 * WHY IT EXISTS: /profile/* renders inside <Sessionpage><MainLayout/> (see
 * src/app.jsx), so the real page cannot be screenshotted or measured without an
 * account. This route renders the REAL profile presentation — `ProfileScreenView`
 * exported from ./ViewProfile/index.jsx, which is the same component the route
 * uses — inside the real shell (the same Navbar, the same page offset), with
 * fixtures and ZERO API calls: `useProfile`/`useMyEvents` are
 * `useQuery({ enabled: !!token })`, so with no session they fetch nothing and
 * report `loading: false`, and every click handler here is a local no-op.
 *
 * Registered in src/app.jsx behind `import.meta.env.DEV`, so it 404s in
 * production. It exists so the profile page can be verified at 390 / 768 / 1440
 * without signing in.
 *
 * Query options:
 *   /dev/profile-preview                      own organiser profile (ranking #7)
 *   /dev/profile-preview?screen=own-new        own profile, no organisation
 *                                              (the become-an-organiser branch)
 *   /dev/profile-preview?screen=own-kyc        own organiser, KYC pending review
 *   /dev/profile-preview?screen=own-kyc-failed own organiser, KYC REJECTED
 *                                              (must NOT look "in progress")
 *   /dev/profile-preview?screen=organiser      another organiser (public design)
 *   /dev/profile-preview?screen=user           plain user (share-link design)
 *   &rank=none                                 organiser with no rank -> "—"
 *   &state=loading | error | profileless       skeleton / error / no payload
 */
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

import SEO from "../../component/SEO";
import Navbar from "../pageAssets/Navbar";
import { ProfileScreenView } from "./ViewProfile";

/* Fixtures for the preview only — never rendered in production. Field names
   mirror the payloads the real page consumes:
   own profile  GET /api/v1/profile            -> { user, organiser }
   other        GET /api/v1/organiser/:id      (organiser_profile.dart's model:
                `organiser` is the NAME string, `rank`/`numberOfFollowers`/
                `ticketsSold` sit on the same object, events are pre-bucketed)
   plain user   GET /api/v1/user/share/:id     -> { user } */
const OWN_ORGANISER = {
  id: "mock-own-1",
  userId: "mock-own-1",
  name: "Ada Okonkwo",
  firstName: "Ada",
  lastName: "Okonkwo",
  userName: "adaokonkwo",
  email: "ada@example.com",
  about: "I host intimate Afrobeats nights across Lagos and Abuja.",
  profileImage: "",
  ticketsSold: 1240,
  eventsCount: 12,
  followersCount: 3480,
  followings_count: 212,
  hasActiveSubscription: true,
  is_organiser: true,
  kyc: { status: "verified" },
  organiser: {
    id: "mock-org-1",
    userId: "mock-own-1",
    organiser: "Ada Okonkwo",
    rank: 7,
    has_active_subscription: true,
  },
};

const OWN_NO_ORGANISER = {
  ...OWN_ORGANISER,
  about: "",
  hasActiveSubscription: false,
  is_organiser: false,
  organiser: null,
  kyc: null,
  ticketsSold: 0,
  eventsCount: 0,
  followersCount: 0,
  followings_count: 0,
};

const OWN_KYC_PENDING = {
  ...OWN_ORGANISER,
  kyc: { status: "pending" },
};

/* A rejected applicant. Must render the terminal "failed" card — not the
 * in-flight "under review" one. */
const OWN_KYC_FAILED = {
  ...OWN_ORGANISER,
  kyc: {
    status: "failed",
    failureReason:
      "We could not verify your identity with the information submitted. Please check that your details are correct, use a clear photo of your ID and face, and try again.",
  },
};

const OTHER_ORGANISER = {
  id: "mock-org-2",
  userId: "mock-org-2",
  organiser: "Tunde Bakare",
  userName: "tundebakare",
  about: "Live band shows, comedy nights and every open-mic in between.",
  profileImage: "",
  numberOfFollowers: 2180,
  followings_count: 96,
  ticketsSold: 860,
  tickets_total: 860,
  eventsCount: 9,
  has_active_subscription: true,
  rank: 12,
  allEvents: [],
  upcomingEvents: [],
  events: { all: [], upcoming: [], live: [], ended: [], paused: [] },
};

const PLAIN_USER = {
  ...OTHER_ORGANISER,
  __isRegularUserProfile: true,
  organiser: null,
  rank: null,
  numberOfFollowers: 42,
  followings_count: 57,
  ticketsSold: 0,
  events: null,
  allEvents: null,
  upcomingEvents: null,
};

export default function ProfilePreview() {
  const [params] = useSearchParams();
  const screen = params.get("screen") || "own";
  const state = params.get("state") || "ready";
  const rank = params.get("rank");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  let profile = OWN_ORGANISER;
  let isOwnProfile = true;
  let kycStatus = "verified";
  let kycFailureReason = null;

  if (screen === "own-new") {
    profile = OWN_NO_ORGANISER;
    kycStatus = null;
  } else if (screen === "own-kyc") {
    profile = OWN_KYC_PENDING;
    kycStatus = "pending";
  } else if (screen === "own-kyc-failed") {
    profile = OWN_KYC_FAILED;
    kycStatus = "failed";
    kycFailureReason = OWN_KYC_FAILED.kyc.failureReason;
  } else if (screen === "organiser") {
    profile = { ...OTHER_ORGANISER };
    isOwnProfile = false;
    kycStatus = null;
    if (rank === "none") profile = { ...profile, rank: 0 };
  } else if (screen === "user") {
    profile = PLAIN_USER;
    isOwnProfile = false;
    kycStatus = null;
  } else if (rank === "none" && profile?.organiser) {
    profile = { ...profile, organiser: { ...profile.organiser, rank: 0 } };
  }

  const loading = state === "loading";
  const error = state === "error" ? "Request failed with status code 500" : null;
  if (state === "profileless") profile = null;

  return (
    <>
      <SEO title="Profile preview (dev) - Xilolo" noIndex />
      {/* The real shell, so the geometry under the Navbar is production-true. */}
      <Navbar />
      <div className="tw:bg-paper">
        <ProfileScreenView
          profile={loading || error || !profile ? null : profile}
          kycStatus={kycStatus}
          kycFailureReason={kycFailureReason}
          isOwnProfile={isOwnProfile}
          isLoading={loading}
          error={error}
          isFollowing={following}
          followLoading={followLoading}
          shareLoading={false}
          onToggleFollow={() => {
            /* preview only — never touches the follow API */
            setFollowLoading(true);
            setFollowing((v) => !v);
            setFollowLoading(false);
          }}
          onShare={() => {}}
        />
      </div>
    </>
  );
}
