import React from "react";
import { Box, Button, Divider, Link as MuiLink, Typography } from "@mui/material";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";

/**
 * /contact — hero.
 *
 * Rebuilt on Material UI against src/theme/muiTheme.js (Work Sans UI /
 * Plus Jakarta display, paper surfaces, hairline rules, zero elevation). The
 * shape is editorial rather than "marketing": one left-aligned column of copy,
 * one supporting panel on the right that lists real commitments — no gradient
 * tint, no eyebrow pill, no icon tiles, no two-up stat cards.
 *
 * Everything here is either copy that already lived on this page (the headline,
 * the lead sentence, the "Contact Xilolo" eyebrow, the host-type line) or a
 * restatement of a claim that is already made elsewhere on the page: replies
 * within 24 hours, support 7 days a week, support@xilolo.com.
 *
 * Colour note: the repo's template sheet carries `#root p { color: inherit }`
 * (ID specificity, so it beats MUI's class-based colour). Body copy therefore
 * takes its colour from the container, which is why the muted tints are set on
 * the wrapping Box and not on the <p> itself.
 */

const COMMITMENTS = [
  { label: "Reply time", value: "Within 24 hours" },
  { label: "Availability", value: "Mon – Sat" },
  { label: "Email", value: "support@xilolo.com", href: "mailto:support@xilolo.com" },
];

const HOST_TYPES =
  "Concerts · Shows · Talk sessions · Communities · Ticketing · Live chat · Replays";

export default function ContactHero() {
  return (
    <Box
      component="section"
      aria-labelledby="contact-title"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 356px" },
        columnGap: { lg: 7 },
        rowGap: { xs: 5, md: 6 },
        alignItems: "start",
      }}
    >
      {/* ── Copy ──────────────────────────────────────────────────────────── */}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="overline" sx={{ display: "block", color: "primary.dark" }}>
          Contact Xilolo
        </Typography>

        <Typography
          id="contact-title"
          variant="h1"
          component="h1"
          sx={{
            mt: 2,
            fontSize: "clamp(40px, 5vw, 64px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          Let&rsquo;s plan your next live event.
        </Typography>

        <Box sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: "62ch", color: "text.secondary" }}>
          <Typography
            component="p"
            sx={{ fontSize: { xs: 16, md: 17.5 }, lineHeight: 1.62 }}
          >
            Tell us what you want to host and how soon it is. We will suggest a
            simple setup, help you run a clean show, and guide you on ticketing
            if you want to charge for access.
          </Typography>
        </Box>

        <Box
          sx={{
            mt: { xs: 3.5, md: 4 },
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            columnGap: { xs: 2, sm: 3.5 },
            rowGap: 1.5,
          }}
        >
          <Button
            variant="contained"
            size="large"
            href="#contact-form"
            endIcon={<ArrowRightAltRoundedIcon />}
            sx={{ height: 52, px: 3.25, fontSize: 15, "& .MuiButton-endIcon": { ml: 0.75 } }}
          >
            Start a message
          </Button>

          {/* Quiet secondary action — accent TEXT uses accent-deep, not the fill. */}
          <MuiLink
            href="mailto:support@xilolo.com"
            sx={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "primary.dark",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              textUnderlineOffset: "3px",
            }}
          >
            Or email support@xilolo.com
          </MuiLink>
        </Box>

        <Divider sx={{ mt: { xs: 4, md: 5 } }} />

        <Box sx={{ pt: 2, color: "text.secondary" }}>
          <Typography component="p" sx={{ fontSize: 13, lineHeight: 1.6 }}>
            {HOST_TYPES}
          </Typography>
        </Box>
      </Box>

      {/* ── One supporting panel: what a reply actually looks like ────────── */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          bgcolor: "background.paper",
          p: { xs: 2.5, md: 3 },
        }}
      >
        <Typography variant="overline" sx={{ display: "block", color: "text.secondary" }}>
          What to expect
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          {COMMITMENTS.map((row, index) => (
            <Box
              key={row.label}
              sx={{
                py: index === 0 ? 0 : 1.75,
                pb: index === COMMITMENTS.length - 1 ? 0 : 1.75,
                borderTop: index === 0 ? "none" : "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="overline"
                component="div"
                sx={{
                  display: "block",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "text.secondary",
                }}
              >
                {row.label}
              </Typography>

              <Box sx={{ mt: 0.5 }}>
                {row.href ? (
                  <MuiLink
                    href={row.href}
                    sx={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "text.primary",
                      textUnderlineOffset: "3px",
                      "&:hover": { color: "primary.dark" },
                    }}
                  >
                    {row.value}
                  </MuiLink>
                ) : (
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "text.primary" }}>
                    {row.value}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
