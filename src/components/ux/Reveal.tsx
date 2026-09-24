"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/*
Scroll-in motion for the portfolio. Content rises a little as it enters the viewport, once.
Text is always visible (only images and cards may fade), because hiring managers scan and
a reveal that hides words is a wait, not a flourish. Reduced motion shows everything in
place with no transition.
*/

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 24,
  fade = false,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Fade in as well as rise. Only for images and cards: text is never hidden while
      waiting for an animation, so it reads even before JavaScript runs. */
  fade?: boolean;
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
      initial={fade ? { opacity: 0, y, scale: 0.98 } : { y }}
      whileInView={fade ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

export type HeadlinePart = { text: string; serif?: boolean; accent?: boolean };

/* A headline that is readable on first paint. Plain words are static; accent words (the
   italic serif ones) sweep in once, as the single moment of motion. */
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
            initial={reduce || !(serif || accent) ? false : { y: "105%", rotate: 3 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.08, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
