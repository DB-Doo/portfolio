"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/*
Scroll-in motion for the portfolio. Everything rises a little and sharpens from a soft blur
as it enters the viewport, once. Reduced motion shows content in place with no transition.
*/

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "figure" | "p";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

export type HeadlinePart = { text: string; serif?: boolean; accent?: boolean };

/* A headline that arrives word by word. Serif parts render in italic Instrument Serif. */
export function SplitHeadline({
  parts,
  className,
  delay = 0,
  as = "h1",
}: {
  parts: HeadlinePart[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2";
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  const words = parts.flatMap((part) =>
    part.text
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, serif: part.serif, accent: part.accent })),
  );

  return (
    <Tag className={className} aria-label={parts.map((part) => part.text).join(" ")}>
      {words.map(({ word, serif, accent }, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={`inline-block ${serif ? "font-serif font-normal italic tracking-normal" : ""} ${
              accent ? "text-[var(--accent,#67e8f9)]" : ""
            }`}
            initial={reduce ? false : { y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1, delay: delay + i * 0.06, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
