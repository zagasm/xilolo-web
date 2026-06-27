import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEO from "../../component/SEO";
import { api } from "../../lib/apiClient";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    message: "We are confirming your payment.",
    eventId: "",
  });

  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");
  const paymentReference = reference || trxref || "";

  useEffect(() => {
    if (!paymentReference) {
      setState({
        status: "error",
        message: "No payment reference found in the URL.",
        eventId: "",
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await api.get("/api/payments/callback", {
          params: { reference: paymentReference },
        });

        if (cancelled) return;

        const payload = response?.data || {};
        const eventId = payload?.event_id || payload?.payment?.event_id || "";

        setState({
          status: "success",
          message:
            payload?.message ||
            "Payment confirmed successfully. Redirecting you now.",
          eventId,
        });

        window.setTimeout(() => {
          if (eventId) {
            navigate(`/event/view/${eventId}`, { replace: true });
            return;
          }

          navigate("/tickets", { replace: true });
        }, 1800);
      } catch (error) {
        if (cancelled) return;

        setState({
          status: "error",
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Unable to verify this payment right now.",
          eventId: "",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, navigate, paymentReference]);

  const handleContinue = () => {
    if (state.eventId) {
      navigate(`/event/view/${state.eventId}`, { replace: true });
      return;
    }

    navigate("/tickets", { replace: true });
  };

  const handleRetry = () => {
    setState({
      status: "loading",
      message: "Retrying payment verification.",
      eventId: "",
    });
    setAttempt((current) => current + 1);
  };

  return (
    <>
      <SEO
        title={
          state.status === "error" ? "Payment Verification" : "Payment Success"
        }
        description="Your Xilolo payment update."
      />

      <div className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:bg-gray-50 tw:px-4 tw:py-10 tw:text-black">
        <div className="tw:w-full tw:max-w-md tw:rounded-xl tw:bg-white tw:p-8 tw:text-center tw:shadow-lg">
          {state.status === "loading" ? (
            <>
              <div className="tw:mx-auto tw:h-14 tw:w-14 tw:animate-spin tw:rounded-full tw:border-4 tw:border-primary/20 tw:border-t-primary" />
              <h1 className="tw:mt-6 tw:text-3xl tw:font-extrabold tw:text-gray-900">
                Verifying payment
              </h1>
            </>
          ) : state.status === "success" ? (
            <>
              <div className="tw:text-green-600 tw:mb-6 tw:flex tw:flex-col tw:items-center">
                <img
                  className="tw:w-32 tw:mb-4"
                  src="/images/success.png"
                  alt=""
                />
                <h1 className="tw:text-3xl tw:font-extrabold tw:text-gray-900">
                  Payment Successful!
                </h1>
              </div>
            </>
          ) : (
            <>
              <div className="tw:text-red-600 tw:mb-6 tw:flex tw:flex-col tw:items-center">
                <span className="tw:text-7xl">!</span>
                <h1 className="tw:text-3xl tw:font-bold tw:text-gray-900">
                  Verification needed
                </h1>
              </div>
            </>
          )}

          <p className="tw:mb-4 tw:px-4 tw:text-gray-700">{state.message}</p>

          {paymentReference ? (
            <div className="tw:mb-8 tw:break-all tw:rounded-lg tw:bg-gray-100 tw:p-3">
              <span className="tw:mb-1 tw:block tw:text-sm tw:font-medium tw:text-gray-500">
                Transaction Reference:
              </span>
              <code className="tw:text-base tw:font-semibold tw:text-gray-800">
                {paymentReference}
              </code>
            </div>
          ) : null}

          {state.status === "error" ? (
            <button
              onClick={handleRetry}
              style={{ borderRadius: 20 }}
              className="tw:w-full tw:bg-linear-to-br tw:from-primary tw:to-primarySecond tw:px-4 tw:py-3 tw:font-semibold tw:text-white tw:transition tw:duration-200 tw:hover:bg-primarySecond"
            >
              Retry verification
            </button>
          ) : (
            <button
              onClick={handleContinue}
              style={{ borderRadius: 20 }}
              className="tw:w-full tw:bg-linear-to-br tw:from-primary tw:to-primarySecond tw:px-4 tw:py-3 tw:font-semibold tw:text-white tw:transition tw:duration-200 tw:hover:bg-primarySecond"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </>
  );
}
