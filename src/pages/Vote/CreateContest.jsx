import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button, Card, Field, Input } from "../../component/ui";
import CoverPicker from "./components/CoverPicker";
import { showError, showSuccess } from "../../component/ui/toast";
import { createContest, publishContest, uploadContestCover } from "../../api/contestApi";
import { friendlyError } from "../../lib/errors";

const RANK = (n) => {
  const value = Number(n);
  const suffix = ["th", "st", "nd", "rd"][(value % 100 > 10 && value % 100 < 14) ? 0 : value % 10] || "th";
  return `${value}${suffix}`;
};
import { useAuth } from "../auth/AuthContext";

/**
 * Create a contest.
 *
 * Two steps by design: a contest is saved as a draft first, then published.
 * Publishing is what freezes the fee terms and opens the entry window, so it
 * should never be an accidental side effect of a form submit.
 */
export default function CreateContest() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    rules: "",
    terms: "",
    vote_price: "",
    vote_visibility: "everyone",
    is_refundable: false,
    entries_close_at: "",
    voting_close_at: "",
    prize_summary: "",
  });

  // A prize is a place and an amount. `rank_to` stays empty for a single
  // position — "1st place" already says winner, so asking for a label again was
  // how organisers ended up with "1st ... winner".
  const [prizes, setPrizes] = useState([{ rank_from: "1", rank_to: "", amount: "" }]);

  // Contest artwork. Without it a card has no picture and never looks finished.
  const [cover, setCover] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const pickCover = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Covers must be an image — JPG, PNG or WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Cover images must be 5MB or smaller.");
      return;
    }

    setCoverUploading(true);
    try {
      const uploaded = await uploadContestCover(file, token);
      setCover(uploaded);
      showSuccess("Cover uploaded.");
    } catch (err) {
      showError(friendlyError(err, "That image could not be uploaded."));
    } finally {
      setCoverUploading(false);
    }
  };

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrize = (index, key, value) => {
    setPrizes((prev) => prev.map((prize, i) => (i === index ? { ...prize, [key]: value } : prize)));
  };

  const prizeRows = prizes.map((prize) => {
    const from = Number(prize.rank_from) || 0;
    const to = prize.rank_to === "" ? from : Number(prize.rank_to) || 0;
    return { from, to, amount: prize.amount };
  });

  // Same rule the API enforces, checked here so the organiser sees it inline
  // instead of getting a 422 after saving.
  const prizeProblem = (() => {
    const filled = prizeRows.filter((row) => row.from > 0);
    for (const row of filled) {
      if (row.to < row.from) return "A prize range cannot end before it starts.";
    }
    const sorted = [...filled].sort((a, b) => a.from - b.from);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].from <= sorted[i - 1].to) {
        return "Two prizes cover the same place. Each position can only be won once.";
      }
    }
    return null;
  })();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        rules: form.rules.trim() || null,
        terms: form.terms.trim() || null,
        vote_price: Number(form.vote_price),
        vote_visibility: form.vote_visibility,
        is_refundable: form.is_refundable,
        entries_close_at: form.entries_close_at || null,
        voting_close_at: form.voting_close_at || null,
        prize_summary: form.prize_summary.trim() || null,
        cover_media: cover ? { path: cover.path, url: cover.url } : null,
        prizes: prizes
          .filter((prize) => Number(prize.rank_from) > 0)
          .map((prize) => ({
            rank_from: Number(prize.rank_from),
            // empty means a single position, not a copy of rank_from
            rank_to: prize.rank_to === "" ? null : Number(prize.rank_to),
            amount: prize.amount === "" ? null : Number(prize.amount),
          })),
      };

      const contest = await createContest(payload, token);
      setCreated(contest);
      showSuccess("Contest saved as a draft.");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(friendlyError(err, "That did not go through. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);

    try {
      await publishContest(created.id, token);
      showSuccess("Contest is live.");
      navigate(`/vote/${created.slug}`);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(friendlyError(err, "That did not go through. Please try again."));
    } finally {
      setPublishing(false);
    }
  };

  if (created) {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[640px] tw:px-4 tw:min-h-screen tw:pb-32 tw:pt-24 tw:md:pb-24 tw:font-sans">
        <Card className="tw:p-5">
          <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
            Draft saved
          </span>
          <span className="tw:mt-2 tw:block tw:text-[20px] tw:font-semibold tw:text-ink">
            {created.title}
          </span>
          <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
            Nothing is public yet. Publishing opens the entry window and locks the fee terms for
            this contest.
          </span>

          <div className="tw:mt-5 tw:flex tw:flex-wrap tw:gap-2">
            <Button type="button" onClick={publish} loading={publishing}>
              Publish contest
            </Button>
            <Button
              as="a"
              href={`/vote/${created.slug}`}
              variant="secondary"
              className="tw:pointer-events-none tw:opacity-50"
            >
              Preview
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="tw:mx-auto tw:w-full tw:max-w-[720px] tw:px-4 tw:min-h-screen tw:pb-32 tw:pt-24 tw:md:pb-24 tw:font-sans">
      <div className="tw:mb-5">
        <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
          New contest
        </span>
        <h1 className="tw:m-0! tw:text-[24px]! tw:font-[800]! tw:leading-[1.1]! tw:tracking-[-0.02em]! tw:text-ink!">
          Set up your contest
        </h1>
        <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
          Saved as a draft first. Nothing goes live until you publish.
        </span>
      </div>

      <form onSubmit={submit} className="tw:flex tw:flex-col tw:gap-4">
        <CoverPicker
          cover={cover}
          uploading={coverUploading}
          onPick={pickCover}
          onRemove={() => setCover(null)}
        />

        <Field label="Contest title">
          <Input value={form.title} onChange={set("title")} required maxLength={120} placeholder="Face of Lagos" />
        </Field>

        <Field label="Subtitle" hint="Optional one-liner under the title.">
          <Input value={form.subtitle} onChange={set("subtitle")} maxLength={160} />
        </Field>

        <Field label="About this contest">
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={3}
            className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent"
          />
        </Field>

        <Field label="Rules" hint="Required before publishing. Contestants accept these when they enter.">
          <textarea
            value={form.rules}
            onChange={set("rules")}
            rows={4}
            className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent"
          />
        </Field>

        {/* Rules say how the contest is judged; terms are what a contestant
            AGREES to. The API refuses an entry without the tick once these are
            written (ContestEntryController:107-112), so this field is what
            makes the agreement possible at all. */}
        <Field
          label="Terms and conditions"
          hint="Optional. What a contestant is agreeing to when they enter (ownership of the media, rights, prizes, conduct)."
        >
          <textarea
            value={form.terms}
            onChange={set("terms")}
            rows={5}
            maxLength={20000}
            className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-3 tw:text-[14px] tw:text-ink tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent"
          />
        </Field>

        <span className="tw:flex tw:items-start tw:gap-1.5 tw:text-[11px] tw:leading-[1.4] tw:text-ink-muted">
          <ShieldCheck className="tw:mt-0.5 tw:size-3.5 tw:shrink-0" aria-hidden="true" />
          If you write terms here, nobody can enter without ticking that they accept them — and we
          record when they did.
        </span>

        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-2">
          <Field label="Price per vote" hint="Minimum ₦100. Locked once the first vote is cast.">
            <Input
              type="number"
              min={100}
              step="50"
              value={form.vote_price}
              onChange={set("vote_price")}
              required
              placeholder="1000"
            />
          </Field>

          <Field label="Who can see vote counts">
            <select
              value={form.vote_visibility}
              onChange={set("vote_visibility")}
              className="tw:h-[46px] tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[14px] tw:text-ink"
            >
              <option value="everyone">Everyone</option>
              <option value="contestants">Contestants only</option>
              <option value="nobody">Nobody — show gaps only</option>
            </select>
          </Field>

          <Field label="Entries close">
            <Input type="datetime-local" value={form.entries_close_at} onChange={set("entries_close_at")} />
          </Field>

          <Field label="Voting closes" hint="Must be after entries close.">
            <Input type="datetime-local" value={form.voting_close_at} onChange={set("voting_close_at")} />
          </Field>
        </div>

        <label className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-ink">
          <input
            type="checkbox"
            checked={form.is_refundable}
            onChange={set("is_refundable")}
            className="tw:size-4 tw:accent-accent"
          />
          Votes are refundable until voting closes
        </label>

        <Card className="tw:p-4">
          <span className="tw:block tw:text-[14px] tw:font-semibold tw:text-ink">Prizes</span>
          <span className="tw:block tw:mt-1 tw:text-[12px] tw:text-muted">
            A single position, a range, or both — "1st" and "2nd–10th" can sit side by side.
          </span>

          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
            {prizes.map((prize, index) => {
              const from = Number(prize.rank_from) || 0;
              const to = prize.rank_to === "" ? from : Number(prize.rank_to) || 0;
              const label =
                from <= 0
                  ? "New place"
                  : to > from
                    ? `${RANK(from)} – ${RANK(to)} place`
                    : `${RANK(from)} place`;

              return (
                <div
                  key={index}
                  className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper tw:p-3"
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                    <span className="tw:text-[13px] tw:font-semibold tw:text-ink">{label}</span>
                    {prizes.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setPrizes((prev) => prev.filter((_, i) => i !== index))}
                        className="tw:rounded-full tw:px-2 tw:py-1 tw:text-[12px] tw:font-medium tw:text-muted tw:hover:text-danger"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  {/* Three tight fields, one per line label — the old row tried to
                      fit place, range, a title and an amount side by side and
                      collapsed into a column of full-width inputs. */}
                  <div className="tw:mt-2 tw:grid tw:grid-cols-3 tw:gap-2">
                    <Field label="Place">
                      <Input
                        type="number"
                        min={1}
                        value={prize.rank_from}
                        onChange={(event) => updatePrize(index, "rank_from", event.target.value)}
                        placeholder="1"
                      />
                    </Field>
                    <Field label="To (optional)">
                      <Input
                        type="number"
                        min={1}
                        value={prize.rank_to}
                        onChange={(event) => updatePrize(index, "rank_to", event.target.value)}
                        placeholder="same"
                      />
                    </Field>
                    <Field label="Amount">
                      <Input
                        type="number"
                        min={0}
                        value={prize.amount}
                        onChange={(event) => updatePrize(index, "amount", event.target.value)}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          {prizeProblem ? (
            <span className="tw:mt-2 tw:block tw:text-[12px] tw:font-medium tw:text-danger">
              {prizeProblem}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tw:mt-3"
            onClick={() =>
              setPrizes((prev) => [
                ...prev,
                { rank_from: String(Number(prev[prev.length - 1]?.rank_to || prev[prev.length - 1]?.rank_from || 1) + 1), rank_to: "", amount: "" },
              ])
            }
          >
            Add another place
          </Button>
        </Card>

        <Button type="submit" loading={saving} disabled={Boolean(prizeProblem)}>
          Save draft
        </Button>
      </form>
    </div>
  );
}
