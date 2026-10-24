"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const CustomCursor = dynamic(
  () => import("@/components/CustomCursor").then((m) => m.CustomCursor),
  { ssr: false }
);

const SiteFabric = dynamic(() => import("@/components/fabric/SiteFabric").then((m) => m.SiteFabric), {
  ssr: false,
});

const SiteCritters = dynamic(() => import("@/components/fabric/SiteCritters").then((m) => m.SiteCritters), {
  ssr: false,
});

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
      {/* One dot sheet under every page, with the critters living on it. The policy stays plain. */}
      {!isPolicySurface && <SiteFabric />}
      {!isPolicySurface && <SiteCritters />}
      {/* Case studies are long reads: native scrolling keeps reading speed in the reader's hands. */}
      {!isPolicySurface && !isCaseStudy && <SmoothScroll />}
      {children}
    </>
  );
}
