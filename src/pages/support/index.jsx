import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Link from "@mui/material/Link";
import AddRounded from "@mui/icons-material/AddRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";

/**
 * Xilolo Support (/support) — Material UI, Xilolo theme (src/theme/muiTheme.js).
 *
 * Presentation only. Every FAQ question and answer, every heading, every link
 * destination and the open/close handler are carried over verbatim from the
 * previous page; the only routes linked are ones that already existed here
 * (/support-chat, /community-guidelines, /contact, the mailto: and
 * https://www.xilolo.com). Nothing about SLAs, phone numbers or response times
 * is asserted, because none of that was in the source copy.
 *
 * Design intent — editorial, not "template":
 *  - one asymmetric hero (display headline left, lead + actions right), closed
 *    by a hairline rule; no blobs, no gradients, no icon-in-a-circle grid;
 *  - the FAQ is a ruled index: overline group labels with a count, then
 *    full-bleed rows separated by hairlines, "+" that turns into "×";
 *  - the right rail is three small hairlined papers, sticky at 96px above the
 *    fold on desktop, stacking under the FAQ on mobile in the same DOM order;
 *  - flat surfaces everywhere (theme sets every shadow to none), accent used as
 *    a fill only, accent-coloured text always via primary.dark (#06707D).
 *
 * Styling is done through `sx` (emotion) rather than Tailwind: this repo can't
 * carry the `tw:` prefix into MUI's overrides, so the page ships zero `tw:`
 * utilities and relies on the theme for type, radius and colour.
 *
 * NOTE: two decorative emoji (a 💌 and a pair of ✨) were dropped from body copy
 * the founder explicitly banned emoji in the UI. The words themselves are
 * unchanged.
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

const GUIDELINE_DONT = [
  "Posting hateful or harmful content.",
  "Sharing copyrighted memes without permission.",
  "Spamming or harassing other users.",
];

/* Shared editorial type tokens. Kept as plain objects so every block answers to
   one definition of "overline", "lead" and "body". */
const OVERLINE = {
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: "0.12em",
  lineHeight: 1.6,
  textTransform: "uppercase",
  color: "primary.dark",
};

const LEAD = {
  fontSize: { xs: 16, md: 18 },
  lineHeight: 1.6,
  letterSpacing: "-0.005em",
  color: "text.secondary",
};

const BODY = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "text.secondary",
};

const CAPTION = {
  fontSize: 13,
  lineHeight: 1.55,
  color: "text.secondary",
};

/* The rail papers: 12px radius, one hairline, no fill contrast beyond paper. */
const RAIL_PAPER = {
  p: { xs: 2.5, md: 3 },
  // sx multiplies by theme.shape.borderRadius (12) — `3` rendered 36px.
  borderRadius: 1,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
};

function RailHeading({ children }) {
  return (
    <Typography component="h2" sx={{ ...OVERLINE, m: 0 }}>
      {children}
    </Typography>
  );
}

function RailLink({ to, href, children, icon: Icon }) {
  const external = Boolean(href);
  const linkProps = external
    ? { href, ...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {}) }
    : { component: RouterLink, to };

  return (
    <Link
      {...linkProps}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        minHeight: 44,
        pr: 1,
        fontSize: 15,
        fontWeight: 500,
        color: "text.primary",
        textDecoration: "none",
        borderRadius: 1,
        transition: "color 120ms ease",
        "&:hover": { color: "primary.dark", textDecoration: "none" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
        "& .rail-link-icon": { color: "primary.dark" },
      }}
    >
      {Icon ? <Icon className="rail-link-icon" sx={{ fontSize: 18 }} aria-hidden="true" /> : null}
      <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>
      <ArrowForwardRounded
        className="rail-link-icon"
        sx={{ fontSize: 16, opacity: 0.55 }}
        aria-hidden="true"
      />
    </Link>
  );
}

