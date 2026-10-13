"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fabricBus } from "./bus";
import { Fabric, Spring, type Collider } from "./engine";
import { ledges, walls } from "./room";

/*
One dot fabric under every page, so the site reads as one material rather than sections on a
background. It scrolls with the content, gives very slightly under a fast scroll and springs
back. Cards, phones and pictures sit in wells with the cloth gathered at their rims, and a
well you can open deepens under the pointer or keyboard focus. Text presses the cloth lightly,
so dots thin out behind words. The cursor dents it, a click rings out through it, and the
critters' feet, the Roomba and their balls dent it as they go.

It sits behind the page (pages leave their own background transparent) and is skipped on the
privacy policy, which stays plain.
*/

type Well = { el: Element; col: Collider; depth: Spring; opens: boolean; radius: number };

const radiusOf = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 0);

// Well depth. Phones get shallower wells: their cards nearly fill the width, and the gathered
// cloth has only a narrow margin to go to.
const narrow = () => typeof window !== "undefined" && window.innerWidth < 640;
const restDepth = () => (narrow() ? 9 : 16);
const deepDepth = () => (narrow() ? 20 : 38);

export function SiteFabric() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const recollect = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = window.matchMedia("(hover: hover)").matches;
    const fabric = new Fabric(canvas, { still });
    let wells: Well[] = [];
    let presses: { el: Element; col: Collider }[] = [];
    let pointer: { x: number; y: number } | null = null;

    const collect = () => {
      wells = ledges().map((el) => ({
        el,
        col: { x: 0, y: 0, w: 0, h: 0, r: 28, pad: restDepth(), str: 0.06 },
        depth: new Spring(restDepth(), 0.12, 0.72),
        opens: !!el.closest("a"),
        radius: radiusOf(el) || radiusOf(el.firstElementChild) || 12,
      }));
      presses = walls().map((el) => ({ el, col: { x: 0, y: 0, w: 0, h: 0, r: 16, pad: 10, str: 0.02 } }));
      fabric.wake();
    };
    recollect.current = () => requestAnimationFrame(() => requestAnimationFrame(collect));

    fabric.beforeFrame = () => {
      fabric.scrollY = window.scrollY;
      const focused = document.activeElement;
      const H = fabric.height;
      let moving = false;
      for (const well of wells) {
        const r = well.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > H + 100) {
          well.col.pad = 0;
          continue;
        }
        const over =
          well.opens &&
          ((pointer && pointer.x > r.left && pointer.x < r.right && pointer.y > r.top && pointer.y < r.bottom) ||
            (focused instanceof Element && (well.el.contains(focused) || focused.contains(well.el))));
        well.depth.t = over ? deepDepth() : restDepth();
        moving = well.depth.step() || moving;
        Object.assign(well.col, { x: r.left, y: r.top, w: r.width, h: r.height, r: well.radius, pad: well.depth.v });
      }
      for (const press of presses) {
        const r = press.el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > H + 40) {
          press.col.pad = 0;
          continue;
        }
        Object.assign(press.col, { x: r.left - 8, y: r.top - 6, w: r.width + 16, h: r.height + 12, pad: 10 });
      }
      fabric.colliders = [...wells.map((w) => w.col), ...presses.map((p) => p.col), ...fabricBus.colliders];
      fabric.presses = fabricBus.presses;
      fabric.busy = moving || fabricBus.busy;
    };

    fabricBus.wake = () => fabric.wake();
    fabricBus.calm = () => fabric.calm();
    collect();
    fabric.start();

    let lastY = window.scrollY;
    const scroll = () => {
      const y = window.scrollY;
      const delta = Math.max(-80, Math.min(80, y - lastY));
      lastY = y;
      // A nudge per scroll event, capped, so a fling reads as the cloth giving a little and
      // never as rows pulling apart (Dan, 2026-10-13: it stretched far too much).
      if (!still) fabric.stretch.vel = Math.max(-0.0025, Math.min(0.0025, fabric.stretch.vel + delta * 0.00012));
      // A resting cursor would otherwise plough through the sheet as the page slides under it
      // and light up everything it passes. It dents again on the next move.
      if (delta && fabric.pointer) fabric.pointer = null;
      fabric.wake();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      fabric.pointer = { x: event.clientX, y: event.clientY, reach: 110, force: fabric.pointer?.force ?? 0.9 };
      fabric.wake();
    };
    const leave = () => {
      pointer = null;
      fabric.pointer = null;
      fabric.wake();
    };
    const down = () => {
      if (fabric.pointer) fabric.pointer.force = 2;
    };
    const up = (event: PointerEvent) => {
      if (!fabric.pointer) return;
      fabric.pointer.force = 0.9;
      fabric.ripple(event.clientX, event.clientY, 150, 2.4);
    };
    const focus = () => fabric.wake();
    const visibility = () => (document.hidden ? fabric.stop() : fabric.start());
    const resize = new ResizeObserver(() => fabric.resize());

    resize.observe(canvas);
    window.addEventListener("scroll", scroll, { passive: true });
    if (mouse && !still) {
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      window.addEventListener("pointerdown", down);
      window.addEventListener("pointerup", up);
    }
    document.addEventListener("focusin", focus);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      fabric.stop();
      fabricBus.wake = () => {};
      fabricBus.calm = () => {};
      resize.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // A new page is a new room.
  useEffect(() => {
    recollect.current();
  }, [pathname]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
