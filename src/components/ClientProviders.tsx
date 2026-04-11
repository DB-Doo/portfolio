"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CustomCursor = dynamic(
  () => import("@/components/CustomCursor").then((m) => m.CustomCursor),
  { ssr: false }
);

const SmoothScroll = dynamic(
  () => import("@/components/SmoothScroll").then((m) => m.SmoothScroll),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <CustomCursor />
      <SmoothScroll />
      {children}
    </>
  );
}
