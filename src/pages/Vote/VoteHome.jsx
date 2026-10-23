import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Chip, Input, Skeleton } from "../../component/ui";
import { formatCount } from "../../utils/countFormat";
import { listContests, getContestCategories } from "../../api/contestApi";
import { useAuth } from "../auth/AuthContext";
import ContestCard from "./components/ContestCard";

/**
 * Vote home.
 *
 * Requires an account (the API answers 401 without one), so this page assumes
 * a session. Browsing by shared link is handled on the contest page instead.
 */
export default function VoteHome() {
  const { token } = useAuth();
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
        const { items } = await listContests(
          { q: searchTerm, category: category?.slug },
          token
        );
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
    <div className="tw:mx-auto tw:w-full tw:max-w-[1180px] tw:px-4 tw:pb-16 tw:pt-6 sm:tw:px-6">
      <header className="tw:flex tw:flex-col tw:gap-2">
        <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-accent-deep">
          Vote
        </span>
        <h1 className="tw:m-0 tw:text-[26px] tw:font-semibold tw:leading-tight tw:text-ink sm:tw:text-[32px]">
          Vote for who you believe in
        </h1>
        <span className="tw:block tw:text-[14px] tw:text-muted">
          Contests from organisers across Xilolo. Every vote is a real vote — and every receipt is
          yours to keep.
        </span>
      </header>

      <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a contest, an organiser, or a contestant"
          aria-label="Search contests"
        />

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
        <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:gap-4 sm:tw:grid-cols-2 lg:tw:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="tw:h-[286px] tw:w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="tw:mt-8 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-6 tw:text-center">
          <span className="tw:block tw:text-[15px] tw:font-semibold tw:text-ink">{error}</span>
          <Button type="button" variant="secondary" className="tw:mt-4" onClick={() => load(query)}>
            Try again
          </Button>
        </div>
      ) : contests.length === 0 ? (
        <div className="tw:mt-8 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-8 tw:text-center">
          <span className="tw:block tw:text-[16px] tw:font-semibold tw:text-ink">
            {query ? "No contest matches that search" : "No contests are running yet"}
          </span>
          <span className="tw:mt-1 tw:block tw:text-[13px] tw:text-muted">
            {query
              ? "Try a contestant's name, the organiser, or a shorter word."
              : "When an organiser opens a contest it will appear here."}
          </span>
        </div>
      ) : (
        <>
          {featured.length > 0 && !query ? (
            <section className="tw:mt-6">
              <span className="tw:block tw:text-[13px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-muted">
                Trending
              </span>
              <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-4 sm:tw:grid-cols-2">
                {featured.map((contest) => (
                  <ContestCard key={contest.slug} contest={contest} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="tw:mt-6">
            {featured.length > 0 && rest.length > 0 ? (
              <span className="tw:block tw:text-[13px] tw:font-semibold tw:uppercase tw:tracking-[0.06em] tw:text-muted">
                All contests
              </span>
            ) : null}

            <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-4 sm:tw:grid-cols-2 lg:tw:grid-cols-3">
              {(rest.length > 0 ? rest : featured).map((contest) => (
                <ContestCard key={contest.slug} contest={contest} />
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="tw:mt-10">
        <Link
          to="/organiser/contests/new"
          className="tw:text-[13px] tw:font-semibold tw:text-accent-deep tw:no-underline"
        >
          Host your own contest
        </Link>
      </footer>
    </div>
  );
}
