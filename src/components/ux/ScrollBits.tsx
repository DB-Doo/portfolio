"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

/* A thin bar across the top of the page that fills as you read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-[var(--accent,#67e8f9)]"
      style={{ scaleX }}
    />
  );
}

/* Sticky contents list for a case study; the section in view is highlighted. */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Case study sections" className="sticky top-28 hidden xl:block">
      <ol className="space-y-3">
        {sections.map((section) => {
          const on = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  on ? "text-white" : "text-neutral-600 hover:text-neutral-300"
                }`}
              >
                <span
                  className={`h-px transition-all duration-500 ${
                    on ? "w-8 bg-[var(--accent,#67e8f9)]" : "w-3 bg-neutral-700 group-hover:w-5"
                  }`}
                />
                {section.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* A vertical line that draws itself down the process steps as they scroll past. */
export function DrawLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} aria-hidden="true" className={`absolute w-px bg-neutral-800 ${className}`}>
      <motion.div
        className="h-full w-full origin-top bg-gradient-to-b from-cyan-300 via-cyan-300 to-fuchsia-400"
        style={{ scaleY: reduce ? 1 : scaleY }}
      />
    </div>
  );
}

/* Copies the email address and confirms, instead of only opening a mail app. */
export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
      className={className}
    >
      <span aria-live="polite">{copied ? "Copied to clipboard" : "Copy email"}</span>
    </button>
  );
}
