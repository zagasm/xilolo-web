import React, { useState } from "react";
import { Box, Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Eyebrow, SECTION_SX, SectionTitle } from "./AboutPrimitives";

/**
 * FAQ — real MUI accordions, hairline dividers, no elevation.
 *
 * The old version was five bordered cards with a hand-rolled height animation,
 * which is both noisy and inaccessible (no aria-controls, no keyboard model).
 * Accordion/AccordionSummary/AccordionDetails come with the correct button
 * semantics and aria wiring for free; the theme already strips the shadow,
 * gutters and the ::before rule, so all this file adds is the type.
 *
 * Controlled single-expand: one answer open at a time keeps the column calm and
 * means the +/− glyph can swap without relying on a CSS rotation.
 */
const FAQS = [
  {
    q: "Who is Xilolo for?",
    a: "For organisers, studios, and creators who want to run proper live events. If you care about quality, consistency, and selling tickets, you will feel at home here.",
  },
  {
    q: "Can I start without fancy equipment?",
    a: "Yes. You can start with your phone and upgrade later. If you already have a studio setup with OBS or similar software, that works too.",
  },
  {
    q: "Can I sell tickets for my events?",
    a: "Yes. You can create ticketed events, set your price, and earn directly from your audience. Payouts are handled cleanly inside the platform.",
  },
  {
    q: "Does Xilolo support replays and recorded content?",
    a: "Yes. After your live event ends, you can schedule replay windows and share highlights to keep your content earning beyond the live moment.",
  },
  {
    q: "Where is Xilolo based?",
    a: "16192 Coastal Highway Lewes, Delaware 19958 Sussex County, United States.",
  },
];

export default function AboutFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Box component="section" aria-labelledby="faq-title" sx={{ ...SECTION_SX, pb: { xs: 7, md: 11 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,4fr) minmax(0,8fr)" },
          columnGap: { md: 8 },
          rowGap: { xs: 4, md: 0 },
        }}
      >
        <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, alignSelf: "start" }}>
          <Eyebrow sx={{ mb: 2 }}>FAQ</Eyebrow>
          <SectionTitle id="faq-title" sx={{ maxWidth: "14ch" }}>
            Quick answers before you start.
          </SectionTitle>
          <Typography
            component="p"
            sx={{
              mt: 2,
              fontSize: 15,
              lineHeight: 1.7,
              color: "text.secondary",
              maxWidth: "34ch",
            }}
          >
            These are the questions people ask before their first event.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          {FAQS.map((item, i) => {
            const expanded = openIndex === i;
            return (
              <Accordion
                key={item.q}
                expanded={expanded}
                onChange={() => setOpenIndex(expanded ? -1 : i)}
                disableGutters
                sx={{
                  borderTop: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "transparent",
                  "&.Mui-expanded": { margin: 0 },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    expanded ? (
                      <RemoveIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    ) : (
                      <AddIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    )
                  }
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-header-${i}`}
                  sx={{
                    px: 0,
                    minHeight: 0,
                    "& .MuiAccordionSummary-content": { my: 2.25 },
                    "& .MuiAccordionSummary-expandIconWrapper": { mr: 0 },
                    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                      transform: "none",
                    },
                    "&.Mui-focusVisible": {
                      outline: "2px solid",
                      outlineColor: "primary.dark",
                      outlineOffset: -2,
                      borderRadius: 1,
                    },
                    "&:hover .MuiAccordionSummary-content": { color: "primary.dark" },
                  }}
                >
                  <Typography
                    component="p"
                    sx={{
                      fontSize: { xs: 15, md: 16 },
                      fontWeight: 600,
                      lineHeight: 1.45,
                      letterSpacing: "-0.01em",
                      transition: "color 120ms ease",
                      pr: 2,
                    }}
                  >
                    {item.q}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 0, pb: 2.5 }}>
                  <Box sx={{ color: "text.secondary", maxWidth: "62ch" }}>
                    <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.7 }}>
                      {item.a}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
