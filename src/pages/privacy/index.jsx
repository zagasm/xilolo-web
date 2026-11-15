import React from "react";

/**
 * Xilolo Privacy Policy (/privacy-policy).
 *
 * Presentation only — every sentence, date, company name, jurisdiction, email
 * address and list item below is carried over verbatim from the previous page.
 * Nothing is added, merged or reworded.
 *
 * Design system: paper page, paper-raised card, hairline borders, 12px card
 * radius, pills, accent as a FILL only (accent text = accent-deep). The single
 * soft radial tint behind the hero is the only decorative layer; there are no
 * shadows on this page.
 *
 * `tw:pt-24` / `tw:md:pt-28` are deliberate: the fixed nav is 64px at base and
 * 72px at md while the layout only reserves 80px at lg, so without them the hero
 * sits under the nav below the lg breakpoint.
 *
 * NOTE ON `!`: the template stylesheets (src/assets/css/*) ship an unlayered
 * `a{color:inherit;text-decoration:none}` rule that outranks Tailwind's utility
 * layer, so anchor colour and underline must be pinned with the important
 * modifier. The values themselves are design-token correct — drop the `!`s once
 * the global anchor rule is neutralised.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="tw:relative tw:min-h-screen tw:bg-paper tw:font-sans tw:text-ink">
      <div
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:inset-x-0 tw:top-0 tw:h-[380px] tw:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(22,144,156,0.10),rgba(22,144,156,0)_70%)]"
      />

      <div className="tw:relative tw:z-10 tw:mx-auto tw:w-full tw:max-w-[1200px] tw:px-4 tw:pb-20 tw:pt-10 tw:md:px-8 tw:md:pt-14">
        {/* Top hero */}
        <div className="tw:mx-auto tw:mb-6 tw:w-full tw:max-w-[820px]">
          <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-accent-deep">Legal</span>

          <span className="tw:mt-4 tw:block tw:font-display tw:text-[34px] tw:leading-[1.1] tw:tracking-tight tw:font-semibold tw:text-ink tw:md:text-[46px]">
            Privacy Policy for Xilolo App
          </span>

          <p className="tw:mt-3 tw:max-w-[62ch] tw:text-[15px] tw:leading-relaxed tw:text-muted-strong tw:md:text-base">
            This Privacy Policy explains how Xilolo Inc. collects, uses, shares,
            and protects your information when you use the Xilolo App.
          </p>

          <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:text-[13px] tw:md:text-sm tw:text-muted-strong">
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-1">
              <span className="tw:h-2 tw:w-2 tw:rounded-pill tw:bg-success" />
              Effective: <strong className="tw:ml-1">November 6, 2025</strong>
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-1">
              Company: <strong className="tw:ml-1">Xilolo Inc.</strong>
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:px-3 tw:py-1">
              Jurisdiction:
              <strong className="tw:ml-1">Federal Republic of Nigeria</strong>
            </span>
          </div>

          <div className="tw:mt-2 tw:text-[13px] tw:md:text-sm tw:text-muted">
            Contact:{" "}
            <a
              href="mailto:support@xilolo.com"
              className="tw:font-medium tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
            >
              support@xilolo.com
            </a>{" "}
            · Address:{" "}
            <span className="tw:font-medium">
              16192 Coastal Highway Lewes, Delaware 19958 Sussex County United
              States
            </span>
          </div>
        </div>

        {/* Main layout — a single reading column. The previous grid reserved a
            260px sidebar column that had no children, which squeezed the legal
            text into the narrow track at lg and up. */}
        <div className="tw:mx-auto tw:mt-8 tw:w-full tw:max-w-[820px]">
          {/* Content */}
          <div>
            <div className="tw:w-full tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-5 tw:md:p-8">
              <section className="tw:space-y-4 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                <p>
                  Welcome to Xilolo Inc.&apos;s comprehensive Privacy Policy for
                  the Xilolo App. As a provider of creative tools designed to
                  empower content creators, filmmakers, and collaborative teams
                  worldwide, we are committed to upholding high standards of
                  data privacy and protection. This policy outlines our
                  practices in a clear and detailed way, explaining how we
                  manage personal information so you can focus on your craft
                  while we handle your data responsibly.
                </p>

                <p>
                  This Privacy Policy applies exclusively to the Xilolo
                  App (&quot;Service&quot; or &quot;App&quot;), covering all
                  interactions including user registration, content creation,
                  collaboration features, monetization tools, and support
                  services. Xilolo Inc., incorporated under the laws of the
                  Federal Republic of Nigeria, operates from Asaba and adheres
                  to the Nigeria Data Protection Regulation (NDPR) 2019, as well
                  as international standards such as the General Data Protection
                  Regulation (GDPR) for users in the European Economic Area
                  (EEA), the California Consumer Privacy Act (CCPA) for
                  California residents, and other applicable global privacy
                  frameworks. This policy was last comprehensively reviewed and
                  updated on November 6, 2025. We will notify users of any
                  material changes through in-app notifications, email
                  communications, or prominent notices within the App.
                </p>

                <p>
                  For any inquiries, concerns, or to exercise your privacy
                  rights, you can contact our Data Protection Officer (DPO) at{" "}
                  <a
                    href="mailto:support@xilolo.com"
                    className="tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
                  >
                    support@xilolo.com
                  </a>
                  . We aim to respond to valid requests within one month,
                  extendable in limited cases as permitted by law. This policy
                  is provided in English; translated versions may be available
                  for convenience, but the English version will prevail if there
                  are differences.
                </p>
              </section>

              {/* 1. Information We Collect */}
              <section
                id="info-we-collect"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  1. Information We Collect: A Detailed Overview
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  At Xilolo, data collection is purposeful and limited. We
                  collect information necessary to deliver core functionalities
                  such as video editing, live streaming, collaborative project
                  management, and secure monetization, while minimizing
                  intrusion. Collection occurs with your explicit or implied
                  consent where required, and we apply privacy-by-design
                  principles.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.1 Account and Registration Data
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  When you create an account or log in via third-party
                  providers, we collect identifiers to establish and maintain
                  your user profile.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Personal Identifiers:</strong> Full legal name,
                    username, email address, mobile phone number, and a one-way
                    hashed password or biometric tokens (where supported).
                  </li>
                  <li>
                    <strong>Profile Customization:</strong> Optional biography,
                    professional credentials, profile avatars, external links,
                    and collaboration preferences.
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  <em>Source:</em> Directly from you during signup or profile
                  updates. <em>Legal Basis:</em> Performance of contract. We
                  retain this data for the duration of your active account plus
                  a 30-day grace period for recovery.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.2 Identity Verification and Compliance Information
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  For users engaging in monetized features, we implement KYC and
                  AML processes to comply with financial regulations.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Verification Elements:</strong> Date of birth,
                    government-issued ID, proof of address, and results from
                    verification services (such as liveness checks).
                  </li>
                  <li>
                    <strong>Compliance Records:</strong> Sanctions screening
                    flags, PEP status, and monitoring alerts.
                  </li>
                </ul>
                <div className="tw:mt-3 tw:rounded-card tw:border-l-2 tw:border-accent tw:bg-accent-soft tw:px-4 tw:py-3 tw:text-[15px] tw:leading-relaxed tw:text-body">
                  <strong>Scope Limitation:</strong> This data is collected only
                  when you opt into financial features and is not used for
                  marketing or unrelated analytics. Verification artifacts (such
                  as ID scans) are deleted after validation unless required for
                  audits.
                </div>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  <em>Source:</em> You and trusted verification partners.{" "}
                  <em>Legal Basis:</em> Legal obligation.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.3 Financial and Transactional Data
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We process limited financial metadata and delegate sensitive
                  details to certified payment processors.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Transaction Details:</strong> Purchase references,
                    amounts, currencies, statuses, timestamps, and merchant
                    fees.
                  </li>
                  <li>
                    <strong>Payout Information:</strong> Masked bank account
                    numbers, wallet identifiers, tax details, and invoice
                    histories.
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  <em>Source:</em> Payment gateways and your inputs.{" "}
                  <em>Legal Basis:</em> Contract performance and legal
                  obligation. We do not store full card or banking credentials.
                </p>

                <div className="tw:mt-4 tw:rounded-card tw:border tw:border-hairline tw:bg-paper tw:p-4 tw:text-[15px] tw:leading-relaxed tw:text-body">
                  <strong>Organizer payout percentages:</strong> For ticket
                  sales, Xilolo retains 10% for physical events and 40% for
                  online or hybrid events. For paid event manuals or materials,
                  Xilolo retains 15%. The remaining amount belongs to the
                  organizer, subject to refunds, reversals, and applicable
                  payment processing obligations.
                </div>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.4 Usage, Technical, and Device Data
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  To optimize performance and personalize the experience, we log
                  anonymized or pseudonymized operational data.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Device and Network:</strong> IP address, device
                    identifiers, OS, app version, screen resolution, and
                    similar.
                  </li>
                  <li>
                    <strong>Behavioral Logs:</strong> Session durations, feature
                    usage, search queries, error reports, and crash diagnostics.
                  </li>
                  <li>
                    <strong>Location Data:</strong> Approximate location derived
                    from IP; precise GPS only when explicitly enabled.
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  <em>Source:</em> Automatically collected via telemetry.{" "}
                  <em>Legal Basis:</em> Legitimate interests (service
                  improvement) with opt-out options.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.5 User-Generated Content and Metadata
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We store and process your content as instructed by you.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Core Assets:</strong> Video files, audio tracks,
                    thumbnails, project titles, descriptions, tags, and
                    schedules.
                  </li>
                  <li>
                    <strong>Metadata:</strong> File hashes, edit histories,
                    collaboration logs, and export formats.
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  <em>Source:</em> Your uploads and in-app creations.{" "}
                  <em>Legal Basis:</em> Performance of contract. Content remains
                  yours; we only host and process it as needed to provide the
                  Service.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.6 Communication and Interaction Records
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We keep records needed to provide support and collaboration
                  features.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Support Interactions:</strong> Email threads, in-app
                    chat transcripts, ticket IDs, and attachments.
                  </li>
                  <li>
                    <strong>Verification Aids:</strong> OTPs, MFA-related logs,
                    and consent records.
                  </li>
                  <li>
                    <strong>Collaboration Messages:</strong> Comments, invites,
                    and feedback within shared projects.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  1.7 Cookies, Local Storage, and Similar Technologies
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  These technologies support persistent functionality and
                  analytics, as described further in Section 10.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Categories:</strong> Strictly necessary,
                    performance, functional, and targeting (with consent).
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  In all cases, we pseudonymize data where feasible and conduct
                  Data Protection Impact Assessments for high-risk processing.
                </p>
              </section>

              {/* 2. How We Use Your Information */}
              <section
                id="how-we-use"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  2. How We Use Your Information: Purposeful and Transparent
                  Processing
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We process personal data in line with our mission to
                  democratize content creation. Each use is tied to a specific
                  objective and follows data minimization and accountability
                  principles. We do not use automated decision-making that
                  produces legal effects without human oversight.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  2.1 Enabling and Enhancing Service Delivery
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Account Management:</strong> Authenticating users,
                    syncing projects, and enforcing access controls.
                  </li>
                  <li>
                    <strong>Content Facilitation:</strong> Hosting uploads,
                    applying edits, rendering previews, and distributing streams
                    via CDNs.
                  </li>
                  <li>
                    <strong>Collaboration Tools:</strong> Matching users for
                    joint projects, routing invites, and versioning changes.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  2.2 Financial Operations and Compliance
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Payment Processing:</strong> Authorizing charges,
                    calculating royalties, and issuing receipts.
                  </li>
                  <li>
                    <strong>Payout Execution:</strong> Validating eligibility,
                    handling tax withholding, and reconciling ledgers.
                  </li>
                  <li>
                    <strong>Risk Management:</strong> Screening for fraud
                    patterns with tools such as velocity checks.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  2.3 Communication and User Engagement
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Transactional Messaging:</strong> Upload
                    confirmations, payout alerts, and critical feature updates.
                  </li>
                  <li>
                    <strong>Marketing and Insights:</strong> With opt-in,
                    curated content, webinars, and product tips.
                  </li>
                  <li>
                    <strong>Support Resolution:</strong> Triage and follow-up on
                    support tickets.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  2.4 Analytics, Research, and Improvement
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Performance Metrics:</strong> Analyzing load times
                    and drop-offs to improve experience.
                  </li>
                  <li>
                    <strong>Trend Identification:</strong> Aggregating
                    anonymized data for insights such as usage trends.
                  </li>
                  <li>
                    <strong>Innovation R&amp;D:</strong> Using de-identified
                    datasets to improve features such as auto-captions.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  2.5 Legal, Security, and Ethical Compliance
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Regulatory Adherence:</strong> Retaining records for
                    audits, responding to requests, and reporting breaches.
                  </li>
                  <li>
                    <strong>Security Measures:</strong> Monitoring for
                    anomalies, penetration testing, and strengthening controls.
                  </li>
                  <li>
                    <strong>Ethical Safeguards:</strong> Bias audits on AI tools
                    and diversity in moderation.
                  </li>
                </ul>
              </section>

              {/* 3. Legal Bases */}
              <section
                id="legal-bases"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  3. Legal Bases for Processing: Grounded in Law
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We process personal data only where we have a valid legal
                  basis under NDPR, GDPR, and similar frameworks.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-2 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Performance of Contract:</strong> To deliver the App
                    and its features.
                  </li>
                  <li>
                    <strong>Legitimate Interests:</strong> For security, fraud
                    prevention, and analytics, subject to balancing tests.
                  </li>
                  <li>
                    <strong>Consent:</strong> For marketing and non-essential
                    cookies, which you can withdraw at any time.
                  </li>
                  <li>
                    <strong>Legal Obligation:</strong> For tax, AML, or court
                    orders.
                  </li>
                  <li>
                    <strong>Vital Interests / Public Task:</strong> Rare cases
                    such as emergencies.
                  </li>
                </ul>
              </section>

              {/* 4. Sharing */}
              <section
                id="sharing"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  4. Sharing and Disclosure: Controlled and Accountable
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  Data sharing is limited to subprocessors bound by data
                  processing agreements. We maintain a public register of these
                  subprocessors on our website.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  4.1 Third-Party Service Providers
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Payment and Finance:</strong> Stripe, Paystack.
                  </li>
                  <li>
                    <strong>Verification:</strong> Onfido for ID checks.
                  </li>
                  <li>
                    <strong>Infrastructure:</strong> AWS and Akamai for storage
                    and CDNs.
                  </li>
                  <li>
                    <strong>Analytics:</strong> Google Analytics.
                  </li>
                  <li>
                    <strong>Communications:</strong> Twilio and Intercom.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  4.2 Regulatory and Law Enforcement Disclosures
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    Disclosures to authorities such as NDPC, EFCC, or Interpol
                    only when required by valid legal process.
                  </li>
                  <li>
                    Sharing minimal data to prevent harm in safety-related
                    cases.
                  </li>
                </ul>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  4.3 Corporate Transactions
                </span>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  In the event of a merger, acquisition, or asset sale, data may
                  transfer to a successor under equivalent protections, with
                  notice where required.
                </p>

                <span className="tw:mt-6 tw:block tw:font-display tw:text-[15px] tw:font-semibold tw:text-ink">
                  4.4 Public and Aggregated Disclosures
                </span>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    Public profiles such as creator handles, bios, and public
                    project teasers, when you choose to make them visible.
                  </li>
                  <li>
                    Anonymized, aggregated statistics in reports and
                    publications.
                  </li>
                </ul>
                <p className="tw:mt-1 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  We do not sell personal data. CCPA &quot;sale&quot; opt-outs
                  are respected where applicable.
                </p>
              </section>

              {/* 5. International Transfers */}
              <section
                id="transfers"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  5. International Data Transfers: Safeguarded Global Operations
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We may transfer data to processors outside Nigeria, including
                  in the US, EU, and other regions, using appropriate
                  safeguards.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    Approved mechanisms such as the EU-US Data Privacy
                    Framework.
                  </li>
                  <li>
                    Standard Contractual Clauses and Transfer Impact
                    Assessments.
                  </li>
                  <li>Binding Corporate Rules for intra-group transfers.</li>
                </ul>
              </section>

              {/* 6. Retention */}
              <section
                id="retention"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  6. Data Retention and Deletion: Principled Lifecycle
                  Management
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We retain data only as long as necessary for the purposes
                  described in this Policy or as required by law.
                </p>

                <div className="tw:mt-4 tw:overflow-x-auto">
                  <table className="tw:min-w-full tw:border tw:border-hairline tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body tw:bg-paper-raised tw:rounded-card tw:overflow-hidden">
                    <thead>
                      <tr>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Data Type
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Retention Period
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Rationale
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Account Data
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Duration of account + 2 years inactivity
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Service provision and recovery
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Financial Records
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          7 years post-transaction
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Tax and audit obligations
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Content Files
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Until deletion request + 90-day backup
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          User control and recovery
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Logs / Analytics
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          12–36 months
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Security and improvement
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Verification Documents
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          5 years post-validation or legal minimum
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Compliance
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="tw:mt-3 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  Deletion is irreversible (aside from backups, which are purged
                  on a schedule). We may retain anonymized data that can no
                  longer identify you.
                </p>
              </section>

              {/* 7. Rights */}
              <section
                id="rights"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  7. Your Privacy Rights: Comprehensive Exercise Guide
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  Depending on your jurisdiction, you may have the following
                  rights:
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-2 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Access:</strong> Request a copy of the personal data
                    we hold about you.
                  </li>
                  <li>
                    <strong>Rectification:</strong> Ask us to correct inaccurate
                    or incomplete information.
                  </li>
                  <li>
                    <strong>Erasure:</strong> Request deletion of your data,
                    subject to legal obligations.
                  </li>
                  <li>
                    <strong>Restriction:</strong> Ask us to temporarily limit
                    processing.
                  </li>
                  <li>
                    <strong>Portability:</strong> Receive your data in a
                    structured, commonly used format.
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing based on
                    legitimate interests or for direct marketing.
                  </li>
                  <li>
                    <strong>Withdraw Consent:</strong> Withdraw consent where
                    processing is based on it.
                  </li>
                  <li>
                    <strong>Automated Decisions:</strong> Request human review
                    of significant decisions made using automated processing.
                  </li>
                </ul>
                <p className="tw:mt-3 tw:text-[13px] tw:md:text-sm tw:text-muted">
                  To exercise your rights, contact us at{" "}
                  <a
                    href="mailto:support@xilolo.com"
                    className="tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
                  >
                    support@xilolo.com
                  </a>{" "}
                  or use the in-app privacy request tools. We may need to verify
                  your identity before acting on your request.
                </p>
              </section>

              {/* 8. Children */}
              <section
                id="children"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  8. Protection of Children&apos;s Privacy
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  The Xilolo App is intended for users aged 18 and above. We do
                  not knowingly collect personal data from children under 18 (or
                  under 16 in some jurisdictions). If we become aware that such
                  data has been collected, we will delete it within a reasonable
                  timeframe.
                </p>
              </section>

              {/* 9. Security */}
              <section
                id="security"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  9. Information Security: Robust and Proactive Measures
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We implement technical and organizational measures designed to
                  protect your data, including encryption in transit and at
                  rest, access controls, training, and security monitoring.
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    Encryption (such as TLS in transit and AES-256 at rest).
                  </li>
                  <li>Role-based access and multi-factor authentication.</li>
                  <li>Regular vulnerability assessments and testing.</li>
                  <li>
                    Incident response procedures with notifications to
                    authorities and users where required.
                  </li>
                </ul>
              </section>

              {/* 10. Cookies */}
              <section
                id="cookies"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  10. Cookies and Tracking Technologies: Detailed Management
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  Cookies and similar technologies help us provide core
                  features, remember preferences, and understand how the App is
                  used. You can manage these through your browser settings and
                  our in-app cookie controls.
                </p>

                <div className="tw:mt-4 tw:overflow-x-auto">
                  <table className="tw:min-w-full tw:border tw:border-hairline tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body tw:bg-paper-raised tw:rounded-card tw:overflow-hidden">
                    <thead>
                      <tr>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Category
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Examples
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Purpose
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Duration
                        </th>
                        <th className="tw:border-b tw:border-hairline tw:bg-paper tw:px-4 tw:py-2 tw:text-left tw:text-[12px] tw:font-semibold tw:text-muted-strong tw:md:text-sm">
                          Provider
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Strictly Necessary
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          auth_token, session_id
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Login persistence
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Session / 1 year
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Xilolo
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Performance
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          _ga, app_analytics
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Usage aggregation
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          2 years
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Google
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Functional
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          theme_pref, lang_choice
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Customization
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          1 year
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Xilolo
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Targeting
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          ads_id (opt-in)
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Personalized content
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          6 months
                        </td>
                        <td className="tw:px-4 tw:py-2 tw:border-t tw:border-hairline">
                          Meta/Facebook
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 11. Updates */}
              <section
                id="updates"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  11. Policy Updates: Commitment to Ongoing Transparency
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  We may update this Privacy Policy to reflect changes in our
                  practices, technology, or legal requirements. When we make
                  material changes, we will notify you via the App, email, or
                  other appropriate channels.
                </p>
              </section>

              {/* 12. Breach */}
              <section
                id="breach"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  12. Data Breach Response: Swift and Accountable
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  In the unlikely event of a data breach, we will investigate,
                  contain, and remediate the incident, and notify affected users
                  and regulators where required.
                </p>
              </section>

              {/* 13. Contact */}
              <section
                id="contact"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  13. Contact Information and Dispute Resolution
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  If you have questions or concerns about this Policy or how we
                  handle your data, please contact:
                </p>
                <ul className="tw:mt-2 tw:list-disc tw:space-y-1 tw:pl-5 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <li>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:support@xilolo.com"
                      className="tw:text-accent-deep! tw:underline! tw:underline-offset-2 tw:hover:text-accent"
                    >
                      support@xilolo.com
                    </a>
                  </li>
                  <li>
                    <strong>Post:</strong> 16192 Coastal Highway Lewes, Delaware
                    19958 Sussex County United States
                  </li>
                  <li>
                    <strong>Phone:</strong> +234-802-379-7265 (Mon–Fri, 9 AM–5
                    PM WAT)
                  </li>
                  <li>
                    <strong>In-App:</strong> Settings &gt; Support &gt; Privacy
                    Request
                  </li>
                </ul>
              </section>

              {/* 14. FAQs */}
              <section
                id="faqs"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  14. Frequently Asked Questions (FAQs)
                </span>
                <dl className="tw:mt-4 tw:space-y-4 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  <div>
                    <dt className="tw:font-display tw:font-semibold tw:text-ink">
                      How do I delete my account?
                    </dt>
                    <dd className="tw:mt-1">
                      Go to Settings &gt; Account &gt; Delete. You&apos;ll be
                      asked to confirm. Data will be removed according to the
                      retention rules in this Policy.
                    </dd>
                  </div>
                  <div>
                    <dt className="tw:font-display tw:font-semibold tw:text-ink">
                      Do you share data with advertisers?
                    </dt>
                    <dd className="tw:mt-1">
                      We do not share your personal data with advertisers. We
                      may share anonymized, aggregated insights for campaigns
                      where you have opted in.
                    </dd>
                  </div>
                  <div>
                    <dt className="tw:font-display tw:font-semibold tw:text-ink">
                      What if I&apos;m in the EU?
                    </dt>
                    <dd className="tw:mt-1">
                      If you&apos;re in the EEA, UK, or Switzerland, you have
                      GDPR-aligned rights and may contact your local supervisory
                      authority if you have concerns.
                    </dd>
                  </div>
                  <div>
                    <dt className="tw:font-display tw:font-semibold tw:text-ink">
                      Can I export my projects and data?
                    </dt>
                    <dd className="tw:mt-1">
                      Yes. You can export your projects in supported formats and
                      request a copy of your personal data as described in
                      Section 7.
                    </dd>
                  </div>
                </dl>
              </section>

              {/* 15. Governing Law */}
              <section
                id="governing-law"
                className="tw:mt-10 tw:scroll-mt-28 tw:border-t tw:border-hairline tw:pt-8"
              >
                <span className="tw:block tw:font-display tw:text-[19px] tw:tracking-tight tw:font-semibold tw:text-ink">
                  15. Governing Law and Miscellaneous Provisions
                </span>
                <p className="tw:mt-3 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  This Privacy Policy and any disputes arising from it are
                  governed by the laws of the Federal Republic of Nigeria,
                  without regard to conflict of law principles.
                </p>
                <p className="tw:mt-2 tw:text-[15px] tw:leading-relaxed tw:md:text-base tw:text-body">
                  Venue for disputes will be courts in Asaba State, Nigeria,
                  unless otherwise required by law. If any provision of this
                  Policy is found invalid, the remaining provisions remain in
                  full force.
                </p>
              </section>

              {/* Footer */}
              <div className="tw:mt-10 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-hairline tw:pt-4">
                <span className="tw:text-[13px] tw:md:text-sm tw:text-muted">
                  Last updated: <strong>November 6, 2025</strong>
                </span>
                <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-pill tw:border tw:border-hairline tw:bg-paper tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:text-muted-strong">
                  <span className="tw:h-1.5 tw:w-1.5 tw:rounded-pill tw:bg-accent" />
                  Xilolo · Privacy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
