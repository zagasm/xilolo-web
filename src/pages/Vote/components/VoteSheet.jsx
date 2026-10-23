import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, Spinner } from "../../../component/ui";
import { showError } from "../../../component/ui/toast";
import { castVotes, getVoteQuote } from "../../../api/contestApi";
import { money } from "./ContestCard";

const PRESETS = [1, 5, 10, 25, 50];

/**
 * The vote sheet.
 *
 * The price shown is always the server's quote — this component never does the
 * arithmetic, because the day the two disagree is the day somebody is charged
 * something they did not agree to.
 *
 * One idempotency key per sheet: if the buyer double-taps or the network
 * retries, the backend returns the same receipt instead of charging twice.
 */
export default function VoteSheet({ open, onClose, contest, entry, token, onVoted }) {
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    // A new key per opened sheet, not per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, entry?.entry_id]
  );

  useEffect(() => {
    if (!open) {
      setReceipt(null);
      setError(null);
      setQuantity(1);
      setQuote(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !entry || !token || receipt) return;

    let cancelled = false;
    setLoadingQuote(true);
    setError(null);

    getVoteQuote(contest.slug, entry.entry_id, quantity, token)
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err?.response?.data?.errors?.wallet?.[0] ||
            err?.response?.data?.message ||
            "Could not price that vote right now.";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, entry, contest?.slug, quantity, token, receipt]);

  const shortfall = Number(quote?.topup_needed || 0);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const data = await castVotes(
        contest.slug,
        { entryId: entry.entry_id, quantity, idempotencyKey },
        token
      );
      setReceipt(data);
      onVoted?.(data);
    } catch (err) {
      const message =
        err?.response?.data?.errors?.wallet?.[0] ||
        err?.response?.data?.message ||
        "That vote did not go through.";
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={receipt ? "Vote confirmed" : "Cast your vote"}>
      {receipt ? (
        <div className="tw:flex tw:flex-col tw:gap-4">
          <div className="tw:rounded-card tw:bg-accent/10 tw:p-4">
            <span className="tw:block tw:text-[13px] tw:text-muted-strong">You voted for</span>
            <span className="tw:mt-1 tw:block tw:text-[17px] tw:font-semibold tw:text-ink">
              {receipt.entry?.display_name}
            </span>
            <span className="tw:mt-2 tw:block tw:text-[14px] tw:text-ink">
              {receipt.quantity} {receipt.quantity === 1 ? "vote" : "votes"} ·{" "}
              {money(receipt.amount, receipt.currency)}
            </span>
          </div>

          <div>
            <span className="tw:block tw:text-[12px] tw:uppercase tw:tracking-[0.06em] tw:text-muted">
              Receipt
            </span>
            <span className="tw:mt-1 tw:block tw:break-all tw:font-mono tw:text-[12px] tw:text-ink">
              {receipt.reference}
            </span>
            <span className="tw:mt-2 tw:block tw:text-[12px] tw:text-muted">
              Keep this reference. Anyone can verify it at /vote/receipt/{receipt.reference} — it
              proves your vote without revealing who you are.
            </span>
          </div>

          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <div>
              <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-ink">
                {entry?.display_name}
              </span>
              <span className="tw:mt-0.5 tw:block tw:text-[12px] tw:text-muted">
                {contest.vote_price ? `${money(contest.vote_price, contest.currency)} per vote` : ""}
              </span>
            </div>
            {quote ? (
              <span className="tw:text-[13px] tw:text-muted">
                Balance {money(quote.wallet_balance, quote.currency)}
              </span>
            ) : null}
          </div>

          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuantity(n)}
                className={`tw:rounded-pill tw:border tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium tw:transition-colors ${
                  quantity === n
                    ? "tw:border-accent tw:bg-accent tw:text-ink"
                    : "tw:border-hairline tw:bg-paper-raised tw:text-ink tw:hover:bg-inner"
                }`}
              >
                {n}
              </button>
            ))}

            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => {
                const next = parseInt(event.target.value, 10);
                setQuantity(Number.isFinite(next) && next > 0 ? next : 1);
              }}
              aria-label="Number of votes"
              className="tw:h-[34px] tw:w-20 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:text-[13px] tw:text-ink tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-accent"
            />
          </div>

          <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-inner/60 tw:p-3">
            <div className="tw:flex tw:items-center tw:justify-between">
              <span className="tw:text-[13px] tw:text-muted">You pay</span>
              <span className="tw:text-[18px] tw:font-semibold tw:text-ink">
                {loadingQuote && !quote ? <Spinner /> : money(quote?.total ?? 0, quote?.currency)}
              </span>
            </div>

            {shortfall > 0 ? (
              <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-3">
                <span className="tw:text-[12px] tw:text-danger">
                  {money(shortfall, quote?.currency)} short in your wallet
                </span>
                <Link
                  to="/profile"
                  className="tw:text-[12px] tw:font-semibold tw:text-accent-deep tw:no-underline"
                >
                  Add money
                </Link>
              </div>
            ) : null}
          </div>

          <span className="tw:text-[12px] tw:text-muted">
            {contest.is_refundable
              ? "Refundable until voting closes."
              : "Non-refundable once cast."}{" "}
            You are paying for a vote, not for a chance to win — the winner is whoever has the most
            votes.
          </span>

          {error ? <span className="tw:text-[13px] tw:text-danger">{error}</span> : null}

          <Button
            type="button"
            onClick={submit}
            loading={submitting}
            disabled={loadingQuote || !quote || shortfall > 0}
          >
            {quantity === 1 ? "Cast 1 vote" : `Cast ${quantity} votes`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
