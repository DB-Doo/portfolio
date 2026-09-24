"use client";

import Image from "next/image";
import { useState } from "react";
import type { Figure } from "@/content/work";

/*
Before and after on one screen. Drag the handle (or use the arrow keys, since it is a real
range input underneath) to wipe between the two versions. The first view is split down the
middle so both states are visible without touching anything.
*/

export function CompareSlider({ before, after }: { before: Figure; after: Figure }) {
  const [split, setSplit] = useState(50);

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      <div className="relative rounded-[2.4rem] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800 p-[7px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-black">
          <Image
            src={after.src}
            alt={after.alt}
            width={after.width}
            height={after.height}
            sizes="340px"
            className="block h-auto w-full"
          />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          >
            <Image
              src={before.src}
              alt={before.alt}
              width={before.width}
              height={before.height}
              sizes="340px"
              className="block h-auto w-full"
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
            style={{ left: `${split}%` }}
          >
            <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-medium text-neutral-950 shadow-lg">
              ⇆
            </span>
          </div>

          <span className="pointer-events-none absolute left-4 top-10 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-300 backdrop-blur">
            Before
          </span>
          <span className="pointer-events-none absolute right-4 top-10 rounded-full bg-[var(--accent,#67e8f9)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-950">
            After
          </span>

          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            aria-label="Drag to compare before and after"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        Drag to compare
      </p>
    </div>
  );
}
