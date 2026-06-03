import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsVideoPlayer({ src, poster, title = "Video" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return undefined;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    video.src = src;
    return undefined;
  }, [src]);

  if (!src) {
    return (
      <div className="tw:flex tw:aspect-video tw:w-full tw:items-center tw:justify-center tw:bg-slate-950 tw:text-sm tw:text-white">
        Video is not available.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster || undefined}
      className="tw:aspect-video tw:w-full tw:bg-black"
      aria-label={title}
    />
  );
}
