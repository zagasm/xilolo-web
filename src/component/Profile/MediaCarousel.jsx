import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y, Autoplay } from "swiper/modules";
import { Play } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";

export default function MediaCarousel({ items = [], alt = "" }) {
  const videoRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i !== active && !v.paused) v.pause();
    });
  }, [active]);

  if (!items.length) {
    return (
      <div className="tw:h-full tw:w-full tw:bg-inner" />
    );
  }

  return (
    <div className="tw:relative tw:h-full tw:min-h-[200px]">
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        // pagination={{ clickable: true }}
        // autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        onSlideChange={(s) => setActive(s.realIndex)}
        className="tw:h-full"
      >
        {items.map((m, i) => (
          <SwiperSlide key={i}>
            {m.type === "video" ? (
              <div className="tw:relative tw:h-full tw:w-full">
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  className="tw:h-full tw:w-full tw:object-cover"
                  poster={items.find((x) => x.type === "image")?.url}
                  controls
                />
                <div className="tw:pointer-events-none tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center">
                  <span className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:bg-black/40 tw:p-3">
                    <Play className="tw:size-6 tw:text-white" />
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={m.url}
                alt={alt}
                className="tw:h-full tw:w-full tw:object-cover"
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
