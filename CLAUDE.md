@AGENTS.md

# Portfolio — dbdoo.dev

Dan Brandt's contract-portfolio landing site. Public at **https://dbdoo.dev**.

## What it is

Dan's UX Designer portfolio, aimed at hiring managers for UX and product design roles (decided 2026-09-23). It replaced the contract-developer pitch ("Your app, built in days"). Case studies carry the argument: problem, people, constraints, decisions as before/after/why, what was tried and dropped, outcome. No stat bars, speed claims or sales language.

## Stack

- **Next.js 16** (App Router, under `src/app/`)
- **React 19**
- **TypeScript**
- **GSAP** — SplitText, ScrollTrigger, MorphSVG (all free as of 2025)
- **Motion** (formerly Framer Motion) — import from `motion/react`, client-only
- **Lenis** — smooth scroll, synced with GSAP ticker
- **Matter.js** — 2D physics (currently used for falling-tag sketch, shipped + reverted once)

Deploys to **Vercel** on every push to `main`. Custom domain `dbdoo.dev` aliased on the Vercel project.

## Architecture

- `src/app/` — App Router pages (layout.tsx, page.tsx, opengraph-image.tsx).
- `src/components/` — Shared components (magnetic cursor, tilt cards, gallery, physics tags).
- `public/` — Static assets (photos, icons, screenshots).
- `docs/` — Rebuild plan + design notes.

## Current focus

UX portfolio (merged to `main` 2026-09-24):

- Home (`src/app/page.tsx`): hero, three case-study cards, "Also built", How I design, About, contact. Résumé at `public/Dan_Brandt_Resume.pdf`.
- Case studies: data in `src/content/work.ts`, one template at `src/app/work/[slug]/page.tsx` (static params, `dynamicParams = false`). Slugs: `doto-launcher`, `wide`, `bid-tracker`.
- Visual language matches `/doto-launcher`: neutral-950, cyan-300/400 signal, mono eyebrow labels, Geist via `font-sans` (body CSS still says Arial, so each page's `<main>` sets `font-sans`).
- Every case-study claim is sourced from that project's repo (dot.o: `docs/okf`, `docs/design`, `docs/feedback`, commits; Wide: `docs/audit`, `docs/superpowers/specs`). Never describe unshipped dot.o features as shipped; check its `docs/okf/release/feature-switches.md`.
- The July recruiter-first draft ("I build the whole product") is saved on branch `july-redesign-draft` in the main checkout; Dan chose to start fresh instead.

## Next up

1. Dan confirms the Bid Tracker "why" lines and the reason the paged grid was dropped in dot.o.
2. A UX-titled résumé (the current PDF says App & Web Developer).
3. More before/after pairs for dot.o (tutorial vs hints, three drawers vs one) from old commits.
4. MagneticButton / TiltCard / PhotoLightbox / physics tags are no longer used by the home page; leave them until the new site settles, then remove.

## Gotchas

- **Next.js 16 breaking changes** — the `AGENTS.md` warning at the top of this file is real. Always check `node_modules/next/dist/docs/` before writing code that assumes old Next patterns.
- **R3F / Three.js** — must be `"use client"`, wrap in `next/dynamic` with `ssr: false`.
- **GSAP ScrollTrigger** — only fire inside `useEffect`; never during SSR.
- **react-fluid-distortion** — requires `transpilePackages` config in `next.config.ts`.
- **Physics tags were removed once** (commit `e7bff3e`). Re-introduction needs to solve re-render + scroll-shake. Check that commit's diff before reimplementing.
- **Desktop-only interactions** — always gate magnetic cursor / tilt / hover effects behind `@media (hover: hover)` so mobile doesn't break.

## Deploy / ops

- **Auto-deploy**: push to `main` → Vercel rebuilds → live at `dbdoo.dev` within ~60s.
- **Preview deploys**: feature branches get preview URLs automatically.
- **No staging gate** between local and prod. Test locally (`npm run dev` on :3000) before pushing to main.
- `npm run build` must pass cleanly; Vercel will fail the deploy on TypeScript errors.

## Don't touch without asking

- `public/` photos — user-facing content, replacing without Dan's say-so is a visible change.
- `src/app/layout.tsx` metadata (site title, description, OG image) — SEO-relevant.
- `next.config.ts` — adding to `transpilePackages` or changing image config is usually fine; changing output mode or middleware setup is not.
- `package.json` dependency pins — major version bumps for `next`, `react`, `motion`, `gsap` need a conversation first.

## Worker contract

When a worker wraps up meaningful work in this repo, **update the "Current focus" and "Next up" sections of this file** before exiting. That keeps the next worker (or the next Dan-session) oriented without re-discovery. Git commits cover *what* changed; CLAUDE.md covers *what we're doing*.
