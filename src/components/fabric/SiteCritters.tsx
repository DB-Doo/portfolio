"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { showCritters } from "@/content/critters";
import { loadCritters, type Critters } from "@/components/ux/critterEngine";
import { fabricBus } from "./bus";
import { ledges, walls } from "./room";

/*
Doto's Canvas Critters, the jumping spider and the Roomba, living on the site's dot sheet on
every page. The window is their room: text and controls are walls they drive around and never
stop on, and cards, phones and pictures are ledges the spider can stand on, which carry it as
the page scrolls. The spider's nest sits on the Doto phone while the home hero shows and in
the top right corner of the window otherwise; the Roomba's dock is beside the hero's buttons,
or in the bottom right corner. Their feet, the Roomba and their balls dent the sheet itself.

Both sleep at home until someone moves over open dots, and a cursor over text is ignored, so
nobody reading is followed. The engine loads once the browser is idle. Reduced motion leaves
them asleep with a button to wake them. Each page is a new room, so a navigation remounts them.
*/

export function SiteCritters() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const critters = useRef<Critters | null>(null);
  const pathname = usePathname();
  const [resting, setResting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showCritters) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let controller: AbortController | null = null;
    let width = 0;
    let lastSignature = 0;

    const start = () => {
      if (cancelled) return;
      critters.current?.stop();
      controller?.abort();
      controller = new AbortController();
      width = window.innerWidth;
      const zoom = width >= 1024 ? 1.15 : width >= 640 ? 1 : 0.85;
      const visible = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.width && r.bottom > 80 && r.top < window.innerHeight - 40 ? r : null;
      };
      loadCritters()
        .then((engine) => {
          if (cancelled || !controller) return;
          critters.current = engine.mountSite({
            canvas,
            input: document.body,
            zoom,
            walls,
            ledges,
            nestAt(box, z) {
              const host = visible(document.querySelector("[data-critter-nest]"));
              if (host) return [(host.left - box.left + host.width * 0.675) / z, (host.top - box.top + host.height * 0.225) / z];
              return [(box.width - 70) / z, 130 / z];
            },
            dockAt(box, z) {
              const W = box.width / z;
              const H = box.height / z;
              const buttons = visible(document.querySelector('[data-critter-name="the buttons"]'));
              if (buttons) {
                const right = (buttons.right - box.left) / z + 64;
                const mid = (buttons.top + buttons.height / 2 - box.top) / z;
                if (right + 40 < W * 0.5) return [right, Math.min(mid, H - 110)];
              }
              return [W - 56, H - 70];
            },
            press(dents) {
              let signature = dents.length;
              for (const d of dents) signature += Math.round(d.x * 3 + d.y * 7 + d.r * 11);
              fabricBus.presses = dents;
              if (signature !== lastSignature) {
                lastSignature = signature;
                fabricBus.wake();
              }
            },
            still,
            signal: controller.signal,
            fontMono: getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim(),
          });
          setResting(still);
        })
        .catch(() => {});
    };

    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    let handle = 0;
    // Let the page's own entrance settle first.
    const settle = window.setTimeout(() => {
      handle = idle(start, { timeout: 2500 });
    }, 1200);

    let relayout = 0;
    const resize = () => {
      if (!critters.current || window.innerWidth === width) return;
      window.clearTimeout(relayout);
      relayout = window.setTimeout(start, 250);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.clearTimeout(relayout);
      cancelIdle(handle);
      window.removeEventListener("resize", resize);
      controller?.abort();
      critters.current?.stop();
      critters.current = null;
      fabricBus.presses = [];
      fabricBus.wake();
    };
  }, [pathname]);

  if (!showCritters) return null;
  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 h-full w-full" />
      {resting && (
        <button
          type="button"
          onClick={() => {
            critters.current?.wake();
            setResting(false);
          }}
          className="fixed bottom-5 left-5 z-40 rounded-full border border-white/15 bg-neutral-950/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-300 backdrop-blur transition-colors hover:border-cyan-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          Wake the critters
        </button>
      )}
    </>
  );
}
