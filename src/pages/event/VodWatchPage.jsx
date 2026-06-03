import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Lock, RefreshCcw } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import HlsVideoPlayer from "../../component/Video/HlsVideoPlayer";

function pickVideoUrl(vod) {
  const safeVod = vod || {};

  return (
    safeVod.hls_url ||
    safeVod.playback_url ||
    safeVod.embed_url ||
    safeVod.url ||
    ""
  );
}

function normalizeVodWatchPayload(payload = {}) {
  const data = payload?.data || payload || {};

  const event =
    data.event ||
    data.currentEvent ||
    data.data?.event ||
    data.data?.currentEvent ||
    null;

  const vod =
    data.vod ||
    data.data?.vod ||
    event?.vod ||
    null;

  return { event, vod };
}

export default function VodWatchPage() {
  const { eventId } = useParams();
  const { token } = useAuth();

  const [state, setState] = useState({
    loading: true,
    error: "",
    event: null,
    vod: null,
  });

  const loadVod = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const res = await api.get(
        `/api/v1/events/${eventId}/vod/watch`,
        authHeaders(token)
      );

      const { event, vod } = normalizeVodWatchPayload(res?.data);

      if (!vod) {
        setState({
          loading: false,
          error: "Video data is missing from the server response.",
          event,
          vod: null,
        });
        return;
      }

      setState({
        loading: false,
        error: "",
        event,
        vod,
      });
    } catch (error) {
      const errorData = error?.response?.data;
      const { event, vod } = normalizeVodWatchPayload(errorData);

      setState({
        loading: false,
        error:
          errorData?.message ||
          "Unable to open this video. Confirm that you have a valid ticket.",
        event,
        vod,
      });
    }
  }, [eventId, token]);

  useEffect(() => {
    if (!eventId) return;
    loadVod();
  }, [eventId, loadVod]);

  const videoUrl = useMemo(() => pickVideoUrl(state.vod), [state.vod]);

  if (state.loading) {
    return (
      <main className="tw:flex tw:min-h-[70vh] tw:items-center tw:justify-center">
        <Loader2 className="tw:h-8 tw:w-8 tw:animate-spin tw:text-primary" />
      </main>
    );
  }

  if (state.error || !state.vod || !videoUrl) {
    return (
      <main className="tw:mx-auto tw:flex tw:min-h-[70vh] tw:max-w-2xl tw:flex-col tw:items-center tw:justify-center tw:px-4 tw:text-center">
        <div className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-50 tw:text-amber-700">
          <Lock className="tw:h-6 tw:w-6" />
        </div>

        <span className="tw:mt-5 tw:block tw:text-2xl tw:font-semibold tw:text-slate-950">
          Video unavailable
        </span>

        <span className="tw:mt-2 tw:block tw:text-sm tw:text-slate-600">
          {state.error || "This video does not have a playable URL yet."}
        </span>

        <div className="tw:mt-6 tw:flex tw:flex-wrap tw:justify-center tw:gap-3">
          <button
            type="button"
            onClick={loadVod}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-white"
          >
            <RefreshCcw className="tw:h-4 tw:w-4" />
            Retry
          </button>

          <Link
            to={`/event/view/${eventId}`}
            className="tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-slate-200 tw:px-5 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-slate-700"
          >
            Back to event
          </Link>
        </div>
      </main>
    );
  }

  const shouldUseIframe =
    videoUrl.includes("iframe.mediadelivery.net") && !state.vod?.hls_url;

  return (
    <div className="tw:min-h-screen tw:bg-slate-950 tw:text-white">
      <div className="tw:mx-auto tw:max-w-6xl tw:px-4 tw:py-6 tw:sm:px-6 tw:lg:px-8">
        <Link
          to={`/event/view/${eventId}`}
          className="tw:text-sm tw:font-medium tw:text-white/70 hover:tw:text-white"
        >
          Back to event
        </Link>

        <section className="tw:mt-5 tw:overflow-hidden tw:rounded-[8px] tw:border tw:border-white/10 tw:bg-black">
          {shouldUseIframe ? (
            <iframe
              src={videoUrl}
              title={state.vod?.title || "VOD player"}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              className="tw:aspect-video tw:w-full"
            />
          ) : (
            <HlsVideoPlayer
              src={videoUrl}
              poster={state.vod?.thumbnail_url}
              title={state.vod?.title || "Event video"}
            />
          )}
        </section>

        <div className="tw:mt-5">
          <span className="tw:block tw:text-2xl tw:font-semibold">
            {state.vod?.title || state.event?.title || "Event video"}
          </span>

          <span className="tw:mt-2 tw:block tw:text-sm tw:text-white/60">
            Access is tied to your Xilolo ticket.
          </span>
        </div>
      </div>
    </div>
  );
}