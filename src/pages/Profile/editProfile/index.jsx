import React, { useState, useEffect } from "react";
import "./editProfileStyling.css";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";
import default_profilePicture from "../../../assets/avater_pix.avif";
import SetPasswordModal from "../../../component/Profile/SetPasswordModal";
import SetUsernameModal from "../../../component/Profile/SetUsernameModal";
import { showSuccess, showError } from "../../../component/ui/toast";
import { ChevronLeft } from "lucide-react";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileImageCard from "./ProfileImageCard";
import { api, authHeaders } from "../../../lib/apiClient"; // ✅ use axios instance

function EditProfile() {
  const { user, login, token, setAuth } = useAuth();

  // console.log(user);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [recoveryPhoneNumber, setRecoveryPhoneNumber] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailTwoVerified, setEmailTwoVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneTwoVerified, setPhoneTwoVerified] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [usernameInfo, setUsernameInfo] = useState({
    username: "",
    canChange: false,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    about: "",
    email: "",
    email_two: "",
    gender: "",
  });

  const [dobDate, setDobDate] = useState(null);

  const Default_user_image = user?.profileUrl
    ? user.profileUrl
    : default_profilePicture;
  const [profileImage, setProfileImage] = useState(Default_user_image);

  // Helpers
  const splitPhone = (raw) => {
    if (!raw) return { countryCode: "", localNumber: "" };

    const normalized = raw.toString().replace(/[^\d+]/g, "");

    const match = normalized.match(/^\+?(\d{1,3})(\d+)$/);

    if (!match) {
      return {
        countryCode: "",
        localNumber: normalized.replace(/^\+/, ""),
      };
    }

    return {
      countryCode: `+${match[1]}`,
      localNumber: match[2],
    };
  };

  const parseDOB = (dobStr) => {
    if (!dobStr) return null;
    const parts = dobStr.includes("/") ? dobStr.split("/") : null;
    if (parts && parts.length === 3) {
      const [mm, dd, yyyy] = parts.map((p) => parseInt(p, 10));
      return new Date(yyyy, mm - 1, dd);
    }
    const asDate = new Date(dobStr);
    return isNaN(asDate) ? null : asDate;
  };

  const formatDOB = (d) => {
    if (!d) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Prefill from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        about: user.about || "",
        email: user.email || "",
        email_two: user.email2 || "",
        gender: user.gender || "",
      });
      setPhoneNumber(user.phoneNumber || "");
      setRecoveryPhoneNumber(user.phoneNumber2 || "");
      setEmailVerified(!!user.email_verified);
      setEmailTwoVerified(!!user.email_two_verified);
      setPhoneVerified(!!user.phone_verified);
      setPhoneTwoVerified(!!user.phone_two_verified);
      setProfileImage(user.profileUrl || Default_user_image);
      setDobDate(parseDOB(user.dob));
    }
  }, [user]);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!token) return;

      try {
        const { data } = await api.get("/api/v1/username", authHeaders(token));
        setUsernameInfo({
          username: data?.data?.username || "",
          canChange: data?.data?.can_change ?? true,
        });
      } catch (err) {
        console.error("Failed to fetch username:", err);
      }
    };

    fetchUsername();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePictureChange = async (payload) => {
    const file =
      payload instanceof File ? payload : payload?.target?.files?.[0];

    if (!file) return;

    if (!token) {
      showError("Your session has expired. Please sign in again.");
      return;
    }

    // optional: instant UI update (optimistic preview)
    const localPreviewUrl = URL.createObjectURL(file);
    setProfileImage(localPreviewUrl);

    const form = new FormData();
    form.append("profile_url", file);

    try {
      setUploading(true);

      const res = await api.post("/api/v1/profile/image/edit", form, {
        ...authHeaders(token),
        headers: {
          ...(authHeaders(token).headers || {}),
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 200) {
        showSuccess(res.data?.message || "Profile image updated!");
        login({ user: res.data.user, token });

        const urlFromServer = res.data?.user?.profileUrl || "";

        // ✅ cache-bust to force refresh even if server returns same URL
        const busted = urlFromServer
          ? `${urlFromServer}${
              urlFromServer.includes("?") ? "&" : "?"
            }t=${Date.now()}`
          : localPreviewUrl;

        setProfileImage(busted);
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to upload profile image.";
      showError(msg);

      // revert optimistic preview if you want:
      setProfileImage(user?.profileUrl || Default_user_image);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.firstName.trim()) return showError("First name is required");
    if (!formData.lastName.trim()) return showError("Last name is required");
    if (!formData.email.trim()) return showError("Email is required");
    if (!phoneNumber) return showError("Primary phone number is required");

    // ✅ split both phones into code + local
    const { countryCode, localNumber } = splitPhone(phoneNumber);
    const { countryCode: recCountryCode, localNumber: recLocalNumber } =
      splitPhone(recoveryPhoneNumber);

    try {
      setUpdating(true);
      const data = new FormData();

      data.append("first_name", formData.firstName);
      data.append("last_name", formData.lastName);
      data.append("about", formData.about || "");

      data.append("email", formData.email);

      // primary phone (even though UI is disabled, we still send the same value)
      data.append("phone", localNumber);
      data.append("country_code_one", countryCode);

      if (formData.email_two) {
        data.append("email_two", formData.email_two);
      }

      // ✅ only send recovery phone if present, and always with country_code_two
      if (recoveryPhoneNumber) {
        if (!recCountryCode) {
          setUpdating(false);
          return showError(
            "Please select a valid country code for recovery phone."
          );
        }

        data.append("phone_two", recLocalNumber);
        data.append("country_code_two", recCountryCode);
      }

      data.append("dob", formatDOB(dobDate) || "");
      data.append("gender", formData.gender || "");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/profile/edit`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 200) {
        showSuccess(res.data?.message || "Profile updated successfully!");
        login({ user: res.data.user, token });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      showError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const recoveryPhoneLocked = !!user?.phoneNumber2; // lock only if it exists

  return (
    <div className="tw:min-h-screen tw:bg-white tw:flex tw:flex-col tw:items-center tw:pb-24">
      {/* Top header (back + title) */}
      <div className="tw:bg-white tw:w-full tw:px-4 tw:pt-24 tw:pb-4">
        <div className="tw:max-w-3xl tw:mx-auto tw:flex tw:items-center tw:justify-between">
          <button
            style={{ borderRadius: 20 }}
            type="button"
            className="tw:inline-flex tw:items-center tw:justify-center tw:size-10 tw:bg-white tw:border tw:border-gray-200 tw:tw:hover:bg-gray-50 tw:transition"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="tw:w-5 tw:h-5 tw:text-gray-700" />
          </button>
          <span className="tw:text-lg tw:md:text-xl tw:font-semibold tw:text-gray-900">
            Edit Profile
          </span>
          <div className="tw:size-10" />
        </div>
      </div>

      {/* Main column */}
      <div className="tw:w-full tw:max-w-3xl tw:pt-10 tw:px-4 tw:space-y-5">
        <ProfileImageCard
          profileImage={profileImage}
          uploading={uploading}
          onPictureChange={handlePictureChange}
          displayName={
            `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
            user?.email
          }
        />

        <ProfileInfoCard
          formData={formData}
          onChange={handleChange}
          username={usernameInfo.username}
          canChangeUsername={usernameInfo.canChange}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          recoveryPhoneNumber={recoveryPhoneNumber}
          setRecoveryPhoneNumber={setRecoveryPhoneNumber}
          emailVerified={emailVerified}
          emailTwoVerified={emailTwoVerified}
          phoneVerified={phoneVerified}
          phoneTwoVerified={phoneTwoVerified}
          dobDate={dobDate}
          setDobDate={setDobDate}
          updating={updating}
          setUsernameOpen={setUsernameOpen}
          setPasswordOpen={setPasswordOpen}
          setVerifyOpen={setVerifyOpen}
          recoveryPhoneLocked={recoveryPhoneLocked}
        />
      </div>

      {/* Big purple CTA under the card, like your screenshot */}
      <div className="tw:w-full  tw:px-4 tw:mt-10 tw:max-w-[300px] tw:mx-auto">
        <button
          style={{
            borderRadius: 10,
          }}
          type="button"
          onClick={handleUpdateProfile}
          disabled={updating}
          className="tw:w-full tw:rounded-full tw:h-11 tw:text-sm tw:font-medium tw:text-white tw:bg-primary tw:hover:bg-primarySecond tw:transition tw:disabled:opacity-60"
        >
          {updating ? "Updating..." : "Update Information"}
        </button>
      </div>

      {/* Loader styles for avatar */}
      <style>{`
        .profile-loader-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.35);
        }
        .profile-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #e5e7eb;
          border-top-color: #050505;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <SetPasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
      <SetUsernameModal
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        currentUsername={usernameInfo.username}
        canChange={usernameInfo.canChange}
        onUsernameUpdated={(username) => {
          setUsernameInfo((prev) => ({ ...prev, username }));
          if (user) {
            setAuth({
              user: {
                ...user,
                username,
                user_name: username,
              },
            });
          }
        }}
      />
      {/* hook verifyOpen into your verify modal when ready */}
    </div>
  );
}

export default EditProfile;
