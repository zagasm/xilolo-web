import { useState } from "react";
import { Button, Modal } from "../../../component/ui";
import { showError, showSuccess } from "../../../component/ui/toast";
import { deleteContest } from "../../../api/contestApi";
import { useAuth } from "../../auth/AuthContext";

/**
 * Delete a contest.
 *
 * Only ever offered for a contest with zero votes — the API enforces the same
 * rule, so this sheet cannot talk someone into something that will be refused.
 * The copy says plainly what goes and why the option disappears later.
 */
export default function DeleteContestSheet({ contest, open, onClose, onDeleted }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);

    try {
      await deleteContest(contest.id, token);
      showSuccess("Contest deleted.");
      onDeleted?.();
      onClose?.();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      showError(first || err?.response?.data?.message || "That contest could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete this contest?">
      <div className="tw:flex tw:flex-col tw:gap-4">
        <span className="tw:block tw:text-[13px] tw:leading-relaxed tw:text-muted">
          <strong className="tw:font-semibold tw:text-ink">{contest?.title}</strong> and everything
          attached to it — entries, prizes, artwork — will be removed. This cannot be undone.
        </span>

        <span className="tw:block tw:rounded-card tw:border tw:border-hairline tw:bg-inner tw:p-3 tw:text-[12px] tw:leading-relaxed tw:text-muted">
          Deleting is only possible while nobody has voted. Once the first vote is paid for, the
          contest can only be cancelled, which refunds voters and keeps the record.
        </span>

        <div className="tw:flex tw:gap-2">
          <Button variant="ghost" size="md" onClick={onClose} className="tw:flex-1">
            Keep it
          </Button>
          <Button variant="danger" size="md" loading={busy} onClick={confirm} className="tw:flex-1">
            Delete contest
          </Button>
        </div>
      </div>
    </Modal>
  );
}
