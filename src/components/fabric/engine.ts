/*
The site's dot fabric, a web sketch of Doto's canvas. Dots sit on a lattice. Each one is held
to its home by a spring and to its four neighbours by a softer one, so a push travels through
the sheet as a rubbery wave instead of moving one dot. Colliders are rounded rectangles the
sheet is pressed around: cards sit in wells with the cloth gathered at their rims, and text
presses it lightly so dots thin out behind words.

House rules from the launcher: no motion without a cause, and the loop sleeps once the sheet
has settled, so an untouched page schedules no frames. Reduced motion draws the plain lattice
and never animates.

Forces read last frame's offsets (Jacobi). Updating in place lets a neighbour see this frame's
value, and the lattice rings itself apart within a second.
*/

export type Collider = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius. */
  r: number;
  /** How far outside the edge the cloth is pushed. 0 switches the collider off. */
  pad: number;
  /** Stiffness of the push. */
  str: number;
};

export type Pointer = { x: number; y: number; reach: number; force: number };

/** A round dent for one frame: a critter's foot, the Roomba's body, a ball. */
export type Press = { x: number; y: number; r: number };

export type FabricOptions = {
  spacing?: number;
  radius?: number;
  /** Resting dot colour. */
  base?: [number, number, number];
  /** Colour of a dot that is stretched or moving. */
  lit?: [number, number, number];
  home?: number;
  couple?: number;
  damping?: number;
  still?: boolean;
};

export class Spring {
  v: number;
  t: number;
  vel = 0;
  constructor(v: number, public k = 0.16, public d = 0.74) {
    this.v = v;
    this.t = v;
  }
  /** Advances one frame; true while it is still moving. */
  step() {
    this.vel = (this.vel + (this.t - this.v) * this.k) * this.d;
    this.v += this.vel;
    return Math.abs(this.vel) > 0.01 || Math.abs(this.t - this.v) > 0.05;
  }
  snap(v: number) {
    this.v = this.t = v;
    this.vel = 0;
  }
}

function roundedRectDistance(px: number, py: number, c: Collider) {
  const rad = Math.min(c.r, c.w / 2, c.h / 2);
  const qx = Math.abs(px - (c.x + c.w / 2)) - (c.w / 2 - rad);
  const qy = Math.abs(py - (c.y + c.h / 2)) - (c.h / 2 - rad);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
}

export class Fabric {
  readonly spacing: number;
  readonly radius: number;
  readonly base: [number, number, number];
  readonly lit: [number, number, number];
  readonly still: boolean;
  private k: number;
  private couple: number;
  private damping: number;
  private context: CanvasRenderingContext2D;

  width = 0;
  height = 0;
  cols = 0;
  rows = 0;
  private originX = 0;
  dx = new Float32Array(0);
  dy = new Float32Array(0);
  vx = new Float32Array(0);
  vy = new Float32Array(0);
  x = new Float32Array(0);
  y = new Float32Array(0);
  private lift = new Float32Array(0);
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  /** Each row's page position last frame, to spot a row that has wrapped round. */
  private rowAt = new Float32Array(0);

  colliders: Collider[] = [];
  presses: Press[] = [];
  pointer: Pointer | null = null;
  /** Page scroll, so the sheet travels with the content. */
  scrollY = 0;
  /** Vertical stretch around the middle of the window, sprung back to 1. */
  stretch = new Spring(1, 0.12, 0.7);
  /** Furthest the rows may spread or gather from their spacing. */
  maxStretch = 0.025;
  /** Called before every frame, to read the page (collider rects, scroll). */
  beforeFrame: (() => void) | null = null;
  /** Called after drawing, to mask or decorate. */
  afterDraw: ((context: CanvasRenderingContext2D) => void) | null = null;
  /** Keeps the loop running while something outside the physics is animating. */
  busy = false;

  private frame = 0;
  private running = false;

