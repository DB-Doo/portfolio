"use client";

import { LoopPair } from "./LoopPair";
import {
  type Scene,
  type Key,
  CYAN,
  FOLDER_APPS,
  RING,
  along,
  caption,
  clamp,
  dot,
  easeOut,
  finger,
  rrect,
  seam,
  sheet,
  span,
  spring,
} from "./kit";

/*
Doto before / after, episode 3: Quick launch became a choice. The same hold and drag on a
folder, twice. Before, a press always unfolded the folder, so the drag only skims its apps and
the folder never moves. After, with Quick launch off (how Doto ships), the hold picks the
folder up like any icon and the drag carries it to an empty spot.
*/

const LOOP = 6.5;
const BACKDROP = ["#3f3f46", "#52525b", "#44403c", "#3f3f46", "#4b5563"];

function toggle(ctx: CanvasRenderingContext2D, W: number, H: number, on: boolean) {
  const y = H * 0.075, h = W * 0.11, w = W * 0.7, x = (W - w) / 2;
  rrect(ctx, x, y - h / 2, w, h, h / 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.font = `500 ${Math.round(W * 0.045)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("QUICK LAUNCH", x + h * 0.5, y);
  const sw = h * 1.5, sh = h * 0.6, sx = x + w - sw - h * 0.35;
  rrect(ctx, sx, y - sh / 2, sw, sh, sh / 2);
  ctx.fillStyle = on ? CYAN : "rgba(255,255,255,0.2)";
  ctx.fill();
  dot(ctx, on ? sx + sw - sh / 2 : sx + sh / 2, y, sh * 0.4, on ? "#0a0a0a" : "#e5e5e5");
}

const scene: Scene = (ctx, W, H, t, after) => {
  sheet(ctx, W, H);
  const r = W * 0.075, d = r * 2.55;
  const cx = W / 2 - d, cy = H * 0.5;
  const rowH = d * Math.sin(Math.PI / 3);
  // The empty spot the folder is carried to, two steps right.
  const spot = { x: cx + 2 * d, y: cy };

  const keys: Key[] = [[0.2, 0.7, 1.08], [0.55, cx / W, cy / H], [1.6, cx / W, cy / H], [2.6, spot.x / W, spot.y / H], [3.1, spot.x / W, spot.y / H], [3.7, 0.7, 1.08]];
  const f = along(keys, t);
  const pressed = t > 0.6 && t < 3.1 ? 1 : 0;

  // Before: the press unfolds the folder. After: a hold lifts it.
  const open = after ? 0 : t < 3.1 ? easeOut(span(t, 0.65, 0.95)) : 1 - easeOut(span(t, 3.1, 3.35));
  const lifted = after ? (t < 3.1 ? easeOut(span(t, 1.05, 1.25)) : 1 - spring(t - 3.1, 16, 0.55)) : 0;
  const carry = after && t > 1.6;
  const fold = carry ? { x: f.x * W, y: f.y * H } : t > 3.1 && after ? spot : { x: cx, y: cy };

  for (let j = -6; j <= 6; j++) {
    const y = cy + j * rowH;
    if (y < H * 0.15 || y > H * 0.84) continue;
    const shift = Math.abs(j) % 2 ? d / 2 : 0;
    for (let i = -3; i <= 4; i++) {
      const x = cx + i * d + shift;
      if (x < r * 0.6 || x > W - r * 0.6 || (j === 0 && (i === 0 || i === 2))) continue;
      // In edit mode the other icons give a small wobble, the cue that things can move.
      const wob = after && lifted > 0 ? Math.sin(t * 22 + i * 1.7 + j) * r * 0.04 * lifted : 0;
      dot(ctx, x + wob, y, r * 0.88, BACKDROP[(i * 7 + j * 3 + 20) % BACKDROP.length], 1 - 0.8 * open);
    }
  }
  // The empty spot, faintly outlined.
  ctx.strokeStyle = `rgba(255,255,255,${after && carry ? 0.35 : 0.12})`;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, r * 0.88, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Before: its apps fan out under the finger and one lights as the drag skims it.
  if (open > 0.01) {
    FOLDER_APPS.forEach((color, k) => {
      const x = cx + Math.cos(RING[k]) * d * open, y = cy + Math.sin(RING[k]) * d * open;
      const near = pressed ? clamp((r - Math.hypot(f.x * W - x, f.y * H - y)) / (r * 0.4)) : 0;
      dot(ctx, x, y, r * Math.min(1, open) * (1 + 0.12 * near), color);
    });
  }

  // The folder.
  const s = 1 + 0.15 * lifted;
  if (lifted > 0) dot(ctx, fold.x + r * 0.15, fold.y + r * 0.25, r * s, "#000000", 0.5 * lifted);
  dot(ctx, fold.x, fold.y, r * s, "#18181b");
  ctx.strokeStyle = `rgba(103,232,249,${0.45 + 0.4 * lifted})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(fold.x, fold.y, r * s, 0, Math.PI * 2);
  ctx.stroke();
  [0, 1, 2, 3].forEach((k) => {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    dot(ctx, fold.x + Math.cos(a) * r * 0.42 * s, fold.y + Math.sin(a) * r * 0.42 * s, r * 0.22 * s, FOLDER_APPS[k], 1 - clamp(open * 2));
  });

  finger(ctx, f.x * W + W * 0.02, f.y * H + W * 0.03, W, pressed);
  toggle(ctx, W, H, !after);
  if (t > 1.7) caption(ctx, W, H, after ? "Hold moves it" : "Hold opens it", after);
  seam(ctx, W, H, t, LOOP);
};

export function QuickLaunchSettingLoop() {
  return (
    <LoopPair
      scene={scene}
      loop={LOOP}
      still={2.3}
      label="The same hold and drag on a folder. Before, with Quick launch always on: the press opens the folder, so the drag only skims its apps and the folder stays put. After, with Quick launch off: the hold picks the folder up like any icon and the drag moves it to an empty spot."
    />
  );
}
