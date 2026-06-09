import React, { useMemo, useState } from "react";
import {
  FaMars,
  FaVenus,
  FaGenderless,
} from "react-icons/fa";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import { motion } from "framer-motion";
import PostSignupFormModal from "./ModalContainer";
import PhoneEmailPostSignup from "./PhoneEmailPostSignup";
import "./postSignupStyle.css";
import { useAuth } from "../../../../pages/auth/AuthContext";
import { useModal } from "..";
import { showToast } from "../../../ToastAlert";
import { showError, showSuccess } from "../../../ui/toast";
import { api } from "../../../../lib/apiClient";
import { clearActiveAuthStorage } from "../../../../lib/authStorage";
import { useNavigate } from "react-router-dom";

const PostSignupForm = () => {
  const { user, login, token } = useAuth();
  const { closeModal } = useModal();
  const navigate = useNavigate();

  // ✅ hooks must always run, every render
  const [dob, setDob] = useState(null);
  const [gender, setGender] = useState("");
  const [tosendUserdata, settosendUserdata] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fifteenYearsAgo = useMemo(() => {
    const boundary = new Date();
    boundary.setFullYear(boundary.getFullYear() - 15);
    boundary.setHours(0, 0, 0, 0);
    return boundary;
  }, []);

  const fiveYearsBefore = useMemo(() => {
    const earliest = new Date(fifteenYearsAgo);
    earliest.setFullYear(earliest.getFullYear() - 80);
    return earliest;
  }, [fifteenYearsAgo]);

  const isFormValid = dob && gender;

  const isAtLeast15 = (date) => {
    if (!date) return false;
    return date.getTime() <= fifteenYearsAgo.getTime();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please fill in all fields");
      return;
    }

    if (!isAtLeast15(dob)) {
      setError("You must be at least 15 years old");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = `/api/v1/gender/dob`;

      const formData = new FormData();
      formData.append("gender", gender);
      const formattedDob = dob ? dob.toISOString().split("T")[0] : "";
      formData.append("dob", formattedDob);

      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status === 401) {
        clearActiveAuthStorage();
        navigate("/auth/signin");
        return;
      }

      if (response.status === 200 || response.status === 201) {
        const updatedUser = response.data?.user || response.data?.data?.user || user;
        showSuccess(
          response.data.message ||
            "Date of Birth and Gender updated successfully!"
        );
        settosendUserdata(updatedUser);

        if (updatedUser?.email_verified || updatedUser?.email_verified_at) {
          login({ token, user: updatedUser });
          closeModal();
          return;
        }

        setFormSubmitted(true);
        return;
      }

      if (response.status === 422) {
        const message = response.data?.message || "";

        if (message.toLowerCase().includes("already")) {
          showToast.info(message);

          // ✅ don’t reload the page; just update auth state
          const updatedUser = {
            ...user,
            gender: user?.gender ?? gender,
            dob: user?.dob ?? dob,
          };
          login({ token, user: updatedUser });

          return;
        }

        const errorMsg = message || response.data?.error || "Validation failed";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      throw new Error(response.data?.message || "Update failed");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ now it’s safe to return early, after hooks
  if (!user) return null;

  const profileComplete = user.gender != null && user.dob != null;
  if (profileComplete) return null;

  if (formSubmitted) {
    return (
      <PhoneEmailPostSignup
        token={token}
        userupdate={tosendUserdata}
        type="email"
      />
    );
  }

  return (
    <PostSignupFormModal>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.span
          className="tw:lg tw:md:text-xl tw:lg:text-2xl tw:font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Complete your Profile
        </motion.span>

        <p>Just a few more details to complete your profile</p>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="tw:space-y-5">
          <div className="tw:space-y-2">
            <label className="tw:text-sm tw:font-medium tw:text-gray-700">
              Date of Birth
            </label>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <MuiDatePicker
                value={dob ? moment(dob) : null}
                onChange={(value) =>
                  setDob(value?.isValid?.() ? value.toDate() : null)
                }
                maxDate={moment(fifteenYearsAgo)}
                minDate={moment(fiveYearsBefore)}
                openTo="year"
                views={["year", "month", "day"]}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                    placeholder: "Select your date of birth",
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "16px",
                        backgroundColor: "#f9fafb",
                        transition: "box-shadow 180ms ease, border-color 180ms ease",
                      },
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        boxShadow:
                          "0 0 0 4px rgba(0,245,255,0.08), 0 10px 24px rgba(15,23,42,0.06)",
                      },
                      "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                        borderColor: "#00F5FF",
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#050505",
                      },
                    },
                  },
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        borderRadius: "20px",
                        boxShadow:
                          "0 24px 70px rgba(15,23,42,0.18), 0 0 22px rgba(0,245,255,0.08)",
                      },
                    },
                  },
                  day: {
                    sx: {
                      "&.Mui-selected": {
                        backgroundColor: "#050505",
                        boxShadow: "0 0 12px rgba(0,245,255,0.18)",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: "#050505",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          <div className="form-group">
            <label>Gender</label>
            <div className="gender-buttons">
              {["male", "female", "others"].map((g) => (
                <motion.button
                  key={g}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className={`gender-btn ${gender === g ? "selected" : ""}`}
                  onClick={() => setGender(g)}
                >
                  {g === "male" ? (
                    <FaMars size={20} />
                  ) : g === "female" ? (
                    <FaVenus size={20} />
                  ) : (
                    <FaGenderless size={20} />
                  )}
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!isFormValid || isLoading}
            whileHover={isFormValid ? { scale: 1.02 } : {}}
            className="submit-btn"
            style={{
              backgroundColor: isFormValid ? "#050505" : "#e6e6e6",
              color: isFormValid ? "#fff" : "#999",
              cursor: isFormValid ? "pointer" : "not-allowed",
              marginTop: "20px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              width: "100%",
            }}
          >
            {isLoading ? (
              <div className="d-flex justify-content-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              "Complete Profile"
            )}
          </motion.button>
        </form>
      </motion.div>
    </PostSignupFormModal>
  );
};

export default PostSignupForm;
