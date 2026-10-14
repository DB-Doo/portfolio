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
    // A critter that is `away` (the spider out on its dragline) sits out of the room entirely.
    const all = (fn) => (...a) => { for (const p of parts) if (!p.away) p[fn]?.(...a); };
    return {
      sp, rb,
      step: all("step"), press: all("press"), drawUnder: all("drawUnder"), drawShadow: all("drawShadow"),
      draw: all("draw"), drawOver: all("drawOver"), bodyBlocks: all("bodyBlocks"),
      down: all("down"), move: all("move"), long: all("long"),
      ballLanded: all("ballLanded"), musicChanged: all("musicChanged"),
      drawHome(ctx, o) { (o.kind === "nest" ? sp : rb).drawHome(ctx, o); },
      hit(x, y) { return (!sp.away && sp.hit(x, y)) || (!rb.away && rb.hit(x, y)); },
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

    let sinceMap = 0, drift = 0, lastScroll = scrollY;
    rb.placeDock();
    // Carries the spider with whatever it stands on, feet included, so its legs never stretch.
    const carry = (dx, dy) => {
      sp.x += dx; sp.y += dy;
      for (const f of sp.feet) { f.x += dx; f.y += dy; }
    };
    /** Carries whatever stands on a ledge along with it, and mirrors bumps onto the page. */
    const follow = (dt) => {
      drift += measure();
      rb.placeDock();
      sinceMap += dt;
      if (drift > 4 && sinceMap > 0.4) { rb.maps = null; drift = 0; sinceMap = 0; }
      for (const it of [...page.filter((p) => !p.wall), nest]) {
        if (!it.dx && !it.dy) continue;
        const on = (x, y) => sdf(it, x, y) < 2;
        if (!sp.away && !sp.jump && sp.z < WIDGET_TOP + 12 && on(sp.x, sp.y)) carry(it.dx, it.dy);
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


  /**
   * Lets the pair live on the whole site: one window-sized world over the page's own dot sheet,
   * on every page. The window is the room. Text and controls on screen (`walls`) are driven
   * around, cards and pictures (`ledges`) can be stood on and carry whoever stands on them as
   * the page scrolls, and anything scrolled out of view leaves the room. The page draws the
   * sheet (`noFabric`), so every dent a foot, the Roomba or a ball makes is handed to `press`
   * in window pixels instead. The nest and the dock are places in the window from `nestAt` and
   * `dockAt`; when those move, the homes glide there and carry whoever is in them.
   */
  function mountSite(o) {
    const { canvas, input } = o;
    const zoom = o.zoom || 1;
    let box = canvas.getBoundingClientRect();
    setStage(box.width / zoom, box.height / zoom, 1, [64, 64, 64], [103, 232, 249]);
    setFonts(o.fontDots, o.fontMono);

    const page = [];
    for (const el of o.walls()) page.push({ el, wall: true, kind: "page", page: true, name: el.dataset.critterName || "the page" });
    for (const el of o.ledges()) page.push({ el, wall: false, kind: "page", page: true, name: el.dataset.critterName || "a card" });
    const nest = { kind: "nest", home: true, bare: true, hw: 24, hh: 24, r: 24, x: 0, y: 0, name: "its nest" };
    const dock = { kind: "dock", home: true, bare: true, hw: 26, hh: 26, r: 26, x: 0, y: 0, name: "its dock" };
    const OUT = -9999;
    let first = true;

    const measure = () => {
      box = canvas.getBoundingClientRect();
      let moved = 0;
      for (const it of page) {
        const r = it.el.getBoundingClientRect();
        // Scrolled out of the window, or hidden: out of the room until it comes back.
        if (!r.width || r.bottom < -160 || r.top > box.height + 160) {
          if (it.x !== OUT) { Object.assign(it, { x: OUT, y: OUT, hw: 1, hh: 1, r: 1 }); moved += 50; }
          it.dx = 0; it.dy = 0;
          continue;
        }
        const hw = r.width / 2 / zoom, hh = r.height / 2 / zoom;
        const x = (r.left - box.left) / zoom + hw - (it.jx || 0), y = (r.top - box.top) / zoom + hh - (it.jy || 0);
        const fresh = it.x === undefined || it.x === OUT;
        it.dx = fresh ? 0 : x - it.x; it.dy = fresh ? 0 : y - it.y;
        moved += fresh ? 50 : Math.abs(it.dx) + Math.abs(it.dy) + Math.abs((it.hw || hw) - hw) + Math.abs((it.hh || hh) - hh);
        Object.assign(it, { x, y, hw, hh, r: Math.min(14 / zoom, hw, hh) });
      }
      const n = o.nestAt(box, zoom), d = o.dockAt(box, zoom);
      const k = first ? 1 : 0.16;
      const nx = lerp(nest.x, n[0], k), ny = lerp(nest.y, n[1], k);
      nest.dx = first ? 0 : nx - nest.x; nest.dy = first ? 0 : ny - nest.y; nest.x = nx; nest.y = ny;
      dock.x = lerp(dock.x, d[0], k); dock.y = lerp(dock.y, d[1], k); dock.face = d[2] ?? -Math.PI / 2;
      first = false;
      return moved;
    };
    measure();
    const items = [...page, nest, dock];
    const world = new World(canvas, "nest", 3, (w) => roommates(w, items, { nest, dock }), {
      items, fabricItems: [], input, signal: o.signal, noFabric: true,
      hover: true, clear: true, chrome: false, spacing: 22 / zoom, dot: 1.6 / zoom, maxDpr: 2,
    });
    const { sp, rb } = world.critter;
    window.__critters = world;

    // Every dent goes to the page's sheet, in window pixels.
    let dents = [];
    const fab = world.fabric, pressCloth = fab.press.bind(fab);
    fab.press = (x, y, r, tint) => { pressCloth(x, y, r, tint); if (r > 0.3) dents.push({ x: x * zoom, y: y * zoom, r: r * zoom }); };

    let met = false;
    rb.seen = -999;
    const presence = world.critter.presence;
    world.critter.presence = () => { met = true; presence(); };

    let sinceMap = 0, drift = 0, lastScroll = scrollY;
    rb.placeDock();
    // Carries the spider with whatever it stands on, feet included, so its legs never stretch.
    const carry = (dx, dy) => {
      sp.x += dx; sp.y += dy;
      for (const f of sp.feet) { f.x += dx; f.y += dy; }
    };
    const follow = (dt) => {
      drift += measure();
      rb.placeDock();
      sinceMap += dt;
      // While the page scrolls the floor plan changes every frame; redraw the Roomba's map of
      // it now and then, not every frame.
      if (drift > 4 && sinceMap > 0.5) { rb.maps = null; drift = 0; sinceMap = 0; }
      for (const it of [...page.filter((p) => !p.wall), nest]) {
        if (!it.dx && !it.dy) continue;
        const on = (x, y) => sdf(it, x, y) < 2;
        if (!sp.away && !sp.jump && sp.z < WIDGET_TOP + 12 && on(sp.x, sp.y)) carry(it.dx, it.dy);
        if (rb.z > 3 && on(rb.x, rb.y)) { rb.x += it.dx; rb.y += it.dy; }
        for (const b of world.balls) if (!b.held && on(b.x, b.y + b.r + 1)) { b.x += it.dx; b.y += it.dy; }
      }
      // Silk is tied to the page, so it scrolls with it rather than stretching back to where
      // it was spun. A line still being paid out keeps its far end on the spider.
      const scrolled = (lastScroll - scrollY) / zoom;
      lastScroll = scrollY;
      if (scrolled) for (const t of world.silk) { t.ay += scrolled; if (!t.flying) t.by += scrolled; }
      // Whoever was carried off the edge of the window comes back in at the edge.
      const bx = sp.x, by = sp.y;
      sp.inBounds?.();
      if (sp.x !== bx || sp.y !== by) for (const f of sp.feet) { f.x += sp.x - bx; f.y += sp.y - by; }
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

    const rope = abseil({ ...o, onLand: () => { met = true; }, onWake: () => { met = true; }, dent: (x, y, r) => dents.push({ x, y, r }) }, sp, rb, zoom);
    let raf = 0, alive = true, last = 0;
    const loop = (now) => {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      if (!document.hidden) {
        if (!VIEW.paused) follow(dt);
        last = now;
        dents = [];
        world.frame(now);
        rope.step(dt); rope.draw();
        o.press?.(dents);
      } else { world.last = now; last = now; }
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      box = canvas.getBoundingClientRect();
      setStage(box.width / zoom, box.height / zoom, 1, [64, 64, 64], [103, 232, 249]);
      measure(); world.resize(); rb.maps = null;
    };
    addEventListener("resize", onResize, { signal: o.signal });
    VIEW.paused = !!o.still;
    if (o.still) { world.frame(performance.now()); o.press?.(dents); }
    else loop(performance.now());
    return {
      wake() { if (!alive || !VIEW.paused) return; VIEW.paused = false; met = true; world.last = 0; loop(performance.now()); },
      toss() { met = true; presence(); sp.key(); },
      stop() {
        alive = false; cancelAnimationFrame(raf); rope.remove();
        for (const it of page) it.el.style.translate = "";
      },
    };
  }

  /**
   * Down the page, the spider lets itself down a dragline (Dan, 2026-10-13). Once the reader
   * scrolls past the first screen it pays out silk from where it stands, straight up to the top
   * of the window, so it never jumps: the line appears above it and it swings into hanging head
   * first. Then it drifts over to the right edge and lowers itself as the reader goes, the whole
   * page's length mapped onto the window's height, so it reaches the bottom with the reader. The
   * line is a chain of points under gravity, so a sudden scroll swings it. Scrolled back to the
   * top it turns upright and steps off the line where it hangs.
   * It draws on its own fixed canvas and never takes the pointer.
   */
  function abseil(o, sp, rb, zoom) {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "30" });
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const N = 16, M = 8, BACK = 18, FRONT = 13;
    const chain = (n) => Array.from({ length: n }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    const pts = chain(N), tail = chain(M);
    let vw = 0, vh = 0, dpr = 1, state = "off", L = 0, ax = 0, turn = 0, fade = 0, clock = 0;
    // The Roomba's ride, picked at random each time they go down together (Dan, 2026-10-14):
    //   lasso  the spider casts a thread down to it and reels it up to hang underneath;
    //   jet    it lifts off on little puffs, flies to the line and slides down it to the spider;
    //   hop    it crouches, springs onto the line in one arc and slides down.
    // Then it rides either hanging under the spider ("hang") or clipped on the line above it
    // ("bead"), now and then turning slowly on its thread.
    let ride = "off", how = "", Lt = 0, rturn = 0, rfade = 0, shot = 0;
    let fly = null, bead = 0, spin = 0, spinV = 0, nextSpin = 4, rx = 0, ry = 0, rang = 0, rscale = 1;
    const puffs = [];
    // Drawn angles, smoothed, so the dotted bodies don't shimmer as the line trembles.
    let sDraw = 0, rDraw = 0;
    const settle = (cur, to, k) => cur + wrap(to - cur) * k;
    let lastHow = "", wakeT = 0;
    // What it gets up to while it rides (Dan, 2026-10-14, "I like all of them"):
    //   ring     its light ring fills as the reader goes down the page, green at the bottom;
    //   doze     reading stops for a while and it nods off on the thread; a scroll jolts it awake;
    //   bungee   a hard flick drops it on a stretchy cord, its side brush spinning to steady it;
    //   five     it and the spider bump as each section heading goes by;
    //   swing    when the scroll stops after a run, the line swings and settles;
    //   beam     it sweeps its headlight over each card it passes;
    //   swap     now and then it climbs round the spider to ride the other end;
    //   lap      at the bottom it hops off for a victory lap, and rejoins when the reader heads up.
    let idle = 0, doze = 0, jolt = 0, joy = 0, bo = 0, bv = 0, bcd = 0, ox = 0, oy = 0, cord = [0, 0];
    let fiveCd = 0, fiveT = -1, fiveSpark = false, runSp = 0, swung = true, swingT = 0, beam = null, lit = new WeakSet();
    let swap = null, nextSwap = 18 + Math.random() * 14, lapT = -1, lapped = false, leap = null, duck = 0;
    let heads = [], cards = [], scanT = 0;
    const headTop = new WeakMap();
    let lastY = scrollY, vel = 0, drawn = false;
    const size = () => {
      vw = innerWidth; vh = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
      c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr);
    };
    size();
    addEventListener("resize", size, { signal: o.signal });
    const lane = () => vw - clamp(vw * 0.05, 20, 72);
    // Where the abdomen's tip is drawn, in window pixels: the line's lower end.
    const tip = () => {
      const sc = project(sp.x, sp.y, sp.z || 0, [0, 0]);
      return [(sc[0] - sp.fx * BACK) * zoom, (sc[1] - sp.fy * BACK) * zoom];
    };
    // Where the top of the Roomba is drawn: where its thread is tied.
    const lug = () => {
      const rc = project(rb.x, rb.y, rb.z || 0, [0, 0]);
      return [rc[0] * zoom, (rc[1] - RR - 2) * zoom];
    };
    const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
    const ease = (t) => t * t * (3 - 2 * t);
    // How far the spider is turned from how it stood: along the line once fully turned.
    const spinOf = () => {
      const e = pts[N - 1], f = pts[N - 2];
      return wrap(Math.atan2(e.y - f.y, e.x - f.x) - Math.atan2(sp.fy, sp.fx)) * ease(turn);
    };
    // The spider's head as drawn, where it holds the Roomba's thread.
    const head = () => {
      const e = pts[N - 1], r = spinOf(), d = (BACK + FRONT) * zoom;
      const hx = sp.fx * d, hy = sp.fy * d;
      return [e.x + hx * Math.cos(r) - hy * Math.sin(r), e.y + hx * Math.sin(r) + hy * Math.cos(r)];
    };
    const lay = (arr, x0, y0, x1, y1) => {
      for (let i = 0; i < arr.length; i++) {
        const t = i / (arr.length - 1), p = arr[i];
        p.x = p.px = lerp(x0, x1, t); p.y = p.py = lerp(y0, y1, t);
      }
    };
    const integrate = (arr, dt, ay, kick) => {
      // Looser while a stop has set it swinging, so the swing carries and settles slowly.
      const damp = swingT > 0 ? 0.985 + 0.009 * Math.min(1, swingT) : 0.985;
      for (let i = 1; i < arr.length; i++) {
        const p = arr[i], vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y;
        p.x += vx + kick * (i / arr.length) * dt * dt; p.y += vy + ay * dt * dt;
      }
    };
    const constrain = (arr, seg) => {
      for (let i = 1; i < arr.length; i++) {
        const a = arr[i - 1], b = arr[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-4;
        const f = ((d - seg) / d) * 0.55;
        if (i === 1) { b.x -= dx * f; b.y -= dy * f; }
        else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
      }
    };
    const silk = (arr, alpha) => {
      ctx.fillStyle = rgba(INK, 0.42 * alpha);
      let carry = 0;
      for (let i = 1; i < arr.length; i++) {
        const a = arr[i - 1], b = arr[i], d = Math.hypot(b.x - a.x, b.y - a.y);
        for (let t = carry; t < d; t += 3.2) { ctx.beginPath(); ctx.arc(a.x + ((b.x - a.x) * t) / d, a.y + ((b.y - a.y) * t) / d, 0.65, 0, TAU); ctx.fill(); }
        carry = (carry - d) % 3.2; if (carry < 0) carry += 3.2;
      }
    };
    // A point a given distance down the main line, and the line's direction there.
    const along = (dist) => {
      let left = clamp(dist, 0, L);
      for (let i = 1; i < N; i++) {
        const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y) || 1e-4;
        if (left <= d || i === N - 1) { const t = Math.min(1, left / d); return [lerp(a.x, b.x, t), lerp(a.y, b.y, t), Math.atan2(b.y - a.y, b.x - a.x)]; }
        left -= d;
      }
      return [pts[N - 1].x, pts[N - 1].y, Math.PI / 2];
    };
    const BEAD = () => 80 * zoom;
    const clear = () => { if (drawn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); drawn = false; } };
    // The Roomba lets go and is back on the floor where it hangs, the right way up.
    const dropRoomba = () => {
      rx += ox; ry += oy; ox = oy = bo = bv = 0;
      rb.ring = null; rb.doze = 0; rb.ringFlash = 0; swap = null; leap = null; beam = null;
      const [lx, ly] = lug();
      rb.x += (rx - lx) / zoom; rb.y += (ry - ly) / zoom;
      rb.squash = 0.5;
      rb.away = false; ride = "off"; rturn = 0; fly = null; spin = 0; rb.maps = null;
    };
    return {
      step(dt) {
        const room = Math.max(1, document.documentElement.scrollHeight - vh);
        const start = vh * 0.5;
        const want = !VIEW.paused && room > vh * 0.6 && scrollY > (state === "off" ? start : vh * 0.3);
        const v = (scrollY - lastY) / Math.max(dt, 1e-3); lastY = scrollY;
        const acc = clamp((v - vel) / Math.max(dt, 1e-3), -9000, 9000); vel = lerp(vel, v, 0.5);
        if (state === "fading") {
          // The line it left goes slack and fades out.
          fade -= dt * 2.5;
          for (let i = 1; i < N; i++) pts[i].y += dt * 40 * (i / N);
          if (fade <= 0) { state = "off"; clear(); }
          return;
        }
        if (state === "off") {
          if (!want || sp.jump || sp.held) return;
          // Pays out a line straight up from where it is.
          const [x, y] = tip();
          if (y < 30 || y > vh - 10 || x < 0 || x > vw) return;
          ax = x; L = y + 6; turn = 0; fade = 0; lay(pts, x, -6, x, y);
          sp.away = true; state = "on";
        }
        clock += dt; sp.clock += dt;
        if (state === "on" && !want) state = "landing";
        if (state === "landing" && want) state = "on";
        fade = Math.min(1, fade + dt * 3);
        if (state === "on") {
          // Over to the right edge, and down as far through the window as the reader is through
          // the page: the line is a live reading-progress meter (Dan, 2026-10-13), so it tracks
          // the scroll closely, only easing enough to stay soft.
          ax = lerp(ax, lane(), 1 - Math.exp(-dt * 2.6));
          const p = clamp(scrollY / room, 0, 1);
          // Room below for the Roomba riding under it.
          const target = lerp(vh * 0.1, vh * 0.74, p) + 6;
          // Just on the line it eases over gently; once hanging it follows closely.
          const grip = lerp(1, 6, turn);
          L += clamp((target - L) * (1 - Math.exp(-dt * grip)), -900 * dt, 900 * dt);
          // Swings round to hang head first slowly, over about a second and a half.
          turn = Math.min(1, turn + dt * 0.65);
        } else {
          turn = Math.max(0, turn - dt * 0.9);
        }
        // Once the spider is hanging, the Roomba joins it, a different way each time. Every
        // start is tied to where the Roomba stands, so nothing jumps.
        // First it wakes. Asleep on its charger it opens its eyes and rolls out of the dock;
        // it only joins once it is up and about (Dan, 2026-10-14: it launched still asleep).
        if (ride === "off" && state === "on" && turn > 0.35 && !rb.held && !rb.away) {
          o.onWake?.();
          rb.seen = rb.w.clock; rb.mood = "open"; rb.blinkIn = 0;
          // A green blink of its ring as it comes to; the dock's own beat then rolls it out.
          rb.marks.push({ type: "pulse", x: rb.x, y: rb.y - 3, age: 0, life: 0.6, r0: 10, col: "#5eead4" });
          if (rb.act.kind === "docked") rb.thought = "The spider's off down its line. Waking up to join it";
          ride = "waking"; wakeT = 0;
        }
        if (ride === "waking") {
          wakeT += dt; rb.seen = rb.w.clock;
          const busy = rb.act.kind === "docked" || rb.act.kind === "launch" || rb.held || rb.z > 3;
          if (state !== "on") ride = "off";
          else if ((wakeT > 1.1 && !busy) || wakeT > 4) ride = "ready";
        }
        if (ride === "ready" && state === "on" && !rb.held && !rb.away) {
          const [lx, ly] = lug();
          if (lx > 0 && lx < vw && ly > 0 && ly < vh) {
            const ways = ["lasso", "jet", "hop"].filter((w) => w !== lastHow);
            how = lastHow = ways[Math.floor(Math.random() * ways.length)];
            rb.away = true; rb.mood = "open"; rturn = 0; rfade = 0; spin = 0; spinV = 0; nextSpin = 5 + Math.random() * 5;
            rx = lx; ry = ly; rang = 0; rscale = 1;
            if (how === "lasso") {
              const [hx, hy] = head();
              Lt = Math.hypot(lx - hx, ly - hy); lay(tail, hx, hy, lx, ly); shot = 0; ride = "hang";
            } else {
              ride = "fly";
              const [px, py] = along(L * 0.45), d = Math.hypot(px - lx, py - ly);
              fly = { t: 0, sx: lx, sy: ly, crouch: how === "hop" ? 0.5 : 0.75, dur: clamp(d / (how === "jet" ? 420 : 900), 0.5, 1.6), arc: how === "jet" ? 70 : 260 };
            }
          }
        }
        if (ride === "ready" && state !== "on") ride = "off";
        if (rb.away) {
          rfade = Math.min(1, rfade + dt * 3);
          // A slow turn on its thread now and then, the way a hanging thing does.
          if (ride === "hang" || ride === "bead") {
            nextSpin -= dt;
            if (nextSpin <= 0 && !spinV) { spinV = 1; nextSpin = 7 + Math.random() * 8; }
            if (spinV) { spin += dt * TAU / 2.6; if (spin >= TAU) { spin = 0; spinV = 0; } }
          }
        }
        if (ride === "hang") {
          const was = shot;
          shot = Math.min(1, shot + dt * 1.4);
          // Caught: a tug that squashes it before it leaves the floor.
          if (was < 1 && shot >= 1) rb.squash = 0.45;
          if (state === "on") {
            // Reeled up once the cast thread has caught it: quickly at first, gently at the end.
            if (shot >= 1) Lt += clamp((26 * zoom - Lt) * (1 - Math.exp(-dt * 1.6)), -320 * dt, 320 * dt);
            if (shot >= 1) rturn = Math.min(1, rturn + dt * 0.7);
          } else rturn = Math.max(0, Math.min(rturn, turn));
        }
        if (ride === "fly") {
          const f = fly;
          f.t += dt;
          if (f.t < f.crouch) {
            // Gathers itself: a crouch for the hop, a hum of thrust for the jet.
            const k = f.t / f.crouch;
            // The hop crouches deep; the jet spools up and rises off the floor on its thrust.
            rb.squash = how === "hop" ? 0.85 * Math.sin(k * Math.PI * 0.5) : 0.1;
            if (how === "jet") {
              ry = f.sy - 16 * zoom * ease(k); rscale = 1 + 0.06 * ease(k);
              for (let n = 0; n < 2; n++) puffs.push({ x: rx + (Math.random() - 0.5) * 18 * zoom, y: ry + 32 * zoom, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60, life: 0.55, big: 1 });
            }
          } else {
            const k = clamp((f.t - f.crouch) / f.dur, 0, 1), e = how === "jet" ? ease(k) : k;
            // The line moves while it flies, so it aims at where the line is now.
            const [px, py, pa] = along(L * 0.45);
            const sy0 = how === "jet" ? f.sy - 16 * zoom : f.sy;
            const cx = (f.sx + px) / 2, cy = Math.min(sy0, py) - f.arc;
            rx = (1 - e) * (1 - e) * f.sx + 2 * (1 - e) * e * cx + e * e * px;
            ry = (1 - e) * (1 - e) * sy0 + 2 * (1 - e) * e * cy + e * e * py;
            // The jet banks and wobbles on its thrust; the hop tumbles a little at the top of its arc.
            rang = wrap(pa - Math.PI / 2) * ease(k) + (how === "jet" ? Math.sin(f.t * 13) * 0.1 * (1 - k) : Math.sin(k * Math.PI) * 0.5);
            rscale = 1 + Math.sin(k * Math.PI) * (how === "hop" ? 0.16 : 0.1);
            rb.squash = how === "hop" ? Math.max(0, 0.6 - k * 3) : 0;
            if (how === "jet" && k < 0.92 && Math.random() < 0.9) puffs.push({ x: rx - Math.cos(rang - Math.PI / 2) * 30 * zoom, y: ry + 30 * zoom * rscale, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 40, life: 0.45 });
            if (k >= 1) {
              ride = "slide"; bead = L * 0.45; rturn = 1; rscale = 1;
              // Lands on the line hard enough to bounce it.
              if (how === "hop") { rb.squash = 0.6; const m = Math.round((N - 1) * 0.45); for (let j = 1; j < N; j++) pts[j].py -= 9 * Math.max(0, 1 - Math.abs(j - m) / 5); }
            }
          }
        }
        if (ride === "slide" || ride === "bead") {
          // Clipped on the line, it slides down to just above the spider and rides there.
          const goal = Math.max(0, L - BEAD());
          bead += ride === "slide" ? Math.min(goal - bead, dt * 160 + (goal - bead) * dt * 2) : (goal - bead) * (1 - Math.exp(-dt * 8));
          if (ride === "slide" && Math.abs(goal - bead) < 2) ride = "bead";
          const [px, py, pa] = along(bead);
          rx = px; ry = py; rang = wrap(pa - Math.PI / 2);
          if (state !== "on") rturn = Math.max(0, Math.min(rturn, turn));
        }

        // ---- While it rides ----
        const riding = rb.away && state === "on" && (ride === "hang" || ride === "bead");
        const p = clamp(scrollY / room, 0, 1), speed = Math.abs(v);
        scanT -= dt;
        if (scanT <= 0) {
          scanT = 1.5;
          heads = [...document.querySelectorAll("main h2, main h3")];
          // The same cards, phones and pictures the sheet gathers round (room.ts LEDGES).
          cards = [...document.querySelectorAll('[data-critter="ledge"], [data-fabric="well"], main figure, main img')];
        }
        if (rb.away) {
          // The room doesn't step it while it rides, so its own little clocks run here.
          rb.clock += dt; rb.squash += -rb.squash * (1 - Math.exp(-dt * 9));
          rb.blinkIn -= dt; rb.blinkT -= dt;
          if (rb.blinkIn <= 0) { rb.blinkT = 0.13; rb.blinkIn = 1.8 + Math.random() * 4; }
          rb.ring = p; rb.ringFlash = Math.max(0, (rb.ringFlash || 0) - dt * 0.8);
        }
        // Dozes when the reader stops for a while; the next scroll jolts it awake with a start.
        idle = speed > 25 ? 0 : idle + dt;
        if (doze > 0.5 && speed > 60) { jolt = 0.8; rb.squash = 0.5; bv -= 260 * zoom; doze = 0.4; }
        doze = riding && idle > 7 && !beam ? Math.min(1, doze + dt * 0.3) : Math.max(0, doze - dt * 3);
        jolt = Math.max(0, jolt - dt); joy = Math.max(0, joy - dt);
        if (rb.away) {
          rb.seen = rb.w.clock; rb.doze = doze;
          rb.mood = jolt > 0 ? "wide" : joy > 0 ? "happy" : doze > 0.6 ? "sleepy" : "open";
        }
        // A hard flick drops it on a bungee: a stretchy cord and a bouncy spring back.
        bcd = Math.max(0, bcd - dt);
        if (riding && speed > 2400 && bcd === 0 && doze < 0.5) { bv += clamp(v * 0.28, -420, 1150) * zoom; bcd = 0.9; }
        bv += (-70 * bo - 3.4 * bv) * dt; bo += bv * dt;
        if (bo < -32 * zoom) { bo = -32 * zoom; bv = Math.max(0, bv); }
        if (bo > 170 * zoom) { bo = 170 * zoom; bv = Math.min(0, bv); }
        if (!riding) { bo *= Math.exp(-dt * 10); bv *= Math.exp(-dt * 10); }
        // Riding above the spider, it drops out to the side of it rather than through it.
        cord = ride === "bead" && bo > 0 ? [-0.6, 0.8] : [0, 1];
        if (rb.away) {
          // Its side brush spins up like a propeller to steady it on the cord.
          const prop = clamp(Math.abs(bv) / (320 * zoom) + Math.abs(bo) / (70 * zoom), 0, 1);
          rb.brushOn += (prop - rb.brushOn) * (1 - Math.exp(-dt * 8));
          rb.brushA += dt * (12 + 50 * prop) * rb.brushOn;
        }
        // A high five as each section heading passes the middle of the window.
        let fo = 0;
        for (const h of heads) {
          const top = h.getBoundingClientRect().top, was = headTop.get(h);
          headTop.set(h, top);
          if (was !== undefined && was > vh * 0.42 && top <= vh * 0.42 && riding && fiveT < 0 && fiveCd === 0 && !swap && Math.abs(bo) < 20 * zoom && doze < 0.5) { fiveT = 0; fiveSpark = false; }
        }
        fiveCd = Math.max(0, fiveCd - dt);
        if (fiveT >= 0) {
          fiveT += dt; fiveCd = 2.5;
          const k = fiveT / 0.6;
          if (k >= 1 || !riding) fiveT = -1;
          else {
            const f = Math.sin(k * Math.PI);
            fo = ride === "bead" ? f * Math.max(0, BEAD() - 40 * zoom) : -f * 10 * zoom;
            if (!fiveSpark && k > 0.5) {
              fiveSpark = true; rb.squash = 0.4; joy = 0.9;
              const [cx, cy] = ride === "bead" ? [pts[N - 1].x, pts[N - 1].y - 6 * zoom] : head();
              for (let n = 0; n < 10; n++) {
                const a = (n / 10) * TAU, sp2 = 70 + Math.random() * 60;
                puffs.push({ x: cx, y: cy, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2, life: 0.5, col: n % 2 ? GREEN : CYAN });
              }
            }
          }
        }
        // A run that stops sets the line swinging, and it settles slowly.
        runSp += (speed - runSp) * (1 - Math.exp(-dt * 3));
        swingT = Math.max(0, swingT - dt);
        if (speed > 140) swung = false;
        else if (!swung && runSp > 380 && speed < 15 && state === "on") {
          swung = true; swingT = 2.6;
          const amp = clamp(runSp * 0.0011, 0.5, 1.6) * (Math.random() < 0.5 ? -1 : 1);
          for (let i = 1; i < N; i++) pts[i].px -= amp * (i / (N - 1));
          if (ride === "hang") for (let i = 1; i < M; i++) tail[i].px -= amp * 1.15;
        }
        // Its headlight sweeps each card it passes, the dots parting where the light lands.
        if (beam) {
          beam.t += dt;
          if (beam.t > 1.9 || !riding) beam = null;
        } else if (riding && doze < 0.3 && !swap && fiveT < 0) {
          for (const el of cards) {
            if (lit.has(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.height > 60 && r.left < rx - 140 && r.top < ry && r.bottom > ry + 40) { lit.add(el); beam = { el, t: 0 }; break; }
          }
        }
        if (beam) {
          const r = beam.el.getBoundingClientRect(), k = beam.t / 1.9;
          beam.x = Math.min(r.left + r.width * 0.5, rx - 120); beam.y = lerp(r.top + 26, r.bottom - 26, ease(k)); beam.a = Math.sin(k * Math.PI);
          o.dent?.(beam.x, beam.y, 18 * beam.a);
        }
        if (rb.away) {
          const lx = beam ? -1.4 : 0, ly = beam ? clamp((beam.y - ry) / 120, -0.9, 0.9) : 0;
          rb.lookX += (lx - rb.lookX) * (1 - Math.exp(-dt * 6)); rb.lookY += (ly - rb.lookY) * (1 - Math.exp(-dt * 6));
        }
        // Now and then it climbs round the spider to ride the other end, the spider leaning aside.
        if (riding && !swap && !beam && fiveT < 0 && Math.abs(bo) < 4 && doze < 0.2 && lapT < 0 && (ride !== "hang" || rturn >= 1)) {
          nextSwap -= dt;
          if (nextSwap <= 0) {
            swap = { t: 0, dur: 1.3, fx: rx, fy: ry, a0: rang, to: ride === "bead" ? "hang" : "bead" };
            ride = "swap"; nextSwap = 22 + Math.random() * 18; rb.squash = 0.4; spin = 0; spinV = 0;
          }
        }
        if (ride === "swap") {
          const w2 = swap; w2.t += dt;
          const k = clamp(w2.t / w2.dur, 0, 1), e = ease(k);
          let tx, ty;
          if (w2.to === "hang") { const [hx, hy] = head(); tx = hx; ty = hy + 26 * zoom; }
          else [tx, ty] = along(Math.max(0, L - BEAD()));
          const cx = Math.min(w2.fx, tx) - 64 * zoom, cy = (w2.fy + ty) / 2;
          rx = (1 - e) * (1 - e) * w2.fx + 2 * (1 - e) * e * cx + e * e * tx;
          ry = (1 - e) * (1 - e) * w2.fy + 2 * (1 - e) * e * cy + e * e * ty;
          rang = w2.a0 * (1 - e) - Math.sin(k * Math.PI) * 0.55; rturn = 1;
          duck = Math.sin(k * Math.PI);
          if (k >= 1) {
            rb.squash = 0.45; duck = 0;
            if (w2.to === "hang") { const [hx, hy] = head(); Lt = 26 * zoom; lay(tail, hx, hy, tx, ty); shot = 1; ride = "hang"; }
            else { bead = Math.max(0, L - BEAD()); ride = "bead"; }
            swap = null;
          }
        } else duck = Math.max(0, duck - dt * 3);
        // At the bottom its ring flashes green, then it hops off for a victory lap. It rejoins
        // once the reader heads back up.
        if (riding && p > 0.985 && lapT < 0 && !lapped && fiveT < 0) { lapT = 0; rb.ringFlash = 1; joy = 1.2; }
        if (lapT >= 0 && !leap) {
          lapT += dt;
          if (!riding && ride !== "swap") lapT = -1;
          else if (lapT > 0.9 && riding && Math.abs(bo) < 6 * zoom) {
            const tx = clamp(vw * (0.38 + Math.random() * 0.24), 60, vw - 60), ty = vh * 0.8;
            leap = { t: 0, fx: rx + ox, fy: ry + oy, a0: rang, tx, ty }; ride = "leap"; rb.squash = 0.55;
          }
        }
        if (ride === "leap") {
          const f = leap; f.t += dt;
          const k = clamp(f.t / 0.95, 0, 1);
          const cx = (f.fx + f.tx) / 2, cy = Math.min(f.fy, f.ty) - 130 * zoom;
          rx = (1 - k) * (1 - k) * f.fx + 2 * (1 - k) * k * cx + k * k * f.tx;
          ry = (1 - k) * (1 - k) * f.fy + 2 * (1 - k) * k * cy + k * k * f.ty;
          rang = f.a0 * (1 - ease(k)) + Math.sin(k * Math.PI) * 0.4; rscale = 1 + Math.sin(k * Math.PI) * 0.12; rturn = 1;
          if (k >= 1) {
            rscale = 1; dropRoomba(); rb.squash = 0.6; ride = "parked"; lapped = true; lapT = -1;
            rb.begin("zoomies", "Made it to the bottom with you. Victory lap!", { n: 2, goal: null });
          }
        }
        if (ride === "parked" && (p < 0.9 || state !== "on")) ride = "off";
        if (p < 0.9) lapped = false;
        ox = cord[0] * bo; oy = cord[1] * bo + fo;
        for (const q of puffs) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
        while (puffs.length && puffs[0].life <= 0) puffs.shift();
        // A scroll that speeds up or brakes swings it, the way a sudden stop swings a pendant.
        const ay = 1500 - acc * 0.1, kick = -acc * 0.04 * Math.sin(clock * 1.7);
        pts[0].x = pts[0].px = ax; pts[0].y = pts[0].py = -6;
        const sub = 3, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          integrate(pts, h, ay, kick);
          for (let k = 0; k < 6; k++) constrain(pts, L / (N - 1));
          if (ride === "hang") {
            const [hx, hy] = head();
            tail[0].x = tail[0].px = hx; tail[0].y = tail[0].py = hy;
            // The Roomba is heavy: until it is lifted clear, the floor still holds it.
            integrate(tail, h, ay * rturn, kick * 0.6);
            for (let k = 0; k < 6; k++) constrain(tail, Lt / (M - 1));
          }
        }
        for (const q of pts) q.x = clamp(q.x, 16, vw - 16);
        if (ride === "hang") {
          for (const q of tail) q.x = clamp(q.x, 16, vw - 16);
          const t = tail[M - 1], q = tail[M - 2];
          rx = t.x; ry = t.y; rang = wrap(Math.atan2(t.y - q.y, t.x - q.x) - Math.PI / 2);
        }
        if (state === "landing" && turn === 0) {
          // Both step off where they hang, the right way up.
          if (rb.away) dropRoomba(); ride = "off";
          lit = new WeakSet(); lapT = -1; lapped = false; fiveT = -1; duck = 0;
          const e = pts[N - 1], [tx, ty] = tip();
          sp.x += (e.x - tx) / zoom; sp.y += (e.y - ty) / zoom;
          for (const f of sp.feet) { f.x += (e.x - tx) / zoom; f.y += (e.y - ty) / zoom; }
          sp.inBounds?.();
          sp.away = false; state = "fading";
          // Then it goes home to its nest, rather than standing where the line left it.
          o.onLand?.();
          sp.begin("rest", "Back off its line, heading home to its nest");
        }
      },
      draw() {
        if (state === "off") return;
        drawn = true;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
        // The line, as a row of fine dots like the rest of the silk, with a glint running down it.
        silk(pts, fade);
        const g = (clock * 0.45) % 1, i = Math.min(N - 2, Math.floor(g * (N - 1))), u = g * (N - 1) - i;
        ctx.fillStyle = rgba(CYAN, 0.6 * fade * Math.sin(g * Math.PI));
        ctx.beginPath(); ctx.arc(lerp(pts[i].x, pts[i + 1].x, u), lerp(pts[i].y, pts[i + 1].y, u), 1, 0, TAU); ctx.fill();
        if (state === "fading") return;
        for (const q of puffs) {
          ctx.fillStyle = rgba(q.col || CYAN, 0.6 * Math.max(0, q.life / 0.55));
          ctx.beginPath(); ctx.arc(q.x, q.y, (q.big ? 1.6 : 1.1) * (0.6 + q.life), 0, TAU); ctx.fill();
        }
        if (ride === "hang") {
          // The cast thread runs out from the spider to the Roomba before it takes the weight.
          if (shot < 1) {
            // Thrown in a loose arc that straightens as it reaches the Roomba.
            const reach = ease(shot), a = tail[0], b = tail[M - 1];
            const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
            const bow = 46 * zoom * (1 - shot);
            const cast = [];
            for (let j = 0; j < M; j++) {
              const t = (j / (M - 1)) * reach, w = Math.sin(t * Math.PI) * bow;
              cast.push({ x: lerp(a.x, b.x, t) + (nx / nl) * w, y: lerp(a.y, b.y, t) + (ny / nl) * w });
            }
            silk(cast, rfade);
          } else silk(tail, rfade);
        }
        if (beam && beam.a > 0.01) {
          // The headlight: a soft cone from its face to where the light lands on the card.
          const sx = rx + ox, sy = ry + oy + (RR + 2) * zoom, dx = beam.x - sx, dy = beam.y - sy, dl = Math.hypot(dx, dy) || 1;
          const nx = -dy / dl, ny = dx / dl, wd = 34 * zoom;
          const gr = ctx.createLinearGradient(sx, sy, beam.x, beam.y);
          gr.addColorStop(0, rgba(CYAN, 0.16 * beam.a)); gr.addColorStop(1, rgba(CYAN, 0.02 * beam.a));
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx + nx * 4, sy + ny * 4); ctx.lineTo(beam.x + nx * wd, beam.y + ny * wd); ctx.lineTo(beam.x - nx * wd, beam.y - ny * wd); ctx.lineTo(sx - nx * 4, sy - ny * 4); ctx.closePath(); ctx.fill();
          const sg = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, wd * 1.4);
          sg.addColorStop(0, rgba(CYAN, 0.1 * beam.a)); sg.addColorStop(1, rgba(CYAN, 0));
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(beam.x, beam.y, wd * 1.4, 0, TAU); ctx.fill();
        }
        if (rb.away && Math.abs(bo) > 3) {
          // The bungee cord, thinning as it stretches.
          const n = 6, cc = [];
          for (let j = 0; j <= n; j++) cc.push({ x: rx + cord[0] * bo * (j / n), y: ry + cord[1] * bo * (j / n) });
          silk(cc, rfade * clamp(1.2 - Math.abs(bo) / (220 * zoom), 0.5, 1));
        }
        if (rb.away) {
          // Drawn from where its thread is tied. At rturn 0 it is drawn exactly as it stood.
          const k = ride === "fly" ? 1 : ease(rturn);
          const rc = project(rb.x, rb.y, rb.z || 0, [0, 0]);
          // Dozing, it breathes slowly and its head nods; on the bungee it wobbles.
          const breathe = 1 + doze * 0.03 * Math.sin(clock * 1.8), nod = doze * 0.12 * (0.6 + 0.4 * Math.sin(clock * 0.9));
          const wob = clamp(bv / (2600 * zoom), -0.3, 0.3);
          ctx.save(); ctx.translate(rx + ox, ry + oy); rDraw = settle(rDraw, rang * k + spin * k + nod + wob, ride === "fly" || ride === "leap" || ride === "swap" ? 1 : 0.25); ctx.rotate(rDraw); ctx.scale(zoom * rscale * breathe, zoom * rscale * breathe);
          ctx.translate(-rc[0], -(rc[1] - RR - 2));
          rb.draw(ctx); ctx.restore();
        }
        // The spider at the line's end. Turned fully, it hangs head first along the line; at
        // turn 0 it is drawn exactly as it stood in the room.
        const e = pts[N - 1];
        const sc = project(sp.x, sp.y, sp.z || 0, [0, 0]);
        ctx.save(); ctx.translate(e.x, e.y); sDraw = settle(sDraw, spinOf() - duck * 0.45, 0.25); ctx.rotate(sDraw); ctx.scale(zoom, zoom);
        ctx.translate(-(sc[0] - sp.fx * BACK), -(sc[1] - sp.fy * BACK));
        sp.draw(ctx); ctx.restore();
      },
      remove() { sp.away = false; rb.away = false; c.remove(); },
    };
  }

  window.DotoCritters = { mount, mountPage, mountSite };
})();
