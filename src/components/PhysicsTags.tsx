"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

const { Engine, World, Bodies, Mouse, MouseConstraint, Body } = Matter;

interface PhysicsTagsProps {
  tags: string[];
  className?: string;
}

export function PhysicsTags({ tags, className = "" }: PhysicsTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const tagElsRef = useRef<HTMLDivElement[]>([]);
  const animRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  const [ready, setReady] = useState(false);

  const initPhysics = useCallback(() => {
    if (initializedRef.current) return;
    const container = containerRef.current;
    if (!container || tagElsRef.current.length < tags.length) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
    });
    engineRef.current = engine;

    // Walls
    const wallThickness = 50;
    World.add(engine.world, [
      Bodies.rectangle(width / 2, height + wallThickness / 2, width + 100, wallThickness, {
        isStatic: true, friction: 0.5, restitution: 0.3,
      }),
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true }),
    ]);

    // Bodies
    const bodies: Matter.Body[] = [];
    tagElsRef.current.forEach((el, i) => {
      const elRect = el.getBoundingClientRect();
      const body = Bodies.rectangle(
        Math.random() * (width - 100) + 50,
        -(50 + i * 45),
        elRect.width + 8,
        elRect.height + 4,
        {
          restitution: 0.4, friction: 0.3, density: 0.002,
          chamfer: { radius: (elRect.height + 4) / 2 },
          frictionAir: 0.01,
        }
      );
      bodies.push(body);
    });
    World.add(engine.world, bodies);
    bodiesRef.current = bodies;

    // Mouse/touch interaction
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const mouse = Mouse.create(canvas);
      mouse.pixelRatio = 1;
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, render: { visible: false } },
      });
      World.add(engine.world, mouseConstraint);

      // Only prevent scroll when actively dragging a body
      let dragging = false;
      Matter.Events.on(mouseConstraint, "startdrag", () => { dragging = true; });
      Matter.Events.on(mouseConstraint, "enddrag", () => { dragging = false; });
      canvas.addEventListener("touchmove", (e) => {
        if (dragging) e.preventDefault();
      }, { passive: false });
    }

    // Cursor push body
    const cursorBody = Bodies.circle(0, 0, 25, { isStatic: true });
    World.add(engine.world, cursorBody);

    const handlePointerMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      Body.setPosition(cursorBody, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    container.addEventListener("pointermove", handlePointerMove);

    // Scroll velocity tracking
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const delta = window.scrollY - lastScrollY.current;
      scrollVelocity.current = delta;
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation loop
    const update = () => {
      Engine.update(engine, 1000 / 60);

      // Apply scroll velocity as force to all bodies
      const sv = scrollVelocity.current;
      if (Math.abs(sv) > 2) {
        bodies.forEach((body) => {
          Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.0005 * Math.abs(sv),
            y: -sv * 0.00008,
          });
        });
        // Decay scroll velocity
        scrollVelocity.current *= 0.85;
      }

      // Sync DOM
      bodies.forEach((body, i) => {
        const el = tagElsRef.current[i];
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
        el.style.opacity = "1";
      });

      animRef.current = requestAnimationFrame(update);
    };

    initializedRef.current = true;
    setReady(true);
    animRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tags.length]);

  useEffect(() => {
    const timer = setTimeout(() => initPhysics(), 150);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
        initializedRef.current = false;
      }
    };
  }, [initPhysics]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: 300 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ width: "100%", height: "100%", opacity: 0, touchAction: "pan-y" }}
      />

      {tags.map((tag, i) => (
        <div
          key={tag}
          ref={(el) => { if (el) tagElsRef.current[i] = el; }}
          className="absolute top-0 left-0 px-4 py-2 rounded-full text-sm font-semibold
                     border border-neutral-700 bg-neutral-800/90 text-neutral-200
                     backdrop-blur-sm select-none whitespace-nowrap z-20
                     hover:border-blue-500/50 hover:text-blue-300 transition-colors"
          style={{ opacity: 0 }}
        >
          {tag}
        </div>
      ))}

      {ready && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-neutral-600 z-0 pointer-events-none animate-pulse">
          grab &amp; fling &middot; scroll to shake
        </div>
      )}
    </div>
  );
}
