import React from "react";
import { StepHeader } from "./EventUI";

/*
 * App→web step chrome.
 *
 * Source: lib/features/event/widgets/event_step_shell.dart — the app renders ONE
 * header for both wizard steps: back chip + "Create Event" / "Step N of M"
 * (lines 104-200) and a pill walkthrough with one pill per step (lines 202-292).
 *
 * Step count/labels come from the app's own call sites:
 *   create_event_one.dart:372-376   step 1 of 2, labels [Event Details, Tickets]
 *   create_event_three.dart:115-119 step 2 of 2, labels [Event Details, Tickets]
 * (create_event_four.dart:42 says step 3 of 3 but nothing pushes CreateEventFour —
 *  it is dead code, so the live wizard is two steps + the Review & Publish screen,
 *  preview_screen.dart:577-599, which uses an AppBar instead of the rail.)
 */

export const STEP_LABELS = ["Event Details", "Tickets"];
export const TOTAL_STEPS = STEP_LABELS.length;

export default function ProgressSteps({
  currentStep,
  completedSteps = [],
  onBack,
  stepLabels = STEP_LABELS,
}) {
  return (
    <StepHeader
      step={currentStep}
      totalSteps={stepLabels.length}
      stepLabels={stepLabels}
      onBack={onBack}
    />
  );
}
