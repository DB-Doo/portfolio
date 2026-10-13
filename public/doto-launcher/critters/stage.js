"use strict";
/*
 * Mounts the Canvas Critters on one canvas: a Doto home screen with the spider's nest and the
 * Roomba's dock, both critters living on it together. The engine (world.js, spider.js, roomba.js)
 * is the launcher's browser mock of the feature; this file only wires it to a page.
 *
 * Both critters share one world, so they share its cloth, balls and silk. Each one sees the world
 * through its own view, where its own home is "home" and the other's is just an obstacle.
 */
(() => {
  function roommates(w, items, homes) {
    const view = (own, other) => {
      const v = Object.create(w);
      v.items = [own, ...items.filter((o) => !o.home), { ...other, home: false, kind: "obstacle", name: "the other home" }];
      return v;
    };
    const sp = new JumpingSpider(view(homes.nest, homes.dock), 3);
    const rb = new Roomba(view(homes.dock, homes.nest), 5);
    // A Roomba's dock is the first item its view lists, so it never sees the nest as home.
    // A flick on empty space throws one ball, not one per critter.
    rb.throwBall = () => {};
    const parts = [sp, rb];
    const all = (fn) => (...a) => { for (const p of parts) p[fn]?.(...a); };
    return {
      sp, rb,
      step: all("step"), press: all("press"), drawUnder: all("drawUnder"), drawShadow: all("drawShadow"),
      draw: all("draw"), drawOver: all("drawOver"), bodyBlocks: all("bodyBlocks"),
      down: all("down"), move: all("move"), long: all("long"),
      ballLanded: all("ballLanded"), musicChanged: all("musicChanged"),
      drawHome(ctx, o) { (o.kind === "nest" ? sp : rb).drawHome(ctx, o); },
      hit(x, y) { return sp.hit(x, y) || rb.hit(x, y); },
      up(t, g, vx, vy) {
        if (t.on === "spider") return sp.up(t, g, vx, vy);
        if (t.on === "roomba") return rb.up(t, g, vx, vy);
        for (const p of parts) p.up(t, g, vx, vy);
      },
      key() { sp.key(); },
      presence() { rb.seen = w.clock; },
    };
  }

  /**
   * Starts the critters on `canvas`. Returns controls: `wake()` starts the loop (used after reduced
   * motion), `stop()` tears it down. The loop skips frames while `isVisible()` is false or the tab
   * is hidden, so an off-screen phone costs nothing.
   */
  function mount(canvas, opts = {}) {
    setStage(300, 620, 0.4);
    setFonts(opts.fontDots, opts.fontMono);
    const items = homeScreen("nest");
    const dock = { x: 150, y: 240, hw: 30, hh: 30, r: 30, kind: "dock", home: true, name: "its dock" };
    items.push(dock);
    const homes = { nest: items.find((o) => o.kind === "nest"), dock };
    const world = new World(canvas, "nest", 3, (w) => roommates(w, items, homes), { items, hover: true });
    const isVisible = opts.isVisible || (() => true);
    let raf = 0, alive = true;
    const loop = (now) => {
      if (!alive) return;
      if (isVisible() && !document.hidden) world.frame(now); else world.last = now;
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => world.resize();
    addEventListener("resize", onResize);
    VIEW.paused = false;
    if (opts.still) { VIEW.paused = true; world.frame(performance.now()); }
    else loop(performance.now());
    return {
      wake() { if (!alive || !VIEW.paused) return; VIEW.paused = false; world.last = 0; loop(performance.now()); },
      toss() { world.critter.key(); },
      stop() { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", onResize); },
    };
  }

  /**
   * Puts the critters on a section of a web page. The page's own elements are the room: `walls`
   * (text and controls) are driven around and never stopped on, `ledges` (cards) can be stood on
   * and carry whoever stands on them as they move. Items are measured from the DOM every frame, so
   * parallax, floating and scrolling all just work.
   *
   * The section feeds the pointer (`input`), so links and text underneath keep working. The cloth
   * is drawn on `fabricCanvas` under the section's overlays, the critters on `canvas` above it.
   * They stay asleep at home until someone moves over the open dots.
   */
  function mountPage(o) {
    const { canvas, fabricCanvas, input } = o;
    const zoom = o.zoom || 1;
    let box = canvas.getBoundingClientRect();
    setStage(box.width / zoom, box.height / zoom, 1, [64, 64, 64], [103, 232, 249]);
    setFonts(o.fontDots, o.fontMono);

    const page = [];
    for (const el of o.walls()) page.push({ el, wall: true, kind: "page", page: true, name: el.dataset.critterName || "the page" });
    for (const el of o.ledges()) page.push({ el, wall: false, kind: "page", page: true, name: el.dataset.critterName || "a card" });
    const nest = { kind: "nest", home: true, bare: true, hw: 24, hh: 24, r: 24, x: 0, y: 0, name: "its nest" };
    const dock = { kind: "dock", home: true, bare: true, hw: 26, hh: 26, r: 26, x: 0, y: 0, name: "its dock" };

    const measure = () => {
      box = canvas.getBoundingClientRect();
      let moved = 0;
      for (const it of page) {
        const r = it.el.getBoundingClientRect();
        const hw = r.width / 2 / zoom, hh = r.height / 2 / zoom;
        // The jiggle a bump gives a card is ours, so take it back out before comparing.
        const x = (r.left - box.left) / zoom + hw - (it.jx || 0), y = (r.top - box.top) / zoom + hh - (it.jy || 0);
        it.dx = it.x === undefined ? 0 : x - it.x; it.dy = it.y === undefined ? 0 : y - it.y;
        moved += Math.abs(it.dx) + Math.abs(it.dy) + Math.abs((it.hw || hw) - hw) + Math.abs((it.hh || hh) - hh);
        Object.assign(it, { x, y, hw, hh, r: Math.min(14 / zoom, hw, hh) });
      }
      const host = o.nestOn && page.find((it) => it.el === o.nestOn);
      const nx = host ? host.x + host.hw * 0.35 : W - 80, ny = host ? host.y - host.hh * 0.55 : 120;
      nest.dx = nest.x ? nx - nest.x : 0; nest.dy = nest.y ? ny - nest.y : 0; nest.x = nx; nest.y = ny;
      const d = o.dockAt(box, zoom);
      dock.x = d[0]; dock.y = d[1]; dock.face = d[2] ?? -Math.PI / 2;
      return moved;
    };
    measure();
    const items = [...page, nest, dock];
    const world = new World(canvas, "nest", 3, (w) => roommates(w, items, { nest, dock }), {
      items, fabricItems: [], fabricCanvas, input, signal: o.signal,
      hover: true, clear: true, chrome: false, spacing: 22 / zoom, dot: 1.6 / zoom, maxDpr: 2,
    });
    const { sp, rb } = world.critter;
    window.__critters = world;

    // Asleep until someone comes over: the spider in its nest, the Roomba on its dock.
    let met = false;
    rb.seen = -999;
    const presence = world.critter.presence;
    world.critter.presence = () => { met = true; presence(); };

    let sinceMap = 0, drift = 0;
    rb.placeDock();
    /** Carries whatever stands on a ledge along with it, and mirrors bumps onto the page. */
    const follow = (dt) => {
      drift += measure();
      rb.placeDock();
      sinceMap += dt;
      if (drift > 4 && sinceMap > 0.4) { rb.maps = null; drift = 0; sinceMap = 0; }
      for (const it of [...page.filter((p) => !p.wall), nest]) {
        if (!it.dx && !it.dy) continue;
        const on = (x, y) => sdf(it, x, y) < 2;
        if (!sp.jump && sp.z < WIDGET_TOP + 12 && on(sp.x, sp.y)) { sp.x += it.dx; sp.y += it.dy; }
        if (rb.z > 3 && on(rb.x, rb.y)) { rb.x += it.dx; rb.y += it.dy; }
        for (const b of world.balls) if (!b.held && on(b.x, b.y + b.r + 1)) { b.x += it.dx; b.y += it.dy; }
      }
      for (const it of page) {
        if (it.wall) continue;
        const jx = it.jx || 0, jy = it.jy || 0;
        if (jx || jy || it.jiggled) { it.el.style.translate = jx || jy ? `${(jx * zoom).toFixed(2)}px ${(jy * zoom).toFixed(2)}px` : ""; it.jiggled = !!(jx || jy); }
      }
      if (!met) {
        if (sp.act.kind === "emerge") sp.act.t = 0;
        rb.seen = Math.min(rb.seen, world.clock - 999);
      }
    };

    const isVisible = o.isVisible || (() => true);
    const hang = o.dangleCanvas ? dangler(o, sp, rb, zoom) : null;
    let raf = 0, alive = true, last = 0;
    const loop = (now) => {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      if (isVisible() && !document.hidden) { if (!VIEW.paused) follow(dt); last = now; world.frame(now); }
      else { world.last = now; last = now; }
      if (hang && !document.hidden) { hang.step(dt); hang.draw(); }
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => { measure(); world.resize(); rb.maps = null; };
    addEventListener("resize", onResize, { signal: o.signal });
    VIEW.paused = !!o.still;
    if (o.still) world.frame(performance.now());
    else loop(performance.now());
    return {
      wake() { if (!alive || !VIEW.paused) return; VIEW.paused = false; met = true; world.last = 0; loop(performance.now()); },
      toss() { met = true; presence(); sp.key(); },
      stop() {
        alive = false; cancelAnimationFrame(raf);
        for (const it of page) it.el.style.translate = "";
      },
    };
  }

  /**
   * Below the hero the pair follow the reader down the page: the spider lets itself down on a
   * dragline from the top of the window, head first, with the Roomba hanging off a second thread
   * under it. The lines are chains of points under gravity, so they drop with a bounce, swing
   * when the scrolling speeds up or stops, and reel back up before the hero comes into view.
   * It draws on its own fixed canvas in the page's right margin and never takes the pointer.
   */
  function dangler(o, sp, rb, zoom) {
    const c = o.dangleCanvas, ctx = c.getContext("2d");
    const N = 18, M = 7, SPIDER_BACK = 18, SPIDER_FRONT = 13;
    const rope = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    const tail = Array.from({ length: M }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    let L = 0, on = false, vw = 0, vh = 0, dpr = 1, ax = 0, scale = zoom;
    let lastY = scrollY, vel = 0, clock = 0, drawn = false;
    const size = () => {
      vw = innerWidth; vh = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
      c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr);
    };
    size();
    addEventListener("resize", size, { signal: o.signal });
    const place = (pts, x, y) => { for (const p of pts) { p.x = p.px = x; p.y = p.py = y; } };
    const integrate = (pts, dt, ay, kick) => {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i], vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
        p.px = p.x; p.py = p.y;
        p.x += vx + kick * (i / pts.length) * dt * dt; p.y += vy + ay * dt * dt;
      }
    };
    const constrain = (pts, seg, k) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-4;
        const f = ((d - seg) / d) * k;
        // The top of each line is held; only the lower point gives.
        if (i === 1) { b.x -= dx * f; b.y -= dy * f; }
        else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
      }
    };
    const dots = (pts) => {
      ctx.fillStyle = rgba(INK, 0.42);
      let carry = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y);
        for (let t = carry; t < d; t += 3.2) { ctx.beginPath(); ctx.arc(a.x + ((b.x - a.x) * t) / d, a.y + ((b.y - a.y) * t) / d, 0.65, 0, TAU); ctx.fill(); }
        carry = (carry - d) % 3.2; if (carry < 0) carry += 3.2;
      }
      // A glint runs down the line, the way silk catches light.
      const g = (clock * 0.45) % 1, i = Math.min(pts.length - 2, Math.floor(g * (pts.length - 1))), u = g * (pts.length - 1) - i;
      const p = pts[i], q = pts[i + 1];
      ctx.fillStyle = rgba(CYAN, 0.6 * Math.sin(g * Math.PI));
      ctx.beginPath(); ctx.arc(lerp(p.x, q.x, u), lerp(p.y, q.y, u), 1, 0, TAU); ctx.fill();
    };
    return {
      step(dt) {
        const free = o.margin(), below = o.below();
        // They come down once the hero is well gone, and are back up before it returns.
        const want = below > (on ? 200 : 260) && free >= 90 && !VIEW.paused;
        scale = Math.min(zoom, free / 80);
        ax = vw - free / 2;
        const v = (scrollY - lastY) / Math.max(dt, 1e-3); lastY = scrollY;
        const acc = clamp((v - vel) / Math.max(dt, 1e-3), -9000, 9000); vel = lerp(vel, v, 0.5);
        if (want && !on) { on = true; L = 0; place(rope, ax, -6); place(tail, ax, -6); }
        if (!on) { if (drawn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); drawn = false; } return; }
        clock += dt; sp.clock += dt; rb.clock += dt;
        // Lowered further the further down the page you read, never past mid-window.
        const target = want ? clamp(vh * 0.14 + below * 0.08, vh * 0.14, vh * 0.4) : 0;
        L = target > L ? Math.min(target, L + 900 * dt) : Math.max(target, L - (want ? 700 : 1800) * dt);
        // Never on screen together with the hero's own pair.
        if ((!want && L < 2) || below === 0) { on = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); drawn = false; return; }
        // Scrolling that speeds up or brakes swings them, the way a sudden stop swings a pendant.
        const ay = 1500 - acc * 0.12, kick = -acc * 0.05 * Math.sin(clock * 1.7);
        rope[0].x = rope[0].px = ax; rope[0].y = rope[0].py = -6;
        const sub = 3, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          integrate(rope, h, ay, kick);
          for (let k = 0; k < 6; k++) constrain(rope, L / (N - 1), 0.55);
          const e = rope[N - 1], f = rope[N - 2], d = Math.hypot(e.x - f.x, e.y - f.y) || 1;
          tail[0].x = tail[0].px = e.x + ((e.x - f.x) / d) * (SPIDER_BACK + SPIDER_FRONT) * scale;
          tail[0].y = tail[0].py = e.y + ((e.y - f.y) / d) * (SPIDER_BACK + SPIDER_FRONT) * scale;
          integrate(tail, h, ay, kick * 0.6);
          for (let k = 0; k < 6; k++) constrain(tail, (22 * scale) / (M - 1), 0.6);
        }
        // Keep the pair inside the margin, however hard they swing.
        for (const p of [...rope, ...tail]) p.x = clamp(p.x, ax - free / 2 + 22, ax + free / 2 - 22);
      },
      draw() {
        if (!on) return;
        drawn = true;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
        dots(rope); dots(tail);
        const e = rope[N - 1], f = rope[N - 2];
        const down = Math.atan2(e.y - f.y, e.x - f.x);
        // Head first: the dragline leaves from the back of the abdomen.
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(down - Math.atan2(sp.fy, sp.fx)); ctx.scale(scale, scale);
        // Where the spider is drawn, not where it stands: it may be up on a card.
        const sc = project(sp.x, sp.y, sp.z || 0, [0, 0]);
        ctx.translate(-(sc[0] - sp.fx * SPIDER_BACK), -(sc[1] - sp.fy * SPIDER_BACK));
        sp.draw(ctx); ctx.restore();
        const t = tail[M - 1], u = tail[M - 2];
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(Math.atan2(t.y - u.y, t.x - u.x) - Math.PI / 2); ctx.scale(scale, scale);
        const rc = project(rb.x, rb.y, rb.z || 0, [0, 0]);
        ctx.translate(-rc[0], -(rc[1] - RR - 2));
        rb.draw(ctx); ctx.restore();
      },
    };
  }

  window.DotoCritters = { mount, mountPage };
})();
