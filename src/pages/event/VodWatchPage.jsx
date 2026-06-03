import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Lock, RefreshCcw } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import HlsVideoPlayer from "../../component/Video/HlsVideoPlayer";

function pickVideoUrl(vod = {}) {
  return vod.hls_url || vod.playback_url || vod.embed_url || "";
}

export default function VodWatchPage() {
  const { eventId } = useParams();
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", event: null, vod: null });

  const loadVod = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await api.get(`/api/v1/events/${eventId}/vod/watch`, authHeaders(token));
      const data = res?.data?.data || {};
      setState({
        loading: false,
        error: "",
        event: data.event || null,
        vod: data.vod || null,
      });
    } catch (error) {
      setState({
        loading: false,
        error:
          error?.response?.data?.message ||
          "Unable to open this video. Confirm that you have a valid ticket.",
        event: null,
        vod: error?.response?.data?.data?.vod || null,
      });
    }
  };

  useEffect(() => {
    loadVod();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const videoUrl = useMemo(() => pickVideoUrl(state.vod), [state.vod]);

  if (state.loading) {
    return (
      <main className="tw:flex tw:min-h-[70vh] tw:items-center tw:justify-center">
        <Loader2 className="tw:h-8 tw:w-8 tw:animate-spin tw:text-primary" />
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="tw:mx-auto tw:flex tw:min-h-[70vh] tw:max-w-2xl tw:flex-col tw:items-center tw:justify-center tw:px-4 tw:text-center">
        <div className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-50 tw:text-amber-700">
          <Lock className="tw:h-6 tw:w-6" />
        </div>
        <h1 className="tw:mt-5 tw:text-2xl tw:font-semibold tw:text-slate-950">Video unavailable</h1>
        <p className="tw:mt-2 tw:text-sm tw:text-slate-600">{state.error}</p>
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

  return (
    <main className="tw:min-h-screen tw:bg-slate-950 tw:text-white">
      <div className="tw:mx-auto tw:max-w-6xl tw:px-4 tw:py-6 tw:sm:px-6 tw:lg:px-8">
        <Link to={`/event/view/${eventId}`} className="tw:text-sm tw:font-medium tw:text-white/70 hover:tw:text-white">
          Back to event
        </Link>

        <section className="tw:mt-5 tw:overflow-hidden tw:rounded-[8px] tw:border tw:border-white/10 tw:bg-black">
          {videoUrl?.includes("iframe.mediadelivery.net") && !state.vod?.hls_url ? (
            <iframe
              src={videoUrl}
              title={state.vod?.title || "VOD player"}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              className="tw:aspect-video tw:w-full"
            />
          ) : (
            <HlsVideoPlayer src={videoUrl} poster={state.vod?.thumbnail_url} title={state.vod?.title} />
          )}
        </section>

        <div className="tw:mt-5">
          <h1 className="tw:text-2xl tw:font-semibold">{state.vod?.title || "Event video"}</h1>
          <p className="tw:mt-2 tw:text-sm tw:text-white/60">Access is tied to your Xilolo ticket.</p>
        </div>
      </div>
    </main>
  );
}
