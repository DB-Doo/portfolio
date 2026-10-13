"use strict";
/*
 * The jumping spider: a 3D salticid built of the canvas's own dots, with a mind that is wary of you
 * at first and learns, touch by touch, to trust you, play fetch, ride your finger and dance.
 * Units: SU is one spider unit in canvas pixels; the body is about 4.8 SU long.
 */

const SU = 9;
const PIVOT_F = -1.05;          // the waist (pedicel): the head pitches about it
const LIFT = 0.95;              // resting height of the head's centre above its feet, SU
const FINGER_Z = 13;            // a fingertip's height above the cloth, px
const SP = {
  hipF: [0.55, 0.22, -0.12, -0.45], hipS: 0.62, hipU: -0.32,
  footF: [2.25, 1.15, -0.65, -1.95], footS: [1.35, 2.35, 2.35, 1.85],
  femur: [1.45, 1.35, 1.3, 1.6], tibia: [1.6, 1.45, 1.45, 1.9], thick: [1.35, 1.05, 1.0, 1.12],
  airF: [2.5, 1.25, -0.75, -2.7], airS: [0.85, 1.75, 1.8, 1.05], airU: [0.15, -0.35, -0.55, -0.75],
};
const legGroup = (l) => ((l % 4) + (l < 4 ? 0 : 1)) % 2;

// ---------- the body, as dots ----------
const SPIDER_MODEL = (() => {
  function shell(n, p, seed) {
    const r = rng(seed), out = [], g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const up = 1 - ((i + 0.5) / n) * 2, rr = Math.sqrt(1 - up * up), t = g * i;
      const df = Math.cos(t) * rr, ds = Math.sin(t) * rr, du = up;
      const k = Math.pow(Math.pow(Math.abs(df), p) + Math.pow(Math.abs(ds), p) + Math.pow(Math.abs(du), p), -1 / p);
      const f = df * k, s = ds * k, u = du * k;
      const pw = (v) => Math.sign(v) * Math.pow(Math.abs(v), p - 1);
      const fuzz = 1 + (r() - 0.5) * 0.1;
      out.push({ f: f * fuzz, s: s * fuzz, u: u * fuzz, nf: pw(f), ns: pw(s), nu: pw(u) });
    }
    return out;
  }
  function part(n, p, seed, cf, cu, rf, rs, ru, colour) {
    const out = shell(n, p, seed).map((q) => {
      const nf = q.nf / rf, ns = q.ns / rs, nu = q.nu / ru, nl = Math.hypot(nf, ns, nu) || 1;
      return { f: cf + q.f * rf, s: q.s * rs, u: cu + q.u * ru, nf: nf / nl, ns: ns / nl, nu: nu / nl, col: colour(q), nb: [] };
    });
    // Each dot's nearest neighbours, so the Mesh fabric can draw the body as a wire shell.
    out.forEach((a, i) => {
      const near = [];
      out.forEach((b, j) => { if (j !== i) near.push([j, (a.f - b.f) ** 2 + (a.s - b.s) ** 2 + (a.u - b.u) ** 2]); });
      near.sort((x, y) => x[1] - y[1]);
      a.nb = near.slice(0, 3).map((x) => x[0]).filter((j) => j > i);
    });
    return out;
  }
  // The head: boxy, with a dark face round the eyes and pale "brows" above them.
  const ceph = part(220, 3.2, 7, 0, 0, 1.22, 1.0, 0.8, (q) =>
    q.f > 0.78 && q.u < 0.42 && q.u > -0.66 ? 3 : q.u > 0.5 && q.f > 0.3 && Math.abs(q.s) < 0.82 ? 2 : 0);
  // The abdomen: rounder, with the accent spots a Phidippus wears and a pale band across its front.
  const abd = part(260, 2.15, 11, -2.2, 0.12, 1.42, 1.12, 0.95, (q) => {
    if (q.u > 0.16) {
      const spot = (f, s, a, b) => ((q.f - f) / a) ** 2 + ((q.s - s) / b) ** 2 < 1;
      if (spot(0.05, 0, 0.3, 0.2) || spot(-0.42, 0.46, 0.16, 0.14) || spot(-0.42, -0.46, 0.16, 0.14) || spot(-0.8, 0, 0.12, 0.12)) return 1;
      if (q.f > 0.7) return 2;
    }
    return q.u < -0.35 ? 3 : 0;
  });
  const n = (v) => { const l = Math.hypot(...v); return v.map((q) => q / l); };
  const eyes = [];
  for (const side of [1, -1]) {
    eyes.push({ f: 1.2, s: 0.41 * side, u: 0.06, r: 0.38, n: n([1, 0.16 * side, 0.08]), big: true });
    eyes.push({ f: 1.06, s: 0.8 * side, u: 0.17, r: 0.17, n: n([0.62, 0.72 * side, 0.25]) });
    eyes.push({ f: -0.2, s: 0.79 * side, u: 0.52, r: 0.12, n: n([-0.1, 0.6 * side, 0.8]) });
  }
  return { ceph, abd, eyes };
})();

const SPIDER_DANCES = [
  { id: "sway", name: "the sway", w: 4 },
  { id: "bob", name: "the bob", w: 4 },
  { id: "semaphore", name: "semaphore arms", w: 3 },
  { id: "drum", name: "the drum roll", w: 3 },
  { id: "zigzag", name: "the zigzag", w: 2.2 },
  { id: "hop", name: "beat hops", w: 2 },
  { id: "spin", name: "the quarter turn", w: 1.4 },
  { id: "fan", name: "the peacock fan", w: 0.8 },
];

const SPIDER_NAMES = ["Juno", "Pepper", "Kiwi", "Boots", "Pixel", "Mabel", "Ziggy", "Olive"];

const TRUST_STAGES = [
  [0.2, "Wary"], [0.45, "Curious"], [0.7, "Friendly"], [0.88, "Bonded"], [2, "Best friends"],
];

class JumpingSpider {
  constructor(world, seed) {
    this.w = world; this.items = world.items; this.rand = rng(seed * 13 + 1);
    this.nest = this.items.find((o) => o.home);
    this.x = this.nest.x; this.y = this.nest.y + 2; this.heading = Math.PI * 0.6;
    this.ground = WIDGET_TOP; this.lift = 0.6; this.liftT = 0.6; this.z = this.ground + this.lift * SU;
    this.pitch = 0; this.pitchT = 0; this.abdTilt = 0; this.abdTiltT = 0; this.abdS = 0;
    this.ox = 0; this.oy = 0; this.bob = 0; this.speed = 0; this.vx = 0; this.vy = 0;
    this.palpT = 0; this.palpAmp = 0; this.palpAmpT = 0; this.clock = 0; this.eyeShine = 1;
    this.jump = null; this.burst = null; this.carrying = null; this.riding = false; this.arms = null;
    this.fx = []; this.marks = [];
    this.orient();
    this.feet = [];
    for (let l = 0; l < 8; l++) { const p = this.idealAt(l, this.x, this.y, [0, 0, 0]); this.feet.push({ x: p[0], y: p[1], z: p[2], st: "plant", t: 0 }); }
    this.lastGroup = 1;
    // Mind
    const r = this.rand;
    this.traits = { bold: 0.2 + r() * 0.6, playful: 0.45 + r() * 0.55, curious: 0.55 + r() * 0.45, cuddly: 0.3 + r() * 0.7 };
    this.name = SPIDER_NAMES[Math.floor(r() * SPIDER_NAMES.length)];
    this.trust = 0.15; this.energy = 0.9; this.boredom = 0.35; this.joy = 0.4;
    this.fetchLove = 0.15; this.gentle = 0.5; this.fetches = 0; this.touches = 0; this.sinceGroom = 0;
    this.heat = new Float32Array(6 * 11); this.danceSeen = new Set(); this.dance = null;
    this.thought = ""; this.act = null; this.tried = 0; this.trustNote = "";
    this.begin("emerge", "Asleep in its nest");
  }

