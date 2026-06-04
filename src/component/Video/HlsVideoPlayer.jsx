import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";

export default function HlsVideoPlayer({ src, poster, title = "Video" }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("auto");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setLevels([]);
    setSelectedLevel("auto");
    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return undefined;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const nextLevels = hls.levels
          .map((level, index) => ({
            index,
            height: level.height || 0,
            bitrate: level.bitrate || 0,
            label: level.height
              ? `${level.height}p`
              : level.bitrate
                ? `${Math.round(level.bitrate / 1000)} kbps`
                : `Quality ${index + 1}`,
          }))
          .filter((level) => level.label);

        setLevels(nextLevels);
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.currentLevel = -1;
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    video.src = src;
    return undefined;
  }, [src]);

  const sortedLevels = useMemo(
    () =>
      [...levels].sort((a, b) => {
        if (b.height !== a.height) return b.height - a.height;
        return b.bitrate - a.bitrate;
      }),
    [levels]
  );

  const handleQualityChange = (event) => {
    const value = event.target.value;
    setSelectedLevel(value);

    if (!hlsRef.current) return;

    hlsRef.current.currentLevel = value === "auto" ? -1 : Number(value);
  };

  if (!src) {
    return (
      <div className="tw:flex tw:aspect-video tw:w-full tw:items-center tw:justify-center tw:bg-slate-950 tw:text-sm tw:text-white">
        Video is not available.
      </div>
    );
  }

  return (
    <div className="tw:relative tw:bg-black">
      {sortedLevels.length > 1 && (
        <label className="tw:absolute tw:right-3 tw:top-3 tw:z-10 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-black/70 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:backdrop-blur">
          <span>Quality</span>
          <select
            value={selectedLevel}
            onChange={handleQualityChange}
            className="tw:rounded tw:border tw:border-white/20 tw:bg-black tw:px-2 tw:py-1 tw:text-xs tw:text-white tw:outline-none"
          >
            <option value="auto">Auto</option>
            {sortedLevels.map((level) => (
              <option key={level.index} value={level.index}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster || undefined}
        className="tw:aspect-video tw:w-full tw:bg-black"
        aria-label={title}
      />
    </div>
  );
}