function Support() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (key) => {
    setOpenFaq((current) => (current === key ? null : key));
  };

  return (
    <Box
      sx={{
        backgroundColor: "background.default",
        color: "text.primary",
        pb: { xs: 7, md: 10 },
      }}
    >
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1200, px: { xs: 2, md: 4 } }}
        disableGutters
      >
        {/* ── Hero ─────────────────────────────────────────────────────────
            Asymmetric: the display line holds the left, the lead and the two
            doors (chat / email) sit under it on the right baseline. A rule
            closes the block, which is what makes it read as a masthead rather
            than a centred template hero. */}
        <Box component="section" sx={{ pt: { xs: 4, md: 7 }, pb: { xs: 4, md: 5.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(0, 5fr)" },
              columnGap: { md: 6, lg: 9 },
              rowGap: { xs: 2.5, md: 0 },
              alignItems: "start",
            }}
          >
            <Box>
              <Typography component="p" sx={{ ...OVERLINE, mb: { xs: 1.5, md: 2 } }}>
                Support
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontSize: "clamp(40px, 6vw, 56px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                  fontWeight: 700,
                  textWrap: "balance",
                  m: 0,
                }}
              >
                Xilolo Support
              </Typography>
            </Box>

            <Box sx={{ maxWidth: "60ch", pb: { md: 0.5 } }}>
              <Typography component="p" sx={{ ...LEAD, m: 0 }}>
                Welcome to the Xilolo Support Center. We’re here to make sure your
                laughter never stops!
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ mt: 3, alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Button
                  component={RouterLink}
                  to="/support-chat"
                  variant="contained"
                  disableElevation
                  startIcon={<ChatBubbleOutlineRounded sx={{ fontSize: 18 }} />}
                  sx={{ fontSize: 14.5 }}
                >
                  Support chat
                </Button>

                <Button
                  href="mailto:support@xilolo.com"
                  variant="outlined"
                  disableElevation
                  startIcon={<MailOutlineRounded sx={{ fontSize: 18 }} />}
                  sx={{
                    fontSize: 14.5,
                    borderColor: "divider",
                    color: "primary.dark",
                    backgroundColor: "background.paper",
                    "&:hover": {
                      borderColor: "rgba(17,19,22,0.32)",
                      backgroundColor: "background.paper",
                    },
                  }}
                >
                  support@xilolo.com
                </Button>
              </Stack>

              <Typography component="p" sx={{ ...CAPTION, m: 0, mt: 1.75 }}>
                Support chat is available to users with an active subscription.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* ── FAQ + rail ───────────────────────────────────────────────────
            8/4 on desktop, 96px sticky rail, one column on mobile with the rail
            after the FAQ — identical DOM order in both. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,2fr) minmax(0,1fr)" },
            columnGap: { lg: 10 },
            rowGap: { xs: 6, lg: 0 },
            mt: { xs: 5.5, md: 8, lg: 11 },
            alignItems: "start",
          }}
        >
          <Box component="section" aria-label="Frequently Asked Questions">
            <Typography
              component="h2"
              variant="h2"
              sx={{
                fontFamily: "var(--tw-font-display), 'Plus Jakarta Sans', sans-serif",
                fontSize: { xs: 24, md: 30 },
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                m: 0,
              }}
            >
              Frequently Asked Questions (FAQ)
            </Typography>

            {FAQ_GROUPS.map((group, groupIndex) => (
              <Box
                key={group.heading}
                component="div"
                sx={{ mt: groupIndex === 0 ? { xs: 3.5, md: 4.5 } : { xs: 5.5, md: 7 } }}
              >
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ pb: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Typography component="h3" sx={{ ...OVERLINE, m: 0 }}>
                    {group.heading}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontVariantNumeric: "tabular-nums",
                      color: "text.disabled",
                    }}
                  >
                    {group.items.length}
                  </Typography>
                </Stack>

                <Box>
                  {group.items.map((item, index) => {
                    const key = `${group.heading}-${index}`;
                    const expanded = openFaq === key;

                    return (
                      <Accordion
                        key={key}
                        expanded={expanded}
                        onChange={() => toggleFaq(key)}
                        sx={{
                          borderTop: "none",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          borderRadius: 0,
                          "&:first-of-type": {
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                          },
                          "&:last-of-type": {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          backgroundColor: "transparent",
                          "&:hover": { backgroundColor: "transparent" },
                          "&.Mui-expanded": { backgroundColor: "transparent" },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<AddRounded />}
                          aria-controls={`${key}-panel`}
                          id={`${key}-header`}
                          sx={{
                            "& .MuiAccordionSummary-content": {
                              my: 2.375,
                              mr: 2,
                              "&.Mui-expanded": { my: 2.375 },
                            },
                            "& .MuiTypography-root": { fontSize: "inherit" },
                            "& .MuiAccordionSummary-expandIconWrapper": {
                              transition: "transform 180ms ease",
                              color: "primary.dark",
                              "& .MuiSvgIcon-root": {
                                fontSize: 20,
                                transition: "transform 180ms ease",
                              },
                              "&.Mui-expanded": {
                                transform: "none",
                                "& .MuiSvgIcon-root": { transform: "rotate(45deg)" },
                              },
                            },
                            "&:hover .MuiAccordionSummary-content": {
                              color: "primary.dark",
                            },
                            "&.Mui-focusVisible": {
                              outline: "2px solid",
                              outlineColor: "primary.main",
                              outlineOffset: 2,
                              borderRadius: 1,
                            },
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontSize: { xs: 15, md: 16 },
                              fontWeight: 600,
                              letterSpacing: "-0.012em",
                              color: "inherit",
                              transition: "color 120ms ease",
                            }}
                          >
                            {item.question}
                          </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ pl: 0, pr: { xs: 2, md: 6 }, pb: 2.5 }}>
                          {item.answer.map((line, lineIndex) => (
                            <Typography
                              key={lineIndex}
                              component="p"
                              sx={{ ...BODY, m: 0, maxWidth: "62ch" }}
                            >
                              {line}
                            </Typography>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Rail ─────────────────────────────────────────────────────── */}
          <Box
            component="aside"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: { lg: "sticky" },
              top: { lg: "96px" },
              alignSelf: "start",
            }}
          >
            <Paper elevation={0} sx={RAIL_PAPER}>
              <RailHeading>Contact Us</RailHeading>

              <Typography component="p" sx={{ ...BODY, fontSize: 14.5, m: 0, mt: 1 }}>
                Still need help? We’d love to hear from you
              </Typography>

              <Box sx={{ mt: 1.5, mx: -0.5 }}>
                <RailLink to="/contact">Contact us</RailLink>
                <Divider sx={{ my: 0.5 }} />
                <RailLink href="https://www.xilolo.com" icon={null}>
                  www.xilolo.com
                </RailLink>
              </Box>

              <Typography
                component="p"
                sx={{ ...CAPTION, fontSize: 12.5, m: 0, mt: 1.5, color: "text.disabled" }}
              >
                Twitter / Instagram / TikTok:{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                  @xilolo_hq
                </Box>
              </Typography>
            </Paper>

            <Paper elevation={0} sx={RAIL_PAPER}>
              <RailHeading>Community Guidelines</RailHeading>

              <Typography component="p" sx={{ ...BODY, fontSize: 14.5, m: 0, mt: 1 }}>
                To keep Xilolo fun for everyone, please avoid:
              </Typography>

              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  mt: 1.5,
                  p: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {GUIDELINE_DONT.map((line) => (
                  <Box
                    key={line}
                    component="li"
                    sx={{
                      ...BODY,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1.25,
                    }}
                  >
                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        flexShrink: 0,
                        fontSize: 13,
                        color: "primary.dark",
                        lineHeight: 1.6,
                      }}
                    >
                      &mdash;
                    </Box>
                    <Box component="span">{line}</Box>
                  </Box>
                ))}
              </Box>

              <Button
                component={RouterLink}
                to="/community-guidelines"
                variant="text"
                disableElevation
                endIcon={<MenuBookOutlined sx={{ fontSize: 17 }} />}
                sx={{
                  mt: 2,
                  ml: -1.5,
                  px: 1.5,
                  py: 0.75,
                  minHeight: 40,
                  fontSize: 14,
                  color: "primary.dark",
                  "&:hover": { backgroundColor: "rgba(6,112,125,0.06)" },
                }}
              >
                Read the full guidelines
              </Button>
            </Paper>

            <Paper elevation={0} sx={{ ...RAIL_PAPER, pb: 2 }}>
              <Typography component="p" sx={{ ...OVERLINE, m: 0 }}>
                Email
              </Typography>

              <Link
                href="mailto:support@xilolo.com"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.75,
                  fontFamily: '"Plus Jakarta Sans", "Work Sans", system-ui, sans-serif',
                  fontSize: { xs: 19, md: 20 },
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "text.primary",
                  textDecoration: "none",
                  wordBreak: "break-word",
                  borderRadius: 1,
                  "&:hover": { color: "primary.dark", textDecoration: "none" },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 3,
                  },
                }}
              >
                support@xilolo.com
              </Link>
            </Paper>
          </Box>
        </Box>

        {/* ── Closing ───────────────────────────────────────────────────── */}
        <Divider sx={{ mt: { xs: 6, md: 9 } }} />
        <Typography
          component="p"
          sx={{ ...CAPTION, m: 0, mt: 3, textAlign: "center", color: "text.disabled" }}
        >
          Thank you for your feedback!
        </Typography>
      </Container>
    </Box>
  );
}

export default Support;
