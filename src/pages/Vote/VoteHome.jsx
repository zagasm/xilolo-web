import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Chip, EmptyState, SectionHeading, Skeleton } from "../../component/ui";
import { Search, Trophy, X } from "lucide-react";
import { listContests, getContestCategories } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import { FeedGrid, HOME_CONTAINER } from "../Home/index.jsx";
import ContestCard from "./components/ContestCard";

/**
 * Vote home.
 *
 * Uses the same shell as the event feed — paper background, pt-24 so the fixed
 * navbar never covers the header, the shared container width and feed grid —
 * so the vote section reads as part of Xilolo rather than a page bolted on.
 */
export default function VoteHome() {
  const { token, user } = useAuth();
  // Only a verified organiser can create a contest, so only they see the door
  // to it. Everyone else is here to explore, enter and vote.
  const isOrganiser = Boolean(user?.is_organiser_verified);
  const [contests, setContests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (searchTerm = "") => {
      setLoading(true);
      setError(null);

      try {
        const { items } = await listContests({ q: searchTerm, category: category?.slug }, token);
        setContests(items);
      } catch (err) {
        setError("Contests could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    },
    [category?.slug, token]
  );

  useEffect(() => {
    getContestCategories(token)
      .then((items) => setCategories(items || []))
      .catch(() => setCategories([]));
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 320 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  const featured = useMemo(() => contests.filter((contest) => contest.trending), [contests]);
  const rest = useMemo(() => contests.filter((contest) => !contest.trending), [contests]);

  // One contest appears once. A trending row is only worth its own section
  // when at least one other contest follows it.
  const showTrending = !query && featured.length > 0 && rest.length > 0;
  const showAll = showTrending || (!showTrending && contests.length > 0);

  return (
    <div className="tw:w-full tw:bg-paper tw:pb-24 tw:pt-24 tw:font-sans">
      <div className={HOME_CONTAINER}>
        {/* Header follows the app's search screen: one 24px line, one 13px
            line, 5px apart. No eyebrow stack, no oversized display type — on a
            phone the old block ate half the first screen before a single
            contest appeared. */}
        <header className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:pt-1">
          <div className="tw:min-w-0">
            <h1 className="tw:m-0 tw:text-[24px] tw:font-[800] tw:leading-[1.05] tw:tracking-[-0.02em] tw:text-ink">
              Contests
            </h1>
            <span className="tw:mt-[5px] tw:block tw:text-[13px] tw:font-medium tw:text-muted">
              Vote for who you believe in
            </span>
          </div>

          {isOrganiser ? (
            <Button
              as={Link}
              to="/organiser/contests/new"
              variant="secondary"
              size="sm"
              className="tw:mt-0.5 tw:shrink-0"
            >
              Create
            </Button>
          ) : null}
        </header>

        {/* Search: 56px pill, icon inside on the left, clear button when there
            is text — the app's field anatomy rather than a form input dropped
            into the page. */}
        <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-3">
          <div className="tw:relative tw:w-full">
            <Search
              className="tw:pointer-events-none tw:absolute tw:left-[14px] tw:top-1/2 tw:size-[21px] tw:-translate-y-1/2 tw:text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contests, organisers or contestants"
              aria-label="Search contests"
              className="tw:h-[52px] tw:w-full tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:pl-[44px] tw:pr-[44px] tw:text-[15px] tw:font-medium tw:text-ink tw:outline-none tw:placeholder:text-muted tw:focus:border-accent/60 tw:focus:ring-2 tw:focus:ring-accent/20 [&::-webkit-search-cancel-button]:tw:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="tw:absolute tw:right-3 tw:top-1/2 tw:flex tw:size-7 tw:-translate-y-1/2 tw:items-center tw:justify-center tw:rounded-full tw:bg-inner tw:text-muted tw:transition-colors tw:hover:text-ink"
              >
                <X className="tw:size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {categories.length > 0 ? (
            <div className="tw:-mx-4 tw:flex tw:gap-2 tw:overflow-x-auto tw:px-4 tw:pb-1 tw-no-scrollbar">
              <Chip active={category === null} onClick={() => setCategory(null)} className="tw:shrink-0">
                All
              </Chip>
              {categories.map((item) => (
                <Chip
                  key={item.slug}
                  active={category?.slug === item.slug}
                  onClick={() => setCategory(item)}
                  className="tw:shrink-0"
                >
                  {item.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        {loading && contests.length === 0 ? (
          <FeedGrid>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="tw:h-[320px] tw:w-full" />
            ))}
          </FeedGrid>
        ) : error ? (
          <EmptyState
            icon={Trophy}
            title={error}
            body="Check your connection and try again."
            action={
              <Button variant="secondary" size="md" onClick={() => load(query)}>
                Retry
              </Button>
            }
          />
        ) : contests.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={query ? "No contest matches that search" : "No contests are running yet"}
            body={
              query
                ? "Try a contestant's name, the organiser, or a shorter word."
                : "New contests appear here as soon as organisers open them. Check back soon."
            }
          />
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-8">
            {/* Trending gets its own row only when there is something else to
                follow it. Previously the grid fell back to `featured` when the
                rest was empty, so a lone contest rendered twice. */}
            {showTrending ? (
              <section>
                <SectionHeading eyebrow="Right now" title="Trending contests" />
                <div className="tw:mt-4">
                  <FeedGrid>
                    {featured.map((contest) => (
                      <ContestCard key={contest.slug} contest={contest} />
                    ))}
                  </FeedGrid>
                </div>
              </section>
            ) : null}

            {showAll ? (
              <section>
                {showTrending ? (
                  <SectionHeading eyebrow="Keep voting" title="All contests" />
                ) : null}

                <div className={showTrending ? "tw:mt-4" : ""}>
                  <FeedGrid>
                    {(showTrending ? rest : contests).map((contest) => (
                      <ContestCard key={contest.slug} contest={contest} />
                    ))}
                  </FeedGrid>
                </div>
              </section>
            ) : null}
          </div>
        )}

        <footer className="tw:mt-10 tw:border-t tw:border-hairline tw:pt-4">
          <span className="tw:block tw:text-[12px] tw:text-muted">
            Votes are paid and receipted. If a contest is cancelled, votes are refunded to your
            wallet.
          </span>
        </footer>
      </div>
    </div>
  );
}
