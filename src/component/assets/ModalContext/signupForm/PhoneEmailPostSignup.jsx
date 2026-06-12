import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PostSignupFormModal from "./ModalContainer";
import SignUpCodecomponent from "./SignUpCodecomponent";
import "./postSignupStyle.css";
import { useAuth } from "../../../../pages/auth/AuthContext";
import { useModal } from "..";
import { showSuccess } from "../../../ui/toast";
import { api, authHeaders } from "../../../../lib/apiClient";

const PhoneEmailPostSignup = ({ type, userupdate, token }) => {
  const [phone, setPhone] = useState("");
  const [proceed, setProceed] = useState(false);
  const [code, setcode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const autoRequestedRef = useRef(false);
  const { login } = useAuth();
  const { closeModal } = useModal();

  const email = userupdate?.email || "";
  const isPhoneValid = (value) => value.length >= 8;
  const isFormValid =
    (type === "email" && !!email) || (type === "phone" && isPhoneValid(phone));

  useEffect(() => {
    if (userupdate?.phone) {
      setPhone(userupdate.phone);
    }
  }, [userupdate]);

  const requestVerificationCode = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const normalizedPhone =
        phone && phone.startsWith("+")
          ? phone
          : `+${phone}`.replace(/^\++/, "+");
      const input = type === "email" ? email : normalizedPhone;
      const response = await api.post(
        "/api/v1/code/generate",
        { input },
        authHeaders(token)
      );

      if (response.status === 200) {
        setProceed(true);
        const payload = response.data?.data || response.data || {};
        setcode(payload.code || response.data?.code || null);
        setSuccessMessage(
          payload.message ||
            response.data?.message ||
            "Verification code sent successfully!"
        );
        showSuccess("Verification code sent successfully!");
      } else {
        setErrorMessage(response.data?.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      let errorMsg = "An error occurred while sending verification code.";

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMsg = errors.email?.[0] || errors.phone?.[0] || errorMsg;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [email, phone, token, type]);

  useEffect(() => {
    if (type !== "email" || !email || autoRequestedRef.current) {
      return;
    }

    autoRequestedRef.current = true;
    requestVerificationCode();
  }, [email, requestVerificationCode, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await requestVerificationCode();
  };

  if (proceed) {
    return (
      <SignUpCodecomponent
        Otpcode={code}
        token={token}
        userupdate={userupdate}
        type={type}
      />
    );
  }

  function skipProcess() {
    login({ token, user: userupdate });
    closeModal();
  }

  return (
    <PostSignupFormModal>
      <motion.div
        className="tw:mx-auto tw:w-full tw:max-w-md tw:space-y-5 tw:rounded-3xl tw:bg-white tw:px-6 tw:py-8 tw:shadow-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="tw:space-y-1">
          <motion.span
            className="tw:text-xl tw:font-semibold tw:text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Enter your {type === "email" ? "email" : "phone number"}
          </motion.span>
          <p className="tw:text-sm tw:text-gray-500">
            We&apos;ll send you a code to confirm your contact details.
          </p>
        </div>

        {successMessage && (
          <div className="tw:rounded-2xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:px-4 tw:py-3 tw:text-sm tw:text-emerald-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-sm tw:text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="tw:space-y-4">
          {type === "email" ? (
            <div className="tw:space-y-2">
              <label className="tw:text-sm tw:font-medium tw:text-gray-600">
                Email
              </label>
              <div className="tw:relative">
                <FaEnvelope className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400" />
                <input
                  type="email"
                  className="tw:w-full tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:px-12 tw:py-3 tw:text-sm tw:text-gray-900 focus:tw:border-black focus:tw:outline-none"
                  value={email}
                  readOnly
                />
              </div>
            </div>
          ) : (
            <div className="tw:space-y-2">
              <label className="tw:text-sm tw:font-medium tw:text-gray-600">
                Phone number
              </label>
              <PhoneInput
                country={"ng"}
                value={phone}
                onChange={(value) => setPhone(value)}
                inputProps={{
                  required: true,
                }}
                inputClass="tw:w-full tw:rounded-2xl tw:border tw:border-gray-200 tw:px-4 tw:py-3 tw:text-sm"
                buttonClass="tw:bg-transparent tw:p-0"
                containerStyle={{ width: "100%" }}
              />
            </div>
          )}

          <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between tw:gap-3">
            <motion.button
              type="button"
              onClick={skipProcess}
              className="tw:text-sm tw:font-semibold tw:text-black tw:underline tw:transition tw:duration-200 tw:hover:opacity-90"
              whileHover={{ scale: 1.03 }}
            >
              Skip for now
            </motion.button>

            <motion.button
              style={{
                borderRadius: 20,
              }}
              type="submit"
              disabled={!isFormValid || isLoading}
              whileHover={isFormValid ? { scale: 1.02 } : {}}
              whileTap={isFormValid ? { scale: 0.98 } : {}}
              className={`tw:rounded-2xl tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition tw:duration-200 ${
                isFormValid
                  ? "tw:bg-black tw:text-white"
                  : "tw:bg-gray-200 tw:text-gray-500"
              }`}
            >
              {isLoading && (
                <span className="tw:mr-2 tw:inline-flex tw:h-4 tw:w-4 tw:animate-spin tw:border-2 tw:border-white tw:border-t-transparent" />
              )}
              Next
            </motion.button>
          </div>
        </form>
      </motion.div>
    </PostSignupFormModal>
  );
};

export default PhoneEmailPostSignup;
