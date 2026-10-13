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
    // A flick on empty space throws one ball, not one per critter.
    rb.throwBall = () => {};
    const parts = [sp, rb];
    const all = (fn) => (...a) => { for (const p of parts) p[fn]?.(...a); };
    return {
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

  window.DotoCritters = { mount };
})();
