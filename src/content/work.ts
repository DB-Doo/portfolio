/*
Case studies for the UX portfolio. Written for hiring managers who have never heard of these
projects: plain words, no internal feature names, no app-store process details. Every claim is
sourced from the project's own repo (design docs, commits, tester notes), and nothing unshipped
is described as shipped. Copy avoids em dashes and speed claims.
*/

export type Figure = {
  src: string;
  alt: string;
  caption?: string;
  /** phone = tall screenshot shown in a phone frame; wide = browser window or full-width image */
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
  /** The project's own signal colour, used for glows, rules and highlights. */
  accent: string;
  /** Card title: what happened, not the product name. */
  headline: string;
  summary: string;
  /** One or two sentences for the summary box: what I actually did. */
  did: string;
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
    accent: "#67e8f9",
    headline:
      "Designed and shipped a home screen with no grid, shaped by what early testers told me.",
    summary:
      "A phone home screen with no grid. You place apps and widgets anywhere on one open canvas, and remember where things are the way you remember a room.",
    did: "Designed the whole experience and built it: first-run hints instead of a tutorial, one app list instead of three, clearer settings, and a way to hold the screen still that a tester asked for three times.",
    role: "Solo project: design and development",
    timeline: "April 2026 to now",
    platform: "Android phones, foldables and tablets",
    cover: {
      src: "/images/doto/01-spatial-home.webp",
      width: 720,
      height: 1280,
      alt: "dot.o home screen: apps and round widgets placed freely on a dark dotted background",
      shape: "phone",
    },
    problem: [
      "Almost every phone home screen is the same: pages of icons snapped to a grid. The minimal alternatives go the other way and strip nearly everything out. Neither lets you arrange your phone the way you arrange your desk.",
      "I wanted a home screen that works like a place. You put things where you want them, your hand learns where they are, and the screen stays calm until you touch it.",
    ],
    quote: {
      text: "The problem with general minimal launchers is that they confine you in a small space. It suffocates me. This launcher doesn't.",
      source: "An early tester",
    },
    audience: [
      "People who like setting up their phone their own way and are tired of the grid.",
      "People with foldable phones, who switch between a narrow outer screen and a large inner screen many times a day.",
    ],
    constraints: [
      "No ads, no accounts and no tracking. That meant no analytics dashboard, so everything I learned came from people using it, their screenshots and my own daily use.",
      "A home screen you are not touching should not drain your battery, so nothing moves unless you touch it or music is playing.",
      "It has to work on every screen, from a folded phone's outer display to an unfolded tablet, and at every text size people choose in their phone settings.",
    ],
    decisions: [
      {
        title: "Hints instead of a tutorial",
        before:
          "A seven-step tutorial on first launch that walked people through every gesture.",
        after:
          "One small hint at a time, shown only when that gesture would help. It disappears as soon as you use it and never blocks anything.",
        why: "Going through the tutorial myself, it felt like a list of chores. A hint teaches by being useful at the right moment, and it still works if you ignore it. I also dropped the hint for dragging around the canvas, because everyone already knows how to drag. Only gestures people would not discover on their own get a hint.",
      },
      {
        title: "One app list, not three",
        before:
          "Three different styles for the list of all your apps, each with its own quirks.",
        after: "One app list, done properly.",
        why: "Three versions meant every improvement had to be made three times, or they slowly drifted apart. One version done well beats three done halfway.",
      },
      {
        title: "Put settings where people look for them",
        before:
          "The background style was filed under the music settings, so turning music off also hid the choice of background.",
        after: "The background moved to Appearance, next to colors and fonts.",
        why: "People think of the background as part of how their phone looks. It happens to react to music, but that is not where anyone goes looking for it.",
      },
      {
        title: "A way to hold the screen still",
        before:
          "Any drag on the home screen moved the view, so it was easy to scroll away by accident.",
        after:
          "Press the handle at the bottom of the screen to pin the view in place. Dragging then plays with the background instead of moving the screen.",
        why: "An early tester asked for a lock three separate times. I called it pinned rather than locked, because the screen still responds to you. It just stops sliding away.",
      },
      {
        title: "Hide the numbers, keep the choices",
        before:
          "Sliders for fine-tuning effects, such as how big the raindrops are, shown to everyone.",
        after:
          "Good values chosen for you, with only the choices that matter left in settings.",
        why: "Picking good values is my job, not the user's. A feature with its numbers hidden is finished. A feature hidden entirely is missing.",
      },
      {
        title: "Simpler ways to change the look",
        status: "In progress",
        before:
          "Fifteen different buttons that each changed one slice of the appearance, six different names for the background and seven meanings of the word style.",
        after:
          "A gallery of complete looks to pick from, plus six clearly named things you can adjust on their own: colors, font, icons, widgets, controls and background.",
        why: "I was getting confused by my own settings, so users certainly were. Picking a new look never overrides accessibility choices, so someone who turned motion off keeps it off. The first part of this has shipped.",
      },
    ],
    comparison: {
      before: {
        src: "/images/doto/menu-before.webp",
        width: 720,
        height: 1576,
        alt: "Home menu before: round color choices overlap the menu buttons",
        shape: "phone",
      },
      after: {
        src: "/images/doto/menu-after.webp",
        width: 720,
        height: 1576,
        alt: "Home menu after: the color choices curve around the buttons without covering them",
        shape: "phone",
      },
      caption:
        "The home menu. In the first version, the color choices fanned out from wherever your finger landed and covered the buttons. Now they curve around the buttons, and line up to the side when there is not enough room. The buttons are bigger, their labels follow your phone's text size, and zooming out no longer shrinks them.",
    },
    explorations: [
      {
        title: "Going back to a grid",
        body: "I designed and built a version with tidy pages of icons, like a normal home screen. Three days later I went back to the open canvas, and it has been the product ever since.",
      },
      {
        title: "A new settings layout",
        body: "I spent two days on a completely new structure for settings. After using it, I chose to improve the original design instead. The new typography from that work stayed and became the default.",
      },
      {
        title: "Swipe down to close settings",
        body: "Removed after three attempts to make it feel right. A tester asked for settings to stay put and not close on an accidental swipe, and they were right.",
      },
      {
        title: "A fading edge effect",
        body: "Six attempts, then removed. It taught me a rule I still follow: capture the screen before changing anything visual, and compare side by side instead of from memory.",
      },
    ],
    studies: [
      {
        src: "/images/doto/icon-study.webp",
        width: 1536,
        height: 900,
        alt: "Icon study comparing a capital and a lowercase dotted O",
        caption:
          "App icon study. The blue dot is meant to read as the period in dot.o. I tested both versions at real icon sizes in three different shapes.",
        shape: "wide",
      },
      {
        src: "/images/doto/type-study.webp",
        width: 1440,
        height: 1110,
        alt: "Side by side comparison of two neon-style typefaces at identical sizes",
        caption:
          "Typeface study for the neon style. Two fonts at identical sizes. One makes great big numbers, the other stays readable in small text, so the shipped style uses each for what it does best.",
        shape: "wide",
      },
    ],
    gallery: [
      {
        src: "/images/doto/03-visualizer.webp",
        width: 720,
        height: 1280,
        alt: "A music widget with a dotted waveform",
        caption: "The screen moves with your music",
        shape: "phone",
      },
      {
        src: "/images/doto/04-widget-catalog.webp",
        width: 720,
        height: 1280,
        alt: "The widget picker, showing round widgets at their real size",
        caption: "Widgets shown at their real size",
        shape: "phone",
      },
      {
        src: "/images/doto/06-light-theme.webp",
        width: 720,
        height: 1280,
        alt: "The home screen in a light theme",
        caption: "Light themes for daylight",
        shape: "phone",
      },
      {
        src: "/images/doto/07-settings.webp",
        width: 720,
        height: 1280,
        alt: "The settings screen with six plainly named sections",
        caption: "Settings in plain words",
        shape: "phone",
      },
    ],
    outcome: [
      "Released on Google Play in September 2026.",
      "Early testers changed the design before launch. One said, \"in daylight I can't see anything,\" so light themes shipped. Another could not reach the app list controls with their thumb, so they moved to the bottom of the screen.",
      "It is early days, and most people using it so far found it through me. The next step is watching strangers use it.",
    ],
    next: [
      "Finish the new appearance settings, so changing how your phone looks is one clear choice instead of fifteen.",
      "Run usability sessions with five people who have never seen the app.",
    ],
    links: [
      { label: "Get it on Google Play", href: "https://play.google.com/store/apps/details?id=dev.dbdoo.launcher" },
      { label: "Product page", href: "/doto-launcher" },
    ],
  },
  {
    slug: "wide",
    title: "Wide",
    kind: "Mobile photo editor",
    status: "In beta",
    accent: "#fb7185",
    headline:
      "Made seamless Instagram carousels something you can design on a phone.",
    summary:
      "An Android editor for Instagram carousels that flow into each other: one wide image that people swipe through slide by slide.",
    did: "Designed an editor where the whole carousel is one canvas, with slide edges you can read on any photo, a preview that is also the layout view, and one consistent motion style across the app.",
    role: "Solo project: design and development",
    timeline: "April to June 2026",
    platform: "Android",
    cover: {
      src: "/images/wide/editor-photo.webp",
      width: 720,
      height: 1560,
      alt: "Wide editor: photos arranged across two carousel slides with a red line where the slides meet",
      shape: "phone",
    },
    problem: [
      "A seamless carousel is one wide image cut into slides. Most tools make you design each slide separately and hope the edges line up, or design on a computer and cut it up by hand.",
      "Wide lets you design the whole strip at once, on your phone, and see exactly where every cut will fall.",
    ],
    audience: [
      "Photographers and creators who post carousels and do their editing on their phone.",
    ],
    constraints: [
      "A phone screen is narrow and the design is very wide, so the editor has to feel roomy without hiding the tools.",
      "The export has to match Instagram's slide sizes exactly, or the joins show.",
    ],
    decisions: [
      {
        title: "Design the whole strip at once",
        before: "Designing each slide on its own.",
        after:
          "One long canvas with the slide edges marked on it. Photos and text can sit across the join between two slides.",
        why: "The whole point of a seamless carousel is the part that crosses from one slide to the next. You can only design that if you can see both sides at once.",
      },
      {
        title: "Make the slide edges easy to see",
        before: "Thin red lines on the canvas, easy to lose on a busy photo.",
        after:
          "The lines stay, plus small marks just outside the canvas, above and below every join.",
        why: "It borrows from print design, where trim marks sit outside the page. They stay visible on any photo, and because they look nothing like a handle, nobody tries to drag them.",
      },
      {
        title: "Arranging is previewing",
        before: "Arranging slides and previewing the final export were separate steps.",
        after:
          "While you arrange slides, everything outside the canvas dims and the canvas shows exactly what will be exported.",
        why: "One step instead of two, and no surprises when the images land in your camera roll.",
      },
      {
        title: "Animations that feel like one app",
        before:
          "Panels that moved at a dozen slightly different speeds, depending on which screen they were on.",
        after: "Every animation uses one small, shared set of speeds and easing curves.",
        why: "A consistency review found that the two busiest screens ignored the shared style. Each difference was tiny, but together they made the app feel assembled rather than designed.",
      },
    ],
    explorations: [],
    gallery: [
      {
        src: "/images/wide/editor-carousel.webp",
        width: 720,
        height: 1560,
        alt: "Wide editor showing a four-slide carousel with numbered slides and a photo tray",
        caption: "Numbered slides and a tray of photos waiting to be placed",
        shape: "phone",
      },
    ],
    outcome: [
      "In beta on Google Play.",
      "I wrote a shared vocabulary that names every part of the app, so feedback, plans and the code all use the same words.",
    ],
    next: ["Get the beta to more creators and watch where they get stuck."],
    links: [],
  },
  {
    slug: "bid-tracker",
    title: "Bid Tracker",
    kind: "Client project",
    status: "In daily use",
    accent: "#fbbf24",
    headline:
      "Turned a contractor’s spreadsheets and text threads into a tool they use every day.",
    summary:
      "A bid and cost tracker for a contractor who was running the business out of spreadsheets and text messages.",
    did: "Designed a phone-first app on top of the spreadsheet the business already trusted, with budget bars, receipts attached to their costs and separate views for the team and the owner.",
    role: "Design and development, working directly with the owner",
    timeline: "6 days",
    platform: "Web, designed for phones first",
    cover: {
      src: "/images/bidtracker/dashboard.png",
      width: 1280,
      height: 900,
      alt: "Bid Tracker dashboard with project cards and budget bars",
      shape: "wide",
    },
    problem: [
      "Bids were spread across spreadsheets, costs were not tracked against them, and photos of receipts got lost in text threads.",
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
          "An app built on top of the same sheet. It can be managed from the app or from the spreadsheet directly.",
        why: "Nothing to move over and nothing to lose. The owner could keep working the way they already did and switch to the app at their own pace.",
      },
      {
        title: "Budgets as bars, not numbers",
        before: "Rows of figures to add up by hand.",
        after: "Each project shows a bar that fills up as costs come in.",
        why: "Whether a job is on budget is the first thing to check. A bar answers that at a glance.",
      },
      {
        title: "Receipts attached where they belong",
        before: "Receipt photos sent by text and lost.",
        after: "Each photo is attached to the cost it proves and saved to Google Drive.",
        why: "Put the proof right next to the number it explains.",
      },
      {
        title: "Two views for two jobs",
        before: "Everyone looking at the same spreadsheet.",
        after:
          "A simple form for submitting ideas and bids, and a dashboard for the owner.",
        why: "Most people need to do one thing quickly. The owner needs the whole picture.",
      },
    ],
    explorations: [],
    gallery: [
      {
        src: "/images/bidtracker/landing.png",
        width: 1280,
        height: 900,
        alt: "Bid Tracker start screen",
        caption: "Start screen",
        shape: "wide",
      },
      {
        src: "/images/bidtracker/admin.png",
        width: 1280,
        height: 900,
        alt: "Bid Tracker owner dashboard",
        caption: "The owner's dashboard",
        shape: "wide",
      },
    ],
    outcome: ["Delivered and used every day by the client."],
    next: [],
    links: [{ label: "Try the demo", href: "/bid-tracker-demo" }],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
