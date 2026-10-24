import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal } from "../../../component/ui";

/**
 * Square-or-banner cropper.
 *
 * A cover is 21:9 and a contestant photo is 1:1, and neither should be decided
 * by whatever aspect ratio came off someone's phone. The crop happens here, in
 * the browser, and only the cropped result is uploaded — the server never has to
 * do image surgery and never stores the offcuts.
 *
 * Same code path for both: pass a `ratio` and it works.
 */
export default function ImageCropper({ file, ratio = 1, open, onCancel, onCrop, title = "Crop image" }) {
  const [src, setSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const dragRef = useRef(null);
  const boxRef = useRef(null);

  const viewportW = 320;
  const viewportH = Math.round(viewportW / ratio);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const imageRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const baseScale = useCallback(() => {
    if (!natural.w || !natural.h) return 1;
    return Math.max(viewportW / natural.w, viewportH / natural.h);
  }, [natural, viewportH]);

  const clampOffset = useCallback(
    (next, zoomLevel) => {
      if (!natural.w || !natural.h) return next;
      const scale = baseScale() * zoomLevel;
      const drawnW = natural.w * scale;
      const drawnH = natural.h * scale;
      const maxX = Math.max(0, (drawnW - viewportW) / 2);
      const maxY = Math.max(0, (drawnH - viewportH) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [baseScale, natural, viewportH]
  );

  const onPointerDown = (event) => {
    dragRef.current = { x: event.clientX, y: event.clientY, origin: offset };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setOffset(clampOffset({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }, zoom));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const confirm = async () => {
    const img = imageRef.current;
    if (!img || !natural.w) return;

    setBusy(true);

    try {
      const scale = baseScale() * zoom;
      const drawnW = natural.w * scale;
      const drawnH = natural.h * scale;

      // Where the viewport sits on the drawn image, in source pixels.
      const left = (drawnW - viewportW) / 2 - offset.x;
      const top = (drawnH - viewportH) / 2 - offset.y;

      const sx = Math.max(0, left / scale);
      const sy = Math.max(0, top / scale);
      const sw = Math.min(natural.w - sx, viewportW / scale);
      const sh = Math.min(natural.h - sy, viewportH / scale);

      const outW = ratio > 1 ? 1400 : 900;
      const outH = Math.round(outW / ratio);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (blob) onCrop(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="tw:relative tw:mx-auto tw:overflow-hidden tw:rounded-card tw:bg-ink tw:touch-none"
          style={{ width: viewportW, height: viewportH, cursor: "grab" }}
        >
          {src ? (
            <img
              ref={(node) => {
                imageRef.current = node;
                if (node && node.complete && !natural.w) {
                  setNatural({ w: node.naturalWidth, h: node.naturalHeight });
                }
              }}
              src={src}
              alt=""
              onLoad={(event) =>
                setNatural({
                  w: event.currentTarget.naturalWidth,
                  h: event.currentTarget.naturalHeight,
                })
              }
              draggable={false}
              className="tw:absolute tw:left-1/2 tw:top-1/2 tw:select-none"
              style={{
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                width: natural.w ? natural.w * baseScale() : "auto",
                height: natural.h ? natural.h * baseScale() : "auto",
              }}
            />
          ) : null}

          {/* rule-of-thirds guides: they make the drag feel like a real cropper */}
          <div className="tw:pointer-events-none tw:absolute tw:inset-0">
            <div className="tw:absolute tw:left-1/3 tw:top-0 tw:h-full tw:w-px tw:bg-white/20" />
            <div className="tw:absolute tw:left-2/3 tw:top-0 tw:h-full tw:w-px tw:bg-white/20" />
            <div className="tw:absolute tw:left-0 tw:top-1/3 tw:h-px tw:w-full tw:bg-white/20" />
            <div className="tw:absolute tw:left-0 tw:top-2/3 tw:h-px tw:w-full tw:bg-white/20" />
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-3">
          <span className="tw:text-[12px] tw:text-muted">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => {
              const next = Number(event.target.value);
              setZoom(next);
              setOffset((prev) => clampOffset(prev, next));
            }}
            className="tw:flex-1"
            aria-label="Zoom"
          />
        </div>

        <span className="tw:text-[12px] tw:text-muted">
          Drag to reposition. Only the visible area is uploaded.
        </span>

        <div className="tw:flex tw:gap-2">
          <Button variant="ghost" onClick={onCancel} className="tw:flex-1">
            Cancel
          </Button>
          <Button onClick={confirm} loading={busy} className="tw:flex-1">
            Use this crop
          </Button>
        </div>
      </div>
    </Modal>
  );
}
