import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import { showError, showSuccess } from "../../component/ui/toast";

function getStatusMessage(localStatus, providerStatus) {
  if (localStatus === "verified") {
    return "Verification successful. Your organiser account is active and you can start creating events now.";
  }

  if (localStatus === "pending") {
    return `Your DIDIT verification is currently ${providerStatus || "processing"}. Refresh your organiser setup to continue.`;
  }

  if (localStatus === "failed") {
    return "Your DIDIT verification was not approved. You can start a new verification session and try again.";
  }

  return "Please wait while we verify your identity.";
}

export default function DiditCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user, refreshUser } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const callbackStatus = searchParams.get("status");
  const verificationSessionId = searchParams.get("verificationSessionId");

  useEffect(() => {
    let active = true;

    const syncDiditState = async () => {
      if (!token) {
        setError("You need to be logged in to complete DIDIT verification.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.post(
          "/api/v1/organiser/kyc/didit/session/refresh",
          {},
          authHeaders(token),
        );

        if (!active) return;
        const data = res?.data?.data || null;
        setSessionData(data);
        await refreshUser?.();

        if (data?.local_kyc_status === "verified") {
          showSuccess("Your organiser account is active.");
        }
      } catch (refreshError) {
        if (!active) return;
        const message =
          refreshError?.response?.data?.message ||
          "Unable to refresh DIDIT verification status right now.";
        setError(message);
        showError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    syncDiditState();

    return () => {
      active = false;
    };
  }, [refreshUser, token]);

  const statusMessage = useMemo(
    () =>
      getStatusMessage(
        sessionData?.local_kyc_status,
        sessionData?.status || callbackStatus,
      ),
    [callbackStatus, sessionData],
  );

  return (
    <div className="tw:min-h-screen tw:bg-[#F5F5F7] tw:pt-24 tw:px-4 tw:pb-10">
      <div className="tw:max-w-xl tw:mx-auto tw:bg-white tw:rounded-3xl tw:border tw:border-slate-200 tw:shadow-[0_18px_45px_rgba(15,23,42,0.08)] tw:p-6 tw:space-y-5">
        <div>
          <span className="tw:inline-flex tw:rounded-full tw:bg-slate-100 tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.16em] tw:text-slate-600">
            DIDIT callback
          </span>
          <h1 className="tw:mt-3 tw:text-2xl tw:font-semibold tw:text-slate-900">
            Checking your verification result
          </h1>
          
        </div>

        <div className="tw:rounded-2xl tw:bg-slate-50 tw:border tw:border-slate-200 tw:px-4 tw:py-4 tw:space-y-2">
          {verificationSessionId && (
            <div className="tw:text-xs tw:text-slate-500">
              Verification session:{" "}
              <span className="tw:font-medium tw:text-slate-700">
                {verificationSessionId}
              </span>
            </div>
          )}
          {callbackStatus && (
            <div className="tw:text-xs tw:text-slate-500">
              Callback status:{" "}
              <span className="tw:font-medium tw:text-slate-700">
                {callbackStatus}
              </span>
            </div>
          )}
          {sessionData?.status && (
            <div className="tw:text-xs tw:text-slate-500">
              Provider status:{" "}
              <span className="tw:font-medium tw:text-slate-700">
                {sessionData.status}
              </span>
            </div>
          )}
          {sessionData?.local_kyc_status && (
            <div className="tw:text-xs tw:text-slate-500">
              Local KYC status:{" "}
              <span className="tw:font-medium tw:text-slate-700">
                {sessionData.local_kyc_status}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="tw:text-sm tw:text-slate-600">
            Refreshing verification status...
          </div>
        ) : error ? (
          <div className="tw:space-y-4">
            <p className="tw:text-sm tw:text-red-600">{error}</p>
            <div className="tw:flex tw:flex-wrap tw:gap-3">
              <button
                type="button"
                onClick={() => navigate("/become-an-organiser")}
                className="tw:px-4 tw:py-2 tw:rounded-xl tw:bg-primary tw:text-white tw:text-sm tw:font-semibold"
              >
                Back to verification
              </button>
            </div>
          </div>
        ) : (
          <div className="tw:space-y-4">
            <p className="tw:text-sm tw:text-slate-700">{statusMessage}</p>
            <div className="tw:flex tw:flex-wrap tw:gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    sessionData?.local_kyc_status === "verified"
                      ? "/event/select-event-type"
                      : "/become-an-organiser",
                  )
                }
                className="tw:px-4 tw:py-2 tw:rounded-xl tw:bg-primary tw:text-white tw:text-sm tw:font-semibold"
              >
                {sessionData?.local_kyc_status === "verified"
                  ? "Create an event"
                  : "Back to verification"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
