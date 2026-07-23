"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const followerX = useSpring(x, { stiffness: 80, damping: 20 });
  const followerY = useSpring(y, { stiffness: 80, damping: 20 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const interactiveSelector = "a, button, [data-hover], [role='button']";
    const updateHover = (event: PointerEvent) => {
      const target =
        event.type === "pointerout" ? event.relatedTarget : event.target;
      setHovered(
        target instanceof Element && target.closest(interactiveSelector) !== null
      );
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("pointerover", updateHover);
    document.addEventListener("pointerout", updateHover);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("pointerover", updateHover);
      document.removeEventListener("pointerout", updateHover);
    };
  }, [x, y]);

  return (
    <>
      <style>{`
        .dbdoo-custom-cursor { display: none; }
        @media (hover: hover) {
          * { cursor: none !important; }
          .dbdoo-custom-cursor { display: block; }
        }
      `}</style>
      <motion.div
        className="dbdoo-custom-cursor fixed w-2 h-2 bg-blue-400 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="dbdoo-custom-cursor fixed rounded-full border border-blue-400/40 pointer-events-none z-[9998]"
        style={{
          x: followerX,
          y: followerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: hovered ? 56 : 36,
          height: hovered ? 56 : 36,
          borderColor: hovered
            ? "rgba(96, 165, 250, 0.6)"
            : "rgba(96, 165, 250, 0.3)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </>
  );
}
