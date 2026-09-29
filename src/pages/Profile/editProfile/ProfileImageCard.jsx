import React, { useMemo, useRef, useState, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function getInitials(nameOrEmail = "") {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Default centered square (but crop is still FREE after that)
function centerDefaultSquareCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 70 }, // initial size
      1, // square just for the default selection
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function cropToFile(
  imageEl,
  pixelCrop,
  originalFileName = "profile.jpg"
) {
  if (!imageEl || !pixelCrop?.width || !pixelCrop?.height) return null;

  const canvas = document.createElement("canvas");
  const scaleX = imageEl.naturalWidth / imageEl.width;
  const scaleY = imageEl.naturalHeight / imageEl.height;

  canvas.width = Math.round(pixelCrop.width * scaleX);
  canvas.height = Math.round(pixelCrop.height * scaleY);

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    imageEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", 0.92)
  );
  if (!blob) return null;

  const safeName = originalFileName?.replace(/\.[^/.]+$/, "") || "profile";
  return new File([blob], `${safeName}.jpg`, { type: "image/jpeg" });
}

export default function ProfileImageCard({
  profileImage,
  uploading,
  onPictureChange, // expects (file: File)
  displayName,
}) {
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const fileInputRef = useRef(null);
  const cropImgRef = useRef(null);

  // modal state: "none" | "preview" | "crop"
  const [modal, setModal] = useState("none");

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(""); // object URL for the chosen file

  const [crop, setCrop] = useState(); // percent crop
  const [completedCrop, setCompletedCrop] = useState(null); // pixel crop

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (selectedUrl && selectedUrl.startsWith("blob:"))
        URL.revokeObjectURL(selectedUrl);
    };
  }, [selectedUrl]);

  const openPreview = () => setModal("preview");

  const closeAll = () => {
    setModal("none");
    setSelectedFile(null);
    if (selectedUrl && selectedUrl.startsWith("blob:"))
      URL.revokeObjectURL(selectedUrl);
    setSelectedUrl("");
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const pickFile = () => fileInputRef.current?.click();

  const onFileChosen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = null;
    if (!f) return;

    if (!/^image\//.test(f.type)) return;
    if (f.size > 10 * 1024 * 1024) return;

    // cleanup previous
    if (selectedUrl && selectedUrl.startsWith("blob:"))
      URL.revokeObjectURL(selectedUrl);

    setSelectedFile(f);
    setSelectedUrl(URL.createObjectURL(f));
    setCrop(undefined);
    setCompletedCrop(null);
    setModal("crop");
  };

  const saveCropped = async () => {
    if (!selectedFile || !completedCrop) return;

    const croppedFile = await cropToFile(
      cropImgRef.current,
      completedCrop,
      selectedFile.name
    );

    if (!croppedFile) return;

    onPictureChange?.(croppedFile);
    closeAll();
  };

  const backToPreview = () => {
    // keep selected file/url if you want; or clear them
    setModal("preview");
  };

  const hasImage = !!profileImage;

  return (
    <>
      <div className="tw:bg-white tw:rounded-3xl tw:px-2 tw:md:px-6 tw:py-8 tw:border tw:border-gray-100 tw:shadow-sm">
        <span className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-6 tw:block">
          Change Profile Image
        </span>

        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center">
          {/* Avatar circle */}
          <button
            style={{
              borderRadius: "50%",
              fontSize: 12,
            }}
            type="button"
            onClick={openPreview}
            className="tw:relative tw:w-28 tw:h-28 tw:md:w-32 tw:md:h-32 tw:rounded-full tw:overflow-hidden tw:bg-gray-100 tw:border tw:border-gray-200 tw:shadow-sm"
            aria-label="Preview profile image"
          >
            {hasImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="tw:w-full tw:h-full tw:object-cover"
              />
            ) : (
              <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-black tw:text-white tw:text-2xl tw:font-semibold">
                {initials}
              </div>
            )}

            {uploading && (
              <div className="tw:absolute tw:inset-0 tw:bg-black/40 tw:flex tw:items-center tw:justify-center">
                <div className="tw:h-7 tw:w-7 tw:rounded-full tw:border-2 tw:border-white/60 tw:border-t-white tw:animate-spin" />
              </div>
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="tw:hidden"
            onChange={onFileChosen}
          />

          <button
            style={{
              borderRadius: '24px',
              fontSize: 12,
              marginTop: 12
            }}
            type="button"
            onClick={pickFile}
            className="tw:mt-8 tw:inline-flex tw:items-center tw:justify-center tw:px-4 tw:py-2.5 tw:rounded-full tw:bg-black tw:text-xs tw:font-medium tw:text-white tw:hover:bg-gray-900 tw:transition"
          >
            Upload new photo
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {modal === "preview" && (
        <div className="tw:fixed tw:inset-0 tw:z-50 tw:bg-black/60 tw:flex tw:items-center tw:justify-center tw:p-4 tw:backdrop-blur-sm">
          <div className="tw:w-full tw:max-w-lg tw:bg-white tw:rounded-3xl tw:border tw:border-gray-100 tw:shadow-2xl tw:max-h-[90vh] tw:overflow-hidden tw:flex tw:flex-col">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-5 tw:py-4 tw:border-b tw:border-gray-100">
              <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                Profile photo
              </div>
              <button
                style={{
                  borderRadius: 16,
                  fontSize: 12,
                }}
                type="button"
                onClick={closeAll}
                className="tw:text-gray-500 tw:hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="tw:flex-1 tw:overflow-y-auto tw:p-5">
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
                <div className="tw:w-40 tw:h-40 tw:rounded-full tw:overflow-hidden tw:bg-gray-100 tw:border tw:border-gray-200 tw:flex tw:items-center tw:justify-center">
                  {hasImage ? (
                    <img
                      src={profileImage}
                      alt="Profile preview"
                      className="tw:w-full tw:h-full tw:object-cover"
                    />
                  ) : (
                    <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-black tw:text-white tw:text-3xl tw:font-semibold">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="tw:w-full tw:flex tw:flex-col tw:gap-2">
                  <button
                    style={{
                      borderRadius: 16,
                      fontSize: 12,
                      marginBottom: 12
                    }}
                    type="button"
                    onClick={pickFile}
                    className="tw:w-full tw:px-4 tw:py-2.5 tw:rounded-xl tw:bg-black tw:text-white tw:text-sm tw:font-semibold"
                  >
                    Choose new photo
                  </button>
                  <button
                    style={{
                      borderRadius: 16,
                      fontSize: 12,
                    }}
                    type="button"
                    onClick={closeAll}
                    className="tw:w-full tw:px-4 tw:py-2.5 tw:rounded-xl tw:border tw:border-gray-200 tw:text-sm tw:text-gray-700 tw:hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>

                <div className="tw:text-[11px] tw:text-gray-500 tw:text-center">
                  You can crop the new photo before uploading.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CROP MODAL (NO PREVIEW COLUMN) */}
      {modal === "crop" && (
        <div className="tw:fixed tw:inset-0 tw:z-50 tw:bg-black/60 tw:flex tw:items-center tw:justify-center tw:p-3 tw:sm:p-4 tw:backdrop-blur-sm">
          <div className="tw:w-full tw:max-w-3xl tw:bg-white tw:rounded-3xl tw:border tw:border-gray-100 tw:shadow-2xl tw:max-h-[92vh] tw:overflow-hidden tw:flex tw:flex-col">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:sm:px-5 tw:py-3 tw:border-b tw:border-gray-100">
              <div>
                <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                  Crop photo
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  Adjust the crop and save.
                </div>
              </div>

              <button
                style={{
                  borderRadius: 16,
                  fontSize: 12,
                }}
                type="button"
                onClick={backToPreview}
                className="tw:text-gray-600 tw:hover:text-gray-800 tw:text-sm"
              >
                Back
              </button>
            </div>

            <div className="tw:flex-1 tw:overflow-y-auto tw:p-3 tw:sm:p-5">
              <div className="tw:bg-gray-50 tw:rounded-2xl tw:p-2 tw:sm:p-3 tw:border tw:border-gray-200">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  keepSelection
                  ruleOfThirds
                  className="tw:w-full"
                >
                  <img
                    ref={cropImgRef}
                    src={selectedUrl}
                    alt="Crop"
                    className="tw:w-full tw:block tw:max-h-[55vh] tw:sm:max-h-[65vh] tw:object-contain"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const next = centerDefaultSquareCrop(
                        img.width,
                        img.height
                      );
                      setCrop(next); // default square selection
                    }}
                  />
                </ReactCrop>
              </div>

              <div className="tw:mt-2 tw:text-[11px] tw:text-gray-500">
                Default crop is a square, but you can resize it freely.
              </div>
            </div>

            <div className="tw:px-4 tw:sm:px-5 tw:py-3 tw:border-t tw:border-gray-100 tw:bg-white tw:flex tw:items-center tw:flex-col tw:justify-between tw:gap-3">
              <button
                style={{
                  borderRadius: 16,
                  fontSize: 12,
                }}
                type="button"
                onClick={pickFile}
                className="tw:px-4 tw:py-2 tw:rounded-xl tw:border tw:border-gray-200 tw:text-sm tw:text-gray-700 tw:hover:bg-gray-50"
              >
                Choose another
              </button>

              <div className="tw:flex tw:items-center tw:gap-2">
                <button
                  style={{
                    borderRadius: 16,
                    fontSize: 12,
                  }}
                  type="button"
                  onClick={closeAll}
                  className="tw:px-4 tw:py-2 tw:rounded-xl tw:border tw:border-gray-200 tw:text-sm tw:text-gray-700 tw:hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  style={{
                    borderRadius: 16,
                    fontSize: 12,
                  }}
                  type="button"
                  onClick={saveCropped}
                  disabled={!completedCrop?.width || !completedCrop?.height}
                  className="tw:px-4 tw:py-2 tw:rounded-xl tw:bg-black tw:text-white tw:text-sm tw:font-semibold tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
                >
                  Save photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
