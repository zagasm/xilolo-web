import React from "react";
import { Box, Typography } from "@mui/material";
import { Body, Eyebrow, Lead, SECTION_SX, SectionTitle } from "./AboutPrimitives";

/**
 * "How it works" — a numbered vertical sequence, not three cards.
 *
 * The steps, their order and their wording are the ones from the old card grid;
 * only the container changed. A sequence is the honest shape for a pipeline:
 * 01 → 02 → 03 read top-to-bottom, and the 1px rules do the separating that
 * three identical bordered cards were doing (badly) before.
 */
const STEPS = [
  {
    num: "01",
    label: "Setup",
    title: "Connect and go LIVE.",
    body: "Connect OBS, Ecamm, or hardware encoders. Route to a private stage in a few clicks.",
  },
  {
    num: "02",
    label: "Control room",
    title: "Run your show cleanly.",
    body: "Manage guests, keep the stream steady, and stay focused while the show is live.",
  },
  {
    num: "03",
    label: "Tickets",
    title: "Sell tickets and keep earning.",
    body: "Create ticketed events, sell access, and keep your content working after the show ends.",
  },
];

export default function AboutPipelineSection() {
  return (
    <Box component="section" aria-labelledby="how-it-works-title" sx={SECTION_SX}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,5fr) minmax(0,7fr)" },
          columnGap: { md: 8 },
          rowGap: { xs: 5, md: 0 },
        }}
      >
        {/* Left rail — sticks while the three steps scroll past on desktop. */}
        <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, alignSelf: "start" }}>
          <Eyebrow sx={{ mb: 2 }}>How it works</Eyebrow>
          <SectionTitle id="how-it-works-title" sx={{ maxWidth: "16ch" }}>
            From setup to showtime, all in one flow.
          </SectionTitle>
          <Box sx={{ mt: 3 }}>
            <Lead sx={{ fontSize: 17 }}>
              Built for creators and teams who want consistent shows, not random
              lives.
            </Lead>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Body sx={{ maxWidth: "40ch" }}>
              Create an event, go live, and keep the whole production organized in
              one place. Your show stays smooth and your audience stays locked in.
            </Body>
          </Box>
        </Box>

        {/* The sequence */}
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {STEPS.map((step, i) => (
            <Box
              component="li"
              key={step.num}
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: { xs: "44px minmax(0,1fr)", md: "64px minmax(0,1fr)" },
                columnGap: { xs: 2, md: 3 },
                py: { xs: 3, md: 3.5 },
              }}
            >
              <Typography
                component="span"
                aria-hidden="true"
                sx={{
                  fontFamily: (theme) => theme.typography.h2.fontFamily,
                  fontSize: { xs: 22, md: 24 },
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: "primary.dark",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.num}
              </Typography>

              <Box>
                <Typography
                  component="div"
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.75,
                  }}
                >
                  {step.label}
                </Typography>

                <Typography
                  component="h3"
                  sx={{
                    fontFamily: (theme) => theme.typography.h3.fontFamily,
                    fontSize: { xs: 19, md: 21 },
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                    color: "text.primary",
                  }}
                >
                  {step.title}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Body sx={{ maxWidth: "48ch" }}>{step.body}</Body>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
