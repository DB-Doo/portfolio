"use strict";
/*
 * The dot.o home canvas the critter mocks live on: the fabric of dots, the widgets standing on it,
 * balls with gravity, the spider's silk, a music widget with a beat, and touch.
 * Coordinates are a 300 x 620 phone; z is height above the cloth.
 */

const INK = [243, 237, 247], ACC = [255, 79, 163], CYAN = [65, 227, 255], GREEN = [123, 227, 164];
const AMBER = [255, 196, 107], RED = [255, 92, 92];
const GROUND = "#0b0a12", SURFACE = "#17141f";
let W = 300, H = 620; const TAU = Math.PI * 2;
let FAB_BASE = 0.4;
let FONT_DOTO = "Doto, monospace", FONT_MONO = "'JetBrains Mono', monospace";
function setFonts(dots, mono) { if (dots) FONT_DOTO = `${dots}, monospace`; if (mono) FONT_MONO = `${mono}, monospace`; }
function setStage(w, h, base) { W = w; H = h; FAB_BASE = base ?? 0.4; }
const VIEW = { mesh: false, paused: false };

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const wrap = (r) => { while (r > Math.PI) r -= TAU; while (r < -Math.PI) r += TAU; return r; };
/** Eases v toward target at rate per second, the same whatever the frame rate. */
const ease = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The light comes from the top left, toward you; raised things lean up the screen as they rise.
const LIGHT = (() => { const v = [-0.5, -0.72, 0.62], l = Math.hypot(...v); return v.map((q) => q / l); })();
const SHADOW_X = -LIGHT[0] / LIGHT[2], SHADOW_Y = -LIGHT[1] / LIGHT[2];
const PERSP = 0.0032, TILT = 0.36;
const VIEWDIR = (() => { const l = Math.hypot(TILT, 1); return [0, TILT / l, 1 / l]; })();
function project(x, y, z, out) {
  out = out || [0, 0];
  out[0] = x + (x - W / 2) * z * PERSP;
  out[1] = y + (y - H * 0.45) * z * PERSP - z * TILT;
  return out;
}

// ---------- widgets ----------
/** A widget's face stands this far above the cloth, so a spider on it is on a little plateau. */
const WIDGET_TOP = 7;

