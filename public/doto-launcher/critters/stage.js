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
      hit(x, y) { return (!sp.away && sp.hit(x, y)) || rb.hit(x, y); },
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

    const rope = abseil(o, sp, zoom);
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
  function abseil(o, sp, zoom) {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "30" });
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const N = 16, BACK = 18;
    const pts = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    let vw = 0, vh = 0, dpr = 1, state = "off", L = 0, ax = 0, turn = 0, fade = 0, clock = 0;
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
    const hangFrom = (x0, x1, y1) => {
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1), p = pts[i];
        p.x = p.px = lerp(x0, x1, t); p.y = p.py = lerp(-6, y1, t);
      }
    };
    const integrate = (dt, ay, kick) => {
      for (let i = 1; i < N; i++) {
        const p = pts[i], vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
        p.px = p.x; p.py = p.y;
        p.x += vx + kick * (i / N) * dt * dt; p.y += vy + ay * dt * dt;
      }
    };
    const constrain = (seg) => {
      for (let i = 1; i < N; i++) {
        const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-4;
        const f = ((d - seg) / d) * 0.55;
        if (i === 1) { b.x -= dx * f; b.y -= dy * f; }
        else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
      }
    };
    const clear = () => { if (drawn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); drawn = false; } };
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
          ax = x; L = y + 6; turn = 0; fade = 0; hangFrom(x, x, y);
          sp.away = true; state = "on";
        }
        clock += dt; sp.clock += dt;
        if (state === "on" && !want) state = "landing";
        if (state === "landing" && want) state = "on";
        fade = Math.min(1, fade + dt * 3);
        if (state === "on") {
          // Over to the right edge, and down as far through the window as the reader is
          // through the page.
          ax = lerp(ax, lane(), 1 - Math.exp(-dt * 2.6));
          const p = clamp((scrollY - start) / Math.max(1, room - start), 0, 1);
          const target = lerp(vh * 0.2, vh * 0.78, p) + 6;
          const ease = target - L, rate = ease > 0 ? 220 : 420;
          L += clamp(ease * (1 - Math.exp(-dt * 2.2)), -rate * dt, rate * dt);
          turn = Math.min(1, turn + dt * 1.6);
        } else {
          turn = Math.max(0, turn - dt * 2);
        }
        // A scroll that speeds up or brakes swings it, the way a sudden stop swings a pendant.
        const ay = 1500 - acc * 0.1, kick = -acc * 0.04 * Math.sin(clock * 1.7);
        pts[0].x = pts[0].px = ax; pts[0].y = pts[0].py = -6;
        const sub = 3, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          integrate(h, ay, kick);
          for (let k = 0; k < 6; k++) constrain(L / (N - 1));
        }
        for (const q of pts) q.x = clamp(q.x, 16, vw - 16);
        if (state === "landing" && turn === 0) {
          // Steps off where it hangs, the right way up.
          const e = pts[N - 1], [tx, ty] = tip();
          sp.x += (e.x - tx) / zoom; sp.y += (e.y - ty) / zoom;
          for (const f of sp.feet) { f.x += (e.x - tx) / zoom; f.y += (e.y - ty) / zoom; }
          sp.inBounds?.();
          sp.away = false; state = "fading";
        }
      },
      draw() {
        if (state === "off") return;
        drawn = true;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
        // The line, as a row of fine dots like the rest of the silk.
        ctx.fillStyle = rgba(INK, 0.42 * fade);
        let carry = 0;
        for (let i = 1; i < N; i++) {
          const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.y - a.y);
          for (let t = carry; t < d; t += 3.2) { ctx.beginPath(); ctx.arc(a.x + ((b.x - a.x) * t) / d, a.y + ((b.y - a.y) * t) / d, 0.65, 0, TAU); ctx.fill(); }
          carry = (carry - d) % 3.2; if (carry < 0) carry += 3.2;
        }
        const g = (clock * 0.45) % 1, i = Math.min(N - 2, Math.floor(g * (N - 1))), u = g * (N - 1) - i;
        ctx.fillStyle = rgba(CYAN, 0.6 * fade * Math.sin(g * Math.PI));
        ctx.beginPath(); ctx.arc(lerp(pts[i].x, pts[i + 1].x, u), lerp(pts[i].y, pts[i + 1].y, u), 1, 0, TAU); ctx.fill();
        if (state === "fading") return;
        // The spider at the line's end. Turned fully, it hangs head first along the line; at
        // turn 0 it is drawn exactly as it stood in the room.
        const e = pts[N - 1], f = pts[N - 2];
        const along = Math.atan2(e.y - f.y, e.x - f.x) - Math.atan2(sp.fy, sp.fx);
        const k = turn * turn * (3 - 2 * turn);
        let rot = along; while (rot > Math.PI) rot -= TAU; while (rot < -Math.PI) rot += TAU;
        const sc = project(sp.x, sp.y, sp.z || 0, [0, 0]);
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(rot * k); ctx.scale(zoom, zoom);
        ctx.translate(-(sc[0] - sp.fx * BACK), -(sc[1] - sp.fy * BACK));
        sp.draw(ctx); ctx.restore();
      },
      remove() { if (sp.away) sp.away = false; c.remove(); },
    };
  }

  window.DotoCritters = { mount, mountPage, mountSite };
})();
