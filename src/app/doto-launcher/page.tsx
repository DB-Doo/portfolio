import type { Metadata } from "next";
import Link from "next/link";
import { DotField } from "./DotField";

/*
Direction contract: the page a stranger lands on from a post, a pitch or a search. The
first viewport answers what dot.o is and where to get it, over a dot lattice the visitor
can push around, because the product is something you touch rather than read about. Three
short reasons follow, then the invitation to r/doto. Same dark, direct identity and cyan
signal as the privacy policy. Copy follows the launcher's store voice: no dashes, no
prices, nothing admires itself.
*/

const PLAY_URL = "https://play.google.com/store/apps/details?id=dev.dbdoo.launcher";
const COMMUNITY_URL = "https://www.reddit.com/r/doto/";

export const metadata: Metadata = {
  title: "dot.o Launcher | An infinite canvas for Android",
  description:
    "An Android home screen made of dots. Put apps and widgets anywhere on one canvas, and play music to watch it move. No ads, no account.",
  alternates: {
    canonical: "/doto-launcher",
  },
  openGraph: {
    title: "dot.o Launcher",
    description:
      "An Android home screen made of dots. Put apps anywhere. Play music and it moves.",
    url: "https://dbdoo.dev/doto-launcher",
    siteName: "dbdoo.dev",
    type: "website",
    images: [
      {
        url: "/doto-launcher/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "dot.o Launcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dot.o Launcher",
    description:
      "An Android home screen made of dots. Put apps anywhere. Play music and it moves.",
    images: ["/doto-launcher/feature-graphic.png"],
  },
};

export const dynamic = "force-static";

const reasons = [
  {
    number: "01",
    title: "No grid",
    body: "Place apps, folders and widgets at any point on one canvas. Pinch out to see all of it. Your hand learns where everything lives.",
  },
  {
    number: "02",
    title: "Music you can see",
    body: "Play music and the dots, icons and widgets move with what is actually playing. When it stops, the screen goes still and costs no battery.",
  },
  {
    number: "03",
    title: "No ads. No account.",
    body: "No analytics and no crash reporting. Pro is one purchase, never a subscription, with a free week to try it.",
  },
] as const;

const linkClass =
  "text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300";

export default function DotoLauncherPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      <section className="relative isolate flex min-h-[88svh] flex-col overflow-hidden border-b border-neutral-800 [touch-action:pan-y]">
        <DotField />
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.6)_45%,rgba(10,10,10,0)_75%)]" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8 sm:px-10">
          <Link
            href="/"
            className="inline-flex min-h-11 w-fit items-center font-mono text-xs tracking-[0.16em] text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          >
            ← DBDOO.DEV
          </Link>

          <div className="my-auto max-w-2xl py-16">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
              dot.o Launcher · Android
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Your home screen is a canvas made of dots.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
              Put apps and widgets anywhere. Pinch out to see all of it. Play music and it
              moves.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={PLAY_URL}
                className="inline-flex min-h-12 items-center rounded-full bg-cyan-300 px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
              >
                Get dot.o on Google Play
              </a>
              <a
                href={COMMUNITY_URL}
                className="inline-flex min-h-12 items-center rounded-full border border-neutral-700 px-6 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
              >
                See setups on r/doto
              </a>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Move across the dots
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {reasons.map((reason) => (
            <div key={reason.number}>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                {reason.number}
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
                {reason.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-400">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-800">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
            Share your setup
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Every canvas is different. Show people yours.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
            Turn your setup into a code in Settings, then post it on{" "}
            <a href={COMMUNITY_URL} className={linkClass}>
              r/doto
            </a>
            . Anyone can paste it into dot.o and keep the look, the layout, or both.
          </p>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-8 gap-y-3 px-6 py-10 text-xs leading-5 text-neutral-500 sm:px-10">
          <span>Made by dbdoo</span>
          <Link href="/doto-launcher/privacy" className="hover:text-white">
            Privacy policy
          </Link>
          <a href="mailto:dbdoo.dev@gmail.com" className="hover:text-white">
            dbdoo.dev@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}
