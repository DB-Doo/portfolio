# Portfolio Redesign — Contract Conversion

**Date:** 2026-04-09
**Goal:** Redesign Dan Brandt's portfolio to convert visitors into booked contract calls.
**Approach:** "Ship the Closer" — fix the funnel before adding features.

## Target Audience

Mixed: small business owners (non-technical), startup founders (semi-technical), agencies (technical). Copy must work for all three — lead with outcomes, keep tech secondary.

## Page Structure

### 1. Hero
- Headline: "Your app. Built in days."
- Subtitle: "Web apps, mobile apps, automation systems. You get a working product, not a mockup."
- Location: Kansas City, KS · Available for contract work
- Primary CTA: "Book a free call" → Calendly link
- Secondary CTA: "See my work ↓" → smooth scroll to projects
- Testimonial block: Bid Tracker client quote (placeholder until Dan gets the real one)

### 2. Stats Bar
Compact horizontal strip with 4 metrics:
- **6** — Days to ship a full web app
- **517** — Commits in one week
- **4** — Apps shipped
- **10x** — Faster delivery

No header needed. Numbers speak for themselves.

### 3. Projects
Order: client work first, then personal projects showing depth.

Each project card has:
- Title + one-line subtitle
- Timeline badge (gradient pill)
- Problem → What I built → Result format
- Tech stack tags (small, secondary)
- "For you" bridge line (connects personal project to buyer needs)
- Image/video placeholder (right side, 200px wide)

**Project 1: Bid Tracker** (CLIENT PROJECT — gold badge)
- Problem: Contractor drowning in spreadsheets, losing track of bids
- Built: Web app with photo uploads, bid comparison, admin dashboard, Google Sheets backend
- Result: Shipped in 6 days. In daily use.
- Tech: Next.js, Google Sheets API, Vercel

**Project 2: NinKeys** (Engineering depth)
- Challenge: Only dual-swipe keyboard for iOS was abandoned. No source code.
- Built: Reverse-engineered from ARM binaries, custom C++ prediction engine, 517 commits
- Result: 250x faster. 99.5% accuracy. Features Google doesn't have.
- Tech: Swift, C++, Metal GPU, iOS
- Bridge: "If I can reverse-engineer an abandoned app and beat it in a week, your clearly-scoped project is a sure thing."

**Project 3: HeyClaude** (Full-stack + mobile + real-time)
- Problem: Managing two AI agents across two machines, needed wrist control
- Built: Native iOS/watchOS app, voice commands, live terminal streaming, push notifications
- Result: Full mobile + wearable app with real-time WebSocket streaming
- Tech: SwiftUI, watchOS, WebSocket, APNs
- Bridge: "Real-time apps, push notifications, voice interfaces, cross-device sync — the features modern products need."

**Project 4: Vault Daemon** (Backend + systems)
- Problem: 11 fragile scripts and services running productivity system
- Built: One Rust daemon with 10 cron timers, 7 file watchers, event sourcing, Google Calendar sync
- Result: 11 services → 1 process. Runs 24/7 unattended.
- Tech: Rust, SQLite, Tokio, Event Sourcing
- Bridge: "APIs, data pipelines, cron jobs, background workers — I build the backend that keeps your product running."

### 4. How I Work
Moved AFTER projects (impress first, explain second).
Three-column timeline:
- **Day 1: We talk** — 30-min call, scope and timeline before code
- **Days 2-7: I build, you watch** — Daily updates, working demos, fast feedback
- **Week 2: You ship** — Deployed, documented, yours

### 5. Bottom CTA
- Headline: "Tell me what you're building."
- Subtitle: "15-minute call. I'll tell you how fast I can get you there."
- Primary CTA: "Book a free call" → Calendly
- Fallback: email + GitHub link

## Technical Implementation

- Framework: Next.js (existing project)
- Single page: `src/app/page.tsx`
- Styling: Tailwind CSS (already configured)
- No new dependencies needed
- Calendly: embed link (no widget, just href for now)
- Images: existing screenshots in `/public/images/`
- Responsive: mobile-first, single column on mobile

## What Dan Needs to Provide

1. Bid Tracker client testimonial (texting them now)
2. Calendly account URL (or preferred scheduling link)
3. 60-sec Loom walkthroughs per project (post-launch)
4. LinkedIn URL for footer

## Out of Scope (for now)

- Voice clone narration (Phase 2)
- Interactive scroll experience (Phase 2)
- Video embeds (waiting on Loom recordings)
- Pricing signals (needs Dan's input)
- Blog/content section
