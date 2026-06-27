import React, { useState, useEffect, useRef } from "react";
import AuthContainer from "../assets/auth_container";
import { motion } from "framer-motion";
import axios from "axios";
import { ChangePassword } from "../ChangePassword";
import { showSuccess, showError } from "../../../component/ui/toast";

export function CodeVerification({ verificationData }) {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [forgetPasswordAccess, setforgetPasswordAccess] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '']);
  const [isCodeComplete, setIsCodeComplete] = useState(false);
  const [isEditingInput, setIsEditingInput] = useState(false);
  const [editedInput, setEditedInput] = useState(verificationData?.input || '');
  const [ResetPasswordVerificationData,setResetPasswordVerificationData]  = useState();
  const [inputError, setInputError] = useState('');
  const inputsRef = useRef([]);
  const inputRef = useRef(null);

  // Destructure verificationData with defaults
  const {
    input = '',
    isEmail = true,
    code: initialCode = 0,
    expiresAt = ''
  } = verificationData || {};

  // Mask the input (email or phone)
  const maskInput = (value) => {
    if (!value) return '';
    
    if (isEmail) {
      const [localPart, domain] = value.split('@');
      if (!localPart || !domain) return value;
      const firstChar = localPart[0];
      const maskedLocal = firstChar + '*****';
      return `${maskedLocal}@${domain}`;
    } else {
      // Mask phone number (show last 4 digits)
      if (value.length <= 4) return value;
      return `*******${value.slice(-4)}`;
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
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
        damping: 10
      }
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(5, 5, 5, 0.18)"
    },
    tap: { scale: 0.98 }
  };

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
    if (input) {
      setEditedInput(input);
    }
  }, [input]);

  useEffect(() => {
    if (isEditingInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingInput]);

  useEffect(() => {
    const complete = code.every(digit => digit !== '');
    setIsCodeComplete(complete);
  }, [code]);

  const validateInput = (value) => {
    if (!value.trim()) {
      setInputError(`${isEmail ? 'Email' : 'Phone number'} is required`);
      return false;
    }

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInputError('Please enter a valid email address');
      return false;
    }

    setInputError('');
    return true;
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === '') {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value !== '' && index < 4) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').slice(0, 5);
    if (/^\d+$/.test(pasteData)) {
      const newCode = [...code];
      for (let i = 0; i < pasteData.length; i++) {
        if (i < 5) {
          newCode[i] = pasteData[i];
        }
      }
      setCode(newCode);
    }
  };

  const handleEditInputClick = () => {
    setIsEditingInput(true);
  };

  const handleInputChange = (e) => {
    setEditedInput(e.target.value);
    if (inputError) setInputError('');
  };

  const handleInputBlur = () => {
    if (!validateInput(editedInput)) {
      setEditedInput(input);
    }
    setIsEditingInput(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (validateInput(editedInput)) {
        setIsEditingInput(false);
      } else {
        setEditedInput(input);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateInput(editedInput)) return;
    const verificationCode = code.join('');
    if (verificationCode.length !== 5) {
      setErrors({ server: "Please enter a complete 5-digit code" });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const formData = new URLSearchParams();
      formData.append("code", verificationCode);
      formData.append("input", editedInput);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/password/verify-code`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const data = response.data;
      if (data.reset_token != null || data.reset_token != undefined) {
        showSuccess(data.message || "Verification successful!");
        setResetPasswordVerificationData({
            input: data.input,
            message:data.message,
            reset_token:data.reset_token
        });
        setforgetPasswordAccess(true);
      }else{
          throw new Error(data.message || "Verification failed");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred during verification";
      showError(errorMessage);
      setErrors({ server: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

   if(forgetPasswordAccess){
         return <ChangePassword ResetPasswordVerificationData={ResetPasswordVerificationData} />
   }
  return (
    <AuthContainer 
      footer={false} 
      header={false}
      privacy={false}
      haveAccount={true}
    >
      <motion.form 
        autoComplete="off" 
        className="tw:px-3 tw:pb-2"
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        onSubmit={handleSubmit}
      >
        <div className="tw:rounded-[28px] tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:text-center tw:shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="tw:mx-auto tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-xl tw:font-bold tw:text-white">
            OTP
          </div>
          <span className="tw:block tw:mt-5 tw:text-xl tw:font-bold tw:text-slate-950">
            5-digit verification
          </span>
          <span className="tw:block tw:mt-2 tw:text-sm tw:leading-6 tw:text-slate-500">
            Enter the code sent to your {isEmail ? "email" : "phone"}{" "}
            <span className="tw:font-semibold tw:text-primary">{maskInput(editedInput)}</span>
          </span>
        </div>

        {errors.server && (
          <motion.div 
            className="tw:mt-4 tw:rounded-2xl tw:border tw:border-red-200 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-sm tw:text-red-700"
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
          >
            {errors.server}
          </motion.div>
        )}
        
        <motion.div variants={inputVariants} className="tw:mt-5">
          <div className="tw:grid tw:grid-cols-5 tw:gap-2 tw:sm:gap-3">
            {[0, 1, 2, 3, 4].map((index) => (
              <input 
                key={index} 
                type="text" 
                maxLength="1" 
                value={code[index]} 
                onChange={(e) => handleChange(e, index)} 
                onKeyDown={(e) => handleKeyDown(e, index)} 
                onPaste={handlePaste} 
                ref={(el) => (inputsRef.current[index] = el)} 
                className="tw:h-14 tw:w-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:text-center tw:text-xl tw:font-bold tw:text-slate-950 tw:outline-none tw:transition focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/10"
                inputMode="numeric" 
                pattern="[0-9]*" 
              />
            ))}
          </div>
        </motion.div>
        
        {/* <motion.div variants={inputVariants} className="form-group">
          {isEditingInput ? (
            <>
              <input 
                type={isEmail ? "email" : "tel"} 
                value={editedInput} 
                onChange={handleInputChange} 
                onBlur={handleInputBlur} 
                onKeyDown={handleInputKeyDown} 
                ref={inputRef} 
                className="form-control edit-source-input" 
              />
              {inputError && <div className="invalid-feedback d-block">{inputError}</div>}
            </>
          ) : (
            <span className="edit_code_display" onClick={handleEditInputClick}>
              {maskInput(editedInput) || `No ${isEmail ? 'email' : 'phone'} provided`} <i className="feather-edit ml-2"></i>
            </span>
          )}
        </motion.div> */}
        
        {/* <motion.div variants={inputVariants} className="text-center mt-3">
          <button 
            type="button" 
            className="resend-btn" 
            onClick={handleResendCode} 
            disabled={isLoading}
          >
            Resend
          </button>
        </motion.div> */}
        
        <motion.div variants={inputVariants} className="tw:mt-5">
          <motion.button 
            style={{ borderRadius: 28, fontSize: 12}}
            className="tw:flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
            type="submit" 
            disabled={!isCodeComplete || isLoading} 
            variants={buttonVariants} 
            whileHover={isCodeComplete ? "hover" : {}} 
            whileTap={isCodeComplete ? "tap" : {}}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </AuthContainer>
  );
}
