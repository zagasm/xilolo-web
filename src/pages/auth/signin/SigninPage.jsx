import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AuthContainer from "../assets/auth_container";
import { motion } from "framer-motion";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { SigninWithCode } from "./SignCode";
import { showError, showSuccess } from "../../../component/ui/toast";
import {
  clearRememberedAccountQuickLogin,
  getRememberedAccounts,
  removeRememberedAccount,
} from "../../../lib/authStorage";
import defaultAvatar from "../../../assets/avater_pix.avif";
import { api, authHeaders } from "../../../lib/apiClient";
import { isAppleAuthConfigured } from "../../../lib/appleAuth";
import { getWebDevicePayload } from "../../../lib/deviceName";
import GoogleAuthSection from "../components/GoogleAuthSection.jsx";
import AppleAuthSection from "../components/AppleAuthSection.jsx";
import TwoFactorLoginForm from "../components/TwoFactorLoginForm.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REMEMBERED_ACCOUNT_INVALID_PATTERNS = [
  "account not found",
  "user not found",
  "no account",
  "deleted account",
  "account deleted",
  "no longer exists",
  "deactivated",
  "disabled account",
];

export function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSource, setVerificationSource] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isRememberedLoginLoading, setIsRememberedLoginLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [emailExistsError, setEmailExistsError] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const emailCheckRequestId = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const showBlackEmailHint = Boolean(emailExistsError);
  const showSocialAuth = Boolean(GOOGLE_CLIENT_ID || isAppleAuthConfigured());
  const redirectPath =
    typeof location.state?.from === "string" ? location.state.from : "/feed";

  useEffect(() => {
    setRememberedAccounts(getRememberedAccounts());
  }, []);

  useEffect(() => {
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      emailCheckRequestId.current += 1;
      setCheckedEmail("");
      setEmailExistsError("");
      return;
    }

    if (checkedEmail === trimmedEmail) return;

    const timeoutId = window.setTimeout(() => {
      checkEmailExists(trimmedEmail);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [formData.email, checkedEmail]);

  const isCredentialFilled = useMemo(() => {
    return formData.email && EMAIL_REGEX.test(formData.email);
  }, [formData.email]);

  const isPasswordFilled = formData.password.length >= 6;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(17, 17, 17, 0.3)",
    },
    tap: { scale: 0.98 },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (errors.server) setErrors((prev) => ({ ...prev, server: null }));
    if (name === "email") {
      setEmailExistsError("");
      setCheckedEmail("");
    }
  };

  const checkEmailExists = async (email) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setEmailExistsError("");
      setCheckedEmail("");
      return null;
    }

    const requestId = ++emailCheckRequestId.current;

    try {
      const { data } = await api.post("/api/v1/email-exists", {
        email: trimmedEmail,
      });

      if (requestId !== emailCheckRequestId.current) return;

      setCheckedEmail(trimmedEmail);
      setEmailExistsError(
        data?.exists === false
          ? "We couldn’t find an account with this email."
          : ""
      );
      return Boolean(data?.exists);
    } catch (error) {
      if (requestId !== emailCheckRequestId.current) return;

      setCheckedEmail("");
      setEmailExistsError("");
      return null;
    }
  };

  const validateCredential = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    } else if (
      checkedEmail === formData.email.trim() &&
      emailExistsError
    ) {
      newErrors.email = emailExistsError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    const trimmedEmail = formData.email.trim();
    let existsResult = null;

    if (
      EMAIL_REGEX.test(trimmedEmail) &&
      checkedEmail !== trimmedEmail
    ) {
      existsResult = await checkEmailExists(trimmedEmail);
    }

    if (existsResult === false) {
      setErrors((prev) => ({
        ...prev,
        email: "We couldn’t find an account with this email.",
      }));
      return;
    }

    if (validateCredential()) {
      setVerificationSource(formData.email);
      setShowPasswordField(true);
      setSelectedAccount(null);
    }
  };

  const resetToManualLogin = () => {
    setSelectedAccount(null);
    setShowPasswordField(false);
    setShowPassword(false);
    setIsRememberedLoginLoading(false);
    setFormData({ email: "", password: "" });
    setErrors({});
  };

  const handleSelectAccount = async (account) => {
    setSelectedAccount(account);
    setVerificationSource(account.email || "");
    setShowPassword(false);
    setErrors({});
    setFormData({
      email: account.email || "",
      password: "",
    });

    if (!account?.quickLoginToken || !account?.quickLoginExpiresAt) {
      setShowPasswordField(true);
      return;
    }

    setShowPasswordField(false);
    setIsRememberedLoginLoading(true);

    try {
      const response = await api.get(
        "/api/v1/profile",
        authHeaders(account.quickLoginToken)
      );
      const payload = response?.data?.data || response?.data || {};
      const freshUser = payload.user || payload;
      const freshOrganiser =
        payload.organiser ||
        payload.organizer ||
        freshUser?.organiser ||
        freshUser?.organizer ||
        null;

      login({
        user: freshUser,
        organiser: freshOrganiser,
        token: account.quickLoginToken,
      });
      showSuccess("Signed in successfully.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      clearRememberedAccountQuickLogin(
        account.userId || account.email || account.id
      );
      setRememberedAccounts(getRememberedAccounts());
      setShowPasswordField(true);
      showError("Quick sign-in expired. Enter your password to continue.");
    } finally {
      setIsRememberedLoginLoading(false);
    }
  };

  const handleRemoveRememberedAccount = (event, account) => {
    event.preventDefault();
    event.stopPropagation();

    const identifier = account.userId || account.email || account.id;
    removeRememberedAccount(identifier);

    const nextAccounts = getRememberedAccounts();
    setRememberedAccounts(nextAccounts);

    if (
      selectedAccount &&
      (selectedAccount.userId === account.userId ||
        selectedAccount.email === account.email)
    ) {
      resetToManualLogin();
    }
  };

  const handleInvalidRememberedAccount = (message) => {
    if (!selectedAccount) return;

    const normalizedMessage = String(message || "").toLowerCase();
    const shouldRemove = REMEMBERED_ACCOUNT_INVALID_PATTERNS.some((pattern) =>
      normalizedMessage.includes(pattern)
    );

    if (!shouldRemove) return;

    removeRememberedAccount(
      selectedAccount.userId || selectedAccount.email || selectedAccount.id
    );
    setRememberedAccounts(getRememberedAccounts());
    resetToManualLogin();
  };

  const finishLogin = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error("Invalid login response.");
    }

    login({
      user: data.user,
      organiser: data.organiser || data.organizer,
      token: data.token,
      security: data.security,
    });
  };

  const handleTwoFactorRequired = (data) => {
    setTwoFactorChallenge(data);
    showSuccess(data?.message || "Two-factor authentication required.");
  };

  const handleTwoFactorVerified = (data) => {
    finishLogin(data);
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);

    try {
      const payload = {
        input: formData.email,
        password: formData.password,
        ...getWebDevicePayload(),
      };

      const response = await api.post("/api/v1/login", payload);

      const data = response.data;
      if (response.status === 202 || data?.two_factor_required) {
        handleTwoFactorRequired(data);
        return;
      }

      if (data.token) {
        finishLogin(data);
        showSuccess(data.message || "Login successful!");
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "The provided credentials are incorrect.";

      handleInvalidRememberedAccount(errorMessage);
      showError(errorMessage);
      setErrors({ server: errorMessage });
    } finally {
      setIsLoading(false);
      setFormData((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleGoogleLogin = async (googleResponse) => {
    const idToken = googleResponse?.credential;
    if (!idToken) {
      showError("Google login could not be completed.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const { data } = await api.post("/api/v1/google/login", {
        id_token: idToken,
        ...getWebDevicePayload(),
      });

      if (data?.two_factor_required) {
        handleTwoFactorRequired(data);
        return;
      }

      finishLogin(data);
      showSuccess(data.message || "Google login successful.");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message || "Google login failed.";

      showError(message);

      if (status === 404) {
        navigate("/auth/signup", {
          replace: true,
          state: { googleAuthHint: "signup" },
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async ({ idToken }) => {
    if (!idToken) {
      showError("Apple login could not be completed.");
      return;
    }

    setIsAppleLoading(true);

    try {
      const { data } = await api.post("/api/v1/apple/login", {
        id_token: idToken,
        ...getWebDevicePayload(),
      });

      if (data?.two_factor_required) {
        handleTwoFactorRequired(data);
        return;
      }

      finishLogin(data);
      showSuccess(data.message || "Apple login successful.");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Apple login failed.";

      showError(message);
    } finally {
      setIsAppleLoading(false);
    }
  };

  if (showVerification) {
    return (
      <SigninWithCode
        CodeType="email"
        CodeSource={verificationSource}
        loginMethod="email"
        formData={formData}
      />
    );
  }

  if (twoFactorChallenge) {
    return (
      <TwoFactorLoginForm
        challenge={twoFactorChallenge}
        onVerified={handleTwoFactorVerified}
        onCancel={() => setTwoFactorChallenge(null)}
      />
    );
  }

  return (
    <AuthContainer
      title="Login account"
      description="Continue to explore Xilolo"
      footer={true}
      header={true}
      privacy={true}
      haveAccount={true}
      socialSlot={
        showSocialAuth ? (
          <div className="tw:w-full tw:max-w-[420px] tw:mx-auto">
            <p className="small text-muted mb-3">
              {isGoogleLoading || isAppleLoading
                ? "Connecting to your account..."
                : "Or continue with"}
            </p>
            <div className="tw:flex tw:flex-col tw:gap-3">
              <GoogleAuthSection
                label={null}
                text="continue_with"
                onSuccess={handleGoogleLogin}
                onError={() => showError("Google login was cancelled or failed.")}
              />
              <AppleAuthSection
                loading={isAppleLoading}
                onSuccess={handleAppleLogin}
                onError={(error, meta) => {
                  if (meta?.cancelled) {
                    showError("Apple login was cancelled.");
                    return;
                  }

                  showError(
                    error?.message || "Apple login was cancelled or failed."
                  );
                }}
              />
            </div>
          </div>
        ) : null
      }
    >
      <style>{`
        .continue-btn {
          background-color: ${isCredentialFilled ? "#111111" : "rgba(230, 230, 230, 1)"};
          color: white;
          cursor: ${isCredentialFilled ? "pointer" : "not-allowed"};
        }

        .signin-btn {
          background-color: ${isPasswordFilled ? "#111111" : "rgba(230, 230, 230, 1)"};
          color: white;
          cursor: ${isPasswordFilled ? "pointer" : "not-allowed"};
        }

        .verification-btn {
          background-color: transparent;
          border: 1px solid #111111;
          color: #111111;
        }
      `}</style>

      <motion.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {rememberedAccounts.length > 0 && !selectedAccount && !showPasswordField && (
          <motion.div variants={inputVariants} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0 tw:text-[11px]">Remembered accounts</label>
              {/* <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={resetToManualLogin}
              >
                Use another accountt
              </button> */}
            </div>

            <div className="d-grid gap-2">
              {rememberedAccounts.map((account) => (
                <div
                  key={account.id || account.userId || account.email}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:cursor-pointer hover:tw:bg-gray-50"
                  onClick={() => handleSelectAccount(account)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectAccount(account);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="d-flex align-items-center">
                    <img
                      src={account.avatar || defaultAvatar}
                      alt={account.fullName}
                      onError={(event) => {
                        event.currentTarget.src = defaultAvatar;
                      }}
                      className="me-3"
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <span className="d-flex flex-column">
                      <span className="fw-semibold text-dark tw:text-xs">
                        {account.fullName}
                      </span>
                      <span className="text-muted tw:text-[10px]">{account.email}</span>
                    </span>
                  </span>

                  <button
                    style={{
                      fontSize: 11
                    }}
                    type="button"
                    className="btn btn-sm btn-link text-danger text-decoration-none"
                    onClick={(event) =>
                      handleRemoveRememberedAccount(event, account)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {errors.server && (
          <motion.div
            className="alert alert-danger mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            {errors.server}
          </motion.div>
        )}

        {!selectedAccount && (
          <motion.div variants={inputVariants} className="form-group mb-4">
            <div className="d-flex justify-content-between align-items-center">

              {rememberedAccounts.length > 0 && showPasswordField && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={resetToManualLogin}
                >
                  Choose remembered account
                </button>
              )}
            </div>
            <div className="position-relative tw:mt-4">
              <TextField
                fullWidth
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                error={Boolean(errors.email && errors.email !== emailExistsError)}
                helperText={
                  errors.email ? (
                    errors.email
                  ) : emailExistsError ? (
                    <span className="tw:inline-flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-black">
                      {emailExistsError}{" "}
                      <Link
                        to="/auth/signup"
                        className="text-decoration-underline"
                      >
                        Create an account
                      </Link>
                    </span>
                  ) : (
                    " "
                  )
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="feather-mail" style={{ color: "#666" }}></i>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  },
                  "& .MuiFormHelperText-root": {
                    color: showBlackEmailHint ? "#111111" : undefined,
                    marginLeft: 0,
                    whiteSpace: "nowrap",
                  },
                }}
              />
            </div>
          </motion.div>
        )}

        {selectedAccount && (
          <motion.div variants={inputVariants} className="mb-4">
            <div className="border rounded-3 p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <img
                  src={selectedAccount.avatar || defaultAvatar}
                  alt={selectedAccount.fullName}
                  onError={(event) => {
                    event.currentTarget.src = defaultAvatar;
                  }}
                  className="me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <div className="fw-semibold text-dark tw:text-[12px] tw:md:text-xs">
                    {selectedAccount.fullName}
                  </div>
                  <div className="text-muted tw:text-[10px] tw:md:text-xs">{selectedAccount.email}</div>
                </div>
              </div>
              <button
                style={{
                  color: '#111111',
                  fontSize: 11
                }}
                type="button"
                className="btn btn-link p-0 text-decoration-none text-primary"
                onClick={resetToManualLogin}
              >
                Use another account
              </button>
            </div>
          </motion.div>
        )}

        {showPasswordField && (
          <>
            <motion.div
              variants={inputVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="form-group mb-3"
            >

              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password || " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="feather-lock" style={{ color: "#666" }}></i>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <i
                          className={`feather-eye${showPassword ? "" : "-off"}`}
                          style={{ color: "#666" }}
                        ></i>
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  },
                }}
              />
            </motion.div>
            <div className="d-flex justify-content-end mb-3">
              <Link
                to="/auth/forget-password"
                className="text-decoration-none"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <motion.span
                  animate={{
                    x: isHovering ? 2 : 0,
                  }}
                  transition={{ type: "spring" }}
                >
                  Forgot password?
                </motion.span>
              </Link>
            </div>
          </>
        )}

        {!showPasswordField ? (
          <motion.div variants={inputVariants}>
            <motion.button
              type="button"
              className="bt w-100 continue-btn"
              style={{
                height: "40px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                border: "none",
              }}
              disabled={!isCredentialFilled || isLoading}
              variants={buttonVariants}
              whileHover={isCredentialFilled ? "hover" : {}}
              whileTap={isCredentialFilled ? "tap" : {}}
              onClick={handleContinue}
            >
              Continue
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div variants={inputVariants}>
              <motion.button
                type="submit"
                className="bt w-100 signin-btn mb-3"
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  border: "none",
                }}
                disabled={!isPasswordFilled || isLoading || isRememberedLoginLoading}
                variants={buttonVariants}
                whileHover={isPasswordFilled ? "hover" : {}}
                whileTap={isPasswordFilled ? "tap" : {}}
              >
                {isLoading ? (
                  <div className="d-flex justify-content-center align-items-center">
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </motion.div>
            {/* <motion.div variants={inputVariants}>
              <motion.button
                type="button"
                className="bt w-100 verification-btn"
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  Width: '40px',
                  margin: 'auto'
                }}
                onClick={handleVerificationCode}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="feather-mail mr-2"></i> Email sign-in code
              </motion.button>
            </motion.div> */}
          </>
        )}
      </motion.form>
    </AuthContainer>
  );
}
