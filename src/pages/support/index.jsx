import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AtSign,
  BookOpen,
  ChevronDown,
  Globe,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button, Card, Chip, Eyebrow, SectionHeading } from "../../component/ui";

/**
 * Xilolo Support (/support).
 *
 * Presentation only — every answer, contact detail and link below is carried
 * over verbatim from the previous page. Nothing here is invented: the only
 * links are routes that exist in src/App.jsx (/support-chat,
 * /community-guidelines) plus the pre-existing mailto: and xilolo.com links.
 *
 * Design system: paper page, paper-raised cards, hairline borders, 12px card
 * radius, pill buttons, accent as a FILL only (accent text = accent-deep).
 *
 * NOTE ON `!`: the template stylesheets (src/assets/css/*) still ship global
 * element rules for h1-h3, p and a that outrank Tailwind's utility layer
 * (headings land on 20px/500, anchors fall back to black, body copy on Inter).
 * Those files are not owned by this page, so the values this page must control
 * are pinned with Tailwind's important modifier. Remove the `!`s once the
 * global element rules are neutralised — the values themselves are already
 * design-token correct.
 */

const FAQ_GROUPS = [
  {
    heading: "General Questions",
    items: [
      {
        question: "What is Xilolo?",
        answer: [
          "Xilolo is an interactive live streaming platform where creators host events and users can watch, learn, and engage in real time. It supports entertainment, education, and private sessions.",
        ],
      },
      {
        question: "Who can use Xilolo?",
        answer: [
          "Anyone can use Xilolo. Whether you are a content creator, educator, entertainer, or viewer, you can either host events or attend them.",
        ],
      },
      {
        question: "Is Xilolo free to use?",
        answer: [
          "The app is free to download and sign up, but most events require payment depending on the creator’s pricing.",
        ],
      },
    ],
  },
  {
    heading: "For Viewers",
    items: [
      {
        question: "How do I join a live stream?",
        answer: [
          "Create an account, browse available events, and click “Join” on any live or scheduled session.",
        ],
      },
      {
        question: "Can I interact during a stream?",
        answer: [
          "Yes, you can chat, ask questions, and engage with the host in real time.",
        ],
      },
      {
        question: "Do I need to pay for all content?",
        answer: ["Most content requires payment based on the creator’s pricing."],
      },
      {
        question: "Can I watch past streams?",
        answer: [
          "This depends on the creator. Some provide replays, while others only host live sessions.",
        ],
      },
    ],
  },
  {
    heading: "For Creators",
    items: [
      {
        question: "How do I start streaming on Xilolo?",
        answer: [
          "Sign up, create an event, set your pricing, and go live at your scheduled time.",
        ],
      },
      {
        question: "What kind of content can I stream?",
        answer: [
          "You can host live shows, classes or tutorials, concerts, private sessions, and interactive workshops.",
        ],
      },
      {
        question: "Can I earn money on Xilolo?",
        answer: [
          "Yes, you can monetize your streams through paid access, tickets, or exclusive sessions.",
        ],
      },
      {
        question: "How do I get paid?",
        answer: [
          "Creators earn from paid events based on the platform’s payout system and policies.",
        ],
      },
    ],
  },
  {
    heading: "Technical and Account",
    items: [
      {
        question: "What devices support Xilolo?",
        answer: [
          "Xilolo works on smartphones, tablets, and compatible desktop devices.",
        ],
      },
      {
        question: "What internet speed do I need?",
        answer: [
          "Viewers need at least 5 Mbps, while creators are recommended to have at least 10 Mbps for smooth streaming.",
        ],
      },
      {
        question: "What should I do if the app is not working properly?",
        answer: [
          "Update the app, check your internet connection, restart your device, and contact support if the issue persists.",
        ],
      },
    ],
  },
  {
    heading: "Safety and Privacy",
    items: [
      {
        question: "Is my data safe on Xilolo?",
        answer: [
          "Xilolo collects basic information such as email, name, and user content to operate the platform securely.",
        ],
      },
      {
        question: "Can I host private events?",
        answer: [
          "Yes, you can restrict access to selected users or paid participants only.",
        ],
      },
    ],
  },
  {
    heading: "Growth and Experience",
    items: [
      {
        question: "How can I grow my audience on Xilolo?",
        answer: [
          "Promote your streams on social media, stay consistent with your schedule, engage actively with your audience, and offer valuable content.",
        ],
      },
      {
        question: "What makes Xilolo different from other platforms?",
        answer: [
          "Xilolo combines live streaming, real-time interaction, monetization, and both education and entertainment in one platform.",
        ],
      },
    ],
  },
];

