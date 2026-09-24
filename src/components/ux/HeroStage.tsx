"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";
import type { Figure } from "@/content/work";
import { BrowserFrame, PhoneFrame } from "./Device";

/*
The hero's product composition: a browser window at the back, two phones in front. Each
layer drifts with the pointer at its own depth and separates as the page scrolls, so the
work feels physical before a single word about it is read. On touch and reduced motion
the layers simply sit in place.
*/

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroStage({ back, left, right }: { back: Figure; left: Figure; right: Figure }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const leftY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rightY = useTransform(scrollYProgress, [0, 1], [0, 160]);

  const backX = useTransform(sx, (v) => v * 10);
  const backTiltY = useTransform(sx, (v) => v * 4);
  const leftX = useTransform(sx, (v) => v * 22);
  const leftShiftY = useTransform(sy, (v) => v * 14);
  const rightX = useTransform(sx, (v) => v * 34);
  const rightShiftY = useTransform(sy, (v) => v * 22);

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;
    const move = (event: PointerEvent) => {
      px.set(event.clientX / window.innerWidth - 0.5);
      py.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, px, py]);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 60, scale: 0.94 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 1.4, delay, ease: EASE },
        };

  return (
    <div ref={ref} className="relative mx-auto aspect-[5/4] w-full max-w-[640px] [perspective:1400px]">
      <motion.div
        className="absolute left-0 top-[6%] w-[82%]"
        style={reduce ? undefined : { x: backX, y: backY, rotateY: backTiltY }}
      >
        <motion.div {...enter(0.5)}>
          <BrowserFrame figure={back} sizes="520px" url="dbdoo.dev/level" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-[-4%] left-[40%] w-[30%]"
        style={reduce ? undefined : { x: leftX, y: leftY, translateY: leftShiftY }}
      >
        <motion.div {...enter(0.7)}>
          <div className="float" style={{ animationDelay: "-2s" }}>
            <PhoneFrame figure={left} sizes="200px" className="rotate-[-4deg]" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-[-10%] right-0 w-[32%]"
        style={reduce ? undefined : { x: rightX, y: rightY, translateY: rightShiftY }}
      >
        <motion.div {...enter(0.9)}>
          <div className="float">
            <PhoneFrame figure={right} sizes="210px" priority className="rotate-[5deg]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
