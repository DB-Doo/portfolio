"use client";

import { LoopPair } from "./LoopPair";
import {
  type Scene,
  CYAN,
  caption,
  clamp,
  dot,
  easeOut,
  finger,
  launched,
  along,
  type Key,
  FOLDER_APPS,
  RING,
  seam,
  sheet,
  span,
  spring,
} from "./kit";

/*
Doto before / after, episode 1: launching an app from a folder. Both phones start on the same
beat. Before: tap the folder, it opens, the finger hunts around, tap the app. After (Quick
launch): press the folder, it unfolds under the finger, slide onto the app, which grows to
show it is picked, and lift to launch. The after lands about a second sooner and rests on the
open app, so the difference is the time you can see.
*/

const LOOP = 7;
const MEMBERS = FOLDER_APPS;
const ANGLES = RING;
const TARGET = 1;
const BACKDROP = ["#3f3f46", "#52525b", "#44403c", "#3f3f46", "#4b5563"];

const scene: Scene = (ctx, W, H, t, after) => {
  sheet(ctx, W, H);
  const r = W * 0.075, d = r * 2.55;
  const cx = W / 2, cy = H * 0.48;
  const member = (k: number) => ({ x: cx + Math.cos(ANGLES[k]) * d, y: cy + Math.sin(ANGLES[k]) * d });
  const fx = (p: { x: number; y: number }) => [p.x / W, p.y / H] as const;
  const F = fx({ x: cx, y: cy });
  const M = (k: number) => fx(member(k));
  const off: [number, number] = [0.78, 1.08];

  // How open the folder is, how far the picked app has grown, how far it has launched.
  let open: number, grow = 0, launch: number, pressed: number, touches: string;
  let path: Key[];
  if (!after) {
    open = easeOut(span(t, 0.72, 1.05));
    launch = span(t, 2.58, 3.0);
    pressed = (t > 0.58 && t < 0.7) || (t > 2.42 && t < 2.56) ? 1 : 0;
    touches = t < 0.58 ? "" : t < 2.42 ? "1 tap" : "2 taps";
    path = [
      [0.2, ...off], [0.55, ...F], [0.75, ...F],
      [1.3, ...M(4)], [1.75, ...M(3)], [2.05, M(2)[0] + 0.04, M(2)[1] + 0.02],
      [2.38, ...M(TARGET)], [2.7, ...M(TARGET)], [3.3, ...off],
    ];
  } else {
    open = spring(t - 0.62, 14, 0.6);
    grow = t < 1.55 ? easeOut(span(t, 1.22, 1.36)) : 1;
    launch = span(t, 1.55, 1.95);
    pressed = t > 0.58 && t < 1.55 ? 1 : 0;
    touches = t < 0.58 ? "" : "1 touch";
    path = [[0.2, ...off], [0.55, ...F], [0.95, ...F], [1.3, ...M(TARGET)], [1.55, ...M(TARGET)], [2.1, ...off]];
  }
  const o = clamp(open, 0, 1.2);

  // The canvas around the folder: a honeycomb of other apps, dimmed while the folder is open.
  const rowH = d * Math.sin(Math.PI / 3);
  for (let j = -5; j <= 5; j++) {
    const y = cy + j * rowH;
    if (y < r || y > H * 0.84) continue;
    const shift = Math.abs(j) % 2 ? d / 2 : 0;
    for (let i = -3; i <= 3; i++) {
      const x = cx + i * d + shift;
      if (x < r * 0.6 || x > W - r * 0.6 || (i === 0 && j === 0)) continue;
      dot(ctx, x, y, r * 0.88, BACKDROP[(i * 7 + j * 3 + 20) % BACKDROP.length], 1 - 0.8 * clamp(o));
    }
  }

  // The folder itself: a glass ring holding four tiny apps.
  dot(ctx, cx, cy, r, "rgba(255,255,255,0.08)");
  ctx.strokeStyle = `rgba(103,232,249,${0.35 + 0.3 * clamp(o)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  [0, 1, 2, 3].forEach((k) => {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    dot(ctx, cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, r * 0.22, MEMBERS[k], 1 - clamp(o));
  });

  // Its apps, unfolding onto the first ring.
  if (o > 0.01) {
    MEMBERS.forEach((color, k) => {
      const p = member(k);
      const x = cx + (p.x - cx) * o, y = cy + (p.y - cy) * o;
      const picked = k === TARGET;
      const s = 1 + (picked ? 0.12 * grow : 0);
      dot(ctx, x, y, r * Math.min(1, o) * s, color);
      if (picked && grow > 0) {
        ctx.globalAlpha = grow;
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r * s + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }

  const target = member(TARGET);
  launched(ctx, W, H, { x: target.x, y: target.y, r: r * 1.12 }, MEMBERS[TARGET], launch);

  const p = along(path, t);
  finger(ctx, p.x * W + W * 0.02, p.y * H + W * 0.03, W, pressed, launch > 0.3 ? 1 - launch : 1);

  if (touches) caption(ctx, W, H, touches, after);

  seam(ctx, W, H, t, LOOP);
};

export function FolderLaunchLoop() {
  return (
    <LoopPair
      scene={scene}
      loop={LOOP}
      still={1.45}
      label="Launching an app from a folder, twice. Before: tap the folder, look for the app, tap it, two taps. After: press the folder, slide onto the app, which grows under the finger, and lift to launch, one touch."
    />
  );
}
