"use client";

import Lenis from "lenis";
// Lenis requires its stylesheet: it undoes the h-full height on html and body, which
// otherwise caps the scroll range.
import "lenis/dist/lenis.css";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      anchors: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
