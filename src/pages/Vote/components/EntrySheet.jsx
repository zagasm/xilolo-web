import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button, Field, Input, Modal } from "../../../component/ui";
import { showError, showSuccess } from "../../../component/ui/toast";
import { submitEntry, uploadEntryPhoto } from "../../../api/contestApi";
import ImageCropper from "./ImageCropper";
import { friendlyError } from "../../../lib/errors";
import { useAuth } from "../../auth/AuthContext";

/**
 * Entry form.
 *
 * Renders whatever the organiser asked for — the schema comes from the contest,
 * so this is the same form for every contest and no field is invented here.
 * File fields ask for a link for now; uploads for entries are a separate piece
 * of work, and pretending otherwise would break on submit.
 */
const TEXTAREA_TYPES = new Set(["long_text", "textarea", "text_long"]);

export default function EntrySheet({ open, onClose, contest, onSubmitted }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ display_name: "", bio: "", location: "" });
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Two contestants can share a name; a face settles it.
  const [photo, setPhoto] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInput = useRef(null);

  const uploadPhoto = async (blob) => {
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadEntryPhoto(contest.slug, blob, token);
      setPhoto(uploaded);
    } catch (err) {
      showError(friendlyError(err, "That photo could not be uploaded."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fields = Array.isArray(contest?.entry_fields) ? contest.entry_fields : [];

  const setAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await submitEntry(
        contest.slug,
        {
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          location: form.location.trim() || null,
          answers,
          media: photo ? { photo: { path: photo.path, url: photo.url } } : null,
        },
        token
      );

      showSuccess("Entry sent to the organiser.");
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(friendlyError(err, "That entry could not be sent. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Enter this contest">
      <form onSubmit={submit} className="tw:flex tw:flex-col tw:gap-3">
        <span className="tw:text-[12px] tw:leading-relaxed tw:text-muted!">
          The organiser reviews every entry by hand. Nothing is public until they approve it.
        </span>

        <div className="tw:flex tw:items-center tw:gap-3">
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="tw:relative tw:flex tw:size-16 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-hairline tw:bg-paper"
            aria-label="Add your photo"
          >
            {photo?.url ? (
              <img src={photo.url} alt="" className="tw:size-full tw:object-cover" />
            ) : uploadingPhoto ? (
              <Loader2 className="tw:size-5 tw:animate-spin tw:text-muted" aria-hidden="true" />
            ) : (
              <Camera className="tw:size-5 tw:text-muted" aria-hidden="true" />
            )}
          </button>

          <div className="tw:min-w-0">
            <span className="tw:block tw:text-[13px] tw:font-semibold tw:text-ink">
              {photo?.url ? "Photo added" : "Add a photo"}
            </span>
            <span className="tw:block tw:text-[12px] tw:text-muted">
              Optional, but voters use it to tell contestants apart.
            </span>
          </div>

          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="tw:hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPendingPhoto(file);
              event.target.value = "";
            }}
          />
        </div>

        <Field label="Name on the entry">
          <Input
            required
            minLength={2}
            maxLength={120}
            value={form.display_name}
            onChange={(event) => setForm((prev) => ({ ...prev, display_name: event.target.value }))}
            placeholder="How you want to be listed"
          />
        </Field>

        <Field label="Short bio (optional)">
          <Input
            value={form.bio}
            maxLength={1000}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
          />
        </Field>

        <Field label="Where you are (optional)">
          <Input
            value={form.location}
            maxLength={120}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          />
        </Field>

        {fields.map((field) => (
          <Field
            key={field.key}
            label={`${field.label || field.key}${field.required ? "" : " (optional)"}`}
          >
            {field.type === "select" ? (
              <select
                required={field.required}
                value={answers[field.key] ?? ""}
                onChange={(event) => setAnswer(field.key, event.target.value)}
                className="tw:h-12 tw:w-full tw:rounded-control tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[15px] tw:text-ink tw:outline-none"
              >
                <option value="">Choose…</option>
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "multiselect" ? (
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                {(field.options || []).map((option) => {
                  const chosen = Array.isArray(answers[field.key]) && answers[field.key].includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(answers[field.key]) ? answers[field.key] : [];
                        setAnswer(
                          field.key,
                          chosen ? current.filter((item) => item !== option) : [...current, option]
                        );
                      }}
                      className={`tw:rounded-pill tw:border tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium ${
                        chosen
                          ? "tw:border-accent tw:bg-accent/12 tw:text-accent-deep"
                          : "tw:border-hairline tw:bg-paper-raised tw:text-body"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : TEXTAREA_TYPES.has(field.type) ? (
              <textarea
                required={field.required}
                rows={3}
                value={answers[field.key] ?? ""}
                onChange={(event) => setAnswer(field.key, event.target.value)}
                className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none"
              />
            ) : (
              <Input
                required={field.required}
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : field.type === "phone"
                        ? "tel"
                        : field.type === "url" || field.type?.startsWith("file_")
                          ? "url"
                          : "text"
                }
                placeholder={field.type?.startsWith("file_") ? "Paste a link to your file" : undefined}
                value={answers[field.key] ?? ""}
                onChange={(event) => setAnswer(field.key, event.target.value)}
              />
            )}
          </Field>
        ))}

        {error ? (
          <span className="tw:block tw:rounded-card tw:bg-danger/8 tw:p-3 tw:text-[12px] tw:text-danger">
            {error}
          </span>
        ) : null}

        <Button type="submit" loading={busy} className="tw:mt-1">
          Send my entry
        </Button>
      </form>

      <ImageCropper
        file={pendingPhoto}
        ratio={1}
        open={Boolean(pendingPhoto)}
        title="Crop your photo"
        onCancel={() => setPendingPhoto(null)}
        onCrop={(blob) => {
          setPendingPhoto(null);
          uploadPhoto(blob);
        }}
      />
    </Modal>
  );
}
