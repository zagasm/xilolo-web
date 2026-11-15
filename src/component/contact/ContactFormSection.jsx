import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { showSuccess } from "../ui/toast";

/**
 * Contact form + contact details — presentation rebuilt on Material UI.
 *
 * ── What was NOT touched (functional contract) ──────────────────────────────
 * `submitting` / `sent` state, `handleSubmit` (preventDefault → guard on
 * submitting → 900ms → setSent → showSuccess with the same string), the
 * simulated submit with no endpoint, the visual order of the six controls,
 * every label, placeholder, option value, `required` flag and default value,
 * `disabled={submitting}`, and the "Sending…" / "Send message" labels.
 *
 * ── What changed (presentation only) ────────────────────────────────────────
 * The Tailwind primitives (Card / Field / Input / Button) and the hand-rolled
 * <select>/<textarea> recipes are replaced by Paper, TextField (outlined, with
 * `multiline` for the two textareas), Select + MenuItem, Button and Chip from
 * @mui/material, styled through muiTheme tokens via sx: 12px radii, hairline
 * borders, no elevation, accent as a fill with a white label, 48px submit.
 *
 * The dark rail stays dark (ink surface) because that contrast is the point of
 * the column, but it is flattened: hairline dividers instead of bordered tiles,
 * 10px tracked captions as labels, 15px semibold values, no icon circles and
 * no glow. Real details only: support@xilolo.com, +234 802 379 7265,
 * Mon – Sat 10:00 – 17:00 WAT, 16192 Coastal Highway, Lewes, Delaware 19958.
 *
 * Colour note: `#root p { color: inherit }` in the template sheet outranks
 * MUI's class-based colours, so muted body copy is tinted on its container and
 * rendered as a plain <p> inside it.
 */

const LABELS = {
  role: {
    creator: "Creator / Host",
    agency: "Agency",
    brand: "Brand / Organisation",
    event: "Event organiser",
    other: "Other",
  },
  cadence: {
    once: "One-off / occasional",
    monthly: "1 to 3 times per month",
    weekly: "Weekly",
    often: "Multiple times per week",
  },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    fontSize: 15,
    borderRadius: "12px",
    backgroundColor: "background.paper",
    boxShadow: "none",
  },
  "& .MuiOutlinedInput-input": { padding: "13px 16px" },
  "& .MuiOutlinedInput-inputMultiline": { padding: "12px 16px", lineHeight: 1.6 },
  "& .MuiSelect-select": { py: 1.65, px: 2 },
  "& .MuiSelect-icon": { color: "text.secondary", right: 12 },
};

const labelSx = {
  display: "block",
  mb: 1,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "text.secondary",
  lineHeight: 1.5,
};

const captionSx = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  lineHeight: 1.5,
};

function FieldLabel({ htmlFor, id, children }) {
  return (
    <Typography component="label" htmlFor={htmlFor} id={id} sx={labelSx}>
      {children}
    </Typography>
  );
}

/** One row of the dark rail: tracked caption over a 15px semibold value. */
function RailRow({ caption, children, last = false }) {
  return (
    <Box
      sx={{
        py: 2,
        borderBottom: last ? "none" : "1px solid",
        borderColor: (theme) => alpha(theme.palette.common.white, 0.14),
        "&:last-of-type": { pb: 0 },
      }}
    >
      <Typography component="div" sx={{ ...captionSx, color: (theme) => alpha(theme.palette.common.white, 0.62) }}>
        {caption}
      </Typography>
      <Box sx={{ mt: 0.75 }}>{children}</Box>
    </Box>
  );
}

