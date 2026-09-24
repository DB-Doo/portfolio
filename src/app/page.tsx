import Link from "next/link";
import { DotField } from "@/app/doto-launcher/DotField";
import { caseStudies } from "@/content/work";
import { Device } from "@/components/ux/Device";
import { HeroStage } from "@/components/ux/HeroStage";
import { Reveal, SplitHeadline } from "@/components/ux/Reveal";
import { CopyEmail, DrawLine } from "@/components/ux/ScrollBits";
import { SpotlightCard } from "@/components/ux/SpotlightCard";

/*
Direction contract: a UX designer's portfolio for hiring managers. The first viewport says
who Dan is and shows the work as objects before any of it is described. Case studies carry
the argument, so the home page stays short: work, how I design, about, contact. Dark, calm,
precise, with the dot field from dot.o as the signature surface and each project's own
accent colour. Motion is generous but always respects reduced motion. Plain words only: no
internal feature names, no stat bars, no speed claims.
*/

const CONTACT_EMAIL = "dan@dbdoo.dev";
const RESUME_URL = "/Dan_Brandt_Resume.pdf";
const LINKEDIN_URL = "https://www.linkedin.com/in/danpbrandt/";
const GITHUB_URL = "https://github.com/DB-Doo";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";
const primaryButton = `group inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-cyan-300 ${focus}`;
const secondaryButton = `inline-flex min-h-12 items-center rounded-full border border-white/15 bg-white/[0.03] px-6 text-sm font-medium text-neutral-200 backdrop-blur transition-colors hover:border-white/40 hover:text-white ${focus}`;
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500";

/* Proof, not a tool list: each line is something that is true of the work below. */
const proof = [
  "Live on Google Play",
  "Shaped by tester feedback",
  "In beta with creators",
  "Used every day by a client",
  "Designed and built solo",
  "Checked on real devices",
  "Readable at every text size",
];

const process = [
  {
    title: "Start from what people say",
    body: "Feedback and screenshots from real people come before my own ideas. One tester asked three times for a way to lock the home screen, so I designed one.",
  },
  {
    title: "Judge it on the real device",
    body: "I review designs on the actual phone, at real size, with large text turned on and outside in daylight, not only in a mockup.",
  },
  {
    title: "Change one thing, then compare",
    body: "I capture the screen before and after every visual change, so decisions come from side by side comparison instead of memory.",
  },
  {
    title: "Cut what does not earn its place",
    body: "I have thrown away a whole grid layout, a settings redesign and two extra versions of the app list. A few finished features beat many half-done ones.",
  },
];

const tools = ["Figma", "Prototyping", "Usability testing", "Design systems", "Kotlin", "Flutter", "React", "Next.js"];

