import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getSharedOrganiserProfile,
  getSharedUserProfile,
} from "../../api/profileShareApi";
import { useAuth } from "../auth/AuthContext";
import { appUrlFor, isMobile } from "../../lib/appHandoff";

function resolveProfileIdFromPayload(type, payload) {
  if (type === "organiser") {
    const organiser = payload?.organiser || payload?.user?.organiser || payload?.user;
    return (
      organiser?.user_id ||
      organiser?.userId ||
      organiser?.id ||
      organiser?.user?.id ||
      null
    );
  }

  const user = payload?.user || payload;
  return user?.id || user?.user_id || user?.userId || null;
}

export default function SharedProfileRedirectPage({ type = "user" }) {
  const { shareKey } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["shared-profile", type, shareKey],
    enabled: !!shareKey && !!token && !!user && !authLoading,
    retry: 1,
    queryFn: () =>
      type === "organiser"
        ? getSharedOrganiserProfile(shareKey)
        : getSharedUserProfile(shareKey),
  });

  useEffect(() => {
    if (authLoading) return;
    if (token && user) return;

    // On a phone the app takes this link (ShareLinkHandoff fires the handoff); sending
    // the visitor to a sign-in form first is the dead end this page used to be.
    if (isMobile()) return;

    navigate("/auth/signin", {
      replace: true,
      state: { from: location.pathname },
    });
  }, [authLoading, location.pathname, navigate, token, user]);

  const nextProfileId = useMemo(() => {
    if (!query.data) return null;
    return resolveProfileIdFromPayload(type, query.data);
  }, [query.data, type]);

  useEffect(() => {
    if (!nextProfileId || !query.data) return;

    const sharedPayload =
      type === "organiser" ? query.data?.organiser : query.data?.user;

    navigate(`/profile/${nextProfileId}`, {
      replace: true,
      state: {
        sharedProfileData: sharedPayload,
        sharedProfileType: type,
      },
    });
  }, [navigate, nextProfileId, query.data, type]);

  // Signed out is not "loading": the profile query is deliberately disabled without a
  // session, so treating this as loading left the page saying "Opening shared profile…
  // please wait" forever. On a phone the handoff has already been fired by
  // ShareLinkHandoff; here we say what is actually going on and offer both real exits.
  if (!authLoading && !token && !user) {
    return (
      <div className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:bg-white tw:px-6 tw:text-center">
        <div>
          <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
            Open this profile in the Xilolo app
          </div>
          <div className="tw:mt-2 tw:text-sm tw:text-slate-500">
            Shared profiles open in the app, where you are already signed in.
          </div>
          <div className="tw:mt-5 tw:flex tw:items-center tw:justify-center tw:gap-3">
            <a
              href={appUrlFor(location.pathname)}
              className="tw:rounded-pill tw:bg-accent tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white"
            >
              Open in app
            </a>
            <button
              type="button"
              onClick={() =>
                navigate("/auth/signin", {
                  replace: true,
                  state: { from: location.pathname },
                })
              }
              className="tw:rounded-pill tw:border tw:border-hairline tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-ink"
            >
              Sign in on the web
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || query.isLoading) {
    return (
      <div className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:bg-white tw:px-6 tw:text-center">
        <div>
          <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
            Opening shared profile
          </div>
          <div className="tw:mt-2 tw:text-sm tw:text-slate-500">
            Please wait while we prepare this profile.
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !nextProfileId) {
    return (
      <div className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:bg-white tw:px-6 tw:text-center">
        <div>
          <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
            Profile unavailable
          </div>
          <div className="tw:mt-2 tw:text-sm tw:text-slate-500">
            This shared profile link is invalid or no longer available.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
