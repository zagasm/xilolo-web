import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { showError } from "../../../../../component/ui/toast";

function percentToPixelCrop(percentCrop, width, height) {
  if (!percentCrop) return null;

  return {
    unit: "px",
    x: Math.round((percentCrop.x / 100) * width),
    y: Math.round((percentCrop.y / 100) * height),
    width: Math.round((percentCrop.width / 100) * width),
    height: Math.round((percentCrop.height / 100) * height),
  };
}

function fullImageCrop() {
  return {
    unit: "%",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };
}

export default function PosterMediaFields({
  posterImages,
  setPosterImages,
  existingPoster,
  setExistingPoster,
  error,
}) {
  const uploadInputRef = useRef(null);
  const cropImageRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const pendingCropQueueRef = useRef([]);
  const previewCacheRef = useRef(new Map());

  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [cropDialog, setCropDialog] = useState({
    open: false,
    file: null,
    url: "",
    index: null,
  });

  useEffect(() => {
    return () => {
      previewCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!posterImages?.length) {
      setThumbnailIndex(0);
      return;
    }

    if (thumbnailIndex >= posterImages.length) {
      setThumbnailIndex(0);
    }
  }, [posterImages, thumbnailIndex]);

  useEffect(() => {
    if (
      !completedCrop ||
      !previewCanvasRef.current ||
      !cropImageRef.current ||
      !cropDialog.open
    ) {
      return;
    }

    const image = cropImageRef.current;
    const canvas = previewCanvasRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, [completedCrop, cropDialog.open]);

  const getPosterPreviewUrl = (file) => {
    if (!file) return "";

    const cache = previewCacheRef.current;
    if (cache.has(file)) {
      return cache.get(file);
    }

    const url = URL.createObjectURL(file);
    cache.set(file, url);
    return url;
  };

  const revokePosterPreview = (file) => {
    if (!file) return;

    const cache = previewCacheRef.current;
    const url = cache.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      cache.delete(file);
    }
  };

  const featuredMedia = useMemo(() => {
    if (posterImages[thumbnailIndex]) {
      return {
        source: "new",
        type: "image",
        url: getPosterPreviewUrl(posterImages[thumbnailIndex]),
        label: "Selected thumbnail",
        name: posterImages[thumbnailIndex].name,
      };
    }

    if (existingPoster?.length) {
      return {
        source: "existing",
        type: existingPoster[0].type,
        url: existingPoster[0].url,
        label: "Existing media",
        name: existingPoster[0].type,
      };
    }

    return null;
  }, [existingPoster, posterImages, thumbnailIndex]);

  const getCroppedBlob = (image, pixelCrop) =>
    new Promise((resolve, reject) => {
      if (!image || !pixelCrop?.width || !pixelCrop?.height) {
        reject(new Error("No crop data"));
        return;
      }

      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = Math.round(pixelCrop.width * scaleX);
      canvas.height = Math.round(pixelCrop.height * scaleY);

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to crop image")),
        "image/jpeg",
        0.92
      );
    });

  const closeCropDialog = () => {
    if (cropDialog.url) {
      URL.revokeObjectURL(cropDialog.url);
    }

    setCropDialog({ open: false, file: null, url: "", index: null });
    setCompletedCrop(null);
  };

  const startCropSession = (file, index = null) => {
    if (!file) return;

    if (!/^image\//.test(file.type) || file.size > 10 * 1024 * 1024) {
      showError("Only images under 10MB are supported.");
      return;
    }

    if (cropDialog.url) {
      URL.revokeObjectURL(cropDialog.url);
    }

    setCropDialog({
      open: true,
      file,
      url: URL.createObjectURL(file),
      index,
    });
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const commitCrop = async () => {
    if (!cropDialog.file || !completedCrop?.width || !completedCrop?.height) {
      return;
    }

    try {
      const blob = await getCroppedBlob(cropImageRef.current, completedCrop);
      const fileName = cropDialog.file.name || `poster-${Date.now()}.jpg`;
      const cropped = new File([blob], fileName, {
        type: cropDialog.file.type || "image/jpeg",
      });

      if (cropDialog.index !== null) {
        setPosterImages((prev) =>
          prev.map((item, itemIndex) => {
            if (itemIndex === cropDialog.index) {
              revokePosterPreview(item);
              return cropped;
            }
            return item;
          })
        );
      } else {
        setPosterImages((prev) => {
          const next = [...prev, cropped];
          if (next.length === 1) {
            setThumbnailIndex(0);
          }
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      showError("Failed to crop the image, try again.");
    } finally {
      closeCropDialog();
      const nextImage = pendingCropQueueRef.current.shift();
      if (nextImage) {
        startCropSession(nextImage);
      }
    }
  };

  const removePosterImageAt = (index) =>
    setPosterImages((prev) => {
      const target = prev[index];
      revokePosterPreview(target);

      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      setThumbnailIndex((current) => {
        if (!next.length) return 0;
        if (current === index) return 0;
        if (index < current) return current - 1;
        return current;
      });

      return next;
    });

  const handleMixedFiles = (files) => {
    const incomingFiles = Array.from(files || []);
    if (!incomingFiles.length) return;

    const images = incomingFiles.filter(
      (file) => /^image\//.test(file.type) && file.size <= 10 * 1024 * 1024
    );
    const rejectedFiles = incomingFiles.length - images.length;

    if (rejectedFiles > 0) {
      showError("Only image files under 10MB are supported for event posters.");
    }

    if (images.length) {
      pendingCropQueueRef.current = [
        ...pendingCropQueueRef.current,
        ...images,
      ];

      if (!cropDialog.open) {
        const firstImage = pendingCropQueueRef.current.shift();
        if (firstImage) {
          startCropSession(firstImage);
        }
      }
    }
  };

  return (
    <>
      <section className="tw:rounded-[28px] tw:border tw:border-gray-100 tw:bg-[#ffffff] tw:p-4 tw:sm:p-5">
        <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-1">
          <span className="tw:text-base tw:font-semibold tw:text-slate-900">
            Upload a thumbnail 
          </span>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingUpload(true);
          }}
          onDragLeave={() => setIsDraggingUpload(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingUpload(false);
            handleMixedFiles(event.dataTransfer.files);
          }}
          onClick={() => uploadInputRef.current?.click()}
          className={`tw:cursor-pointer tw:rounded-3xl tw:border tw:border-dashed tw:p-5 tw:text-center tw:transition ${
            isDraggingUpload
              ? "tw:border-primary tw:bg-[#ffffff]"
              : "tw:border-gray-300 tw:bg-[#ffffff] tw:hover:border-primary"
          }`}
        >
          <div className="tw:text-sm tw:font-medium tw:text-primary">
            Drag and drop photos, or click to choose files
          </div>
          <div className="tw:mt-1 tw:text-xs tw:text-slate-500">
            Images up to 10MB. Videos are not supported for event posters.
          </div>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="tw:hidden"
            onChange={(event) => {
              handleMixedFiles(event.target.files);
              event.target.value = null;
            }}
          />
        </div>

        <div className="tw:mt-5 tw:space-y-5">
          {featuredMedia && (
            <div className="tw:overflow-hidden tw:rounded-[24px] tw:border tw:border-gray-100 tw:bg-white">
              <div className="tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
                <div>
                  <span className="tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                    Preview
                  </span>
                  <span className="tw:text-xs tw:text-slate-500">
                    {featuredMedia.label}
                  </span>
                </div>

                {posterImages[thumbnailIndex] && (
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        startCropSession(
                          posterImages[thumbnailIndex],
                          thumbnailIndex
                        )
                      }
                      className="tw:rounded-full tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:text-xs tw:hover:bg-gray-50"
                      style={{ borderRadius: 16 }}
                    >
                      Recrop
                    </button>
                    <button
                      type="button"
                      onClick={() => removePosterImageAt(thumbnailIndex)}
                      className="tw:rounded-full tw:border tw:border-red-200 tw:px-3 tw:py-1.5 tw:text-xs tw:text-red-600 tw:hover:bg-red-50"
                      style={{ borderRadius: 16 }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="tw:flex tw:min-h-[280px] tw:items-center tw:justify-center tw:bg-[#f4f4f8]">
                <img
                  src={featuredMedia.url}
                  alt={featuredMedia.name || "Selected poster"}
                  className="tw:h-[320px] tw:w-full tw:object-cover"
                />
              </div>
            </div>
          )}

          <div className="tw:space-y-3">
            {existingPoster?.length > 0 && (
              <div className="tw:rounded-[24px] tw:border tw:border-gray-100 tw:bg-white tw:p-4">
                <span className="tw:mb-3 tw:block tw:text-sm tw:font-medium tw:text-slate-900">
                  Existing media
                </span>
                <div className="tw:flex tw:flex-wrap tw:gap-3">
                  {existingPoster.map((media, index) => (
                    <div
                      key={media.id || index}
                      className="tw:relative tw:h-24 tw:w-24 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-black/5"
                    >
                      <img
                        src={media.url}
                        alt="Existing poster"
                        className="tw:h-full tw:w-full tw:object-cover"
                      />

                      <span className="tw:absolute tw:left-2 tw:top-2 tw:rounded-full tw:bg-black/60 tw:px-2 tw:py-0.5 tw:text-[10px] tw:uppercase tw:text-white">
                        {media.type}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExistingPoster((prev) =>
                            prev.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="tw:absolute tw:right-1 tw:top-1 tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:border tw:bg-white"
                        aria-label="Remove media"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error ? <p className="tw:mt-3 tw:text-xs tw:text-red-500">{error}</p> : null}
      </section>

      {cropDialog.open && (
        <div className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-center tw:justify-center tw:bg-black/60 tw:p-4 tw:backdrop-blur-sm">
          <div className="tw:flex tw:max-h-[80vh] tw:w-full tw:max-w-3xl tw:flex-col tw:gap-4 tw:overflow-hidden tw:rounded-[34px] tw:border tw:border-gray-100 tw:bg-white tw:p-6 tw:shadow-2xl">
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
              <div>
                <span className="tw:block tw:text-xl tw:font-bold tw:text-gray-900">
                  Crop poster
                </span>
                <span className="tw:text-sm tw:text-gray-500">
                  The crop starts at the full image size. Adjust only if you want
                  a tighter frame.
                </span>
              </div>
              <button
                type="button"
                className="tw:text-gray-400 tw:hover:text-gray-600"
                onClick={closeCropDialog}
              >
                Cancel
              </button>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:overflow-y-auto tw:pr-1 tw:lg:grid-cols-[1.2fr_0.8fr]">
              <div className="tw:rounded-3xl tw:border tw:border-dashed tw:border-gray-200 tw:bg-gray-50 tw:p-3">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => {
                    setCrop(percentCrop);

                    const image = cropImageRef.current;
                    if (image) {
                      setCompletedCrop(
                        percentToPixelCrop(percentCrop, image.width, image.height)
                      );
                    }
                  }}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  keepSelection
                  className="tw:w-full tw:max-h-[420px]"
                >
                  <img
                    ref={cropImageRef}
                    alt="Crop poster"
                    src={cropDialog.url}
                    className="tw:block tw:max-h-[260px] tw:w-full tw:object-contain tw:sm:max-h-[360px] tw:lg:max-h-[520px]"
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      const defaultCrop = fullImageCrop();
                      setCrop(defaultCrop);
                      setCompletedCrop(
                        percentToPixelCrop(defaultCrop, image.width, image.height)
                      );
                    }}
                  />
                </ReactCrop>
              </div>

              <div className="tw:hidden tw:flex-col tw:gap-3 tw:rounded-3xl tw:border tw:border-gray-100 tw:p-4 tw:lg:flex">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-2 tw:w-8 tw:rounded-full tw:bg-linear-to-r tw:from-primary tw:to-primarySecond" />
                  <span className="tw:text-sm tw:text-gray-500">Preview</span>
                </div>
                <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-gray-100 tw:p-4">
                  <canvas
                    ref={previewCanvasRef}
                    className="tw:max-h-[260px] tw:w-full"
                  />
                </div>
                <span className="tw:block tw:text-xs tw:text-gray-500">
                  Save to replace the current image. You can reopen the crop tool
                  whenever you want.
                </span>
              </div>
            </div>

            <div className="tw:sticky tw:bottom-0 tw:flex tw:items-center tw:justify-end tw:gap-3 tw:border-t tw:border-gray-100 tw:bg-white tw:pt-3">
              <button
                type="button"
                onClick={closeCropDialog}
                className="tw:rounded-xl tw:border tw:border-gray-200 tw:px-4 tw:py-2 tw:text-sm tw:text-gray-700 tw:hover:bg-gray-50"
                style={{ borderRadius: 16, fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitCrop}
                disabled={!completedCrop?.width || !completedCrop?.height}
                className="tw:rounded-xl tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                style={{ borderRadius: 16, fontSize: 12 }}
              >
                Save poster
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