function sdf(o, px, py) {
  const r = Math.min(o.r, o.hw, o.hh);
  const qx = Math.abs(px - o.x) - (o.hw - r), qy = Math.abs(py - o.y) - (o.hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function normal(o, px, py) {
  const e = 0.5;
  const nx = sdf(o, px + e, py) - sdf(o, px - e, py), ny = sdf(o, px, py + e) - sdf(o, px, py - e);
  const l = Math.hypot(nx, ny);
  if (l < 1e-6) { const dx = px - o.x, dy = py - o.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  return [nx / l, ny / l];
}
/** Height of whatever is under a point: the cloth, or a widget's face, with a small rounded lip. */
function groundAt(items, x, y) {
  let h = 0;
  for (const o of items) {
    const d = sdf(o, x, y);
    if (d < 1.5) h = Math.max(h, WIDGET_TOP * smooth((1.5 - d) / 3));
  }
  return h;
}
function widgetAt(items, x, y) { for (const o of items) if (sdf(o, x, y) < 0) return o; return null; }

function homeScreen(homeKind) {
  const items = [];
  const icon = (x, y, glyph) => items.push({ x, y, hw: 23, hh: 23, r: 12, kind: "icon", glyph });
  items.push({ x: 96, y: 128, hw: 56, hh: 56, r: 56, kind: "clock", name: "the clock" });
  items.push({ x: 224, y: 140, hw: 38, hh: 38, r: 38, kind: homeKind, home: true, name: homeKind === "nest" ? "its nest" : "its dock" });
  icon(56, 318, "circle"); icon(250, 300, "square"); icon(150, 400, "tri");
  items.push({ x: 66, y: 466, hw: 26, hh: 26, r: 13, kind: "folder", name: "the folder" });
  items.push({ x: 222, y: 466, hw: 54, hh: 26, r: 16, kind: "music", name: "the music widget" });
  [48, 116, 184, 252].forEach((x, i) => icon(x, 550, ["circle", "square", "tri", "plus"][i]));
  for (const o of items) if (!o.name) o.name = o.y > 520 ? "the dock row" : "an icon";
  return items;
}

/** Where on the screen a point is, in words. */
function placeName(x, y) {
  const v = y < 230 ? "top" : y < 430 ? "middle" : "bottom";
  const h = x < 100 ? " left" : x > 200 ? " right" : "";
  if (v === "middle" && !h) return "the middle";
  return `the ${v}${h}`;
}

// ---------- the fabric ----------
class Fabric {
  constructor(items, spacing) {
    this.s = spacing;
    this.cols = Math.floor(W / spacing) + 1; this.rows = Math.floor(H / spacing) + 1;
    const n = (this.n = this.cols * this.rows);
    this.ox = (W - (this.cols - 1) * spacing) / 2; this.oy = (H - (this.rows - 1) * spacing) / 2;
    const f = () => new Float32Array(n);
    this.bx = f(); this.by = f(); this.px = f(); this.py = f(); this.vx = f(); this.vy = f();
    this.tx = f(); this.ty = f(); this.gather = f(); this.tint = new Uint8Array(n); this.hidden = new Uint8Array(n);
    this.vxs = f(); this.vys = f(); this.al = f();
    const gap = spacing * 0.62, shoulder = spacing * 1.6;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const i = r * this.cols + c;
      let x = this.ox + c * spacing, y = this.oy + r * spacing;
      // Widgets part the cloth: dots under one are pushed out to its rim and gather there.
      for (const o of items) {
        const d = sdf(o, x, y);
        if (d < gap + shoulder) {
          if (d < -spacing * 1.4) { this.hidden[i] = 1; break; }
          const [nx, ny] = normal(o, x, y);
          const target = d < gap ? gap : d + (gap - d) * Math.pow((gap + shoulder - d) / shoulder, 2) * 0.8;
          x += nx * (target - d); y += ny * (target - d);
        }
      }
      this.bx[i] = this.px[i] = this.tx[i] = x; this.by[i] = this.py[i] = this.ty[i] = y;
    }
  }
  beginFrame() { this.tx.set(this.bx); this.ty.set(this.by); }
  range(cx, cy, reach) {
    const s = this.s;
    return [
      clamp(Math.floor((cx - reach - this.ox) / s), 0, this.cols - 1), clamp(Math.ceil((cx + reach - this.ox) / s), 0, this.cols - 1),
      clamp(Math.floor((cy - reach - this.oy) / s), 0, this.rows - 1), clamp(Math.ceil((cy + reach - this.oy) / s), 0, this.rows - 1),
    ];
  }
  /** A press, the way the mesh engine resolves a ball or a fingertip: dots inside go to the rim, then a short shoulder. */
  press(cx, cy, r, tint = 0) {
    if (!(r > 0.3)) return;
    const sh = this.s * 0.9, reach = r + sh;
    const [c0, c1, r0, r1] = this.range(cx, cy, reach);
    for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
      const i = row * this.cols + col;
      const dx = this.tx[i] - cx, dy = this.ty[i] - cy, d = Math.hypot(dx, dy);
      if (d < 1e-3 || d >= reach) continue;
      const target = d < r ? r : d + (r - d) * Math.pow((reach - d) / sh, 2) * 0.85;
      const k = target / d;
      this.tx[i] = cx + dx * k; this.ty[i] = cy + dy * k;
      const g = clamp((target - d) / (this.s * 0.6), 0, 1);
      if (g > this.gather[i]) { this.gather[i] = g; this.tint[i] = tint; }
    }
  }
  step(dt) {
    const n = this.n, k = 210, c = 17;
    for (let i = 0; i < n; i++) {
      this.vx[i] += ((this.tx[i] - this.px[i]) * k - this.vx[i] * c) * dt;
      this.vy[i] += ((this.ty[i] - this.py[i]) * k - this.vy[i] * c) * dt;
      this.px[i] += this.vx[i] * dt; this.py[i] += this.vy[i] * dt;
      this.gather[i] *= Math.exp(-dt * 3.2);
    }
  }
  draw(ctx, dot) {
    const n = this.n, s = this.s, al = this.al;
    for (let i = 0; i < n; i++) {
      if (this.hidden[i]) { al[i] = 0; continue; }
      const disp = Math.hypot(this.px[i] - this.bx[i], this.py[i] - this.by[i]) / s;
      al[i] = clamp(FAB_BASE + clamp(disp, 0, 1) * 0.35 + this.gather[i] * 0.25, 0, 1);
    }
    if (VIEW.mesh) {
      ctx.lineWidth = 0.7;
      for (let b = 0; b < 5; b++) {
        const lo = b / 5, hi = (b + 1) / 5;
        ctx.beginPath();
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
          const i = r * this.cols + c; if (this.hidden[i]) continue;
          if (c + 1 < this.cols && !this.hidden[i + 1]) { const a = (al[i] + al[i + 1]) / 2; if (a >= lo && a < hi) { ctx.moveTo(this.px[i], this.py[i]); ctx.lineTo(this.px[i + 1], this.py[i + 1]); } }
          const j = i + this.cols;
          if (r + 1 < this.rows && !this.hidden[j]) { const a = (al[i] + al[j]) / 2; if (a >= lo && a < hi) { ctx.moveTo(this.px[i], this.py[i]); ctx.lineTo(this.px[j], this.py[j]); } }
        }
        ctx.strokeStyle = rgba(INK, ((lo + hi) / 2) * 0.4);
        ctx.stroke();
      }
    }
    const base = VIEW.mesh ? dot * 0.75 : dot;
    for (let i = 0; i < n; i++) {
      if (al[i] <= 0.01) continue;
      const g = this.gather[i];
      ctx.fillStyle = g > 0.25 ? rgba(mix(INK, this.tint[i] ? CYAN : ACC, g * 0.55), al[i]) : rgba(INK, al[i]);
      ctx.beginPath(); ctx.arc(this.px[i], this.py[i], base, 0, TAU); ctx.fill();
    }
  }
}

