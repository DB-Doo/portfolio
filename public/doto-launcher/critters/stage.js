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
    let raf = 0, alive = true, last = 0;
    const loop = (now) => {
      if (!alive) return;
      if (isVisible() && !document.hidden) { if (!VIEW.paused) follow(last ? Math.min(0.05, (now - last) / 1000) : 1 / 60); last = now; world.frame(now); }
      else { world.last = now; last = now; }
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

  window.DotoCritters = { mount, mountPage };
})();
