"use client";

import { LoopPair } from "./LoopPair";
import { type Scene, APP_COLORS, CYAN, caption, clamp, dot, easeOut, finger, seam, span } from "./kit";

/*
Doto before / after, episode 5: an endless canvas you can't get lost in. The same hard fling
to the left, twice. Before, a truly infinite canvas: the layout sails off screen and the
dots keep scrolling, with nothing to lead you back. After, Doto's edge: the canvas ends a
little past the outermost app, so the fling stretches into a rubber band and settles with
the edge of the layout still on screen.
*/

const LOOP = 6.5;
const RELEASE = 1.0;

/** The layout in world space: a honeycomb of apps around two round widgets. */
function layout(W: number, H: number) {
  const r = W * 0.065, d = r * 2.55, rowH = d * Math.sin(Math.PI / 3);
  const items: { x: number; y: number; r: number; c: string }[] = [
    { x: W * 0.32, y: H * 0.36, r: r * 2.3, c: "#67e8f9" },
    { x: W * 0.68, y: H * 0.62, r: r * 2.3, c: "#a78bfa" },
  ];
  for (let j = -5; j <= 5; j++) {
    const y = H * 0.48 + j * rowH;
    if (y < H * 0.14 || y > H * 0.82) continue;
    for (let i = -4; i <= 4; i++) {
      const x = W / 2 + i * d + (Math.abs(j) % 2 ? d / 2 : 0);
      if (x < W * 0.08 || x > W * 0.92) continue;
      if (items.some((w) => Math.hypot(w.x - x, w.y - y) < w.r + r * 1.2)) continue;
      if ((i * 5 + j * 3 + 40) % 7 === 0) continue;
      items.push({ x, y, r, c: APP_COLORS[(i * 3 + j * 5 + 70) % APP_COLORS.length] });
    }
  }
  return items;
}

const scene: Scene = (ctx, W, H, t, after) => {
  const items = layout(W, H);
  const right = Math.max(...items.map((it) => it.x + it.r));

  // Camera offset: the finger drags the layout half a screen left, then lets go fast.
  const drag = -0.5 * W;
  let ox: number, stretch = 0;
  if (t < 0.6) ox = 0;
  else if (t < RELEASE) ox = drag * easeOut(span(t, 0.6, RELEASE));
  else if (!after) {
    // Momentum with nothing to stop it.
    ox = drag - 1.6 * W * (1 - Math.exp(-(t - RELEASE) / 0.8));
  } else {
    // The edge: the outermost app may go no further left than a quarter of the screen.
    const limit = W * 0.25 - right;
    const s = t - RELEASE;
    const u = s - 0.18;
    stretch = u > 0 ? (u / 0.14) * Math.exp(1 - u / 0.14) : 0;
    ox = s < 0.18 ? drag + (limit - drag) * easeOut(s / 0.18) : limit - W * 0.14 * stretch;
  }

  // The sheet of dots scrolls with the camera, so the motion reads even with nothing on screen.
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.11)";
  const g = W / 14;
  const sx = ((ox % g) + g) % g;
  for (let y = g / 2; y < H; y += g) for (let x = sx - g; x < W + g; x += g) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);

  for (const it of items) dot(ctx, it.x + ox, it.y, it.r, it.c, 0.9);

  // The rubber band: the edge glows as it stretches.
  if (stretch > 0.02) {
    const ex = right + ox + W * 0.04;
    const grad = ctx.createLinearGradient(ex, 0, ex + W * 0.25, 0);
    grad.addColorStop(0, `rgba(103,232,249,${0.35 * stretch})`);
    grad.addColorStop(1, "rgba(103,232,249,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(ex, H * 0.1, W * 0.25, H * 0.75);
    ctx.strokeStyle = CYAN;
    ctx.globalAlpha = clamp(stretch);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, H * 0.14);
    ctx.quadraticCurveTo(ex + W * 0.08 * stretch, H * 0.48, ex, H * 0.82);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // The finger: down on the right, dragged left, released.
  const fx = t < 0.6 ? 0.75 : t < RELEASE ? 0.75 - 0.5 * easeOut(span(t, 0.6, RELEASE)) : 0.25 - 0.2 * span(t, RELEASE, RELEASE + 0.3);
  const fy = 0.5 + (t < 0.6 ? 0.55 * (1 - span(t, 0.2, 0.6)) : 0);
  finger(ctx, fx * W, fy * H, W, t > 0.6 && t < RELEASE ? 1 : 0, t < RELEASE ? 1 : 1 - span(t, RELEASE, RELEASE + 0.3));

  if (t > 1.9) caption(ctx, W, H, after ? "Always a way back" : "Where did it go?", after);
  seam(ctx, W, H, t, LOOP);
};

export function CanvasEdgeLoop() {
  return (
    <LoopPair
      scene={scene}
      loop={LOOP}
      still={1.35}
      label="The same hard fling across a home screen, twice. Before, on a truly infinite canvas: the apps sail off screen and only empty dots remain. After, in Doto: the canvas stretches like a rubber band at the edge of the layout and settles with the apps still on screen."
    />
  );
}
