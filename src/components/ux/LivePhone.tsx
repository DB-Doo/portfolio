"use client";

import { useEffect, useRef, useState } from "react";

/*
A working miniature of Doto in the hero, in place of a screenshot. The home screen is a sheet
of dots with a clock, a music widget and a few app spots on it. The music widget plays, so
the sheet ripples on the beat the way Doto's visualizer does. Drag the phone and the sheet
rises into 3D terrain and turns with your hand; let go and it settles back flat. Left alone,
it shows the 3D once in a while by itself. It sleeps when off screen, and with reduced motion
it is one still frame.
*/

type P = { x: number; y: number; z: number; tone: number; size: number; kind: number };

const BPM = 104;

export function LivePhone({ className = "", label }: { className?: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0, visible = true;
    let tilt = 0, tiltV = 0, yaw = 0, yawV = 0, goal = 0, goalYaw = 0;
    let drag: { x: number; y: number; t0: number; y0: number } | null = null;
    let lastTouch = -1e9, lastShow = 0;
    const t0 = performance.now();

    // The home screen, in units of the phone's width (1 wide, 16/9 tall).
    const sheet: P[] = [];
    const widgets: P[] = [];
    const build = () => {
      sheet.length = 0;
      widgets.length = 0;
      const cols = 15, gap = 1 / cols, rows = Math.round((16 / 9) / gap);
      for (let r = 0; r <= rows; r++)
        for (let c = 0; c <= cols; c++) sheet.push({ x: c * gap, y: r * gap, z: 0, tone: 0, size: 1, kind: 0 });
      const disc = (cx: number, cy: number, rad: number, kind: number, ring = false) => {
        const step = rad > 0.1 ? 0.024 : 0.02;
        for (let y = -rad; y <= rad; y += step)
          for (let x = -rad; x <= rad; x += step) {
            const d = Math.hypot(x, y);
            if (d > rad) continue;
            if (ring && d < rad - step * 1.2) continue;
            widgets.push({ x: cx + x, y: cy + y, z: 0, tone: d / rad, size: ring ? 0.9 : 1, kind });
          }
      };
      disc(0.3, 0.78, 0.17, 1, true); // clock
      disc(0.7, 0.78, 0.17, 2, true); // music
      for (const [x, y] of [[0.2, 0.5], [0.4, 0.5], [0.6, 0.5], [0.8, 0.5], [0.12, 1.02], [0.88, 1.0]]) disc(x, y, 0.06, 3);
      disc(0.34, 1.07, 0.055, 4, true);
      disc(0.5, 1.07, 0.055, 1, true);
      disc(0.66, 1.07, 0.055, 1, true);
    };
    build();

    const size = () => {
      const box = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = box.width; H = box.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    const terrain = (x: number, y: number, t: number) =>
      Math.sin(x * 7 + t * 0.6) * 0.05 + Math.sin(y * 5.3 - t * 0.4 + x * 2) * 0.06 + Math.sin((x + y) * 11) * 0.015;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const beat = (t * BPM) / 60, ph = beat % 1, kick = Math.exp(-ph * 5) * (Math.floor(beat) % 4 === 3 ? 0.6 : 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      const u = W, cx = 0.5, cy = 0.82;
      const a = tilt * 1.0, ca = Math.cos(a), sa = Math.sin(a), cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const mx = 0.7, my = 0.78; // music widget, where the ripples start
      const project = (p: P, lift: number) => {
        const dx = p.x - cx, dy = p.y - cy;
        const dm = Math.hypot(p.x - mx, p.y - my);
        const wave = Math.sin(dm * 26 - t * 7.5) * Math.exp(-dm * 2.2) * (0.35 + kick * 0.65);
        const z = tilt * (terrain(p.x, p.y, t) + wave * 0.05 + lift) ;
        // Flat: a slight push outward from the music on the beat. Raised: real height.
        const push = (1 - tilt) * wave * 0.006 * (dm > 0.001 ? 1 : 0);
        const fx = dx + (p.x - mx) / (dm || 1) * push, fy = dy + (p.y - my) / (dm || 1) * push;
        const rx = fx * cyw - z * syw * 0.6, rz0 = fx * syw * 0.6 + z * cyw;
        const ry = fy * ca - rz0 * sa, rz = fy * sa + rz0 * ca;
        const s = 1.6 / (1.6 + rz);
        return { x: W / 2 + rx * u * s, y: H * 0.52 + ry * u * s, s, wave, z };
      };

      // Rows of the raised sheet are joined by faint lines, like Doto's 3D terrain.
      const cols = 16;
      if (tilt > 0.05) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(167,139,250,${0.28 * tilt})`;
        for (let r = 0; r * cols < sheet.length; r++) {
          ctx.beginPath();
          for (let c = 0; c < cols; c++) {
            const p = sheet[r * cols + c];
            if (!p) break;
            const q = project(p, 0);
            if (c === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          }
          ctx.stroke();
        }
      }

      for (const p of sheet) {
        const q = project(p, 0);
        const glow = Math.max(0, q.wave) * (0.4 + kick * 0.6);
        const al = 0.22 + glow * 0.55 + tilt * 0.15;
        ctx.fillStyle = glow > 0.25 ? `rgba(103,232,249,${al})` : `rgba(200,200,200,${al})`;
        const rr = (u * 0.0075 + glow * u * 0.004) * q.s;
        ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, Math.PI * 2); ctx.fill();
      }

      for (const p of widgets) {
        const q = project(p, 0.03);
        let col = "255,255,255", al = 0.9, rr = u * 0.0062;
        if (p.kind === 2) {
          // The music widget's ring breathes with the kick, pink on the beat.
          col = kick > 0.55 ? "244,114,182" : "103,232,249";
          rr *= 1 + kick * 0.5;
        } else if (p.kind === 3) {
          al = 0.55 + 0.35 * (1 - p.tone);
        } else if (p.kind === 4) {
          col = "103,232,249";
        } else {
          al = 0.5;
        }
        ctx.fillStyle = `rgba(${col},${al})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, rr * q.s, 0, Math.PI * 2); ctx.fill();
      }

      // Inside the music widget: a dotted level line that jumps on the beat.
      for (let i = 0; i < 13; i++) {
        const x = 0.61 + i * 0.015;
        const lvl = Math.abs(Math.sin(i * 1.7 + t * 3)) * kick;
        const q = project({ x, y: 0.78 - lvl * 0.06, z: 0, tone: 0, size: 1, kind: 2 }, 0.04);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.arc(q.x, q.y, u * 0.0055 * q.s, 0, Math.PI * 2); ctx.fill();
      }
      // The clock's hand of dots.
      const ang = t * 0.25 - Math.PI / 2;
      for (let i = 1; i < 8; i++) {
        const q = project({ x: 0.3 + Math.cos(ang) * i * 0.017, y: 0.78 + Math.sin(ang) * i * 0.017, z: 0, tone: 0, size: 1, kind: 1 }, 0.04);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(q.x, q.y, u * 0.006 * q.s, 0, Math.PI * 2); ctx.fill();
      }
    };

    let last = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) { last = 0; return; }
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      // Left alone, it raises itself now and then to show the 3D.
      if (!drag && now - lastTouch > 4000) {
        const since = (now - lastShow) / 1000;
        if (since > 7) lastShow = now;
        goal = since > 0.4 && since < 3.2 ? 0.72 : 0;
        goalYaw = goal ? Math.sin(since * 0.9) * 0.35 : 0;
      } else if (!drag && now - lastTouch > 1600) {
        goal = 0; goalYaw = 0;
      }
      tiltV += ((goal - tilt) * 60 - tiltV * 11) * dt;
      yawV += ((goalYaw - yaw) * 60 - yawV * 11) * dt;
      tilt = Math.max(-0.05, tilt + tiltV * dt);
      yaw += yawV * dt;
      render(now);
      raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !still) raf = requestAnimationFrame(frame); };

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY, t0: goal, y0: goalYaw };
      cv.setPointerCapture(e.pointerId);
      lastTouch = performance.now();
      setTouched(true);
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      goal = Math.max(0, Math.min(1, drag.t0 + (Math.abs(dx) * 0.6 - dy) / 140));
      goalYaw = Math.max(-0.7, Math.min(0.7, drag.y0 + dx / 160));
      lastTouch = performance.now();
    };
    const up = () => { drag = null; lastTouch = performance.now(); };

    size();
    render(performance.now());
    const ro = new ResizeObserver(() => { size(); render(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); });
    io.observe(cv);
    const vis = () => wake();
    document.addEventListener("visibilitychange", vis);
    if (!still) {
      cv.addEventListener("pointerdown", down);
      cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", up);
      cv.addEventListener("pointercancel", up);
      wake();
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className={className}>
      <div className="relative rounded-[2.4rem] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800 p-[7px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-black">
          <canvas
            ref={canvas}
            role="img"
            aria-label={label}
            className="block aspect-[9/16] w-full cursor-grab touch-pan-y active:cursor-grabbing"
          />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2.5 size-2.5 -translate-x-1/2 rounded-full bg-neutral-900 ring-1 ring-neutral-700" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
        </div>
      </div>
      <p
        aria-hidden="true"
        className={`mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 transition-opacity duration-700 ${touched ? "opacity-0" : "opacity-100"}`}
      >
        Drag me
      </p>
    </div>
  );
}
