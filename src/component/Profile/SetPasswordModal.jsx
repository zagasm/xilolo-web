import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../../pages/auth/AuthContext";
import {
  ToastHost,
  showPromise,
  showSuccess,
  showError,
} from "../../component/ui/toast";

export default function SetPasswordModal({ open, onClose }) {
  const { token, setAuth, logout, } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  /** derived validity */
  const isValid = useMemo(() => {
    const lenOk = formData.newPassword?.length >= 8;
    const matchOk = formData.newPassword === formData.confirmPassword;
    const allFilled =
      formData.currentPassword &&
      formData.newPassword &&
      formData.confirmPassword;
    return (
      allFilled &&
      lenOk &&
      matchOk &&
      !errors.newPassword &&
      !errors.confirmPassword
    );
  }, [formData, errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword" || name === "confirmPassword") {
      validatePasswords(
        name === "newPassword" ? value : formData.newPassword,
        name === "confirmPassword" ? value : formData.confirmPassword
      );
    }
  };

  const validatePasswords = (newPass, confirmPass) => {
    const next = { ...errors };

    if (newPass && newPass.length < 8) {
      next.newPassword = "Password must be at least 8 characters";
    } else {
      next.newPassword = "";
    }

    if (confirmPass && newPass !== confirmPass) {
      next.confirmPassword = "Passwords do not match";
    } else {
      next.confirmPassword = "";
    }

    setErrors(next);
  };

  const toggle = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!isValid || isLoading) return;

    setIsLoading(true);

    const data = new FormData();
    data.append("current_password", formData.currentPassword);
    data.append("password", formData.newPassword);
    data.append("password_confirmation", formData.confirmPassword);

    const req = api.post(
      `${import.meta.env.VITE_API_URL}/v1/user/password/change`,
      data,
      authHeaders(token)
    );

    try {
      const resp = await showPromise(req, {
        loading: "Updating password…",
        success: "Password updated successfully.",
        error: "Failed to update password",
      });

      const newToken = resp?.data?.token || null;
      const userPayload = resp?.data?.user?.info ?? resp?.data?.user ?? null;
      // logout();
      localStorage.setItem('token', newToken);
      if (newToken) {
        setAuth({ token: newToken, user: userPayload });
      } else if (userPayload) {
        setAuth({ user: userPayload });
      }

      // Reset & close
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to change password";
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Host the toast UI once in your layout root. If not already mounted there, you can keep this here. */}
      <ToastHost />

      <Transition show={open} as={Fragment} appear>
        <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:ease-out tw:duration-200"
            enterFrom="tw:opacity-0"
            enterTo="tw:opacity-100"
            leave="tw:transition tw:ease-in tw:duration-150"
            leaveFrom="tw:opacity-100"
            leaveTo="tw:opacity-0"
          >
            <div className="tw:fixed tw:inset-0 tw:bg-black/40" />
          </Transition.Child>

          {/* Panel wrapper (center) */}
          <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
            <div className="tw:flex tw:min-h-full tw:items-center tw:sm:items-center tw:justify-center tw:p-4">
              <Transition.Child
                as={Fragment}
                enter="tw:transition tw:ease-out tw:duration-200"
                enterFrom="tw:opacity-0 tw:translate-y-2 tw:sm:translate-y-0 tw:sm:scale-95"
                enterTo="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
                leave="tw:transition tw:ease-in tw:duration-150"
                leaveFrom="tw:opacity-100 tw:sm:scale-100"
                leaveTo="tw:opacity-0 tw:translate-y-2 tw:sm:translate-y-0 tw:sm:scale-95"
              >
                <Dialog.Panel className="tw:w-full tw:max-w-lg tw:rounded-2xl tw:bg-white tw:shadow-2xl tw:border tw:border-gray-100 tw:p-4 tw:sm:p-6">
                  {/* Header */}
                  <span className="tw:text-lg tw:sm:text-xl tw:font-semibold tw:text-gray-900">
                    Set Password
                  </span>
                  <p className="tw:mt-1 tw:text-sm tw:text-gray-500">
                    Keep your account secure by choosing a strong password.
                  </p>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="tw:mt-4 tw:sm:mt-6">
                    {/* Current Password */}
                    <div className="tw:mb-4">
                      <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1">
                        Current Password
                      </label>
                      <div className="tw:relative">
                        <input
                          type={show.current ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          placeholder="Enter current password"
                          className="tw:w-full tw:h-11 tw:rounded-xl tw:border tw:border-gray-200 tw:focus:border-primary tw:focus:ring-2 tw:focus:ring-primary/20 tw:outline-none tw:px-3 tw:pr-10"
                          required
                        />
                        <button
                          type="button"
                          aria-label={
                            show.current ? "Hide password" : "Show password"
                          }
                          onClick={() => toggle("current")}
                          className="tw:absolute tw:right-3 tw:top-[38%] -tw:translate-y-1/2 tw:text-gray-500 tw:hover:text-gray-700"
                        >
                          {show.current ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="tw:mb-4">
                      <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1">
                        New Password
                      </label>
                      <div className="tw:relative">
                        <input
                          type={show.new ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password (min 8 characters)"
                          minLength={8}
                          className={`tw:w-full tw:h-11 tw:rounded-xl tw:border tw:outline-none tw:px-3 tw:pr-10 ${
                            errors.newPassword
                              ? "tw:border-red-300 tw:focus:border-red-400 tw:focus:ring-red-100"
                              : "tw:border-gray-200 tw:focus:border-primary tw:focus:ring-2 tw:focus:ring-primary/20"
                          }`}
                          required
                        />
                        <button
                          type="button"
                          aria-label={
                            show.new ? "Hide password" : "Show password"
                          }
                          onClick={() => toggle("new")}
                          className="tw:absolute tw:right-3 tw:top-[38%] -tw:translate-y-1/2 tw:text-gray-500 tw:hover:text-gray-700"
                        >
                          {show.new ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {!!errors.newPassword && (
                        <p className="tw:mt-1 tw:text-xs tw:text-red-600">
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="tw:mb-1">
                      <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1">
                        Confirm New Password
                      </label>
                      <div className="tw:relative">
                        <input
                          type={show.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          minLength={8}
                          className={`tw:w-full tw:h-11 tw:rounded-xl tw:border tw:outline-none tw:px-3 tw:pr-10 ${
                            errors.confirmPassword
                              ? "tw:border-red-300 tw:focus:border-red-400 tw:focus:ring-red-100"
                              : "tw:border-gray-200 tw:focus:border-primary tw:focus:ring-2 tw:focus:ring-primary/20"
                          }`}
                          required
                        />
                        <button
                          type="button"
                          aria-label={
                            show.confirm ? "Hide password" : "Show password"
                          }
                          onClick={() => toggle("confirm")}
                          className="tw:absolute tw:right-3 tw:top-[38%] -tw:translate-y-1/2 tw:text-gray-500 tw:hover:text-gray-700"
                        >
                          {show.confirm ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {!!errors.confirmPassword && (
                        <p className="tw:mt-1 tw:text-xs tw:text-red-600">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="tw:mt-5 tw:sm:mt-6 tw:flex tw:items-center tw:justify-end tw:gap-2">
                      <button
                        style={{
                          borderRadius: 20,
                        }}
                        type="button"
                        onClick={onClose}
                        className="tw:inline-flex tw:h-11 tw:px-4 tw:items-center tw:justify-center tw:rounded-xl tw:bg-gray-100 tw:hover:bg-gray-200 tw:text-gray-800 tw:font-medium tw:transition"
                      >
                        Cancel
                      </button>
                      <button
                        style={{
                          borderRadius: 20,
                        }}
                        type="submit"
                        disabled={!isValid || isLoading}
                        className="tw:inline-flex tw:h-11 tw:px-5 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary tw:hover:bg-primary/90 tw:text-white tw:font-medium tw:transition tw:disabled:opacity-60"
                      >
                        {isLoading ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