// ---------- balls ----------
const GRAVITY = 430;
class Ball {
  constructor(x, y, r, opt) {
    this.x = x; this.y = y; this.r = r; this.r0 = r; this.vx = 0; this.vy = 0;
    this.rain = false; this.held = null; this.landed = false; this.age = 0; this.wob = 0;
    this.drain = false; this.lift = 0; this.pull = null; this.stretch = 0; this.z = 0; this.gone = false;
    Object.assign(this, opt || {});
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
}

function stepBalls(world, dt) {
  const balls = world.balls;
  for (const b of balls) {
    b.age += dt; b.wob += dt * 9;
    if (b.held || b.drain) continue;
    const lift = b.lift || 0;
    b.vy += GRAVITY * (1 - lift) * dt;
    if (b.pull) { b.vx += b.pull[0] * dt; b.vy += b.pull[1] * dt; }
    const damp = Math.exp(-dt * (0.12 + lift * 3.2));
    b.vx *= damp; b.vy *= damp;
    const steps = Math.min(5, 1 + Math.floor((b.speed * dt) / (b.r * 0.5)));
    for (let s = 0; s < steps; s++) {
      b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
      for (const o of world.items) collideRound(world, b, o);
      for (const t of world.silk) collideSilk(b, t);
      if (world.critter && world.critter.bodyBlocks) world.critter.bodyBlocks(b);
      collideBounds(world, b);
    }
  }
  // Balls lean on each other instead of passing through.
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    const a = balls[i], c = balls[j];
    if (a.held || c.held || a.drain || c.drain || a.gone || c.gone) continue;
    const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), m = a.r + c.r;
    if (d >= m || d < 1e-4) continue;
    if (a.rain && c.rain) {
      // Rain pools: two drops that touch become one, keeping their water and their momentum.
      const big = a.r >= c.r ? a : c, small = big === a ? c : a, A1 = big.r * big.r, A2 = small.r * small.r, tot = A1 + A2;
      big.x = (big.x * A1 + small.x * A2) / tot; big.y = (big.y * A1 + small.y * A2) / tot;
      big.vx = (big.vx * A1 + small.vx * A2) / tot; big.vy = (big.vy * A1 + small.vy * A2) / tot;
      big.r = Math.min(26, Math.sqrt(tot)); big.r0 = Math.max(big.r0, big.r); small.gone = true;
      continue;
    }
    const nx = dx / d, ny = dy / d, ma = a.r * a.r, mc = c.r * c.r, tot = ma + mc, push = m - d;
    a.x -= nx * push * (mc / tot); a.y -= ny * push * (mc / tot);
    c.x += nx * push * (ma / tot); c.y += ny * push * (ma / tot);
    const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
    if (rel < 0) {
      const imp = (-1.3 * rel) / (1 / ma + 1 / mc);
      a.vx -= (imp / ma) * nx; a.vy -= (imp / ma) * ny; c.vx += (imp / mc) * nx; c.vy += (imp / mc) * ny;
    }
  }
  if (balls.some((b) => b.gone)) world.balls = balls.filter((b) => !b.gone);
}
function landed(world, b, impact) {
  if (!b.landed && impact) { b.landed = true; world.critter && world.critter.ballLanded && world.critter.ballLanded(b); }
}
/** Against a widget's outline: water and rubber both stop on a ledge and roll off a curve. */
function collideRound(world, b, o) {
  const d = sdf(o, b.x, b.y);
  if (d >= b.r) return;
  const [nx, ny] = normal(o, b.x, b.y);
  b.x += nx * (b.r - d); b.y += ny * (b.r - d);
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    const e = -vn < 45 ? 0 : b.rain ? 0.18 : 0.42;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    const tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty, keep = 0.985;
    b.vx = b.vx - vt * tx + vt * keep * tx; b.vy = b.vy - vt * ty + vt * keep * ty;
    landed(world, b, true);
  }
}
function collideBounds(world, b) {
  const top = 30 + b.r, floor = H - 5 - b.r;
  if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.4; }
  if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.4; }
  if (b.y < top) { b.y = top; b.vy = Math.abs(b.vy) * 0.4; }
  if (b.y > floor) { b.y = floor; if (b.vy > 45) { b.vy = -b.vy * (b.rain ? 0.15 : 0.38); } else b.vy = Math.min(b.vy, 0); b.vx *= 0.99; landed(world, b, true); }
}

