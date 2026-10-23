import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input } from "../../component/ui";
import { showError, showSuccess } from "../../component/ui/toast";
import { createContest, publishContest } from "../../api/contestApi";
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
    vote_price: "",
    vote_visibility: "everyone",
    is_refundable: false,
    entries_close_at: "",
    voting_close_at: "",
    prize_summary: "",
  });

  const [prizes, setPrizes] = useState([{ rank_from: 1, rank_to: 1, title: "", amount: "" }]);

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrize = (index, key, value) => {
    setPrizes((prev) => prev.map((prize, i) => (i === index ? { ...prize, [key]: value } : prize)));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        rules: form.rules.trim() || null,
        vote_price: Number(form.vote_price),
        vote_visibility: form.vote_visibility,
        is_refundable: form.is_refundable,
        entries_close_at: form.entries_close_at || null,
        voting_close_at: form.voting_close_at || null,
        prize_summary: form.prize_summary.trim() || null,
        prizes: prizes
          .filter((prize) => prize.title.trim())
          .map((prize) => ({
            rank_from: Number(prize.rank_from),
            rank_to: Number(prize.rank_to),
            title: prize.title.trim(),
            amount: prize.amount === "" ? null : Number(prize.amount),
          })),
      };

      const contest = await createContest(payload, token);
      setCreated(contest);
      showSuccess("Contest saved as a draft.");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(first || "That contest could not be saved.");
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
      showError(first || "The contest could not be published yet.");
    } finally {
      setPublishing(false);
    }
  };

  if (created) {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[640px] tw:px-4 tw:py-10">
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
    <div className="tw:mx-auto tw:w-full tw:max-w-[720px] tw:px-4 tw:pb-20 tw:pt-6">
      <header className="tw:mb-5">
        <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
          New contest
        </span>
        <h1 className="tw:m-0 tw:mt-1 tw:text-[24px] tw:font-semibold tw:text-ink">
          Set up your contest
        </h1>
        <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
          Saved as a draft first. Nothing goes live until you publish.
        </span>
      </header>

      <form onSubmit={submit} className="tw:flex tw:flex-col tw:gap-4">
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

        <div className="tw:grid tw:grid-cols-1 tw:gap-4 sm:tw:grid-cols-2">
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

          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3">
            {prizes.map((prize, index) => (
              <div key={index} className="tw:grid tw:grid-cols-12 tw:gap-2">
                <Input
                  type="number"
                  min={1}
                  value={prize.rank_from}
                  onChange={(event) => updatePrize(index, "rank_from", event.target.value)}
                  aria-label="From position"
                  className="tw:col-span-2"
                />
                <Input
                  type="number"
                  min={1}
                  value={prize.rank_to}
                  onChange={(event) => updatePrize(index, "rank_to", event.target.value)}
                  aria-label="To position"
                  className="tw:col-span-2"
                />
                <Input
                  value={prize.title}
                  onChange={(event) => updatePrize(index, "title", event.target.value)}
                  placeholder="Winner"
                  className="tw:col-span-5"
                />
                <Input
                  type="number"
                  min={0}
                  value={prize.amount}
                  onChange={(event) => updatePrize(index, "amount", event.target.value)}
                  placeholder="Amount"
                  className="tw:col-span-3"
                />
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tw:mt-3"
            onClick={() => setPrizes((prev) => [...prev, { rank_from: 2, rank_to: 2, title: "", amount: "" }])}
          >
            Add a prize
          </Button>
        </Card>

        <Button type="submit" loading={saving}>
          Save draft
        </Button>
      </form>
    </div>
  );
}
