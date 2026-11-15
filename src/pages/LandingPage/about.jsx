import React from "react";
import { Box, Container } from "@mui/material";
import AboutHeroSection from "../../component/about/AboutHeroSection";
import AboutStatsStrip from "../../component/about/AboutStatsStrip";
import AboutPipelineSection from "../../component/about/AboutPipelineSection";
import AboutEcosystemSection from "../../component/about/AboutEcosystemSection";
import AboutFaqSection from "../../component/about/AboutFaqSection";

/**
 * /about — Material UI rebuild on the Xilolo theme (src/theme/muiTheme.js).
 *
 * Layout: LandingLayout supplies the minimal BrandBar and the footer CTA, so
 * this file is only the page column — 1200px, paper background, hairline rules
 * between sections. There is no decorative gradient layer any more (the old
 * radial tint at the top of the page was the thing that read as generic), no
 * cards in a row, and no shadows: the theme's elevation scale is all "none", so
 * separation has to come from 1px dividers and whitespace.
 *
 * Font stack comes from the theme via a function-form sx value: the legacy
 * template sheet sets `body { font-family: Inter }` unlayered, which beats
 * Tailwind's layered default, so the theme family has to be reasserted on the
 * page root for Work Sans / Plus Jakarta to render here.
 *
 * Section order: hero (one h1) → numbers → how it works → who it's for → FAQ.
 */
export default function AboutPage() {
  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: "background.default",
        color: "text.primary",
        fontFamily: (theme) => theme.typography.fontFamily,
        width: "100%",
        overflowX: "clip",
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, md: 4 } }}>
        <AboutHeroSection />
        <AboutStatsStrip />
        <AboutPipelineSection />
        <AboutEcosystemSection />
        <AboutFaqSection />
      </Container>
    </Box>
  );
}
