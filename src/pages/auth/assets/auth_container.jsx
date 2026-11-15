import React from "react";
import { Link } from "react-router-dom";
import "./style.css";
import "./auth-shell.css";

/**
 * Auth shell — the single presentation wrapper shared by sign-in, sign-up,
 * password reset, change-password and code verification.
 *
 * Shape (founder decision 2026-11-15): a narrow centred card on paper, brand
 * wordmark above it, identical at every width — no split panel, no sidebar.
 *
 * Why the markup is plain instead of the old bootstrap row/col stack: the
 * template's grid carried -15px row margins and 15px column padding, which is
 * what made the card jump width between 1024-1199px and clip on a phone. A
 * flex column with one explicitly-capped child has no breakpoint that can
 * surprise it.
 *
 * Form behaviour is NOT defined here. Every screen still owns its own state,
 * handlers, endpoints and field attributes; this file only decides what the
 * outside of the form looks like.
 */
function AuthContainer({
  title,
  description,
  children,
  footer,
  header,
  haveAccount,
  privacy,
  socialSlot,
}) {
  return (
    <div className="auth-shell tw:relative tw:w-full tw:bg-paper tw:font-sans tw:text-ink">
      {/* One soft tint, same treatment as the content pages. No blur stacks. */}
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[360px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(22,144,156,0.10),rgba(22,144,156,0)_70%)]"
      />

      {/* Height is owned by AuthLayout (flex column, min-h-screen, content flex-1),
          NOT here — a second min-h-screen inside the flex child double-counts the
          viewport and pushes the compact footer below the fold. */}
      <div className="tw:relative tw:z-10 tw:flex tw:w-full tw:flex-col tw:items-center tw:justify-center tw:px-4 tw:py-8">
        <div
          className="tw:w-full"
          style={{ maxWidth: "min(420px, calc(100vw - 32px))", boxSizing: "border-box" }}
        >
          <div className="tw:mb-6 tw:flex tw:justify-center">
            <Link to="/" aria-label="Xilolo home">
              <img
                src="/logo.png"
                alt="Xilolo"
                className="tw:h-8 tw:w-auto tw:object-contain tw:md:h-9"
              />
            </Link>
          </div>

          <div className="auth-card tw:rounded-[18px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-6 tw:py-7 tw:md:px-8 tw:md:py-8">
            {header && (
              <div className="tw:mb-6 tw:text-center">
                <h1 className="tw:m-0! tw:font-display tw:text-[26px] tw:font-bold tw:leading-[1.15] tw:tracking-[-0.02em] tw:text-ink!">
                  {title}
                </h1>
                {description ? (
                  <p className="tw:mt-2! tw:mb-0! tw:text-[13.5px] tw:leading-relaxed tw:text-muted!">
                    {description}
                  </p>
                ) : null}
              </div>
            )}

            {children}

            {footer && socialSlot ? (
              <div className="tw:mt-6">
                <div className="tw:mb-4 tw:flex tw:items-center tw:gap-3">
                  <span className="tw:h-px tw:flex-1 tw:bg-hairline" />
                  <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.08em] tw:text-muted">
                    or
                  </span>
                  <span className="tw:h-px tw:flex-1 tw:bg-hairline" />
                </div>
                {socialSlot}
              </div>
            ) : null}
          </div>

          {haveAccount ? (
            <p className="tw:mt-5! tw:mb-0! tw:text-center tw:text-[13.5px] tw:text-muted-strong!">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="tw:font-semibold tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
              >
                Sign up
              </Link>
            </p>
          ) : (
            <p className="tw:mt-5! tw:mb-0! tw:text-center tw:text-[13.5px] tw:text-muted-strong!">
              Have an account?{" "}
              <Link
                to="/auth/signin"
                className="tw:font-semibold tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
              >
                Sign in
              </Link>
            </p>
          )}

          {privacy ? (
            <p className="tw:mt-3! tw:mb-0! tw:px-2 tw:text-center tw:text-[11.5px] tw:leading-relaxed tw:text-muted!">
              By continuing, you agree to our{" "}
              <Link to="/terms-of-service" className="tw:underline! tw:text-muted-strong! tw:hover:text-accent-deep">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="tw:underline! tw:text-muted-strong! tw:hover:text-accent-deep">
                Privacy Policy
              </Link>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AuthContainer;
