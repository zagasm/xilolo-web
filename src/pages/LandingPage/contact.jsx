import React from "react";
import { Box, Container, Stack } from "@mui/material";
import ContactHero from "../../component/contact/ContactHero";
import ContactFormSection from "../../component/contact/ContactFormSection";
import ContactMetaSection from "../../component/contact/ContactMetaSection";

/**
 * /contact — the page shell.
 *
 * Rendered inside LandingLayout, which supplies <BrandBar /> (wordmark + Sign
 * in + Get started, in normal flow) and the footer. So: no header here, no nav
 * offset, and no second <main> — the layout already owns one.
 *
 * Editorial rhythm: one Container that lines up with BrandBar's 1200px/32px
 * gutter, three stacked sections at 48px (mobile) / 88px (desktop), generous
 * bottom space before the footer. The page is a single paper surface; the only
 * tonal break is the ink rail in the form's right column. No radial tint, no
 * gradient wash, no decorative blobs — the previous hero glow is gone.
 *
 * `fontFamily` is set on the root because the template sheet types the document
 * in Inter and MUI's CssBaseline is deliberately not mounted (see main.jsx);
 * without this, bare text nodes would fall back to the legacy stack instead of
 * Work Sans.
 */

export default function ContactPage() {
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        fontFamily: (theme) => theme.typography.fontFamily,
        pb: { xs: 8, md: 11 },
      }}
    >
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1200, px: { xs: 2, md: 4 }, pt: { xs: 5, md: 8 } }}
      >
        <Stack spacing={{ xs: 6, md: 11 }}>
          <ContactHero />
          <ContactFormSection />
          <ContactMetaSection />
        </Stack>
      </Container>
    </Box>
  );
}
