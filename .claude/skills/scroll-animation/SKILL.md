# Scroll Animation Skill

Use this skill when adding scroll-based animation, parallax, animated cards, floating UI, motion sections, reveal effects, active step states, animated landing pages, or interactive product storytelling.

## Core goal

Animation should make the page feel premium, alive, and smooth without making it noisy or slow.

## Animation rules

* Use Framer Motion for React/Next.js projects when available.
* Use CSS transitions where possible.
* Use GSAP only if already installed or if timeline control is clearly needed.
* Avoid adding heavy animation libraries unnecessarily.
* Keep motion subtle and professional.
* Use animation to guide attention, not distract.
* Avoid animation that causes layout shift.
* Prefer transform and opacity animations.
* Keep animations smooth on mobile.
* Add prefers-reduced-motion support.
* Do not animate every single element.
* Do not make the page feel like a demo reel.

## Recommended animation patterns

Use:

* Fade up on section entry.
* Slight parallax on floating cards.
* Soft floating loop for 3D-style objects.
* Subtle card tilt on hover.
* Scroll reveal for feature cards.
* Timeline progress for process sections.
* Active step change while scrolling.
* Horizontal chip carousel with pause on hover.
* Soft glow movement behind important cards.
* Smooth back-to-top behavior.

Avoid:

* Fast bouncing animations.
* Excessive rotation.
* Overlapping animations fighting each other.
* Scroll hijacking.
* Heavy canvas/WebGL unless specifically needed.
* Animations that break on mobile.
* Animations that hide important content.
* Motion that reduces readability.

## For Xilolo

The animation should feel:

* Cinematic
* Premium
* Smooth
* Clean
* Live-streaming inspired
* Realistic
* Product-focused

Use animation for:

* Floating hero cards
* Live status dots
* Ticket sales card
* Analytics card
* Stream quality card
* Upload progress card
* Live pipeline cards
* Three-step active state
* AI chat card glow
* Feature card reveals
* Chip carousel
* Back-to-top button

Do not overuse red animations. Red should feel intentional and powerful.

## Technical behavior

Before adding animation:

* Inspect the framework.
* Check if Framer Motion, GSAP, or other animation packages are already installed.
* Prefer existing packages.
* If a new package is needed, explain why before using it.

Implementation:

* Use reusable animation variants where possible.
* Keep animations declarative and easy to adjust.
* Add reduced-motion fallback.
* Avoid hydration issues in Next.js.
* Avoid browser-only APIs without proper guards.
* Avoid layout shift.
* Lazy-load heavy visual sections if needed.
* Keep animation performant on mobile.

Testing:

* Check desktop, tablet, and mobile.
* Check reduced-motion behavior.
* Check build/lint.
* Fix overflow, jitter, and bad scroll behavior.
