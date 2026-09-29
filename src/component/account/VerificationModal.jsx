import React, { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { api, authHeaders } from "../../lib/apiClient"; // Adjust path to your api client
import { Loader2 } from "lucide-react";
import { useAuth } from "../../pages/auth/AuthContext";

export default function VerificationModal({
  isOpen,
  closeModal,
  email,
  onSuccess,
  showError,
  showSuccess,
}) {
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const [otp, setOtp] = useState(new Array(5).fill(""));
  const inputRefs = useRef([]);
  const lastAttemptedCodeRef = useRef("");

  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setOtp(new Array(5).fill(""));
      setIsLoading(false);
      lastAttemptedCodeRef.current = "";
    }
  }, [isOpen]);

  // --- HANDLERS ---

  const handleRequestCode = async () => {
    setIsLoading(true);
    try {
      await api.post(
        "/api/v1/code/generate",
        { input: email },
        authHeaders(token)
      );
      showSuccess("Verification code sent to your email.");
      setStep("otp");
    } catch (error) {
      console.error(error);
      showError(error?.response?.data?.message || "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/v1/code/regenerate", { input: email }, authHeaders(token));
      showSuccess("Code resent successfully.");
      setOtp(new Array(5).fill("")); // Clear inputs
      lastAttemptedCodeRef.current = "";
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(error);
      showError(error?.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async ({ force = false } = {}) => {
    const code = otp.join("").trim();
    if (code.length < 5) {
      if (force) {
        showError("Please enter the complete 5-digit code.");
      }
      return;
    }

    if (!force && code === lastAttemptedCodeRef.current) {
      return;
    }

    setIsLoading(true);
    lastAttemptedCodeRef.current = code;
    try {
      // Passing email along with code is standard practice for stateless APIs
      await api.post("/api/v1/code/verify", { code }, authHeaders(token));

      onSuccess(); // Refresh user data in parent
      closeModal();
    } catch (error) {
      console.error(error);
      showError(error?.response?.data?.message || "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP INPUT LOGIC ---

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 5).split("");
    if (pastedData.every((char) => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((val, i) => {
        if (i < 5) newOtp[i] = val;
      });
      setOtp(newOtp);
      // Focus the box after the last pasted character
      const nextFocus = Math.min(pastedData.length, 4);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  useEffect(() => {
    if (step !== "otp" || isLoading) return;
    if (otp.join("").length < 5) return;
    handleVerify();
  }, [otp, step, isLoading]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-300"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-200"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/50" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-4 tw:text-center">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-300"
              enterFrom="tw:opacity-0 tw:scale-95"
              enterTo="tw:opacity-100 tw:scale-100"
              leave="tw:ease-in tw:duration-200"
              leaveFrom="tw:opacity-100 tw:scale-100"
              leaveTo="tw:opacity-0 tw:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-[400px] tw:transform tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:p-6 tw:text-left tw:align-middle tw:shadow-xl tw:transition-all">
                {/* --- STEP 1: CONFIRM EMAIL --- */}
                {step === "email" && (
                  <div className="tw:flex tw:flex-col tw:gap-4">
                    <span className="tw:text-[20px] tw:font-bold tw:text-gray-900">
                      Verify Account
                    </span>
                    <span className="tw:text-[14px] tw:text-gray-500">
                      Confirm Email address to proceed to verification
                    </span>

                    <div className="tw:mt-2">
                      <label className="tw:text-[14px] tw:font-semibold tw:text-gray-900 tw:mb-2 tw:block">
                        Email Address
                      </label>
                      <div className="tw:w-full tw:rounded-xl tw:border tw:border-gray-300 tw:bg-gray-50 tw:px-4 tw:py-3 tw:text-gray-600 tw:flex tw:items-center tw:gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="tw:size-5 tw:text-gray-400"
                        >
                          <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                          <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                        </svg>
                        <span className="tw:text-[14px]">{email}</span>
                      </div>
                    </div>

                    <div className="tw:mt-4 tw:flex tw:gap-3 tw:w-full">
                      <button
                        style={{
                          borderRadius: 8,
                        }}
                        onClick={closeModal}
                        className="tw:flex-1 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:py-3 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:bg-gray-50"
                      >
                        Skip for now
                      </button>
                      <button
                        style={{
                          borderRadius: 8,
                        }}
                        onClick={handleRequestCode}
                        disabled={isLoading}
                        className="tw:flex-1 tw:rounded-xl tw:bg-primary tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primary/80 tw:flex tw:items-center tw:justify-center"
                      >
                        {isLoading ? (
                          <Loader2 className="tw:animate-spin tw:w-5 tw:h-5" />
                        ) : (
                          "Next"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- STEP 2: ENTER OTP --- */}
                {step === "otp" && (
                  <div className="tw:flex tw:flex-col tw:gap-4">
                    <span className="tw:text-[20px] tw:font-bold tw:text-gray-900">
                      Verify your Email
                    </span>
                    <span className="tw:text-[14px] tw:text-gray-500">
                      We sent a code to{" "}
                      <span className="tw:font-semibold tw:text-gray-900">
                        {email}
                      </span>
                    </span>

                    {/* 5 OTP Inputs */}
                    <div className="tw:flex tw:justify-between tw:gap-2 tw:mt-4">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          className="tw:w-12 tw:h-12 tw:rounded-xl tw:border tw:border-gray-300 tw:text-center tw:text-lg tw:font-bold tw:text-gray-900 tw:focus:border-primary tw:focus:ring-2 tw:focus:ring-primary/20 tw:outline-none"
                          value={data}
                          ref={(el) => (inputRefs.current[index] = el)}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onPaste={handlePaste}
                        />
                      ))}
                    </div>

                    <div className="tw:flex tw:justify-between tw:items-center tw:mt-2">
                      <button
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="tw:text-[13px] tw:font-semibold tw:text-primary tw:hover:underline tw:disabled:opacity-50"
                      >
                        Resend Code
                      </button>
                      {/* <span className="tw:text-[13px] tw:text-gray-400">
                        Code expires in 10:00
                      </span> */}
                    </div>

                    {/* <button className="tw:w-full tw:mt-2 tw:py-3 tw:bg-gray-100 tw:rounded-xl tw:text-[14px] tw:font-medium tw:text-gray-600 tw:hover:bg-gray-200">
                      Use Phone instead
                    </button> */}

                    <div className="tw:mt-4 tw:flex tw:gap-3 tw:w-full">
                      <button
                        onClick={closeModal}
                        className="tw:flex-1 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:py-3 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:bg-gray-50"
                      >
                        Skip for now
                      </button>
                      <button
                        onClick={() => handleVerify({ force: true })}
                        disabled={isLoading}
                        className="tw:flex-1 tw:rounded-xl tw:bg-primary tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primary/80 tw:flex tw:items-center tw:justify-center"
                      >
                        {isLoading ? (
                          <Loader2 className="tw:animate-spin tw:w-5 tw:h-5" />
                        ) : (
                          "Finish"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
