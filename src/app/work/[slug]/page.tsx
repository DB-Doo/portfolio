import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy, type Figure } from "@/content/work";

/*
One template for every case study. Reading order follows how a hiring manager scans:
the overview strip, the problem in the user's words, who it is for, the constraints, then
the decisions as before / after / why, then what was tried and dropped, then outcome.
Long text sits in a single reading column; images are allowed to be wider.
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

const label = "font-mono text-xs uppercase tracking-[0.18em] text-cyan-400";
const body = "text-base leading-8 text-neutral-300";
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";

function Shot({ figure, priority = false }: { figure: Figure; priority?: boolean }) {
  const phone = figure.shape === "phone";
  return (
    <figure className={phone ? "mx-auto w-full max-w-[300px]" : "w-full"}>
      <Image
        src={figure.src}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        priority={priority}
        sizes={phone ? "300px" : "(min-width: 1024px) 960px, 100vw"}
        className={`h-auto w-full border border-neutral-800 bg-neutral-900 ${
          phone ? "rounded-[28px]" : "rounded-xl"
        }`}
      />
      {figure.caption && (
        <figcaption className="mt-3 text-sm leading-6 text-neutral-500">
          {figure.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-neutral-800 py-16 sm:py-20">
      <p className={label}>{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className={`${body} flex gap-4`}>
          <span aria-hidden="true" className="mt-[13px] size-1.5 shrink-0 rounded-full bg-cyan-400" />
          <span>{item}</span>
        </li>
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

  return (
    <main className="min-h-screen bg-neutral-950 font-sans text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <nav className="flex items-center justify-between py-8">
          <Link
            href="/#work"
            className={`inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-neutral-400 transition-colors hover:text-white ${focus}`}
          >
            ← ALL WORK
          </Link>
          <span className="font-mono text-xs tracking-[0.16em] text-neutral-500">
            DAN BRANDT · UX DESIGNER
          </span>
        </nav>

        {/* ===== Overview ===== */}
        <header className="grid gap-12 pb-16 pt-8 md:grid-cols-[1fr_300px] md:items-center md:gap-16">
          <div>
            <p className={label}>
              {study.kind} · {study.status}
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              {study.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-300">{study.summary}</p>
            <dl className="mt-10 grid gap-6 border-t border-neutral-800 pt-8 sm:grid-cols-3">
              {[
                ["Role", study.role],
                ["Timeline", study.timeline],
                ["Platform", study.platform],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    {term}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-neutral-200">{value}</dd>
                </div>
              ))}
            </dl>
            {study.links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {study.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`inline-flex min-h-11 items-center text-sm font-medium text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300 ${focus}`}
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
          <Shot figure={study.cover} priority />
        </header>

        <div className="max-w-3xl">
          <Section eyebrow="01 · Problem" title="What was wrong">
            <div className="space-y-6">
              {study.problem.map((paragraph) => (
                <p key={paragraph} className={body}>
                  {paragraph}
                </p>
              ))}
            </div>
            {study.quote && (
              <blockquote className="mt-10 border-l-2 border-cyan-400 pl-6">
                <p className="text-xl leading-9 text-white">“{study.quote.text}”</p>
                <footer className="mt-3 text-sm text-neutral-500">{study.quote.source}</footer>
              </blockquote>
            )}
          </Section>

          <Section eyebrow="02 · People" title="Who it is for">
            <List items={study.audience} />
          </Section>

          <Section eyebrow="03 · Constraints" title="What shaped the design">
            <List items={study.constraints} />
          </Section>
        </div>

        <Section eyebrow="04 · Decisions" title="Key decisions and why">
          <ol className="grid gap-6 md:grid-cols-2">
            {study.decisions.map((decision, i) => (
              <li
                key={decision.title}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs text-neutral-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {decision.status && (
                    <span className="rounded-full border border-neutral-700 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                      {decision.status}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{decision.title}</h3>
                <dl className="mt-5 space-y-4 text-sm leading-7">
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Before
                    </dt>
                    <dd className="mt-1 text-neutral-400">{decision.before}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                      After
                    </dt>
                    <dd className="mt-1 text-neutral-200">{decision.after}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Why
                    </dt>
                    <dd className="mt-1 text-neutral-300">{decision.why}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>

          {study.comparison && (
            <figure className="mt-16">
              <div className="grid grid-cols-2 gap-4 sm:gap-10 md:mx-auto md:max-w-2xl">
                {(["before", "after"] as const).map((side) => (
                  <div key={side}>
                    <p
                      className={`mb-3 font-mono text-[11px] uppercase tracking-[0.16em] ${
                        side === "after" ? "text-cyan-400" : "text-neutral-500"
                      }`}
                    >
                      {side}
                    </p>
                    <Shot figure={study.comparison![side]} />
                  </div>
                ))}
              </div>
              <figcaption className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-neutral-400">
                {study.comparison.caption}
              </figcaption>
            </figure>
          )}
        </Section>

        {(study.explorations.length > 0 || study.studies) && (
          <Section eyebrow="05 · Process" title="What I tried and let go">
            {study.explorations.length > 0 && (
              <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
                {study.explorations.map((exploration) => (
                  <div key={exploration.title}>
                    <h3 className="text-lg font-semibold text-white">{exploration.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-neutral-400">{exploration.body}</p>
                  </div>
                ))}
              </div>
            )}
            {study.studies && (
              <div className="mt-16 grid gap-12">
                {study.studies.map((figure) => (
                  <Shot key={figure.src} figure={figure} />
                ))}
              </div>
            )}
          </Section>
        )}

        {study.gallery.length > 0 && (
          <Section eyebrow="Shipped" title="What it looks like">
            <div
              className={`grid gap-8 ${
                study.gallery[0].shape === "phone"
                  ? "grid-cols-2 lg:grid-cols-4"
                  : "md:grid-cols-2"
              }`}
            >
              {study.gallery.map((figure) => (
                <Shot key={figure.src} figure={figure} />
              ))}
            </div>
          </Section>
        )}

        <div className="max-w-3xl">
          <Section eyebrow="Outcome" title="Where it landed">
            <List items={study.outcome} />
          </Section>

          {study.next.length > 0 && (
            <Section eyebrow="Next" title="What I would do next">
              <List items={study.next} />
            </Section>
          )}
        </div>

        <Link
          href={`/work/${nextStudy.slug}`}
          className={`group mb-16 block rounded-2xl border border-neutral-800 p-8 transition-colors hover:border-neutral-600 sm:p-10 ${focus}`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Next case study
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {nextStudy.title} <span className="text-cyan-400 transition-transform group-hover:translate-x-1 inline-block">→</span>
          </p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-neutral-400">{nextStudy.summary}</p>
        </Link>
      </div>
    </main>
  );
}
