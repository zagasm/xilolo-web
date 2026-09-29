import React from "react";
import {
  isAppleAuthConfigured,
  signInWithApplePopup,
} from "../../../lib/appleAuth";

function isAppleCancelError(error) {
  const code = String(error?.error || error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code.includes("popup_closed") ||
    code.includes("user_cancel") ||
    message.includes("popup closed") ||
    message.includes("user canceled") ||
    message.includes("user cancelled")
  );
}

export default function AppleAuthSection({
  label = null,
  buttonText = "Continue with Apple",
  loading = false,
  onSuccess,
  onError,
}) {
  if (!isAppleAuthConfigured()) return null;

  const handleClick = async () => {
    if (loading) return;

    try {
      const result = await signInWithApplePopup();
      await onSuccess?.(result);
    } catch (error) {
      if (isAppleCancelError(error)) {
        onError?.(error, { cancelled: true });
        return;
      }

      onError?.(error, { cancelled: false });
    }
  };

  return (
    <div className="tw:w-full">
      {label ? <p className="small text-muted mb-3">{label}</p> : null}
      <button
      style={{
        borderRadius: "9999px",
      }}
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:border tw:border-gray-900 tw:bg-black tw:px-4 tw:py-3 tw:text-sm tw:font-medium tw:text-white tw:disabled:cursor-not-allowed tw:disabled:opacity-70"
      >
        <i className="fa-brands fa-apple tw:text-base" aria-hidden="true" />
        <span>{loading ? "Connecting to Apple..." : buttonText}</span>
      </button>
    </div>
  );
}

