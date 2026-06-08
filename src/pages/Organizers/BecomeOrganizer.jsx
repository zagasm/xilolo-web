import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Step, StepLabel, Stepper, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../auth/AuthContext";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showPromise, showSuccess } from "../../component/ui/toast";
import OrganiserCountryStep from "./components/OrganiserCountryStep";
import OrganiserMethodChoiceStep from "./components/OrganiserMethodChoiceStep";
import OrganiserBankAccountStep from "./components/OrganiserBankAccountStep";
import OrganiserBvnStep from "./components/OrganiserBvnStep";
import OrganiserDiditStep from "./components/OrganiserDiditStep";
import OrganiserSidebarCard from "./components/OrganiserSidebarCard";
import {
  OrganiserDiditInfoDialog,
  OrganiserNameMismatchDialog,
  OrganiserProfilePhotoRequiredDialog,
  OrganiserProcessingDialog,
  OrganiserVerificationSuccessDialog,
} from "./components/OrganiserDialogs";
import {
  BANK_STEPPER_STEPS,
  COUNTRY_GEOLOOKUP_FALLBACK_API_URL,
  COUNTRY_GEOLOOKUP_API_URL,
  COUNTRIES_API_URL,
  DIDIT_RETRYABLE_STATUSES,
  detectCountryCodeFromBrowserLocale,
  extractCountryCodeFromGeoPayload,
  loadBanksFromCache,
  mapDiditStatusCopy,
  normalizeCountry,
  saveBanksToCache,
} from "./organiserVerificationUtils";
import { useDiditWebSdk } from "./hooks/useDiditWebSdk";
import { hasProfileImage } from "../../component/Organizers/organiser.utils";