// ---------- silk ----------
/**
 * The spider's draglines. Each is anchored where it took off and where it landed, sags a little,
 * catches balls like a trampoline, and wobbles when one hits it.
 */
function collideSilk(b, t) {
  if (t.flying) return;
  const ex = t.bx - t.ax, ey = t.by - t.ay, l2 = ex * ex + ey * ey;
  if (l2 < 100) return;
  const u = clamp(((b.x - t.ax) * ex + (b.y - t.ay) * ey) / l2, 0.03, 0.97);
  const px = t.ax + ex * u, py = t.ay + ey * u, dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
  if (d >= b.r || d < 1e-4) return;
  const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
  b.x = px + nx * b.r; b.y = py + ny * b.r;
  if (vn < 0) {
    b.vx -= 1.55 * vn * nx; b.vy -= 1.55 * vn * ny; b.vx *= 0.9; b.vy *= 0.9;
    t.hitU = u; t.wobV += -vn * 0.05; t.age = Math.min(t.age, t.life * 0.5);
  }
}
function stepSilk(world, dt) {
  for (const t of world.silk) {
    t.age += dt;
    t.wobV += (-t.wob * 160 - t.wobV * 5) * dt; t.wob += t.wobV * dt;
  }
  world.silk = world.silk.filter((t) => t.flying || t.age < t.life);
  while (world.silk.length > 14) world.silk.splice(world.silk.findIndex((t) => !t.flying), 1);
}
function drawSilk(ctx, world) {
  const a = [0, 0], b = [0, 0], m = [0, 0];
  for (const t of world.silk) {
    const fade = t.flying ? 1 : Math.min(1, t.age / 0.25) * Math.min(1, (t.life - t.age) / (t.life * 0.25));
    project(t.ax, t.ay, t.az, a); project(t.bx, t.by, t.bz, b);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sag = t.flying ? 0 : len * 0.035 + t.wob;
    const u = t.hitU ?? 0.5;
    m[0] = lerp(a[0], b[0], u); m[1] = lerp(a[1], b[1], u) + sag;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, b[0], b[1]);
    ctx.lineWidth = 0.7; ctx.strokeStyle = rgba(INK, 0.38 * fade); ctx.stroke();
    // A glint runs along it, the way silk catches light.
    const g = (world.clock * 0.35 + t.seed) % 1;
    ctx.fillStyle = rgba(CYAN, 0.55 * fade * Math.sin(g * Math.PI));
    const gx = lerp(a[0], b[0], g), gy = lerp(a[1], b[1], g) + sag * 4 * g * (1 - g);
    ctx.beginPath(); ctx.arc(gx, gy, 0.9, 0, TAU); ctx.fill();
    for (const p of [a, b]) { ctx.fillStyle = rgba(INK, 0.5 * fade); ctx.beginPath(); ctx.arc(p[0], p[1], 1, 0, TAU); ctx.fill(); }
  }
}

// ---------- music ----------
/** A song at a steady tempo with a little swing; critters read the beat from here, as they would from the visualizer. */
class Music {
  constructor() { this.on = false; this.t = 0; this.bpm = 112; this.level = 0; }
  step(dt) { if (this.on) this.t += dt; this.level = ease(this.level, this.on ? 1 : 0, 3, dt); }
  get beat() { return (this.t * this.bpm) / 60; }
  /** 1 right on a beat, falling away before the next. */
  get pulse() { const f = this.beat % 1; return this.level * Math.exp(-f * 7); }
  /** -1..1, a smooth sway that crosses zero on each beat. */
  get sway() { return this.level * Math.sin(this.beat * Math.PI); }
  bar(i) {
    const b = this.beat, p = this.pulse;
    const v = 0.35 + 0.35 * Math.abs(Math.sin(b * 1.7 + i * 1.3)) + 0.3 * Math.abs(Math.sin(b * 0.6 + i * 2.1));
    return 0.12 + this.level * (v * 0.65 + p * 0.35 * (1 - Math.abs(i - 4) / 6));
  }
}

