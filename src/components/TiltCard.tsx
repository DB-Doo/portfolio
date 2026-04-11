"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltStrength?: number;
}

export function TiltCard({
  children,
  className = "",
  tiltStrength = 8,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(
    useTransform(y, [0, 1], [tiltStrength, -tiltStrength]),
    { stiffness: 200, damping: 20 }
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-tiltStrength, tiltStrength]),
    { stiffness: 200, damping: 20 }
  );

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
}
