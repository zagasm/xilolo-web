import React, { useState } from "react";
import AuthContainer from "../assets/auth_container";
import axios from "axios";
import { CodeVerification } from "../CodeVerification";
import { showError, showSuccess } from "../../../component/ui/toast";

export function ForgetPassword() {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isButtonDisabled = !input.trim() || !isValidEmail(input) || isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(input)) {
      showError("Please enter a valid email address format.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new URLSearchParams();
      formData.append("input", input);
      formData.append("country_code", "");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/password/request-code`,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;
      showSuccess(data.message || "Verification code sent successfully!");
      setVerificationData({
        code: data.code,
        input: data.input,
        expiresAt: data.expiresAt,
        isEmail: true,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to send verification code. Please try again.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationData) {
    return <CodeVerification verificationData={verificationData} />;
  }

  return (
    <AuthContainer
      title={"Forgot Password?"}
      description={"Enter your email to reset your password"}
      footer={false}
      header={true}
      privacy={false}
      haveAccount={false}
    >
      <form
        autoComplete="off"
        className="tw:px-3 tw:pb-2"
        onSubmit={handleSubmit}
      >
        <div className="tw:rounded-[28px] tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
            Email address
          </span>
          <input
            type="email"
            className="tw:mt-2 tw:h-12 tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:text-sm tw:text-slate-900 tw:outline-none tw:transition placeholder:tw:text-slate-400 focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/10"
            placeholder="you@example.com"
            autoComplete="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <span className="tw:block tw:mt-3 tw:text-xs tw:leading-5 tw:text-slate-500">
            We will send a 5-digit verification code to this email.
          </span>
        </div>

        <button
          style={{ borderRadius: 28, fontSize: 12}}
          className="tw:mt-5 tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition hover:tw:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
          type="submit"
          disabled={isButtonDisabled}
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm mr-2"
                role="status"
                aria-hidden="true"
              ></span>
              Sending...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </AuthContainer>
  );
}
