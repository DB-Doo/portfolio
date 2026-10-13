"use client";

import { useEffect, useRef, useState } from "react";
import { DotField } from "@/app/doto-launcher/DotField";
import { loadCritters, type Critters } from "./critterEngine";

/*
The home hero's dot field, with Doto's Canvas Critters living in it: the jumping spider nests on
the Doto phone and the Roomba has a dock on the floor under the buttons. The page's own elements
are their room. Text and buttons (data-critter="wall") are walls they drive around and never stop
on, and the cards (data-critter="ledge") are ledges the spider stands on, which carry it as they
drift.

The plain dot field paints first. The engine loads once the browser is idle, then takes over the
same lattice, so the swap doesn't show. Both critters sleep at home until someone moves over the
open dots, and a cursor over text is ignored, so nobody reading the hero is followed. Off screen
or in a hidden tab nothing is drawn. Reduced motion leaves them asleep with a button to wake them.
*/

export function HeroCritters() {
  const fabricRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const critters = useRef<Critters | null>(null);
  const [ready, setReady] = useState(false);
  const [resting, setResting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fabricCanvas = fabricRef.current;
    const hero = canvas?.closest("header");
    if (!canvas || !fabricCanvas || !hero) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let cancelled = false;
    let controller: AbortController | null = null;
    let width = 0;

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(hero);

    const start = () => {
      if (cancelled) return;
      critters.current?.stop();
      controller?.abort();
      controller = new AbortController();
      width = hero.clientWidth;
      const wide = width >= 1024;
      const walls = () => [
        ...hero.querySelectorAll('[data-critter="wall"]'),
        ...document.querySelectorAll('nav [data-critter="wall"]'),
      ];
      const ledges = () => [...hero.querySelectorAll('[data-critter="ledge"]')];
      const style = getComputedStyle(document.documentElement);
      loadCritters()
        .then((engine) => {
          if (cancelled || !controller) return;
          critters.current = engine.mountPage({
            canvas,
            fabricCanvas,
            input: hero,
            zoom: wide ? 1.2 : 1,
            walls,
            ledges,
            nestOn: hero.querySelector('[data-critter-nest]'),
            // The dock sits on the open floor just right of the buttons, facing up, so the Roomba
            // rolls out downward.
            dockAt(box, zoom) {
              const buttons = hero.querySelector('[data-critter-name="the buttons"]')?.getBoundingClientRect();
              const W = box.width / zoom, H = box.height / zoom;
              if (!buttons) return [90, H - 130];
              const right = (buttons.right - box.left) / zoom + 64;
              const mid = (buttons.top + buttons.height / 2 - box.top) / zoom;
              if (right + 40 < W * 0.5) return [right, Math.min(mid, H - 110)];
              // Phones: the buttons fill the row, so the dock sits at the right edge of the gap
              // under them, turned to face the edge so the Roomba rolls out along the gap.
              return [W - 42, (buttons.bottom - box.top) / zoom + 40, 0];
            },
            still,
            isVisible: () => visible,
            signal: controller.signal,
            fontMono: style.getPropertyValue("--font-geist-mono").trim(),
          });
          setReady(true);
          setResting(still);
        })
        .catch(() => setReady(false));
    };

    // Wait for the hero's own entrance to settle and the browser to be idle.
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    let handle = 0;
    const settle = window.setTimeout(() => {
      handle = idle(start, { timeout: 2500 });
    }, 1800);

    // The world is laid out for one width; a new width lays it out again.
    let relayout = 0;
    const resize = new ResizeObserver(() => {
      if (!critters.current || hero.clientWidth === width) return;
      window.clearTimeout(relayout);
      relayout = window.setTimeout(start, 250);
    });
    resize.observe(hero);

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.clearTimeout(relayout);
      cancelIdle(handle);
      visibility.disconnect();
      resize.disconnect();
      controller?.abort();
      critters.current?.stop();
      critters.current = null;
    };
  }, []);

  const wake = () => {
    critters.current?.wake();
    setResting(false);
  };

  return (
    <>
      {!ready && <DotField />}
      <canvas ref={fabricRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${ready ? "" : "invisible"}`} />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
      {ready && (
        <div className="absolute bottom-6 right-6 z-20 sm:right-10">
          {resting ? (
            <button
              type="button"
              onClick={wake}
              className="rounded-full border border-white/15 bg-neutral-950/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-300 backdrop-blur transition-colors hover:border-cyan-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              Wake the critters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => critters.current?.toss()}
              className="sr-only rounded-full bg-neutral-950 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white focus:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              Toss the critters a ball
            </button>
          )}
        </div>
      )}
    </>
  );
}
