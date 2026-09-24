import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { caseStudies, getCaseStudy } from "@/content/work";
import { CompareSlider } from "@/components/ux/CompareSlider";
import { BrowserFrame, Device } from "@/components/ux/Device";
import { Reveal, SplitHeadline } from "@/components/ux/Reveal";
import { ScrollProgress, SectionNav } from "@/components/ux/ScrollBits";

/*
One template for every case study. Reading order follows how a hiring manager scans: a
summary box first (problem, what I did, result) for the thirty-second read, then the full
story for anyone who keeps going: problem, people, constraints, decisions as before /
after / why, what was tried and dropped, outcome. The project's accent colour runs through
the page. Long text stays in a single reading column beside a sticky contents list.
*/

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  return {
    title: `${study.title} case study | Dan Brandt, UX Designer`,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500";
const body = "text-[17px] leading-8 text-neutral-300";

function Section({
  id,
  number,
  eyebrow: kicker,
  title,
  children,
}: {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/10 py-20 sm:py-24">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
          {number} · {kicker}
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
          {title}
        </h2>
      </Reveal>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-5">
      {items.map((item, i) => (
        <Reveal as="li" key={item} delay={i * 0.06} className={`${body} flex gap-4`}>
          <span aria-hidden="true" className="mt-[14px] size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
          <span>{item}</span>
        </Reveal>
      ))}
    </ul>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const index = caseStudies.indexOf(study);
  const nextStudy = caseStudies[(index + 1) % caseStudies.length];
  const hasProcess = study.explorations.length > 0 || Boolean(study.studies);

  const sections = [
    { id: "problem", label: "Problem" },
    { id: "people", label: "People" },
    { id: "constraints", label: "Constraints" },
    { id: "decisions", label: "Decisions" },
    ...(hasProcess ? [{ id: "process", label: "Process" }] : []),
    { id: "outcome", label: "Outcome" },
  ];

  return (
    <main
      className="grain relative min-h-screen overflow-x-clip bg-neutral-950 font-sans text-neutral-200 selection:bg-[var(--accent)] selection:text-neutral-950"
      style={{ "--accent": study.accent } as CSSProperties}
    >
      <ScrollProgress />

      <nav className="fixed inset-x-0 top-0 z-40">
        <div className="mt-4 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-neutral-950/60 px-5 py-2.5 backdrop-blur-xl sm:px-6 [margin-inline:max(1rem,calc((100vw-72rem)/2))]">
          <Link href="/#work" className={`text-sm text-neutral-400 transition-colors hover:text-white ${focus}`}>
            ← All work
          </Link>
          <Link href="/" className={`text-sm font-medium text-white ${focus}`}>
            Dan Brandt
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="relative isolate overflow-hidden pt-36 sm:pt-44">
        <div
          aria-hidden="true"
          className="glow-drift pointer-events-none absolute -right-40 top-0 -z-10 size-[640px] rounded-full opacity-20 blur-[140px]"
          style={{ background: study.accent }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [background-image:radial-gradient(#404040_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 sm:px-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Reveal y={12}>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur">
                <span className="size-1.5 rounded-full bg-[var(--accent)]" />
                {study.kind} · {study.status}
              </p>
            </Reveal>
            <SplitHeadline
              delay={0.1}
              className="mt-7 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-8xl"
              parts={[{ text: study.title }]}
            />
            <Reveal delay={0.4}>
              <p className="mt-7 max-w-xl text-xl leading-9 text-neutral-300">{study.summary}</p>
            </Reveal>
            <Reveal delay={0.55}>
              <dl className="mt-12 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
                {[
                  ["Role", study.role],
                  ["Timeline", study.timeline],
                  ["Platform", study.platform],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className={eyebrow}>{term}</dt>
                    <dd className="mt-2 text-sm leading-6 text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            {study.links.length > 0 && (
              <Reveal delay={0.65}>
                <div className="mt-10 flex flex-wrap gap-3">
                  {study.links.map((link, i) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
                        i === 0
                          ? "bg-white text-neutral-950 hover:bg-[var(--accent)]"
                          : "border border-white/15 text-neutral-200 hover:border-white/40"
                      } ${focus}`}
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
          <Reveal fade delay={0.2} y={60}>
            <div className="relative flex justify-center">
              <div aria-hidden="true" className="absolute inset-[15%] rounded-full opacity-40 blur-[90px]" style={{ background: study.accent }} />
              <div className={`float relative ${study.cover.shape === "phone" ? "w-[62%] max-w-[300px]" : "w-full"}`}>
                <Device figure={study.cover} priority sizes={study.cover.shape === "phone" ? "300px" : "(min-width: 1024px) 480px, 90vw"} />
              </div>
            </div>
          </Reveal>
        </div>

        {/* ===== TL;DR ===== */}
        <div className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
              {[
                ["The problem", study.problem[0]],
                ["What I did", study.did],
                ["The result", study.outcome[0]],
              ].map(([term, value]) => (
                <div key={term} className="bg-neutral-950/90 p-7 backdrop-blur sm:p-8">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">{term}</p>
                  <p className="mt-4 text-sm leading-7 text-neutral-300">{value}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 sm:px-10 xl:grid-cols-[180px_1fr]">
        <aside>
          <SectionNav sections={sections} />
        </aside>

        <div className="min-w-0">
          <div className="max-w-3xl">
            <Section id="problem" number="01" eyebrow="Problem" title="What was wrong">
              <div className="space-y-6">
                {study.problem.map((paragraph) => (
                  <Reveal key={paragraph}>
                    <p className={body}>{paragraph}</p>
                  </Reveal>
                ))}
              </div>
              {study.quote && (
                <Reveal>
                  <blockquote className="relative mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-10">
                    <span aria-hidden="true" className="absolute -top-7 left-8 font-serif text-8xl leading-none text-[var(--accent)]">“</span>
                    <p className="font-serif text-2xl leading-[1.35] text-white sm:text-3xl">{study.quote.text}</p>
                    <footer className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      {study.quote.source}
                    </footer>
                  </blockquote>
                </Reveal>
              )}
            </Section>

            <Section id="people" number="02" eyebrow="People" title="Who it is for">
              <List items={study.audience} />
            </Section>

            <Section id="constraints" number="03" eyebrow="Constraints" title="What shaped the design">
              <List items={study.constraints} />
            </Section>
          </div>

          <Section id="decisions" number="04" eyebrow="Decisions" title="Key decisions and why">
            <ol className="grid gap-5 lg:grid-cols-2">
              {study.decisions.map((decision, i) => (
                <Reveal as="li" key={decision.title} delay={(i % 2) * 0.08}>
                  <article className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition-colors duration-500 hover:border-white/25 sm:p-8">
                    <div
                      aria-hidden="true"
                      className="absolute -right-10 -top-10 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
                      style={{ background: study.accent }}
                    />
                    <div className="relative flex items-baseline justify-between gap-4">
                      <span className="font-serif text-4xl italic text-neutral-600">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {decision.status && (
                        <span className="rounded-full border border-[var(--accent)]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                          {decision.status}
                        </span>
                      )}
                    </div>
                    <h3 className="relative mt-4 text-xl font-semibold tracking-tight text-white">{decision.title}</h3>
                    <div className="relative mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 text-sm leading-7">
                      <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-600">Before</span>
                      <p className="text-neutral-500 line-through decoration-neutral-700">{decision.before}</p>
                      <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">After</span>
                      <p className="text-neutral-100">{decision.after}</p>
                    </div>
                    <p className="relative mt-6 border-t border-white/10 pt-5 text-sm leading-7 text-neutral-400">
                      <span className="font-medium text-neutral-200">Why: </span>
                      {decision.why}
                    </p>
                  </article>
                </Reveal>
              ))}
            </ol>

            {study.comparison && (
              <Reveal fade className="mt-20">
                <div className="grid items-center gap-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 lg:grid-cols-[1fr_340px]">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">Before and after</p>
                    <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
                      {study.comparison.caption.split(". ")[0]}.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-neutral-400">
                      {study.comparison.caption.split(". ").slice(1).join(". ")}
                    </p>
                  </div>
                  <CompareSlider before={study.comparison.before} after={study.comparison.after} />
                </div>
              </Reveal>
            )}
          </Section>

          {hasProcess && (
            <Section id="process" number="05" eyebrow="Process" title="What I tried and let go">
              {study.explorations.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {study.explorations.map((exploration, i) => (
                    <Reveal key={exploration.title} delay={(i % 2) * 0.08}>
                      <div className="h-full rounded-3xl border border-dashed border-white/15 p-7">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-600">Dropped</p>
                        <h3 className="mt-3 text-lg font-semibold text-white">{exploration.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-neutral-400">{exploration.body}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
              {study.studies && (
                <div className="mt-16 grid gap-16">
                  {study.studies.map((figure) => (
                    <Reveal key={figure.src} as="figure" fade>
                      <BrowserFrame figure={figure} url="design study" />
                      {figure.caption && (
                        <figcaption className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">{figure.caption}</figcaption>
                      )}
                    </Reveal>
                  ))}
                </div>
              )}
            </Section>
          )}

          {study.gallery.length > 0 && (
            <section className="border-t border-white/10 py-20 sm:py-24">
              <Reveal>
                <p className={eyebrow}>The shipped product</p>
              </Reveal>
              <div
                className={`mt-10 grid gap-8 ${
                  study.gallery[0].shape === "phone" ? "grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2"
                }`}
              >
                {study.gallery.map((figure, i) => (
                  <Reveal key={figure.src} as="figure" fade delay={i * 0.08} className={i % 2 === 1 && figure.shape === "phone" ? "lg:mt-12" : ""}>
                    <Device figure={figure} sizes={figure.shape === "phone" ? "260px" : "(min-width: 768px) 480px, 90vw"} />
                    {figure.caption && (
                      <figcaption className="mt-4 text-center text-sm text-neutral-500">{figure.caption}</figcaption>
                    )}
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <div className="max-w-3xl">
            <Section id="outcome" number={hasProcess ? "06" : "05"} eyebrow="Outcome" title="Where it landed">
              <List items={study.outcome} />
              {study.next.length > 0 && (
                <Reveal className="mt-14">
                  <p className={eyebrow}>What I would do next</p>
                  <div className="mt-6">
                    <List items={study.next} />
                  </div>
                </Reveal>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* ===== NEXT ===== */}
      <Link
        href={`/work/${nextStudy.slug}`}
        className={`group relative isolate block overflow-hidden border-t border-white/10 ${focus}`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
          style={{ background: nextStudy.accent }}
        />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-20 sm:px-10 sm:py-28">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 transition-colors duration-500 group-hover:text-neutral-900">
              Next case study
            </p>
            <p className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-white transition-colors duration-500 group-hover:text-neutral-950 sm:text-7xl">
              {nextStudy.title}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-400 transition-colors duration-500 group-hover:text-neutral-800">
              {nextStudy.summary}
            </p>
          </div>
          <span className="hidden size-20 shrink-0 items-center justify-center rounded-full border border-white/20 text-3xl text-white transition-all duration-500 group-hover:-rotate-45 group-hover:border-neutral-950 group-hover:text-neutral-950 sm:flex">
            →
          </span>
        </div>
      </Link>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-10 text-xs text-neutral-500 sm:px-10">
          <p>© 2026 Dan Brandt · Kansas City, KS</p>
          <a href="mailto:dan@dbdoo.dev" className="hover:text-white">dan@dbdoo.dev</a>
        </div>
      </footer>
    </main>
  );
}

