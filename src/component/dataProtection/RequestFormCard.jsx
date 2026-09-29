import React, { useState } from "react";
import { api } from "../../lib/apiClient";
import { showPromise, showError } from "../../component/ui/toast";

export default function RequestFormCard() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showError("Enter a valid email address.");
      return;
    }
    const promise = (async () => {
      setSubmitting(true);
      try {
        const res = await api.post("/privacy/data-export", { email });
        return res?.data?.message || "We’ve started your data export.";
      } finally {
        setSubmitting(false);
      }
    })();

    showPromise(promise, {
      loading: "Submitting your request…",
      success:
        "Request received. We’ll email you a secure download link when ready.",
      error: "Could not submit request. Please try again.",
    });
  };

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-2xl tw:p-5 tw:mb-12 tw:bg-lightPurple/35">
      <span className="tw:text-lg tw:sm:text-2xl tw:font-semibold">
        Submit Your Data Request
      </span>
      <p className="tw:text-gray-600 tw:mt-2">
        Enter your email and we’ll compile an export from all Xilolo modules
        (Live, Events, Creators, Wallet, chat) and send a secure download link.
      </p>

      <form
        className="tw:mt-5 tw:flex tw:flex-col tw:sm:flex-row tw:gap-3"
        onSubmit={onSubmit}
      >
        <input
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tw:flex-1 tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:h-12 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary"
        />
        <button
          style={{
            borderRadius: 20,
          }}
          disabled={submitting}
          className="tw:h-12 tw:px-5 tw:rounded-xl tw:bg-primary tw:text-white tw:font-medium tw:transition tw:hover:opacity-90 tw:disabled:opacity-60"
        >
          {submitting ? "Requesting…" : "Request Account Information"}
        </button>
      </form>
    </div>
  );
}
