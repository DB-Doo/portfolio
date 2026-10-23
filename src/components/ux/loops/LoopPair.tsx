"use client";

import { useEffect, useRef } from "react";
import type { Scene } from "./kit";

/*
Two phones side by side running one clock: the before on the left, the after on the right,
so the viewer sees which one finishes first without reading anything. Each loop is drawn on
canvas, pauses while off screen, and shows a single still frame under reduced motion.

For video export, a page can define `window.__loopClock` (seconds) before this mounts, and
the loop draws that time on every frame instead of its own.
*/

type Clocked = Window & { __loopClock?: () => number };

export function LoopPair({
  scene,
  loop,
  still,
  label,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  scene: Scene;
  /** Loop length in seconds. */
  loop: number;
  /** The moment shown under reduced motion. */
  still: number;
  /** What the pair shows, for screen readers. */
  label: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const before = useRef<HTMLCanvasElement>(null);
  const after = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const pairs = [before.current, after.current].map((cv) => ({ cv, ctx: cv?.getContext("2d") }));
    if (pairs.some((p) => !p.cv || !p.ctx)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const external = (window as Clocked).__loopClock;
    let W = 0, H = 0, dpr = 1, raf = 0, visible = false;
    const t0 = performance.now();
    const size = () => {
      const box = pairs[0].cv!.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = box.width; H = box.height;
      for (const { cv } of pairs) {
        cv!.width = Math.round(W * dpr);
        cv!.height = Math.round(H * dpr);
      }
    };
    const draw = (time: number) => {
      pairs.forEach(({ ctx }, i) => {
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        scene(ctx!, W, H, time, i === 1);
      });
    };
    const now = () => (external ? external() : (((performance.now() - t0) / 1000) % loop));
    const frame = () => {
      raf = 0;
      if (!external && (!visible || document.hidden)) return;
      draw(now());
      raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduced) raf = requestAnimationFrame(frame); };
    size();
    draw(reduced ? still : 0);
    const ro = new ResizeObserver(() => { size(); draw(reduced ? still : now()); });
    ro.observe(pairs[0].cv!);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
    io.observe(pairs[0].cv!);
    document.addEventListener("visibilitychange", wake);
    if (external) wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [scene, loop, still]);

  const phone = (ref: React.RefObject<HTMLCanvasElement | null>, tag: string, accent: boolean) => (
    <figure className="m-0 flex min-w-0 flex-1 flex-col items-center gap-3">
      <figcaption
        className={`font-mono text-[11px] uppercase tracking-[0.2em] ${accent ? "text-cyan-300" : "text-neutral-500"}`}
      >
        {tag}
      </figcaption>
      <div className="w-full rounded-[1.9rem] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800 p-[5px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="overflow-hidden rounded-[1.6rem] bg-black">
          <canvas ref={ref} aria-hidden="true" className="block aspect-[9/16] w-full" />
        </div>
      </div>
    </figure>
  );

  return (
    <div role="img" aria-label={label} className="mx-auto flex w-full max-w-[460px] gap-4 select-none sm:gap-6">
      {phone(before, beforeLabel, false)}
      {phone(after, afterLabel, true)}
    </div>
  );
}