export default function Home() {
  const [doto, wide, bid] = caseStudies;

  return (
    <main className="grain relative min-h-screen overflow-x-clip bg-neutral-950 font-sans text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      {/* ===== NAV ===== */}
      <nav className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-neutral-950/60 px-5 py-2.5 backdrop-blur-xl sm:px-6 [margin-inline:max(1rem,calc((100vw-72rem)/2))]">
          <Link href="/" className={`text-sm font-medium text-white ${focus}`}>
            Dan Brandt
          </Link>
          <div className="flex items-center gap-5 text-sm text-neutral-400 sm:gap-7">
            <a href="#work" className={`hover:text-white ${focus}`}>Work</a>
            <a href="#about" className={`hidden hover:text-white sm:inline ${focus}`}>About</a>
            <a href={RESUME_URL} className={`hover:text-white ${focus}`}>Résumé</a>
            <CopyEmail
              email={CONTACT_EMAIL}
              className={`hidden rounded-full bg-white px-4 py-1.5 font-medium text-neutral-950 transition-colors hover:bg-cyan-300 sm:inline ${focus}`}
            />
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28 [touch-action:pan-y]">
        <DotField />
        <div aria-hidden="true" className="glow-drift pointer-events-none absolute -left-40 top-10 -z-0 size-[560px] rounded-full bg-cyan-400/15 blur-[120px]" />
        <div aria-hidden="true" className="glow-drift pointer-events-none absolute -right-32 bottom-0 -z-0 size-[520px] rounded-full bg-fuchsia-500/10 blur-[120px]" style={{ animationDelay: "-8s" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(10,10,10,0.85)_0%,rgba(10,10,10,0.4)_50%,rgba(10,10,10,0)_80%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal y={12}>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                UX Designer · Kansas City · Open to roles and projects
              </p>
            </Reveal>
            <SplitHeadline
              delay={0.15}
              className="mt-8 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-7xl"
              parts={[
                { text: "I design interfaces, then build them so the" },
                { text: "details survive.", serif: true, accent: true },
              ]}
            />
            <Reveal delay={0.7}>
              <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-400">
                Trained in graphic and web design, I take products from the first problem to a
                real person&rsquo;s phone. I design the flows, test them with people and build
                them myself, so nothing gets lost between the mockup and the finished app.
              </p>
            </Reveal>
            <Reveal delay={0.85}>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href="#work" className={primaryButton}>
                  See my work
                  <span className="transition-transform group-hover:translate-y-0.5">↓</span>
                </a>
                <a href={RESUME_URL} className={secondaryButton}>
                  Résumé (PDF)
                </a>
              </div>
              <Link
                href={`/work/${doto.slug}`}
                className={`group mt-10 inline-flex items-center gap-3 text-sm text-neutral-400 transition-colors hover:text-white ${focus}`}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600">Latest</span>
                {doto.title}, live on Google Play
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </Reveal>
          </div>

          <HeroStage back={bid.cover} left={wide.cover} right={doto.cover} />
        </div>
      </header>

      {/* ===== SKILLS MARQUEE ===== */}
      <div className="marquee relative overflow-hidden border-y border-white/10 py-6 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track flex w-max gap-10">
          {[...proof, ...proof].map((skill, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap font-serif text-3xl italic text-neutral-400 sm:text-4xl">
              {skill}
              <span aria-hidden="true" className="size-1.5 rounded-full bg-cyan-300/70" />
            </span>
          ))}
        </div>
      </div>

      {/* ===== WORK ===== */}
      <section id="work" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28 sm:px-10 sm:py-36">
        <Reveal>
          <p className={eyebrow}>Selected work · 2026</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
            Case studies, from the <span className="font-serif font-normal italic">problem</span> to the product.
          </h2>
        </Reveal>

        <div className="mt-20 space-y-10 md:space-y-0">
          {caseStudies.map((study, i) => (
            <div
              key={study.slug}
              className="md:sticky md:pb-16"
              style={{ top: `calc(7rem + ${i * 1.75}rem)` }}
            >
              <Reveal fade>
                <Link href={`/work/${study.slug}`} className={`block rounded-[2rem] ${focus}`}>
                  <SpotlightCard accent={study.accent} className="shadow-[0_-30px_60px_-30px_rgba(0,0,0,0.9)]">
                    <div className="grid items-center gap-10 p-7 sm:p-12 md:min-h-[520px] md:grid-cols-[1fr_1.05fr]">
                      <div className="relative">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: study.accent }}>
                          {String(i + 1).padStart(2, "0")} · {study.kind}
                        </p>
                        <h3 className="mt-5 text-lg font-medium text-neutral-400">{study.title}</h3>
                        <p className="mt-2 text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-4xl">
                          {study.headline}
                        </p>
                        <p className="mt-5 max-w-md text-base leading-8 text-neutral-400">{study.summary}</p>
                        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                          <div>
                            <dt className="sr-only">Status</dt>
                            <dd className="inline-flex items-center gap-2 text-neutral-300">
                              <span className="size-1.5 rounded-full" style={{ background: study.accent }} />
                              {study.status}
                            </dd>
                          </div>
                          <div>
                            <dt className="sr-only">Role</dt>
                            <dd className="text-neutral-500">{study.role}</dd>
                          </div>
                        </dl>
                        <p className="mt-10 inline-flex items-center gap-3 text-sm font-medium text-white">
                          <span className="relative">
                            Read the case study
                            <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: study.accent }} />
                          </span>
                          <span className="flex size-9 items-center justify-center rounded-full border border-white/15 transition-all duration-500 group-hover:translate-x-1 group-hover:border-transparent group-hover:text-neutral-950">
                            <span className="transition-colors">→</span>
                          </span>
                        </p>
                      </div>

                      <div className="relative flex items-center justify-center">
                        <div
                          aria-hidden="true"
                          className="absolute inset-[10%] rounded-full opacity-40 blur-[80px] transition-opacity duration-700 group-hover:opacity-70"
                          style={{ background: study.accent }}
                        />
                        <div
                          className={`relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 group-hover:scale-[1.03] ${
                            study.cover.shape === "phone" ? "w-[58%] max-w-[250px]" : "w-full"
                          }`}
                        >
                          <Device figure={study.cover} sizes={study.cover.shape === "phone" ? "250px" : "(min-width: 768px) 520px, 90vw"} />
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              </Reveal>
            </div>
          ))}
        </div>

        <Reveal className="mt-20">
          <p className={eyebrow}>Also built</p>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              { title: "NinKeys", body: "A swipe keyboard for iPhone, rebuilt from a well-loved app that had been abandoned." },
              { title: "Client websites", body: "Sites for an artisan metalworker, a children's nature-journal book series and a speech therapy practice." },
              { title: "HeyClaude", body: "A voice assistant for iPhone and Apple Watch that keeps an eye on long-running tasks." },
            ].map((item) => (
              <li key={item.title} className="bg-neutral-950 p-6 transition-colors hover:bg-neutral-900">
                <p className="font-medium text-neutral-100">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ===== HOW I DESIGN ===== */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-28 sm:px-10 sm:py-36 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <p className={eyebrow}>Process</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
                How I <span className="font-serif font-normal italic text-cyan-300">design</span>
              </h2>
              <p className="mt-6 max-w-sm text-base leading-8 text-neutral-400">
                Four habits that show up in every project, learned the hard way.
              </p>
            </div>
          </Reveal>

          <ol className="relative space-y-16 pl-14">
            <DrawLine className="bottom-4 left-[11px] top-4" />
            {process.map((step, i) => (
              <Reveal as="li" key={step.title} className="relative">
                <span className="absolute -left-14 top-0 flex size-6 items-center justify-center rounded-full border border-cyan-300/60 bg-neutral-950 font-mono text-[10px] text-cyan-300">
                  {i + 1}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-3 max-w-lg text-base leading-8 text-neutral-400">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative scroll-mt-24 border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-28 sm:px-10 sm:py-36 lg:grid-cols-2">
          <Reveal>
            <p className={eyebrow}>About</p>
            <p className="mt-6 font-serif text-4xl leading-[1.15] text-white sm:text-5xl">
              Most problems people have with software are{" "}
              <span className="italic text-cyan-300">design problems.</span>
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="space-y-6 text-base leading-8 text-neutral-300 lg:pt-12">
              <p>
                I&rsquo;m Dan. I studied graphic and web design, then spent years on the other
                side of technology: technical support, customer-facing sales and media
                production. Helping people through confusing products is how I learned that
                line above.
              </p>
              <p>
                I use AI tools to build quickly, which leaves more of my time for the part
                that matters: testing with people and polishing what they touch.
              </p>
              <p>
                Now I design and build apps: a home screen app on Google Play, a photo editor in
                beta and tools for small businesses. I&rsquo;m looking for a UX or product design
                role, and I take on select projects for businesses that care about the details
                as much as I do.
              </p>
              <ul className="flex flex-wrap gap-2 pt-4">
                {tools.map((tool) => (
                  <li key={tool} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-400">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="relative isolate scroll-mt-24 overflow-hidden border-t border-white/10">
        <div aria-hidden="true" className="glow-drift pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />
        <div className="mx-auto max-w-6xl px-6 py-32 text-center sm:px-10 sm:py-44">
          <Reveal>
            <p className={eyebrow}>Contact</p>
            <h2 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-8xl">
              Let&rsquo;s build something <span className="font-serif font-normal italic text-cyan-300">clear.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-8 text-neutral-400">
              Hiring for a design role, or have a product that needs one? Tell me about it.
            </p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-4xl gap-5 text-left md:grid-cols-2">
            <Reveal fade>
              <div className="h-full rounded-3xl border border-white/10 bg-neutral-950/70 p-8 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Hiring</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">For employers</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  I&rsquo;m looking for a full-time UX or product design role on a team that ships
                  and listens to its users.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={RESUME_URL} className={primaryButton}>Résumé (PDF)</a>
                  <a href={LINKEDIN_URL} className={secondaryButton}>LinkedIn</a>
                </div>
              </div>
            </Reveal>
            <Reveal fade delay={0.1}>
              <div className="h-full rounded-3xl border border-white/10 bg-neutral-950/70 p-8 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-300">Projects</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">For businesses</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  Have an app or site that confuses people? I design it, build it and hand it
                  over working, like Bid Tracker.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={`mailto:${CONTACT_EMAIL}`} className={primaryButton}>Email me</a>
                  <CopyEmail email={CONTACT_EMAIL} className={secondaryButton} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-10 text-xs text-neutral-500 sm:px-10">
          <p>© 2026 Dan Brandt · Kansas City, KS</p>
          <div className="flex gap-6">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">Email</a>
            <a href={LINKEDIN_URL} className="hover:text-white">LinkedIn</a>
            <a href={GITHUB_URL} className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
