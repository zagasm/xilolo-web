// src/pages/DesignSystem/index.jsx
//
// DEV-ONLY showcase (?menu= route is registered behind import.meta.env.DEV in
// App.jsx, so this never ships to production). Its purpose: let a human see
// every primitive and nav state on light and dark without clicking through the
// app, and give QA a single page to screenshot when a design PR lands.
//
// Usage:
//   /design                  → primitives + cards on light and dark
//   /design?menu=explore     → desktop nav with the Explore mega-menu open
//   /design?menu=drawer      → mobile drawer open (use a narrow window)
import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Clapperboard,
  MapPin,
  Radio,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";
import Nav from "../../component/landing/Nav";
import {
  Avatar,
  Button,
  Card,
  Chip,
  CreatorRow,
  EmptyState,
  EventCard,
  Eyebrow,
  Field,
  Input,
  LiveBadge,
  Modal,
  SectionHeading,
  Skeleton,
  Spinner,
  StatTile,
} from "../../component/ui";

const POSTER =
  "https://zagasm-studios.b-cdn.net/livestreaming-placeholder.webp";

function Block({ title, note, children, dark = false }) {
  return (
    <section
      className={`tw:rounded-card tw:border tw:p-5 ${
        dark ? "tw:border-hairline-dark tw:bg-ink" : "tw:border-hairline tw:bg-paper"
      }`}
    >
      <p className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
        {title}
      </p>
      {note ? (
        <p className={`tw:mt-1 tw:text-xs ${dark ? "tw:text-muted-dark" : "tw:text-muted"}`}>{note}</p>
      ) : null}
      <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:gap-3">{children}</div>
    </section>
  );
}

export default function DesignSystem() {
  const [params] = useSearchParams();
  const menu = params.get("menu");

  if (menu === "explore") {
    return (
      <div className="tw:min-h-screen tw:bg-paper tw:pt-28">
        <Nav defaultExploreOpen />
        <p className="tw:mx-auto tw:max-w-[1200px] tw:px-8 tw:text-sm tw:text-muted">
          Explore mega-menu, open by default (hover-intent, click-outside, Escape and route-change
          all close it). Three groups, six real destinations, accent icon pills on a hairline card.
        </p>
      </div>
    );
  }

  if (menu === "drawer") {
    return (
      <div className="tw:min-h-screen tw:bg-paper">
        <Nav defaultDrawerOpen />
      </div>
    );
  }

  return (
    <div className="tw:min-h-screen tw:bg-paper tw:pb-24">
      <Nav />
      <div className="tw:mx-auto tw:flex tw:max-w-[1200px] tw:flex-col tw:gap-6 tw:px-4 tw:pt-28 tw:md:px-8">
        <SectionHeading
          eyebrow="Design system"
          title="Xilolo web primitives"
          subtitle="Every token and component on one page, light and dark. Compare against DESIGN.md; the accent is a fill, headings use the display face, and depth is a hairline — never a shadow."
        />

        <Block title="Buttons" note="One accent fill per group. Ink text on accent (6.27:1) — never white (2.97:1).">
          <Button>Start free</Button>
          <Button variant="secondary">See how it works</Button>
          <Button variant="ghost">Log in</Button>
          <Button variant="danger">Delete event</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </Block>

        <Block title="Status & chips" note="Danger is the only saturated colour allowed to shout.">
          <LiveBadge />
          <LiveBadge label="Live now" />
          <Chip icon={Clapperboard}>Ticketed</Chip>
          <Chip active>Selected</Chip>
          <Chip icon={MapPin}>Lagos</Chip>
        </Block>

        <Block title="Stats" note="Facts only — no invented figures anywhere in the product.">
          <StatTile label="Tickets sold" value="234" delta="+18% this week" />
          <StatTile label="Stream quality" value="98%" />
        </Block>

        <Block title="Identity">
          <CreatorRow name="Adaeze Taiwo" verified meta="128 events" />
          <Avatar size={32} />
        </Block>

        <Block title="Forms">
          <div className="tw:w-full tw:max-w-sm">
            <Field label="Event name" hint="Shown on the ticket and the event page.">
              <Input placeholder="Lagos Live Sessions" />
            </Field>
          </div>
          <div className="tw:w-full tw:max-w-sm">
            <Field label="Email" error="Enter a valid email address">
              <Input defaultValue="not-an-email" invalid />
            </Field>
          </div>
        </Block>

        <Block title="Surfaces — light" note="Radius 12, hairline border, no shadow. Cards sit on paper.">
          <Card className="tw:w-72">
            <Eyebrow>Card</Eyebrow>
            <p className="tw:mt-1 tw:text-sm tw:text-muted">
              Surface colour + hairline is the whole depth system.
            </p>
          </Card>
          <EventCard
            className="tw:w-80"
            poster={POSTER}
            title="Afrobeats Night — Live from Lagos"
            creator="Adaeze Taiwo"
            verified
            date="Sat 12 Oct · 8:00 PM"
            location="Victoria Island"
            price="₦5,000"
            isLive
          />
        </Block>

        <section className="tw:rounded-card tw:border tw:border-hairline-dark tw:bg-ink tw:p-5">
          <p className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.06em] tw:text-muted-dark">
            Surfaces — dark (on-air)
          </p>
          <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <Card dark className="tw:w-72">
              <Eyebrow className="tw:text-accent">Dark card</Eyebrow>
              <p className="tw:mt-1 tw:text-sm tw:text-muted-dark">
                Used for live rows and the on-air break.
              </p>
            </Card>
            <StatTile dark label="Live viewers" value="2,451" delta="+12% now" />
            <EventCard
              className="tw:w-80"
              poster={POSTER}
              title="Sunday Service — Live"
              creator="Grace Chapel"
              date="Sun 13 Oct · 9:00 AM"
              location="Online"
              price="Free"
              isLive
            />
          </div>
        </section>

        <Block title="Loading & empty" note="One skeleton recipe, one empty-state recipe.">
          <Skeleton className="tw:h-24 tw:w-64" />
          <Spinner />
        </Block>

        <Block title="Empty state">
          <div className="tw:w-full">
            <EmptyState
              icon={Ticket}
              title="No tickets yet"
              body="When you book an event it will show up here, with your stream link ready."
              action={<Button size="md">Browse events</Button>}
            />
          </div>
        </Block>

        <Block title="Overlay" note="The only place a shadow is allowed.">
          <div className="tw:w-full">
            <Modal open onClose={() => {}} title="Get the Xilolo app">
              <p className="tw:text-sm tw:text-muted">
                Radius 24 sheet, ink/48 scrim, one primary action. Shown after engagement — never
                on first paint.
              </p>
              <div className="tw:mt-4 tw:flex tw:gap-2">
                <Button size="md">Download for iOS</Button>
                <Button size="md" variant="secondary">
                  Get it on Google Play
                </Button>
              </div>
            </Modal>
          </div>
        </Block>

        <Block title="Icons" note="One system: Lucide, 16/20px, 1.5–2 stroke. Never mixed with icon fonts.">
          <Search className="tw:size-5 tw:text-muted" />
          <Bell className="tw:size-5 tw:text-muted" />
          <Radio className="tw:size-5 tw:text-accent-deep" />
          <CalendarDays className="tw:size-5 tw:text-muted" />
          <Sparkles className="tw:size-5 tw:text-accent-deep" />
        </Block>
      </div>
    </div>
  );
}
