import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Chip, EmptyState, Input, SectionHeading, Skeleton } from "../../component/ui";
import { Search, Trophy } from "lucide-react";
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

  return (
    <div className="tw:w-full tw:bg-paper tw:pb-24 tw:pt-24 tw:font-sans">
      <div className={HOME_CONTAINER}>
        <header className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:pb-4 tw:pt-2">
          <div className="tw:max-w-[560px]">
            <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:text-accent-deep">
              Vote
            </span>
            <h1 className="tw:m-0 tw:mt-1 tw:text-[28px] tw:font-semibold tw:leading-[1.15] tw:tracking-[-0.01em] tw:text-ink md:tw:text-[34px]">
              Vote for who you believe in
            </h1>
            <span className="tw:mt-2 tw:block tw:text-[14px] tw:leading-relaxed tw:text-muted">
              Explore contests, back a contestant, and keep every receipt. Every vote is a real
              vote.
            </span>
          </div>

          {isOrganiser ? (
            <Button
              as={Link}
              to="/organiser/contests/new"
              variant="secondary"
              size="sm"
              className="tw:mt-1 tw:shrink-0"
            >
              Create a contest
            </Button>
          ) : null}
        </header>

        <div className="tw:flex tw:flex-col tw:gap-3 tw:pb-5">
          <div className="tw:relative tw:w-full tw:max-w-[520px]">
            <Search
              className="tw:pointer-events-none tw:absolute tw:left-3.5 tw:top-1/2 tw:size-4 tw:-translate-y-1/2 tw:text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a contest, organiser or contestant"
              aria-label="Search contests"
              className="tw:pl-10!"
            />
          </div>

          {categories.length > 0 ? (
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              <Chip active={category === null} onClick={() => setCategory(null)}>
                All
              </Chip>
              {categories.map((item) => (
                <Chip
                  key={item.slug}
                  active={category?.slug === item.slug}
                  onClick={() => setCategory(item)}
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
            {featured.length > 0 && !query ? (
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

            <section>
              {featured.length > 0 && rest.length > 0 ? (
                <SectionHeading eyebrow="Keep voting" title="All contests" />
              ) : null}

              <div className={featured.length > 0 && rest.length > 0 ? "tw:mt-4" : ""}>
                <FeedGrid>
                  {(rest.length > 0 ? rest : featured).map((contest) => (
                    <ContestCard key={contest.slug} contest={contest} />
                  ))}
                </FeedGrid>
              </div>
            </section>
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
