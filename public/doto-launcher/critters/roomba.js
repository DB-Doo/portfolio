"use strict";
/*
 * The Roomba: a round little robot made of the canvas's dots, with a battery of its own, a bin,
 * moods, and opinions about being tickled. It is out and about while you're using the phone,
 * hunts down balls and rain and slurps them up, follows outlines in smooth arcs, dances to your
 * music, and goes home to its dock when its battery runs low or you put the phone down.
 */

const RR = 15;                 // body radius, px
const RH = 6;                  // body height, px
const EDGE_GAP = RR + 4;       // the comfortable distance it keeps from outlines when it plans a route
const BRUSH_GAP = RR + 2;      // how close it hugs an outline when it's edge cleaning
const GRID = 6;                // the route planner's cell, px
const CLEAR = RR + 1.5;        // the room a straight run needs
const LOOKAHEAD = 26;          // how far along an outline it aims: longer is smoother
const VMAX = 44, WMAX = 3.2;   // cruise speed px/s, fastest turn rad/s
const V_ACC = 130, W_ACC = 10; // how fast its speed and turn rate may change: no snaps
const IDLE_SECONDS = 35;       // no touch for this long and it goes home
const LOW_BATTERY = 0.18;
const ROOMBA_NAMES = ["Biscuit", "Pip", "Mochi", "Dusty", "Noodle", "Zuzu", "Bean", "Tater"];

const smin = (a, b, k) => { const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };

const ROOMBA_MODEL = (() => {
  const top = [], g = Math.PI * (3 - Math.sqrt(5)), n = 96;
  for (let i = 0; i < n; i++) {
    const rho = Math.sqrt((i + 0.5) / n) * 0.94, a = g * i;
    top.push({ f: Math.cos(a) * rho, s: Math.sin(a) * rho, rho, a: Math.atan2(Math.sin(a), Math.cos(a)) });
  }
  const wall = [];
  [1.2, 3.0, 4.8].forEach((zl, row) => { for (let k = 0; k < 46; k++) wall.push({ a: ((k + row * 0.5) / 46) * TAU, zl }); });
  return { top, wall };
})();

const EYE_GLYPHS = {
  open: ["01110", "11111", "11111", "11111", "01110"],
  blink: ["00000", "00000", "11111", "00000", "00000"],
  happy: ["00000", "01110", "11011", "10001", "00000"],
  angry: ["11000", "11110", "11111", "11111", "01110"],
  sleepy: ["00000", "00000", "10001", "01110", "00000"],
  focus: ["00000", "11111", "11111", "01110", "00000"],
  wide: ["01110", "10001", "10101", "10001", "01110"],
  heart: ["01010", "11111", "11111", "01110", "00100"],
};

const ROOMBA_DANCES = [
  { id: "shimmy", name: "the shimmy", w: 4 },
  { id: "bump", name: "bump and back", w: 3.5 },
  { id: "pirouette", name: "the pirouette", w: 3 },
  { id: "box", name: "the box step", w: 3 },
  { id: "nod", name: "the head nod", w: 3 },
  { id: "eight", name: "figure eights", w: 2.2 },
  { id: "lights", name: "the light show", w: 1.6 },
  { id: "moonwalk", name: "the moonwalk", w: 0.9 },
];

class Roomba {
  constructor(world, seed) {
    this.w = world; this.items = world.items; this.rand = rng(seed * 31 + 5);
    this.dock = this.items.find((o) => o.home);
    this.placeDock();
    this.x = this.dock.x; this.y = this.dock.y; this.heading = this.face;
    this.v = 0; this.spin = 0; this.z = WIDGET_TOP; this.vz = 0;
    this.tiltF = 0; this.tiltS = 0; this.tiltFT = 0; this.squash = 0; this.squashT = 0;
    this.jit = 0; this.jitT = 0; this.shake = [0, 0]; this.shakeT = null;
    this.clock = 0; this.brushA = 0; this.brushOn = 0; this.brushT = 0; this.wheelA = 0; this.bumpT = 0;
    this.marks = []; this.drains = []; this.climbing = null; this.ignoreDock = false;
    const r = this.rand;
    this.traits = { zip: 0.82 + r() * 0.4, tidy: 0.25 + r() * 0.75, playful: 0.3 + r() * 0.7, clingy: 0.2 + r() * 0.8, grumpy: 0.2 + r() * 0.8, curious: 0.3 + r() * 0.7 };
    this.pref = r() < 0.5 ? 1 : -1;
    this.name = ROOMBA_NAMES[Math.floor(r() * ROOMBA_NAMES.length)];
    this.battery = 0.86; this.bin = 0.06; this.happy = 0.55; this.anger = 0; this.social = 0.35; this.boredom = 0.3;
    this.seen = 0; this.cleaned = 0; this.tickles = 0; this.pets = 0; this.boops = []; this.lastTouch = null;
    this.heat = new Float32Array(6 * 11); this.danceSeen = new Set(); this.dance = null;
    this.mood = "sleepy"; this.lookX = 0; this.lookY = 0; this.look = null; this.blinkIn = 2; this.blinkT = 0;
    this.nav = null; this.act = null; this.thought = "";
    this.begin("docked", "Charging in its dock", { need: 0.3 });
  }

  /** Where it rolls out to: straight behind it as it sits facing `dock.face` (up, unless a page says otherwise). */
  placeDock() {
    this.face = this.dock.face ?? -Math.PI / 2;
    const out = this.dock.hh + RR + 16;
    this.entry = [this.dock.x - Math.cos(this.face) * out, this.dock.y - Math.sin(this.face) * out];
  }

