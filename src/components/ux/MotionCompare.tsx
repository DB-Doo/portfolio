"use client";

import { useEffect, useRef, useState } from "react";

/*
The same tap, timed two ways, on one screen. A finger taps an app and its panel opens, then
closes. The left side uses the defaults most apps ship with: a fixed quarter-second linear
scale, every row arriving at once. The right side is how I tune it: the icon gives under the
finger, the panel opens on a spring from the icon's own shape, rows arrive one beat apart,
and closing folds back into the icon, which settles. Drag the divider (a real range input,
so arrow keys work) to wipe between them. Reduced motion shows one still frame, open.
*/

const LOOP = 4.4, TAP = 0.7, CLOSE = 3.0;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
/** Underdamped spring from 0 to 1. */
const spring = (t: number, w = 15, z = 0.62) => {
  if (t <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function scene(ctx: CanvasRenderingContext2D, W: number, H: number, time: number, tuned: boolean) {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, W, H);
  // The sheet of dots behind everything.
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  const g = W / 14;
  for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);

  const icon = W * 0.17, row = H * 0.62;
  const xs = [W * 0.22, W * 0.5, W * 0.78];
  const colors = ["#f472b6", "#67e8f9", "#a78bfa"];
  const card = { x: W * 0.08, y: H * 0.16, w: W * 0.84, h: H * 0.6 };

  // Open amount, and the icon's own squash.
  let open = 0, press = 0;
  const t = time;
  if (!tuned) {
    if (t > TAP) open = clamp((t - TAP) / 0.25);
    if (t > CLOSE) open = 1 - clamp((t - CLOSE) / 0.2);
  } else {
    press = t > TAP - 0.12 && t < TAP + 0.1 ? Math.sin(((t - (TAP - 0.12)) / 0.22) * Math.PI) : 0;
    if (t > TAP + 0.04) open = spring(t - TAP - 0.04);
    if (t > CLOSE) open = 1 - spring(t - CLOSE, 17, 0.78);
  }
  const settle = tuned && t > CLOSE + 0.25 ? Math.sin((t - CLOSE - 0.25) * 18) * Math.exp(-(t - CLOSE - 0.25) * 7) : 0;

  xs.forEach((x, i) => {
    let s = 1;
    if (i === 1 && tuned) s = 1 - press * 0.12 + settle * 0.08;
    const hidden = i === 1 && open > 0.02;
    ctx.globalAlpha = hidden ? (tuned ? clamp(1 - open * 3) : 0) : 1;
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(x, row, (icon / 2) * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (open > 0.001) {
    // Tuned dims the sheet behind; default does not.
    if (tuned) {
      ctx.fillStyle = `rgba(0,0,0,${0.45 * clamp(open)})`;
      ctx.fillRect(0, 0, W, H);
    }
    const o = tuned ? open : clamp(open);
    const from = { x: xs[1] - icon / 2, y: row - icon / 2, w: icon, h: icon };
    // Default scales from the centre of the screen; tuned grows out of the icon itself.
    const x = tuned ? lerp(from.x, card.x, o) : card.x + (card.w * (1 - o)) / 2;
    const y = tuned ? lerp(from.y, card.y, o) : card.y + (card.h * (1 - o)) / 2;
    const w = tuned ? lerp(from.w, card.w, o) : card.w * o;
    const h = tuned ? lerp(from.h, card.h, o) : card.h * o;
    const r = tuned ? lerp(icon / 2, W * 0.07, clamp(o)) : W * 0.07 * o;
    ctx.save();
    rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = tuned ? `rgb(${Math.round(lerp(103, 22, clamp(o)))},${Math.round(lerp(232, 26, clamp(o)))},${Math.round(lerp(249, 30, clamp(o)))})` : "#161a1e";
    ctx.fill();
    ctx.strokeStyle = "rgba(103,232,249,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.clip();

    // Contents: a title and four rows.
    const since = t - TAP;
    for (let i = 0; i < 5; i++) {
      let a = 1, dy = 0;
      if (tuned) {
        const k = easeOut((since - 0.18 - i * 0.06) / 0.35);
        a = k * clamp(1 - (t - CLOSE) / 0.12);
        dy = (1 - k) * H * 0.03;
      } else {
        a = 1;
      }
      ctx.globalAlpha = clamp(a);
      // Default content is part of the scaled card; tuned content sits at its final place.
      const cx = tuned ? card.x : x, cw = tuned ? card.w : w, sy = tuned ? 1 : o;
      const cy = (tuned ? card.y : y) + (H * 0.06 + i * H * 0.1) * sy + dy;
      if (i === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        rrect(ctx, cx + cw * 0.08, cy, cw * 0.45, H * 0.03 * sy, 4);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        rrect(ctx, cx + cw * 0.08, cy, cw * 0.84, H * 0.07 * sy, 10 * sy);
        ctx.fill();
        ctx.fillStyle = colors[(i + 1) % 3];
        ctx.beginPath();
        ctx.arc(cx + cw * 0.17, cy + H * 0.035 * sy, H * 0.018 * sy, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // The finger.
  const f = clamp(1 - Math.abs(t - TAP) / 0.35);
  if (f > 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 * f})`;
    ctx.beginPath();
    ctx.arc(xs[1] + W * 0.03, row + H * 0.03, W * 0.06 * (1.2 - f * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
  if (t > TAP && t < TAP + 0.5 && tuned) {
    const k = (t - TAP) / 0.5;
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(xs[1], row, (icon / 2) * (1 + k * 0.8), 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function MotionCompare() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [split, setSplit] = useState(50);
  const splitRef = useRef(50);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0, visible = false;
    const t0 = performance.now();
    const size = () => {
      const box = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = box.width; H = box.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    const draw = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cut = (W * splitRef.current) / 100;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, cut, H); ctx.clip();
      scene(ctx, W, H, time, false);
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(cut, 0, W - cut, H); ctx.clip();
      scene(ctx, W, H, time, true);
      ctx.restore();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(((now - t0) / 1000) % LOOP);
      raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !still) raf = requestAnimationFrame(frame); };
    size();
    draw(still ? 2 : 0);
    const ro = new ResizeObserver(() => { size(); draw(still ? 2 : 0); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
    io.observe(cv);
    const vis = () => wake();
    document.addEventListener("visibilitychange", vis);
    (cv as HTMLCanvasElement & { redraw?: () => void }).redraw = () => draw(still ? 2 : ((performance.now() - t0) / 1000) % LOOP);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  useEffect(() => {
    splitRef.current = split;
    (canvas.current as (HTMLCanvasElement & { redraw?: () => void }) | null)?.redraw?.();
  }, [split]);

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      <div className="relative rounded-[2.4rem] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800 p-[7px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-black">
          <canvas
            ref={canvas}
            role="img"
            aria-label="An app opening twice on one screen: on the left with default timing, on the right with tuned springs and staggered rows."
            className="block aspect-[9/16] w-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
            style={{ left: `${split}%` }}
          >
            <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-medium text-neutral-950 shadow-lg">
              ⇆
            </span>
          </div>
          <span className="pointer-events-none absolute left-4 top-10 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-300 backdrop-blur">
            Default
          </span>
          <span className="pointer-events-none absolute right-4 top-10 rounded-full bg-cyan-300 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-950">
            Tuned
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            aria-label="Drag to compare default and tuned motion"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        Drag to compare
      </p>
    </div>
  );
}
