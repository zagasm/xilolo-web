import React from "react";
import { Box, Typography } from "@mui/material";
import { Body, Caption, Eyebrow, Lead, SECTION_SX, SectionTitle } from "./AboutPrimitives";

/**
 * "Made for real events" — who the platform is for.
 *
 * Two columns: prose on the left, a hairline list of what is actually in the
 * product on the right. This replaces the old 3-card mosaic; the facts are the
 * same ones (the six feature names, the team-roles line, "built for creators
 * everywhere"), the 24/7 and +42 countries numbers now live in the stat strip
 * above so they are not printed twice.
 *
 * The intro used to end with "...real audiences and real revenue." — the
 * revenue claim was removed by founder instruction and is not to come back.
 */
const FEATURES = [
  "Creator tools",
  "Ticketing",
  "Live chat",
  "Replays",
  "Analytics",
  "Payouts",
];

export default function AboutEcosystemSection() {
  return (
    <Box component="section" aria-labelledby="who-its-for-title" sx={SECTION_SX}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,7fr) minmax(0,5fr)" },
          columnGap: { md: 8 },
          rowGap: { xs: 5, md: 0 },
        }}
      >
        {/* Prose */}
        <Box>
          <Eyebrow sx={{ mb: 2 }}>Made for real events</Eyebrow>
          <SectionTitle id="who-its-for-title" sx={{ maxWidth: "20ch" }}>
            Built for organisers, performers, and fans.
          </SectionTitle>

          <Box sx={{ mt: 3 }}>
            <Lead sx={{ fontSize: 17 }}>
              Xilolo is a platform for recurring events and serious creators. We
              built it for the way live shows actually run.
            </Lead>
          </Box>

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Body>
              Xilolo is built for organisers who run shows regularly. Plan your
              calendar, manage performers, sell tickets, and pay out smoothly.
            </Body>
            <Body>
              After each event, you can see what worked. Who showed up, where people
              stayed engaged, and what to improve for the next show.
            </Body>
            <Body>
              The goal is simple. Run a professional live show from one place and
              stay in control of your brand, your audience, and your money.
            </Body>
            <Body>
              Plan events, manage your show, and keep everything in one place — from
              setup to payout.
            </Body>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 2.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Caption sx={{ fontSize: 13, maxWidth: "44ch" }}>
              Built for creators everywhere — from small rooms to big stages.
            </Caption>
          </Box>
        </Box>

        {/* Hairline list of what ships in the product */}
        <Box sx={{ alignSelf: "start" }}>
          <Typography
            component="h3"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              lineHeight: 1.5,
              textTransform: "uppercase",
              color: "text.secondary",
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            In the platform
          </Typography>

          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {FEATURES.map((feature) => (
              <Box
                component="li"
                key={feature}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  py: 1.75,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {feature}
              </Box>
            ))}

            <Box
              component="li"
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                py: 1.75,
              }}
            >
              <Box
                component="span"
                sx={{ display: "block", fontSize: 15, fontWeight: 500, color: "text.primary" }}
              >
                Roles for your team and collaborators
              </Box>
              <Box sx={{ mt: 0.5 }}>
                <Caption sx={{ fontSize: 13 }}>
                  Invite people in without losing control.
                </Caption>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
