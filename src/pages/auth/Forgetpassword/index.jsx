import React, { useState } from "react";
import AuthContainer from "../assets/auth_container";
import { api } from "../../../lib/apiClient";
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

      const response = await api.post(
        "/api/v1/password/request-code",
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
      {/* Presentation only — the request, the endpoint and the validation above
          are untouched. The nested shadowed card that used to wrap this field
          is gone: the shell already provides the card, and a card-inside-a-card
          with a 70px shadow is what made this screen read as a different
          product from the sign-in page. */}
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="tw:mb-5">
          <label
            htmlFor="reset-email"
            className="form-label tw:mb-1.5! tw:block"
          >
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            autoComplete="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="tw:mt-2! tw:mb-0! tw:text-[11.5px]! tw:leading-relaxed">
            We will send a 5-digit verification code to this email.
          </p>
        </div>

        <button className="bt" type="submit" disabled={isButtonDisabled}>
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
