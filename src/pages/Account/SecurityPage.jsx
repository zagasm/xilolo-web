import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeft, ShieldCheck, ShieldOff } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { getWebDevicePayload } from "../../lib/deviceName";
import { useAuth } from "../auth/AuthContext";
import { showError, showSuccess } from "../../component/ui/toast";

function resolvePayload(response) {
  return response?.data?.data || response?.data || {};
}

export default function SecurityPage() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuth();
  const setAuthRef = useRef(setAuth);
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const twoFactorEnabled = useMemo(
    () => Boolean(status?.two_factor_enabled ?? status?.enabled),
    [status]
  );

  useEffect(() => {
    setAuthRef.current = setAuth;
  }, [setAuth]);

  const loadStatus = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.get("/api/v1/2fa/status", authHeaders(token));
      const nextStatus = resolvePayload(response);
      setStatus(nextStatus);
      setAuthRef.current({
        security: {
          two_factor_enabled: Boolean(
            nextStatus?.two_factor_enabled ?? nextStatus?.enabled
          ),
          two_factor_prompt: false,
        },
      });
    } catch (err) {
      showError(
        err?.response?.data?.message ||
        "Unable to load two-factor authentication status."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setWorking(true);
    try {
      const response = await api.post("/api/v1/2fa/setup", {}, authHeaders(token));
      const payload = resolvePayload(response);
      setSetup(payload);
      setConfirmCode("");
      showSuccess(response?.data?.message || "Scan the QR code to continue.");
    } catch (err) {
      showError(err?.response?.data?.message || "Unable to start 2FA setup.");
    } finally {
      setWorking(false);
    }
  };

  const confirmSetup = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(confirmCode) || working) return;

    setWorking(true);
    try {
      const response = await api.post(
        "/api/v1/2fa/confirm",
        {
          code: confirmCode,
          ...getWebDevicePayload(),
        },
        authHeaders(token)
      );
      setSetup(null);
      setConfirmCode("");
      showSuccess(response?.data?.message || "Two-factor authentication enabled.");
      await loadStatus();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
        "The authenticator code could not be confirmed."
      );
    } finally {
      setWorking(false);
    }
  };

  const disableTwoFactor = async (event) => {
    event.preventDefault();
    if (disableCode && !/^\d{6}$/.test(disableCode)) return;
    if (working) return;

    setWorking(true);
    try {
      const response = await api.post(
        "/api/v1/2fa/disable",
        {
          ...(disableCode ? { code: disableCode } : {}),
          ...getWebDevicePayload(),
        },
        authHeaders(token)
      );
      setDisableCode("");
      showSuccess(response?.data?.message || "Two-factor authentication disabled.");
      await loadStatus();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
        "Unable to disable two-factor authentication."
      );
    } finally {
      setWorking(false);
    }
  };

  const qrCodeValue = setup?.qr_code_value || setup?.qrCodeValue || setup?.otpauth_url || "";
  const secret = setup?.secret || setup?.manual_entry_key || "";

  return (
    <div className="tw:min-h-screen tw:bg-white tw:px-4 tw:pb-24 tw:pt-24 tw:md:px-6">
      <div className="tw:mx-auto tw:max-w-3xl">
        <div className="tw:mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="tw:mb-4 tw:inline-flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:text-gray-900 tw:shadow-sm tw:transition tw:hover:border-neon/40 tw:hover:bg-gray-50 tw:hover:shadow-[0_0_14px_rgba(0,245,255,0.08)]"
          >
            <ChevronLeft className="tw:h-5 tw:w-5" />
          </button>
          <span className="tw:block tw:text-2xl tw:font-semibold tw:text-gray-900">
            Security
          </span>
          <span className="tw:mt-2 tw:block tw:text-sm tw:text-gray-600">
            Manage two-factor authentication for your Xilolo account.
          </span>
        </div>

        <section className="tw:rounded-3xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-5 tw:shadow-[0_14px_36px_rgba(15,23,42,0.06),0_0_18px_rgba(0,245,255,0.04)]">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-start tw:md:justify-between">
            <div className="tw:flex tw:gap-3">
              <span className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white">
                {twoFactorEnabled ? (
                  <ShieldCheck className="tw:h-5 tw:w-5 tw:text-emerald-600" />
                ) : (
                  <ShieldOff className="tw:h-5 tw:w-5 tw:text-gray-700" />
                )}
              </span>
              <div>
                <span className="tw:block tw:text-lg tw:font-semibold tw:text-gray-900">
                  Two-factor authentication
                </span>
                <span className="tw:mt-1 tw:block tw:text-sm tw:text-gray-600">
                  {loading
                    ? "Checking your account security..."
                    : twoFactorEnabled
                      ? "2FA is active. You will be asked for a 6-digit code on new sign-ins."
                      : "Add an authenticator app code before a sign-in can finish."}
                </span>
              </div>
            </div>

            {!loading && !twoFactorEnabled ? (
              <button
                style={{
                  borderRadius: "9999px",
                }}
                type="button"
                onClick={startSetup}
                disabled={working}
                className="tw:rounded-full tw:bg-black tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] disabled:tw:opacity-60"
              >
                {working ? "Starting..." : "Enable 2FA"}
              </button>
            ) : null}
          </div>

          {setup ? (
            <form onSubmit={confirmSetup} className="tw:mt-6 tw:rounded-2xl tw:bg-white tw:p-4 tw:space-y-4">
              <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row">
                {qrCodeValue ? (
                  <div className="tw:flex tw:justify-center tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
                    <QRCodeSVG value={qrCodeValue} size={184} />
                  </div>
                ) : null}
                <div className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-900">
                    Scan this QR code
                  </span>
                  <span className="tw:mt-1 tw:block tw:text-sm tw:text-gray-600">
                    Use Google Authenticator, Authy, 1Password, or another authenticator app.
                  </span>
                  {secret ? (
                    <div className="tw:mt-4">
                      <span className="tw:block tw:text-xs tw:font-semibold tw:text-gray-500">
                        Manual entry secret
                      </span>
                      <code className="tw:mt-1 tw:block tw:break-all tw:rounded-xl tw:bg-gray-100 tw:p-3 tw:text-xs tw:text-gray-900">
                        {secret}
                      </code>
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="tw:block">
                <span className="tw:block tw:text-sm tw:font-medium tw:text-gray-900">
                  Authenticator code
                </span>
                <input
                  value={confirmCode}
                  onChange={(event) =>
                    setConfirmCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="tw:mt-2 tw:w-full tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:py-3 tw:text-sm focus:tw:border-neon focus:tw:outline-none focus:tw:shadow-[0_0_0_4px_rgba(0,245,255,0.08)]"
                  placeholder="123456"
                />
              </label>

              <div className="tw:flex tw:flex-wrap tw:gap-2">
                <button
                  style={{
                    borderRadius: "9999px",
                  }}
                  type="submit"
                  disabled={!/^\d{6}$/.test(confirmCode) || working}
                  className="tw:rounded-full tw:bg-black tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)] disabled:tw:bg-gray-300"
                >
                  {working ? "Confirming..." : "Confirm setup"}
                </button>
                <button
                  style={{
                    borderRadius: "9999px",
                  }}
                  type="button"
                  onClick={() => setSetup(null)}
                  className="tw:rounded-full tw:border tw:border-gray-300 tw:bg-white tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {!loading && twoFactorEnabled ? (
            <form onSubmit={disableTwoFactor} className="tw:mt-6 tw:rounded-2xl tw:bg-white tw:p-4">
              <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-900">
                Disable 2FA
              </span>
              <span className="tw:mt-1 tw:block tw:text-sm tw:text-gray-600">
                Enter your current authenticator code.
              </span>
              <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-3 tw:md:flex-row">
                <input
                  value={disableCode}
                  onChange={(event) =>
                    setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="tw:min-w-0 tw:flex-1 tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:py-3 tw:text-sm focus:tw:border-neon focus:tw:outline-none focus:tw:shadow-[0_0_0_4px_rgba(0,245,255,0.08)]"
                  placeholder="Authenticator 6-digit code"
                />
                <button
                  type="submit"
                  disabled={working || (disableCode && !/^\d{6}$/.test(disableCode))}
                  className="tw:rounded-xl tw:bg-red-600 tw:px-5 tw:py-3 tw:text-sm tw:font-semibold tw:text-white disabled:tw:opacity-60"
                >
                  {working ? "Disabling..." : "Disable"}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