/* The template stylesheet indents and greys every list; every list on this page
   is a layout list, so the reset is pinned inline (it outranks any utility). */
const FLAT_LIST = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
};

function Support() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (key) => {
    setOpenFaq((current) => (current === key ? null : key));
  };

  return (
    <div className="tw:bg-paper tw:px-4 tw:pb-20 tw:pt-24 tw:font-sans tw:text-ink tw:sm:px-6 tw:md:px-8 tw:md:pt-28 tw:lg:pt-10">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-[1200px] tw:flex-col">
        {/* ── Hero ───────────────────────────────────────────────────────────
            Deliberately a <div>, not a <header>: the template stylesheet still
            carries a bare `header` rule (fixed 40px height, 30px padding, white
            fill, drop shadow, Inter) that clips every child of a real <header>. */}
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:text-center">
          <Eyebrow className="tw:m-0! tw:text-accent-deep!">Support</Eyebrow>

          <h1 className="tw:font-display! tw:text-[clamp(2rem,5vw,2.75rem)]! tw:font-extrabold! tw:leading-[1.1] tw:tracking-[-0.02em]! tw:text-ink! tw:m-0!">
            Xilolo Support
          </h1>

          <p className="tw:m-0! tw:max-w-[62ch] tw:text-base tw:leading-relaxed tw:text-muted-strong!">
            Welcome to the Xilolo Support Center. We’re here to make sure your
            laughter never stops!
          </p>

          <div className="tw:mt-2 tw:flex tw:w-full tw:flex-col tw:gap-3 tw:sm:w-auto tw:sm:flex-row tw:sm:items-center tw:sm:justify-center">
            <Button
              as={Link}
              to="/support-chat"
              variant="primary"
              size="lg"
              className="tw:w-full tw:text-ink! tw:hover:text-paper-raised! tw:sm:w-auto"
            >
              <MessageCircle className="tw:size-4" aria-hidden="true" />
              Support chat
            </Button>

            <Button
              as="a"
              href="mailto:support@xilolo.com"
              variant="secondary"
              size="lg"
              className="tw:w-full tw:text-accent-deep! tw:sm:w-auto"
            >
              <Mail className="tw:size-4" aria-hidden="true" />
              support@xilolo.com
            </Button>
          </div>

          <p className="tw:m-0! tw:text-xs tw:text-muted-strong!">
            Support chat is available to users with an active subscription.
          </p>
        </div>

        {/* ── FAQ + side rail ────────────────────────────────────────────── */}
        <div className="tw:mt-12 tw:grid tw:grid-cols-1 tw:gap-8 tw:lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] tw:lg:items-start tw:lg:gap-10">
          <section aria-label="Frequently Asked Questions">
            <SectionHeading
              title="Frequently Asked Questions (FAQ)"
              className="tw:[&>h2]:m-0! tw:[&>h2]:text-[clamp(1.5rem,3vw,2rem)]! tw:[&>h2]:font-extrabold! tw:[&>h2]:text-ink!"
            />

            <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-4">
              {FAQ_GROUPS.map((group) => (
                <Card
                  key={group.heading}
                  className="tw:flex tw:flex-col tw:gap-2"
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                    <h3 className="tw:m-0! tw:font-display! tw:text-lg! tw:font-bold! tw:text-ink!">
                      {group.heading}
                    </h3>
                    <Chip>{group.items.length} questions</Chip>
                  </div>

                  <div>
                    {group.items.map((item, index) => {
                      const key = `${group.heading}-${index}`;
                      const open = openFaq === key;

                      return (
                        <div
                          key={key}
                          className={
                            index === 0 ? "" : "tw:border-t tw:border-hairline"
                          }
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(key)}
                            aria-expanded={open}
                            className="tw:flex tw:min-h-11 tw:w-full tw:items-center tw:justify-between tw:gap-4 tw:py-3 tw:text-left tw:text-[15px] tw:font-semibold tw:text-ink tw:transition-colors tw:hover:text-accent-deep"
                          >
                            <span>{item.question}</span>
                            <ChevronDown
                              aria-hidden="true"
                              className={`tw:size-5 tw:shrink-0 tw:text-accent-deep tw:transition-transform tw:duration-200 ${
                                open ? "tw:rotate-180" : ""
                              }`}
                            />
                          </button>

                          {open ? (
                            <ul
                              style={FLAT_LIST}
                              className="tw:flex tw:flex-col tw:gap-1.5 tw:pb-3 tw:text-sm tw:leading-relaxed tw:text-muted-strong"
                            >
                              {item.answer.map((line, lineIndex) => (
                                <li key={lineIndex}>{line}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <aside className="tw:flex tw:flex-col tw:gap-6 tw:lg:sticky tw:lg:top-28">
            {/* ── Contact ─────────────────────────────────────────────────── */}
            <Card className="tw:flex tw:flex-col tw:gap-3">
              <h2 className="tw:m-0! tw:font-display! tw:text-xl! tw:font-bold! tw:text-ink!">
                Contact Us
              </h2>

              <p className="tw:m-0! tw:text-sm tw:leading-relaxed tw:text-muted-strong!">
                Still need help? We’d love to hear from you 💌
              </p>

              <ul
                style={FLAT_LIST}
                className="tw:flex tw:flex-col tw:gap-1 tw:text-sm"
              >
                <li>
                  <a
                    href="mailto:support@xilolo.com"
                    className="tw:-mx-2 tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:rounded-control tw:px-2 tw:transition-colors tw:hover:bg-accent-soft"
                  >
                    <Mail
                      className="tw:size-4 tw:shrink-0 tw:text-accent-deep"
                      aria-hidden="true"
                    />
                    <span className="tw:text-muted-strong">Email:</span>
                    <span className="tw:font-medium tw:text-accent-deep tw:underline tw:underline-offset-4">
                      support@xilolo.com
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.xilolo.com"
                    target="_blank"
                    rel="noreferrer"
                    className="tw:-mx-2 tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:rounded-control tw:px-2 tw:transition-colors tw:hover:bg-accent-soft"
                  >
                    <Globe
                      className="tw:size-4 tw:shrink-0 tw:text-accent-deep"
                      aria-hidden="true"
                    />
                    <span className="tw:text-muted-strong">Website:</span>
                    <span className="tw:font-medium tw:text-accent-deep tw:underline tw:underline-offset-4">
                      www.xilolo.com
                    </span>
                  </a>
                </li>

                <li className="tw:flex tw:min-h-11 tw:items-center tw:gap-2">
                  <AtSign
                    className="tw:size-4 tw:shrink-0 tw:text-accent-deep"
                    aria-hidden="true"
                  />
                  <span className="tw:text-muted-strong">
                    Twitter / Instagram / TikTok:
                  </span>
                  <span className="tw:font-semibold tw:text-ink">
                    @xilolo_hq
                  </span>
                </li>
              </ul>
            </Card>

            {/* ── Community guidelines ────────────────────────────────────── */}
            <Card className="tw:flex tw:flex-col tw:gap-3">
              <h2 className="tw:m-0! tw:font-display! tw:text-xl! tw:font-bold! tw:text-ink!">
                Community Guidelines
              </h2>

              <p className="tw:m-0! tw:text-sm tw:leading-relaxed tw:text-muted-strong!">
                To keep Xilolo fun for everyone, please avoid:
              </p>

              <ul
                style={FLAT_LIST}
                className="tw:flex tw:flex-col tw:gap-2 tw:text-sm tw:leading-relaxed tw:text-muted-strong"
              >
                <li className="tw:flex tw:items-start tw:gap-2.5">
                  <span
                    aria-hidden="true"
                    className="tw:mt-2 tw:size-1.5 tw:shrink-0 tw:rounded-pill tw:bg-accent"
                  />
                  Posting hateful or harmful content.
                </li>
                <li className="tw:flex tw:items-start tw:gap-2.5">
                  <span
                    aria-hidden="true"
                    className="tw:mt-2 tw:size-1.5 tw:shrink-0 tw:rounded-pill tw:bg-accent"
                  />
                  Sharing copyrighted memes without permission.
                </li>
                <li className="tw:flex tw:items-start tw:gap-2.5">
                  <span
                    aria-hidden="true"
                    className="tw:mt-2 tw:size-1.5 tw:shrink-0 tw:rounded-pill tw:bg-accent"
                  />
                  Spamming or harassing other users.
                </li>
              </ul>

              <Button
                as={Link}
                to="/community-guidelines"
                variant="secondary"
                size="md"
                className="tw:w-full tw:text-accent-deep!"
              >
                <BookOpen className="tw:size-4" aria-hidden="true" />
                Read the full guidelines
              </Button>
            </Card>
          </aside>
        </div>

        {/* ── Closing ───────────────────────────────────────────────────── */}
        <p className="tw:mt-12! tw:mb-0! tw:text-center tw:text-sm tw:text-muted-strong!">
          ✨ Thank you for your feedback! ✨
        </p>
      </div>
    </div>
  );
}

export default Support;