export default function ContactFormSection() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      showSuccess("Message sent. We will get back to you soon.");
    }, 900);
  };

  return (
    <Box
      component="section"
      id="contact-form"
      aria-labelledby="contact-form-title"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 7fr) minmax(0, 5fr)" },
        columnGap: { lg: 4 },
        rowGap: { xs: 4, md: 4 },
        alignItems: "start",
        scrollMarginTop: "24px",
      }}
    >
      {/* ── Brief ─────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          bgcolor: "background.paper",
          boxShadow: "none",
        }}
      >
        <Typography id="contact-form-title" variant="h2" component="h2" sx={{ fontSize: { xs: 24, md: 28 }, letterSpacing: "-0.025em" }}>
          Tell us about your event
        </Typography>

        <Box sx={{ mt: 1.25, maxWidth: "56ch", color: "text.secondary" }}>
          <Typography component="p" sx={{ fontSize: 14.5, lineHeight: 1.6 }}>
            A few details help us respond with something useful, not a generic reply.
          </Typography>
        </Box>

        {sent ? (
          /* Success state — flat, left-aligned, no coloured icon disc. */
          <Box sx={{ mt: 4, pt: 3.5, pb: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography component="div" sx={{ ...captionSx, color: "primary.dark" }}>
              Sent
            </Typography>
            <Typography variant="h3" component="h3" sx={{ mt: 1.5, fontSize: 22, letterSpacing: "-0.02em" }}>
              Message sent
            </Typography>
            <Box sx={{ mt: 1, maxWidth: "46ch", color: "text.secondary" }}>
              <Typography component="p" sx={{ fontSize: 15, lineHeight: 1.62 }}>
                We will get back to you within 24 hours. Check your inbox.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            component="form"
            noValidate={false}
            onSubmit={handleSubmit}
            sx={{ mt: 3.5, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <Box>
                <FieldLabel htmlFor="contact-full-name">Full name</FieldLabel>
                <TextField
                  id="contact-full-name"
                  type="text"
                  required
                  placeholder="Your name"
                  fullWidth
                  sx={fieldSx}
                />
              </Box>

              <Box>
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <TextField
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@brand.com"
                  fullWidth
                  sx={fieldSx}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <Box>
                <FieldLabel htmlFor="contact-role" id="contact-role-label">
                  You are
                </FieldLabel>
                <Select
                  id="contact-role"
                  defaultValue=""
                  required
                  displayEmpty
                  fullWidth
                  labelId="contact-role-label"
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.75,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "12px",
                          boxShadow: "none",
                          bgcolor: "background.paper",
                          "& .MuiMenuItem-root": { fontSize: 14, minHeight: 40, px: 2 },
                          "& .MuiMenuItem-root.Mui-selected": {
                            bgcolor: "rgba(22, 144, 156, 0.08)",
                          },
                        },
                      },
                    },
                  }}
                  renderValue={(value) =>
                    value === "" ? (
                      <Box component="span" sx={{ color: "text.disabled" }}>
                        Choose one
                      </Box>
                    ) : (
                      LABELS.role[value]
                    )
                  }
                  sx={fieldSx}
                >
                  <MenuItem value="" disabled>
                    Choose one
                  </MenuItem>
                  <MenuItem value="creator">Creator / Host</MenuItem>
                  <MenuItem value="agency">Agency</MenuItem>
                  <MenuItem value="brand">Brand / Organisation</MenuItem>
                  <MenuItem value="event">Event organiser</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </Box>

              <Box>
                <FieldLabel htmlFor="contact-cadence" id="contact-cadence-label">
                  How often do you host?
                </FieldLabel>
                <Select
                  id="contact-cadence"
                  defaultValue=""
                  required
                  displayEmpty
                  fullWidth
                  labelId="contact-cadence-label"
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.75,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "12px",
                          boxShadow: "none",
                          bgcolor: "background.paper",
                          "& .MuiMenuItem-root": { fontSize: 14, minHeight: 40, px: 2 },
                          "& .MuiMenuItem-root.Mui-selected": {
                            bgcolor: "rgba(22, 144, 156, 0.08)",
                          },
                        },
                      },
                    },
                  }}
                  renderValue={(value) =>
                    value === "" ? (
                      <Box component="span" sx={{ color: "text.disabled" }}>
                        Select one
                      </Box>
                    ) : (
                      LABELS.cadence[value]
                    )
                  }
                  sx={fieldSx}
                >
                  <MenuItem value="" disabled>
                    Select one
                  </MenuItem>
                  <MenuItem value="once">One-off / occasional</MenuItem>
                  <MenuItem value="monthly">1 to 3 times per month</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="often">Multiple times per week</MenuItem>
                </Select>
              </Box>
            </Box>

            <Box>
              <FieldLabel htmlFor="contact-host">What do you want to host?</FieldLabel>
              <TextField
                id="contact-host"
                multiline
                rows={4}
                required
                fullWidth
                placeholder="Concert, talk show, church service, comedy night, community hangout, training, panel…"
                sx={fieldSx}
              />
            </Box>

            <Box>
              <FieldLabel htmlFor="contact-when">When is your next event?</FieldLabel>
              <TextField
                id="contact-when"
                multiline
                rows={2}
                fullWidth
                placeholder="Date, time, and any deadlines you are working with"
                sx={fieldSx}
              />
            </Box>

            <Box
              sx={{
                mt: 0.5,
                pt: 3,
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                sx={{ height: 48, fontSize: 15 }}
              >
                {submitting ? "Sending…" : "Send message"}
              </Button>

              <Box sx={{ color: "text.secondary" }}>
                <Typography component="p" sx={{ fontSize: 13, lineHeight: 1.55 }}>
                  We only use your details to reply to this message.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ── Dark rail (the page's one ink surface) + the "already a user" note ─ */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}>
        <Box
          sx={{
            bgcolor: "secondary.main",
            color: "common.white",
            borderRadius: "12px",
            p: { xs: 2.5, md: 3 },
          }}
        >
          <Typography
            component="div"
            sx={{ ...captionSx, color: (theme) => alpha(theme.palette.common.white, 0.62) }}
          >
            Xilolo contact
          </Typography>

          <Box sx={{ mt: 1.5, color: (theme) => alpha(theme.palette.common.white, 0.88) }}>
            <Typography component="p" sx={{ fontSize: 14.5, lineHeight: 1.6 }}>
              If you already have a fixed date, include it. We prioritize messages
              with clear timelines.
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <RailRow caption="Email">
              <MuiLink
                href="mailto:support@xilolo.com"
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "common.white",
                  textUnderlineOffset: "3px",
                  "&:hover": { color: (theme) => alpha(theme.palette.common.white, 0.78) },
                }}
              >
                support@xilolo.com
              </MuiLink>
            </RailRow>

            <RailRow caption="Xilolo line">
              <MuiLink
                href="tel:+234****7265"
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "common.white",
                  textUnderlineOffset: "3px",
                  "&:hover": { color: (theme) => alpha(theme.palette.common.white, 0.78) },
                }}
              >
                +234 802 379 7265
              </MuiLink>
              <Typography
                component="div"
                sx={{ mt: 0.5, fontSize: 13, color: (theme) => alpha(theme.palette.common.white, 0.62), lineHeight: 1.5 }}
              >
                Mon – Sat, 10:00 – 17:00 WAT
              </Typography>
            </RailRow>

            <RailRow caption="Office" last>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "common.white", lineHeight: 1.45 }}>
                16192 Coastal Highway, Lewes
              </Typography>
              <Typography
                component="div"
                sx={{ mt: 0.5, fontSize: 13, color: (theme) => alpha(theme.palette.common.white, 0.62), lineHeight: 1.55 }}
              >
                Delaware 19958, Sussex County
                <br />
                United States
              </Typography>
            </RailRow>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "12px",
            bgcolor: "background.paper",
            boxShadow: "none",
          }}
        >
          <Typography component="div" sx={{ ...captionSx, color: "text.secondary" }}>
            Already using Xilolo?
          </Typography>

          <Box sx={{ mt: 1.25, color: "text.secondary" }}>
            <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.62 }}>
              For billing or show-day issues, use the in-app help section. This
              form is best for new projects and collaborations.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Chip label="In-app help" variant="outlined" size="small" />

            <MuiLink
              component={Link}
              to="/support"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                minHeight: 40,
                fontSize: 14,
                fontWeight: 600,
                color: "primary.dark",
                textUnderlineOffset: "3px",
              }}
            >
              Open support
              <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
            </MuiLink>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
