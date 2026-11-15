import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * "What happens after you reach out" — the page's closing section.
 *
 * The previous version was three identical cards, each with an icon in an
 * accent-soft circle above a title: the exact template shape the founder called
 * out. This is a numbered editorial list instead — 01 / 02 / 03 in the left
 * gutter, the heading on the left column, the sentence on the right, every row
 * separated by a 1px hairline. No icons, no cards, no shadows, no chips.
 *
 * Copy is unchanged: the eyebrow, the section title, the intro sentence and the
 * three ideas with their body lines (plus the "< 24 hrs avg. reply" note, now a
 * tracked caption under the first heading rather than a chip).
 *
 * Colour note: `#root p { color: inherit }` outranks MUI's class colours, so
 * the muted tint is applied to the parent Box of each body line.
 */

const ITEMS = [
  {
    no: "01",
    title: "Fast response",
    body: "We reply within 24 hours. If your event is close, include the date.",
    note: "< 24 hrs avg. reply",
  },
  {
    no: "02",
    title: "Clear plan",
    body: "We outline the steps from setup to going live, based on your exact needs.",
    note: null,
  },
  {
    no: "03",
    title: "Made for real teams",
    body: "Solo host or full crew, we help you run the show without confusion.",
    note: null,
  },
];

export default function ContactMetaSection() {
  return (
    <Box component="section" aria-labelledby="contact-next-title">
      {/* Heading left, standfirst right — no centred block. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 6fr) minmax(0, 6fr)" },
          columnGap: { md: 6 },
          rowGap: { xs: 2.5, md: 0 },
          alignItems: "end",
          mb: { xs: 4, md: 5 },
        }}
      >
        <Box>
          <Typography
            variant="overline"
            component="div"
            sx={{ color: "primary.dark", display: "block" }}
          >
            What happens after you reach out
          </Typography>

          <Typography
            id="contact-next-title"
            variant="h2"
            component="h2"
            sx={{
              mt: 2,
              fontSize: { xs: 26, md: 34 },
              lineHeight: 1.1,
              letterSpacing: "-0.028em",
              maxWidth: "20ch",
              textWrap: "balance",
            }}
          >
            A short call, a clear plan, and a smooth launch.
          </Typography>
        </Box>

        <Box sx={{ color: "text.secondary", maxWidth: "52ch" }}>
          <Typography component="p" sx={{ fontSize: { xs: 15, md: 16 }, lineHeight: 1.62 }}>
            We keep it simple. We will understand your event, suggest the right
            setup, and help you decide how to run it on Xilolo.
          </Typography>
        </Box>
      </Box>

      {/* The numbered list: hairline top, hairline between rows, hairline bottom. */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        {ITEMS.map((item) => (
          <Box
            key={item.no}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "2.25rem minmax(0, 1fr)",
                md: "4rem minmax(0, 5fr) minmax(0, 7fr)",
              },
              columnGap: { xs: 1.5, md: 4 },
              rowGap: 1,
              alignItems: "baseline",
              py: { xs: 3, md: 3.5 },
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "primary.dark",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.no}
            </Typography>

            <Box>
              <Typography
                variant="h3"
                component="h3"
                sx={{ fontSize: { xs: 17, md: 19 }, letterSpacing: "-0.015em", lineHeight: 1.3 }}
              >
                {item.title}
              </Typography>

              {item.note ? (
                <Typography
                  component="div"
                  sx={{
                    mt: 0.75,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  {item.note}
                </Typography>
              ) : null}
            </Box>

            <Box
              sx={{
                gridColumn: { xs: "2 / -1", md: "auto" },
                color: "text.secondary",
                maxWidth: "56ch",
              }}
            >
              <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.62 }}>
                {item.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
