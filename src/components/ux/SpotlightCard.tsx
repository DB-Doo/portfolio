"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/*
A card whose surface catches a soft light where the pointer is, in the project's accent
colour. Pure CSS variables, so it costs nothing when the pointer is elsewhere. It sits in a
well in the site's dot sheet (data-fabric="well"), which gathers the cloth at its rim.
*/

export function SpotlightCard({
  children,
  accent,
  className = "",
}: {
  children: ReactNode;
  accent: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box || !ref.current) return;
        ref.current.style.setProperty("--mx", `${event.clientX - box.left}px`);
        ref.current.style.setProperty("--my", `${event.clientY - box.top}px`);
      }}
      data-fabric="well"
      style={{ "--accent": accent } as CSSProperties}
      className={`group relative isolate overflow-hidden rounded-[2rem] p-px ${className}`}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 rounded-[2rem] bg-white/[0.06]" />
      <div className="relative h-full overflow-hidden rounded-[calc(2rem-1px)] bg-neutral-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--accent) 16%, transparent), transparent 60%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}
