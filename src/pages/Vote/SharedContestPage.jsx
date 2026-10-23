import { useParams } from "react-router-dom";
import ContestPage from "./ContestPage";

/**
 * A contest opened from a shared link, by someone with no account.
 *
 * The token in the URL is the whole permission: it opens this one contest and
 * nothing else. No listing, no search, no voting — the Vote buttons are
 * replaced by a sign-in prompt.
 */
export default function SharedContestPage() {
  const { token } = useParams();

  return <ContestPage sharedToken={token} />;
}
