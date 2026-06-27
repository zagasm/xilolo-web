import React from "react";
import { Toaster, toast } from "react-hot-toast";

export function ToastHost() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: "Geist, sans-serif",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        },
        success: { iconTheme: { primary: "#050505", secondary: "#fff" } },
      }}
    />
  );
}

/** Helpers */
export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);

/** Promise wrapper: show loading/success/error */
export function showPromise(promise, { loading, success, error }) {
  return toast.promise(promise, {
    loading: loading || "Please wait…",
    success: success || "Done!",
    error: error || "Something went wrong",
  });
}
