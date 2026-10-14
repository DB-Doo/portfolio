"use client";

import { Doto } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { loadCritters, type Critters } from "@/components/ux/critterEngine";

/*
A live phone running the launcher's Canvas Critters: the jumping spider and the Roomba sharing one
Doto home screen. The engine is plain JavaScript in public/doto-launcher/critters, the same code as
the browser mock of the feature. It loads only when the phone comes near the screen, stops drawing
while it is off screen or the tab is hidden, and with reduced motion both critters stay home until
the visitor wakes them.
*/

const doto = Doto({ variable: "--font-doto", weight: "800", subsets: ["latin"] });

export function CritterPhone() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const critters = useRef<Critters | null>(null);
  const [resting, setResting] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let cancelled = false;

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !critters.current && !cancelled) start();
      },
      { rootMargin: "200px" },
    );
    visibility.observe(canvas);

    const start = () => {
      loadCritters()
        .then((engine) => {
          if (cancelled || critters.current) return;
          const style = getComputedStyle(canvas);
          critters.current = engine.mount(canvas, {
            still,
            isVisible: () => visible,
            fontDots: style.getPropertyValue("--font-doto").trim(),
            fontMono: style.getPropertyValue("--font-geist-mono").trim(),
          });
          setResting(still);
        })
        .catch(() => setFailed(true));
    };

    return () => {
      cancelled = true;
      visibility.disconnect();
      critters.current?.stop();
      critters.current = null;
    };
  }, []);

  const wake = () => {
    critters.current?.wake();
    setResting(false);
  };

  return (
    <div className={`${doto.variable} relative mx-auto w-full max-w-[300px]`}>
      <div className="rounded-[34px] bg-black p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_40px_90px_-50px_rgba(103,232,249,0.6)]">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="A Doto home screen with Kiwi and Zuzu, the Canvas Critters. Press Enter to toss a ball."
          className="block aspect-[300/620] w-full touch-none rounded-[26px] bg-[#0b0a12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        />
      </div>
      {resting && (
        <button
          type="button"
          onClick={wake}
          className="absolute left-1/2 top-1/2 min-h-11 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-neutral-950/90 px-5 text-sm font-medium text-white backdrop-blur hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          They&rsquo;re resting. Wake them
        </button>
      )}
      {failed && (
        <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-neutral-400">
          The critters couldn&rsquo;t load. Refresh to try again.
        </p>
      )}
    </div>
  );
}
