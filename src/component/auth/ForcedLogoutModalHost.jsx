import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToForcedLogout, emitForcedLogout } from "../../lib/authSessionSignals";
import {
  connectSessionRealtime,
  disconnectSessionRealtime,
} from "../../lib/sessionRealtime";
import { useAuth } from "../../pages/auth/AuthContext";

export default function ForcedLogoutModalHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "You have been logged out because you have logged in on another device."
  );
  const isHandlingRef = useRef(false);

  const disconnectRealtime = useCallback(() => {
    disconnectSessionRealtime();
  }, []);

  const handleForcedLogout = useCallback(
    (payload = {}) => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      setMessage(
        payload?.message ||
        "You have been logged out because you have logged in on another device."
      );
      setOpen(true);
      disconnectRealtime();
      queryClient.clear();
      logout();

      if (location.pathname !== "/auth/signin") {
        navigate("/auth/signin", { replace: true });
      }
    },
    [disconnectRealtime, location.pathname, logout, navigate, queryClient]
  );

  useEffect(() => {
    const unsubscribe = subscribeToForcedLogout(handleForcedLogout);
    return unsubscribe;
  }, [handleForcedLogout]);

  useEffect(() => {
    if (!token || !user?.id) {
      disconnectRealtime();
      return;
    }

    const echo = connectSessionRealtime({
      apiUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "",
      token,
      userId: user.id,
      reverbKey: import.meta.env.VITE_REVERB_APP_KEY,
      reverbHost: import.meta.env.VITE_REVERB_HOST,
      reverbPort: import.meta.env.VITE_REVERB_PORT,
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
      onRevoked: (payload = {}) => {
        const locationText = payload?.login?.location || "Unknown location";
        const message =
          payload?.message ||
          `You have been logged out because your account just signed in from ${locationText}.`;

        emitForcedLogout({
          reason: payload?.reason || "another_device",
          message,
          login: {
            ...(payload?.login || {}),
            location: locationText,
          },
        });
      },
    });

    if (!echo) {
      return;
    }

    return () => {
      echo.disconnect();
    };
  }, [disconnectRealtime, token, user?.id]);

  useEffect(() => {
    if (!token || !user) {
      disconnectRealtime();
      isHandlingRef.current = false;
      return;
    }

    const handleStorage = (event) => {
      if (event.key !== "token") return;
      if (!token) return;

      if (!event.newValue || event.newValue !== token) {
      emitForcedLogout({
        reason: "another_device",
        message:
          "You have been logged out because you have logged in on another device.",
      });
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [disconnectRealtime, token, user]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="tw:relative tw:z-[1000]"
        onClose={() => { }}
      >
        <Transition.Child
          as={Fragment}
          enter="tw:transition-opacity tw:duration-300"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition-opacity tw:duration-200"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-slate-950/55 tw:backdrop-blur-sm" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:p-4 sm:tw:p-6">
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-300"
            enterFrom="tw:opacity-0 tw:scale-95 tw:translate-y-3"
            enterTo="tw:opacity-100 tw:scale-100 tw:translate-y-0"
            leave="tw:transition tw:duration-200"
            leaveFrom="tw:opacity-100 tw:scale-100 tw:translate-y-0"
            leaveTo="tw:opacity-0 tw:scale-95 tw:translate-y-3"
          >
            <Dialog.Panel className="tw:relative tw:w-full tw:max-w-md tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-white/60 tw:bg-white/95 tw:shadow-[0_20px_70px_rgba(15,23,42,0.25)] tw:ring-1 tw:ring-slate-200/60">
              <div className="tw:absolute tw:inset-x-0 tw:top-0 tw:h-24 tw:bg-gradient-to-b tw:from-rose-50 tw:to-transparent" />

              <div className="tw:relative tw:p-6 sm:tw:p-7">
                <div className="tw:mx-auto tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-rose-100 tw:ring-8 tw:ring-rose-50">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="tw:h-6 tw:w-6 tw:text-rose-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25a3.75 3.75 0 10-7.5 0V9m-.75 0h9a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0116.5 18h-9A1.5 1.5 0 016 16.5v-6A1.5 1.5 0 017.5 9z"
                    />
                  </svg>
                </div>

                <div className="tw:mt-5 tw:text-center">
                  <span className="tw:block tw:text-[1.35rem] tw:font-semibold tw:tracking-tight tw:text-slate-900">
                    Logged out on this device
                  </span>

                  <span className="tw:block tw:mt-2 tw:text-sm tw:leading-6 tw:text-slate-600">
                    {message}
                  </span>

                  <div className="tw:mt-4 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-slate-100 tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-slate-600">
                    <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-rose-500" />
                    For your security, this session is no longer active
                  </div>
                </div>

                <div className="tw:mt-6 tw:space-y-3">
                  <button
                  style={{
                    borderRadius: "9999px",
                    fontSize: 12
                  }}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/auth/signin", { replace: true });
                    }}
                    className="tw:inline-flex tw:h-12 tw:w-full tw:items-center tw:justify-center tw:rounded-2xl tw:bg-slate-950 tw:px-4 tw:text-sm tw:font-semibold tw:text-white tw:shadow-lg tw:shadow-slate-900/15 tw:transition tw:hover:bg-slate-800 active:tw:scale-[0.99]"
                  >
                    Continue to sign in
                  </button>

                  <span className="tw:block tw:mt-3 tw:text-center tw:text-xs tw:leading-5 tw:text-slate-500">
                    You may need to sign in again to continue using your account.
                  </span>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
