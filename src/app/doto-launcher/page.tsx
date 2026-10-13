import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { showCritters } from "@/content/critters";
import { CritterPhone } from "./CritterPhone";

/*
Direction contract: the page a stranger lands on from a post, a pitch or a search. The
first viewport answers what Doto is and where to get it, over the site's dot sheet the
visitor can push around, because the product is something you touch rather than read about. The
Play screenshots and four short reasons follow, then the invitation to r/doto. Same dark,
direct identity and cyan signal as the privacy policy. Copy follows the launcher's store voice: no dashes, no
prices, nothing admires itself.
*/

const PLAY_URL = "https://play.google.com/store/apps/details?id=dev.dbdoo.launcher";
const COMMUNITY_URL = "https://www.reddit.com/r/doto/";

export const metadata: Metadata = {
  title: "Doto Launcher | An infinite canvas for Android",
  description:
    "An Android home screen made of dots. Put apps anywhere on one canvas, watch it move with your music, raise it into 3D, and meet the Canvas Critters. No ads, no account.",
  alternates: {
    canonical: "/doto-launcher",
  },
  openGraph: {
    title: "Doto Launcher",
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
        alt: "Doto Launcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doto Launcher",
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
    title: "A whole look in one tap",
    body: "Hold empty space and tap Looks. Colors, font, icons and fabric change together. Tap Customize to change any one of them on your own home, and Undo if you change your mind.",
  },
  {
    number: "03",
    title: "No ads. No account.",
    body: "No analytics and no crash reporting. Pro is one purchase, never a subscription, with a free week to try it.",
  },
] as const;

const screens = [
  { file: "01-home", alt: "A home screen made of dots. No grid, no pages." },
  { file: "04-looks", alt: "One tap, a whole new look: colors, font, icons, widgets and fabric." },
  { file: "05-anywhere", alt: "Put anything anywhere. Pro." },
  { file: "06-day", alt: "Your whole day at a glance. Pro." },
  { file: "07-hold", alt: "Hold anywhere to make it yours." },
] as const;

/* The three things Dan sees as Doto's standouts (2026-10-13), so they lead the page. */
const standouts = [
  {
    file: "02-music",
    label: "Music visualizer",
    title: "Your music moves the dots",
    body: "Add the music widget and its dots move with what is actually playing. With Pro, the whole home screen moves. When the music stops, the screen goes still and costs no battery.",
    alt: "A music widget whose dots ripple with the song that is playing",
  },
  {
    file: "03-3d",
    label: "3D canvas · Pro",
    title: "Raise the canvas into 3D",
    body: "The flat sheet of dots rises into a landscape that shifts as you tilt your phone. Shape its terrain and glass to taste.",
    alt: "The dot canvas raised into a 3D landscape",
  },
] as const;

const critterTips = [
  "Tap play on the music widget and watch them dance.",
  "Hold still near the spider and it comes closer.",
  "Flick anywhere to throw a ball.",
  "Rub the Roomba fast to tickle it. It won't like it.",
  "Hold the Roomba to pick it up.",
] as const;

const linkClass =
  "text-cyan-300 underline decoration-cyan-800 underline-offset-4 hover:decoration-cyan-300";

export default function DotoLauncherPage() {
  return (
    <main className="min-h-screen text-neutral-200 selection:bg-cyan-300 selection:text-neutral-950">
      <section className="relative isolate flex min-h-[88svh] flex-col overflow-hidden border-b border-neutral-800 [touch-action:pan-y]">
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
              Doto Launcher · Android
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Your home screen is a canvas made of dots.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
              Put apps and widgets anywhere. Play music and the dots move with it, raise
              the canvas into 3D, and soon share it with a spider and a Roomba.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={PLAY_URL}
                className="inline-flex min-h-12 items-center rounded-full bg-cyan-300 px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
              >
                Get Doto on Google Play
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

      <section aria-labelledby="standouts-heading" className="border-b border-neutral-800">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
            Only on Doto
          </p>
          <h2
            id="standouts-heading"
            className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            A home screen that moves, rises and has roommates.
          </h2>
          <div className="mt-14 grid gap-14 sm:grid-cols-2 sm:gap-10">
            {standouts.map((item) => (
              <figure key={item.file} data-fabric="well" className="rounded-3xl">
                <Image
                  src={`/doto-launcher/screens/${item.file}.webp`}
                  alt={item.alt}
                  width={720}
                  height={1280}
                  sizes="(min-width: 640px) 440px, 100vw"
                  className="mx-auto h-auto w-full max-w-72 rounded-3xl border border-neutral-800"
                />
                <figcaption className="mt-8">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                    {item.label}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">{item.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          {showCritters && (
            <a
              href="#critters-heading"
              className="mt-14 block rounded-3xl border border-neutral-800 bg-neutral-950/70 p-8 transition-colors hover:border-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 sm:p-10"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                Canvas Critters · Coming to Doto Pro
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-white">
                A spider and a Roomba live on your canvas.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-400">
                The two you see wandering this page are the same ones. Play with them below. ↓
              </p>
            </a>
          )}
        </div>
      </section>

      <section aria-label="Screenshots" className="border-b border-neutral-800">
        <ul className="mx-auto flex max-w-5xl snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 py-12 sm:scroll-px-10 [scrollbar-width:thin] sm:px-10">
          {screens.map((screen) => (
            <li key={screen.file} className="w-52 shrink-0 snap-start sm:w-60">
              <Image
                src={`/doto-launcher/screens/${screen.file}.webp`}
                alt={screen.alt}
                width={720}
                height={1280}
                sizes="(min-width: 640px) 240px, 208px"
                className="h-auto w-full rounded-2xl border border-neutral-800"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <div className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
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

      {showCritters && (
        <section aria-labelledby="critters-heading" className="border-t border-neutral-800">
          <div className="mx-auto grid max-w-5xl items-center gap-14 px-6 py-20 sm:px-10 md:grid-cols-[1fr_300px] md:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-400">
                Canvas Critters · Coming to Doto Pro
              </p>
              <h2
                id="critters-heading"
                className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-4xl"
              >
                Two roommates live on your canvas.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400 sm:text-base">
                A jumping spider made of dots hops between your widgets and slowly learns to
                trust you. A little Roomba tidies up after it and goes home to charge. Play music
                and they both dance. They are coming to Doto as a Pro widget, and they already
                live on this phone, so try them.
              </p>
              <ul className="mt-8 grid gap-3 font-mono text-xs leading-5 text-neutral-500">
                {critterTips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-cyan-300/70" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            {/* The site's own critters treat the phone as a wall, so they never meet these two. */}
            <div data-critter="wall" data-critter-name="the phone">
              <CritterPhone />
            </div>
          </div>
        </section>
      )}

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
            . Anyone can paste it into Doto and keep the look, the layout, or both.
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