  // ======== body ========
  orient() { this.fx = Math.cos(this.heading); this.fy = Math.sin(this.heading); this.sx = -this.fy; this.sy = this.fx; }
  /** A point on the body, local (forward, side, up) in SU, to the canvas. The head pitches about the waist. */
  xf(f, s, u, pitch, out) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), pf = f - PIVOT_F;
    const rf = PIVOT_F + pf * cp - u * sp, ru = pf * sp + u * cp;
    out[0] = this.x + this.ox + (this.fx * rf + this.sx * s) * SU;
    out[1] = this.y + this.oy + (this.fy * rf + this.sy * s) * SU;
    out[2] = this.z + ru * SU;
    return out;
  }
  xn(nf, ns, nu, pitch, out) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), rf = nf * cp - nu * sp, ru = nf * sp + nu * cp;
    out[0] = this.fx * rf + this.sx * ns; out[1] = this.fy * rf + this.sy * ns; out[2] = ru;
    return out;
  }
  /** Relative to the body without pitch: for leg poses. */
  local(f, s, u, out) {
    out = out || [0, 0, 0];
    out[0] = this.x + this.ox + (this.fx * f + this.sx * s) * SU; out[1] = this.y + this.oy + (this.fy * f + this.sy * s) * SU; out[2] = this.z + u * SU;
    return out;
  }
  get abdPitch() { return -0.35 * this.pitch + this.abdTilt; }
  spinnerets() { return this.xf(-3.55, this.abdS, 0.05, this.abdPitch, [0, 0, 0]); }
  mouth() { return this.xf(1.95, 0, -0.35, this.pitch, [0, 0, 0]); }
  surface(x, y) { return this.riding ? FINGER_Z : groundAt(this.items, x, y); }
  idealAt(l, X, Y, out) {
    const p = l % 4, side = l < 4 ? 1 : -1, f = SP.footF[p], s = SP.footS[p] * side;
    out[0] = X + (this.fx * f + this.sx * s) * SU + this.vx * 0.05;
    out[1] = Y + (this.fy * f + this.sy * s) * SU + this.vy * 0.05;
    out[2] = this.surface(out[0], out[1]);
    return out;
  }
  inBounds() { this.x = clamp(this.x, 14, W - 14); this.y = clamp(this.y, 44, H - 14); }
  advance(step) { this.x += this.fx * step; this.y += this.fy * step; this.inBounds(); }
  halt(dt) { this.speed = ease(this.speed, 0, 30, dt); }
  /** Turns in little jerks, the way a salticid swivels to look: intentional, not path correction. */
  turnTo(a, dt, rate) {
    const d = wrap(a - this.heading);
    const pulse = 0.25 + 1.6 * Math.max(0, Math.sin(this.clock * 26));
    const lim = rate * dt * pulse;
    this.heading = wrap(this.heading + clamp(d, -lim, lim));
    this.orient();
    return Math.abs(wrap(a - this.heading)) < 0.05;
  }
  face(x, y, dt, rate = 7) { return this.turnTo(Math.atan2(y - this.y, x - this.x), dt, rate); }
  /** Runs in quick dashes with short stops, re-aiming between them. */
  burstTo(dt, gx, gy, stop, pace = 1) {
    const dx = gx - this.x, dy = gy - this.y, dist = Math.hypot(dx, dy);
    let B = this.burst || (this.burst = { ph: "aim", t: 0, left: 0, hold: 0 });
    B.t += dt;
    if (dist <= stop + 1.5) { this.halt(dt); this.burst = null; return true; }
    const a = Math.atan2(dy, dx);
    if (B.ph === "pause") { this.halt(dt); if (B.t >= B.hold) { B.ph = "aim"; B.t = 0; } return false; }
    if (B.ph === "aim") {
      this.halt(dt);
      if (this.turnTo(a, dt, 10) || B.t > 0.9) { B.ph = "dash"; B.t = 0; B.left = Math.min(dist - stop, (2.4 + this.rand() * 4.2) * SU * (0.75 + pace * 0.25)); }
      return false;
    }
    this.turnTo(a, dt, 3);
    const top = 11 * SU * pace;
    this.speed = ease(this.speed, top * clamp(B.left / (1.1 * SU), 0.3, 1), 30, dt);
    const step = Math.min(this.speed * dt, B.left);
    this.advance(step); B.left -= step;
    if (B.left <= 0.3) { B.ph = "pause"; B.t = 0; B.hold = (0.07 + this.rand() * 0.42) / Math.max(0.6, pace); }
    return false;
  }
  /** A slow, low stalk. */
  creepTo(dt, gx, gy, stop, pace = 1) {
    const dist = Math.hypot(gx - this.x, gy - this.y);
    this.liftT = 0.7;
    if (dist <= stop) { this.halt(dt); return true; }
    const a = Math.atan2(gy - this.y, gx - this.x);
    this.turnTo(a, dt, 4);
    const facing = Math.max(0, Math.cos(wrap(a - this.heading)));
    this.speed = ease(this.speed, 2.3 * SU * pace * facing, 10, dt);
    this.advance(Math.min(this.speed * dt, dist - stop));
    return false;
  }
  jumpTo(tx, ty, opts) {
    opts = opts || {};
    this.burst = null;
    this.jump = { ph: "aim", t: 0, tx: clamp(tx, 14, W - 14), ty: clamp(ty, 44, H - 14), hop: !!opts.hop, onLand: opts.onLand, silk: opts.silk !== false, ground: opts.ground };
  }
  stepJump(dt) {
    const j = this.jump;
    j.t += dt;
    if (j.ph === "aim") {
      const d = Math.hypot(j.tx - this.x, j.ty - this.y);
      if (j.hop || d < 6 || this.face(j.tx, j.ty, dt, 11) || j.t > 0.8) { j.ph = "crouch"; j.t = 0; }
      return;
    }
    if (j.ph === "crouch") {
      this.liftT = 0.5; this.pitchT = 0.12;
      if (j.t >= (j.hop ? 0.07 : 0.15)) {
        j.ph = "fly"; j.t = 0; j.x0 = this.x; j.y0 = this.y; j.z0 = this.z;
        const d = Math.hypot(j.tx - j.x0, j.ty - j.y0);
        j.g1 = j.ground ?? groundAt(this.items, j.tx, j.ty);
        j.T = j.hop ? 0.24 : clamp(0.2 + d / 640, 0.22, 0.56);
        j.h = j.hop ? 6 : 7 + d * 0.22;
        if (j.silk && d > 34) {
          const sp = this.spinnerets();
          j.thread = { ax: sp[0], ay: sp[1], az: groundAt(this.items, sp[0], sp[1]), bx: sp[0], by: sp[1], bz: sp[2], age: 0, life: 80 + this.rand() * 60, wob: 0, wobV: 0, flying: true, seed: this.rand() };
          this.w.silk.push(j.thread);
        }
        for (const f of this.feet) f.st = "air";
      }
      return;
    }
    if (j.ph === "fly") {
      const s = clamp(j.t / j.T, 0, 1);
      this.x = lerp(j.x0, j.tx, s); this.y = lerp(j.y0, j.ty, s);
      this.z = lerp(j.z0, j.g1 + 0.62 * SU, s) + 4 * j.h * s * (1 - s);
      this.pitch = lerp(0.3, -0.22, s); this.pitchT = this.pitch;
      this.ground = lerp(this.ground, j.g1, s);
      if (j.thread) { const sp = this.spinnerets(); j.thread.bx = sp[0]; j.thread.by = sp[1]; j.thread.bz = sp[2]; }
      if (s >= 1) {
        j.ph = "land"; j.t = 0; this.ground = j.g1; this.lift = 0.62;
        const p = [0, 0, 0];
        for (let l = 0; l < 8; l++) { this.idealAt(l, this.x, this.y, p); const f = this.feet[l]; f.x = p[0]; f.y = p[1]; f.z = p[2]; f.st = "plant"; }
        if (j.thread) { const sp = this.spinnerets(); j.thread.flying = false; j.thread.bx = sp[0]; j.thread.by = sp[1]; j.thread.bz = j.g1; }
        this.w.fabric && this.marks.push({ type: "land", x: this.x, y: this.y, age: 0, life: 0.35 });
      }
      return;
    }
    if (j.ph === "land") {
      this.liftT = LIFT;
      if (j.t >= 0.13) { this.jump = null; if (j.onLand) j.onLand(); }
    }
  }

  legTarget(l, out) {
    const p = l % 4, side = l < 4 ? 1 : -1, j = this.jump;
    if (j && j.ph === "fly") {
      const s = clamp(j.t / j.T, 0, 1), land = smooth((s - 0.55) / 0.45);
      this.local(SP.airF[p], SP.airS[p] * side, SP.airU[p], out);
      if (land > 0) {
        const q = this.idealAt(l, j.tx, j.ty, [0, 0, 0]);
        out[0] = lerp(out[0], q[0], land); out[1] = lerp(out[1], q[1], land); out[2] = lerp(out[2], q[2], land);
      }
      out[3] = 999; return out;
    }
    if (this.riding) {
      // Gripping round a fingertip: legs pulled in, feet at the finger's height.
      this.local(SP.footF[p] * 0.5, SP.footS[p] * side * 0.48, 0, out);
      out[2] = FINGER_Z - 1 + Math.abs(SP.footF[p]) * 0.6;
      out[3] = 999; return out;
    }
    if (p === 0 && this.arms) { const r = this.arms(l, side, out); if (r) return r; }
    if (p === 2 && this.dance && this.dance.id === "fan" && this.w.music.on) {
      this.local(-0.9, side * 2.0, 0.7 + this.w.music.pulse * 0.3, out); out[3] = 20; return out;
    }
    return null;
  }
  legs(dt) {
    const p = [0, 0, 0, 0], q = [0, 0, 0];
    let stepping = false;
    for (let l = 0; l < 8; l++) {
      const f = this.feet[l], tg = this.legTarget(l, p);
      if (tg) {
        if (tg[3] >= 999) { f.x = tg[0]; f.y = tg[1]; f.z = tg[2]; }
        else { const k = 1 - Math.exp(-dt * tg[3]); f.x += (tg[0] - f.x) * k; f.y += (tg[1] - f.y) * k; f.z += (tg[2] - f.z) * k; }
        f.st = "pose"; continue;
      }
      if (f.st === "pose" || f.st === "air") { f.st = "step"; f.t = 0; f.T = 0.11; f.fx = f.x; f.fy = f.y; f.fz = f.z; f.h = 0.25 * SU; }
      if (f.st === "step") {
        stepping = true;
        f.t = Math.min(1, f.t + dt / f.T);
        this.idealAt(l, this.x, this.y, q);
        const e = smooth(f.t);
        f.x = lerp(f.fx, q[0], e); f.y = lerp(f.fy, q[1], e); f.z = lerp(f.fz, q[2], e) + Math.sin(Math.PI * f.t) * f.h;
        if (f.t >= 1) f.st = "plant";
      }
    }
    if (stepping) return;
    const moving = this.speed > SU, trig = (moving ? 0.8 : 0.3) * SU;
    const err = [0, 0];
    for (let l = 0; l < 8; l++) {
      const f = this.feet[l]; if (f.st !== "plant") continue;
      this.idealAt(l, this.x, this.y, q);
      err[legGroup(l)] = Math.max(err[legGroup(l)], Math.hypot(q[0] - f.x, q[1] - f.y), Math.abs(q[2] - f.z) * 2);
    }
    if (err[0] < trig && err[1] < trig) return;
    const g = err[0] >= trig && err[1] >= trig ? 1 - this.lastGroup : err[0] >= trig ? 0 : 1;
    this.lastGroup = g;
    const T = moving ? clamp((0.9 * SU) / this.speed, 0.055, 0.11) : 0.1;
    for (let l = 0; l < 8; l++) {
      const f = this.feet[l]; if (f.st !== "plant" || legGroup(l) !== g) continue;
      this.idealAt(l, this.x, this.y, q);
      const d = Math.hypot(q[0] - f.x, q[1] - f.y);
      if (!moving && d < 0.1 * SU && Math.abs(q[2] - f.z) < 1) continue;
      f.st = "step"; f.t = 0; f.T = T; f.fx = f.x; f.fy = f.y; f.fz = f.z; f.h = Math.min(0.9 * SU, 0.2 * SU + d * 0.3);
    }
  }

  // ======== mind ========
  get stage() { for (const [t, name] of TRUST_STAGES) if (this.trust < t) return name; return "Best friends"; }
  gainTrust(a, why) {
    const before = this.trust;
    if (a > 0) this.trust = Math.min(1, this.trust + a * (1 - this.trust * 0.6) * (0.6 + this.gentle * 0.7));
    else this.trust = Math.max(0, this.trust + a * (1.3 - this.traits.bold));
    if (why && Math.abs(this.trust - before) > 0.004) { this.trustNote = `${a > 0 ? "Trust up" : "Trust down"}: ${why}`; this.trustNoteT = 4; }
  }
  heatAdd(x, y) {
    const c = clamp(Math.floor(x / 50), 0, 5), r = clamp(Math.floor((y - 40) / 52), 0, 10);
    for (let i = 0; i < this.heat.length; i++) this.heat[i] *= 0.97;
    this.heat[r * 6 + c] += 1;
  }
  /** Where it thinks you usually touch: the busiest cell of what it has seen. */
  heatSpot() {
    let best = -1, v = 0.5;
    for (let i = 0; i < this.heat.length; i++) if (this.heat[i] > v) { v = this.heat[i]; best = i; }
    if (best < 0) return null;
    return [(best % 6) * 50 + 25, 40 + Math.floor(best / 6) * 52 + 26];
  }
  freeBall() {
    let best = null, bd = 1e9;
    for (const b of this.w.balls) {
      if (b.held || b.gone || b.r > 11) continue;
      if (b.thrownBy === "spider" && this.w.clock - b.thrownAt < 7) continue;
      const d = Math.hypot(b.x - this.x, b.y - this.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  begin(kind, why, data) {
    this.act = { kind, t: 0, data: data || {}, ph: 0 };
    this.burst = null;
    if (why) this.thought = why;
  }
  /** What next: everything it could do, scored by how it feels, with a pinch of chance. */
  think() {
    const T = this.traits, opts = [];
    const ball = this.freeBall();
    const add = (kind, u, why, data) => opts.push({ kind, u: u * (0.75 + this.rand() * 0.5), why, data });
    if (this.w.music.on) add("dance", 1.0 + T.playful * 0.6, "Your music is on, so it's going to dance");
    if (ball) {
      const fetchy = this.trust >= 0.85 && this.fetchLove > 0.25;
      add("hunt", 0.35 + T.playful * 0.45 + (fetchy ? 0.5 : 0), fetchy ? "It wants to play fetch, so it's going for the ball" : "Spotted a ball, so it's stalking it", { ball, invite: fetchy });
    }
    add("wander", 0.25 + this.boredom * (0.5 + T.curious * 0.7), null);
    add("survey", 0.32, "Looking around");
    add("groom", 0.1 + (this.sinceGroom > 18 ? 0.35 : 0), "Cleaning its eyes with its front legs");
    if (this.trust >= 0.88 && !ball && this.heatSpot()) add("invite", 0.12 + this.fetchLove * 0.4, "Waiting where you usually touch, hoping you'll play");
    add("rest", (1 - this.energy) * 1.7, "Tired, so it's going home to its nest");
    opts.sort((a, b) => b.u - a.u);
    const o = opts[0];
    if (o.kind === "wander") { const tgt = this.pickWander(); this.begin("wander", tgt.why, tgt); }
    else this.begin(o.kind, o.why, o.data);
  }
  pickWander() {
    const r = this.rand();
    const others = this.items.filter((o) => !o.home && Math.hypot(o.x - this.x, o.y - this.y) > 45);
    if (r < 0.5 && others.length) {
      const o = others[Math.floor(this.rand() * others.length)];
      const jx = o.x + (this.rand() - 0.5) * o.hw * 0.6, jy = o.y + (this.rand() - 0.5) * o.hh * 0.6;
      return { x: jx, y: jy, perch: o, why: `Off to stand on ${o.name}` };
    }
    for (let k = 0; k < 12; k++) {
      const x = 24 + this.rand() * (W - 48), y = 60 + this.rand() * (H - 110);
      if (Math.hypot(x - this.x, y - this.y) < 60) continue;
      return { x, y, why: `Exploring ${placeName(x, y)}` };
    }
    return { x: W / 2, y: H / 2, why: "Exploring the middle" };
  }
  /** What it will do with a ball it catches, by how much it trusts you. */
  carryPlan() { return this.trust >= 0.7 ? (this.unanswered >= 2 ? "keep" : "toss") : this.trust >= 0.45 ? "bring" : "keep"; }

  // ======== each frame ========
  step(dt) {
    this.clock += dt; this.palpT += dt;
    this.sinceGroom += dt;
    this.energy = clamp(this.energy - dt * 0.004, 0, 1);
    this.boredom = clamp(this.boredom + dt * 0.02 * (0.5 + this.traits.curious), 0, 1);
    this.joy = ease(this.joy, 0.35, 0.05, dt);
    if (this.trustNoteT > 0) { this.trustNoteT -= dt; if (this.trustNoteT <= 0) this.trustNote = ""; }
    for (const m of this.marks) m.age += dt;
    this.marks = this.marks.filter((m) => m.age < m.life);

    // Defaults each frame; the act below shapes them.
    this.arms = null; this.liftT = LIFT; this.pitchT = 0; this.abdTiltT = 0; this.palpAmpT = 0.15;
    this.ox = ease(this.ox, 0, 10, dt); this.oy = ease(this.oy, 0, 10, dt); this.abdS = ease(this.abdS, 0, 10, dt);
    this.eyeShine = ease(this.eyeShine, 1, 3, dt);

    const t = this.w.touch;
    if (t && t.ball) { t.ball.x = t.x; t.ball.y = t.y - 2; t.ball.vx = t.vx; t.ball.vy = t.vy; }
    if (t && !t.on && !this.riding) this.noticeTouch(t);

    const x0 = this.x, y0 = this.y;
    if (this.jump) this.stepJump(dt);
    if (!this.jump) this.run(dt);
    if (this.jump && this.jump.ph !== "fly") this.halt(dt);
    this.vx = (this.x - x0) / Math.max(dt, 1e-3); this.vy = (this.y - y0) / Math.max(dt, 1e-3);
    if (Math.hypot(this.vx, this.vy) > 30 * SU) { this.vx = 0; this.vy = 0; }

    // Body: height, pitch, palps, breath.
    if (!this.jump || this.jump.ph !== "fly") {
      this.ground = ease(this.ground, this.surface(this.x, this.y), 16, dt);
      this.lift = ease(this.lift, this.liftT, 14, dt);
      this.pitch = ease(this.pitch, this.pitchT, 8, dt);
      const breathe = Math.sin(this.clock * 2.1) * 0.25;
      this.z = this.ground + this.lift * SU + this.bob + breathe;
    }
    this.abdTilt = ease(this.abdTilt, this.abdTiltT, 9, dt);
    this.palpAmp = ease(this.palpAmp, this.palpAmpT, 6, dt);
    this.orient();
    this.legs(dt);
    if (this.carrying) {
      const m = this.mouth(), b = this.carrying;
      b.x = m[0] + this.fx * b.r * 0.6; b.y = m[1] + this.fy * b.r * 0.6; b.z = Math.max(0, m[2] - b.r * 0.4); b.vx = 0; b.vy = 0;
    }
  }

  /** A finger on the canvas: it looks, and its trust decides what comes next. */
  noticeTouch(t) {
    const k = this.act.kind;
    const d = Math.hypot(t.x - this.x, t.y - this.y);
    if (k === "flee" || k === "peek" || this.jump) return;
    if (t.speed > 650 && d < 80 && this.trust < 0.5 && k !== "chase") {
      this.gainTrust(-0.025, "a sudden swipe right by it");
      return this.flee(t.x, t.y, "Startled by a fast finger, so it jumped away");
    }
    if (["survey", "wander", "perch", "groom", "await", "invite", "emerge"].includes(k) || (k === "rest" && this.act.ph === 0)) {
      if (k === "emerge" && this.act.ph === 0) return;
      this.begin("watch", this.trust < 0.2 ? "Watching your finger, warily" : "Turned to look at you");
    }
  }
  flee(fx, fy, why) {
    let best = null, bs = -1;
    for (let k = 0; k < 16; k++) {
      let x, y, perch = null;
      if (k < this.items.length && this.rand() < 0.7) { perch = this.items[k]; x = perch.x; y = perch.y; }
      else { x = 24 + this.rand() * (W - 48); y = 60 + this.rand() * (H - 110); }
      const away = Math.hypot(x - fx, y - fy), hop = Math.hypot(x - this.x, y - this.y);
      if (hop > 170 || hop < 40) continue;
      const s = Math.min(away, 200) + (perch ? 30 : 0) - hop * 0.2 + this.rand() * 20;
      if (s > bs) { bs = s; best = [x, y]; }
    }
    if (!best) best = [clamp(this.x + (this.x - fx), 20, W - 20), clamp(this.y + (this.y - fy), 60, H - 20)];
    if (this.carrying) this.drop();
    this.begin("flee", why, { fx, fy });
    this.jumpTo(best[0], best[1], { onLand: () => this.begin("peek", "Keeping an eye on you from a safe spot", { fx, fy, len: 1.5 + (1 - this.traits.bold) * 2.5 }) });
  }
  drop() { const b = this.carrying; if (!b) return; b.held = null; b.z = 0; b.landed = false; this.carrying = null; }

  run(dt) {
    const a = this.act, T = this.traits, touch = this.w.touch;
    a.t += dt;
    switch (a.kind) {
      case "emerge": {
        this.liftT = 0.55; this.palpAmpT = 0.05; this.eyeShine = 0.5;
        if (a.t > 1.2 && !this.jump) {
          const p = [this.nest.x - 40, this.nest.y + 70];
          a.ph = 1;
          this.jumpTo(p[0], p[1], { onLand: () => this.begin("survey", "Woke up and hopped out of its nest", { len: 2 }) });
        }
        break;
      }
      case "survey":
      case "perch":
      case "peek": {
        if (a.kind === "peek") { this.liftT = 0.72; this.palpAmpT = 0.03; this.face(a.data.fx, a.data.fy, dt, 6); }
        else {
          const moving = this.w.balls.find((b) => !b.held && b.speed > 90 && Math.hypot(b.x - this.x, b.y - this.y) < 220);
          if (moving) { this.face(moving.x, moving.y, dt, 8); this.palpAmpT = 0.7; }
          else {
            a.next = (a.next ?? 0.2) - dt;
            if (a.next <= 0) { a.next = 0.45 + this.rand() * 1.1; a.look = this.heading + (this.rand() - 0.5) * 2.2; if (this.rand() < 0.35 * T.curious) a.raise = 0.9; if (this.rand() < 0.5) a.palp = 0.7; }
            if (a.look !== undefined) this.turnTo(a.look, dt, 7);
            if (a.raise > 0) { a.raise -= dt; this.arms = this.armsRaised(0.6); }
            if (a.palp > 0) { a.palp -= dt; this.palpAmpT = 0.8; }
          }
        }
        this.halt(dt);
        this.boredom = Math.max(0, this.boredom - dt * 0.01);
        if (a.t > (a.data.len ?? (a.kind === "perch" ? 4 + this.rand() * 3 : 1.8 + this.rand() * 2.2))) {
          a.data.len = a.data.len ?? 0;
          if (a.kind === "perch" && this.rand() < 0.4) this.begin("groom", "Cleaning its eyes with its front legs");
          else this.think();
        }
        break;
      }
      case "wander": {
        const g = a.data;
        const d = Math.hypot(g.x - this.x, g.y - this.y);
        if (!this.jump && (g.perch || this.rand() < 0.004 * T.playful) && d < 135 && d > 26) {
          this.jumpTo(g.x, g.y, { onLand: () => this.begin(g.perch ? "perch" : "survey", g.perch ? `Perched on ${g.perch.name}, looking around` : "Looking around") });
          break;
        }
        if (!this.jump && this.burstTo(dt, g.x, g.y, 6, 0.9 + T.playful * 0.25)) this.begin(g.perch ? "perch" : "survey", null);
        this.boredom = Math.max(0, this.boredom - dt * 0.05);
        if (a.t > 12) this.think();
        break;
      }
      case "groom": {
        this.sinceGroom = 0; this.halt(dt); this.palpAmpT = 0.9;
        this.arms = (l, side, out) => { const c = this.clock * 11 + (side > 0 ? 0 : 1.7); this.local(1.38 + Math.cos(c) * 0.16, side * (0.38 + Math.sin(c) * 0.12), 0.18 + Math.sin(c) * 0.22, out); out[3] = 24; return out; };
        this.pitchT = 0.12;
        if (a.t > 1.7) this.think();
        break;
      }
      case "rest": {
        if (a.ph === 0) {
          const d = Math.hypot(this.nest.x - this.x, this.nest.y - this.y);
          if (!this.jump && d < 130 && d > 8) { a.ph = 1; this.jumpTo(this.nest.x, this.nest.y, { onLand: () => { this.act.ph = 2; this.thought = "Asleep in its nest"; } }); }
          else if (!this.jump && d <= 8) a.ph = 2;
          else if (!this.jump) this.burstTo(dt, this.nest.x, this.nest.y, 120, 0.8);
        } else if (a.ph === 2) {
          this.liftT = 0.5; this.palpAmpT = 0.02; this.eyeShine = 0.35; this.halt(dt);
          this.energy = Math.min(1, this.energy + dt * 0.09);
          a.z = (a.z ?? 0) - dt; if (a.z <= 0) { a.z = 1.6; this.marks.push({ type: "z", x: this.x + 8, y: this.y - 16, age: 0, life: 2.2 }); }
          if (this.energy > 0.97) this.begin("emerge", "Rested, and stretching", {}), (this.act.t = 0.6);
        }
        break;
      }
      case "watch": {
        if (!touch) { this.begin("survey", "Your finger's gone; it's looking around", { len: 1.2 }); break; }
        const d = Math.hypot(touch.x - this.x, touch.y - this.y), close = clamp(1 - d / 220, 0, 1);
        this.face(touch.x, touch.y, dt, 8);
        this.pitchT = 0.12 + close * 0.38; this.palpAmpT = 0.5 + close * 0.5; this.halt(dt);
        if (T.curious > 0.5 && this.trust >= 0.2) this.arms = this.armsRaised(0.35 + close * 0.4);
        if (this.trust >= 0.3 && touch.speed > 40 && touch.speed < 650 && touch.path > 30) {
          this.begin("chase", "Your finger's moving: it's stalking it like a laser dot"); break;
        }
        if (touch.still > 0.9 && this.trust >= 0.2 && d > this.approachStop() + 6) {
          this.begin("approach", this.trust < 0.45 ? "Your finger's holding still, so it's creeping closer" : "Coming over to your finger");
        } else if (touch.still > 0.9 && d < 110) {
          this.gainTrust(dt * 0.012, "you held still and let it look");
        }
        break;
      }
      case "approach": {
        if (!touch) { this.begin("survey", null, { len: 1 }); break; }
        const stop = this.approachStop(), d = Math.hypot(touch.x - this.x, touch.y - this.y);
        this.pitchT = 0.3; this.palpAmpT = 0.7;
        if (touch.speed > 500) { this.begin("watch", "You moved, so it paused"); break; }
        if (this.trust >= 0.7 && d < 95 && !this.jump) {
          this.jumpTo(touch.x, touch.y, { ground: FINGER_Z, silk: false, onLand: () => this.startRide() });
          this.thought = "Hopped onto your finger!";
          break;
        }
        if (this.trust < 0.45 ? this.creepTo(dt, touch.x, touch.y, stop, 0.8) : this.burstTo(dt, touch.x, touch.y, stop, 0.7)) {
          if (this.trust >= 0.45) this.begin("tap", "Reaching out to touch your finger");
          else { this.gainTrust(0.03, "it got close and nothing bad happened"); this.begin("watch", "Close enough. Watching you, legs up"); }
        }
        break;
      }
      case "tap": {
        if (!touch) { this.begin("survey", null, { len: 1 }); break; }
        this.face(touch.x, touch.y, dt, 6); this.pitchT = 0.32; this.palpAmpT = 1; this.halt(dt);
        const side = a.data.side || (a.data.side = this.rand() < 0.5 ? 1 : -1);
        this.arms = (l, sd, out) => {
          if (sd !== side) return null;
          out[0] = lerp(this.local(1.8, sd * 0.6, 0, out)[0], touch.x, 0.85);
          out[1] = lerp(this.local(1.8, sd * 0.6, 0, [0, 0, 0])[1], touch.y, 0.85);
          out[2] = FINGER_Z * 0.6 + Math.abs(Math.sin(a.t * 8)) * 5; out[3] = 18; return out;
        };
        if (!a.data.counted && a.t > 0.5) { a.data.counted = true; this.gainTrust(0.05, "it touched your finger and liked it"); this.marks.push({ type: "heart", x: this.x, y: this.y - 22, age: 0, life: 1.3 }); }
        if (a.t > 1.4) this.begin("watch", "Watching you, happily");
        break;
      }
      case "ride": {
        if (!touch) { this.endRide(0, 0); break; }
        this.x = ease(this.x, touch.x, 35, dt); this.y = ease(this.y, touch.y + 2, 35, dt);
        this.turnTo(Math.PI / 2, dt, 4); this.pitchT = 0.4; this.palpAmpT = 0.6; this.liftT = touch.speed > 400 ? 0.55 : 0.75;
        a.gain = (a.gain || 0);
        if (a.gain < 0.08) { a.gain += dt * 0.012; this.gainTrust(dt * 0.012, "riding round on your finger"); }
        break;
      }
      case "chase": {
        if (!touch) { this.joy = Math.min(1, this.joy + 0.2); this.begin("survey", "That was fun", { len: 1.5 }); break; }
        const d = Math.hypot(touch.x - this.x, touch.y - this.y);
        this.pitchT = 0.15; this.palpAmpT = 0.9;
        if (this.jump) break;
        if (touch.still > 0.22 && d < 130 && d > 22) {
          this.jumpTo(touch.x, touch.y, {
            ground: this.trust >= 0.7 ? FINGER_Z : undefined, silk: d > 60,
            onLand: () => { if (this.trust >= 0.7 && this.w.touch) this.startRide(); else this.begin("chase", "Pounced! Where did it go?"); },
          });
          this.thought = "Pounce!";
          this.gainTrust(0.01, "a good game of chase");
          break;
        }
        if (d > 70) this.burstTo(dt, touch.x, touch.y, 50, 1.2);
        else this.creepTo(dt, touch.x, touch.y, 30, 1.2);
        break;
      }
      case "hunt": {
        const b = a.data.ball;
        if (!b || b.gone || (b.held && b.held !== this)) { this.think(); break; }
        const d = Math.hypot(b.x - this.x, b.y - this.y);
        if (this.jump) break;
        if (b.speed > 140) { this.face(b.x, b.y, dt, 9); this.palpAmpT = 0.9; this.halt(dt); break; }
        this.palpAmpT = 0.4;
        if (d > 80) { this.burstTo(dt, b.x, b.y, 70, 1.1); break; }
        if (d > 46 && this.creepTo(dt, b.x, b.y, 46, 0.9) === false) { this.thought = "Stalking the ball…"; break; }
        this.jumpTo(b.x + b.vx * 0.1, b.y + b.vy * 0.1, {
          silk: d > 40,
          onLand: () => {
            const bb = a.data.ball, dd = bb ? Math.hypot(bb.x - this.x, bb.y - this.y) : 99;
            if (bb && !bb.held && dd < 16 + bb.r) this.catch(bb, a.data.invite);
            else if (++this.tried < 3) this.begin("hunt", "Missed! Trying again", a.data);
            else { this.tried = 0; this.begin("survey", "Gave up on that ball", { len: 1.5 }); }
          },
        });
        this.thought = "Pounce!";
        break;
      }
      case "carry": {
        const b = this.carrying;
        if (!b) { this.think(); break; }
        this.arms = (l, side, out) => { this.local(1.75, side * 0.62, -0.25, out); out[3] = 22; return out; };
        const plan = a.data.plan, target = touch ? [touch.x, touch.y] : this.heatSpot() || [W / 2, H * 0.72];
        if (plan === "keep") {
          const home = a.data.home || (a.data.home = this.rand() < 0.5 ? [this.nest.x - 30, this.nest.y + 60] : [this.x + (this.rand() - 0.5) * 120, clamp(this.y + 60, 80, H - 40)]);
          if (this.burstTo(dt, home[0], home[1], 8, 0.9)) {
            if (T.playful > 0.6 && !a.data.solo && this.rand() < 0.6) { a.data.solo = true; this.toss([this.x + this.fx * 50, this.y + this.fy * 50], 0.45); this.begin("hunt", "Batting its own ball about", { ball: b }); }
            else { this.drop(); this.begin("survey", "Keeping the ball for itself", { len: 2 }); }
          }
        } else if (plan === "bring") {
          if (this.burstTo(dt, target[0], target[1], 30, 0.9)) { this.drop(); this.gainTrust(0.02, "it brought you a gift"); this.begin("await", "Brought you the ball", { len: 4 }); }
        } else {
          const d = Math.hypot(target[0] - this.x, target[1] - this.y);
          if (d > 120 && !a.data.wind) { this.burstTo(dt, target[0], target[1], 100, 1); break; }
          a.data.wind = (a.data.wind || 0) + dt;
          this.face(target[0], target[1], dt, 9); this.halt(dt);
          this.pitchT = 0.45; this.palpAmpT = 1;
          this.arms = (l, side, out) => { this.local(1.7, side * 0.6, 0.6 + a.data.wind * 1.5, out); out[3] = 22; return out; };
          if (a.data.wind > 0.38) {
            this.toss(target, 0.62);
            this.fetchLove = Math.min(1, this.fetchLove + 0.08);
            this.begin("await", a.data.invite ? "Tossed you a ball out of nowhere. It wants to play fetch!" : "Tossed it back. Your turn!", { len: 6, fetch: true });
          }
        }
        break;
      }
      case "await": {
        const tgt = touch ? [touch.x, touch.y] : this.heatSpot();
        if (tgt) this.face(tgt[0], tgt[1], dt, 6);
        this.pitchT = 0.35; this.palpAmpT = 0.9; this.halt(dt);
        if (T.playful > 0.5) this.arms = this.armsRaised(0.5 + 0.3 * Math.sin(this.clock * 4));
        if (a.t > (a.data.len || 4)) this.think();
        break;
      }
      case "invite": {
        const spot = this.heatSpot();
        if (!spot) { this.think(); break; }
        if (a.ph === 0 && this.burstTo(dt, spot[0], spot[1] - 40, 10, 0.9)) a.ph = 1;
        if (a.ph === 1) {
          this.face(spot[0], spot[1] + 40, dt, 6); this.pitchT = 0.4; this.palpAmpT = 1;
          this.arms = (l, side, out) => { this.local(1.3, side * 1.3, 1.6 + Math.sin(this.clock * 7 + side) * 0.4, out); out[3] = 16; return out; };
          if (a.t > 6) this.think();
        }
        break;
      }
      case "dance": this.runDance(dt, a); break;
      case "hop":
      case "flee": if (!this.jump) this.think(); break;
      default: this.think();
    }
  }
  approachStop() { return this.trust < 0.45 ? 52 : 26; }
  armsRaised(h) { return (l, side, out) => { this.local(1.55, side * 1.05, 0.5 + h * 1.1 + Math.sin(this.clock * 5 + side) * 0.12 * h, out); out[3] = 14; return out; }; }
  catch(b, invite) {
    b.held = this; this.carrying = b; this.tried = 0;
    const thrownByYou = b.thrownBy === "you" && this.w.clock - b.thrownAt < 8;
    if (thrownByYou) {
      this.unanswered = 0;
      this.gainTrust(0.03, "you tossed it a ball");
      if (b.fromSpider) { this.fetches += 1; this.fetchLove = Math.min(1, this.fetchLove + 0.12); this.gainTrust(0.06, `a round of fetch (${this.fetches} so far)`); }
    }
    const plan = invite && !(this.unanswered >= 2) ? "toss" : this.carryPlan();
    if (plan === "keep" && this.unanswered >= 2) { this.unanswered = 0; this.begin("carry", "You didn't throw it back, so it's keeping the ball", { plan }); return; }
    this.begin("carry", plan === "toss" ? "Caught it! Lining up a throw back to you" : plan === "bring" ? "Caught it! Bringing it to you" : "Caught it! Keeping it, for now", { plan, invite });
  }
  toss(target, time) {
    const b = this.carrying; if (!b) return;
    const m = this.mouth();
    b.held = null; b.z = 0; b.x = m[0] + this.fx * 4; b.y = m[1] + this.fy * 4;
    const v = World.aim(b.x, b.y, target[0], target[1], time);
    b.vx = v[0]; b.vy = v[1]; b.landed = false; b.fromSpider = true; b.thrownBy = "spider"; b.thrownAt = this.w.clock;
    this.unanswered = (this.unanswered || 0) + 1;
    this.carrying = null;
    this.marks.push({ type: "pulse", x: m[0], y: m[1] - m[2] * TILT, age: 0, life: 0.4, r0: 4, col: ACC });
  }
  startRide() {
    if (!this.w.touch) { this.begin("survey", null, { len: 1 }); return; }
    this.riding = true; this.begin("ride", "Riding on your finger. Drag to carry it, flick to launch it");
    this.marks.push({ type: "heart", x: this.x, y: this.y - 24, age: 0, life: 1.3 });
  }
  endRide(vx, vy) {
    this.riding = false;
    const sp = Math.hypot(vx, vy);
    if (sp > 400) {
      const d = clamp(sp * 0.16, 70, 190);
      this.jumpTo(this.x + (vx / sp) * d, this.y + (vy / sp) * d, { onLand: () => this.begin("survey", "Wheee. Launched off your finger", { len: 1.5 }) });
      this.thought = "Launched!";
    } else {
      this.jumpTo(this.x + this.fx * 30, this.y + 34, { silk: false, onLand: () => this.begin("survey", "Hopped back down", { len: 1.5 }) });
    }
    this.begin("hop", null);
  }

  // ======== dancing ========
  runDance(dt, a) {
    const m = this.w.music, music = this.items.find((o) => o.kind === "music");
    if (!m.on) { this.dance = null; this.begin("survey", "The music stopped", { len: 1.5 }); return; }
    if (a.ph === 0) {
      const spot = a.data.spot || (a.data.spot = [music.x + (this.rand() - 0.5) * 90, music.y - 52 - this.rand() * 25]);
      if (this.jump) return;
      const d = Math.hypot(spot[0] - this.x, spot[1] - this.y);
      if (d > 140) { this.burstTo(dt, spot[0], spot[1], 120, 1); return; }
      if (d > 14) { this.jumpTo(spot[0], spot[1], { onLand: () => { this.act.ph = 1; } }); return; }
      a.ph = 1;
    }
    // Pick a dance every two bars, rarer ones less often, so there is always another to find.
    const bar = Math.floor(m.beat / 8);
    if (!this.dance || this.dance.bar !== bar) {
      let pick = null, tot = 0;
      for (const d of SPIDER_DANCES) if (!this.dance || d.id !== this.dance.id) tot += d.w;
      let r = this.rand() * tot;
      for (const d of SPIDER_DANCES) { if (this.dance && d.id === this.dance.id) continue; r -= d.w; if (r <= 0) { pick = d; break; } }
      pick = pick || SPIDER_DANCES[0];
      this.dance = { id: pick.id, name: pick.name, bar, base: this.heading, x0: this.x, y0: this.y };
      const fresh = !this.danceSeen.has(pick.id);
      this.danceSeen.add(pick.id);
      this.thought = fresh ? `A new dance: ${pick.name}!` : `Dancing ${pick.name}`;
      this.joy = Math.min(1, this.joy + 0.05);
    }
    const b = m.beat, ph = b % 1, pulse = m.pulse, side = Math.floor(b) % 2 ? 1 : -1, sw = m.sway;
    this.halt(dt); this.palpAmpT = 0.4 + pulse * 0.6;
    const D = this.dance;
    switch (D.id) {
      case "sway":
        this.ox = this.sx * sw * 2.6; this.oy = this.sy * sw * 2.6; this.turnTo(D.base + sw * 0.12, dt, 6);
        this.arms = this.armsRaised(0.3 + pulse * 0.3);
        break;
      case "bob":
        this.liftT = LIFT - 0.32 * pulse; this.abdTiltT = 0.18 * pulse; this.pitchT = 0.15 + 0.1 * pulse;
        break;
      case "semaphore":
        this.pitchT = 0.2;
        this.arms = (l, sd, out) => { const up = sd === side ? 1 : 0.35; this.local(1.25, sd * 1.5, 0.6 + up * 1.6 * (0.6 + pulse * 0.4), out); out[3] = 18; return out; };
        break;
      case "drum":
        this.pitchT = 0.1;
        this.arms = (l, sd, out) => { const lift = sd === side ? (1 - pulse) * 1.1 : 0.9; this.local(2.0, sd * 1.05, -this.lift + lift, out); out[2] = Math.max(out[2], this.ground); out[3] = 30; return out; };
        if (pulse > 0.9) this.marks.push({ type: "spark", x: this.x + this.fx * 18, y: this.y + this.fy * 18 - 3, dx: (this.rand() - 0.5) * 10, dy: -8, age: 0, life: 0.3, col: INK });
        break;
      case "zigzag": {
        this.arms = (l, sd, out) => { this.local(1.1, sd * 1.6, 2.0, out); out[3] = 16; return out; };
        const tgtX = D.x0 + this.sx * side * 7, tgtY = D.y0 + this.sy * side * 7;
        this.x = ease(this.x, tgtX, 16, dt); this.y = ease(this.y, tgtY, 16, dt);
        break;
      }
      case "hop":
        if (!this.jump && ph < 0.12 && Math.floor(b) % 2 === 0 && D.lastHop !== Math.floor(b)) { D.lastHop = Math.floor(b); this.jumpTo(this.x, this.y, { hop: true, silk: false, onLand: () => {} }); }
        break;
      case "spin":
        if (ph < 0.1 && D.lastTurn !== Math.floor(b)) { D.lastTurn = Math.floor(b); D.base = wrap(D.base + Math.PI / 2); }
        this.turnTo(D.base, dt, 16);
        this.arms = this.armsRaised(0.6);
        break;
      case "fan":
        this.abdTiltT = 0.65; this.abdS = Math.sin(b * Math.PI * 2) * 0.32; this.pitchT = 0.18;
        this.arms = this.armsRaised(0.8 + pulse * 0.3);
        break;
    }
    if (pulse > 0.95 && this.rand() < 0.3) this.marks.push({ type: "note", x: this.x + (this.rand() - 0.5) * 20, y: this.y - 26, age: 0, life: 1.1, col: ACC });
  }

  // ======== touch ========
  hit(x, y) { const p = project(this.x, this.y, this.z); return Math.hypot(x - p[0], y - p[1]) < 24 ? "spider" : null; }
  down(t) {
    this.heatAdd(t.x, t.y); this.touches += 1;
    if (t.on) return;
    const b = this.w.balls.find((q) => !q.held && Math.hypot(q.x - t.x, q.y - t.y) < q.r + 16);
    if (b) { t.ball = b; b.held = "finger"; b.z = FINGER_Z; }
  }
  move(t) {
    const d = Math.hypot(t.x - this.x, t.y - this.y);
    if (d < 120) this.gentle = ease(this.gentle, t.speed < 320 ? 1 : 0, 0.15, 1 / 60);
  }
  long(t) {
    if (t.on !== "spider") return;
    if (this.trust >= 0.7) { this.drop(); this.startRide(); }
    else { this.gainTrust(-0.02, "it was held down before it was ready"); this.flee(t.x, t.y, "Not ready to be picked up yet, so it jumped away"); }
  }
  up(t, gesture, vx, vy) {
    if (this.riding) { this.endRide(gesture === "flick" ? vx : 0, gesture === "flick" ? vy : 0); return; }
    if (t.ball) {
      const b = t.ball; b.held = null; b.z = 0; b.landed = false;
      if (gesture === "flick") { const s = Math.min(1, 950 / Math.hypot(vx, vy)); b.vx = vx * s; b.vy = vy * s; b.thrownBy = "you"; b.thrownAt = this.w.clock; }
      else { b.vx = 0; b.vy = 0; }
      return;
    }
    if (t.on === "spider") {
      if (gesture === "tap") {
        if (this.trust >= 0.45) {
          this.gainTrust(0.01, "a gentle boop");
          this.marks.push({ type: "heart", x: this.x, y: this.y - 24, age: 0, life: 1.3 });
          this.begin("hop", "Boop! A happy little hop");
          this.jumpTo(this.x, this.y, { hop: true, silk: false, onLand: () => this.begin("await", null, { len: 1.5 }) });
        } else {
          this.gainTrust(-0.03, "it was poked before it trusted you");
          this.flee(t.x, t.y, "Poked! It jumped away");
        }
      }
      return;
    }
    if (gesture === "flick") this.throwBall(t.x, t.y, vx, vy);
  }
  throwBall(x, y, vx, vy) {
    const free = this.w.balls.filter((b) => !b.held);
    if (free.length >= 4) this.w.balls.splice(this.w.balls.indexOf(free[0]), 1);
    const s = Math.min(1, 950 / Math.hypot(vx, vy));
    this.w.balls.push(new Ball(x, y, 6.5, { vx: vx * s, vy: vy * s, thrownBy: "you", thrownAt: this.w.clock }));
  }
  key() { this.throwBall(W / 2, H - 60, (this.x - W / 2) * 1.4, -520); }
  ballLanded(b) {
    const k = this.act.kind;
    if (b.thrownBy === "spider" && this.w.clock - b.thrownAt < 7) return;
    if (["survey", "perch", "wander", "groom", "await"].includes(k) && Math.hypot(b.x - this.x, b.y - this.y) < 260 && b.r <= 11) {
      this.begin("hunt", b.thrownBy === "spider" ? "Its ball came back! Going for it" : "A ball landed nearby. Stalking it", { ball: b });
    }
  }
  musicChanged(on) {
    if (!on || ["ride", "flee", "carry"].includes(this.act.kind)) return;
    if (!this.jump) { this.begin("dance", "Your music came on, so it's going to dance"); return; }
    // Mid-jump: it lands first, then starts to dance.
    const j = this.jump, then = j.onLand;
    j.onLand = () => { then && then(); if (this.w.music.on && this.act.kind !== "dance" && !this.jump) this.begin("dance", "Your music came on, so it's going to dance"); };
  }
  /** Sets trust, from the page's slider. */
  setTrust(v) { this.trust = v; this.trustNote = ""; }

  // ======== drawing ========
  press(fab) {
    if (this.riding) return;
    for (const f of this.feet) {
      if (f.z - groundAt(this.items, f.x, f.y) < 1.2 && !widgetAt(this.items, f.x, f.y)) fab.press(f.x, f.y, 2.6, 0);
    }
    for (const m of this.marks) if (m.type === "land" && !widgetAt(this.items, m.x, m.y)) fab.press(m.x, m.y, 9 * (1 - m.age / m.life), 0);
  }
  drawHome(ctx, o) {
    // A silk retreat: a dense little web where it sleeps.
    ctx.strokeStyle = rgba(INK, 0.28); ctx.lineWidth = 0.7;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(a) * o.hw * 0.8, o.y + Math.sin(a) * o.hw * 0.8); ctx.stroke(); }
    for (const ring of [0.25, 0.45, 0.65]) {
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) { const a = (k / 8) * TAU, rr = o.hw * ring * (1 + Math.sin(k * 2.3) * 0.06); const px = o.x + Math.cos(a) * rr, py = o.y + Math.sin(a) * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
  }
  drawShadow(ctx) {
    const v = [0, 0], g = this.riding ? FINGER_Z - 3 : this.surface(this.x, this.y);
    const h = Math.max(0, this.z - g);
    const parts = [[0, 0, 1.25, 1.02], [-2.2, 0.12, 1.42, 1.1]];
    for (const [cf, cu, rf, rs] of parts) {
      const c = this.xf(cf, 0, cu, cf > -1 ? this.pitch : this.abdPitch, [0, 0, 0]);
      const hh = Math.max(0, c[2] - g);
      project(c[0] + hh * SHADOW_X, c[1] + hh * SHADOW_Y, g, v);
      const blur = 1 + hh * 0.03, a = 0.5 * clamp(1 - hh / 90, 0.25, 1);
      ctx.save(); ctx.translate(v[0], v[1]); ctx.rotate(this.heading); ctx.scale(rf * SU * 1.1 * blur, rs * SU * 1.1 * blur);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
    }
    // Leg shadows: thin, offset by each joint's height.
    const hip = [0, 0, 0], knee = [0, 0, 0], a = [0, 0], b = [0, 0], c = [0, 0];
    ctx.strokeStyle = `rgba(0,0,0,${0.3 * clamp(1 - h / 90, 0.3, 1)})`; ctx.lineWidth = 1.3; ctx.lineCap = "round";
    for (let l = 0; l < 8; l++) {
      this.legJoints(l, hip, knee);
      const f = this.feet[l];
      const sh = (p, out) => { const hh = Math.max(0, p[2] - g); return project(p[0] + hh * SHADOW_X, p[1] + hh * SHADOW_Y, g, out); };
      sh(hip, a); sh(knee, b); sh([f.x, f.y, f.z], c);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    }
  }
  legJoints(l, hip, knee) {
    const p = l % 4, side = l < 4 ? 1 : -1, f = this.feet[l];
    this.xf(SP.hipF[p], SP.hipS * side, SP.hipU, this.pitch, hip);
    const fem = SP.femur[p] * SU, tib = SP.tibia[p] * SU;
    const dx = f.x - hip[0], dy = f.y - hip[1], across = Math.hypot(dx, dy), drop = hip[2] - f.z;
    const reach = clamp(Math.hypot(across, drop), 1e-3, (fem + tib) * 0.999);
    const cosH = clamp((fem * fem + reach * reach - tib * tib) / (2 * fem * reach), -1, 1);
    const pitch = Math.atan2(-drop, across) + Math.acos(cosH);
    const ux = across > 1e-4 ? dx / across : this.fx, uy = across > 1e-4 ? dy / across : this.fy;
    knee[0] = hip[0] + ux * Math.cos(pitch) * fem; knee[1] = hip[1] + uy * Math.cos(pitch) * fem; knee[2] = hip[2] + Math.sin(pitch) * fem;
  }
  draw(ctx) {
    const pts = [], w = [0, 0, 0], n = [0, 0, 0], v = [0, 0];
    const dot = 1.15 * (VIEW.mesh ? 0.8 : 1);
    const breathe = 1 + Math.sin(this.clock * 2.1) * 0.025;
    const add = (x, y, z, nx, ny, nz, col, size, kind) => {
      const facing = nx * VIEWDIR[0] + ny * VIEWDIR[1] + nz * VIEWDIR[2];
      if (kind !== "leg" && facing < -0.12) return null;
      const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const rim = Math.pow(1 - Math.abs(facing), 3) * 0.35;
      project(x, y, z, v);
      const p = { x: v[0], y: v[1], depth: y * TILT + z, lit: 0.22 + lit * 0.8 + rim, col, size, kind };
      pts.push(p); return p;
    };
    // Body shells.
    const shells = [[SPIDER_MODEL.ceph, this.pitch, 1, 0], [SPIDER_MODEL.abd, this.abdPitch, breathe, this.abdS]];
    const meshLines = [];
    for (const [model, pitch, scale, sOff] of shells) {
      const idx = [];
      for (let i = 0; i < model.length; i++) {
        const q = model[i];
        const cf = model === SPIDER_MODEL.abd ? -2.2 : 0, cu = model === SPIDER_MODEL.abd ? 0.12 : 0;
        this.xf(cf + (q.f - cf) * scale, q.s * scale + sOff, cu + (q.u - cu) * scale, pitch, w);
        this.xn(q.nf, q.ns, q.nu, pitch, n);
        idx[i] = add(w[0], w[1], w[2], n[0], n[1], n[2], q.col, q.col === 1 ? 1.15 : q.col === 2 ? 1.08 : 1, "body");
      }
      if (VIEW.mesh) for (let i = 0; i < model.length; i++) { const a = idx[i]; if (!a) continue; for (const j of model[i].nb) { const b = idx[j]; if (b) meshLines.push([a, b]); } }
    }
    // Chelicerae: iridescent, cyan into green.
    for (const side of [1, -1]) for (let k = 0; k < 3; k++) {
      this.xf(1.17, 0.17 * side, -0.32 - k * 0.14, this.pitch, w); this.xn(1, 0.2 * side, -0.2, this.pitch, n);
      const p = add(w[0], w[1], w[2], n[0], n[1], n[2], 4, 1.05, "body"); if (p) p.irid = (Math.sin(this.clock * 1.3 + k + side) + 1) / 2;
    }
    // Palps: fuzzy, pale-tipped, flicking.
    for (const side of [1, -1]) {
      const flick = Math.sin(this.palpT * 17 + (side > 0 ? 0 : Math.PI)) * 0.16 * this.palpAmp;
      const pts3 = [[1.08, 0.42 * side, -0.3], [1.46, 0.5 * side, -0.26 + flick], [1.62, 0.44 * side, -0.52 + flick * 1.4]];
      for (let s = 0; s < 2; s++) for (let k = 0; k <= 2; k++) {
        const t = k / 2, a = pts3[s], b = pts3[s + 1];
        this.xf(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), this.pitch, w);
        add(w[0], w[1], w[2], 0, 0, 1, s === 1 && k === 2 ? 2 : 0, s === 1 && k === 2 ? 1.5 : 1, "leg");
      }
    }
    // Legs: thick at the hip, tapering, a bright knee.
    const hip = [0, 0, 0], knee = [0, 0, 0];
    for (let l = 0; l < 8; l++) {
      const p = l % 4, f = this.feet[l], th = SP.thick[p];
      this.legJoints(l, hip, knee);
      const segs = [[hip, knee, 1.1, 0.95], [knee, [f.x, f.y, f.z], 0.95, 0.62]];
      let prev = null;
      for (const [a, b, s0, s1] of segs) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), cnt = Math.max(2, Math.round(len / (0.36 * SU)));
        for (let k = 0; k <= cnt; k++) {
          const t = k / cnt, z = lerp(a[2], b[2], t);
          const q = add(lerp(a[0], b[0], t), lerp(a[1], b[1], t), z, 0, 0, 1, a === knee && k === 0 ? 2 : 0, lerp(s0, s1, t) * th * (a === knee && k === 0 ? 1.2 : 1), "leg");
          q.lit = 0.4 + 0.6 * clamp((z - this.ground) / (2.2 * SU), 0, 1);
          if (VIEW.mesh && prev) meshLines.push([prev, q]);
          prev = q;
        }
      }
    }
    // Eyes: drawn as glossy discs where they face you.
    for (const e of SPIDER_MODEL.eyes) {
      this.xf(e.f, e.s, e.u, this.pitch, w); this.xn(e.n[0], e.n[1], e.n[2], this.pitch, n);
      const facing = n[0] * VIEWDIR[0] + n[1] * VIEWDIR[1] + n[2] * VIEWDIR[2];
      if (facing < 0.02) continue;
      project(w[0], w[1], w[2], v);
      const ang = Math.atan2(n[1] - n[2] * TILT, n[0]);
      pts.push({ x: v[0], y: v[1], depth: w[1] * TILT + w[2] + 0.5, kind: "eye", r: e.r * SU, facing, ang, big: e.big });
    }
    pts.sort((a, b) => a.depth - b.depth);
    if (VIEW.mesh && meshLines.length) {
      ctx.lineWidth = 0.55; ctx.strokeStyle = rgba(INK, 0.32); ctx.beginPath();
      for (const [a, b] of meshLines) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();
    }
    for (const p of pts) {
      if (p.kind === "eye") { this.drawEye(ctx, p); continue; }
      let c = INK, a = clamp(p.lit, 0, 1);
      if (p.col === 1) { c = ACC; a = clamp(0.45 + p.lit * 0.6, 0, 1); }
      else if (p.col === 2) a = clamp(p.lit * 1.25, 0, 1);
      else if (p.col === 3) a = clamp(p.lit * 0.42, 0, 1);
      else if (p.col === 4) { c = mix(CYAN, GREEN, p.irid); a = clamp(0.5 + p.lit * 0.6, 0, 1); }
      ctx.fillStyle = rgba(c, a);
      ctx.beginPath(); ctx.arc(p.x, p.y, dot * p.size, 0, TAU); ctx.fill();
    }
    if (this.carrying) { const b = this.carrying; drawBall(ctx, b, b.x, b.y, b.z); }
  }
  drawEye(ctx, e) {
    const r = e.r, sq = 0.25 + 0.75 * e.facing;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
    ctx.beginPath(); ctx.ellipse(0, 0, r * sq, r, 0, 0, TAU);
    ctx.fillStyle = "#050409"; ctx.fill();
    if (e.big) { ctx.lineWidth = 0.6; ctx.strokeStyle = rgba(ACC, 0.5 * e.facing); ctx.stroke(); }
    ctx.restore();
    // Catchlights stay put while the eye turns: that is what makes it look back at you.
    const s = this.eyeShine * e.facing;
    ctx.fillStyle = rgba([255, 255, 255], 0.95 * s);
    ctx.beginPath(); ctx.arc(e.x - r * 0.32, e.y - r * 0.36, Math.max(0.5, r * (e.big ? 0.3 : 0.35)), 0, TAU); ctx.fill();
    if (e.big) { ctx.fillStyle = rgba([255, 255, 255], 0.5 * s); ctx.beginPath(); ctx.arc(e.x + r * 0.26, e.y + r * 0.22, r * 0.12, 0, TAU); ctx.fill(); }
  }
  drawOver(ctx) { for (const m of this.marks) if (m.type !== "land") drawMark(ctx, m); }

  /** What it has learned about you, in words, for the page. */
  learned() {
    const out = [];
    const spot = this.heatSpot();
    if (spot) out.push(`You usually touch ${placeName(spot[0], spot[1])}.`);
    out.push(this.gentle > 0.62 ? "You move gently round it." : this.gentle < 0.38 ? "Your finger can be sudden." : "Still working out how you move.");
    if (this.fetches) out.push(`You've played fetch ${this.fetches} time${this.fetches > 1 ? "s" : ""}.`);
    return out;
  }
}
