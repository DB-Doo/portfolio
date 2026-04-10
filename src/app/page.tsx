import Image from "next/image";

const projects = [
  {
    title: "Bid Tracker",
    subtitle: "Construction bid management, idea to production",
    badge: "CLIENT PROJECT",
    badgeColor: "bg-amber-500/20 text-amber-400",
    problem:
      "A contractor was drowning in spreadsheets — bids scattered everywhere, costs slipping through the cracks.",
    built:
      "Full web app with photo uploads, competitive bid comparison, admin dashboard, and a Google Sheets backend so the client manages their own data without learning new tools.",
    result: "Shipped in 6 days. In daily use.",
    tech: ["Next.js", "Google Sheets API", "Google Drive", "Vercel"],
    timeline: "6 days",
    gradient: "from-blue-500 to-cyan-500",
    images: ["/images/bidtracker/landing.png"],
    bridge:
      "This is what I do for clients. Your project gets the same speed and attention.",
    bridgeColor: "bg-amber-500/5 text-amber-400",
    liveUrl: null,
  },
  {
    title: "NinKeys",
    subtitle: "A modern dual-swipe keyboard for iOS",
    badge: null,
    badgeColor: "",
    problem:
      "A beloved iOS keyboard was abandoned years ago — no source code, no documentation, nothing.",
    built:
      "Reverse-engineered the original from ARM binaries. Built a custom C++ prediction engine from scratch. 517 commits, 9,500 lines of production code in one week.",
    result:
      "250x faster than v1. 99.5% word accuracy. Features Google Keyboard doesn't have.",
    tech: ["Swift", "C++", "Metal GPU", "iOS"],
    timeline: "6 days",
    gradient: "from-purple-500 to-pink-500",
    images: [
      "/images/ninkeys/keyboard-1.jpg",
      "/images/ninkeys/keyboard-2.jpg",
      "/images/ninkeys/keyboard-3.jpg",
    ],
    bridge:
      "If I can reverse-engineer an abandoned app and beat it in a week, your clearly-scoped project is a sure thing.",
    bridgeColor: "bg-purple-500/5 text-purple-400",
    liveUrl: null,
  },
  {
    title: "HeyClaude",
    subtitle: "Voice-controlled AI assistant for iOS + Apple Watch",
    badge: null,
    badgeColor: "",
    problem:
      "I manage two AI coding agents across two machines. Needed to monitor both and send commands from my wrist.",
    built:
      "Native iOS/watchOS app with voice commands, live terminal streaming, three-way bridge chat, and push notifications.",
    result:
      "Full mobile + wearable app with real-time WebSocket streaming.",
    tech: ["SwiftUI", "watchOS", "WebSocket", "Deepgram STT", "APNs"],
    timeline: "10 days",
    gradient: "from-green-500 to-emerald-500",
    images: [
      "/images/heyclaude/bridge-chat.jpg",
      "/images/heyclaude/vault-files.jpg",
      "/images/heyclaude/dashboard.jpg",
    ],
    bridge:
      "Real-time apps, push notifications, voice interfaces, cross-device sync — the features modern products need.",
    bridgeColor: "bg-emerald-500/5 text-emerald-400",
    liveUrl: null,
  },
  {
    title: "Vault Daemon",
    subtitle: "AI-powered second brain in Rust",
    badge: null,
    badgeColor: "",
    problem:
      "My productivity system ran on 11 separate scripts — fragile and impossible to maintain. No intelligent search, no conversation understanding, no self-healing.",
    built:
      "One Rust daemon with a local AI brain: 13 cron timers, 7 file watchers, event-sourced architecture, semantic search across 1,900+ notes, a local Gemma LLM for classification and summarization, and an Omi wearable integration that extracts commitments, insights, and task completions from real conversations.",
    result: "11 services → 1 process. Understands my day from voice conversations. Auto-completes tasks. Runs 24/7 unattended.",
    tech: ["Rust", "SQLite", "Tokio", "Ollama/Gemma", "Event Sourcing", "Embeddings"],
    timeline: "Ongoing",
    gradient: "from-orange-500 to-red-500",
    images: ["/images/obhook/dashboard.jpg"],
    bridge:
      "APIs, data pipelines, cron jobs, local AI, background workers — I build the backend intelligence that keeps your product running.",
    bridgeColor: "bg-orange-500/5 text-orange-400",
    liveUrl: null,
  },
];

const stats = [
  { value: "6", label: "Days to ship", color: "text-blue-400" },
  { value: "517", label: "Commits / week", color: "text-purple-400" },
  { value: "4", label: "Apps shipped", color: "text-emerald-400" },
  { value: "< 14", label: "Days avg", color: "text-amber-400" },
];

