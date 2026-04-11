"use client";

import dynamic from "next/dynamic";

const PhysicsTags = dynamic(
  () => import("@/components/PhysicsTags").then((m) => m.PhysicsTags),
  { ssr: false, loading: () => <div className="h-[320px] sm:h-[280px] rounded-xl border border-neutral-800 bg-neutral-950/50 flex items-center justify-center text-neutral-600 text-sm">Loading physics...</div> }
);

const ALL_TECH = [
  "Swift", "SwiftUI", "iOS", "C++", "Metal GPU",
  "Next.js", "React", "TypeScript", "Tailwind CSS",
  "Rust", "Python", "Node.js",
  "Google Sheets API", "Google Drive", "Vercel",
  "SQLite", "Tokio", "WebSocket",
  "GLSL", "Matter.js", "Three.js",
];

export function PhysicsTagsWrapper() {
  return (
    <PhysicsTags
      tags={ALL_TECH}
      className="h-[320px] sm:h-[280px] rounded-xl border border-neutral-800 bg-neutral-950/50"
    />
  );
}
