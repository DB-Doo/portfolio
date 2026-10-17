"use client";

import { useEffect, useRef } from "react";
import type { HeadlinePart } from "./Reveal";

/*
The hero headline drawn in Doto's dots. The real words are laid out as normal HTML, so they
wrap, scale, select and read aloud like any heading; once the script runs, each word is
sampled into dots that gather from the sheet onto the letters, and the HTML text turns
transparent underneath them. The pointer (or a finger) brushes dots aside and they spring
back. Gathering is short and starts close, so the words read within a second: motion never
holds text back. Without JavaScript the plain text shows; with reduced motion the dots sit
still in place.
*/

type Dot = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; c: number; d: number };

const COLORS = ["255,255,255", "103,232,249"];

export function DotHeadline({ parts, className }: { parts: HeadlinePart[]; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const words = parts.flatMap((part) =>
    part.text
      .split(" ")
      .filter(Boolean)
      .map((word, j) => ({ word, serif: part.serif, accent: part.accent, first: j === 0 })),
  );

  useEffect(() => {
    const host = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!host || !cv || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const PAD = 80;
    let dots: Dot[] = [];
    let w = 0, h = 0, dpr = 1, r = 1.2, raf = 0, born = 0, running = false;
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };

    const sample = () => {
      const box = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = box.width + PAD * 2;
      h = box.height + PAD * 2;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;

      const off = document.createElement("canvas");
      off.width = Math.ceil(w);
      off.height = Math.ceil(h);
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      const spans = host.querySelectorAll<HTMLElement>("[data-word]");
      let size = 40;
      spans.forEach((span) => {
        const cs = getComputedStyle(span);
        size = parseFloat(cs.fontSize);
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        o.font = font;
        (o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
        o.fillStyle = span.dataset.accent ? "#f00" : "#fff";
        const m = o.measureText(span.textContent || "");
        const rect = span.getBoundingClientRect();
        const lh = parseFloat(cs.lineHeight) || size * 1.1;
        // CSS half-leading: the glyphs' content box sits centred in the line box.
        const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
        const base = rect.top - box.top + PAD + lh / 2 + (asc - desc) / 2;
        o.textBaseline = "alphabetic";
        o.fillText(span.textContent || "", rect.left - box.left + PAD, base);
      });

      const step = Math.max(2.6, size / 22);
      r = step * 0.4;
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const old = dots;
      dots = [];
      // Thin italic strokes fall between grid points, so a cell counts as ink when any pixel
      // near its centre is inked, not only the centre one.
      const ink = (x: number, y: number) => {
        let best = 0, acc = 0;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            const px = Math.round(x + ox * step * 0.3), py = Math.round(y + oy * step * 0.3);
            const i = (py * off.width + px) * 4;
            if (img[i + 3] > best) { best = img[i + 3]; acc = img[i + 1] < 128 ? 1 : 0; }
          }
        return best > 120 ? acc : -1;
      };
      for (let y = step / 2; y < off.height; y += step) {
        for (let x = step / 2; x < off.width; x += step) {
          const accent = ink(x, y);
          if (accent < 0) continue;
          const prev = old[dots.length];
          // First gather starts a short way off, so the words are readable almost at once.
          const a = Math.random() * Math.PI * 2, s = 18 + Math.random() * 46;
          dots.push({
            x: prev ? prev.x : still ? x : x + Math.cos(a) * s,
            y: prev ? prev.y : still ? y : y + Math.sin(a) * s,
            vx: 0, vy: 0, tx: x, ty: y, c: accent,
            d: still ? 0 : (x / off.width) * 0.35 + Math.random() * 0.15,
          });
        }
      }
      host.dataset.dots = "on";
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = `rgba(${COLORS[c]},0.95)`;
        ctx.beginPath();
        for (const d of dots) {
          if (d.c !== c) continue;
          const off = Math.hypot(d.x - d.tx, d.y - d.ty);
          const rr = r * (1 + Math.min(0.6, off / 40));
          ctx.moveTo(d.x + rr, d.y);
          ctx.arc(d.x, d.y, rr, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    let last = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      const age = (now - born) / 1000;
      const box = cv.getBoundingClientRect();
      const px = pointer.x - box.left, py = pointer.y - box.top;
      const reach = Math.max(56, r * 40);
      let moving = 0;
      for (const d of dots) {
        if (age < d.d) continue;
        let ax = (d.tx - d.x) * 140 - d.vx * 15;
        let ay = (d.ty - d.y) * 140 - d.vy * 15;
        const dx = d.x - px, dy = d.y - py, q = dx * dx + dy * dy;
        if (q < reach * reach) {
          const dist = Math.sqrt(q) || 1, f = (1 - dist / reach) ** 2;
          ax += (dx / dist) * f * 5200 + pointer.vx * f * 6;
          ay += (dy / dist) * f * 5200 + pointer.vy * f * 6;
        }
        d.vx += ax * dt; d.vy += ay * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (Math.abs(d.vx) + Math.abs(d.vy) > 2 || Math.abs(d.x - d.tx) + Math.abs(d.y - d.ty) > 0.3) moving++;
      }
      pointer.vx *= 0.85; pointer.vy *= 0.85;
      draw();
      // Sleep once everything has settled and the pointer is away; a move wakes it.
      if (moving || age < 1.2) raf = requestAnimationFrame(frame);
      else { running = false; last = 0; }
    };
    const wake = () => {
      if (still || running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => {
      const now = performance.now(), dt = Math.max(8, now - pointer.t);
      if (pointer.t) {
        pointer.vx = ((e.clientX - pointer.x) / dt) * 16;
        pointer.vy = ((e.clientY - pointer.y) / dt) * 16;
      }
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = now;
      const box = cv.getBoundingClientRect();
      if (e.clientX > box.left && e.clientX < box.right && e.clientY > box.top && e.clientY < box.bottom) wake();
    };
    const leave = () => { pointer.x = pointer.y = -1e4; pointer.t = 0; wake(); };

    const start = () => {
      sample();
      born = performance.now();
      if (still) draw();
      else wake();
    };
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) start(); });
    const ro = new ResizeObserver(() => {
      if (!dots.length) return;
      sample();
      if (still) draw(); else wake();
    });
    ro.observe(host);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", leave);
      delete host.dataset.dots;
    };
  }, []);

  return (
    <div ref={wrap} className="dot-headline relative">
      <h1 className={className} aria-label={parts.map((part) => part.text).join(" ")}>
        {words.map(({ word, serif, accent, first }, i) => (
          <span key={i} aria-hidden="true">
            {first && i > 0 && <br className="hidden sm:block" />}
            <span
              data-word
              data-accent={accent ? "1" : undefined}
              className={`inline-block ${serif ? "font-serif font-normal italic tracking-normal" : ""} ${
                accent ? "text-[var(--accent,#67e8f9)]" : ""
              }`}
            >
              {word}
            </span>
            {i < words.length - 1 && " "}
          </span>
        ))}
      </h1>
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="pointer-events-none absolute left-[-80px] top-[-80px]"
      />
    </div>
  );
}
