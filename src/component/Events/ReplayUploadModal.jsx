import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Film, Loader2, Upload, X } from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import { uploadToBunnyTus } from "../../lib/bunnyTusUpload";
import { showError, showSuccess } from "../ui/toast";

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "application/vnd.apple.mpegurl",
];

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (["ended", "completed", "past"].includes(normalized)) return "ended";
  if (["live"].includes(normalized)) return "live";
  if (["paused"].includes(normalized)) return "paused";

  return "upcoming";
}

function formatAbsoluteDateTime(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isReplayUploadAllowed(event) {
  return normalizeStatus(event?.status) === "ended" && !!event?.enable_replay;
}

export default function ReplayUploadModal({
  open,
  event,
  token,
  onClose,
  onUploaded,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const uploadAllowed = useMemo(() => isReplayUploadAllowed(event), [event]);
  const replayAvailableAt =
    event?.replay_available_at || event?.replay?.available_at || "";
  const replayExpiresAt =
    event?.replay_expires_at || event?.replay?.expires_at || "";

  useEffect(() => {
    if (!open) return;

    setSelectedFile(null);
    setProgress(0);
    setUploading(false);
    setErrorMessage("");
  }, [open, event?.id]);

  const handleClose = () => {
    if (uploading) return;
    onClose?.();
  };

  const handleFileChange = (nextFile) => {
    if (!nextFile) {
      setSelectedFile(null);
      setErrorMessage("");
      return;
    }

    if (
      nextFile.type &&
      !ACCEPTED_VIDEO_TYPES.includes(nextFile.type) &&
      !String(nextFile.type).startsWith("video/")
    ) {
      setSelectedFile(null);
      setErrorMessage("Upload a supported video file.");
      return;
    }

    setSelectedFile(nextFile);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (!uploadAllowed) {
      setErrorMessage("Replay upload is only available for ended events with replay enabled.");
      return;
    }

    if (!(selectedFile instanceof File)) {
      setErrorMessage("Choose a replay video to continue.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMessage("");

    try {
      const res = await api.post(
        `/api/v1/events/${event.id}/vod/initiate-upload`,
        {
          source_type: "live_replay",
          title: selectedFile.name || `${event.title || "Event"} replay`,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
        },
        authHeaders(token)
      );

      await uploadToBunnyTus({
        file: selectedFile,
        upload: res?.data?.data?.upload,
        onProgress: setProgress,
      });

      const responseData = res?.data?.data || res?.data || {};
      const successMessage =
        responseData?.message ||
        res?.data?.message ||
        "Replay uploaded. Bunny Stream is processing it.";

      showSuccess(successMessage);
      onUploaded?.({
        responseData,
        message: successMessage,
      });
      onClose?.();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to upload replay right now.";
      setErrorMessage(message);
      showError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-slate-950/60 tw:backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:p-3 tw:sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:translate-y-3 tw:sm:scale-95"
              enterTo="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:translate-y-0 tw:sm:scale-100"
              leaveTo="tw:opacity-0 tw:translate-y-3 tw:sm:scale-95"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-2xl tw:overflow-hidden tw:rounded-[28px] tw:bg-white tw:shadow-[0_24px_64px_rgba(15,23,42,0.18)] tw:ring-1 tw:ring-black/5">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:px-5 tw:pt-5 tw:sm:px-6 tw:pt-6">
                  <div>
                    <span className="tw:block tw:text-xl tw:font-semibold tw:text-slate-900">
                      Upload replay video
                    </span>
                    <span className="tw:block tw:mt-1 tw:text-sm tw:text-slate-500">
                      Upload the recorded replay after the event ends. The backend controls when it unlocks and when it expires.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={uploading}
                    className="tw:inline-flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-slate-500 tw:hover:bg-slate-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    <X className="tw:h-4 tw:w-4" />
                  </button>
                </div>

                <div className="tw:px-5 tw:pb-5 tw:sm:px-6 tw:pb-6">
                  <div className="tw:mt-5 tw:rounded-[24px] tw:border tw:border-dashed tw:border-slate-300 tw:bg-slate-50/70 tw:p-5">
                    <label className="tw:flex tw:min-h-[190px] tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:text-center">
                      <div className="tw:flex tw:w-full tw:max-w-[360px] tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:mx-auto">
                        <div className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-primary tw:shadow-sm">
                          <Film className="tw:h-6 tw:w-6" />
                        </div>
                        <div className="tw:w-full">
                          <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                            {selectedFile?.name || "Choose replay video"}
                          </div>
                          <div className="tw:mt-1 tw:text-xs tw:text-slate-500">
                            Supported video formats only. Upload is limited to ended events with replay enabled.
                          </div>
                        </div>
                        <span className="tw:inline-flex tw:h-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:px-4 tw:text-sm tw:font-medium tw:text-slate-700 tw:shadow-sm">
                          Select video
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="video/*,.m3u8"
                        className="tw:hidden"
                        onChange={(eventValue) =>
                          handleFileChange(eventValue.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>

                  {selectedFile ? (
                    <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3">
                      <div className="tw:min-w-0">
                        <div className="tw:truncate tw:text-sm tw:font-medium tw:text-slate-900">
                          {selectedFile.name}
                        </div>
                        <div className="tw:text-xs tw:text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        disabled={uploading}
                        className="tw:text-sm tw:font-medium tw:text-slate-600 tw:hover:text-slate-900 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  {uploading ? (
                    <div className="tw:mt-4">
                      <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-slate-500">
                        <span>Uploading replay</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-slate-200">
                        <div
                          className="tw:h-full tw:rounded-full tw:bg-primary tw:transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-red-100 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-sm tw:text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  {!uploadAllowed ? (
                    <div className="tw:mt-4 tw:rounded-2xl tw:border tw:border-amber-100 tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-sm tw:text-amber-800">
                      Replay upload becomes available when the event has ended and replay is enabled for this event.
                    </div>
                  ) : null}

                  <div className="tw:mt-6 tw:flex tw:flex-col-reverse tw:gap-3 tw:sm:flex-row tw:sm:justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={uploading}
                      className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-slate-100 tw:px-5 tw:text-sm tw:font-semibold tw:text-slate-700 tw:hover:bg-slate-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading || !uploadAllowed}
                      className="tw:inline-flex tw:h-11 tw:min-w-[170px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:hover:bg-primarySecond disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                    >
                      {uploading ? (
                        <Loader2 className="tw:h-4 tw:w-4 tw:animate-spin" />
                      ) : (
                        <Upload className="tw:h-4 tw:w-4" />
                      )}
                      <span>{uploading ? "Uploading..." : "Upload replay"}</span>
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
