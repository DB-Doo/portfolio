import Link from "next/link";
import { DotField } from "@/app/doto-launcher/DotField";
import { caseStudies } from "@/content/work";
import { Device } from "@/components/ux/Device";
import { HeroStage } from "@/components/ux/HeroStage";
import { Reveal, SplitHeadline } from "@/components/ux/Reveal";
import { CopyEmail } from "@/components/ux/ScrollBits";
import { SpotlightCard } from "@/components/ux/SpotlightCard";

/*
Direction contract: a UX designer's portfolio for hiring managers and clients. Copy follows
how respected designers present themselves: open with a plain fact (role, place, what I
made), tell the background as a short story with real names and dates, and let the projects
carry the argument. No process diagrams, slogans or aphorisms, no adjectives about myself.
Sections: work, about, contact. Dark and calm, with the dot field from Doto as the
signature surface and each project's own accent colour. Motion never holds text back.
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

/* What I do, in the words a job listing would use. */
const proof = [
  "Product design",
  "Interaction design",
  "Android apps",
  "Web apps",
  "Prototypes in real code",
  "Design systems",
  "Usability testing",
];

const previously = [
  { role: "Technical support", place: "Sunlighten", years: "2025 – 2026" },
  { role: "Sales and technical consulting", place: "Google Fiber", years: "2022 – 2023" },
  { role: "Media production", place: "Life Time", years: "2018 – 2019" },
  { role: "Graphic and web design, A.A.S.", place: "Hennepin Technical College", years: "2014 – 2018" },
];

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
                Open to UX roles and freelance projects
              </p>
            </Reveal>
            <SplitHeadline
              delay={0.15}
              className="mt-8 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-7xl"
              parts={[
                { text: "I design mobile and web apps, and" },
                { text: "build them myself.", serif: true, accent: true },
              ]}
            />
            <Reveal delay={0.7}>
              <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-400">
                I&rsquo;m Dan Brandt, a UX designer in Kansas City. My newest app,{" "}
                <Link href={`/work/${doto.slug}`} className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-cyan-300">
                  Doto
                </Link>
                , is a home screen for Android, live on Google Play.
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
          <p className={eyebrow}>Selected work</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
            Three projects I <span className="font-serif font-normal italic">designed</span> and built.
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
          <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              { title: "NinKeys", body: "A swipe keyboard for iPhone, rebuilt from a well-loved app that had been abandoned." },
              { title: "Client websites", body: "Sites for an artisan metalworker, a children's nature book series and a speech therapy practice." },
            ].map((item) => (
              <li key={item.title} className="bg-neutral-950 p-6 transition-colors hover:bg-neutral-900">
                <p className="font-medium text-neutral-100">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative scroll-mt-24 border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-28 sm:px-10 sm:py-36 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <p className={eyebrow}>About</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
              The long way <span className="font-serif font-normal italic text-cyan-300">back to design</span>
            </h2>
            <p className="mt-12 font-serif text-2xl italic text-neutral-400">Previously</p>
            <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {previously.map((item) => (
                <li key={item.place} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <span>
                    <span className="text-neutral-100">{item.role}</span>
                    <span className="text-neutral-500"> · {item.place}</span>
                  </span>
                  <span className="font-mono text-xs text-neutral-600">{item.years}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6 text-[17px] leading-8 text-neutral-300 lg:pt-16">
              <p>
                I studied graphic and web design, then spent several years working next to
                technology instead of designing it. I produced training webinars, sold and set
                up internet service, and walked sauna owners through wiring diagrams over the
                phone.
              </p>
              <p>
                Support work showed me, one call at a time, where people get stuck, and how much
                of it comes down to how a product explains itself.
              </p>
              <p>
                In 2024 I took a full stack development bootcamp, and in 2026 I started designing
                and shipping my own apps. I use AI tools to write code faster, which leaves more
                of my time for design and for testing with real people.
              </p>
              <p>
                I&rsquo;m most useful when a product needs one person who can decide how it
                should work, and then make it work.
              </p>
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
              Say <span className="font-serif font-normal italic text-cyan-300">hello.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-8 text-neutral-400">
              Email me with a little context about the role or the project. A short note is
              plenty.
            </p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-4xl gap-5 text-left md:grid-cols-2">
            <Reveal fade>
              <div className="h-full rounded-3xl border border-white/10 bg-neutral-950/70 p-8 backdrop-blur">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Hiring</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">For employers</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  I&rsquo;m looking for a full-time UX or product design role. My résumé has the
                  short version of everything on this page.
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
                  I design and build apps and websites for small businesses, and hand them over
                  working, like Bid Tracker. Tell me what is confusing your customers or your team.
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
