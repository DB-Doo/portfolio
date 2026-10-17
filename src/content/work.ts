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
  /** phone = tall screenshot shown in a phone frame; wide = browser window or full-width image;
      panel = a cropped part of a screen (like a keyboard) on a plain rounded panel */
  shape: "phone" | "wide" | "panel";
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
    title: "Doto Launcher",
    kind: "Android home screen",
    status: "Live on Google Play",
    accent: "#67e8f9",
    headline:
      "A home screen with no grid, designed from scratch and shipped on Google Play.",
    summary:
      "You put apps and widgets anywhere on one open canvas of dots. The dots move with your music, the canvas rises into 3D, and two critters, Kiwi and Zuzu, are about to move in. Early testers shaped most of the big design changes.",
    did: "Designed and built the whole app. The biggest changes came from testers: hints instead of a tutorial, one app list instead of three, settings where people expect them, and a way to hold the screen still.",
    role: "Solo project: design and development",
    timeline: "April 2026 to now",
    platform: "Android phones, foldables and tablets",
    cover: {
      src: "/images/doto/01-spatial-home.webp",
      width: 720,
      height: 1280,
      alt: "Doto home screen: apps and round widgets placed freely on a dark dotted background",
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
        why: "Going through the tutorial myself, it felt like a list of chores. A hint shows up at the moment it helps and costs nothing if you ignore it. I also cut the hint for dragging around the canvas, because everyone already knows how to drag. Only gestures people would not find on their own get a hint.",
      },
      {
        title: "One app list, not three",
        before:
          "Three different styles for the list of all your apps, each with its own quirks.",
        after: "One app list, done properly.",
        why: "Three versions meant every improvement had to be made three times, or they slowly drifted apart. I kept the one testers liked and put the effort there.",
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
        why: "Nobody installs a home screen to tune raindrop sizes. Choosing values that feel right is my job, so I did that and kept only the choices people actually make, like colors and fonts.",
      },
      {
        title: "Simpler ways to change the look",
        before:
          "Fifteen different buttons that each changed one slice of the appearance, six different names for the background and seven meanings of the word style.",
        after:
          "Hold empty space on the home screen for two choices. Looks puts on a complete look in one tap. Customize changes colors, font, icons, widgets or fabric one at a time, right on your own home.",
        why: "When I started getting lost in my own settings, I knew testers would be too. A new look never overrides accessibility choices, so someone who turned motion off keeps it off. Both shipped in October 2026, with an Undo for a look you did not want.",
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
    ],
    studies: [
      {
        src: "/images/doto/icon-study.webp",
        width: 1536,
        height: 900,
        alt: "Icon study comparing a capital and a lowercase dotted O",
        caption:
          "App icon study. The blue dot was meant to read as the period in dot.o, the app's name before Doto. I tested both versions at real icon sizes in three different shapes.",
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
      "Instagram carousels designed as one wide image, on a phone.",
    summary:
      "Most tools make you design each slide on its own and hope the edges line up. Wide shows the whole strip at once, with every cut marked.",
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
    slug: "ninkeys",
    title: "NinKeys",
    kind: "iPhone keyboard",
    status: "In private testing",
    accent: "#818cf8",
    headline:
      "A swipe keyboard for iPhone where you can tap, swipe and use both thumbs in the same word.",
    summary:
      "It brings back the two-thumb typing of Nintype, an older keyboard, rebuilt from scratch for current iPhones. It learns how you type, keeps your typing on your phone and works in English and Dutch.",
    did: "Designed and built the keyboard and its app. Most of the design work went into keeping a busy, moving surface calm and readable: one light that follows your finger, a word strip that never cuts words off, three finished themes instead of a pile of half-finished ones, and a space bar that always does what you pressed.",
    role: "Solo project: design and development",
    timeline: "March to August 2026",
    platform: "iPhone, iOS 16 and later",
    cover: {
      src: "/images/ninkeys/keyboard-hero.jpg",
      width: 1179,
      height: 1000,
      alt: "NinKeys mid-swipe: a teal trail runs from A down toward C, with the suggestions trade, texas and taxed above the keys",
      shape: "panel",
    },
    problem: [
      "Most phone keyboards expect one way of typing: tap each letter, or swipe a whole word with one finger. Nintype, an older keyboard, let people mix the two and swipe with both thumbs at the same time.",
      "I wanted that way of typing on a current iPhone, and to understand it well enough to improve it. That meant one keyboard that works out what you meant whether you tapped, swiped or did both, without asking you to switch modes.",
    ],
    audience: [
      "People who type a lot on their phone and want to use both thumbs, not one finger.",
      "People who type in languages other than English. Dutch works today, and testers who speak other languages help the keyboard learn theirs.",
    ],
    constraints: [
      "An iPhone keyboard runs in a small, walled-off space with a strict memory limit, so everything it knows has to fit and run on the phone.",
      "Nothing you type leaves your phone. Testers help only through short sessions where the app shows them words to swipe, and they decide whether to send the result.",
      "It has to run on iPhones a few years old, not only the newest ones.",
      "A tight budget: no paid servers, so test results come back by email.",
    ],
    decisions: [
      {
        title: "One light that follows your finger",
        before:
          "Every tap set off a ring that spread across the keys. Typing quickly, rings fired from places your finger had already left.",
        after:
          "One soft light that sits under your finger, follows it as you slide and fades the moment you lift. The rings are still there as an option.",
        why: "Fast typing turned the rings into little effects jumping everywhere. A single light that is always where your finger is cannot pile up, and it leaves nothing behind.",
      },
      {
        title: "A word strip that shows your words, evenly",
        before:
          "The strip of recent words above the keys gave each word a different sized box. One short word could fill half the strip, and long words were cut off.",
        after:
          "Five equal sections, always, with empty ones holding their place. If a word is too long to fit, the oldest word steps aside instead of any word being cut off.",
        why: "It took three tries. Each fixed the last complaint and caused the next, because I was fixing the property named instead of the goal: the strip exists to show you your words, evenly.",
      },
      {
        title: "Space always types a space",
        before:
          "If the keyboard could not find a word for a swipe, pressing space did nothing at all, and the next word ran straight into the last one.",
        after:
          "Space always types a space, and keeps any letters you tapped before the swipe.",
        why: "Pressing a key is a clear instruction. Not knowing what the swipe meant is no reason to throw away the part you typed exactly. Accuracy tests could never catch this, because nothing was typed to measure.",
      },
      {
        title: "Three finished themes",
        before:
          "Several looks to choose from, some of them never finished to the same standard as the rest.",
        after:
          "Three: Carbon (dark), Frost (light) and Adaptive, the default, which follows your phone's light or dark setting.",
        why: "In a short list, one half-finished look costs more than it adds. Each remaining theme was checked in every state a finger can put a key into, not just at rest, because that is where the earlier themes broke.",
      },
      {
        title: "Vibration you can actually feel",
        before:
          "Six strengths for the tap vibration. On a real iPhone the two lightest could not be felt at all.",
        after:
          "The lightest setting is now the lightest tap you can still feel, and each step up feels different.",
        why: "A setting you cannot tell apart from Off is not a setting.",
      },
      {
        title: "A swipe trail that looks like part of the keyboard",
        before:
          "A thin line in fixed colours that matched no theme. It stayed on screen after you lifted your finger.",
        after:
          "A tapered ribbon in the theme's colour, thick at your finger and thin at the tail, that fades when you lift.",
        why: "The taper shows which way and how quickly your finger is moving without any explanation, and a trail that stays behind makes the keyboard feel unfinished.",
      },
    ],
    explorations: [
      {
        title: "Showing what the keyboard read",
        body: "An optional trail that marks, in order, the letters the keyboard thinks your swipe passed through. The first version drew lines between the letters and on the phone it was an orange tangle, because those lines matched nothing your finger did. Now each letter gets a ring and a number, and a letter used twice gets a double ring.",
      },
      {
        title: "Themes that did not make it",
        body: "Two themes based on Dieter Rams' approach, and one with moving liquid behind glass keys. Checking contrast before trying them on the phone caught a return key that was too faint. After trying them on the phone, I cut all three.",
      },
      {
        title: "Letting you swipe more words",
        body: "Many words the keyboard accepts, like seamless and gesture, cannot be swiped yet. Adding them did not change accuracy, but made every swipe wait longer than the keyboard allows. Which way to go is still an open decision.",
      },
    ],
    gallery: [
      {
        src: "/images/ninkeys/gestures-keyboard.jpg",
        width: 1179,
        height: 1096,
        alt: "Holding the word really opens a menu to rewrite it, change its case or pick another word, next to a panel showing three swipe shapes the keyboard has learned for it",
        caption: "Hold a word to fix it, or see the swipes it has learned",
        shape: "panel",
      },
      {
        src: "/images/ninkeys/animations-keyboard.jpg",
        width: 1179,
        height: 946,
        alt: "Keyboard settings for the idle animation, with eleven choices such as Rain, Ocean Tide and Pong, and a slider for strength",
        caption: "Animations for when you are not typing",
        shape: "panel",
      },
    ],
    outcome: [
      "Test builds have gone to a small group of testers. I try every change on my own iPhone first, and most of the decisions above came from typing with it myself.",
      "A tester on an older iPhone could not open an early build. Their crash report pointed to the cause, and the fixed version now runs on iPhones back to iOS 16.",
      "English and Dutch both work today.",
    ],
    next: [
      "Get it to testers who type in Dutch and other languages, so their swipes can teach the keyboard those languages.",
      "Make two-thumb typing more reliable. It is the hardest part of the keyboard and still the weakest.",
    ],
    links: [],
  }
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