  // ======== the room, as it sees it ========
  /** Distance to the nearest outline or screen edge, blended where two meet so their seams are round. */
  field(x, y) {
    let f = Math.min(x - 2, W - 2 - x, y - 34, H - 4 - y);
    for (const o of this.items) {
      if (o === this.dock && this.ignoreDock) continue;
      // A box this far away can't change the blend (smin only reaches k = 6), so skip its sdf.
      const bx = Math.abs(x - o.x) - o.hw, by = Math.abs(y - o.y) - o.hh;
      if (bx > f + 6 || by > f + 6) continue;
      f = smin(f, sdf(o, x, y), 6);
    }
    return f;
  }
  fieldN(x, y) {
    const e = 0.75, nx = this.field(x + e, y) - this.field(x - e, y), ny = this.field(x, y + e) - this.field(x, y - e), l = Math.hypot(nx, ny);
    return l < 1e-6 ? [0, -1] : [nx / l, ny / l];
  }
  groundUnder() { return groundAt(this.items, this.x, this.y); }
  /** The first point along the way that is too tight for its body, or null when the way is clear. */
  blocked(ux, uy, len) {
    for (let s = 4; s <= len; s += 4) { const px = this.x + ux * s, py = this.y + uy * s; if (this.field(px, py) < CLEAR) return [px, py]; }
    return null;
  }
  onContour(px, py, gap = EDGE_GAP) {
    for (let k = 0; k < 3; k++) { const f = this.field(px, py), n = this.fieldN(px, py); px -= n[0] * (f - gap); py -= n[1] * (f - gap); }
    return [px, py];
  }
  /**
   * The point LOOKAHEAD along the outline it is following: its own spot projected onto the line a
   * body-and-a-bit off every outline, then walked along it. Aiming there (pure pursuit) gives one
   * steady arc round a circle, the way a real Roomba's wall sensor does, never step-and-correct.
   */
  contourAhead(side, L, gap = BRUSH_GAP) {
    let [px, py] = this.onContour(this.x, this.y, gap);
    for (let walked = 0; walked < L; walked += 3) {
      const n = this.fieldN(px, py);
      px += -n[1] * side * 3; py += n[0] * side * 3;
      const f = this.field(px, py), n2 = this.fieldN(px, py);
      px -= n2[0] * (f - gap); py -= n2[1] * (f - gap);
    }
    return [px, py];
  }
  /** The same, round one widget's own outline: what an edge clean hugs, so a nearby wall can't pull it off. */
  aroundAhead(o, side, L, gap = BRUSH_GAP) {
    let px = this.x, py = this.y;
    for (let k = 0; k < 3; k++) { const d = sdf(o, px, py), n = normal(o, px, py); px -= n[0] * (d - gap); py -= n[1] * (d - gap); }
    for (let walked = 0; walked < L; walked += 3) {
      const n = normal(o, px, py);
      px += -n[1] * side * 3; py += n[0] * side * 3;
      const d = sdf(o, px, py), n2 = normal(o, px, py);
      px -= n2[0] * (d - gap); py -= n2[1] * (d - gap);
    }
    return [px, py];
  }
  /** Room for its body at every cell of the screen, worked out once: widgets don't move under it. */
  roomMap() {
    const key = this.ignoreDock ? 1 : 0;
    this.maps = this.maps || [];
    if (this.maps[key]) return this.maps[key];
    const cols = Math.ceil(W / GRID), rows = Math.ceil(H / GRID), f = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) f[r * cols + c] = this.field((c + 0.5) * GRID, (r + 0.5) * GRID);
    // Label each open patch of floor, so it knows which places it can drive to without climbing.
    const comp = new Int32Array(cols * rows).fill(-1);
    let main = -1, most = 0;
    for (let i = 0, id = 0; i < cols * rows; i++) {
      if (comp[i] >= 0 || f[i] < RR + 1) continue;
      const q = [i]; comp[i] = id;
      for (let h = 0; h < q.length; h++) {
        const c = q[h] % cols, r = (q[h] / cols) | 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc; if (comp[j] < 0 && f[j] >= RR + 1) { comp[j] = id; q.push(j); }
        }
      }
      if (q.length > most) { most = q.length; main = id; }
      id++;
    }
    return (this.maps[key] = { cols, rows, f, comp, main });
  }
  /** Which open patch of floor (x, y) is on, or -1 where its body doesn't fit. */
  patchAt(x, y) {
    const M = this.roomMap();
    return M.comp[clamp(Math.floor(y / GRID), 0, M.rows - 1) * M.cols + clamp(Math.floor(x / GRID), 0, M.cols - 1)];
  }
  /** Whether it can get its mouth to a ball without climbing: a route ends close enough to suck it in. */
  canReach(b) {
    const d = Math.hypot(b.x - this.x, b.y - this.y);
    if (!this.blocked((b.x - this.x) / (d || 1), (b.y - this.y) / (d || 1), Math.max(0, d - RR - b.r))) return true;
    const P = this.plan(b.x, b.y);
    return !!P && Math.hypot(P.end[0] - b.x, P.end[1] - b.y) < RR + 20 + b.r * 0.9;
  }
  /**
   * A route to (gx, gy): A* over the cells its body fits in, costing cells near outlines more so it
   * keeps to the middle of a gap, then pulled tight wherever it can see straight ahead. Null when
   * there is no way round, which is when it climbs over instead.
   */
  plan(gx, gy) {
    const M = this.roomMap(), { cols, rows, f, comp } = M, fits = RR + 1;
    const cell = (x, y) => clamp(Math.floor(y / GRID), 0, rows - 1) * cols + clamp(Math.floor(x / GRID), 0, cols - 1);
    const nearestFree = (i0, limit, want = -1) => {
      const ok = (j) => f[j] >= fits && (want < 0 || comp[j] === want);
      if (ok(i0)) return i0;
      const seen = new Uint8Array(cols * rows), q = [i0]; seen[i0] = 1;
      for (let h = 0; h < q.length && h < limit; h++) {
        const i = q[h], c = i % cols, r = (i / cols) | 0;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc; if (seen[j]) continue; seen[j] = 1;
          if (ok(j)) return j;
          q.push(j);
        }
      }
      return -1;
    };
    // The goal snaps to the nearest spot on its own patch of floor; how far that is from the goal says
    // whether it can reach from there or has to climb.
    const s0 = nearestFree(cell(this.x, this.y), 400);
    if (s0 < 0) return null;
    const g0 = nearestFree(cell(gx, gy), 4000, comp[s0]);
    if (g0 < 0) return null;
    const n = cols * rows, cost = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    const gc = g0 % cols, gr = (g0 / cols) | 0;
    const heap = [];
    const push = (i, pri) => { heap.push([pri, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    cost[s0] = 0; push(s0, 0);
    let found = false;
    while (heap.length) {
      const [, i] = pop();
      if (done[i]) continue; done[i] = 1;
      if (i === g0) { found = true; break; }
      const c = i % cols, r = (i / cols) | 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const j = nr * cols + nc; if (done[j] || f[j] < fits) continue;
        const near = clamp((EDGE_GAP + 10 - f[j]) / 12, 0, 1);
        const step = (dr && dc ? 1.414 : 1) * (1 + 2.5 * near);
        if (cost[i] + step < cost[j]) { cost[j] = cost[i] + step; from[j] = i; push(j, cost[j] + Math.hypot(nc - gc, nr - gr)); }
      }
    }
    if (!found) return null;
    const raw = [];
    for (let i = g0; i >= 0; i = from[i]) raw.push([((i % cols) + 0.5) * GRID, (((i / cols) | 0) + 0.5) * GRID]);
    raw.reverse();
    if (f[cell(gx, gy)] >= fits && comp[cell(gx, gy)] === comp[s0]) raw.push([gx, gy]);
    // Pull it tight: from each kept point, skip ahead to the furthest one it can see.
    const sees = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 3; s < d; s += 3) { const u = s / d; if (this.field(lerp(a[0], b[0], u), lerp(a[1], b[1], u)) < CLEAR + 2) return false; } return true; };
    const out = [[this.x, this.y]];
    let k = 0;
    while (k < raw.length - 1) { let j = raw.length - 1; while (j > k + 1 && !sees(out[out.length - 1], raw[j])) j--; out.push(raw[j]); k = j; }
    if (out.length === 1) out.push(raw[raw.length - 1]);
    return { pts: out, gx, gy, end: out[out.length - 1], at: this.clock };
  }
  /** The point LOOKAHEAD further along the route than where it is now. */
  pathAhead(P, L) {
    const pts = P.pts;
    let best = P.i || 0, bd = Infinity, bu = 0;
    for (let i = P.i || 0; i < pts.length - 1 && i <= (P.i || 0) + 3; i++) {
      const a = pts[i], b = pts[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex * ex + ey * ey || 1;
      const u = clamp(((this.x - a[0]) * ex + (this.y - a[1]) * ey) / l2, 0, 1), d = Math.hypot(a[0] + ex * u - this.x, a[1] + ey * u - this.y);
      if (d < bd) { bd = d; best = i; bu = u; }
    }
    P.i = best;
    let i = best, left = L, px = lerp(pts[i][0], pts[i + 1][0], bu), py = lerp(pts[i][1], pts[i + 1][1], bu);
    while (i < pts.length - 1) {
      const b = pts[i + 1], seg = Math.hypot(b[0] - px, b[1] - py);
      if (seg >= left) { const u = left / seg; return [lerp(px, b[0], u), lerp(py, b[1], u)]; }
      left -= seg; px = b[0]; py = b[1]; i++;
    }
    return [px, py];
  }
  freeSpot(minDist = 70) {
    // Somewhere on the main floor: if it climbed into a nook, exploring brings it back out.
    const home = this.roomMap().main;
    for (let k = 0; k < 40; k++) {
      const x = 24 + this.rand() * (W - 48), y = 60 + this.rand() * (H - 100);
      if (this.field(x, y) > EDGE_GAP + 6 && Math.hypot(x - this.x, y - this.y) > minDist && (home < 0 || this.patchAt(x, y) === home)) return [x, y];
    }
    return [W / 2, H * 0.62];
  }

  // ======== driving ========
  /** Differential drive: speed and turn rate only ever ease toward what it asks for. */
  drive(dt, vT, wT) {
    this.drove = true;
    this.v += clamp(vT - this.v, -V_ACC * 1.6 * dt, V_ACC * dt);
    this.spin += clamp(wT - this.spin, -W_ACC * dt, W_ACC * dt);
    this.heading = wrap(this.heading + this.spin * dt);
    this.x += Math.cos(this.heading) * this.v * dt; this.y += Math.sin(this.heading) * this.v * dt;
    this.x = clamp(this.x, RR + 2, W - RR - 2); this.y = clamp(this.y, RR + 34, H - RR - 4);
    this.collide();
  }
  brake(dt) { this.drive(dt, 0, 0); }
  turnTo(dt, a, rate = 0.75) {
    const d = wrap(a - this.heading);
    this.drive(dt, 0, clamp(d * 4.5, -WMAX * rate, WMAX * rate));
    return Math.abs(d) < 0.05 && Math.abs(this.spin) < 0.3;
  }
  /** Pure pursuit: the arc through a point ahead, its curvature 2·sin(α)/L. */
  steer(dt, tx, ty, vmax) {
    const dx = tx - this.x, dy = ty - this.y, L = Math.max(10, Math.hypot(dx, dy));
    const a = wrap(Math.atan2(dy, dx) - this.heading);
    if (Math.abs(a) > 1.35) return this.drive(dt, 0, Math.sign(a) * WMAX * 0.8);
    const vT = vmax * clamp(1.25 - Math.abs(a) * 0.8, 0.25, 1);
    this.drive(dt, vT, clamp((2 * Math.sin(a) * Math.max(Math.abs(this.v), 12)) / L, -WMAX, WMAX));
  }
  collide() {
    if (this.climbing || this.ignoreAll || this.groundUnder() > 2) return;
    const f = this.field(this.x, this.y);
    if (f >= RR) return;
    const n = this.fieldN(this.x, this.y);
    this.x += n[0] * (RR - f); this.y += n[1] * (RR - f);
    if (Math.cos(this.heading) * n[0] + Math.sin(this.heading) * n[1] < -0.4 && this.v > 18) { this.bumpT = 0.25; this.v *= 0.5; }
  }
  /**
   * Goes somewhere: straight when the way is clear, along a planned route when it isn't, and over
   * the top of a widget when there is no way round or it has been stuck.
   */
  navigate(dt, gx, gy, stop, pace = 1) {
    const n = this.nav || (this.nav = { mode: "go", path: null, lt: 0, lx: this.x, ly: this.y, stuck: 0 });
    const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
    if (d <= stop) { this.brake(dt); return true; }
    if (this.groundUnder() > 3) { return this.climbOver(gx, gy); }
    const vmax = VMAX * this.traits.zip * pace * clamp((d - stop) / 30 + 0.2, 0.3, 1);
    const ux = dx / d, uy = dy / d;
    n.lt += dt;
    if (n.lt > 1) { n.stuck = Math.hypot(this.x - n.lx, this.y - n.ly) < 4 ? n.stuck + n.lt : 0; n.lt = 0; n.lx = this.x; n.ly = this.y; }
    if (n.stuck > 2) { return this.climbOver(gx, gy); }
    const clear = !this.blocked(ux, uy, d - stop);
    if (clear && (n.mode === "go" || !n.path || Math.hypot(n.path.end[0] - this.x, n.path.end[1] - this.y) < 60)) { n.mode = "go"; n.path = null; }
    else {
      const P = n.path;
      if (!P || Math.hypot(P.gx - gx, P.gy - gy) > 14 || this.clock - P.at > 2) {
        const next = this.plan(gx, gy);
        if (!next) { return this.climbOver(gx, gy); }
        next.i = 0; n.path = next;
      }
      n.mode = "route";
      const end = n.path.end;
      // At the end of the route and still not there: the goal is on a widget or boxed in, so over it goes.
      if (Math.hypot(end[0] - this.x, end[1] - this.y) < 6 && d > stop) {
        if (d > stop + 26 && d < 110) { return this.climbOver(gx, gy); }
        this.brake(dt); return true;
      }
    }
    if (n.mode === "go") { const L = Math.min(d, 40); this.steer(dt, this.x + ux * L, this.y + uy * L, vmax); }
    else { const p = this.pathAhead(n.path, 30); this.steer(dt, p[0], p[1], vmax); }
    return false;
  }
  climbOver(gx, gy) {
    if (this.climbing) return;
    let over = null;
    for (let s = 6; s < 90 && !over; s += 4) {
      const a = Math.atan2(gy - this.y, gx - this.x);
      over = widgetAt(this.items, this.x + Math.cos(a) * s, this.y + Math.sin(a) * s);
    }
    // Page text is a wall: it gives up on that goal rather than drive across words.
    if (over && over.wall && this.groundUnder() <= 3) { this.nav = null; this.thought = `Can't get past ${over.name}, so it's doing something else`; return true; }
    this.climbing = { t: 0, ph: 0, a: Math.atan2(gy - this.y, gx - this.x), gx, gy, on: false };
    this.climbedAt = this.clock;
    const stuck = this.nav && this.nav.stuck > 2;
    this.nav = null;
    if (over) this.thought = stuck ? `Stuck, so it's climbing over ${over.name}` : `No way round, so it's climbing over ${over.name}`;
    return false;
  }
  stepClimb(dt) {
    const c = this.climbing;
    c.t += dt;
    if (c.ph === 0) { if (this.turnTo(dt, c.a, 0.8) || c.t > 0.9) { c.ph = 1; c.t = 0; } return; }
    this.steer(dt, c.gx, c.gy, 24);
    const g = this.groundUnder();
    if (g > 2) c.on = true;
    const d = Math.hypot(c.gx - this.x, c.gy - this.y);
    if ((c.on && g < 0.3 && this.field(this.x, this.y) > RR + 1) || d < 10 || c.t > 6) { this.climbing = null; this.nav = null; }
  }

  // ======== needs and choices ========
  heatAdd(x, y) {
    const c = clamp(Math.floor(x / 50), 0, 5), r = clamp(Math.floor((y - 40) / 52), 0, 10);
    for (let i = 0; i < this.heat.length; i++) this.heat[i] *= 0.97;
    this.heat[r * 6 + c] += 1;
  }
  heatSpot() {
    let best = -1, v = 1.5;
    for (let i = 0; i < this.heat.length; i++) if (this.heat[i] > v) { v = this.heat[i]; best = i; }
    if (best < 0) return null;
    const p = [(best % 6) * 50 + 25, 40 + Math.floor(best / 6) * 52 + 26];
    return this.field(p[0], p[1]) > EDGE_GAP ? p : this.onContour(p[0], p[1]);
  }
  /**
   * The ball it most wants: big ones and stuck ones first, near ones before far. One it has no
   * route to is left alone for a while, unless it's tidy enough to climb over a widget for it.
   */
  pickBall() {
    const tried = new Set();
    let far = null;
    for (let k = 0; k < 4; k++) {
      const b = this.bestBall(tried);
      if (!b) break;
      tried.add(b);
      if (this.canReach(b)) return b;
      b.noRoute = this.clock; far = far || b;
    }
    // Nothing it can drive to: now and then it decides one is worth climbing over a widget for.
    if (far && this.clock - (this.climbedAt ?? -1e9) > 20 && this.rand() < 0.25 + this.traits.tidy * 0.5) { far.noRoute = undefined; far.climbFor = true; return far; }
    return null;
  }
  bestBall(skip) {
    let best = null, bs = -1e9;
    for (const b of this.w.balls) {
      if (skip.has(b) || this.clock - (b.noRoute ?? -1e9) < 25) continue;
      if (b.held || b.gone || b.drain || b.speed > 90 || b.age < 0.4) continue;
      const d = Math.hypot(b.x - this.x, b.y - this.y);
      const ledge = this.items.find((o) => sdf(o, b.x, b.y) < b.r + 2.5 && b.y < o.y) || null;
      b.stuck = ledge;
      const s = -d + b.r * 6 + (ledge ? 40 : 0);
      if (s > bs) { bs = s; best = b; }
    }
    return best;
  }
  needsHome() { return this.battery < LOW_BATTERY || this.bin >= 1 || this.w.clock - this.seen > IDLE_SECONDS; }
  begin(kind, why, data) {
    this.act = { kind, t: 0, ph: 0, data: data || {} };
    this.nav = null;
    if (why) this.thought = why;
  }
  goHome(reason) {
    const why = reason === "battery" ? `Battery's low (${Math.round(this.battery * 100)}%), so it's heading home to charge`
      : reason === "bin" ? "Its bin is full, so it's going home to empty it"
      : "You've put the phone down, so it's going home for a nap";
    this.begin("home", why, { reason });
  }
  /** What next: everything it could do, scored by how it feels and who it is, with a pinch of chance. */
  think() {
    const T = this.traits, opts = [], idle = this.w.clock - this.seen;
    const add = (kind, u, data) => opts.push({ kind, u: u * (0.8 + this.rand() * 0.4), data });
    const ball = this.pickBall();
    if (this.w.music.on) add("dance", 1.4 + T.playful * 0.5);
    if (ball) add("clean", 0.55 + T.tidy * 0.7 + (ball.r > 10 ? 0.3 : 0) + (ball.stuck ? 0.15 : 0), { ball });
    if (ball && ball.r < 9 && !ball.rain) add("bumper", 0.15 + T.playful * 0.5, { ball });
    if (idle < 10 && (this.lastTouch || this.w.touch)) add("visit", this.social * (0.6 + T.clingy * 0.8));
    add("edge", 0.15 + T.tidy * 0.35 * (0.5 + this.boredom));
    add("explore", 0.2 + T.curious * 0.5 * (0.4 + this.boredom));
    add("play", 0.12 + T.curious * 0.4 * this.boredom);
    if (this.happy > 0.55) add("zoomies", T.playful * this.happy * 0.45);
    add("park", 0.16 + (1 - this.battery) * 0.3);
    opts.sort((a, b) => b.u - a.u);
    this.start(opts[0].kind, opts[0].data);
  }
  start(kind, data) {
    data = data || {};
    // From the dock, it backs out first and then does what it meant to.
    if (this.act && this.act.kind === "docked") return this.begin("launch", "Rolling out of its dock", { then: { kind, data } });
    if (this.act && this.act.kind === "launch" && !this.act.data.done) { this.act.data.then = { kind, data }; return; }
    switch (kind) {
      case "dance": return this.begin("dance", "Your music's on, so it's rolling over to dance", data);
      case "clean": {
        const b = data.ball || this.pickBall();
        if (!b) return this.start("explore");
        return this.begin("clean", b.r > 10 ? "A big puddle! Going to slurp it up, slowly" : b.stuck ? `A ball's stuck on ${b.stuck.name}. Going to clean it up` : "Spotted a ball. Going to suck it up", { ball: b });
      }
      case "bumper": return this.begin("bumper", "Playing bumper ball before it tidies up", { ball: data.ball, kicks: 0, max: 2 + Math.floor(this.rand() * 3) });
      case "visit": return this.begin("visit", this.w.touch ? "Coming over to your finger" : "Coming to find you", {});
      case "edge": {
        const o = data.o || this.pickEdge();
        return this.begin("edge", data.race ? `Racing round ${o.name}!` : `Edge cleaning round ${o.name}`, { o, pace: data.race ? 1.9 : 0.85, race: data.race });
      }
      case "explore": { const p = data.p || this.freeSpot(); return this.begin("explore", `Exploring ${placeName(p[0], p[1])}`, { x: p[0], y: p[1] }); }
      case "play": {
        const pool = this.items.filter((o) => !o.home && !o.wall && o.y < H - 100);
        if (!pool.length) return this.start("explore");
        const o = pool[Math.floor(this.rand() * pool.length)];
        if (o.kind === "clock") return this.start("edge", { o, race: true });
        const words = { folder: ["Nudging the folder to see what's in it", "boop"], music: ["Bumping the music widget, hoping for a song", "♪?"], icon: ["Sniffing an icon", "sniff"] }[o.kind] || ["Poking at a widget", "boop"];
        return this.begin("nudge", words[0], { o, word: words[1] });
      }
      case "zoomies": return this.begin("zoomies", "Zoomies!", { n: 3 + Math.floor(this.rand() * 3), goal: null });
      case "park": {
        const spot = this.heatSpot();
        if (spot && Math.hypot(spot[0] - this.x, spot[1] - this.y) > 50 && this.rand() < 0.6) return this.begin("park", `Waiting at ${placeName(spot[0], spot[1])}, where you usually touch`, { spot, len: 4 + this.rand() * 3 });
        return this.begin("park", "Stopped for a look around", { len: 2 + this.rand() * 3 });
      }
    }
    return this.start("explore");
  }
  /** The nearest spot beside a widget's own outline that its body fits in: where an edge clean starts. */
  edgeStart(o) {
    let best = null, bd = Infinity;
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * TAU;
      let px = o.x + Math.cos(a) * (Math.max(o.hw, o.hh) + BRUSH_GAP), py = o.y + Math.sin(a) * (Math.max(o.hw, o.hh) + BRUSH_GAP);
      for (let i = 0; i < 3; i++) { const dd = sdf(o, px, py), nn = normal(o, px, py); px -= nn[0] * (dd - BRUSH_GAP); py -= nn[1] * (dd - BRUSH_GAP); }
      if (this.field(px, py) < BRUSH_GAP - 1.5) continue;
      const d = Math.hypot(px - this.x, py - this.y);
      if (d < bd) { bd = d; best = [px, py]; }
    }
    return best || this.onContour(o.x, o.y + o.hh + BRUSH_GAP, BRUSH_GAP);
  }
  pickEdge() {
    const pool = [];
    for (const o of this.items) { if (o.home) continue; const w = o.kind === "clock" ? 3 : o.kind === "music" ? 1.5 : 1; pool.push([o, w]); }
    let r = this.rand() * pool.reduce((s, p) => s + p[1], 0);
    for (const [o, w] of pool) { r -= w; if (r <= 0) return o; }
    return pool[0][0];
  }
  calm() { return ["explore", "park", "edge", "nudge", "visit", "zoomies"].includes(this.act.kind) && !this.climbing; }

  // ======== each frame ========
  step(dt) {
    this.clock += dt;
    const idle = this.w.clock - this.seen, T = this.traits;
    this.happy = ease(this.happy, 0.5, 0.03, dt);
    this.anger = Math.max(0, this.anger - dt * (0.05 + (1 - T.grumpy) * 0.12));
    this.social = clamp(this.social + dt * 0.012 * (0.4 + T.clingy) * (idle < 8 ? 1 : 0.3), 0, 1);
    this.boredom = clamp(this.boredom + dt * 0.015 * (0.4 + T.curious), 0, 1);
    const k0 = this.act.kind;
    if (k0 !== "docked") this.battery = clamp(this.battery - dt * 0.0042 * (0.45 + (Math.abs(this.v) / VMAX) * 0.5 + (this.drains.length ? 0.5 : 0) + (k0 === "angry" ? 0.4 : 0)), 0, 1);
    for (const m of this.marks) m.age += dt;
    this.marks = this.marks.filter((m) => m.age < m.life);
    for (const o of this.items) {
      if (!o.jvx && !o.jx && !o.jvy && !o.jy) continue;
      o.jvx = (o.jvx || 0) + (-(o.jx || 0) * 320 - (o.jvx || 0) * 13) * dt; o.jvy = (o.jvy || 0) + (-(o.jy || 0) * 320 - (o.jvy || 0) * 13) * dt;
      o.jx = (o.jx || 0) + o.jvx * dt; o.jy = (o.jy || 0) + o.jvy * dt;
      if (Math.abs(o.jx) + Math.abs(o.jy) + Math.abs(o.jvx) + Math.abs(o.jvy) < 0.02) o.jx = o.jy = o.jvx = o.jvy = 0;
    }
    // Per-frame defaults; the act shapes them.
    this.drove = false; this.kinematic = false; this.sucking = false; this.brushT = 0; this.ignoreDock = false;
    this.mood = null; this.look = null; this.jitT = 0; this.shakeT = null; this.tiltFT = 0; this.squashT = 0;

    const t = this.w.touch;
    if (t && t.ball) { const b = t.ball; b.x = t.x; b.y = t.y - 2; b.vx = t.vx; b.vy = t.vy; }
    if (t && !t.on && this.calm() && t.still > 0.9 && this.act.kind !== "visit" && this.rand() < dt * (0.8 + T.clingy * 2)) this.start("visit");

    // Its needs come first: a flat battery, a full bin, or a phone put down.
    const busy = ["held", "slide", "dizzy", "home", "docked", "launch", "angry"].includes(this.act.kind);
    if (!busy && !this.drains.length) {
      if (this.battery < LOW_BATTERY) this.goHome("battery");
      else if (this.bin >= 1) this.goHome("bin");
      else if (idle > IDLE_SECONDS) this.goHome("idle");
    }
    this.act.t += dt;
    if (this.climbing) { this.stepClimb(dt); this.brushT = 0.3; }
    else this.run(dt);
    if (!this.drove && !this.kinematic) this.drive(dt, this.v, this.spin);
    if (this.squirmT > 0) { this.squirmT -= dt; this.jitT = Math.sin(this.clock * 40) * 0.12; this.mood = "focus"; }
    this.suction(dt); this.drainStep(dt);

    // The body: height over what's under it, tilt on a slope, squash, the brush and wheels.
    const g = this.groundUnder(), held = this.act.kind === "held" || this.act.kind === "slide";
    if (!held) {
      this.z = ease(this.z, g, 12, dt);
      const c = Math.cos(this.heading), s = Math.sin(this.heading);
      const slope = (groundAt(this.items, this.x + c * RR * 0.8, this.y + s * RR * 0.8) - groundAt(this.items, this.x - c * RR * 0.8, this.y - s * RR * 0.8)) * 0.5;
      this.tiltF = ease(this.tiltF, this.tiltFT + slope, 12, dt); this.tiltS = ease(this.tiltS, 0, 10, dt);
    }
    this.squash = ease(this.squash, this.squashT, 14, dt);
    this.jit = this.jitT;
    const sh = this.shakeT || [0, 0];
    this.shake[0] = sh[0]; this.shake[1] = sh[1];
    this.brushOn = ease(this.brushOn, this.brushT, 4, dt); this.brushA += dt * 15 * this.brushOn;
    this.wheelA += (this.v * dt) / 3;
    this.bumpT = Math.max(0, this.bumpT - dt);
    // Eyes follow what it's thinking about, and it blinks.
    if (!this.mood) this.mood = this.battery < LOW_BATTERY + 0.04 ? "sleepy" : "open";
    const lk = this.look;
    this.lookX = ease(this.lookX, lk ? clamp((lk[0] - this.x) / 45, -1, 1) * 1.4 : Math.cos(this.heading) * 0.8, 9, dt);
    this.lookY = ease(this.lookY, lk ? clamp((lk[1] - this.y) / 45, -1, 1) * 0.9 : Math.sin(this.heading) * 0.5, 9, dt);
    this.blinkIn -= dt; this.blinkT -= dt;
    if (this.blinkIn <= 0) { this.blinkT = 0.13; this.blinkIn = 1.8 + this.rand() * 4; }
  }
  lookAt(x, y) { this.look = [x, y]; }

  run(dt) {
    const a = this.act, T = this.traits, t = this.w.touch;
    switch (a.kind) {
      case "docked": {
        this.kinematic = true; this.ignoreDock = true;
        this.x = ease(this.x, this.dock.x, 6, dt); this.y = ease(this.y, this.dock.y, 6, dt);
        this.heading = wrap(this.heading + wrap(this.face - this.heading) * (1 - Math.exp(-6 * dt)));
        this.v = 0; this.spin = 0;
        this.battery = Math.min(1, this.battery + dt * 0.05);
        if (this.bin > 0.001) {
          this.bin = Math.max(0, this.bin - dt * 0.8);
          if (this.rand() < dt * 30) this.marks.push({ type: "spark", x: this.x + (this.rand() - 0.5) * 16, y: this.y - 4, dx: (this.rand() - 0.5) * 6, dy: -22, age: 0, life: 0.5, col: INK });
          this.thought = "Emptying its bin into the dock. Whoosh";
        }
        const awake = this.w.clock - this.seen < 2.5;
        this.mood = awake ? "open" : "sleepy";
        if (!awake) { a.data.zz = (a.data.zz ?? 0.5) - dt; if (a.data.zz <= 0) { a.data.zz = 1.7; this.marks.push({ type: "z", x: this.x + 10, y: this.y - 16, age: 0, life: 2.2 }); } }
        const need = a.data.need ?? 0.3;
        if (awake && this.battery < need && this.bin < 0.01) this.thought = `Charging (${Math.round(this.battery * 100)}%). It'll come out to play at ${Math.round(need * 100)}%`;
        a.data.wait = awake && this.battery >= need && this.bin < 0.01 ? (a.data.wait || 0) + dt : 0;
        if (a.data.wait > 0.7) this.begin("launch", "You're back! Rolling out of its dock");
        break;
      }
      case "launch": {
        this.ignoreDock = true;
        this.drive(dt, -26, clamp(wrap(this.face - this.heading) * 3, -1, 1));
        if ((this.dock.x - this.x) * Math.cos(this.face) + (this.dock.y - this.y) * Math.sin(this.face) >= this.dock.hh + RR + 10) { a.data.done = true; const then = a.data.then; if (then) this.start(then.kind, then.data); else this.think(); }
        break;
      }
      case "home": {
        this.brushT = 0.3;
        if (a.ph === 0) { this.lookAt(this.dock.x, this.dock.y); if (this.navigate(dt, this.entry[0], this.entry[1], 5, 0.9)) a.ph = 1; }
        else if (a.ph === 1) { if (this.turnTo(dt, this.face, 0.6)) a.ph = 2; }
        else {
          this.ignoreDock = true;
          this.steer(dt, this.dock.x, this.dock.y, 22);
          if (Math.hypot(this.dock.x - this.x, this.dock.y - this.y) < 2.5) {
            const reason = a.data.reason;
            this.begin("docked", reason === "battery" ? "Home. Charging up" : reason === "bin" ? "Home. Emptying its bin" : "Home, napping until you're back", { need: reason === "battery" ? 0.7 : 0.3 });
            this.marks.push({ type: "pulse", x: this.dock.x, y: this.dock.y - 3, age: 0, life: 0.6, r0: 10, col: GREEN });
          }
        }
        break;
      }
      case "explore": {
        this.brushT = 0.6; this.sucking = true;
        this.lookAt(a.data.x, a.data.y);
        if (this.navigate(dt, a.data.x, a.data.y, 6, a.data.pace || 0.9)) this.begin("park", "Stopped for a look around", { len: 1.5 + this.rand() * 2.5 });
        else if (a.t > 15) this.think();
        a.data.check = (a.data.check || 0) + dt;
        if (a.data.check > 0.7) {
          a.data.check = 0;
          const b = this.pickBall();
          if (b && Math.hypot(b.x - this.x, b.y - this.y) < 130 && this.rand() < 0.4 + T.tidy * 0.6) this.start("clean", { ball: b });
        }
        break;
      }
      case "park": {
        if (a.data.spot && a.ph === 0) { this.lookAt(...a.data.spot); if (this.navigate(dt, a.data.spot[0], a.data.spot[1], 8, 0.9)) a.ph = 1; break; }
        a.data.next = (a.data.next ?? 0.5) - dt;
        if (a.data.next <= 0) {
          a.data.next = 0.7 + this.rand() * 1.5;
          a.data.gaze = [this.x + (this.rand() - 0.5) * 160, this.y + (this.rand() - 0.5) * 160];
          if (this.rand() < 0.35) a.data.turn = this.heading + (this.rand() - 0.5) * 2.2;
        }
        if (t && !t.on) this.lookAt(t.x, t.y); else if (a.data.gaze) this.lookAt(...a.data.gaze);
        if (a.data.turn !== undefined) { if (this.turnTo(dt, a.data.turn, 0.4)) a.data.turn = undefined; }
        else this.brake(dt);
        this.boredom = Math.max(0, this.boredom - dt * 0.02);
        if (a.t > (a.data.len || 4)) this.think();
        break;
      }
      case "edge": {
        const o = a.data.o;
        this.brushT = 1; this.sucking = true;
        if (a.data.race) this.mood = "happy";
        if (a.ph === 0) {
          const p0 = a.data.p0 || (a.data.p0 = this.edgeStart(o));
          this.lookAt(o.x, o.y);
          if (this.navigate(dt, p0[0], p0[1], 9, a.data.pace)) {
            const n = normal(o, this.x, this.y);
            a.data.side = -n[1] * Math.cos(this.heading) + n[0] * Math.sin(this.heading) >= 0 ? 1 : -1;
            a.data.prev = Math.atan2(this.y - o.y, this.x - o.x); a.data.swept = 0; a.ph = 1;
          }
        } else {
          // It hugs this widget's own outline. Where a wall or another widget leaves no room, it
          // turns back and cleans the other way, and stops when it's blocked that way too.
          let p = this.aroundAhead(o, a.data.side, LOOKAHEAD, BRUSH_GAP);
          if (this.field(p[0], p[1]) < RR + 0.3) {
            if (!a.data.reversed) {
              a.data.reversed = true; a.data.side = -a.data.side;
              this.thought = `No room past that corner, so it's cleaning back round ${o.name} the other way`;
              p = this.aroundAhead(o, a.data.side, LOOKAHEAD, BRUSH_GAP);
            } else { this.happy = Math.min(1, this.happy + 0.04); this.boredom = Math.max(0, this.boredom - 0.3); this.think(); break; }
          }
          this.steer(dt, p[0], p[1], VMAX * T.zip * a.data.pace);
          const ang = Math.atan2(this.y - o.y, this.x - o.x);
          a.data.swept += wrap(ang - a.data.prev); a.data.prev = ang;
          if (Math.abs(a.data.swept) > TAU + 0.5) { this.happy = Math.min(1, this.happy + 0.06); this.boredom = Math.max(0, this.boredom - 0.4); this.think(); }
        }
        if (a.t > 30) this.think();
        break;
      }
      case "clean": {
        const b = a.data.ball;
        this.brushT = 1; this.sucking = true;
        if (!b || b.gone) {
          const next = this.pickBall();
          if (next && !this.needsHome() && this.rand() < 0.8) this.begin("clean", "Next one!", { ball: next });
          else { this.think(); if (this.act.kind !== "clean") this.thought = `All clean. Bin's ${Math.round(this.bin * 100)}% full`; }
          this.brake(dt);
          break;
        }
        if (b.held && b.held !== this) { this.think(); break; }
        this.lookAt(b.x, b.y);
        if (this.drains.length) {
          this.brake(dt); this.mood = "focus";
          this.squashT = 0.06 * Math.max(0, Math.sin(this.clock * 12));
          this.thought = b.r > 10 ? `Slurping up the big puddle, ${Math.round((b.r / b.r0) * 100)}% left` : "Slurp…";
          break;
        }
        if (b.speed > 80) { this.brake(dt); break; }
        // It rolled somewhere it can't drive to: leave it for later, unless it already meant to climb.
        a.data.check = (a.data.check || 0) + dt;
        if (a.data.check > 1.2 && !this.climbing) {
          a.data.check = 0;
          if (!b.climbFor && !this.canReach(b)) { b.noRoute = this.clock; this.think(); if (this.act.kind !== "clean") this.thought = "That one rolled out of reach. Later"; break; }
        }
        if (this.navigate(dt, b.x, b.y, RR * 0.9 + b.r * 0.9, 1)) {
          // Arrived: nose in if there's room, otherwise face it and let the suction reach.
          const d = Math.hypot(b.x - this.x, b.y - this.y) || 1;
          if (!this.blocked((b.x - this.x) / d, (b.y - this.y) / d, Math.min(12, d))) this.steer(dt, b.x, b.y, 14);
          else this.turnTo(dt, Math.atan2(b.y - this.y, b.x - this.x), 0.6);
        }
        if (a.t > 25) { this.think(); this.thought = "Couldn't reach that one"; }
        break;
      }
      case "bumper": {
        const b = a.data.ball;
        if (!b || b.gone || b.held) { this.think(); break; }
        this.lookAt(b.x, b.y); this.mood = "happy";
        if (a.data.back > 0) { a.data.back -= dt; this.drive(dt, -24, 0); break; }
        if (a.data.kicks >= a.data.max) { this.begin("clean", "Fun's over. Tidying the ball away", { ball: b }); break; }
        if (b.speed > 120) { this.brake(dt); break; }
        a.data.check = (a.data.check || 0) + dt;
        if (a.data.check > 1 && !this.climbing) {
          a.data.check = 0;
          if (!this.canReach(b)) { b.noRoute = this.clock; this.think(); if (this.act.kind !== "bumper") this.thought = "Kicked it out of reach. Oops"; break; }
        }
        if (this.navigate(dt, b.x, b.y, RR + b.r + 1.5, 1.3)) {
          const c = Math.cos(this.heading), s = Math.sin(this.heading);
          b.vx += c * 170 + (this.rand() - 0.5) * 60; b.vy += s * 170 - 200; b.landed = false;
          a.data.kicks += 1; a.data.back = 0.35; this.bumpT = 0.25; this.squash = 0.3; this.nav = null;
          this.thought = `Bumper ball! Kick ${a.data.kicks}`;
          this.marks.push({ type: "text", text: "boop", x: b.x, y: b.y - 12, age: 0, life: 0.8, col: ACC });
        }
        break;
      }
      case "visit": {
        const goal = t && !t.on ? [t.x, t.y] : this.lastTouch;
        if (!goal) { this.think(); break; }
        this.lookAt(goal[0], goal[1]);
        if (a.ph === 0) {
          if (t && t.speed > 60) this.thought = "Following your finger";
          if (this.navigate(dt, goal[0], goal[1], RR + 18, 1.05)) { a.ph = 1; a.data.t1 = 0; this.social = Math.max(0, this.social - 0.35); this.thought = t ? "Circling your finger" : "Waiting where you last touched"; }
          if (a.t > 14) this.think();
          break;
        }
        a.data.t1 += dt;
        if (t && !t.on) {
          const d = Math.hypot(this.x - t.x, this.y - t.y);
          if (d > 75) { a.ph = 0; this.nav = null; this.brake(dt); break; }
          const ang = Math.atan2(this.y - t.y, this.x - t.x) + this.pref * 0.55, ox = t.x + Math.cos(ang) * 36, oy = t.y + Math.sin(ang) * 36;
          this.mood = "happy";
          if (this.field(ox, oy) > EDGE_GAP) this.steer(dt, ox, oy, VMAX * 0.7 * T.zip);
          else this.turnTo(dt, Math.atan2(t.y - this.y, t.x - this.x), 0.5);
          if (a.data.t1 > 7) this.think();
        } else {
          this.brake(dt);
          if (a.data.t1 < 1.4) this.jitT = Math.sin(this.clock * 9) * 0.1;
          if (a.data.t1 > 3.5) this.think();
        }
        break;
      }
      case "nudge": {
        const o = a.data.o;
        this.lookAt(o.x, o.y);
        if (a.ph === 0) {
          const q = a.data.q || (a.data.q = this.edgeStart(o));
          if (this.navigate(dt, q[0], q[1], 6, 0.9)) a.ph = 1;
        } else if (a.ph === 1) {
          const n = normal(o, this.x, this.y);
          if (this.turnTo(dt, Math.atan2(-n[1], -n[0]), 0.6) || a.t > 12) { a.ph = 2; a.data.t1 = 0; }
        } else if (a.ph === 2) {
          a.data.t1 += dt;
          this.drive(dt, 16, 0);
          if (sdf(o, this.x, this.y) < RR + 1.5 || a.data.t1 > 1.5) {
            const n = normal(o, this.x, this.y);
            o.jvx = (o.jvx || 0) - n[0] * 70; o.jvy = (o.jvy || 0) - n[1] * 70;
            this.bumpT = 0.3; this.squash = 0.25; a.ph = 3; a.data.t1 = 0;
            this.marks.push({ type: "text", text: a.data.word, x: o.x, y: o.y - o.hh - 8, age: 0, life: 1, col: CYAN });
          }
        } else {
          a.data.t1 += dt; this.drive(dt, -22, 0); this.mood = "happy";
          if (a.data.t1 > 0.55) { this.boredom = Math.max(0, this.boredom - 0.3); this.think(); }
        }
        break;
      }
      case "zoomies": {
        this.mood = "happy";
        if (!a.data.goal) a.data.goal = this.freeSpot(90);
        if (this.navigate(dt, a.data.goal[0], a.data.goal[1], 16, 2.1)) {
          if (--a.data.n <= 0) { this.happy = Math.min(1, this.happy + 0.1); this.begin("park", "Phew. Catching its breath", { len: 2 }); break; }
          a.data.goal = this.freeSpot(90); this.nav = null;
        }
        break;
      }
      case "dance": this.runDance(dt, a); break;
      case "angry": {
        this.mood = "angry"; this.brushT = 0;
        a.data.steam = (a.data.steam ?? 0) - dt;
        if (a.data.steam <= 0) { a.data.steam = 0.45; this.marks.push({ type: "steam", x: this.x, y: this.y - 14, age: 0, life: 0.9 }); }
        if (t) a.data.last = [t.x, t.y];
        if (a.ph === 0) {
          // Revving up: an intentional, furious shake in place.
          this.brake(dt);
          this.jitT = Math.sin(this.clock * 62) * 0.26 * (1 - a.t / 0.6);
          this.shakeT = [Math.sin(this.clock * 71) * 0.8, 0];
          if (a.t > 0.6) { a.ph = 1; this.thought = "Tickled! Now it's chasing your finger"; }
        } else if (a.ph === 1) {
          const goal = a.data.last;
          if (a.t % 1.2 < 0.13) this.jitT = Math.sin(this.clock * 70) * 0.16;
          this.lookAt(goal[0], goal[1]);
          if (this.navigate(dt, goal[0], goal[1], RR + 7, 1.8)) {
            if (t) { this.marks.push({ type: "burst", x: t.x, y: t.y, age: 0, life: 0.5, col: RED }); this.marks.push({ type: "text", text: "bonk!", x: t.x, y: t.y - 16, age: 0, life: 0.9, col: RED }); this.anger -= 0.35; a.ph = 2; a.data.t1 = 0; this.thought = "Bonk! Got your finger"; }
            else { a.ph = 3; a.data.t1 = 0; a.data.turn = this.heading + 1.4; this.thought = "Lost you. Looking around, still cross"; }
          }
          if (a.t > a.data.len || this.anger < 0.12) a.ph = 4;
        } else if (a.ph === 2) {
          a.data.t1 += dt; this.drive(dt, -30, 0);
          if (a.data.t1 > 0.45) { a.ph = this.anger > 0.25 && a.t < a.data.len ? 1 : 4; if (a.ph === 1) this.thought = "Still cross. After you again"; }
        } else if (a.ph === 3) {
          a.data.t1 += dt;
          if (t) { a.ph = 1; this.nav = null; }
          else if (this.turnTo(dt, a.data.turn, 0.6)) a.data.turn = this.heading - 2.4 * Math.sign(wrap(a.data.turn - this.heading) || 1);
          if (a.data.t1 > 1.8) a.ph = 4;
        } else {
          const away = Math.atan2(this.y - a.data.last[1], this.x - a.data.last[0]);
          if (this.turnTo(dt, away, 0.7) || a.data.t4 > 1.2) {
            this.anger = Math.min(this.anger, 0.1);
            this.start("explore", { p: this.freeSpot(100) });
            this.thought = "Hmph. Driving off in a huff";
          }
          a.data.t4 = (a.data.t4 || 0) + dt;
        }
        break;
      }
      case "purr": {
        const stroking = t && t.on === "roomba" && Math.hypot(t.x - this.x, t.y - this.y) < RR + 16;
        if (stroking) a.data.last = a.t;
        this.mood = "happy";
        if (stroking && t.speed > 10) { this.happy = Math.min(1, this.happy + dt * 0.1); this.social = Math.max(0, this.social - dt * 0.3); }
        a.data.h = (a.data.h ?? 0.2) - dt;
        if (a.data.h <= 0) { a.data.h = 0.7; this.marks.push({ type: "heart", x: this.x + (this.rand() - 0.5) * 10, y: this.y - 18, age: 0, life: 1.3 }); }
        if (stroking) this.turnTo(dt, Math.atan2(t.y - this.y, t.x - this.x), 0.22); else this.brake(dt);
        this.jitT = Math.sin(this.clock * 8) * 0.05;
        if (a.t - (a.data.last || 0) > 1.4) { this.think(); this.thought = "That was nice"; }
        break;
      }
      case "boop": {
        const tp = a.data.at;
        this.lookAt(tp[0], tp[1]);
        if (a.t < 0.3) { this.brake(dt); this.mood = "wide"; this.squashT = 0.25; break; }
        this.mood = a.data.annoyed ? "angry" : "happy";
        if (a.data.annoyed) {
          if (this.turnTo(dt, Math.atan2(this.y - tp[1], this.x - tp[0]), 0.6) || a.t > 1.6) { this.start("explore", { p: this.freeSpot(90) }); this.thought = "Hmph. That's enough boops. Rolling off"; }
          break;
        }
        if (a.data.spin) {
          this.drive(dt, 0, WMAX * this.pref);
          a.data.turned = (a.data.turned || 0) + Math.abs(this.spin) * dt;
          if (a.data.turned > TAU - 0.5) { a.data.spin = false; a.data.end = a.t + 0.5; }
          break;
        }
        this.turnTo(dt, Math.atan2(tp[1] - this.y, tp[0] - this.x), 0.5);
        if (a.t > 0.8 && !a.data.end && !a.data.spun && T.playful > 0.55) { a.data.spun = true; a.data.spin = true; this.thought = "Boop! A happy little spin"; }
        else if (a.t > 0.8 && !a.data.end && !a.data.spin) a.data.end = a.t + 0.4;
        if (a.data.end && a.t > a.data.end) this.think();
        break;
      }
      case "startle": {
        this.mood = "wide";
        if (a.t < 0.3) { this.jitT = Math.sin(this.clock * 55) * 0.2 * (1 - a.t / 0.3); this.brake(dt); break; }
        const b = a.data.ball;
        this.brake(dt);
        if (a.t > 0.7) {
          if (b && !b.gone && T.playful > 0.55) this.start("bumper", { ball: b });
          else { this.anger = Math.min(1, this.anger + 0.2 * T.grumpy); this.think(); }
        }
        break;
      }
      case "held": {
        this.kinematic = true;
        if (!t) { this.release(0, 0, false); break; }
        const hv = a.data.hv || (a.data.hv = [0, 0]);
        const ax = (t.x - this.x) * 140 - hv[0] * 15, ay = (t.y + 5 - this.y) * 140 - hv[1] * 15;
        hv[0] += ax * dt; hv[1] += ay * dt; this.x += hv[0] * dt; this.y += hv[1] * dt;
        // It dangles, so it swings against how your finger moves.
        const c = Math.cos(this.heading), s = Math.sin(this.heading);
        this.tiltF = ease(this.tiltF, clamp(-(ax * c + ay * s) * 0.0022, -5, 5), 14, dt);
        this.tiltS = ease(this.tiltS, clamp(-(-ax * s + ay * c) * 0.0022, -5, 5), 14, dt);
        this.z = ease(this.z, 22, 7, dt);
        this.heading = wrap(this.heading + Math.sin(this.clock * 1.3) * 0.25 * dt);
        const content = this.happy > 0.62;
        this.wheelA += dt * (content ? 5 : 26);
        this.mood = a.t < 0.45 ? "wide" : content ? "happy" : "wide";
        this.thought = content ? "Up we go! It likes being carried" : "Wheels spinning in the air. Put it down!";
        break;
      }
      case "slide": {
        this.kinematic = true;
        const s = a.data, g = this.groundUnder();
        if (this.z > g + 0.05 || this.vz > 0) {
          this.vz -= 1100 * dt; this.z += this.vz * dt;
          if (this.z <= g) {
            const hit = -this.vz; this.z = g;
            if (hit > 110) { this.vz = hit * 0.3; s.impact = Math.max(s.impact || 0, hit); this.squash = clamp(hit / 800, 0.12, 0.4); } else this.vz = 0;
          }
        }
        const air = this.z > g + 0.5;
        s.vx *= Math.exp(-dt * (air ? 0.15 : 2.6)); s.vy *= Math.exp(-dt * (air ? 0.15 : 2.6)); s.spin *= Math.exp(-dt * (air ? 0.2 : 2));
        this.x += s.vx * dt; this.y += s.vy * dt; this.heading = wrap(this.heading + s.spin * dt);
        if (g < 2) {
          const f = this.field(this.x, this.y);
          if (f < RR) {
            const n = this.fieldN(this.x, this.y), vn = s.vx * n[0] + s.vy * n[1];
            this.x += n[0] * (RR - f); this.y += n[1] * (RR - f);
            if (vn < 0) {
              s.vx -= 1.5 * vn * n[0]; s.vy -= 1.5 * vn * n[1]; s.spin += (this.rand() - 0.5) * 5;
              if (-vn > 80) {
                s.hard = (s.hard || 0) + 1; this.bumpT = 0.3;
                this.marks.push({ type: "burst", x: this.x - n[0] * RR, y: this.y - n[1] * RR, age: 0, life: 0.4, col: INK });
                let near = null, nd = 1e9; for (const o of this.items) { const dd = sdf(o, this.x, this.y); if (dd < nd) { nd = dd; near = o; } }
                if (near && nd < RR + 2) { near.jvx = (near.jvx || 0) - n[0] * Math.min(90, -vn * 0.4); near.jvy = (near.jvy || 0) - n[1] * Math.min(90, -vn * 0.4); }
              }
            }
          }
        }
        this.wheelA += dt * 10; this.v = 0; this.spin = 0; this.mood = "wide";
        if (!air && this.vz === 0 && Math.hypot(s.vx, s.vy) < 8 && Math.abs(s.spin) < 0.4) {
          if (sdf(this.dock, this.x, this.y) < -4) { this.begin("docked", "Put back in its dock. Charging", { need: 0.3 }); break; }
          if (g > 2) { this.think(); break; }
          if (s.hard || (s.impact > 200 && this.rand() < 0.5)) this.begin("dizzy", s.hard ? "Bonked off the walls. Dizzy…" : "Dropped! A bit dizzy…");
          else { this.think(); this.thought = s.impact ? "Landed with a little bounce" : "Slid to a stop"; }
        }
        break;
      }
      case "dizzy": {
        this.brake(dt);
        const k = clamp(1 - a.t / 1.7, 0, 1);
        this.mood = "dizzy";
        this.jitT = Math.sin(a.t * 7) * 0.32 * k;
        this.shakeT = [Math.cos(a.t * 7) * 1.3 * k, Math.sin(a.t * 7) * 0.7 * k];
        a.data.star = (a.data.star ?? 0) - dt;
        if (a.data.star <= 0 && a.t < 1.5) { a.data.star = 0.22; const an = a.t * 6; this.marks.push({ type: "spark", x: this.x + Math.cos(an) * 12, y: this.y - 10 + Math.sin(an) * 4, dx: -Math.sin(an) * 8, dy: Math.cos(an) * 3, age: 0, life: 0.5, col: AMBER }); }
        if (a.t > 1.7 && a.t < 2.0) { this.jitT = Math.sin(this.clock * 48) * 0.16; this.mood = "blink"; }
        if (a.t >= 2.0) { this.think(); this.thought = "Shook it off"; }
        break;
      }
      default: this.think();
    }
  }

  // ======== dancing ========
  runDance(dt, a) {
    const m = this.w.music, mu = this.items.find((o) => o.kind === "music");
    if (!m.on) { this.dance = null; this.think(); this.thought = "The music stopped, so it went back to its day"; return; }
    if (a.ph === 0) {
      const spot = a.data.spot || (a.data.spot = [mu.x + 8 + (this.rand() - 0.5) * 24, mu.y - mu.hh - RR - 22]);
      this.lookAt(mu.x, mu.y);
      if (this.navigate(dt, spot[0], spot[1], 4, 1.15)) { a.ph = 1; a.data.x0 = this.x; a.data.y0 = this.y; }
      return;
    }
    this.kinematic = true; this.v = 0; this.spin = 0;
    const bar = Math.floor(m.beat / 8);
    if (!this.dance || this.dance.bar !== bar) {
      let tot = 0, pick = null;
      for (const d of ROOMBA_DANCES) if (!this.dance || d.id !== this.dance.id) tot += d.w;
      let r = this.rand() * tot;
      for (const d of ROOMBA_DANCES) { if (this.dance && d.id === this.dance.id) continue; r -= d.w; if (r <= 0) { pick = d; break; } }
      pick = pick || ROOMBA_DANCES[0];
      this.dance = { id: pick.id, name: pick.name, bar, b0: bar * 8 };
      const fresh = !this.danceSeen.has(pick.id);
      this.danceSeen.add(pick.id);
      this.thought = fresh ? `A new dance: ${pick.name}!` : `Dancing ${pick.name}`;
      this.happy = Math.min(1, this.happy + 0.04);
    }
    const D = this.dance, b = m.beat, lb = Math.max(0, b - D.b0), f = b % 1, p = m.pulse;
    const hb = Math.PI / 2, A = [a.data.x0, a.data.y0];
    const fwd = (u, v) => [A[0] + Math.cos(hb) * u - Math.sin(hb) * v, A[1] + Math.sin(hb) * u + Math.cos(hb) * v];
    let [tx, ty] = A, th = hb;
    this.mood = p > 0.55 ? "happy" : "open";
    switch (D.id) {
      case "shimmy": th = hb + 0.24 * Math.sin(b * TAU * 2) * m.level; [tx, ty] = fwd(0, 2.5 * m.sway); break;
      case "bump": [tx, ty] = fwd(7 * p, 0); this.tiltFT = -1.6 * p; break;
      case "pirouette": { const k = lb % 4; th = hb + (k < 2 ? TAU * smooth(k / 2) : 0); if (k >= 2) this.tiltFT = -2.2 * p; break; }
      case "box": {
        const k = Math.floor(lb) % 4, e = smooth(Math.min(1, (lb % 1) / 0.55)), C = [[0, 0], [16, 0], [16, 16], [0, 16], [0, 0]];
        [tx, ty] = fwd(lerp(C[k][0], C[k + 1][0], e) - 8, lerp(C[k][1], C[k + 1][1], e) - 8);
        th = hb + Math.atan2(C[k + 1][1] - C[k][1], C[k + 1][0] - C[k][0]);
        break;
      }
      case "nod": this.tiltFT = -3.2 * p; this.squashT = 0.1 * p; th = hb + 0.1 * m.sway; break;
      case "eight": { const q = (lb / 8) * TAU; [tx, ty] = fwd(10 * Math.sin(2 * q), 24 * Math.sin(q)); const du = 20 * Math.cos(2 * q), dv = 24 * Math.cos(q); th = hb + Math.atan2(dv, du); break; }
      case "lights": this.mood = "eq"; th = hb + 0.12 * m.sway; break;
      case "moonwalk": { const k = lb % 4, back = k < 3 ? k / 3 : 1 - smooth(k - 3); [tx, ty] = fwd(-16 * back, 0); if (k < 3) this.wheelA += dt * 9; break; }
    }
    this.x = ease(this.x, tx, 10, dt); this.y = ease(this.y, ty, 10, dt);
    this.heading = wrap(this.heading + wrap(th - this.heading) * (1 - Math.exp(-10 * dt)));
    if (p > 0.95 && this.rand() < 0.35) this.marks.push({ type: "note", x: this.x + (this.rand() - 0.5) * 22, y: this.y - 20, age: 0, life: 1.1, col: [ACC, CYAN, GREEN][Math.floor(this.rand() * 3)] });
  }

  // ======== suction ========
  mouth() { const h = this.heading; return [this.x + Math.cos(h) * RR * 0.78, this.y + Math.sin(h) * RR * 0.78]; }
  /** A ball in front of it, close enough, is lifted off the cloth and pulled in; heavier ones come slower. */
  suction(dt) {
    for (const b of this.w.balls) if (b.suckBy === this) { b.lift = 0; b.pull = null; b.suckBy = null; }
    if (!this.sucking || this.act.kind === "held" || this.groundUnder() > 2) { this.releaseDrains(); return; }
    const [mx, my] = this.mouth(), c = Math.cos(this.heading), s = Math.sin(this.heading);
    for (const b of this.w.balls) {
      if (b.held || b.gone || b.drain) continue;
      const dx = mx - b.x, dy = my - b.y, d = Math.hypot(dx, dy) || 1e-3, reach = RR * 2.2 + b.r;
      if (d > reach) continue;
      const front = -(dx * c + dy * s) / d;
      if (front < 0.05 && d > b.r + 3) continue;
      const k = Math.pow(1 - d / reach, 1.3), heavy = Math.max(1, (b.r * b.r) / 40);
      b.suckBy = this; b.lift = Math.min(1, 0.55 + k * 1.5);
      b.pull = [((dx / d) * 520 * k) / heavy, ((dy / d) * 520 * k) / heavy];
      if (d < RR * 0.25 + b.r * 0.85) {
        b.drain = true; b.vx = b.vy = 0; b.lift = 0; b.pull = null; b.suckBy = null;
        this.drains.push(b);
      }
    }
  }
  /** Drinks a ball by area, so a big rain ball takes a while and shrinks toward its mouth as it goes. */
  drainStep(dt) {
    if (!this.drains.length) return;
    const [mx, my] = this.mouth();
    for (const b of this.drains) {
      let dx = b.x - mx, dy = b.y - my; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      b.x = ease(b.x, mx + dx * b.r * 0.55, 5, dt); b.y = ease(b.y, my + dy * b.r * 0.55, 5, dt);
      const area = Math.PI * b.r * b.r, rate = 75 + area * 0.11, next = Math.max(0, area - rate * dt);
      b.r = Math.sqrt(next / Math.PI);
      this.bin = Math.min(1, this.bin + (area - next) / 7000);
      if (b.r < 1.1) {
        b.gone = true; this.cleaned += 1; this.happy = Math.min(1, this.happy + 0.06);
        this.marks.push({ type: "burst", x: mx, y: my - RH * TILT, age: 0, life: 0.45, col: b.rain ? CYAN : INK });
      }
    }
    this.drains = this.drains.filter((b) => !b.gone);
    if (this.w.balls.some((b) => b.gone)) { const keep = this.w.balls.filter((b) => !b.gone); this.w.balls.length = 0; this.w.balls.push(...keep); }
  }
  releaseDrains() { for (const b of this.drains) { b.drain = false; b.landed = false; } this.drains = []; }

  // ======== touch ========
  hit(x, y) { const p = project(this.x, this.y, this.z + RH); return Math.hypot(x - p[0], y - p[1]) < RR + 6 ? "roomba" : null; }
  down(t) {
    this.seen = this.w.clock; this.heatAdd(t.x, t.y); this.lastTouch = [t.x, t.y];
    if (t.on) { t.tk = { rev: 0, lvx: 0, lvy: 0, revAt: -9, stroke: 0 }; return; }
    const b = this.w.balls.find((q) => !q.held && !q.drain && Math.hypot(q.x - t.x, q.y - t.y) < q.r + 14);
    if (b) { t.ball = b; b.held = "finger"; b.z = 13; b.drain = false; }
  }
  move(t, d) {
    this.seen = this.w.clock; this.lastTouch = [t.x, t.y];
    const k = this.act.kind;
    if (t.on !== "roomba" || k === "held" || k === "slide" || k === "angry") return;
    if (Math.hypot(t.x - this.x, t.y - this.y) > RR + 16) return;
    const tk = t.tk;
    // A tickle is a fast rub: the finger keeps reversing on top of it.
    if (t.speed > 150) {
      const lv = Math.hypot(tk.lvx, tk.lvy);
      if (lv > 150 && (t.vx * tk.lvx + t.vy * tk.lvy) / (t.speed * lv) < -0.2) { tk.rev += 1; tk.revAt = this.w.clock; }
      tk.lvx = t.vx; tk.lvy = t.vy;
    }
    if (this.w.clock - tk.revAt > 0.7) tk.rev = 0;
    if (tk.rev >= 2 && tk.rev < 4) { this.squirmT = 0.4; this.thought = "Squirming. It doesn't like that"; }
    if (tk.rev >= 4) return this.tickled();
    if (t.speed < 260 && t.speed > 12) {
      tk.stroke += d;
      if (tk.stroke > 34 && k !== "purr" && !t.petted) { t.petted = true; this.pets += 1; this.begin("purr", "Being petted. It's purring", {}); }
    }
  }
  tickled() {
    this.tickles += 1;
    this.anger = Math.min(1, 0.55 + this.traits.grumpy * 0.45);
    this.releaseDrains();
    this.begin("angry", "Tickled! It's revving up…", { len: 3 + this.traits.grumpy * 3.5, last: this.w.touch ? [this.w.touch.x, this.w.touch.y] : [this.x, this.y] });
  }
  long(t) {
    if (t.on !== "roomba" || ["held", "slide"].includes(this.act.kind)) return;
    this.releaseDrains(); this.climbing = null;
    this.begin("held", "Picked up!", { hv: [0, 0] });
    this.marks.push({ type: "text", text: "!", x: this.x, y: this.y - 22, age: 0, life: 0.7, col: AMBER });
  }
  release(vx, vy, flick) {
    const hv = this.act.data.hv || [0, 0], sp = Math.hypot(vx, vy), cap = Math.min(1, 520 / Math.max(sp, 1));
    this.begin("slide", flick ? "Wheee! Flung across the screen" : "Set down", {
      vx: flick ? vx * cap : hv[0] * 0.3, vy: flick ? vy * cap : hv[1] * 0.3, spin: flick ? (this.rand() - 0.5) * 9 : 0,
    });
    this.vz = flick ? 90 : 0;
  }
  up(t, gesture, vx, vy) {
    this.seen = this.w.clock;
    if (this.act.kind === "held") { this.release(vx, vy, gesture === "flick" || Math.hypot(vx, vy) > 300); return; }
    if (t.ball) {
      const b = t.ball; b.held = null; b.z = 0; b.landed = false;
      if (gesture === "flick") { const s = Math.min(1, 900 / Math.hypot(vx, vy)); b.vx = vx * s; b.vy = vy * s; } else { b.vx = 0; b.vy = 0; }
      return;
    }
    if (t.on === "roomba") {
      const k = this.act.kind;
      if (k === "angry" || k === "slide") return;
      if (gesture === "tap") {
        const now = this.w.clock;
        this.boops = this.boops.filter((q) => now - q < 4); this.boops.push(now);
        const annoyed = this.boops.length >= 3 && this.traits.grumpy > 0.55;
        this.social = Math.max(0, this.social - 0.15);
        if (!annoyed) this.happy = Math.min(1, this.happy + 0.06);
        this.squash = 0.3;
        this.begin("boop", annoyed ? "Boop, boop, boop… that's enough" : "Boop! It turned to look at you", { at: [t.x, t.y], annoyed });
        this.marks.push({ type: "text", text: annoyed ? "hey!" : "!", x: this.x, y: this.y - 22, age: 0, life: 0.8, col: annoyed ? RED : CYAN });
      } else if (gesture === "flick") {
        this.releaseDrains();
        const s = Math.min(1, 420 / Math.hypot(vx, vy));
        this.begin("slide", "Shoved! Sliding…", { vx: vx * s, vy: vy * s, spin: (this.rand() - 0.5) * 8 });
        this.vz = 0;
      }
      return;
    }
    if (gesture === "flick") this.throwBall(t.x, t.y, vx, vy);
    else if (gesture === "tap" && this.calm() && this.rand() < 0.35 + this.traits.clingy * 0.5) { this.start("visit"); this.thought = "You tapped over there, so it came to look"; }
  }
  throwBall(x, y, vx, vy) {
    const free = this.w.balls.filter((b) => !b.held && !b.rain && !b.drain);
    if (free.length >= 4) this.w.balls.splice(this.w.balls.indexOf(free[0]), 1);
    const s = Math.min(1, 900 / Math.hypot(vx, vy));
    this.w.balls.push(new Ball(x, y, 6.5, { vx: vx * s, vy: vy * s }));
  }
  key() { this.seen = this.w.clock; this.throwBall(W / 2, H - 60, (this.x - W / 2) * 1.3, -480); }
  ballLanded(b) {
    if (!this.calm() || this.act.kind === "visit" || b.speed > 90) return;
    if (Math.hypot(b.x - this.x, b.y - this.y) > 240) return;
    if (!b.rain && b.r < 9 && this.rand() < this.traits.playful * 0.5) this.start("bumper", { ball: b });
    else if (this.rand() < 0.35 + this.traits.tidy * 0.6) this.start("clean", { ball: b });
  }
  /** Balls bounce off its body; one that hits it hard makes it jump. */
  bodyBlocks(b) {
    if (b.suckBy === this || b.drain || this.act.kind === "held" || this.z - this.groundUnder() > 6 || this.act.kind === "docked") return;
    const dx = b.x - this.x, dy = b.y - this.y, d = Math.hypot(dx, dy), m = RR + b.r;
    if (d >= m || d < 1e-4) return;
    const nx = dx / d, ny = dy / d;
    b.x = this.x + nx * m; b.y = this.y + ny * m;
    const rvx = b.vx - Math.cos(this.heading) * this.v, rvy = b.vy - Math.sin(this.heading) * this.v, vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny;
      if (-vn > 170 && !b.rain && this.calm()) {
        this.begin("startle", "Bonk! A ball hit it", { ball: b });
        this.squash = 0.3; this.marks.push({ type: "text", text: "!", x: this.x, y: this.y - 22, age: 0, life: 0.7, col: AMBER });
      }
    }
  }
  musicChanged(on) {
    this.seen = this.w.clock;
    if (on && this.calm()) this.start("dance");
  }

  // ======== drawing ========
  bodyPt(f, s, zl, out) {
    const h = this.heading + this.jit, c = Math.cos(h), sn = Math.sin(h), fx = f * RR, sx = s * RR;
    out[0] = this.x + this.shake[0] + c * fx - sn * sx;
    out[1] = this.y + this.shake[1] + sn * fx + c * sx;
    out[2] = this.z + zl + this.tiltF * f + this.tiltS * s;
    return out;
  }
  press(fab) {
    if (this.act.kind !== "held" && this.z - this.groundUnder() < 3 && !widgetAt(this.items, this.x, this.y)) fab.press(this.x, this.y, RR * 1.05, this.sucking ? 1 : 0);
    // The slurp: a neck of cloth from each ball it's drinking to its mouth.
    const m = this.mouth();
    for (const b of this.drains) for (let k = 1; k <= 3; k++) { const u = k / 4; fab.press(lerp(b.x, m[0], u), lerp(b.y, m[1], u), lerp(b.r * 0.55, 2, u), b.rain ? 1 : 0); }
  }
  drawShadow(ctx) {
    const g = this.groundUnder(), h = Math.max(0, this.z - g);
    const v = project(this.x + h * SHADOW_X, this.y + h * SHADOW_Y, g);
    const r = RR * (1.08 + h * 0.012), a = 0.55 * clamp(1 - h / 70, 0.25, 1);
    ctx.save(); ctx.translate(v[0], v[1]); ctx.scale(r, r * 0.92);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.7, `rgba(0,0,0,${a * 0.6})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  lightAt(a) {
    const k = this.act.kind, cl = this.clock;
    if (this.ring != null) {
      // Riding the spider's line on the website, the ring fills as the reader goes down the
      // page, flashes green at the bottom, and breathes low while it dozes.
      const u = ((((a + Math.PI / 2) % TAU) + TAU) % TAU) / TAU, on = clamp((this.ring - u) * 24 + 0.5, 0, 1);
      const f = this.ringFlash || 0, d = this.doze || 0, br = 1 - d * (0.5 - 0.25 * Math.sin(cl * 1.8));
      return [f > 0 ? mix(CYAN, GREEN, Math.min(1, f * 2)) : CYAN, (0.1 + 0.72 * on + f * 0.5 * Math.abs(Math.sin(cl * 9))) * br];
    }
    if (k === "angry") return [RED, 0.55 + 0.4 * Math.abs(Math.sin(cl * 9))];
    if (k === "docked" && this.battery < 1) return [GREEN, 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(a - cl * 3)) * (0.6 + 0.4 * Math.sin(cl * 2))];
    if (this.battery < LOW_BATTERY + 0.04) return [AMBER, Math.sin(cl * 5) > 0 ? 0.85 : 0.2];
    if (k === "dance" && this.dance) { const m = this.w.music, hue = [ACC, CYAN, GREEN, AMBER][Math.floor(m.beat) % 4]; return [hue, 0.3 + 0.65 * Math.max(m.pulse, Math.max(0, Math.cos(a - m.beat * Math.PI)) * 0.6)]; }
    if (k === "zoomies") return [[ACC, CYAN, GREEN, AMBER][Math.floor((a + Math.PI + cl * 8) / (TAU / 4)) % 4], 0.85];
    if (this.mood === "happy") return [GREEN, 0.45 + 0.3 * Math.sin(cl * 3)];
    if (this.sucking && this.brushOn > 0.3) return [CYAN, 0.2 + 0.7 * Math.pow(Math.max(0, Math.cos(a - cl * 5)), 2)];
    return [CYAN, 0.3];
  }
  draw(ctx) {
    const w = [0, 0, 0];
    const sq = this.squash, top = RH * (1 - sq * 0.45), grow = 1 + sq * 0.07;
    const up = this.z - this.groundUnder();
    const P = (f, s, zl) => { this.bodyPt(f * grow, s * grow, zl, w); return project(w[0], w[1], w[2], [0, 0]); };
    const hd = this.heading + this.jit;
    // The side brush, under the body.
    if (this.brushOn > 0.03 && up < 3) {
      const c = P(0.64, 0.68, 0.4);
      for (let arm = 0; arm < 3; arm++) for (let k = 1; k <= 4; k++) {
        const ang = -this.brushA + (arm * TAU) / 3 + k * 0.14, rr = k * 2.3;
        ctx.fillStyle = rgba(INK, 0.6 * this.brushOn * (1 - k * 0.13));
        ctx.beginPath(); ctx.arc(c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr * 0.85, 0.72, 0, TAU); ctx.fill();
      }
    }
    // Wheels, when it's off the ground: they drop down and spin.
    if (up > 2.5) {
      const drop = clamp((up - 2.5) / 8, 0, 1) * 3;
      for (const s of [1, -1]) {
        for (let k = 0; k < 7; k++) {
          const a = this.wheelA + (k / 7) * TAU, f = Math.cos(a) * 0.3, zl = -drop + Math.sin(a) * 2.6 + 1.5;
          const p = P(f, s * 0.7, zl);
          ctx.fillStyle = rgba(INK, 0.3 + 0.4 * (Math.sin(a) > 0 ? 1 : 0.4));
          ctx.beginPath(); ctx.arc(p[0], p[1], 0.85, 0, TAU); ctx.fill();
        }
      }
    }
    // The puck's silhouette, filled, so the cloth never shows between its dots.
    const N = 40, out = [];
    let prevLow = null;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * TAU, low = Math.sin(hd + a) > 0;
      if (prevLow !== null && low !== prevLow) { out.push(P(Math.cos(a), Math.sin(a), prevLow ? 0 : top)); }
      out.push(P(Math.cos(a), Math.sin(a), low ? 0 : top));
      prevLow = low;
    }
    ctx.fillStyle = "#110e19";
    ctx.beginPath(); out.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    if (this.smooth) {
      ctx.beginPath();
      for (let k = 0; k <= N; k++) { const a = (k / N) * TAU, p = P(Math.cos(a), Math.sin(a), top + 0.4); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      const c = P(-0.3, -0.35, top), gr = ctx.createRadialGradient(c[0], c[1], 1, c[0], c[1], RR * 1.6);
      gr.addColorStop(0, "#3a3446"); gr.addColorStop(1, "#16121e"); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = rgba(INK, 0.25); ctx.lineWidth = 0.8; ctx.stroke();
    }
    // The side wall you can see, with the bumper bright across its front.
    const flash = this.bumpT / 0.3;
    for (const q of ROOMBA_MODEL.wall) {
      const wa = hd + q.a, nx = Math.cos(wa), ny = Math.sin(wa);
      if (ny < -0.05) continue;
      if (this.smooth && q.zl !== 3.0) continue;
      const p = P(Math.cos(q.a), Math.sin(q.a), (q.zl * top) / RH);
      const bumper = Math.cos(q.a) > 0.45;
      const lit = 0.2 + 0.4 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]) + 0.2 * ny + (bumper ? 0.18 + flash * 0.5 : 0);
      ctx.fillStyle = rgba(bumper && flash > 0 ? mix(INK, ACC, flash) : INK, lit);
      ctx.beginPath(); ctx.arc(p[0], p[1], 0.85, 0, TAU); ctx.fill();
    }
    // The top: a gentle dome of dots, the rim lit as its light ring.
    for (const q of ROOMBA_MODEL.top) {
      const rim = q.rho > 0.8;
      if (this.smooth && !rim) continue;
      const zl = top + 1.0 * (1 - Math.pow(q.rho, 4));
      const p = P(q.f, q.s, zl);
      const wa = hd + q.a, sl = Math.pow(q.rho, 3) * 1.3;
      const nx = Math.cos(wa) * sl, ny = Math.sin(wa) * sl, nl = Math.hypot(nx, ny, 1);
      const lit = (nx * LIGHT[0] + ny * LIGHT[1] + LIGHT[2]) / nl;
      let col = INK, al = 0.12 + lit * 0.72, r = 0.92;
      if (rim) { const L = this.lightAt(q.a); col = L[0]; al = L[1]; r = 1.02; }
      ctx.fillStyle = rgba(col, al);
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
    }
    // The face: a little visor that always faces you, sitting toward the way it's heading.
    const fc = P(0.3, 0, top + 1.25), vw = 21 * grow, vh = 11.5 * grow;
    ctx.fillStyle = "rgba(6,5,10,0.94)";
    ctx.beginPath(); ctx.roundRect(fc[0] - vw / 2, fc[1] - vh / 2, vw, vh, vh / 2); ctx.fill();
    this.drawEyes(ctx, fc[0], fc[1]);
    // The slurp: specks running from each ball into its mouth.
    if (this.drains.length) {
      const m = this.mouth(), mp = project(m[0], m[1], this.z + 1.5);
      for (const b of this.drains) {
        const bp = project(b.x, b.y, 0);
        for (let i = 0; i < 5; i++) {
          const u = (this.clock * 2.4 + i / 5) % 1;
          ctx.fillStyle = rgba(b.rain ? CYAN : INK, 0.8 * Math.sin(u * Math.PI));
          ctx.beginPath(); ctx.arc(lerp(bp[0], mp[0], u), lerp(bp[1], mp[1], u), 0.9, 0, TAU); ctx.fill();
        }
      }
    }
  }
  drawEyes(ctx, cx, cy) {
    let mood = this.mood;
    if (this.blinkT > 0 && (mood === "open" || mood === "focus" || mood === "wide")) mood = "blink";
    const low = this.battery < LOW_BATTERY + 0.04;
    const col = mood === "angry" ? RED : low && mood !== "happy" ? AMBER : INK;
    const dim = this.act.kind === "docked" && mood === "sleepy" ? 0.55 : 1;
    const pitch = 1.12, lx = this.lookX, ly = this.lookY;
    ctx.fillStyle = rgba(col, 0.95 * dim);
    for (const side of [-1, 1]) {
      const ex = cx + side * 4.7 + lx, ey = cy + ly;
      if (mood === "dizzy") {
        for (let i = 0; i < 8; i++) { const ang = this.clock * 8 * side + i * 0.85, r = 0.3 + i * 0.32; ctx.beginPath(); ctx.arc(ex + Math.cos(ang) * r, ey + Math.sin(ang) * r, 0.5, 0, TAU); ctx.fill(); }
        continue;
      }
      if (mood === "eq") {
        const m = this.w.music;
        for (let c = 0; c < 3; c++) { const h = Math.round(m.bar(c + (side > 0 ? 4 : 0)) * 5); for (let r = 0; r < h; r++) { ctx.fillStyle = rgba(mix(INK, ACC, r / 5), 0.95); ctx.beginPath(); ctx.arc(ex + (c - 1) * pitch * 1.4, ey + 2.2 - r * pitch, 0.5, 0, TAU); ctx.fill(); } }
        continue;
      }
      let rows = EYE_GLYPHS[mood] || EYE_GLYPHS.open;
      if (mood === "angry" && side > 0) rows = rows.map((r) => [...r].reverse().join(""));
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === "1") {
        ctx.beginPath(); ctx.arc(ex + (c - 2) * pitch, ey + (r - 2) * pitch, 0.52, 0, TAU); ctx.fill();
      }
    }
  }
  drawHome(ctx, o) {
    const docked = this.act.kind === "docked", charging = docked && this.battery < 1;
    // Drawn for a dock it faces up into; a page can turn the dock to face another way.
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(this.face + Math.PI / 2); ctx.translate(-o.x, -o.y);
    // The back wall: an arc of dots round the top of the pad.
    for (let k = 0; k <= 16; k++) {
      const a = -Math.PI * 0.86 + (k / 16) * Math.PI * 0.72;
      ctx.fillStyle = rgba(INK, 0.5);
      ctx.beginPath(); ctx.arc(o.x + Math.cos(a) * o.r * 0.84, o.y + Math.sin(a) * o.r * 0.84, 1.1, 0, TAU); ctx.fill();
    }
    // Two charging contacts and the pad's light.
    ctx.fillStyle = rgba(INK, 0.35);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(o.x + s * 7 - 2, o.y - 9, 4, 7, 2); ctx.fill(); }
    const led = charging ? GREEN : CYAN, la = charging ? 0.5 + 0.45 * Math.sin(this.clock * 3) : 0.55;
    ctx.fillStyle = rgba(led, la); ctx.beginPath(); ctx.arc(o.x, o.y - o.r * 0.84 - 0.5, 1.6, 0, TAU); ctx.fill();
    if (!docked) {
      // An empty pad shows where it goes home: a faint ring.
      ctx.strokeStyle = rgba(INK, 0.12); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(o.x, o.y, RR + 1, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  drawOver(ctx) {
    for (const m of this.marks) {
      if (m.type === "text") {
        const k = m.age / m.life;
        ctx.fillStyle = rgba(m.col || INK, 0.95 * (1 - k * k)); ctx.font = `700 9px ${FONT_MONO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(m.text, m.x, m.y - k * 12);
      } else drawMark(ctx, m);
    }
    if (this.battery < LOW_BATTERY + 0.04 && this.act.kind !== "docked" && Math.sin(this.clock * 5) > 0) {
      // A low-battery sign over its head.
      const p = project(this.x, this.y, this.z + RH + 2);
      ctx.strokeStyle = rgba(AMBER, 0.9); ctx.lineWidth = 1; ctx.strokeRect(p[0] - 5, p[1] - 22, 9, 5); ctx.fillStyle = rgba(AMBER, 0.9); ctx.fillRect(p[0] + 4, p[1] - 20.5, 1.5, 2); ctx.fillRect(p[0] - 4, p[1] - 21, 2, 3);
    }
  }

  learned() {
    const out = [];
    const spot = this.heatSpot();
    if (spot) out.push(`You usually touch ${placeName(spot[0], spot[1])}, so it waits there.`);
    if (this.cleaned) out.push(`Cleaned up ${this.cleaned} thing${this.cleaned > 1 ? "s" : ""} so far.`);
    if (this.tickles) out.push(`Tickled ${this.tickles} time${this.tickles > 1 ? "s" : ""}. It stays cross for about ${Math.round(3 + this.traits.grumpy * 3.5)} s.`);
    if (this.pets) out.push(`Petted ${this.pets} time${this.pets > 1 ? "s" : ""}. It comes to you more.`);
    return out;
  }
}
