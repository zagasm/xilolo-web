import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Skeleton } from "../../component/ui";
import { getReceipt } from "../../api/contestApi";
import { money } from "./components/ContestCard";

/**
 * Public receipt verifier.
 *
 * Anyone holding a receipt reference can confirm a vote is real. Nobody can see
 * who paid — the payload has no voter on it, by design.
 */
export default function ReceiptPage() {
  const { reference } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    getReceipt(reference)
      .then((data) => {
        if (cancelled) return;
        setReceipt(data);
        setState("found");
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (state === "loading") {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[520px] tw:px-4 tw:py-10">
        <Skeleton className="tw:h-[180px] tw:w-full" />
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div className="tw:mx-auto tw:w-full tw:max-w-[520px] tw:px-4 tw:py-16 tw:text-center">
        <span className="tw:block tw:text-[17px] tw:font-semibold tw:text-ink">
          No vote exists with that reference
        </span>
        <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
          Check the reference for a typo — receipts look like VOTE-8F3A2C…
        </span>
        <Button as={Link} to="/vote" variant="secondary" className="tw:mt-5">
          Back to Vote
        </Button>
      </div>
    );
  }

  return (
    <div className="tw:mx-auto tw:w-full tw:max-w-[520px] tw:px-4 tw:py-10">
      <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-5">
        <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
          Vote receipt
        </span>

        <span className="tw:mt-2 tw:block tw:text-[22px] tw:font-semibold tw:text-ink">
          {receipt.valid ? "This vote is valid" : `Status: ${receipt.status}`}
        </span>

        <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2">
          <Row label="Contest" value={receipt.contest?.title} />
          <Row label="Contestant" value={receipt.entry?.display_name} />
          <Row
            label="Votes"
            value={`${receipt.quantity} ${receipt.quantity === 1 ? "vote" : "votes"} · ${money(
              receipt.amount,
              receipt.currency
            )}`}
          />
          <Row label="Reference" value={receipt.reference} mono />
          {receipt.cast_at ? (
            <Row label="Cast" value={new Date(receipt.cast_at).toLocaleString()} />
          ) : null}
        </div>

        <span className="tw:mt-4 tw:block tw:text-[12px] tw:text-muted">
          Xilolo verifies the vote, not the voter. Who cast it stays private.
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
      <span className="tw:text-[12px] tw:text-muted">{label}</span>
      <span
        className={`tw:text-right tw:text-[13px] tw:font-medium tw:text-ink ${
          mono ? "tw:break-all tw:font-mono tw:text-[12px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