// ---------- drawing the widgets ----------
function drawWidgets(ctx, world) {
  const hl = world.highlight;
  for (const o of world.items) {
    if (o.page) continue;
    ctx.save();
    if (o.jx || o.jy) ctx.translate(o.jx || 0, o.jy || 0);
    const rr = Math.min(o.r, o.hw, o.hh);
    // A thin lip down to the cloth, so a widget reads as standing on it.
    ctx.beginPath(); ctx.roundRect(o.x - o.hw, o.y - o.hh + 2.5, o.hw * 2, o.hh * 2, rr);
    ctx.fillStyle = "#07060b"; ctx.fill();
    ctx.beginPath(); ctx.roundRect(o.x - o.hw, o.y - o.hh, o.hw * 2, o.hh * 2, rr);
    ctx.fillStyle = SURFACE; ctx.fill();
    ctx.strokeStyle = rgba(INK, hl === o ? 0.4 : 0.15); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = rgba(INK, 0.85); ctx.strokeStyle = rgba(INK, 0.85); ctx.lineWidth = 1.6; ctx.lineCap = "round";
    if (o.kind === "clock") {
      ctx.font = `800 33px ${FONT_DOTO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("9:41", o.x, o.y - 4);
      ctx.font = `500 9.5px ${FONT_MONO}`; ctx.fillStyle = rgba(INK, 0.55); ctx.fillText("TUE 13", o.x, o.y + 22);
    } else if (o.kind === "icon") {
      const g = o.glyph, s = 8;
      ctx.beginPath();
      if (g === "circle") ctx.arc(o.x, o.y, s, 0, TAU);
      else if (g === "square") ctx.rect(o.x - s, o.y - s, s * 2, s * 2);
      else if (g === "tri") { ctx.moveTo(o.x, o.y - s); ctx.lineTo(o.x + s, o.y + s * 0.8); ctx.lineTo(o.x - s, o.y + s * 0.8); ctx.closePath(); }
      else { ctx.moveTo(o.x - s, o.y); ctx.lineTo(o.x + s, o.y); ctx.moveTo(o.x, o.y - s); ctx.lineTo(o.x, o.y + s); }
      ctx.stroke();
    } else if (o.kind === "folder") {
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        ctx.beginPath(); ctx.roundRect(o.x - 15 + a * 16, o.y - 15 + b * 16, 13, 13, 4);
        ctx.fillStyle = rgba(INK, 0.2 + 0.12 * ((a + b) % 2)); ctx.fill();
      }
    } else if (o.kind === "music") {
      const m = world.music, bx = o.x - o.hw + 24;
      ctx.beginPath(); ctx.arc(bx, o.y, 13, 0, TAU); ctx.fillStyle = rgba(m.on ? ACC : INK, m.on ? 0.9 : 0.12); ctx.fill();
      ctx.fillStyle = m.on ? "#1a0010" : rgba(INK, 0.9);
      if (m.on) { ctx.fillRect(bx - 4.5, o.y - 5, 3, 10); ctx.fillRect(bx + 1.5, o.y - 5, 3, 10); }
      else { ctx.beginPath(); ctx.moveTo(bx - 3.5, o.y - 6); ctx.lineTo(bx + 6, o.y); ctx.lineTo(bx - 3.5, o.y + 6); ctx.closePath(); ctx.fill(); }
      // The visualizer: dot columns, the launcher's own look.
      for (let i = 0; i < 9; i++) {
        const x = bx + 22 + i * 7.4, h = m.bar(i), rows = 6;
        for (let k = 0; k < rows; k++) {
          const lit = k / rows < h;
          ctx.fillStyle = lit ? rgba(mix(INK, ACC, k / rows), m.on ? 0.95 : 0.5) : rgba(INK, 0.1);
          ctx.beginPath(); ctx.arc(x, o.y + 12 - k * 4.6, 1.3, 0, TAU); ctx.fill();
        }
      }
    } else if (o.home && world.critter && world.critter.drawHome) {
      world.critter.drawHome(ctx, o);
    }
    ctx.restore();
  }
}

function drawBall(ctx, b, x, y, z) {
  const v = project(x, y, z || 0);
  const col = b.rain ? CYAN : INK;
  // The ball itself is the cloth pressed out of its way; this is only its sheen.
  ctx.fillStyle = rgba(col, b.rain ? 0.08 : 0.06);
  ctx.beginPath(); ctx.arc(v[0], v[1], b.r * 0.95, 0, TAU); ctx.fill();
  if (z > 0.5) {
    // Lifted off the cloth: a little sphere of dots, lit from the top left.
    const n = Math.max(10, Math.round(b.r * 2.4));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, lit = 0.35 + 0.65 * Math.max(0, -(Math.cos(a) * LIGHT[0] + Math.sin(a) * LIGHT[1]));
      ctx.fillStyle = rgba(col, lit);
      ctx.beginPath(); ctx.arc(v[0] + Math.cos(a) * b.r * 0.92, v[1] + Math.sin(a) * b.r * 0.92, 0.9, 0, TAU); ctx.fill();
    }
  }
  ctx.fillStyle = rgba([255, 255, 255], 0.55);
  ctx.beginPath(); ctx.arc(v[0] - b.r * 0.38, v[1] - b.r * 0.4, Math.max(0.8, b.r * 0.16), 0, TAU); ctx.fill();
}

// ---------- a live phone ----------
/**
 * One phone running one critter. Touch is read as gestures: a tap, a long press, a flick, a drag,
 * and the critter is told which, and where.
 */
class World {
  constructor(canvas, homeKind, seed, makeCritter, opts = {}) {
    this.opts = opts;
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.items = opts.items || homeScreen(homeKind);
    this.fabric = new Fabric(this.items, opts.spacing || 9);
    this.balls = []; this.silk = []; this.music = new Music();
    this.clock = 0; this.touch = null; this.visible = false; this.last = 0; this.rand = rng(seed * 7 + 3);
    this.critter = makeCritter(this, seed);
    this.resize();
    this.listen();
  }
  pt(e) { const r = this.canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; }
  listen() {
    const c = this.canvas;
    c.addEventListener("pointermove", (e) => this.hover(e));
    c.addEventListener("pointerleave", () => { if (this.touch && this.touch.hover) this.touch = null; });
    c.addEventListener("pointerdown", (e) => {
      if (this.ghostRun) { this.ghostRun = null; this.endTouch(this.clock * 1000, true); }
      if (this.touch && this.touch.hover) this.touch = null;
      if (this.touch) return;
      this.critter.presence?.();
      c.setPointerCapture?.(e.pointerId);
      const [x, y] = this.pt(e), now = performance.now();
      const music = this.items.find((o) => o.kind === "music");
      if (music && sdf(music, x, y) < 0 && x < music.x - music.hw + 40) { this.music.on = !this.music.on; this.critter.musicChanged?.(this.music.on); return; }
      this.touch = { id: e.pointerId, x, y, x0: x, y0: y, t0: now, path: 0, vx: 0, vy: 0, speed: 0, still: 0, hist: [[x, y, now]], long: false };
      this.touch.on = this.critter.hit ? this.critter.hit(x, y) : null;
      this.critter.down?.(this.touch);
      clearTimeout(this.longTimer);
      this.longTimer = setTimeout(() => {
        const t = this.touch;
        if (t && t.path < 8) { t.long = true; this.critter.long?.(t); }
      }, 430);
    });
    c.addEventListener("pointermove", (e) => {
      const t = this.touch; if (!t || e.pointerId !== t.id) return;
      const [x, y] = this.pt(e), now = performance.now(), d = Math.hypot(x - t.x, y - t.y);
      t.path += d; if (d > 0.6) t.still = 0;
      t.x = x; t.y = y; t.hist.push([x, y, now]);
      while (t.hist.length > 2 && now - t.hist[0][2] > 90) t.hist.shift();
      const h0 = t.hist[0], span = Math.max(8, now - h0[2]);
      t.vx = ((x - h0[0]) / span) * 1000; t.vy = ((y - h0[1]) / span) * 1000; t.speed = Math.hypot(t.vx, t.vy);
      this.critter.move?.(t, d);
    });
    const up = (e) => {
      const t = this.touch; if (!t || e.pointerId !== t.id) return;
      clearTimeout(this.longTimer);
      this.endTouch(performance.now());
    };
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.critter.key?.(); } });
  }
  /** A mouse resting over the page counts as a finger that never presses: critters notice it, it can't grab. */
  hover(e) {
    if (!this.opts.hover || e.pointerType !== "mouse" || e.buttons) return;
    const [x, y] = this.pt(e), now = performance.now();
    let t = this.touch;
    if (t && !t.hover) return;
    this.critter.presence?.();
    if (!t) { this.touch = { id: "hover", hover: true, x, y, x0: x, y0: y, t0: now, path: 0, vx: 0, vy: 0, speed: 0, still: 0, hist: [[x, y, now]], long: false, on: null }; return; }
    const d = Math.hypot(x - t.x, y - t.y);
    t.path += d; if (d > 0.6) t.still = 0;
    t.x = x; t.y = y; t.hist.push([x, y, now]);
    while (t.hist.length > 2 && now - t.hist[0][2] > 90) t.hist.shift();
    const h0 = t.hist[0], span = Math.max(8, now - h0[2]);
    t.vx = ((x - h0[0]) / span) * 1000; t.vy = ((y - h0[1]) / span) * 1000; t.speed = Math.hypot(t.vx, t.vy);
    this.critter.move?.(t, d);
  }
  /** Lifts the finger, and tells the critter what kind of touch it was. */
  endTouch(now, cancel) {
    const t = this.touch; if (!t) return;
    const h0 = t.hist[0], span = Math.max(8, now - h0[2]);
    const recent = !cancel && now - t.hist[t.hist.length - 1][2] < 60;
    const vx = recent ? ((t.x - h0[0]) / span) * 1000 : 0, vy = recent ? ((t.y - h0[1]) / span) * 1000 : 0;
    const gesture = cancel ? "drag" : t.long ? "long" : now - t.t0 < 280 && t.path < 9 ? "tap" : Math.hypot(vx, vy) > 420 && t.path > 18 ? "flick" : "drag";
    this.touch = null;
    this.critter.up?.(t, gesture, vx, vy);
  }
  /** A pretend finger, for the page's "show me" buttons: path(t) says where it is t seconds in. */
  ghost(path, dur) {
    if (this.touch) { this.ghostRun = null; this.endTouch(this.clock * 1000, true); }
    const [x, y] = path(0), ms = this.clock * 1000;
    this.touch = { id: "ghost", ghost: true, x, y, x0: x, y0: y, t0: ms, path: 0, vx: 0, vy: 0, speed: 0, still: 0, hist: [[x, y, ms]], long: false };
    this.touch.on = this.critter.hit ? this.critter.hit(x, y) : null;
    this.critter.down?.(this.touch);
    this.ghostRun = { path, dur, t: 0 };
  }
  stepGhost(dt) {
    const g = this.ghostRun, t = this.touch;
    if (!g || !t || !t.ghost) { this.ghostRun = null; return; }
    g.t += dt;
    const [x, y] = g.path(Math.min(g.t, g.dur)), now = this.clock * 1000, d = Math.hypot(x - t.x, y - t.y);
    t.path += d; if (d > 0.6) t.still = 0;
    t.x = x; t.y = y; t.hist.push([x, y, now]);
    while (t.hist.length > 2 && now - t.hist[0][2] > 90) t.hist.shift();
    const h0 = t.hist[0], span = Math.max(8, now - h0[2]);
    t.vx = ((x - h0[0]) / span) * 1000; t.vy = ((y - h0[1]) / span) * 1000; t.speed = Math.hypot(t.vx, t.vy);
    if (d > 0) this.critter.move?.(t, d);
    if (!t.long && now - t.t0 > 430 && t.path < 8) { t.long = true; this.critter.long?.(t); }
    if (g.t >= g.dur) { this.ghostRun = null; this.endTouch(now); }
  }
  /** Rain from the top of the screen, a drop at a time; it pools where it lands. */
  rain(n) { this.rainLeft = (this.rainLeft || 0) + n; }
  resize() {
    const r = this.canvas.getBoundingClientRect(), dpr = Math.min(this.opts.maxDpr || 2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(r.width * dpr)); this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.scale = this.canvas.width / W;
  }
  /** Throws a ball so it arrives at (tx, ty) after about `time` seconds, on the canvas's own gravity. */
  static aim(fromX, fromY, tx, ty, time) {
    return [(tx - fromX) / time, (ty - fromY) / time - 0.5 * GRAVITY * time];
  }
  frame(now, forced) {
    const dt = forced || (this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60);
    this.last = now;
    const run = !VIEW.paused || forced;
    if (run) {
      this.clock += dt;
      if (this.touch) this.touch.still += dt;
      this.stepGhost(dt);
      if (this.rainLeft > 0) {
        this.rainT = (this.rainT || 0) - dt;
        while (this.rainT <= 0 && this.rainLeft > 0) {
          this.rainT += 0.05; this.rainLeft -= 1;
          if (this.balls.length < 110) this.balls.push(new Ball(16 + this.rand() * (W - 32), 34, 1.8 + this.rand() * 1.5, { rain: true, vx: (this.rand() - 0.5) * 24, vy: 140 + this.rand() * 90 }));
        }
      }
      this.music.step(dt);
      stepBalls(this, dt);
      stepSilk(this, dt);
      this.critter.step(dt);
    }
    const fab = this.fabric;
    fab.beginFrame();
    for (const b of this.balls) if (!b.held && !(b.z > 0.5)) fab.press(b.x, b.y, b.r * (b.drain ? 1 + Math.sin(b.wob) * 0.07 : 1), b.rain ? 1 : 0);
    this.critter.press?.(fab);
    if (this.touch && !this.touch.on) fab.press(this.touch.x, this.touch.y, 8, 0);
    if (run) fab.step(dt);
    if (!forced) this.draw();
  }
  draw() {
    const ctx = this.ctx, s = this.scale, cr = this.critter;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.opts.clear) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    else { ctx.fillStyle = this.opts.ground || GROUND; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    ctx.setTransform(s, 0, 0, s, 0, 0);
    this.fabric.draw(ctx, 1.15);
    cr.drawUnder?.(ctx);
    drawWidgets(ctx, this);
    drawSilk(ctx, this);
    cr.drawShadow?.(ctx);
    for (const b of this.balls) if (!b.held || b.held === "finger") drawBall(ctx, b, b.x, b.y, b.z || 0);
    cr.draw(ctx);
    cr.drawOver?.(ctx);
    if (this.touch && !this.touch.hover && (!this.touch.on || this.touch.ghost)) {
      ctx.strokeStyle = rgba(CYAN, 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(this.touch.x, this.touch.y, 14, 0, TAU); ctx.stroke();
      if (this.touch.ghost) { ctx.fillStyle = rgba(CYAN, 0.12); ctx.fill(); }
    }
    if (this.opts.chrome === false) return;
    ctx.fillStyle = rgba(INK, 0.7); ctx.font = `500 10px ${FONT_MONO}`; ctx.textBaseline = "middle";
    ctx.textAlign = "left"; ctx.fillText("9:41", 22, 18); ctx.textAlign = "right"; ctx.fillText("82%", W - 22, 18);
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(W / 2, 17, 5, 0, TAU); ctx.fill();
  }
}

/** Little floating marks: hearts, z's, puffs. Shared by both critters. */
function drawMark(ctx, e) {
  const k = e.age / e.life;
  if (e.type === "heart") {
    const rows = ["01010", "11111", "11111", "01110", "00100"], p = 1.75, a = 1 - k * k;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === "1") {
      ctx.fillStyle = rgba(ACC, a); ctx.beginPath(); ctx.arc(e.x + (c - 2) * p, e.y - k * 20 + (r - 2) * p, 0.78, 0, TAU); ctx.fill();
    }
  } else if (e.type === "z") {
    ctx.fillStyle = rgba(INK, 0.75 * (1 - k)); ctx.font = `800 ${9 + k * 5}px ${FONT_DOTO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("z", e.x + k * 12 + Math.sin(k * 6) * 2, e.y - k * 22);
  } else if (e.type === "note") {
    ctx.fillStyle = rgba(e.col || ACC, 0.85 * (1 - k)); ctx.font = `700 ${10 + k * 3}px ${FONT_MONO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(e.glyph || "♪", e.x + Math.sin(k * 5 + e.x) * 5, e.y - k * 26);
  } else if (e.type === "pulse") {
    ctx.strokeStyle = rgba(e.col || CYAN, 0.55 * (1 - k)); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r0 * (1 + k * 1.5), 0, TAU); ctx.stroke();
  } else if (e.type === "burst") {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + e.x;
      ctx.fillStyle = rgba(e.col || CYAN, 0.85 * (1 - k));
      ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * (2 + k * 13), e.y + Math.sin(a) * (2 + k * 13), 1.1, 0, TAU); ctx.fill();
    }
  } else if (e.type === "steam") {
    for (let i = 0; i < 3; i++) {
      const kk = (k + i * 0.22) % 1;
      ctx.fillStyle = rgba(RED, 0.7 * (1 - kk));
      ctx.beginPath(); ctx.arc(e.x + (i - 1) * 4 + Math.sin(kk * 9 + i) * 2, e.y - kk * 16, 1 + kk * 1.6, 0, TAU); ctx.fill();
    }
  } else if (e.type === "spark") {
    ctx.fillStyle = rgba(e.col || ACC, 0.9 * (1 - k));
    ctx.beginPath(); ctx.arc(e.x + e.dx * k, e.y + e.dy * k, 1.1, 0, TAU); ctx.fill();
  }
}