const CONTACT_EMAIL = "dan@dbdoo.dev";
const CALENDLY_URL = "https://calendly.com/dan-dbdoo/30min";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-neutral-950 to-neutral-950" />
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-blue-400 tracking-wide uppercase mb-4">
            Dan Brandt
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-[1.1]">
            Your app.
            <br />
            Built in days.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-300">
            Web apps, mobile apps, automation systems.
            <br className="hidden sm:block" />
            You get a working prototype, not a mockup.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Kansas City, KS &middot; Available for contract work
          </p>
          <div className="mt-7 flex items-center justify-center gap-x-4">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition"
            >
              Book a call
            </a>
            <a
              href="#projects"
              className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white transition"
            >
              See my work &darr;
            </a>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="border-y border-neutral-800/50 bg-neutral-900/30">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className={`text-4xl font-extrabold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-2xl font-bold mb-10">What I&rsquo;ve Built</h2>
        <div className="grid gap-8">
          {projects.map((project) => (
            <article
              key={project.title}
              className={`rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 ${
                project.badge
                  ? "bg-neutral-900 border-amber-500/20 hover:border-amber-500/40"
                  : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {/* Client badge */}
              {project.badge && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2">
                  <span className="text-xs font-bold text-amber-400 tracking-wider">
                    ★ {project.badge}
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{project.title}</h3>
                        <p className="text-sm text-neutral-400">
                          {project.subtitle}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${project.gradient} text-white`}
                      >
                        {project.timeline}
                      </span>
                    </div>

                    <div className="space-y-2 text-[15px] text-neutral-300 leading-relaxed">
                      <p>
                        <span className="font-semibold text-neutral-200">
                          {project.badge ? "Problem:" : "Challenge:"}
                        </span>{" "}
                        {project.problem}
                      </p>
                      <p>
                        <span className="font-semibold text-neutral-200">
                          {project.badge ? "What I built:" : "What I did:"}
                        </span>{" "}
                        {project.built}
                      </p>
                      <p className="font-semibold text-emerald-400">
                        {project.result}
                      </p>
                    </div>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Live demo link */}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-sm font-medium text-blue-400 hover:text-blue-300 transition"
                      >
                        View live app &rarr;
                      </a>
                    )}

                    {/* Bridge line */}
                    {project.bridge && (
                      <div
                        className={`mt-4 px-4 py-3 rounded-lg ${project.bridgeColor}`}
                      >
                        <p className="text-sm">
                          <span className="font-semibold">For you:</span>{" "}
                          {project.bridge}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  {project.images.length > 0 && (
                    <div className="flex sm:flex-col gap-3 sm:w-44 shrink-0 overflow-x-auto sm:overflow-visible">
                      {project.images.map((src, i) => (
                        <div
                          key={i}
                          className="relative shrink-0 w-32 h-56 sm:w-full sm:h-32 rounded-lg overflow-hidden border border-neutral-700"
                        >
                          <Image
                            src={src}
                            alt={`${project.title} screenshot ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(min-width: 640px) 176px, 128px"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">About Me</h2>
        <p className="text-neutral-300 leading-relaxed max-w-2xl">
          I&rsquo;m Dan &mdash; a builder in Kansas City who ships working
          prototypes fast. I use AI-assisted development to move at startup
          speed as a solo developer &mdash; iOS apps, web apps, Rust daemons,
          and an Apple Watch assistant, most in under two weeks. I care about
          how things feel to use, not just how they work under the hood. You
          get a real product you can test with users, not a slide deck.
        </p>
      </section>

      {/* ===== HOW I WORK ===== */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">How I Work</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 border-t-[3px] border-t-blue-500">
            <div className="text-lg font-bold mb-1">Day 1</div>
            <div className="text-blue-400 text-sm mb-3">We talk</div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              30-minute call. I learn your problem. You get a clear scope and
              timeline before I write a single line of code.
            </p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 border-t-[3px] border-t-purple-500">
            <div className="text-lg font-bold mb-1">Days 2-7</div>
            <div className="text-purple-400 text-sm mb-3">
              I build, you watch
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Daily updates with working demos you can click. Feedback loops
              measured in hours, not weeks.
            </p>
          </div>
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 border-t-[3px] border-t-emerald-500">
            <div className="text-lg font-bold mb-1">Week 2</div>
            <div className="text-emerald-400 text-sm mb-3">You ship</div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Deployed, documented, yours. Hand it to a full-time team or keep
              iterating with me.
            </p>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500 mb-1">Starter</p>
            <p className="text-xl font-bold">$500 &ndash; $800</p>
            <p className="text-sm text-neutral-400 mt-2">Landing page or simple web app. Perfect for validating an idea fast.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500 mb-1">Standard</p>
            <p className="text-xl font-bold">$1,500 &ndash; $2,500</p>
            <p className="text-sm text-neutral-400 mt-2">Full web app with backend, auth, and database. Your core product.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500 mb-1">Mobile</p>
            <p className="text-xl font-bold">$3,000 &ndash; $5,000</p>
            <p className="text-sm text-neutral-400 mt-2">Native iOS app with SwiftUI. Includes App Store submission support.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <p className="text-sm text-neutral-500 mb-1">Retainer</p>
            <p className="text-xl font-bold">$1,500 / mo</p>
            <p className="text-sm text-neutral-400 mt-2">Ongoing iteration and feature development. Priority response.</p>
          </div>
        </div>
        <p className="text-center text-sm text-neutral-600 mt-4">
          Every project starts with a free 30-minute call. No payment until we agree on scope.
        </p>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">
          Tell me what you&rsquo;re building.
        </h2>
        <p className="text-neutral-400 mb-2">
          Book a 30-minute call or email me your idea. I reply within 24 hours with a scope and timeline.
        </p>
        <p className="text-sm text-neutral-600 mb-8">
          Typical projects ship in 1-2 weeks.
        </p>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition"
        >
          Book a call
        </a>
        <p className="mt-3 text-sm text-neutral-500">
          or email me at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-neutral-400 hover:text-white transition">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-neutral-800 py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <p>Dan Brandt &middot; Kansas City, KS</p>
          <div className="flex gap-6">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-neutral-300 transition"
            >
              Email
            </a>
            <a
              href="https://github.com/DB-Doo"
              className="hover:text-neutral-300 transition"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/danpbrandt/"
              className="hover:text-neutral-300 transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
