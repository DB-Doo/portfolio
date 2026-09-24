/*
Case studies for the UX portfolio. Written for hiring managers: the problem, the people,
the decisions and why, and what was tried and dropped. Every claim here is sourced from the
project's own repo (design docs, commits, tester notes). Nothing unshipped is described as
shipped. Copy avoids em dashes and speed claims.
*/

export type Figure = {
  src: string;
  alt: string;
  caption?: string;
  /** phone = tall screenshot shown in a device-width column; wide = full-width image */
  shape: "phone" | "wide";
  width: number;
  height: number;
};

export type Decision = {
  title: string;
  before: string;
  after: string;
  why: string;
  status?: string;
};

export type Exploration = {
  title: string;
  body: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  summary: string;
  role: string;
  timeline: string;
  platform: string;
  cover: Figure;
  problem: string[];
  quote?: { text: string; source: string };
  audience: string[];
  constraints: string[];
  decisions: Decision[];
  comparison?: { before: Figure; after: Figure; caption: string };
  explorations: Exploration[];
  studies?: Figure[];
  gallery: Figure[];
  outcome: string[];
  next: string[];
  links: { label: string; href: string }[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "doto-launcher",
    title: "dot.o Launcher",
    kind: "Android home screen",
    status: "Live on Google Play",
    summary:
      "A home screen without a grid. One canvas where you put apps and widgets anywhere, and learn where things live the way you learn a room.",
    role: "Sole designer and developer",
    timeline: "April 2026 to now",
    platform: "Android phones, foldables and tablets",
    cover: {
      src: "/images/doto/01-spatial-home.webp",
      width: 720,
      height: 1280,
      alt: "dot.o home screen: apps and round widgets placed freely on a dark dotted canvas",
      shape: "phone",
    },
    problem: [
      "Most Android launchers are pages of identical grids. Minimal launchers go the other way and strip everything out. Neither lets you arrange your phone the way you arrange a desk.",
      "I wanted a home screen that works like a place. You put things where you want them, your hand learns where they are, and the screen stays calm when you are not touching it.",
    ],
    quote: {
      text: "The problem with general minimal launchers is that they confine you in a small space. It suffocates me. This launcher doesn't.",
      source: "First outside tester, Play closed test",
    },
    audience: [
      "People who customize their phones and are tired of the grid.",
      "Foldable owners, who switch between a narrow cover screen and a near-tablet inside screen many times a day.",
      "A closed test of at least 12 testers over 14 days before public release.",
    ],
    constraints: [
      "No ads, no account and no analytics. Without a dashboard, everything I learned came from testers, their screenshots and my own daily use.",
      "A still home screen must cost no battery. Motion only happens when you touch it or music is playing.",
      "Every screen from a folded cover display to an unfolded tablet, and every system text size.",
    ],
    decisions: [
      {
        title: "Hints instead of a tutorial",
        before:
          "A seven-step first-run tutorial that walked new users through every gesture.",
        after:
          "One hint at a time, shown only when that gesture would help. It disappears the moment you use it and never blocks anything.",
        why: "Walking through the tutorial myself, it felt like a list of chores in an order the launcher chose. A tutorial teaches by obligation; a hint teaches by being useful, and only a hint survives being ignored. I then cut the hint for panning, because people already know how to drag. Only the gestures nobody would find alone earn one.",
      },
      {
        title: "One app drawer, not three",
        before:
          "Three drawer styles (Orbit, Catalog and the new mesh drawer), each with its own quirks.",
        after: "The mesh drawer is the only drawer.",
        why: "Three drawers meant every improvement had to be made three times, or they quietly drifted apart. One drawer done well beats three done partly.",
      },
      {
        title: "Put the background where people look for it",
        before:
          "The canvas material lived under the music visualizer settings, so turning music off hid the choice of background.",
        after: "The material moved to Appearance.",
        why: "A background is an appearance question that happens to react to music, not a music question. People look for it where they change how the phone looks.",
      },
      {
        title: "A pinned canvas, from a tester's request",
        before:
          "The canvas always panned when you dragged it, which made accidental moves easy.",
        after:
          "Press the drawer handle down to pin the camera. A drag then stretches the fabric instead of moving the view.",
        why: "The first tester asked for a lockdown mode three separate times. I called it pinned rather than locked, because the canvas still responds; it just stops moving away from you.",
      },
      {
        title: "Hide the numbers, keep the choices",
        before:
          "Tuning sliders for effects like raindrop size, exposed to everyone.",
        after:
          "Sensible fixed values, with the meaningful choices left in settings.",
        why: "Picking good values is my job, not the user's. A feature with its numbers hidden is finished; a feature hidden entirely is missing.",
      },
      {
        title: "Looks over Parts",
        status: "In progress",
        before:
          "Fifteen buttons that each changed a different slice of the appearance, six names for the background and seven meanings of the word style.",
        after:
          "One gallery of complete Looks, and six single-purpose Parts: Colors, Font, Icons, Widgets, Controls and Fabric. The background has one name: Fabric.",
        why: "I was confused by my own settings, so users certainly were. An audit counted the overlap. A Look never overrides a personal accessibility choice, so someone who turned tilt off for motion sensitivity never has it switched back on. The first phase, ownership and undo, has shipped.",
      },
    ],
    comparison: {
      before: {
        src: "/images/doto/menu-before.webp",
        width: 720,
        height: 1576,
        alt: "Home menu before: theme swatches overlap the menu buttons",
        shape: "phone",
      },
      after: {
        src: "/images/doto/menu-after.webp",
        width: 720,
        height: 1576,
        alt: "Home menu after: theme swatches arc around the buttons without covering them",
        shape: "phone",
      },
      caption:
        "The home menu redesign. In the first pass, the theme swatches fanned out from wherever your finger landed and covered the new, larger buttons. Now they fan from the menu's own centre and bend around the buttons, and fold into a shelf when the arc will not fit. Buttons start at 96dp, labels follow the system text size, and zooming the canvas no longer shrinks them.",
    },
    explorations: [
      {
        title: "A paged grid",
        body: "I wrote a spec that replaced the free canvas with tidy pages of dots, and built it. Three days later I went back to the free canvas, and it has been the product ever since.",
      },
      {
        title: "A settings redesign",
        body: "Two days on a new structure for settings, with a depth ladder and a radio-style control kit. After using it, I chose to refine the original sheet instead. The typography work survived and became the default.",
      },
      {
        title: "Drag to dismiss settings",
        body: "Removed after three attempts to tame it. A tester asked for the menu to be completely solid against accidental swipes, and they were right.",
      },
      {
        title: "An edge-fade effect",
        body: "Six attempts, then reverted. The lesson became a rule: capture frames from the device before changing anything visual, instead of iterating on memory.",
      },
    ],
    studies: [
      {
        src: "/images/doto/icon-study.webp",
        width: 1536,
        height: 900,
        alt: "Icon study comparing a capital and a lowercase dotted O mark",
        caption:
          "Icon study. The cyan dot reads as punctuation, not an orbiting node. Tested at launcher sizes in three mask shapes.",
        shape: "wide",
      },
      {
        src: "/images/doto/type-study.webp",
        width: 1440,
        height: 1110,
        alt: "Side by side comparison of two neon typefaces at identical sizes",
        caption:
          "Neon type study. Two faces at identical sizes and light. Beon's open tube ends suit big numerals; Tilt Neon stays readable in small text. The shipped Neon option pairs them.",
        shape: "wide",
      },
    ],
    gallery: [
      {
        src: "/images/doto/03-visualizer.webp",
        width: 720,
        height: 1280,
        alt: "A music widget with a dotted waveform",
        caption: "Music you can see",
        shape: "phone",
      },
      {
        src: "/images/doto/04-widget-catalog.webp",
        width: 720,
        height: 1280,
        alt: "The widget catalog: round widgets shown at their real size",
        caption: "Widgets at their true size",
        shape: "phone",
      },
      {
        src: "/images/doto/06-light-theme.webp",
        width: 720,
        height: 1280,
        alt: "The home screen in a light theme",
        caption: "Light palettes",
        shape: "phone",
      },
      {
        src: "/images/doto/07-settings.webp",
        width: 720,
        height: 1280,
        alt: "The settings sheet with six plainly named sections",
        caption: "Settings in plain words",
        shape: "phone",
      },
    ],
    outcome: [
      "Version 2.0 went to Google Play production on 18 September 2026, after a closed test.",
      "Tester feedback shaped the release. The daylight complaint (\"in daylight I can't see anything\") was answered with light palettes. The drawer controls moved to the bottom after a tester said they were out of thumb reach.",
      "It is early. The community is small and mostly testers, so I don't yet have signal from strangers.",
    ],
    next: [
      "Finish Looks and Parts, so changing how the phone looks is one clear decision instead of fifteen.",
      "Run a five-person usability test with people who have never seen the launcher.",
    ],
    links: [
      { label: "Get it on Google Play", href: "https://play.google.com/store/apps/details?id=dev.dbdoo.launcher" },
      { label: "Product page", href: "/doto-launcher" },
    ],
  },
  {
    slug: "wide",
    title: "Wide",
    kind: "Mobile creative editor",
    status: "Google Play beta",
    summary:
      "An Android editor for designing one continuous image that people swipe through as an Instagram carousel.",
    role: "Sole designer and developer",
    timeline: "April to June 2026",
    platform: "Android",
    cover: {
      src: "/images/wide/editor-photo.webp",
      width: 720,
      height: 1560,
      alt: "Wide editor: photos arranged across two carousel slides with a red seam line between them",
      shape: "phone",
    },
    problem: [
      "A seamless carousel is one wide image cut into slides. Most tools make you design it as separate squares and hope the edges line up, or design it on a desktop and slice it by hand.",
      "Wide lets you work on the whole strip at once, on your phone, and see exactly where every cut will fall.",
    ],
    audience: [
      "Photographers and small creators who post carousels and work from their phones.",
    ],
    constraints: [
      "A phone screen is narrow and the canvas is very wide, so the editor has to feel roomy without hiding tools.",
      "The export has to match Instagram's slide sizes exactly, or the seams show.",
    ],
    decisions: [
      {
        title: "One continuous canvas",
        before: "Designing each slide on its own.",
        after:
          "One long artboard with the slide boundaries drawn on it. Photos and text can sit across a seam.",
        why: "The whole point of a seamless carousel is the part that crosses the cut. You can only design that if you can see both sides at once.",
      },
      {
        title: "Seams you can read at a glance",
        before: "Thin red seam lines inside the canvas, easy to lose on a busy photo.",
        after:
          "The lines stay, joined by small T-shaped registration ticks just outside the canvas edge, above and below every seam.",
        why: "Borrowed from print layout. The ticks stay readable on any photo, and because they sit outside the canvas and look nothing like a handle, nobody tries to drag them.",
      },
      {
        title: "Layout editing is the export preview",
        before: "Arranging slides and previewing the export were separate steps.",
        after:
          "Editing the layout dims everything outside the canvas and shows it on white, exactly as it will export.",
        why: "One mode instead of two, and no surprises when the file lands in your camera roll.",
      },
      {
        title: "Motion that feels like one app",
        before:
          "Panels animated with a dozen different durations and curves, depending on which screen they lived on.",
        after: "Every transition uses a small shared set of motion tokens.",
        why: "A consistency audit found that the two busiest screens ignored the house motion style. Each difference is tiny, but together they made the app feel assembled rather than designed.",
      },
    ],
    explorations: [],
    gallery: [
      {
        src: "/images/wide/editor-carousel.webp",
        width: 720,
        height: 1560,
        alt: "Wide editor showing a four-slide carousel with numbered slides and a photo tray",
        caption: "Numbered slides and a photo tray",
        shape: "phone",
      },
    ],
    outcome: [
      "In beta testing on Google Play.",
      "I kept a written vocabulary for every surface in the app, so feedback, specs and code all use the same names.",
    ],
    next: ["Get the beta into more creators' hands and watch where they get stuck."],
    links: [],
  },
  {
    slug: "bid-tracker",
    title: "Bid Tracker",
    kind: "Client project",
    status: "In daily use",
    summary:
      "A bid and cost tracker for a contractor who was running the business out of spreadsheets and text threads.",
    role: "Designer and developer, working directly with the owner",
    timeline: "6 days",
    platform: "Web, mobile-first",
    cover: {
      src: "/images/bidtracker/dashboard.png",
      width: 1280,
      height: 900,
      alt: "Bid Tracker dashboard with project cards and budget bars",
      shape: "wide",
    },
    problem: [
      "The owner's bids were scattered across spreadsheets, costs weren't tracked against them, and receipt photos were lost in text threads.",
    ],
    audience: [
      "The owner, who needs to see every job's budget at a glance.",
      "The people submitting ideas and bids, who need a quick form that works on a phone.",
    ],
    constraints: [
      "The business already ran on a Google Sheet, and the owner needed to keep using it.",
    ],
    decisions: [
      {
        title: "Keep the spreadsheet",
        before: "A Google Sheet that held everything, in a shape only the owner understood.",
        after:
          "An app on top of the same sheet. It can be managed from the app or from the spreadsheet directly.",
        why: "Nothing to migrate and nothing to lose. The owner could keep working the way they already did and adopt the app at their own pace.",
      },
      {
        title: "Budgets as bars, not numbers",
        before: "Rows of figures to add up by hand.",
        after: "Each project shows a budget bar that fills as costs come in.",
        why: "Whether a job is on budget is the first thing to check. A bar answers that at a glance.",
      },
      {
        title: "Receipts attach where they belong",
        before: "Receipt photos sent by text and lost.",
        after: "Photos are attached to the cost they prove and stored in Google Drive.",
        why: "Put the evidence next to the number it explains.",
      },
      {
        title: "Two views for two jobs",
        before: "Everyone looking at the same spreadsheet.",
        after:
          "A simple submission flow for users and an admin dashboard for the owner.",
        why: "Users need one task done quickly. The owner needs the whole picture.",
      },
    ],
    explorations: [],
    gallery: [
      {
        src: "/images/bidtracker/landing.png",
        width: 1280,
        height: 900,
        alt: "Bid Tracker landing screen",
        caption: "Start screen",
        shape: "wide",
      },
      {
        src: "/images/bidtracker/admin.png",
        width: 1280,
        height: 900,
        alt: "Bid Tracker admin dashboard",
        caption: "Admin view",
        shape: "wide",
      },
    ],
    outcome: ["Shipped and in daily use by the client."],
    next: [],
    links: [{ label: "Try the demo", href: "/bid-tracker-demo" }],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
