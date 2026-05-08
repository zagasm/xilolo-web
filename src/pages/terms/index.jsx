import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="tw:min-h-screen tw:bg-[#f5f5f7] tw:px-4 tw:py-10 tw:text-slate-800">
      <div className="tw:mx-auto tw:max-w-6xl">
        {/* Hero / header */}
        <div className="tw:mb-6">
          <div className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-lightPurple tw:px-3 tw:py-1 tw:text-[12px] tw:font-medium tw:text-primary">
            <span className="tw:inline-block tw:h-2 tw:w-2 tw:rounded-full tw:bg-primary" />
            <span>Xilolo App · Legal</span>
          </div>

          <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2">
            <span className="tw:block tw:text-3xl tw:md:text-4xl tw:font-semibold tw:text-slate-900">
              Terms of Service for Xilolo App
            </span>

            <span className="tw:block tw:max-w-2xl tw:text-sm tw:md:text-base tw:text-slate-600">
              These Terms of Service explain your rights and responsibilities
              when using the Xilolo App as a creator, viewer, or
              collaborator.
            </span>
          </div>

          <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:text-xs tw:md:text-sm tw:text-slate-600">
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:shadow-sm tw:border tw:border-slate-200">
              <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-500" />
              <span>
                Effective: <strong>November 6, 2025</strong>
              </span>
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:shadow-sm tw:border tw:border-slate-200">
              <span>Company:</span>
              <strong>Xilolo Inc.</strong>
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-3 tw:py-1 tw:shadow-sm tw:border tw:border-slate-200">
              <span>Jurisdiction:</span>
              <strong>Federal Republic of Nigeria</strong>
            </span>
          </div>

          <div className="tw:mt-2 tw:text-xs tw:md:text-sm tw:text-slate-500">
            <span className="tw:block">
              Contact:{" "}
              <a
                href="mailto:support@xilolo.com"
                className="tw:font-medium tw:text-primary tw:underline-offset-4 tw:hover:underline"
              >
                support@xilolo.com
              </a>
            </span>
            <span className="tw:block">
              Address:{" "}
              <span className="tw:font-medium">
                16192 Coastal Highway Lewes, Delaware 19958 Sussex County United
                States
              </span>
            </span>
          </div>
        </div>

        {/* Layout: sidebar + main */}
        <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:lg:grid-cols-[260px,minmax(0,1fr)] tw:gap-8">

          {/* Main content */}
          <div>
            <div className="tw:rounded-3xl tw:bg-white tw:p-5 tw:md:p-8 tw:border tw:border-slate-200 tw:shadow-[0_20px_60px_rgba(15,23,42,0.08)] tw:space-y-10">
              {/* Intro */}
              <div
                id="intro"
                className="tw:space-y-4 tw:text-sm tw:md:text-base tw:text-slate-700"
              >
                <span className="tw:block">
                  Welcome to the Terms of Service <span>(“Terms”)</span> for
                  Xilolo Inc.’s Xilolo App <span>(“Service” or “App”)</span>.
                  Xilolo Inc., a technology company incorporated under the laws
                  of the Federal Republic of Nigeria and headquartered in Asaba,
                  provides this platform to help creators, filmmakers,
                  educators, and teams produce, edit, stream, and monetize
                  content. Whether you are hosting live interactive sessions,
                  building video projects, or collaborating across borders, the
                  Xilolo App is designed to amplify your creative work while
                  maintaining strong standards of trust, security, and fairness.
                </span>

                <span className="tw:block">
                  These Terms form a legally binding agreement between you{" "}
                  <span>(“User,” “you,” or “your”)</span> and Xilolo Inc.{" "}
                  <span>(“we,” “us,” or “our”)</span>. By accessing,
                  downloading, registering for, or using the Service—whether via
                  web, mobile app, or APIs—you confirm that you have read,
                  understood, and agree to be bound by these Terms as well as
                  our{" "}
                  <a
                    href="/privacy-policy"
                    className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                  >
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a
                    href="/community-guidelines"
                    className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                  >
                    Community Guidelines
                  </a>{" "}
                  (together, the “Governing Documents”). If you are accepting on
                  behalf of a business, you confirm you have authority to bind
                  that entity.
                </span>

                <span className="tw:block">
                  These Terms align with relevant laws and regulations,
                  including Nigeria’s Data Protection Regulation (NDPR), the
                  General Data Protection Regulation (GDPR) for EEA users, the
                  California Consumer Privacy Act (CCPA) for California
                  residents, and the DMCA for intellectual property. This
                  version is effective November 6, 2025. We will notify you of
                  material changes by email, in-app messages, or prominent
                  notices. Continued use after updates means you accept the new
                  terms.
                </span>
              </div>

              {/* 1. Eligibility, Accounts, Responsibilities */}
              <div
                id="sec-1"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  1. Eligibility, accounts, and user responsibilities
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  The Service is intended for mature and responsible use. This
                  section explains who can use the App and what is expected of
                  each user.
                </span>

                {/* 1.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  1.1 Age and capacity requirements
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Minimum age:</strong> You must be at least 13
                      years old to create an account or use the Service. Users
                      under the age of majority in their jurisdiction may need
                      verifiable parental or guardian consent and supervision,
                      in line with applicable laws such as COPPA or Nigeria’s
                      Child Rights Act 2003. Monetized activities may remain
                      subject to additional age, identity, payment, and legal
                      capacity checks.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Legal capacity:</strong> You represent that you
                      are legally capable of entering binding contracts and that
                      your use of the Service does not violate any law,
                      regulation, or third-party right where you live or
                      operate.
                    </span>
                  </li>
                </ul>

                <div className="tw:rounded-2xl tw:border-l-4 tw:border-amber-400 tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-xs tw:md:text-sm tw:text-slate-700">
                  <span className="tw:block tw:font-semibold tw:text-amber-800">
                    Verification processes
                  </span>
                  <span className="tw:block tw:mt-1">
                    We may use age and identity verification tools (for example,
                    checks through third-party providers) for monetization
                    features or where eligibility is in doubt. Providing false
                    information is a material breach of these Terms.
                  </span>
                </div>

                {/* 1.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  1.2 Account creation and security
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Registration:</strong> To access full features,
                      you must create an account with accurate, current, and
                      complete information, including your legal name, email
                      address, phone number, and any requested verification
                      details. You agree to update this information when it
                      changes.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Security obligations:</strong> You are responsible
                      for safeguarding your login credentials, including
                      passwords, API keys, and any two-factor codes. Enable
                      multi-factor authentication where available. You must tell
                      us promptly if you suspect unauthorized access.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Prohibited sharing:</strong> Accounts are personal
                      and non-transferable. Sharing access with others without
                      proper authorization may trigger additional checks or
                      restrictions.
                    </span>
                  </li>
                </ul>

                <span className="tw:block tw:text-xs tw:md:text-sm tw:text-slate-600">
                  <em>Termination rights:</em> We may suspend or terminate
                  accounts for inactivity, suspected fraud, or violations of
                  these Terms or the Governing Documents, with notice where
                  reasonably possible.
                </span>
              </div>

              {/* 2. Description of the Service & Permitted Use */}
              <div
                id="sec-2"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  2. Description of the Service and permitted use
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  The Xilolo App provides tools for content creation and
                  distribution. Usage must stay within these Terms and our
                  community expectations.
                </span>

                {/* 2.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  2.1 Core features and access
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Creator tools:</strong> Schedule and host live
                      streams and events, upload and edit video projects,
                      collaborate with others, and monetize via ticketed access,
                      subscriptions, or tips.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Viewer experiences:</strong> Purchase or subscribe
                      to access content, participate in chats and polls, and
                      personalize your viewing experience.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Collaboration hub:</strong> Manage shared
                      workspaces, invite co-creators, and track version history
                      for projects.
                    </span>
                  </li>
                </ul>

                {/* 2.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  2.2 Restrictions and prohibitions
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Content standards:</strong> All content must
                      comply with our{" "}
                      <a
                        href="/community-guidelines"
                        className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                      >
                        Community Guidelines
                      </a>
                      , including bans on adult sexual content, pornography,
                      hate speech, unlawful activity, and other prohibited
                      material.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>No adult content:</strong> Xilolo does not
                      support adult content. You may not upload, stream,
                      promote, sell, or otherwise distribute pornography,
                      sexually explicit material, or services intended for adult
                      entertainment through the Service.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Service modifications:</strong> We may update,
                      change, or discontinue features, servers, or the Service
                      itself. We aim to give notice for non-emergency changes
                      but do not guarantee uninterrupted availability or
                      backward compatibility.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Technical limits:</strong> You agree to respect
                      reasonable limits such as bandwidth caps, file size
                      restrictions, and fair usage rules. Excessive or abusive
                      use may result in throttling, temporary suspension, or
                      other controls.
                    </span>
                  </li>
                </ul>

                <div className="tw:rounded-2xl tw:border-l-4 tw:border-red-500 tw:bg-red-50 tw:px-4 tw:py-3 tw:text-xs tw:md:text-sm tw:text-slate-700">
                  <span className="tw:block tw:font-semibold tw:text-red-700">
                    Export clause
                  </span>
                  <span className="tw:block tw:mt-1">
                    Downloaded or exported content remains subject to these
                    Terms. Unauthorized commercial resale, redistribution, or
                    sublicensing of content may void licenses and result in
                    enforcement actions.
                  </span>
                </div>
              </div>

              {/* 3. Creator-specific obligations */}
              <div
                id="sec-3"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  3. Creator-specific obligations and liabilities
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  Creators are central to the platform. With that influence
                  comes responsibility to comply with law, respect viewers, and
                  honor commitments.
                </span>

                {/* 3.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  3.1 Content ownership and rights clearance
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Exclusivity warranties:</strong> You affirm that
                      you own or have valid licenses for all content you upload
                      or stream, including music, footage, graphics, and any
                      endorsements. You must secure necessary permissions for
                      identifiable individuals.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Compliance mandates:</strong> You must follow
                      applicable advertising rules, export controls, and
                      sector-specific regulations (for example, when making
                      health-related claims).
                    </span>
                  </li>
                </ul>

                {/* 3.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  3.2 Event delivery and refunds
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Performance standards:</strong> Deliver events as
                      advertised, start promptly, and provide the content and
                      value you promised, subject to reasonable technical
                      limits.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Refund protocols:</strong> For pre-live
                      cancellations, full refunds should be processed. After a
                      live event, refunds may be required or appropriate in
                      cases of material non-performance, subject to applicable
                      consumer protection laws and our policies.
                    </span>
                  </li>
                </ul>

                <div className="tw:rounded-2xl tw:border-l-4 tw:border-amber-400 tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-xs tw:md:text-sm tw:text-slate-700">
                  <span className="tw:block tw:font-semibold tw:text-amber-800">
                    Refund framework
                  </span>
                  <span className="tw:block tw:mt-1">
                    As a baseline, cancellations before an event starts
                    generally lead to full refunds. Partial delivery may result
                    in prorated refunds, while no-shows are typically escalated
                    and refunded completely. Detailed rules appear in the
                    Creator Dashboard and related policies.
                  </span>
                </div>
              </div>

              {/* 4. Viewer obligations and rights */}
              <div
                id="sec-4"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  4. Viewer obligations and rights
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  Viewers help sustain the ecosystem and must respect both
                  creators’ work and the integrity of the platform.
                </span>

                {/* 4.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  4.1 Access licenses
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Limited permissions:</strong> Purchases give you a
                      revocable, non-exclusive, non-sublicensable license to
                      view content for personal, non-commercial use during the
                      specified access window.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Prohibited actions:</strong> You may not record,
                      redistribute, rebroadcast, or create derivative works
                      using content without explicit permission from the
                      rights-holder.
                    </span>
                  </li>
                </ul>

                {/* 4.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  4.2 Engagement etiquette
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Respectful interaction:</strong> You must follow
                      the{" "}
                      <a
                        href="/community-guidelines"
                        className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                      >
                        Community Guidelines
                      </a>{" "}
                      in chats, comments, and any other interactive features.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Dispute handling:</strong> If you are unhappy with
                      an event or content purchase, contact support or submit a
                      ticket through the App before turning to external
                      remedies.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 5. Payments, fees, taxes */}
              <div
                id="sec-5"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  5. Payments, fees, taxes, and financial terms
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  Transactions on the Xilolo App rely on secure, compliant
                  payment processing and clear rules for fees and taxes.
                </span>

                {/* 5.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  5.1 Processing and authorizations
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Partners and methods:</strong> Payments are
                      handled through PCI-compliant processors such as Stripe
                      and Paystack. You authorize us and our partners to charge
                      your selected payment method for purchases, subscriptions,
                      and tips.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Platform fees:</strong> Creators receive payouts
                      net of platform service fees and payment processing costs,
                      which are detailed in the Creator Dashboard and may
                      change. Thresholds and payout schedules may depend on
                      currency and jurisdiction.
                    </span>
                  </li>
                </ul>

                {/* Fee table */}
                <div className="tw:overflow-x-auto tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-slate-50">
                  <table className="tw:min-w-full tw:text-left tw:text-xs tw:md:text-sm">
                    <thead>
                      <tr className="tw:bg-slate-100">
                        <th className="tw:px-4 tw:py-3 tw:font-semibold tw:text-slate-800">
                          Fee type
                        </th>
                        <th className="tw:px-4 tw:py-3 tw:font-semibold tw:text-slate-800">
                          Description
                        </th>
                        <th className="tw:px-4 tw:py-3 tw:font-semibold tw:text-slate-800">
                          Rate / example
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tw:divide-y tw:divide-slate-200">
                      <tr>
                        <td className="tw:px-4 tw:py-3">Service fee</td>
                        <td className="tw:px-4 tw:py-3">Platform usage</td>
                        <td className="tw:px-4 tw:py-3">
                          15% of gross revenue (illustrative)
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-3">Processing</td>
                        <td className="tw:px-4 tw:py-3">Payment gateway</td>
                        <td className="tw:px-4 tw:py-3">
                          2.9% + ₦100 per transaction
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-3">Taxes</td>
                        <td className="tw:px-4 tw:py-3">
                          VAT or equivalent withholding
                        </td>
                        <td className="tw:px-4 tw:py-3">
                          7.5% in Nigeria (subject to change by law)
                        </td>
                      </tr>
                      <tr>
                        <td className="tw:px-4 tw:py-3">Payout minimum</td>
                        <td className="tw:px-4 tw:py-3">Threshold</td>
                        <td className="tw:px-4 tw:py-3">₦10,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  5.2 Refunds, disputes, and adjustments
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Chargeback policies:</strong> We may pass through
                      chargeback fees, hold balances, or take action on accounts
                      associated with unsupported or fraudulent disputes.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Tax compliance:</strong> You are responsible for
                      reporting and paying any taxes due on income or purchases.
                      Where required, we may issue statements or reports to you
                      or tax authorities.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 6. Cancellations, deletions, data */}
              <div
                id="sec-6"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  6. Cancellations, deletions, archiving, and data handling
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  We preserve records to maintain accountability and comply with
                  legal requirements, while honoring applicable privacy and data
                  rights.
                </span>

                {/* 6.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  6.1 Event immutability
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Deletion restrictions:</strong> Creators may not
                      fully delete live, concluded, or paid events where doing
                      so would undermine dispute resolution or required
                      retention. We may retain such records for a period (for
                      example, up to 7 years) for audit and legal purposes.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Archival practices:</strong> Non-violating content
                      may be archived or backed up. Deletion and retention
                      follow our Privacy Policy and applicable data protection
                      laws.
                    </span>
                  </li>
                </ul>

                {/* 6.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  6.2 Account closure
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>User-initiated:</strong> You can request account
                      deletion via Settings. Deletion will follow the timelines
                      and carve-outs defined in the Privacy Policy.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Our actions:</strong> We may suspend or terminate
                      accounts where necessary to address risk or violations. In
                      some cases, a limited appeal window may be offered.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 7. Prohibited conduct */}
              <div
                id="sec-7"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  7. Prohibited conduct and enforcement
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  Certain behaviors are strictly prohibited to protect the
                  community and the platform.
                </span>

                {/* 7.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  7.1 Enumerated violations
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Guideline infractions:</strong> Violations of the{" "}
                      <a
                        href="/legal/community-guidelines"
                        className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                      >
                        Community Guidelines
                      </a>{" "}
                      (for example, adult content, harassment, IP violations,
                      spam).
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Platform sabotage:</strong> Attempts to hack,
                      overwhelm, or reverse-engineer the Service, or to bypass
                      restrictions or bans.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Fraudulent schemes:</strong> Fake profiles,
                      abusive chargebacks, or manipulation of metrics using bots
                      or deceptive practices.
                    </span>
                  </li>
                </ul>

                {/* 7.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  7.2 Enforcement mechanisms
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Graduated sanctions:</strong> We may issue
                      warnings, remove content, limit features, suspend accounts
                      for a defined period, or permanently ban accounts,
                      depending on severity and history. Appeals can be sent to{" "}
                      <a
                        href="mailto:support@xilolo.com"
                        className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                      >
                        support@xilolo.com
                      </a>
                      .
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Monitoring tools:</strong> Enforcement decisions
                      may be informed by automated systems, user reports,
                      audits, and other checks. We aim for fairness and
                      consistency.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 8. IP Rights and Licenses */}
              <div
                id="sec-8"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  8. Intellectual property rights and licenses
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  IP protections enable sustainable creation. We respect your
                  ownership while securing the licenses needed to operate the
                  Service.
                </span>

                {/* 8.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  8.1 User content ownership
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Retention of rights:</strong> You retain ownership
                      of your content. We do not claim ownership over the media
                      you create or upload.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Platform license:</strong> You grant us a
                      worldwide, royalty-free license to host, store, reproduce,
                      distribute, display, and create derivative works (for
                      example, thumbnails, previews, and transcodes) as needed
                      to operate and improve the Service.
                    </span>
                  </li>
                </ul>

                {/* 8.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  8.2 Our IP
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Protected elements:</strong> The Service itself,
                      including software, design, trademarks, and branding, is
                      owned or licensed by Xilolo Inc. You may not copy or
                      exploit these except as allowed by law or by written
                      agreement.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Feedback rights:</strong> Ideas or suggestions you
                      provide may be used to improve the Service without
                      obligation to compensate you beyond access to improved
                      features.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 9. Takedowns, complaints */}
              <div
                id="sec-9"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  9. Takedowns, complaints, and dispute reporting
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  We aim for clear, timely resolution of rights complaints and
                  other issues.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Submission process:</strong> Send rights or policy
                      complaints to{" "}
                      <a
                        href="mailto:support@xilolo.com"
                        className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
                      >
                        support@xilolo.com
                      </a>{" "}
                      with relevant details, including your contact information,
                      URLs or IDs of affected content, and evidence supporting
                      your claim.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Response timeline:</strong> We generally aim to
                      review and act on initial complaints within a reasonable
                      window (for example, 24–72 hours for clear violations).
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Escalation:</strong> If an issue cannot be
                      resolved informally, it may proceed under the dispute
                      resolution mechanisms described in Section 14.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 10. Termination and Survival */}
              <div
                id="sec-10"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  10. Termination, suspension, and survival
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  While we hope for long-term use, both you and we may need to
                  end the relationship under certain conditions.
                </span>

                {/* 10.1 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  10.1 Termination options
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Your rights:</strong> You may stop using the
                      Service at any time and can request account deletion
                      consistent with applicable data rights.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Our remedies:</strong> We may suspend or terminate
                      access immediately for serious or repeated violations,
                      security threats, or legal obligations. Where feasible, we
                      may offer notice and limited time to export data.
                    </span>
                  </li>
                </ul>

                {/* 10.2 */}
                <span className="tw:block tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
                  10.2 Surviving clauses
                </span>
                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      Clauses addressing intellectual property, payments,
                      disclaimers, limitations of liability, indemnification,
                      and dispute resolution may continue after termination as
                      needed to give them full effect.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 11. Disclaimers */}
              <div
                id="sec-11"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  11. Disclaimers of warranties
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  To the maximum extent permitted by law, we provide the Service
                  “as is” and “as available,” without warranties of any kind,
                  express or implied, except where required by statute.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>No guarantee of perfection:</strong> We do not
                      warrant that the Service will be error-free,
                      uninterrupted, or fit for a particular purpose.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Third-party resources:</strong> We are not
                      responsible for the content or security of third-party
                      sites or services linked from the App.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Availability:</strong> Maintenance, upgrades, or
                      unforeseen issues may cause downtime. Unless otherwise
                      agreed, no uptime SLA is promised.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 12. Limitation of liability */}
              <div
                id="sec-12"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  12. Limitation of liability
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  To the extent allowed by law, our overall liability is
                  limited.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Exclusion of indirect damages:</strong> We are not
                      liable for lost profits, lost data, business interruption,
                      or other indirect or consequential damages.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Liability cap:</strong> Where liability cannot be
                      excluded, it is generally limited to an amount no greater
                      than a specified cap (for example, the fees you paid over
                      the previous twelve months), subject to applicable law.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Force majeure:</strong> We are not responsible for
                      failures caused by events beyond our reasonable control,
                      such as natural disasters or major network outages.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 13. Indemnification */}
              <div
                id="sec-13"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  13. Indemnification obligations
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  You agree to defend and indemnify Xilolo Inc. against certain
                  claims arising from your use of the Service.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Coverage:</strong> You agree to hold us harmless
                      from claims, damages, and expenses arising from your
                      content, your breach of these Terms, or your violation of
                      any law or third-party rights.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Process:</strong> We will notify you of covered
                      claims where we seek indemnity and may participate in the
                      defense. You agree to cooperate in good faith.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 14. Governing law & arbitration */}
              <div
                id="sec-14"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  14. Governing law, disputes, and arbitration
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  These Terms and any disputes arising from them are generally
                  governed by the laws of the Federal Republic of Nigeria, to
                  the extent permitted by applicable law.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Law applicable:</strong> Nigerian law applies,
                      excluding conflict-of-law rules, unless your local laws
                      require otherwise.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Dispute mechanism:</strong> Many disputes can be
                      resolved informally. If not, they may proceed to binding
                      arbitration or local courts as specified in more detailed
                      jurisdiction-specific notices.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 15. Amendments, severability, misc */}
              <div
                id="sec-15"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:space-y-4"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900">
                  15. Amendments, severability, and miscellaneous terms
                </span>

                <span className="tw:block tw:text-sm tw:md:text-base tw:text-slate-700">
                  This section covers how changes are made and how these Terms
                  should be interpreted.
                </span>

                <ul className="tw:list-disc tw:pl-5 tw:space-y-2 tw:text-sm tw:md:text-base tw:text-slate-700">
                  <li>
                    <span>
                      <strong>Updates:</strong> We may amend these Terms from
                      time to time. Material changes are communicated with
                      reasonable notice. If you disagree, you must stop using
                      the Service and may request account deletion.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Severability:</strong> If any part of these Terms
                      is found invalid, the rest remains in full force and
                      effect.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Waiver:</strong> Our decision not to enforce a
                      provision immediately does not mean we give up the right
                      to enforce it later.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Entire agreement:</strong> These Terms and the
                      Governing Documents form the complete agreement between
                      you and us regarding the Service, superseding prior
                      understandings.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 16. FAQs */}
              <div
                id="sec-16"
                className="tw:pt-8 tw:border-t tw:border-slate-100 tw:text-sm tw:md:text-base tw:text-slate-700"
              >
                <span className="tw:block tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-slate-900 tw:mb-4">
                  16. Frequently asked questions (FAQs)
                </span>

                <dl className="tw:space-y-4">
                  <div>
                    <dt className="tw:font-semibold tw:text-slate-900">
                      <span>Can I use the App commercially?</span>
                    </dt>
                    <dd className="tw:mt-1 tw:ml-4 tw:text-slate-700">
                      <span>
                        Yes. You can monetize your content consistent with these
                        Terms and applicable laws. Review the creator sections
                        for more details.
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="tw:font-semibold tw:text-slate-900">
                      <span>What if I disagree with a payout or fee?</span>
                    </dt>
                    <dd className="tw:mt-1 tw:ml-4 tw:text-slate-700">
                      <span>
                        You can open a dispute via the in-app support or your
                        dashboard. We aim to review and respond within a
                        reasonable time frame.
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="tw:font-semibold tw:text-slate-900">
                      <span>
                        Do these Terms apply to beta or experimental tools?
                      </span>
                    </dt>
                    <dd className="tw:mt-1 tw:ml-4 tw:text-slate-700">
                      <span>
                        Yes, beta features are covered by these Terms, often
                        with additional disclaimers about instability or early
                        access.
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="tw:font-semibold tw:text-slate-900">
                      <span>How do I export my data when I leave?</span>
                    </dt>
                    <dd className="tw:mt-1 tw:ml-4 tw:text-slate-700">
                      <span>
                        You can request exports of certain data (for example,
                        project metadata) through our privacy tools or by
                        contacting support, subject to technical and legal
                        limits.
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="tw:font-semibold tw:text-slate-900">
                      <span>What about international users?</span>
                    </dt>
                    <dd className="tw:mt-1 tw:ml-4 tw:text-slate-700">
                      <span>
                        We strive to respect local laws and provide additional
                        rights where required (for example, under GDPR). If you
                        have jurisdiction-specific questions, reach out to
                        support.
                      </span>
                    </dd>
                  </div>
                </dl>

                <span className="tw:block tw:mt-4 tw:text-slate-700">
                  Thank you for using the Xilolo App. By following these
                  Terms, you help maintain a safe, fair, and high-quality space
                  for everyone.
                </span>
              </div>

              {/* Footer */}
              <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-slate-100 tw:pt-4">
                <span className="tw:text-xs tw:md:text-sm tw:text-slate-500">
                  Last updated: <strong>November 6, 2025</strong>
                </span>
                <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-slate-50 tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:text-slate-600 tw:border tw:border-slate-200">
                  <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-primary" />
                  <span>Xilolo · Terms of Service</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
