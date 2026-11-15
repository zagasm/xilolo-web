import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Credibility strip: the numbers that were already on this page, as a
 * hairline-divided row instead of three identical cards.
 *
 * Copies are the ones carried over verbatim from the old page (hero tiles +
 * the 24/7 and "+42 countries" facts from the ecosystem block). The "$480K+ /
 * revenue generated" tile was removed by founder instruction — there is no
 * money-earned figure on this page and none is to be added. Do not substitute
 * another metric here; every value below already existed in the code.
 */
const STATS = [
  { value: "2,500+", label: "Creators & teams" },
  { value: "98%", label: "Stream uptime" },
  { value: "12K+", label: "Tickets sold" },
  { value: "24/7", label: "Reliability" },
  { value: "+42", label: "Countries" },
];

export default function AboutStatsStrip() {
  return (
    <Box
      component="section"
      aria-label="Xilolo in numbers"
      sx={{
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(5, minmax(0,1fr))" },
        }}
      >
        {STATS.map((stat, i) => (
          <Box
            key={stat.label}
            sx={{
              py: { xs: 2.5, md: 3.5 },
              pr: { xs: 2, md: 3 },
              pl: { xs: i % 2 === 0 ? 0 : 2, md: i === 0 ? 0 : 3 },
              borderColor: "divider",
              borderLeftWidth: { xs: i % 2 === 0 ? 0 : 1, md: i === 0 ? 0 : 1 },
              borderLeftStyle: "solid",
              borderTopWidth: { xs: i < 2 ? 0 : 1, md: 0 },
              borderTopStyle: "solid",
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: (theme) => theme.typography.h2.fontFamily,
                fontSize: { xs: 28, md: 30 },
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "text.primary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </Typography>
            <Typography
              component="div"
              sx={{
                mt: 1,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                lineHeight: 1.4,
                color: "text.secondary",
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
