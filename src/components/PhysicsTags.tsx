"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

const { Engine, World, Bodies, Mouse, MouseConstraint, Events, Body } = Matter;

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
  const [ready, setReady] = useState(false);

  const initPhysics = useCallback(() => {
    const container = containerRef.current;
    if (!container || tagElsRef.current.length === 0) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Create engine
    const engine = Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
    });
    engineRef.current = engine;

    // Walls
    const wallThickness = 50;
    const walls = [
      // Bottom
      Bodies.rectangle(width / 2, height + wallThickness / 2, width + 100, wallThickness, {
        isStatic: true,
        friction: 0.5,
        restitution: 0.3,
      }),
      // Left
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
        isStatic: true,
      }),
      // Right
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
        isStatic: true,
      }),
    ];
    World.add(engine.world, walls);

    // Create bodies for each tag
    const bodies: Matter.Body[] = [];
    tagElsRef.current.forEach((el, i) => {
      const elRect = el.getBoundingClientRect();
      const w = elRect.width + 8;
      const h = elRect.height + 4;

      const body = Bodies.rectangle(
        Math.random() * (width - 100) + 50,
        -(50 + i * 45),
        w,
        h,
        {
          restitution: 0.4,
          friction: 0.3,
          density: 0.002,
          chamfer: { radius: h / 2 },
          frictionAir: 0.01,
        }
      );
      bodies.push(body);
    });

    World.add(engine.world, bodies);
    bodiesRef.current = bodies;

    // Mouse interaction
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;

      const mouse = Mouse.create(canvas);
      // Fix for high-DPI displays
      mouse.pixelRatio = 1;

      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false },
        },
      });
      World.add(engine.world, mouseConstraint);

      // Prevent page scroll when interacting with physics
      canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
    }

    // Also add invisible cursor body for push-through effect
    const cursorBody = Bodies.circle(0, 0, 25, {
      isStatic: true,
      render: { visible: false },
    });
    World.add(engine.world, cursorBody);

    const handlePointerMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      Body.setPosition(cursorBody, {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      });
    };
    container.addEventListener("pointermove", handlePointerMove);

    // Animation loop
    const update = () => {
      Engine.update(engine, 1000 / 60);

      bodies.forEach((body, i) => {
        const el = tagElsRef.current[i];
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        el.style.transform = `translate(${body.position.x - elRect.width / 2}px, ${body.position.y - elRect.height / 2}px) rotate(${body.angle}rad)`;
        el.style.opacity = "1";
      });

      animRef.current = requestAnimationFrame(update);
    };

    setReady(true);
    animRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener("pointermove", handlePointerMove);
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  useEffect(() => {
    // Wait for tag elements to render and measure
    const timer = setTimeout(() => {
      initPhysics();
    }, 100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
      }
    };
  }, [initPhysics]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      cancelAnimationFrame(animRef.current);
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
      }
      bodiesRef.current = [];
      setReady(false);
      setTimeout(() => initPhysics(), 200);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initPhysics]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: 300, touchAction: "none" }}
    >
      {/* Invisible canvas for mouse/touch interaction */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ width: "100%", height: "100%", opacity: 0 }}
      />

      {/* Tag elements — positioned absolute, moved by physics */}
      {tags.map((tag, i) => (
        <div
          key={tag}
          ref={(el) => {
            if (el) tagElsRef.current[i] = el;
          }}
          className="absolute top-0 left-0 px-4 py-2 rounded-full text-sm font-semibold
                     border border-neutral-700 bg-neutral-800/90 text-neutral-200
                     backdrop-blur-sm select-none whitespace-nowrap z-20
                     hover:border-blue-500/50 hover:text-blue-300 transition-colors"
          style={{ opacity: ready ? 1 : 0 }}
        >
          {tag}
        </div>
      ))}

      {/* Subtle hint */}
      {ready && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-neutral-600 z-0 pointer-events-none animate-pulse">
          drag &amp; fling
        </div>
      )}
    </div>
  );
}
