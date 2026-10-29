import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import ImageCropper from "./ImageCropper";

/**
 * Cover picker.
 *
 * A banner, not a form field: 21:9 artwork with the actions sitting on the
 * image, so an organiser sees the cover the way it will appear on the card.
 * Empty state is a single quiet row you can click or drop a file onto — the old
 * full-width dashed box with an icon and a sentence looked like a wireframe.
 */
export default function CoverPicker({ cover, uploading, onPick, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(null);

  const openPicker = () => inputRef.current?.click();

  // Every cover goes through the 21:9 cropper: a portrait phone shot would
  // otherwise be centre-cropped by CSS with no say from the organiser.
  const accept = (file) => {
    if (!file) return;
    setPending(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer?.files?.[0]);
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <span className="tw:text-[13px] tw:font-medium tw:text-ink">Cover image</span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`tw:group tw:relative tw:w-full tw:overflow-hidden tw:rounded-card tw:border tw:border-solid tw:transition-colors ${
          dragging ? "tw:border-accent tw:bg-accent/10" : "tw:border-hairline tw:bg-inner"
        }`}
      >
        {cover?.url ? (
          <>
            <div className="tw:relative tw:aspect-[21/9] tw:w-full">
              <img src={cover.url} alt="Contest cover" className="tw:size-full tw:object-cover" />
              <div className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:bottom-0 tw:h-20 tw:bg-gradient-to-t tw:from-black/55 tw:to-transparent" />
            </div>

            <div className="tw:absolute tw:right-2.5 tw:top-2.5 tw:flex tw:items-center tw:gap-1.5">
              <button
                type="button"
                onClick={openPicker}
                className="tw:rounded-pill! tw:bg-paper-raised/95 tw:px-3 tw:py-1.5 tw:text-[12px] tw:font-semibold tw:text-ink tw:transition-colors tw:hover:bg-paper-raised"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                aria-label="Remove cover"
                className="tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-full! tw:bg-paper-raised/95 tw:text-ink tw:transition-colors tw:hover:bg-paper-raised"
              >
                <X className="tw:size-3.5" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-3.5 tw:py-3 tw:text-left tw:transition-colors tw:hover:bg-accent/5"
          >
            <span className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent/12 tw:text-accent-deep">
              {uploading ? (
                <Loader2 className="tw:size-[18px] tw:animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="tw:size-[18px]" aria-hidden="true" />
              )}
            </span>

            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink">
                {uploading ? "Uploading your cover…" : "Add a cover image"}
              </span>
              <span className="tw:block tw:text-[12px] tw:text-muted">
                Drag a file here, or tap to choose. JPG, PNG or WebP up to 5MB.
              </span>
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            accept(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="tw:hidden"
        />
      </div>

      <ImageCropper
        file={pending}
        ratio={21 / 9}
        open={Boolean(pending)}
        title="Crop your cover"
        onCancel={() => setPending(null)}
        onCrop={(blob) => {
          setPending(null);
          onPick(blob);
        }}
      />

    </div>
  );
}
