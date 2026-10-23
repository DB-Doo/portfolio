"use client";

import { LoopPair } from "./LoopPair";
import { type Scene, type Key, CYAN, FOLDER_APPS, RING, along, caption, clamp, dot, easeOut, launched, seam, sheet, span } from "./kit";

/*
Doto before / after, episode 2: the app grows under your finger. A close-up of an open folder.
The same press slides across three apps and lifts on the fourth. Before: nothing answers, and
the fingertip hides the very icon it is on, so the lift is a guess. After: whichever app is
under the finger grows and its outline lights, so the pick shows around the fingertip before
you let go.
*/

const LOOP = 6;
const TARGET = 1;
const PATH = [4, 3, 2, TARGET];

const scene: Scene = (ctx, W, H, t, after) => {
  sheet(ctx, W, H);
  const r = W * 0.11, d = r * 2.45;
  const cx = W / 2, cy = H * 0.46;
  const at = (k: number) => ({ x: cx + Math.cos(RING[k]) * d, y: cy + Math.sin(RING[k]) * d });

  // The finger rests on each app in turn, then lifts on the target.
  const keys: Key[] = [[0.2, 0.62, 1.08]];
  PATH.forEach((k, i) => {
    const p = at(k);
    keys.push([0.6 + i * 0.7, p.x / W, p.y / H], [0.95 + i * 0.7, p.x / W, p.y / H]);
  });
  const lift = 3.5;
  const f = along(keys, t);
  const fx = f.x * W, fy = f.y * H;
  const down = t > 0.55 && t < lift;
  const launch = span(t, lift, lift + 0.4);

  // The folder, open.
  ctx.strokeStyle = "rgba(103,232,249,0.6)";
  ctx.lineWidth = 1.5;
  dot(ctx, cx, cy, r * 0.8, "rgba(255,255,255,0.08)");
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.stroke();

  FOLDER_APPS.forEach((color, k) => {
    const p = at(k);
    // Grows as the fingertip arrives over it, shrinks as it leaves.
    const near = clamp((r * 0.9 - Math.hypot(fx - p.x, fy - p.y)) / (r * 0.4));
    const grow = after && down ? easeOut(near) : 0;
    const s = 1 + 0.12 * grow;
    dot(ctx, p.x, p.y, r * s, color);
    if (grow > 0) {
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * s + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const target = at(TARGET);
  launched(ctx, W, H, { x: target.x, y: target.y, r: r * 1.12 }, FOLDER_APPS[TARGET], launch);

  // A real fingertip covers what it touches, so this one is nearly opaque.
  if (launch < 0.3) {
    ctx.globalAlpha = down ? 0.82 : 0.4;
    ctx.fillStyle = "#d4d4d8";
    ctx.beginPath();
    ctx.arc(fx + W * 0.015, fy + W * 0.02, r * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (t > 0.6 && launch === 0) caption(ctx, W, H, after ? "You see the pick" : "Which app?", after);
  seam(ctx, W, H, t, LOOP);
};

export function PickFeedbackLoop() {
  return (
    <LoopPair
      scene={scene}
      loop={LOOP}
      still={2.2}
      label="A finger slides across the apps in an open folder. Before: the fingertip covers each icon and nothing changes, so you cannot tell which app you are on. After: the app under the finger grows and its outline lights, so you can see the pick around your fingertip."
    />
  );
}
