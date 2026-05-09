import React, { useMemo, useRef, useState } from "react";
import AuthContainer from "../assets/auth_container";
import { api, authHeaders } from "../../../lib/apiClient";
import { getWebDevicePayload } from "../../../lib/deviceName";
import { showError, showSuccess } from "../../../component/ui/toast";

export default function TwoFactorLoginForm({
  challenge,
  onVerified,
  onCancel,
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  const verificationCode = useMemo(() => code.join(""), [code]);
  const isComplete = /^\d{6}$/.test(verificationCode);

  const updateCode = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value;
    setCode(nextCode);
    setError("");

    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextCode = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      nextCode[index] = digit;
    });
    setCode(nextCode);
    inputsRef.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isComplete || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const { data } = await api.post("/api/v1/2fa/login/verify", {
        challenge_id: challenge?.challenge_id,
        code: verificationCode,
        ...getWebDevicePayload(),
        remember_device: rememberDevice,
      });

      if (!data?.token) {
        throw new Error("Invalid 2FA verification response.");
      }

      if (!data.user) {
        const profileResponse = await api.get(
          "/api/v1/profile",
          authHeaders(data.token)
        );
        const profilePayload = profileResponse?.data?.data || profileResponse?.data || {};
        data.user = profilePayload.user || profilePayload;
        data.organiser =
          profilePayload.organiser ||
          profilePayload.organizer ||
          data.user?.organiser ||
          data.user?.organizer ||
          null;
      }

      showSuccess(data.message || "Signed in successfully.");
      onVerified?.(data);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "The authentication code could not be verified.";
      setError(message);
      showError(message);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthContainer
      title="Two-factor authentication"
      description="Enter the 6-digit code from your authenticator app"
      footer={false}
      header={true}
      privacy={true}
      haveAccount={true}
    >
      <form onSubmit={handleSubmit} className="tw:w-full tw:max-w-[420px] tw:mx-auto">
        {error ? (
          <div className="alert alert-danger tw:text-sm" role="alert">
            {error}
          </div>
        ) : null}

        <div className="tw:flex tw:justify-center tw:gap-2 tw:mb-4">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputsRef.current[index] = node;
              }}
              value={digit}
              onChange={(event) => updateCode(event.target.value, index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              className="tw:h-12 tw:w-10 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:text-center tw:text-lg tw:font-semibold tw:text-gray-900 focus:tw:border-black focus:tw:outline-none"
            />
          ))}
        </div>

        <label className="tw:mb-4 tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-gray-700">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(event) => setRememberDevice(event.target.checked)}
          />
          Remember this browser
        </label>

        <button
          style={{
            borderRadius: "8px",
            // marginTop: "0.75rem",
          }}
          type="submit"
          disabled={!isComplete || isSubmitting}
          className="tw:w-full tw:rounded-lg tw:bg-black tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-white disabled:tw:cursor-not-allowed disabled:tw:bg-gray-300"
        >
          {isSubmitting ? "Verifying..." : "Verify and sign in"}
        </button>

        <button
          style={{
            borderRadius: "8px",
            marginTop: "0.75rem",
          }}
          type="button"
          onClick={onCancel}
          className="tw:mt-3 tw:w-full tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-gray-900"
        >
          Back to sign in
        </button>
      </form>
    </AuthContainer>
  );
}
