/*
Shared drawing helpers for the before / after loops. Every loop draws onto a 9:16 canvas in
Doto's look: a near-black sheet of faint dots, round apps, cyan for the thing that matters.
*/

export type Scene = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, after: boolean) => void;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
export const easeInOut = (t: number) => {
  const k = clamp(t);
  return k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
};
/** Underdamped spring from 0 to 1. */
export const spring = (t: number, w = 15, z = 0.62) => {
  if (t <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};
/** 0 to 1 across [a, b]. */
export const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const CYAN = "#67e8f9";
export const APP_COLORS = ["#f472b6", "#67e8f9", "#a78bfa", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"];

export function sheet(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  const g = W / 14;
  for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
}

export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, alpha = 1) {
  if (r <= 0 || alpha <= 0) return;
  ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The fingertip: faint while hovering, solid with a ring while pressed. */
export function finger(ctx: CanvasRenderingContext2D, x: number, y: number, W: number, pressed: number, alpha = 1, size = 1) {
  if (alpha <= 0) return;
  const r = W * 0.075 * size;
  ctx.globalAlpha = clamp(alpha) * (0.16 + 0.24 * pressed);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, r * (1 - 0.1 * pressed), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = clamp(alpha) * (0.25 + 0.45 * pressed);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** The counter under each phone's scene: "2 taps", "1 touch". */
export function caption(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, accent: boolean) {
  ctx.font = `500 ${Math.round(W * 0.052)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // A dark pill keeps it readable over a launched app.
  const label = text.toUpperCase();
  const w = ctx.measureText(label).width + W * 0.12, h = W * 0.1;
  rrect(ctx, W / 2 - w / 2, H * 0.92 - h / 2, w, h, h / 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();
  ctx.fillStyle = accent ? CYAN : "rgba(255,255,255,0.7)";
  ctx.fillText(label, W / 2, H * 0.92);
}

/** A launched app filling the screen out of its own icon. */
export function launched(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  from: { x: number; y: number; r: number },
  color: string,
  k: number,
) {
  if (k <= 0) return;
  const o = easeOut(k);
  const w = lerp(from.r * 2, W, o), h = lerp(from.r * 2, H, o);
  const x = lerp(from.x - from.r, 0, o), y = lerp(from.y - from.r, 0, o);
  ctx.save();
  rrect(ctx, x, y, w, h, lerp(from.r, W * 0.06, o));
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18 + 0.82 * clamp(k * 3);
  ctx.fill();
  ctx.clip();
  ctx.globalAlpha = clamp((k - 0.5) * 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let i = 0; i < 5; i++) {
    rrect(ctx, W * 0.08, H * (0.12 + i * 0.12), W * (i === 0 ? 0.5 : 0.84), H * (i === 0 ? 0.04 : 0.08), 10);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export type Key = [t: number, x: number, y: number];

/** Piecewise path through keyframes, eased per segment. Coordinates are fractions of W and H. */
export function along(keys: Key[], t: number) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, y1] = keys[i];
    const [t0, x0, y0] = keys[i - 1];
    if (t <= t1) {
      const k = easeInOut((t - t0) / (t1 - t0 || 1));
      return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last[1], y: last[2] };
}

/** Fade through black at the loop seam so a loop restarts cleanly. */
export function seam(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, loop: number) {
  const fade = Math.max(1 - span(t, 0, 0.25), span(t, loop - 0.7, loop - 0.1));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/** The folder's apps, and the angles of the first ring they open onto. */
export const FOLDER_APPS = ["#f472b6", "#a78bfa", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"];
export const RING = [0, -60, -120, 180, 120, 60].map((a) => (a * Math.PI) / 180);
