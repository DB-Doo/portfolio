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
import Image from "next/image";
import { PhoneFrame } from "./Device";
import { LivePhone } from "./LivePhone";

/*
The hero's product composition: the NinKeys keyboard at the back, two phones in front. Each
layer drifts with the pointer at its own depth and separates as the page scrolls, so the
work feels physical before a single word about it is read. The Doto phone is live (LivePhone):
its dots move with music and rise into 3D when dragged. On touch and reduced motion
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

  // The server can't know about reduced motion, so it renders the entrance's first frame.
  // Reduced motion still has to land on the final frame, or the layers stay invisible.
  const enter = (delay: number) =>
    reduce
      ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 60, scale: 0.94 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 1.4, delay, ease: EASE },
        };

  return (
    <div ref={ref} className="relative mx-auto aspect-[5/4] w-full max-w-[640px] [perspective:1400px]">
      <motion.div
        className="absolute left-0 top-[4%] w-[66%]"
        style={reduce ? undefined : { x: backX, y: backY, rotateY: backTiltY }}
      >
        <motion.div {...enter(0.5)} data-critter="ledge" data-critter-name="the keyboard">
          {/* The keyboard cropped out of a real iPhone screenshot, set on its own panel. */}
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#161616] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Image
              src={back.src}
              alt={back.alt}
              width={back.width}
              height={back.height}
              sizes="420px"
              className="block h-auto w-full"
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-[-4%] left-[40%] w-[30%]"
        style={reduce ? undefined : { x: leftX, y: leftY, translateY: leftShiftY }}
      >
        <motion.div {...enter(0.7)}>
          <div className="float" style={{ animationDelay: "-2s" }} data-critter="ledge" data-critter-name="the Wide phone">
            <PhoneFrame figure={left} sizes="200px" className="rotate-[-4deg]" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-[-10%] right-0 w-[32%]"
        style={reduce ? undefined : { x: rightX, y: rightY, translateY: rightShiftY }}
      >
        <motion.div {...enter(0.9)}>
          <div className="float" data-critter="ledge" data-critter-name="the Doto phone" data-critter-nest>
            <LivePhone className="rotate-[5deg]" label={right.alt} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
