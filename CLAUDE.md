@AGENTS.md

# Portfolio — dbdoo.dev

Dan Brandt's contract-portfolio landing site. Public at **https://dbdoo.dev**.

## What it is

A creative-dev-grade portfolio aimed at senior technical audiences (Google AI engineers, Awwwards-quality reviewers, freelance clients). Currently transitioning from a clean-but-standard Next.js site into a more distinctive, interactive experience per the 6-day creative rebuild plan.

## Stack

- **Next.js 16** (App Router, under `src/app/`)
- **React 19**
- **TypeScript**
- **GSAP** — SplitText, ScrollTrigger, MorphSVG (all free as of 2025)
- **Motion** (formerly Framer Motion) — import from `motion/react`, client-only
- **Lenis** — smooth scroll, synced with GSAP ticker
- **Matter.js** — 2D physics (currently used for falling-tag sketch, shipped + reverted once)

Deploys to **Vercel** on every push to `master`. Custom domain `dbdoo.dev` aliased on the Vercel project.

## Architecture

- `src/app/` — App Router pages (layout.tsx, page.tsx, opengraph-image.tsx).
- `src/components/` — Shared components (magnetic cursor, tilt cards, gallery, physics tags).
- `public/` — Static assets (photos, icons, screenshots).
- `docs/` — Rebuild plan + design notes.

## Current focus

Mobile polish + creative-dev upgrades. Recent shipped work (`git log`):

- Mobile overflow fixes across project cards, photo galleries, tilt cards.
- 3D tilt on "Why Me" / "How I Work" cards (desktop; disabled on mobile).
- Magnetic buttons, custom cursor, smooth scroll (Lenis).
- Physics tags (Matter.js) — shipped and reverted pending production-readiness work.

## Next up

From the creative-rebuild plan (priority order):

1. **Dark mode + dynamic color system** — glassmorphism cards, noise texture, section-based accent hue shifts via CSS custom properties + GSAP ScrollTrigger.
2. **Physics tags, production-ready** — revisit the reverted Matter.js implementation; fix re-render / scroll-shake issues that pushed it off the live site.
3. **GSAP SplitText reveal** on hero and section headers.
4. **Fluid distortion cursor effect** (react-fluid-distortion) — drop-in WebGL experiment.
5. **3D scenes via R3F + Drei + Rapier** — for project showcase sections.

The full 26-page creative plan lives in the Admin memory as `project_dbdoo_creative_rebuild.md`. Dan has it emailed to himself too.

## Gotchas

- **Next.js 16 breaking changes** — the `AGENTS.md` warning at the top of this file is real. Always check `node_modules/next/dist/docs/` before writing code that assumes old Next patterns.
- **R3F / Three.js** — must be `"use client"`, wrap in `next/dynamic` with `ssr: false`.
- **GSAP ScrollTrigger** — only fire inside `useEffect`; never during SSR.
- **react-fluid-distortion** — requires `transpilePackages` config in `next.config.ts`.
- **Physics tags were removed once** (commit `e7bff3e`). Re-introduction needs to solve re-render + scroll-shake. Check that commit's diff before reimplementing.
- **Desktop-only interactions** — always gate magnetic cursor / tilt / hover effects behind `@media (hover: hover)` so mobile doesn't break.

## Deploy / ops

- **Auto-deploy**: push to `master` → Vercel rebuilds → live at `dbdoo.dev` within ~60s.
- **Preview deploys**: feature branches get preview URLs automatically.
- **No staging gate** between local and prod. Test locally (`npm run dev` on :3000) before pushing to master.
- `npm run build` must pass cleanly; Vercel will fail the deploy on TypeScript errors.

## Don't touch without asking

- `public/` photos — user-facing content, replacing without Dan's say-so is a visible change.
- `src/app/layout.tsx` metadata (site title, description, OG image) — SEO-relevant.
- `next.config.ts` — adding to `transpilePackages` or changing image config is usually fine; changing output mode or middleware setup is not.
- `package.json` dependency pins — major version bumps for `next`, `react`, `motion`, `gsap` need a conversation first.

## Worker contract

When a worker wraps up meaningful work in this repo, **update the "Current focus" and "Next up" sections of this file** before exiting. That keeps the next worker (or the next Dan-session) oriented without re-discovery. Git commits cover *what* changed; CLAUDE.md covers *what we're doing*.
