import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AuthContainer from "../assets/auth_container";
import { motion } from "framer-motion";
import axios from "axios";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { showError, showSuccess } from "../../../component/ui/toast";
import { api } from "../../../lib/apiClient";
import { isAppleAuthConfigured } from "../../../lib/appleAuth";
import {
  isValidEmailAddress,
  normalizeEmailInput,
} from "../../../lib/emailValidation";
import { getWebDevicePayload } from "../../../lib/deviceName";
import { getAuthLocationPayload } from "../../../lib/authLocation";
import GoogleAuthSection from "../components/GoogleAuthSection.jsx";
import AppleAuthSection from "../components/AppleAuthSection.jsx";
import TwoFactorLoginForm from "../components/TwoFactorLoginForm.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const emailCheckRequestId = useRef(0);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    class: ""
  });
  const showSocialAuth = Boolean(GOOGLE_CLIENT_ID || isAppleAuthConfigured());
  const showBlackEmailHint = Boolean(emailExistsError);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: ""
  });
  const normalizedEmail = normalizeEmailInput(formData.email);
  const emailFormatError =
    normalizedEmail && !isValidEmailAddress(normalizedEmail)
      ? "Please enter a valid email address."
      : "";

  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    } else {
      setPasswordStrength({ score: 0, label: "", class: "" });
    }
  }, [formData.password]);

  useEffect(() => {
    const trimmedEmail = normalizeEmailInput(formData.email);

    if (!trimmedEmail || !isValidEmailAddress(trimmedEmail)) {
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

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label, strengthClass;
    if (score >= 5) {
      label = "Strong";
      strengthClass = "strong";
    } else if (score >= 3) {
      label = "Medium";
      strengthClass = "medium";
    } else if (score > 0) {
      label = "Weak";
      strengthClass = "weak";
    } else {
      label = "";
      strengthClass = "";
    }

    setPasswordStrength({ score, label, class: strengthClass });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (name === "email") {
      setEmailExistsError("");
      setCheckedEmail("");
    }
  };

  const checkEmailExists = async (email) => {
    const trimmedEmail = normalizeEmailInput(email);

    if (!trimmedEmail || !isValidEmailAddress(trimmedEmail)) {
      setEmailExistsError("");
      setCheckedEmail("");
      return null;
    }

    const requestId = ++emailCheckRequestId.current;

    try {
      const { data } = await api.post("/api/v1/email-exists", {
        email: trimmedEmail,
      });

      if (requestId !== emailCheckRequestId.current) return null;

      setCheckedEmail(trimmedEmail);
      setEmailExistsError(
        data?.exists
          ? "This email is already in use. Please "
          : ""
      );
      return Boolean(data?.exists);
    } catch (error) {
      if (requestId !== emailCheckRequestId.current) return null;

      setCheckedEmail("");
      setEmailExistsError("");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.first_name || !formData.last_name || !formData.password) {
      showError("Please fill in all fields");
      return;
    }

    if (!formData.email) {
      showError("Please enter a valid email");
      return;
    }

    if (!isValidEmailAddress(normalizedEmail)) {
      showError("Please enter a valid email");
      return;
    }

    let existsResult = null;

    if (checkedEmail !== normalizedEmail) {
      existsResult = await checkEmailExists(normalizedEmail);
    }

    if (existsResult === true) {
      showError("This email is already in use. Please use another email.");
      return;
    }

    if (
      checkedEmail === normalizedEmail &&
      emailExistsError
    ) {
      showError(emailExistsError);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: normalizedEmail,
        password: formData.password,
        ...getWebDevicePayload(),
        ...(await getAuthLocationPayload()),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/users`,
        payload
      );

      if (response.data && response.data.token) {
        login({
          token: response.data.token,
          user: response.data.user
        });
        showSuccess(
          response.data.message || "Account created successfully!"
        );
        navigate("/feed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage =
        err.response?.data?.message || "Registration failed";
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (googleResponse) => {
    const idToken = googleResponse?.credential;
    if (!idToken) {
      showError("Google sign up could not be completed.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const { data } = await api.post("/api/v1/google/signup", {
        id_token: idToken,
        ...getWebDevicePayload(),
        ...(await getAuthLocationPayload()),
      });

      if (!data?.token || !data?.user) {
        throw new Error("Invalid Google signup response.");
      }

      login({
        token: data.token,
        user: data.user,
      });
      showSuccess(data.message || "Google sign up successful.");
      navigate("/feed", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message || "Google sign up failed.";

      showError(message);

      if (status === 422) {
        navigate("/auth/signin", {
          replace: true,
          state: { googleAuthHint: "login" },
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleContinue = async ({ idToken }) => {
    if (!idToken) {
      showError("Apple sign in could not be completed.");
      return;
    }

    setIsAppleLoading(true);

    try {
      const { data } = await api.post("/api/v1/apple/login", {
        id_token: idToken,
        ...getWebDevicePayload(),
        ...(await getAuthLocationPayload()),
      });

      if (data?.two_factor_required) {
        setTwoFactorChallenge(data);
        showSuccess(data?.message || "Two-factor authentication required.");
        return;
      }

      if (!data?.token || !data?.user) {
        throw new Error("Invalid Apple login response.");
      }

      login({
        token: data.token,
        user: data.user,
      });
      showSuccess(
        data.message ||
          (data?.is_new_user
            ? "Apple account created successfully."
            : "Apple login successful.")
      );
      navigate("/feed", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Apple sign in failed.";

      showError(message);
    } finally {
      setIsAppleLoading(false);
    }
  };

  if (twoFactorChallenge) {
    return (
      <TwoFactorLoginForm
        challenge={twoFactorChallenge}
        onVerified={(data) => {
          login({
            token: data.token,
            user: data.user,
            organiser: data.organiser || data.organizer,
            security: data.security,
          });
          navigate("/feed", { replace: true });
        }}
        onCancel={() => setTwoFactorChallenge(null)}
      />
    );
  }

  const isFormValid = () => {
    return (
      formData.first_name.trim() !== "" &&
      formData.last_name.trim() !== "" &&
      isValidEmailAddress(normalizedEmail) &&
      formData.password.trim() !== ""
    );
  };

  return (
    <AuthContainer
      title={"Create Your Account"}
      description={"Begin to explore amazing events"}
      footer={true}
      header={true}
      privacy={true}
      haveAccount={false}
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
                text="signup_with"
                onSuccess={handleGoogleSignup}
                onError={() => showError("Google sign up was cancelled or failed.")}
              />
              <AppleAuthSection
                loading={isAppleLoading}
                onSuccess={handleAppleContinue}
                onError={(error, meta) => {
                  if (meta?.cancelled) {
                    showError("Apple sign in was cancelled.");
                    return;
                  }

                  showError(
                    error?.message || "Apple sign in was cancelled or failed."
                  );
                }}
              />
            </div>
          </div>
        ) : null
      }
    >
      <form autoComplete="off" className="" onSubmit={handleSubmit}>
        {error && (
          <div className="text-danger mb-3 alert alert-danger">{error}</div>
        )}

        <div className="row p-0 m-0">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="col-md-6 col-6 p-0 m-0"
          >
            <div className="form-group m-2">
              <TextField
                fullWidth
                id="fName"
                type="text"
                name="first_name"
                label="First name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="feather-user" style={{ color: "#666" }}></i>
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
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="col-md-6 col-6 p-0 m-0"
          >
            <div className="form-group m-2">
              <TextField
                fullWidth
                id="lName"
                type="text"
                name="last_name"
                label="Last name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="feather-user" style={{ color: "#666" }}></i>
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
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="form-group m-2"
        >
          <TextField
            fullWidth
            id="email"
            type="email"
            name="email"
            label="Email Address"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            error={Boolean(emailFormatError)}
            helperText={
              emailFormatError ? (
                emailFormatError
              ) : emailExistsError ? (
                <span className="tw:inline-flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-black">
                  {emailExistsError}{" "}
                  <Link to="/auth/signin" className="tw:font-semibold tw:underline">
                    Log in
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
                color:
                  !emailFormatError && showBlackEmailHint ? "#111111" : undefined,
                marginLeft: 0,
                whiteSpace: "nowrap",
              },
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="form-group m-2"
        >
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            name="password"
            label="Password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
            helperText=" "
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 mr-2 ml-2"
        >
          <button
            className={`${isFormValid() ? "active_submit_button" : "inactive_submit_button"
              }`}
            type="submit"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </button>
        </motion.div>
      </form>
    </AuthContainer>
  );
}
