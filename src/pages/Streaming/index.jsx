import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { ToastHost, showError } from "../../component/ui/toast";
import { useAuth } from "../../pages/auth/AuthContext";
import InfoRow from "./InfoRow";
import RecommendedSettings from "./RecommendedSettings";
import SideBarNav from "../pageAssets/SideBarNav";
import './streaming.css'


export default function StreamingPage() {
  const [params] = useSearchParams();
  const eventId = params.get("eventId");
  const navigate = useNavigate();
  const { state } = useLocation();
  const { token } = useAuth();

  const [payload, setPayload] = useState(state?.channel || null);
  const [loading, setLoading] = useState(!state?.channel);

  useEffect(() => {
    let mounted = true;
    async function fetchIfNeeded() {
      if (payload || !eventId) return;
      setLoading(true);
      try {
        const res = await api.get(
          `/api/v1/events/${eventId}/view`,
          authHeaders(token)
        );
        if (mounted) setPayload(res.data?.data || res.data);
      } catch {
        showError("Couldn't load streaming details.");
      } finally {
        mounted = false;
        setLoading(false);
      }
    }
    fetchIfNeeded();
  }, [eventId, token]); // eslint-disable-line

  if (loading) {
    return (
      <div className="tw:min-h-[70vh] tw:flex tw:items-center tw:justify-center">
        <ToastHost />
        <div className="tw:text-gray-500">Loading…</div>
      </div>
    );
  }

  const event = payload?.currentEvent || payload;
  const instr = event?.obs_instructions || {};
  const srtUrl = event?.srt_ingest_url || "";
  const port = String(instr?.srt_port ?? event?.srt_port ?? "");

//   console.log(event);

  return (
    <div className="">
      <ToastHost />
      <div className="row tw:md:gap-6 tw:lg:gap-6 tw:px-3 tw:md:px-6 tw:py-4">
        <div className="col-md-1 col-lg-2 col-xl-2 tw:md:hidden tw:lg:block">
          <SideBarNav />
        </div>

        <div className="streaming col-md-12 col-lg-10 col-xl-10 tw:lg:ml-30 col-lg-9 tw:space-y-4 tw:md:space-y-6 tw:py-24">
          <h1 className="tw:text-xl tw:font-semibold tw:mb-3">
            Channel Streaming Details
          </h1>

          <div className="tw:rounded-3xl tw:border tw:border-lightPurple tw:bg-lightPurple/40 tw:p-4 tw:space-y-4">
            <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
              <InfoRow
                label="Event"
                value={event?.title}
                copyLabel="Event title copied"
              />
              <InfoRow
                label="SRT URL"
                value={srtUrl}
                copyLabel="SRT URL copied"
              />
              <InfoRow label="Port" value={port} copyLabel="Port copied" />
            </div>

            <div>
              <div className="tw:font-semibold tw:mb-2">
                Setup Instructions:
              </div>
              <ul className=" tw:list-none tw:-ml-6 tw:pl-5 tw:space-y-1 tw:text-sm tw:text-gray-800">
                {(instr?.instructions || []).map((line, i) => (
                  <li key={i}>{line || " "}</li>
                ))}
              </ul>
            </div>

            <RecommendedSettings settings={instr?.recommended_settings} />
          </div>

          <div className="tw:mt-6 tw:flex tw:justify-center">
            <button
            style={{
                borderRadius: 20
            }}
              onClick={() => navigate(-1)}
              className=" tw:w-full tw:px-5 tw:py-3 tw:rounded-2xl! tw:bg-primary tw:hover:bg-primary/80 tw:duration-300 tw:transition-all text-white tw:font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