const BecomeOrganiser = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const { startVerification: startDiditSdkVerification, destroyVerification } =
    useDiditWebSdk();

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [countryAutoDetected, setCountryAutoDetected] = useState(false);
  const [countryStepVisible, setCountryStepVisible] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const countryPrefillDismissedRef = useRef(false);
  const countryPrefillAttemptedRef = useRef(false);

  const [bankStep, setBankStep] = useState(0);
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [autoVerifyError, setAutoVerifyError] = useState(null);
  const [savingBank, setSavingBank] = useState(false);

  const [bvn, setBvn] = useState("");
  const [bvnLoading, setBvnLoading] = useState(false);
  const [bvnError, setBvnError] = useState(null);

  const [processingOpen, setProcessingOpen] = useState(false);
  const [verificationSuccessOpen, setVerificationSuccessOpen] = useState(false);
  const [nameMismatchOpen, setNameMismatchOpen] = useState(false);
  const [diditInfoOpen, setDiditInfoOpen] = useState(false);
  const [diditStarting, setDiditStarting] = useState(false);
  const [diditSessionState, setDiditSessionState] = useState(null);
  const [diditSessionLoading, setDiditSessionLoading] = useState(false);
  const [diditSessionError, setDiditSessionError] = useState(null);

  const profileName = useMemo(
    () =>
      user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    [user]
  );
  const profileImage = useMemo(
    () =>
      user?.profileUrl ||
      user?.profileImage ||
      user?.avatar ||
      user?.avatar_url ||
      user?.profile_photo_url ||
      user?.image ||
      null,
    [user]
  );
  const requiresProfilePhoto = !hasProfileImage(profileImage);

  const isNigeria = selectedCountry?.code === "NG";
  const diditStatus = diditSessionState?.status || null;
  const localDiditStatus = diditSessionState?.local_kyc_status || null;
  const canRetryDidit = DIDIT_RETRYABLE_STATUSES.includes(diditStatus);

  const syncDiditSessionState = async ({ showApprovedToast = false } = {}) => {
    if (!token) {
      throw new Error("You need to be logged in to complete DIDIT verification.");
    }

    const res = await api.post(
      "/api/v1/organiser/kyc/didit/session/refresh",
      {},
      authHeaders(token)
    );

    const data = res?.data?.data || null;
    setDiditSessionState(data);
    await refreshUser?.();

    if (showApprovedToast && data?.local_kyc_status === "verified") {
      showSuccess("Your organiser account is active.");
    }

    return data;
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const fetchCountries = async () => {
      setCountriesLoading(true);
      setCountriesError(null);

      try {
        const response = await fetch(COUNTRIES_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load countries right now.");
        }

        const payload = await response.json();
        const normalized = payload
          .map(normalizeCountry)
          .filter((item) => item.name && item.code)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (active) {
          setCountries(normalized);
        }
      } catch (error) {
        if (!active || error?.name === "AbortError") return;
        setCountriesError(
          error?.message || "Unable to load countries right now."
        );
      } finally {
        if (active) setCountriesLoading(false);
      }
    };

    fetchCountries();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (
      countriesLoading ||
      !countries.length ||
      selectedCountry ||
      countryPrefillDismissedRef.current ||
      countryPrefillAttemptedRef.current
    ) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    const preloadCountryFromGeo = async () => {
      countryPrefillAttemptedRef.current = true;

      const applyDetectedCountry = (countryCode) => {
        const normalizedCountryCode = String(countryCode || "")
          .trim()
          .toUpperCase();
        if (!normalizedCountryCode || !active) return false;

        const matchedCountry = countries.find(
          (country) => country.code === normalizedCountryCode
        );

        if (!matchedCountry) return false;

        setSelectedCountry(matchedCountry);
        setDetectedCountry(matchedCountry);
        setCountryAutoDetected(true);
        setCountryStepVisible(true);
        return true;
      };

      const fetchCountryCode = async (url) => {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to detect your country right now.");
        }

        const payload = await response.json();
        return extractCountryCodeFromGeoPayload(payload);
      };

      for (const lookupUrl of [
        COUNTRY_GEOLOOKUP_API_URL,
        COUNTRY_GEOLOOKUP_FALLBACK_API_URL,
      ]) {
        try {
          if (applyDetectedCountry(await fetchCountryCode(lookupUrl))) {
            return;
          }
        } catch (error) {
          if (!active || error?.name === "AbortError") return;
        }
      }

      applyDetectedCountry(detectCountryCodeFromBrowserLocale());
    };

    preloadCountryFromGeo();

    return () => {
      active = false;
      controller.abort();
    };
  }, [countries, countriesLoading, selectedCountry]);

  useEffect(() => {
    if (verificationMethod !== "bvn") return;

    const cached = loadBanksFromCache();
    if (cached) {
      setBanks(cached);
      return;
    }

    const fetchBanks = async () => {
      setBanksLoading(true);
      setBanksError(null);

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/banks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const list = res.data?.banks || [];
        setBanks(list);
        saveBanksToCache(list);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          "Unable to fetch banks at the moment.";
        setBanksError(message);
        showError(message);
      } finally {
        setBanksLoading(false);
      }
    };

    fetchBanks();
  }, [token, verificationMethod]);

  useEffect(() => {
    const canVerify =
      verificationMethod === "bvn" &&
      bankStep === 0 &&
      selectedBank &&
      accountNumber &&
      accountNumber.length === 10;

    if (!canVerify) {
      setVerifiedAccount(null);
      setAutoVerifyError(null);
      return;
    }

    let cancelled = false;

    const runVerify = async () => {
      setVerifyLoading(true);
      setAutoVerifyError(null);
      try {
        const promise = axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/banks/verify`,
          {
            bank_code: selectedBank.code,
            account_number: accountNumber,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        showPromise(promise, {
          loading: "Verifying bank details...",
          success: "Bank account verified",
          error: "Unable to verify bank account",
        });

        const res = await promise;
        if (cancelled) return;
        setVerifiedAccount(res.data?.data || null);
      } catch (error) {
        if (cancelled) return;
        const message =
          error?.response?.data?.message ||
          "We couldn't verify this account. Please check the details.";
        setVerifiedAccount(null);
        setAutoVerifyError(message);
        showError(message);
      } finally {
        if (!cancelled) setVerifyLoading(false);
      }
    };

    runVerify();

    return () => {
      cancelled = true;
    };
  }, [accountNumber, bankStep, selectedBank, token, verificationMethod]);

  useEffect(() => {
    if (verificationMethod !== "didit") return;

    let active = true;

    const fetchDiditSessionState = async () => {
      setDiditSessionLoading(true);
      setDiditSessionError(null);
      try {
        const res = await api.get(
          "/api/v1/organiser/kyc/didit/session",
          authHeaders(token)
        );
        if (!active) return;
        setDiditSessionState(res?.data?.data || null);
      } catch (error) {
        if (!active) return;
        const message =
          error?.response?.data?.message ||
          "Unable to load your DIDIT verification state right now.";
        setDiditSessionError(message);
      } finally {
        if (active) setDiditSessionLoading(false);
      }
    };

    fetchDiditSessionState();

    return () => {
      active = false;
    };
  }, [token, verificationMethod]);

  const resetVerificationSelection = () => {
    setVerificationMethod(null);
    setBankStep(0);
    setSelectedBank(null);
    setAccountNumber("");
    setVerifiedAccount(null);
    setAutoVerifyError(null);
    setBvn("");
    setBvnError(null);
    setDiditSessionError(null);
  };

  const handleCountryChange = (_, value) => {
    countryPrefillDismissedRef.current = true;
    setSelectedCountry(value);
    setCountryAutoDetected(
      Boolean(value && detectedCountry && value.code === detectedCountry.code)
    );
    resetVerificationSelection();
  };

  const handleChangeCountryRequest = () => {
    countryPrefillDismissedRef.current = true;
    setCountryStepVisible(true);
    resetVerificationSelection();
  };

  const handleCountryContinue = () => {
    if (!selectedCountry) {
      showError("Please select your country to continue.");
      return;
    }

    setCountryStepVisible(false);
  };

  const showOrganiserSuccess = async () => {
    await refreshUser?.();
    setProcessingOpen(false);
    setVerificationSuccessOpen(true);
  };

  const handleSaveBankAndContinue = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;
    if (!verifiedAccount) {
      showError("Please wait for your bank account to be verified.");
      return;
    }

    setSavingBank(true);
    try {
      const promise = axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/organiser/kyc/bank/save`,
        {
          bank_code: selectedBank.code,
          account_number: accountNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await showPromise(promise, {
        loading: "Saving bank details...",
        success: "Bank details saved",
        error: "Failed to save bank details",
      });

      setBankStep(1);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "We couldn't save your bank details. Please try again.";

      if (
        message.includes("Account name does not match the name on your profile")
      ) {
        setNameMismatchOpen(true);
        return;
      }

      showError(message);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSubmitBvn = async () => {
    if (!bvn || bvn.length < 11) return;

    setBvnLoading(true);
    setBvnError(null);

    try {
      const promise = axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/organiser/kyc/bvn`,
        { bvn },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await showPromise(promise, {
        loading: "Submitting BVN...",
        success: "BVN submitted",
        error: "Failed to submit BVN",
      });

      await refreshUser?.();
      const kycStatus = response?.data?.data?.kyc_status;

      if (kycStatus === "verified") {
        await showOrganiserSuccess();
        return;
      }

      await showOrganiserSuccess();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "We couldn't verify your BVN. Please confirm and try again.";
      setBvnError(message);
      showError(message);
    } finally {
      setBvnLoading(false);
    }
  };

  const handleStartDiditVerification = async () => {
    setDiditStarting(true);
    setDiditSessionError(null);

    try {
      const callbackUrl = `${window.location.origin}/kyc/didit/callback`;
      const payload = {
        callback_url: callbackUrl,
        callback_method: "both",
        language: "en",
      };

      if (canRetryDidit) {
        payload.force_new = true;
      }

      const res = await api.post(
        "/api/v1/organiser/kyc/didit/session",
        payload,
        authHeaders(token)
      );

      const data = res?.data?.data || null;
      setDiditSessionState(data);

      const verificationUrl = data?.session_url || data?.verification_url;
      if (!verificationUrl) {
        throw new Error("Verification URL was not returned by the server.");
      }

      setDiditInfoOpen(false);

      try {
        await startDiditSdkVerification({
          url: verificationUrl,
          onComplete: async (result) => {
            if (result?.type === "completed") {
              try {
                setDiditSessionLoading(true);
                const refreshed = await syncDiditSessionState({
                  showApprovedToast: true,
                });

                if (refreshed?.local_kyc_status === "verified") {
                  await showOrganiserSuccess();
                  return;
                }

                if (refreshed?.local_kyc_status === "failed") {
                  const message =
                    refreshed?.failure_reason ||
                    "DIDIT verification was not approved. Please start a new verification session and try again.";
                  setDiditSessionError(message);
                  showError(message);
                  return;
                }

                const message =
                  "Verification did not activate your organiser account yet. Please try refreshing or start a new verification session.";
                setDiditSessionError(message);
                showError(message);
              } catch (refreshError) {
                const message =
                  refreshError?.response?.data?.message ||
                  refreshError?.message ||
                  "Verification finished, but we could not refresh your DIDIT status yet.";
                setDiditSessionError(message);
                showError(message);
              } finally {
                setDiditSessionLoading(false);
              }
            }

            if (result?.type === "failed") {
              const message =
                result?.error?.message ||
                "DIDIT verification did not complete successfully.";
              setDiditSessionError(message);
              showError(message);
            }

            if (result?.type === "cancelled") {
              try {
                setDiditSessionLoading(true);
                const latestState = await api.get(
                  "/api/v1/organiser/kyc/didit/session",
                  authHeaders(token)
                );
                setDiditSessionState(latestState?.data?.data || data);
              } catch {
                setDiditSessionState(data);
              } finally {
                setDiditSessionLoading(false);
              }
            }
          },
          onStateChange: (state, sdkError) => {
            if (state === "error" && sdkError) {
              setDiditSessionError(sdkError);
            }
          },
        });
      } catch (sdkError) {
        if (!import.meta.env.PROD) {
          console.warn("Didit SDK launch failed, falling back to redirect.", sdkError);
        }
        window.location.assign(verificationUrl);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to start DIDIT verification right now.";
      setDiditSessionError(message);
      showError(message);
    } finally {
      setDiditStarting(false);
    }
  };

  useEffect(() => {
    return () => {
      destroyVerification();
    };
  }, [destroyVerification]);

  return (
    <div className="tw:min-h-screen tw:bg-linear-to-b tw:from-lightPurple/60 tw:via-white tw:to-white tw:pt-24 tw:md:pt-28 tw:px-4">
      <div className="tw:max-w-6xl tw:mx-auto tw:pb-10">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mb-4">
          <div>
            <span className="tw:block tw:text-[11px] tw:uppercase tw:font-medium tw:text-primary tw:tracking-[0.16em]">
              Xilolo · Organisers
            </span>
          </div>
          <div className="tw:hidden tw:md:flex tw:flex-col tw:items-end tw:text-right">
            <span className="tw:text-[11px] tw:text-gray-500">
              Logged in as
            </span>
            <span className="tw:text-xs tw:font-medium tw:text-gray-800">
              {profileName || user?.email || "Your account"}
            </span>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] tw:gap-6">
          <div className="tw:bg-[#ffffff] tw:rounded-3xl tw:px-4 tw:py-5 tw:md:px-6 tw:md:py-6 tw:shadow-[0_18px_45px_rgba(15,23,42,0.08)] tw:border tw:border-white/60">
            {verificationMethod === "bvn" && (
              <div className="tw:mb-5 tw:border-b tw:border-gray-100 tw:pb-4">
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                  <span className="tw:text-[11px] tw:text-gray-500 tw:font-medium">
                    BVN verification ·{" "}
                    <span className="tw:text-primary">
                      Step {bankStep + 1} of {BANK_STEPPER_STEPS.length}
                    </span>
                  </span>
                </div>
                <Stepper
                  activeStep={bankStep}
                  alternativeLabel={!isSmall}
                  orientation={isSmall ? "vertical" : "horizontal"}
                >
                  {BANK_STEPPER_STEPS.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </div>
            )}

            <div className="tw:mt-2">
              {countryStepVisible && (
                <OrganiserCountryStep
                  countries={countries}
                  countriesLoading={countriesLoading}
                  countriesError={countriesError}
                  selectedCountry={selectedCountry}
                  detectedCountry={detectedCountry}
                  countryAutoDetected={countryAutoDetected}
                  onCountryChange={handleCountryChange}
                  onContinue={handleCountryContinue}
                />
              )}

              {!countryStepVisible && selectedCountry && !verificationMethod && (
                <OrganiserMethodChoiceStep
                  selectedCountry={selectedCountry}
                  countryAutoDetected={countryAutoDetected}
                  isNigeria={isNigeria}
                  verificationMethod={verificationMethod}
                  onSelectBvn={() => {
                    setVerificationMethod("bvn");
                    setBankStep(0);
                  }}
                  onSelectDidit={() => setVerificationMethod("didit")}
                  onChangeCountry={handleChangeCountryRequest}
                />
              )}

              {verificationMethod === "bvn" && bankStep === 0 && (
                <OrganiserBankAccountStep
                  accountNumber={accountNumber}
                  selectedBank={selectedBank}
                  banks={banks}
                  banksLoading={banksLoading}
                  banksError={banksError}
                  verifyLoading={verifyLoading}
                  verifiedAccount={verifiedAccount}
                  autoVerifyError={autoVerifyError}
                  profileName={profileName}
                  savingBank={savingBank}
                  onAccountNumberChange={(e) =>
                    setAccountNumber(e.target.value.replace(/\D/g, ""))
                  }
                  onBankChange={(_, value) => setSelectedBank(value)}
                  onChangeMethod={resetVerificationSelection}
                  onContinue={handleSaveBankAndContinue}
                />
              )}

              {verificationMethod === "bvn" && bankStep === 1 && (
                <OrganiserBvnStep
                  bvn={bvn}
                  bvnError={bvnError}
                  bvnLoading={bvnLoading}
                  onBvnChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                  onBack={() => setBankStep(0)}
                  onSubmit={handleSubmitBvn}
                />
              )}

              {verificationMethod === "didit" && (
                <OrganiserDiditStep
                  selectedCountry={selectedCountry}
                  diditStatus={diditStatus}
                  localDiditStatus={localDiditStatus}
                  diditSessionLoading={diditSessionLoading}
                  diditSessionError={diditSessionError}
                  diditStatusCopy={mapDiditStatusCopy(diditStatus)}
                  canRetryDidit={canRetryDidit}
                  onChangeMethod={resetVerificationSelection}
                  onOpenDiditInfo={() => setDiditInfoOpen(true)}
                />
              )}
            </div>
          </div>

          <OrganiserSidebarCard />
        </div>
      </div>

      <OrganiserProcessingDialog open={processingOpen} />

      <OrganiserVerificationSuccessDialog
        open={verificationSuccessOpen}
        onCreateEvent={() => navigate("/event/select-event-type")}
        onViewProfile={() => navigate(`/profile/${user?.id}`)}
      />

      <OrganiserDiditInfoDialog
        open={diditInfoOpen}
        diditStarting={diditStarting}
        onClose={() => setDiditInfoOpen(false)}
        onContinue={handleStartDiditVerification}
      />

      <OrganiserNameMismatchDialog
        open={nameMismatchOpen}
        onClose={() => setNameMismatchOpen(false)}
        onEditProfile={() => {
          setNameMismatchOpen(false);
          navigate("/profile/edit-profile");
        }}
      />

      <OrganiserProfilePhotoRequiredDialog
        open={requiresProfilePhoto}
        onEditProfile={() => navigate("/profile/edit-profile")}
      />
    </div>
  );
};

export default BecomeOrganiser;
