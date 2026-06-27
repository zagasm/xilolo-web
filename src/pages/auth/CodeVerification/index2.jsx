import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthContainer from "../assets/auth_container";
import { ChangePassword } from "../ChangePassword";
import axios from "axios";
import { showToast } from "../../../component/ToastAlert";
export function CodeVerification({ email='tomilayoyusluv@gmail.com' }) {
  const CODE_LENGTH = 6;
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [resetcode, setResetCode] = useState(0);
  const [resetemail, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef([]);

  // Mask email
  const maskEmail = (email) => {
    const [username, domain] = email.split("@");
    if (username.length <= 2) return email;
    const visiblePart = username.slice(0, 2);
    const maskedPart = "*".repeat(username.length - 2);
    return `${visiblePart}${maskedPart}@${domain}`;
  };

  // Handle input change
  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (/^\d?$/.test(val)) {
      const newCode = [...code];
      newCode[idx] = val;
      setCode(newCode);
      if (val && idx < CODE_LENGTH - 1) {
        inputsRef.current[idx + 1].focus();
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1].focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1].focus();
    } else if (e.key === "ArrowRight" && idx < CODE_LENGTH - 1) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const verifyCode = async () => {
    const joinedCode = code.join("");
    if (joinedCode.length < CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const formPayload = new FormData();
      formPayload.append("email", email);
      formPayload.append("reset_key", joinedCode);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/verify_reset_code.php`,
        formPayload,
        {
          withCredentials: true,
        }
      );
      // 874352
      const data = response.data;
      if (data.status === "success") {
        setResetCode(data.data.reset_code);
        setEmail(data.data.email);
        setSuccess(true);
        setTimeout(() => setIsVerified(true), 1000);
      } else {
        setError(data.message || "Incorrect verification code. Please try again.");
      }

    } catch (err) {

      // if (err.response) {
        // Backend responded with an error
        const status = err.response.status;
        const message =
          err.response.data?.message || "An error occurred. Please try again.";

        if (status === 401) {
          setError(message || "Invalid or expired verification code.");
        } else {
          setError(message);
        }
      // } else {
      //   // No response received
      //   setError("Network error. Please check your internet connection.");
      // }

      setIsVerifying(false);
    }
    finally {
      setIsVerifying(false);
    }
  };


  return (
    <>
      {!isVerified ? (
        <AuthContainer title="Verification code" description="We've sent a 6-digit code to">
          <p className="text-center" style={{ color: "#050505", fontSize: "15px", marginTop: "-20px", fontFamily: "Inter" }}>
            {maskEmail(email)}
          </p>

          <form autoComplete="off" className="pr-3 pl-3" onSubmit={(e) => e.preventDefault()}>
            <div className="code_container row m-4 justify-content-center">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  className="code col card m-1 text-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    fontSize: "24px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="text-danger text-center mb-3" style={{ fontSize: "14px" }}>
                <i className="fa fa-exclamation-circle mr-1"></i> {error}
              </div>
            )}

            {success && (
              <div className="text-success text-center mb-3" style={{ fontSize: "14px" }}>
                <i className="fa fa-check-circle mr-1"></i> Code verified successfully! Redirecting...
              </div>
            )}

            <button
              type="button"
              className="btn submit_button btn-block"
              style={{ color: "white" }}
              onClick={verifyCode}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <span className="fas fa-sign-in-alt mr-3"></span> Verify Code
                </>
              )}
            </button>

            <div className="text-center mt-3 border-botto pb-1 mb-1">
              <p className="small text-muted">
                Didn't receive the code?{" "}
                <Link className="font-weight-bold" to="/auth/signup">
                  Create account
                </Link>
              </p>
            </div>

            <div className="py-3 text-center auth-footer">
              <span className="text-info" style={{ fontSize: "13px" }}>
                <i className="fa fa-exclamation-circle"></i> Check your spam folder if you don't see the email
              </span>
            </div>
          </form>
        </AuthContainer>
      ) : (
        <ChangePassword email={resetemail} resetcode={resetcode} />
      )}
    </>
  );
}
