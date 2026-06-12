import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContainer from "../assets/auth_container";
import { motion } from "framer-motion";
import axios from "axios";
import { showSuccess, showError } from "../../../component/ui/toast";
import { useAuth } from "../AuthContext";
import { api, authHeaders } from "../../../lib/apiClient";
import { getWebDevicePayload } from "../../../lib/deviceName";

export function ChangePassword({ ResetPasswordVerificationData }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Extract data from props
  const { input, reset_token } = ResetPasswordVerificationData || {};

  const isFormValid = () => {
    const { password, confirmPassword } = formData;
    return (
      password &&
      confirmPassword &&
      password.length >= 8 &&
      password === confirmPassword
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { password, confirmPassword } = formData;

    if (!input || !reset_token) {
      showError("Password reset session is missing. Please request a new reset code.");
      return;
    }

    // Validation checks
    if (!password || !confirmPassword) {
      showError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        input: input.trim(),
        token: reset_token.trim(),
        password: password.trim(),
        password_confirmation: confirmPassword.trim(),
        ...getWebDevicePayload(),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/password/reset`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;
      const nextToken =
        data?.token ||
        data?.data?.token ||
        data?.access_token ||
        data?.data?.access_token ||
        null;
      let nextUser =
        data?.user ||
        data?.data?.user ||
        data?.data?.profile ||
        data?.profile ||
        null;

      if (nextToken && !nextUser) {
        try {
          const profileResponse = await api.get(
            "/api/v1/profile",
            authHeaders(nextToken)
          );
          const profilePayload =
            profileResponse?.data?.data || profileResponse?.data || {};
          nextUser = profilePayload?.user || profilePayload || null;
        } catch (profileError) {
          console.error("Failed to fetch profile after password reset", profileError);
        }
      }

      if (nextToken && nextUser) {
        showSuccess(data?.message || "Password reset successful.");
        login({
          user: nextUser,
          token: nextToken,
          organiser:
            data?.organiser ||
            data?.data?.organiser ||
            nextUser?.organiser ||
            nextUser?.organizer ||
            null,
        });
        navigate("/feed", { replace: true });
        return;
      }

      showError(
        "Password reset succeeded, but automatic sign-in is unavailable. Please sign in manually."
      );
      navigate("/auth/signin", { replace: true });
    } catch (err) {
      let errorMessage = "An error occurred. Please try again.";

      if (err.response) {
        // Handle API error responses
        if (err.response.data?.message === "Invalid or expired reset token.") {
          errorMessage = "Invalid or expired reset token. Please request a new password reset link.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer
      title="Create new password"
      description={input ? `Set a new password for ${input}` : "Set a new password"}
    >
      <form autoComplete="off" className="tw:px-3 tw:pb-2" onSubmit={handleSubmit}>
        <div className="tw:rounded-[28px] tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="tw:text-center">
            <span className="tw:block tw:mt-5 tw:text-xl tw:font-bold tw:text-slate-950">
              Set new password
            </span>
            <span className="tw:block tw:mt-2 tw:text-sm tw:leading-6 tw:text-slate-500">
              Use at least 8 characters. Your new password must match in both fields.
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="tw:mt-5"
          >
            <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
              Password
            </span>
            <div className="tw:relative tw:mt-2">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="tw:h-12 tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:pr-14 tw:text-sm tw:text-slate-900 tw:outline-none tw:transition placeholder:tw:text-slate-400 focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/10"
                placeholder="Enter New Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                style={{ borderRadius: 28, fontSize: 12 }}
                type="button"
                className="tw:absolute tw:right-4 tw:top-1/2 tw:-translate-y-1/2 tw:text-xs tw:font-semibold tw:text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span className="tw:block tw:mt-2 tw:text-xs tw:text-slate-500">Minimum 8 characters</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className="tw:mt-4"
          >
            <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-900">
              Confirm password
            </span>
            <div className="tw:relative tw:mt-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className="tw:h-12 tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:pr-14 tw:text-sm tw:text-slate-900 tw:outline-none tw:transition placeholder:tw:text-slate-400 focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/10"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                style={{ borderRadius: 28, fontSize: 12 }}
                type="button"
                className="tw:absolute tw:right-4 tw:top-1/2 tw:-translate-y-1/2 tw:text-xs tw:font-semibold tw:text-primary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </motion.div>
        </div>

        {error && (
          <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-center tw:text-sm tw:text-red-700">
            {error}
          </div>
        )}

        <motion.button
          style={{ borderRadius: 28, fontSize: 12 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="tw:mt-5 tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
          type="submit"
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              Processing...
            </>
          ) : (
            "Set Password"
          )}
        </motion.button>
      </form>
    </AuthContainer>
  );
}
