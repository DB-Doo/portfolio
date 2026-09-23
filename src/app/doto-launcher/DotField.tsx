"use client";

import { useEffect, useRef } from "react";

/*
A web sketch of the launcher's dot fabric, not a recording of it. Dots sit on a lattice,
a pointer pushes them aside, and springs pull them home. Like the launcher, the loop stops
once everything has settled, so an untouched page schedules no frames. Reduced motion draws
the lattice once and never animates.
*/

const SPACING = 22;
const RADIUS = 1.6;
const REACH = 90;
const PUSH = 26;
const SPRING = 0.08;
const DAMPING = 0.82;
const REST = 0.02;

type Dot = { x: number; y: number; dx: number; dy: number; vx: number; vy: number };

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const layout = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = [];
      const offsetX = (width % SPACING) / 2;
      const offsetY = (height % SPACING) / 2;
      for (let y = offsetY; y <= height; y += SPACING) {
        for (let x = offsetX; x <= width; x += SPACING) {
          dots.push({ x, y, dx: 0, dy: 0, vx: 0, vy: 0 });
        }
      }
      draw();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        const lift = Math.min(1, Math.hypot(dot.dx, dot.dy) / (PUSH * 0.6));
        context.fillStyle = lift > 0.05 ? `rgba(103, 232, 249, ${0.35 + lift * 0.65})` : "#404040";
        context.beginPath();
        context.arc(dot.x + dot.dx, dot.y + dot.dy, RADIUS + lift * 0.8, 0, Math.PI * 2);
        context.fill();
      }
    };

    const step = () => {
      let moving = false;
      for (const dot of dots) {
        let targetX = 0;
        let targetY = 0;
        if (pointer) {
          const ax = dot.x - pointer.x;
          const ay = dot.y - pointer.y;
          const distance = Math.hypot(ax, ay);
          if (distance < REACH && distance > 0) {
            const strength = (1 - distance / REACH) ** 2 * PUSH;
            targetX = (ax / distance) * strength;
            targetY = (ay / distance) * strength;
          }
        }
        dot.vx = (dot.vx + (targetX - dot.dx) * SPRING) * DAMPING;
        dot.vy = (dot.vy + (targetY - dot.dy) * SPRING) * DAMPING;
        dot.dx += dot.vx;
        dot.dy += dot.vy;
        if (
          Math.abs(dot.vx) > REST ||
          Math.abs(dot.vy) > REST ||
          Math.abs(dot.dx - targetX) > REST ||
          Math.abs(dot.dy - targetY) > REST
        ) {
          moving = true;
        }
      }
      draw();
      frame = moving || pointer ? requestAnimationFrame(step) : 0;
    };

    const wake = () => {
      if (!frame && !reducedMotion) frame = requestAnimationFrame(step);
    };

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      wake();
    };

    const leave = () => {
      pointer = null;
      wake();
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(canvas);
    const surface = canvas.parentElement ?? canvas;
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerdown", move);
    surface.addEventListener("pointerleave", leave);
    surface.addEventListener("pointerup", leave);
    surface.addEventListener("pointercancel", leave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerdown", move);
      surface.removeEventListener("pointerleave", leave);
      surface.removeEventListener("pointerup", leave);
      surface.removeEventListener("pointercancel", leave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