  constructor(private canvas: HTMLCanvasElement, options: FabricOptions = {}) {
    this.spacing = options.spacing ?? 22;
    this.radius = options.radius ?? 1.6;
    this.base = options.base ?? [64, 64, 64];
    this.lit = options.lit ?? [103, 232, 249];
    this.k = options.home ?? 0.05;
    this.couple = options.couple ?? 0.2;
    this.damping = options.damping ?? 0.84;
    this.still = options.still ?? false;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2D context");
    this.context = context;
    this.resize();
  }

  resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const S = this.spacing;
    this.cols = Math.ceil(this.width / S) + 3;
    // Margin rows above and below the window, so a row wraps round well out of sight.
    this.rows = Math.ceil(this.height / S) + 10;
    const n = this.cols * this.rows;
    this.dx = new Float32Array(n);
    this.dy = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.lift = new Float32Array(n);
    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.rowAt = new Float32Array(this.rows).fill(NaN);
    this.originX = (this.width % S) / 2 - S;
    this.render();
  }

  /** One physics step. Returns how much the sheet is still moving. */
  private step() {
    const { cols, rows, spacing: S, k, couple, damping, dx, dy, vx, vy, px, py } = this;
    const period = rows * S;
    const middle = this.height / 2;
    const stretchMoving = this.stretch.step();
    const limit = this.maxStretch;
    // Soft limit: the closer to the edge, the harder it pulls in, so a fling never stops dead.
    this.stretch.v = 1 + limit * Math.tanh((this.stretch.v - 1) / limit);
    const stretch = this.stretch.v;
    const pointer = this.pointer;
    const colliders = this.colliders.filter(
      (c) => c.pad > 0.5 && c.y < this.height + 80 && c.y + c.h > -80,
    );
    let energy = stretchMoving ? 1 : 0;
    px.set(dx);
    py.set(dy);

    for (let r = 0; r < rows; r++) {
      // Rows wrap, so a window-sized lattice covers a page of any length.
      const pageRow = ((((r * S - this.scrollY) % period) + period) % period) - 5 * S;
      const row = r * cols;
      // A row that just wrapped round is new cloth for another part of the page. Its old
      // offsets belong to wherever it was, so it starts flat; otherwise a fast scroll recycles
      // most of the lattice every frame and the whole sheet lights up with stale motion.
      if (Math.abs(pageRow - this.rowAt[r]) > period / 2) {
        dx.fill(0, row, row + cols);
        dy.fill(0, row, row + cols);
        vx.fill(0, row, row + cols);
        vy.fill(0, row, row + cols);
        px.fill(0, row, row + cols);
        py.fill(0, row, row + cols);
      }
      this.rowAt[r] = pageRow;
      const homeY = middle + (pageRow - middle) * stretch;
      const up = ((r + rows - 1) % rows) * cols;
      const down = ((r + 1) % rows) * cols;
      for (let c = 0; c < cols; c++) {
        const i = row + c;
        const homeX = this.originX + c * S;
        if (this.still) {
          this.x[i] = homeX;
          this.y[i] = homeY;
          continue;
        }
        const left = c > 0 ? i - 1 : i;
        const right = c < cols - 1 ? i + 1 : i;
        let fx = -k * px[i] + couple * (px[left] + px[right] + px[up + c] + px[down + c] - 4 * px[i]);
        let fy = -k * py[i] + couple * (py[left] + py[right] + py[up + c] + py[down + c] - 4 * py[i]);
        const X = homeX + dx[i];
        const Y = homeY + dy[i];
        if (pointer) {
          const ax = X - pointer.x;
          const ay = Y - pointer.y;
          const d = Math.hypot(ax, ay);
          if (d < pointer.reach && d > 0.01) {
            const s = (1 - d / pointer.reach) ** 2 * pointer.force;
            fx += (ax / d) * s;
            fy += (ay / d) * s;
          }
        }
        for (const p of this.presses) {
          const ax = X - p.x;
          const ay = Y - p.y;
          const reach = p.r + S * 0.9;
          if (ax > reach || ax < -reach || ay > reach || ay < -reach) continue;
          const d = Math.hypot(ax, ay);
          if (d < reach && d > 0.01) {
            const push = Math.min(reach - d, p.r + 4) * 0.16;
            fx += (ax / d) * push;
            fy += (ay / d) * push;
          }
        }
        for (const o of colliders) {
          if (X < o.x - o.pad || X > o.x + o.w + o.pad || Y < o.y - o.pad || Y > o.y + o.h + o.pad) continue;
          const sd = roundedRectDistance(X, Y, o);
          if (sd < o.pad) {
            const gx = roundedRectDistance(X + 0.75, Y, o) - sd;
            const gy = roundedRectDistance(X, Y + 0.75, o) - sd;
            const length = Math.hypot(gx, gy) || 1;
            // Capped, so dots deep under a card are not flung across the page.
            const push = Math.min(o.pad - sd, o.pad * 1.6) * o.str;
            fx += (gx / length) * push;
            fy += (gy / length) * push;
          }
        }
        vx[i] = (vx[i] + fx) * damping;
        vy[i] = (vy[i] + fy) * damping;
        dx[i] += vx[i];
        dy[i] += vy[i];
        this.x[i] = X;
        this.y[i] = Y;
        const speed = Math.abs(vx[i]) + Math.abs(vy[i]);
        this.lift[i] = Math.min(1, Math.hypot(dx[i], dy[i]) / 30 + speed * 0.1);
        energy += speed;
      }
    }
    return energy;
  }

  private draw() {
    const g = this.context;
    const levels = 6;
    const buckets: number[][] = Array.from({ length: levels }, () => []);
    g.clearRect(0, 0, this.width, this.height);
    const n = this.cols * this.rows;
    for (let i = 0; i < n; i++) {
      const y = this.y[i];
      if (y < -4 || y > this.height + 4) continue;
      buckets[Math.min(levels - 1, Math.floor(this.lift[i] * levels))].push(i);
    }
    const [r0, g0, b0] = this.base;
    const [r1, g1, b1] = this.lit;
    for (let b = 0; b < levels; b++) {
      if (!buckets[b].length) continue;
      const t = b / (levels - 1);
      g.fillStyle = `rgb(${Math.round(r0 + (r1 - r0) * t)},${Math.round(g0 + (g1 - g0) * t)},${Math.round(b0 + (b1 - b0) * t)})`;
      const rad = this.radius + t * 0.8;
      g.beginPath();
      for (const i of buckets[b]) {
        g.moveTo(this.x[i] + rad, this.y[i]);
        g.arc(this.x[i], this.y[i], rad, 0, Math.PI * 2);
      }
      g.fill();
    }
    this.afterDraw?.(g);
  }

  /** Steps and draws one frame without starting the loop. */
  render() {
    this.beforeFrame?.();
    this.step();
    this.draw();
  }

  private tick = () => {
    this.frame = 0;
    if (!this.running) return;
    this.beforeFrame?.();
    const energy = this.step();
    this.draw();
    if (energy > 0.6 || this.busy) this.frame = requestAnimationFrame(this.tick);
  };

  wake() {
    if (!this.running) return;
    if (this.still) {
      this.render();
      return;
    }
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  /** A radial kick that rings out through the sheet, for a release or a tap. */
  ripple(x: number, y: number, reach: number, strength: number) {
    if (this.still) return;
    const n = this.cols * this.rows;
    for (let i = 0; i < n; i++) {
      const ax = this.x[i] - x;
      const ay = this.y[i] - y;
      const d = Math.hypot(ax, ay);
      if (d < reach && d > 0.01) {
        const s = (1 - d / reach) * strength;
        this.vx[i] += (ax / d) * s;
        this.vy[i] += (ay / d) * s;
      }
    }
    this.wake();
  }

  /** Takes most of the stretch out of the sheet at once, keeping a little to settle. */
  calm(keep = 0.35) {
    for (let i = 0; i < this.dx.length; i++) {
      this.dx[i] *= keep;
      this.dy[i] *= keep;
      this.vx[i] *= keep;
      this.vy[i] *= keep;
    }
    this.wake();
  }

  start() {
    this.running = true;
    this.render();
    this.wake();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}
