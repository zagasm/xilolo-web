import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../component/ui";

/**
 * 404.
 *
 * The old page leaned on legacy bootstrap classes (`container`, `vh-100`) that
 * this build no longer ships, so an unknown route rendered as an almost blank
 * white screen — which is how a bad link looked like a broken app. This is the
 * design system's own language: paper, logo, one clear way out.
 */
export function Error404() {
  const navigate = useNavigate();

  return (
    <div className="tw:flex tw:min-h-screen tw:w-full tw:items-center tw:justify-center tw:bg-paper tw:px-4 tw:py-24 tw:font-sans">
      <div className="tw:w-full tw:max-w-[440px] tw:text-center">
        <img src="/logo.png" alt="Xilolo" className="tw:mx-auto tw:w-[148px]" />

        <h1 className="tw:m-0! tw:mt-6! tw:text-[26px]! tw:font-[800]! tw:leading-[1.1]! tw:tracking-[-0.02em]! tw:text-ink!">
          This page is not here
        </h1>
        <p className="tw:mt-2 tw:text-[14px] tw:leading-relaxed tw:text-muted">
          The link may be old, or the page may have moved. Nothing is broken on your account.
        </p>

        <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-2 sm:tw:flex-row sm:tw:justify-center">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button as={Link} to="/feed">
            Discover events
          </Button>
        </div>

        <span className="tw:mt-6 tw:block tw:text-[12px] tw:text-muted">
          Need help?{" "}
          <a href="mailto:support@xilolo.com" className="tw:font-semibold tw:text-accent-deep">
            support@xilolo.com
          </a>
        </span>
      </div>
    </div>
  );
}

export default Error404;
