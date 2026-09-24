"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isPolicySurface = pathname.startsWith("/doto-launcher/privacy");
  const isCaseStudy = pathname.startsWith("/work/");

  return (
    <>
      {!isPolicySurface && <CustomCursor />}
      {/* Case studies are long reads: native scrolling keeps reading speed in the reader's hands. */}
      {!isPolicySurface && !isCaseStudy && <SmoothScroll />}
      {children}
    </>
  );
}
