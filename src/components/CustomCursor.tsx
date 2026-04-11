"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const followerX = useSpring(x, { stiffness: 80, damping: 20 });
  const followerY = useSpring(y, { stiffness: 80, damping: 20 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show custom cursor on desktop with hover capability
    if (!window.matchMedia("(hover: hover)").matches) return;

    setVisible(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const addHoverListeners = () => {
      document
        .querySelectorAll("a, button, [data-hover], [role='button']")
        .forEach((el) => {
          el.addEventListener("mouseenter", () => setHovered(true));
          el.addEventListener("mouseleave", () => setHovered(false));
        });
    };

    window.addEventListener("mousemove", move);

    // Initial + observe DOM changes for dynamically added elements
    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      observer.disconnect();
    };
  }, [x, y]);

  if (!visible) return null;

  return (
    <>
      <style>{`@media (hover: hover) { * { cursor: none !important; } }`}</style>
      <motion.div
        className="fixed w-2 h-2 bg-blue-400 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="fixed rounded-full border border-blue-400/40 pointer-events-none z-[9998]"
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
