import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Eyebrow, Lead } from "./AboutPrimitives";

/**
 * /about hero — four elements and nothing else.
 *
 * Everything that used to sit here (a dark "on-air" card with a fake next-show
 * clock, a second CTA, a decorative radial tint) is gone: the founder's note was
 * that the page looked AI-generated and cluttered. A hero is an eyebrow, one
 * headline, one paragraph, one door in. The stats that lived underneath it now
 * have their own hairline strip (AboutStatsStrip).
 *
 * The only accent in the headline is the phrase that already carried it.
 */
export default function AboutHeroSection() {
  return (
    <Box
      component="section"
      aria-labelledby="about-title"
      sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 7.5 } }}
    >
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <Eyebrow>About Xilolo</Eyebrow>

        <Typography
          variant="h1"
          component="h1"
          id="about-title"
          sx={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            color: "text.primary",
            maxWidth: "15ch",
            textWrap: "balance",
          }}
        >
          Turning{" "}
          <Box component="span" sx={{ color: "primary.dark" }}>
            LIVE shows
          </Box>{" "}
          into a real business.
        </Typography>

        <Lead sx={{ fontSize: { xs: 17, md: 18 }, maxWidth: "60ch" }}>
          Xilolo is a home for live events that feel premium. Host shows, sell
          tickets, and build a real audience that keeps coming back — all from one
          clean platform.
        </Lead>

        <Box sx={{ pt: { xs: 1, md: 1.5 } }}>
          <Button
            component={RouterLink}
            to="/auth/signup"
            variant="contained"
            color="primary"
            size="large"
            sx={{
              "&.Mui-focusVisible": {
                outline: "2px solid",
                outlineColor: "primary.dark",
                outlineOffset: 3,
              },
            }}
          >
            Get started
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
