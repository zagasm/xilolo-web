import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../../../../lib/apiClient";
import { uploadToBunnyTus } from "../../../../lib/bunnyTusUpload";
import { useAuth } from "../../../auth/AuthContext";
import { showPromise, showError } from "../../../../component/ui/toast";

import ProgressSteps from "./steps/ProgressSteps";
import EventInformationStep from "./steps/EventInformationStep";
import TicketingStep from "./steps/TicketingStep";
import ReviewStep from "./steps/ReviewStep";
import EventCreationSuccessModal from "../../../../component/Events/EventCreationSuccessModal";

function normalizeTime(value) {
  const text = String(value || "").trim();
  const twelveHour = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHour) return text.slice(0, 5);

  let hour = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${twelveHour[2]}`;
}

function mapEventToDefaults(event) {
  if (!event?.currentEvent) {
    return {
      info: {
        title: "",
        description: "",
        location: "Online",
        organizer: "",
        genre: "",
        date: "",
        time: "",
        timezone: "",
      },
      ticketing: {
        price: 0,
        maxTickets: "unlimited",
        ticketLimit: undefined,
        currency: "",
        currencyCode: "NGN",
        deliveryType: "live",
        vodFile: null,
        attendanceType: "online",
        hasMaterials: false,
        enableReplay: false,
        replayAvailableAfterMinutes: 120,
        replayAvailableForMinutes: 1440,
        manualPrice: 0,
        existingManual: null,
        existingManualCover: null,
      },
      streaming: {
        streamingOption: "in_app",
        enableReplay: false,
        streamingDuration: "24",
      },
      access: {
        visibility: "public",
        matureContent: false,
      },
      media: {
        posterImages: [],
        existingPoster: [],
      },
    };
  }

  const currentEvent = event.currentEvent;
  const startDate = currentEvent.eventDateISO || currentEvent.event_date || currentEvent.start_date || "";
  const startTime = normalizeTime(currentEvent.start_time || currentEvent.startTime || "");
  const timezone =
    currentEvent.timezone_id || currentEvent.timezone || "";
  const maxTickets = currentEvent.max_tickets ? "limited" : "unlimited";

  return {
    info: {
      title: currentEvent.title || "",
      description: currentEvent.description || "",
      location: currentEvent.location || currentEvent.country || "Online",
      organizer:
        currentEvent.organizer?.name ||
        currentEvent.hostName ||
        currentEvent.user?.name ||
        "",
      genre: currentEvent.genre || "",
      date: startDate ? String(startDate).slice(0, 10) : "",
      time: startTime || "",
      timezone: String(timezone || ""),
    },
    ticketing: {
      price: Number(currentEvent.price || 0),
      maxTickets,
      ticketLimit:
        maxTickets === "limited"
          ? Number(currentEvent.max_tickets || 0)
          : undefined,
      currency: String(currentEvent.currency?.currencyId || currentEvent.currency?.id || ""),
      currencyCode: String(currentEvent.currency?.code || "NGN").toUpperCase(),
      deliveryType: currentEvent.delivery_type || "live",
      vodFile: null,
      attendanceType: currentEvent.attendance_type || "online",
      hasMaterials: !!(
        currentEvent.manual?.available ||
        currentEvent.manual?.cover_url ||
        Number(currentEvent.manual?.price || 0) > 0
      ),
      enableReplay:
        typeof currentEvent.enable_replay === "boolean"
          ? currentEvent.enable_replay
          : false,
      replayAvailableAfterMinutes: Number(
        currentEvent.replay_available_after_minutes || 120
      ),
      replayAvailableForMinutes: Number(
        currentEvent.replay_available_for_minutes || 1440
      ),
      manualPrice: Number(currentEvent.manual?.price || 0),
      existingManual: currentEvent.manual?.available
        ? {
            fileName: currentEvent.manual?.file_name || "",
            fileMimeType: currentEvent.manual?.file_mime_type || "",
            fileSize: currentEvent.manual?.file_size || 0,
          }
        : null,
      existingManualCover: currentEvent.manual?.cover_url
        ? {
            url: currentEvent.manual.cover_url,
            fileName: currentEvent.manual?.file_name || "Material cover",
          }
        : null,
    },
    streaming: {
      streamingOption: currentEvent.streaming_option || "in_app",
      enableReplay:
        typeof currentEvent.enable_replay === "boolean"
          ? currentEvent.enable_replay
          : false,
      streamingDuration: String(currentEvent.streaming_duration || 24),
    },
    access: {
      visibility: currentEvent.visibility || "public",
      matureContent: !!currentEvent.mature_content,
    },
    media: {
      posterImages: [],
      existingPoster: (currentEvent.poster || [])
        .filter((media) => media.type === "image")
        .map((media, index) => ({
          id: media.id || index,
          type: media.type,
          url: media.url,
        })),
    },
  };
}

export default function EventCreationWizard({
  eventTypeId,
  mode = "create",
  eventId,
  initialEvent,
}) {
  const isEdit = mode === "edit" && !!eventId;
  const { token } = useAuth();
  const navigate = useNavigate();

  const mapped = useMemo(
    () => mapEventToDefaults(initialEvent),
    [initialEvent]
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [collected, setCollected] = useState({});
  const [posterImages, setPosterImages] = useState(
    mapped.media.posterImages || []
  );
  const [existingPoster, setExistingPoster] = useState(
    mapped.media.existingPoster || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [createdVodEventId, setCreatedVodEventId] = useState(null);
  const [vodUploadState, setVodUploadState] = useState({
    status: "idle",
    progress: 0,
    message: "",
  });
  const vodAbortRef = useRef(null);
  const [successModal, setSuccessModal] = useState({
    open: false,
    eventId: null,
    variant: "created",
  });

  const markStepDone = (step) => {
    setCompletedSteps((prev) =>
      prev.includes(step) ? prev : [...prev, step]
    );
  };

  const mergeCollected = (stepKey, data) => {
    setCollected((prev) => ({
      ...prev,
      [stepKey]: { ...(prev[stepKey] || {}), ...data },
    }));
  };

  const handleInfoNext = (values) => {
    mergeCollected("step_1", values);
    markStepDone(1);
    setCurrentStep(2);
  };

  const buildEventPayload = (info, ticketing) => {
    const payload = new FormData();

    payload.append("title", info.title || "");
    payload.append("description", info.description || "");
    payload.append("location", info.location || "Online");
    payload.append("organizer", info.organizer || "");
    payload.append("genre", info.genre || "");
    if (!isEdit) {
      payload.append("event_date", info.date || "");
      payload.append("start_time", info.time || "");
    }
    payload.append("time_zone_id", info.timezone || "");

    if (eventTypeId) {
      payload.append("event_type_id", eventTypeId);
    }

    posterImages.forEach((file, index) => {
      payload.append(
        `poster_images[${index}]`,
        file,
        file.name || `poster_image_${index}`
      );
    });

    if (isEdit && Array.isArray(existingPoster)) {
      existingPoster.forEach((media, index) => {
        payload.append(`keep_poster_ids[${index}]`, media.id);
      });
    }

    payload.append("price", ticketing.price ?? 0);
    payload.append("delivery_type", ticketing.deliveryType || "live");
    payload.append("attendance_type", ticketing.attendanceType || "online");
    payload.append("currency_id", ticketing.currency || "");
    payload.append("ticket_limit", ticketing.maxTickets || "unlimited");
    if (ticketing.maxTickets === "limited") {
      payload.append("ticket_limit_number", ticketing.ticketLimit || 0);
    }

    if (ticketing.hasMaterials) {
      const hasExistingManual = Boolean(ticketing.existingManual?.fileName);
      if (ticketing.manualFile instanceof File) {
        payload.append(
          "manual_file",
          ticketing.manualFile,
          ticketing.manualFile.name || "event-manual"
        );
      }

      if (ticketing.manualCover instanceof File) {
        payload.append(
          "manual_cover",
          ticketing.manualCover,
          ticketing.manualCover.name || "event-manual-cover"
        );
      }

      if (
        Number(ticketing.manualPrice || 0) > 0 &&
        (ticketing.manualFile instanceof File || hasExistingManual)
      ) {
        payload.append("manual_price", ticketing.manualPrice);
      }
    }

    payload.append(
      "streaming_option",
      (mapped.streaming || {}).streamingOption || "in_app"
    );
    payload.append("enable_replay", ticketing.enableReplay ? "1" : "0");
    if (ticketing.enableReplay) {
      payload.append(
        "replay_available_after_minutes",
        String(ticketing.replayAvailableAfterMinutes || 120)
      );
      payload.append(
        "replay_available_for_minutes",
        String(ticketing.replayAvailableForMinutes || 1440)
      );
    }

    payload.append("visibility", ticketing.visibility || "public");
    payload.append(
      "post_mature_content",
      ticketing.matureContent ? "1" : "0"
    );

    return payload;
  };

  const uploadVodForEvent = async ({ eventId: targetEventId, info, ticketing }) => {
    const abortController = new AbortController();
    vodAbortRef.current = abortController;

    setVodUploadState({
      status: "preparing",
      progress: 0,
      message: "Preparing Bunny Stream upload...",
    });

    const initResponse = await api.post(
      `/api/v1/events/${targetEventId}/vod/initiate-upload`,
      {
        title: ticketing.vodFile.name || info.title,
        file_name: ticketing.vodFile.name,
        file_type: ticketing.vodFile.type,
      },
      authHeaders(token)
    );

    setVodUploadState({
      status: "uploading",
      progress: 0,
      message: "Uploading video to Bunny Stream...",
    });

    await uploadToBunnyTus({
      file: ticketing.vodFile,
      upload: initResponse?.data?.data?.upload,
      signal: abortController.signal,
      onProgress: (progress) =>
        setVodUploadState({
          status: "uploading",
          progress,
          message: `Uploading video... ${progress}%`,
        }),
    });

    setVodUploadState({
      status: "complete",
      progress: 100,
      message: "Upload complete. Bunny Stream is processing the video.",
    });
    vodAbortRef.current = null;
  };

  const handleTicketingNext = async (values) => {
    if (!isEdit && values.deliveryType === "vod" && values.vodFile instanceof File) {
      try {
        setIsSubmitting(true);
        setFormErrors({});
        mergeCollected("step_2", values);

        const info = collected.step_1 || mapped.info;
        let targetEventId = createdVodEventId;

        if (!targetEventId) {
          setVodUploadState({
            status: "creating",
            progress: 0,
            message: "Creating event before video upload...",
          });

          const response = await api.post(
            "/api/v1/event/store",
            buildEventPayload(info, values),
            {
              ...authHeaders(token),
              headers: {
                ...authHeaders(token).headers,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          const created = response?.data?.data || response?.data || {};
          targetEventId = created?.id;
          setCreatedVodEventId(targetEventId);
        }

        if (!targetEventId) {
          throw new Error("Event was created but no event ID was returned.");
        }

        await uploadVodForEvent({ eventId: targetEventId, info, ticketing: values });

        mergeCollected("step_2", {
          ...values,
          vodUploaded: true,
          createdEventId: targetEventId,
        });
        markStepDone(2);
        setCurrentStep(3);
      } catch (err) {
        const data = err?.response?.data;
        if (data?.errors) {
          setFormErrors(data.errors);
        }
        const wasCancelled = err?.name === "AbortError";
        setVodUploadState({
          status: wasCancelled ? "cancelled" : "failed",
          progress: 0,
          message: wasCancelled
            ? "Upload cancelled. Choose another video or try again."
            : data?.message || err?.message || "Video upload failed.",
        });
        if (!wasCancelled) {
          showError(data?.error || data?.message || err?.message || "Video upload failed");
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    mergeCollected("step_2", values);
    markStepDone(2);
    setCurrentStep(3);
  };

  const cancelVodUpload = () => {
    vodAbortRef.current?.abort();
  };

  const closeSuccessModal = () => {
    setSuccessModal((prev) => ({ ...prev, open: false }));
    navigate(`/event/view/${successModal.eventId}`);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      const info = collected.step_1 || mapped.info;
      const ticketing = collected.step_2 || {
        ...mapped.ticketing,
        ...mapped.access,
      };
      if (!isEdit && ticketing.deliveryType === "vod" && createdVodEventId) {
        setSuccessModal({
          open: true,
          eventId: createdVodEventId,
          variant: "created",
        });
        return;
      }

      const payload = buildEventPayload(info, ticketing);

      const request = api.post(
        isEdit ? `/api/v1/event/${eventId}/edit` : "/api/v1/event/store",
        payload,
        {
          ...authHeaders(token),
          headers: {
            ...authHeaders(token).headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const response = await showPromise(request, {
        loading: isEdit ? "Updating event…" : "Creating event…",
        success: isEdit ? "Event updated" : "Event created",
        error: "Could not save event",
      });

      if (
        isEdit &&
        (String(info.date || "") !== String(mapped.info.date || "") ||
          String(info.time || "") !== String(mapped.info.time || ""))
      ) {
        await showPromise(
          api.patch(
            `/api/v1/events/${eventId}/reschedule`,
            {
              event_date: info.date,
              start_time: normalizeTime(info.time),
            },
            authHeaders(token)
          ),
          {
            loading: "Updating schedule…",
            success: "Event schedule updated",
            error: "Could not update event schedule",
          }
        );
      }

      const created = response?.data?.data || response?.data || {};
      const createdId = created?.id || eventId;

      if (!isEdit && createdId && ticketing.deliveryType === "vod" && ticketing.vodFile instanceof File) {
        const initResponse = await showPromise(
          api.post(
            `/api/v1/events/${createdId}/vod/initiate-upload`,
            {
              title: ticketing.vodFile.name || info.title || created.title,
              file_name: ticketing.vodFile.name,
              file_type: ticketing.vodFile.type,
            },
            authHeaders(token)
          ),
          {
            loading: "Preparing VOD upload…",
            success: "VOD upload session ready",
            error: "Could not prepare VOD upload",
          }
        );

        await showPromise(
          uploadToBunnyTus({
            file: ticketing.vodFile,
            upload: initResponse?.data?.data?.upload,
          }),
          {
            loading: "Uploading VOD to Bunny Stream…",
            success: "VOD uploaded. Bunny Stream is processing it.",
            error: "VOD upload failed",
          }
        );
      }

      setSuccessModal({
        open: true,
        eventId: createdId,
        variant: isEdit ? "updated" : "created",
      });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) {
        setFormErrors(data.errors);
      }
      showError(data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mergedForReview = useMemo(
    () => ({
      ...(collected.step_1 || mapped.info),
      ...(collected.step_2 || {
        ...mapped.ticketing,
        ...mapped.access,
      }),
    }),
    [collected, mapped]
  );

  const infoStepDefaults = collected.step_1 || mapped.info;
  const ticketStepDefaults = collected.step_2 || {
    ...mapped.ticketing,
    ...mapped.access,
  };

  if (isEdit && !initialEvent) {
    return null;
  }

  return (
    <div className="tw:mx-auto tw:max-w-5xl tw:px-1 tw:pb-20 tw:pt-10 tw:md:pt-0">
      <ProgressSteps
        currentStep={currentStep}
        completedSteps={completedSteps}
        onBack={() => {
          if (currentStep === 1) {
            navigate(-1);
          } else {
            setCurrentStep((step) => Math.max(1, step - 1));
          }
        }}
      />

      {currentStep === 1 && (
        <EventInformationStep
          defaultValues={infoStepDefaults}
          onNext={handleInfoNext}
          posterImages={posterImages}
          setPosterImages={setPosterImages}
          existingPoster={existingPoster}
          setExistingPoster={setExistingPoster}
        />
      )}

      {currentStep === 2 && (
        <TicketingStep
          defaultValues={ticketStepDefaults}
          onBack={() => setCurrentStep(1)}
          onNext={handleTicketingNext}
          isUploadingVod={["creating", "preparing", "uploading"].includes(vodUploadState.status)}
          vodUploadState={vodUploadState}
          onCancelVodUpload={cancelVodUpload}
          onVodFileChanged={() =>
            setVodUploadState({
              status: "idle",
              progress: 0,
              message: "",
            })
          }
        />
      )}

      {currentStep === 3 && (
        <ReviewStep
          collected={mergedForReview}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onBack={() => setCurrentStep(2)}
          onPublish={handlePublish}
          onGoToStep={goToStep}
          posterImages={posterImages}
          existingPoster={existingPoster}
        />
      )}

      <EventCreationSuccessModal
        open={successModal.open}
        onClose={closeSuccessModal}
        eventId={successModal.eventId}
        variant={successModal.variant}
      />
    </div>
  );
}
