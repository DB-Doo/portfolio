import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/content/work";

/*
Direction contract: a UX designer's portfolio for hiring managers. The first viewport says
who Dan is and the job Dan wants; the next thing on the page is the work. Case studies
carry the argument, so the home page stays short: work, how I design, about, contact.
Same dark, direct identity and cyan signal as /doto-launcher. No stat bars, no speed
claims, no sales language.
*/

const CONTACT_EMAIL = "dan@dbdoo.dev";
const RESUME_URL = "/Dan_Brandt_Resume.pdf";
const LINKEDIN_URL = "https://www.linkedin.com/in/danpbrandt/";
const GITHUB_URL = "https://github.com/DB-Doo";

const label = "font-mono text-xs uppercase tracking-[0.18em] text-cyan-400";
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";
const primaryButton = `inline-flex min-h-12 items-center rounded-full bg-cyan-300 px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-white ${focus}`;
const secondaryButton = `inline-flex min-h-12 items-center rounded-full border border-neutral-700 px-6 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white ${focus}`;

const process = [
  {
    title: "Start from what people say",
    body: "Tester reports and screenshots come before my own ideas. One tester asked for a lockdown mode three times; it became the pinned canvas in dot.o.",
  },
  {
    title: "Judge it on the real device",
    body: "I review designs on the phone, at real size, with large system text and in daylight, not only in a mockup.",
  },
  {
    title: "Change one thing, then compare",
    body: "I capture the screen before and after every visual change, so decisions come from side by side comparison instead of memory.",
  },
  {
    title: "Cut what does not earn its place",
    body: "I have thrown away a paged grid, a settings redesign and two extra app drawers. Fewer finished features beat more half-done ones.",
  },
];

const alsoBuilt = [
  { title: "NinKeys", body: "A dual-swipe keyboard for iOS, rebuilt from an app that had been abandoned." },
  { title: "Client websites", body: "Sites for an artisan metalworker, a family nature-journal book series and a speech-language practice." },
  { title: "HeyClaude", body: "A voice assistant for iPhone and Apple Watch that keeps an eye on long-running tasks." },
];

export default function Home() {
  const [featured, ...rest] = caseStudies;

  return (
    <main className="min-h-screen bg-neutral-950 font-sans text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        {/* ===== NAV ===== */}
        <nav className="flex flex-wrap items-center justify-between gap-4 py-8">
          <Link href="/" className={`font-mono text-xs tracking-[0.16em] text-white ${focus}`}>
            DAN BRANDT
          </Link>
          <div className="flex gap-6 text-sm text-neutral-400">
            <a href="#work" className={`hover:text-white ${focus}`}>Work</a>
            <a href="#about" className={`hover:text-white ${focus}`}>About</a>
            <a href={RESUME_URL} className={`hover:text-white ${focus}`}>Résumé</a>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <header className="pb-24 pt-16 sm:pb-32 sm:pt-24">
          <p className={label}>UX Designer · Kansas City</p>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            I design interfaces, then build them so the details survive.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-400">
            Trained in graphic and web design, I take products from the problem to a real
            person&rsquo;s phone. I design the flows and interactions, test them with real
            users, and build them myself, so nothing gets lost between the mockup and the
            shipped app.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#work" className={primaryButton}>
              See the case studies
            </a>
            <a href={RESUME_URL} className={secondaryButton}>
              Résumé (PDF)
            </a>
          </div>
        </header>

        {/* ===== WORK ===== */}
        <section id="work" className="scroll-mt-8 border-t border-neutral-800 py-20">
          <p className={label}>Selected work</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Case studies
          </h2>

          <Link
            href={`/work/${featured.slug}`}
            className={`group mt-12 grid items-center gap-10 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-600 sm:p-10 md:grid-cols-[1fr_260px] ${focus}`}
          >
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {featured.kind} · {featured.status}
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {featured.title}
              </h3>
              <p className="mt-4 max-w-lg text-base leading-8 text-neutral-400">
                {featured.summary}
              </p>
              <p className="mt-6 text-sm text-neutral-500">{featured.role}</p>
              <p className="mt-8 text-sm font-medium text-cyan-300">
                Read the case study{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </p>
            </div>
            <Image
              src={featured.cover.src}
              alt={featured.cover.alt}
              width={featured.cover.width}
              height={featured.cover.height}
              priority
              sizes="260px"
              className="mx-auto h-auto w-full max-w-[260px] rounded-[26px] border border-neutral-800"
            />
          </Link>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rest.map((study) => (
              <Link
                key={study.slug}
                href={`/work/${study.slug}`}
                className={`group flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-600 sm:p-8 ${focus}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                  <Image
                    src={study.cover.src}
                    alt={study.cover.alt}
                    fill
                    sizes="(min-width: 768px) 440px, 100vw"
                    className={study.cover.shape === "phone" ? "object-cover object-center" : "object-cover object-top"}
                  />
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  {study.kind} · {study.status}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {study.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-neutral-400">{study.summary}</p>
                <p className="mt-6 text-sm font-medium text-cyan-300">
                  Read the case study{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Also built
            </p>
            <ul className="mt-6 grid gap-6 sm:grid-cols-3">
              {alsoBuilt.map((item) => (
                <li key={item.title}>
                  <p className="font-medium text-neutral-200">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== HOW I DESIGN ===== */}
        <section className="border-t border-neutral-800 py-20">
          <p className={label}>Process</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            How I design
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <li key={step.title}>
                <p className="font-mono text-xs text-neutral-500">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== ABOUT ===== */}
        <section id="about" className="scroll-mt-8 border-t border-neutral-800 py-20">
          <p className={label}>About</p>
          <div className="mt-6 max-w-2xl space-y-6 text-base leading-8 text-neutral-300">
            <p>
              I&rsquo;m Dan. I studied graphic and web design, then spent years on the other
              side of technology: technical support, customer-facing sales and media
              production. Helping people through confusing products taught me that most
              problems with software are design problems.
            </p>
            <p>
              Now I design and build apps: an Android launcher on Google Play, a carousel
              editor in beta and tools for small businesses. I&rsquo;m looking for a UX or
              product design role on a team that cares about the details as much as I do.
            </p>
          </div>
        </section>

        {/* ===== CONTACT ===== */}
        <section className="border-t border-neutral-800 py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Hiring for a UX or product design role? I&rsquo;d like to hear about it.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className={primaryButton}>
              {CONTACT_EMAIL}
            </a>
            <a href={LINKEDIN_URL} className={secondaryButton}>
              LinkedIn
            </a>
            <a href={RESUME_URL} className={secondaryButton}>
              Résumé (PDF)
            </a>
          </div>
        </section>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-6 py-10 text-xs text-neutral-500 sm:px-10">
          <p>Dan Brandt · Kansas City, KS</p>
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
