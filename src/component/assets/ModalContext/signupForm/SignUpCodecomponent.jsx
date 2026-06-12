import React, { useRef, useState, useEffect, useCallback } from "react";
import PostSignupFormModal from "./ModalContainer";
import "./postSignupStyle.css";
import { useAuth } from "../../../../pages/auth/AuthContext";
// import { useModal } from "../..";
import { showSuccess, showError } from "../../../ui/toast";
import { useModal } from "..";
import { api, authHeaders } from "../../../../lib/apiClient";
import { mergeVerifiedContactUser } from "../../../../lib/userVerification";

const DEFAULT_TIMER = 600; // seconds

const SignUpCodecomponent = ({ Otpcode, token, userupdate, type = "email" }) => {
  const inputRefs = useRef([]);
  const lastAttemptedCodeRef = useRef("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [newotpcode, setnewotpcode] = useState(Otpcode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [timer, setTimer] = useState(DEFAULT_TIMER);
  const [canResend, setCanResend] = useState(false);
  const { login } = useAuth();
  const { closeModal } = useModal();

  const startTimer = useCallback(() => {
    setTimer(DEFAULT_TIMER);
    setCanResend(false);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => Math.max(prevTimer - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    const contact = userupdate?.email;
    if (!contact) {
      const message = "No contact information available to resend the code.";
      setErrorMessage(message);
      showError(message);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await api.post(
        "/api/v1/code/regenerate",
        { input: contact },
        authHeaders(token)
      );

      const payload = response.data?.data || response.data || {};
      const newCode = payload.code || response.data.code || "";
      setnewotpcode(newCode);
      setCode(["", "", "", "", ""]);
      lastAttemptedCodeRef.current = "";
      const successMsg =
        payload.message ||
        response.data.message ||
        "Verification code resent successfully!";
      setSuccessMessage(successMsg);
      showSuccess(successMsg);
      startTimer();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to resend verification code. Please try again.";
      setErrorMessage(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setErrorMessage(null);
    if (value && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinish = async ({ force = false } = {}) => {
    const verificationCode = code.join("").trim();
    const verificationType = "email_verification";

    if (verificationCode.length < 5) {
      if (force) {
        const message = "Please enter the complete 5-digit code.";
        setErrorMessage(message);
        showError(message);
      }
      return;
    }

    if (!force && verificationCode === lastAttemptedCodeRef.current) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    lastAttemptedCodeRef.current = verificationCode;

    try {
      const response = await api.post(
        "/api/v1/code/verify",
        { code: verificationCode, type: verificationType },
        authHeaders(token)
      );

      const result = response.data;
      if (result && result.status !== false) {
        const payload = result.data || result;
        const message =
          payload?.message || result?.message || "Verification successful!";
        showSuccess(message);

        const user = mergeVerifiedContactUser(
          userupdate,
          payload?.user || result?.user,
          type
        );
        login({ token, user });
        closeModal();
      } else {
        const message =
          result?.message || "Verification failed. Please try again.";
        setErrorMessage(message);
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData.errors?.otp) {
          setErrorMessage(errorData.errors.otp.join(" "));
        } else {
          setErrorMessage(
            errorData.message || "Validation failed. Please check your input."
          );
        }
      } else {
        const message =
          error.response?.data?.message ||
          "Something went wrong. Please try again.";
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = code.every((digit) => digit !== "");

  useEffect(() => {
    if (!isComplete || isLoading) return;
    handleFinish();
  }, [code, isComplete, isLoading]);

  const skipProcess = () => {
    const user = userupdate;
    login({ token, user });
    closeModal();
  };

  return (
    <PostSignupFormModal>
      <div className="tw:max-w-md tw:w-full tw:mx-auto tw:py-4 tw:space-y-6">
        <div className="tw:space-y-1">
          <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
            We sent a code to your email
          </span>
          <p className="tw:text-sm tw:text-gray-500">
            Enter the 5-digit verification code below. Your code is{" "}
            {newotpcode || "pending"}.
          </p>
        </div>

        {successMessage && (
          <div className="tw:rounded-2xl tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:px-4 tw:py-3 tw:text-sm tw:text-emerald-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="tw:rounded-2xl tw:bg-red-50 tw:border tw:border-red-200 tw:px-4 tw:py-3 tw:text-sm tw:text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="tw:grid tw:grid-cols-5 tw:gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => (inputRefs.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="tw:h-14 tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:text-center tw:text-xl tw:font-semibold tw:outline-none focus:tw:border-primary"
            />
          ))}
        </div>

        <div className="tw:flex tw:flex-col tw:gap-1 tw:text-sm tw:text-gray-500">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={!canResend || isLoading}
            className={`tw:text-left tw:font-semibold tw:underline tw:transition tw:duration-150 ${
              canResend ? "tw:text-primary" : "tw:text-gray-400"
            }`}
          >
            {isLoading ? "Sending..." : "Resend Code"}
          </button>
          <span>
            Code expires in{" "}
            <strong className="tw:text-gray-900">{formatTime(timer)}</strong>
          </span>
        </div>

        <div className="tw:flex tw:gap-3 tw:mt-3">
          <button
            style={{
              borderRadius: 24,
            }}
            type="button"
            onClick={skipProcess}
            className="tw:flex-1 tw:text-sm tw:font-semibold tw:text-neutral-900 tw:bg-gray-100 tw:rounded-2xl tw:py-3 tw:hover:opacity-80"
          >
            Skip for now
          </button>
          <button
            style={{
              borderRadius: 24,
            }}
            type="button"
            onClick={() => handleFinish({ force: true })}
            disabled={!isComplete || isLoading}
            className={`tw:flex-1 tw:w-full tw:rounded-2xl tw:py-3 tw:text-sm tw:font-semibold tw:transition tw:duration-200 ${
              isComplete && !isLoading
                ? "tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:text-white"
                : "tw:bg-gray-200 tw:text-gray-500"
            }`}
          >
            {isLoading ? "Finishing…" : "Finish"}
          </button>
        </div>
      </div>
    </PostSignupFormModal>
  );
};

export default SignUpCodecomponent;
