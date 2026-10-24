"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { fabricBus } from "./bus";
import { Spring, type Collider } from "./engine";

/*
A project card that opens by widening its well until it is the page. A sheet the colour of the
case study grows out of the card on springs, the fabric parts around it as it goes, and the
case study is underneath when it lands. The sheet then lifts away (a short fade of the same
colour), so the next page reads as having been inside the card.

Modified clicks (new tab, new window) and reduced motion get the plain link.
*/

export function WellLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();

    const from = event.currentTarget.getBoundingClientRect();
    const sheet = document.createElement("div");
    sheet.setAttribute("aria-hidden", "true");
    Object.assign(sheet.style, {
      position: "fixed",
      zIndex: "45",
      background: "#0a0a0a",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
      pointerEvents: "none",
      transition: "opacity 320ms ease",
    });
    document.body.append(sheet);

    const springs = {
      x: new Spring(from.left, 0.085, 0.76),
      y: new Spring(from.top, 0.085, 0.76),
      w: new Spring(from.width, 0.085, 0.76),
      h: new Spring(from.height, 0.085, 0.76),
      r: new Spring(32, 0.085, 0.76),
    };
    springs.x.t = 0;
    springs.y.t = 0;
    springs.w.t = window.innerWidth;
    springs.h.t = window.innerHeight;
    springs.r.t = 0;

    const collider: Collider = { x: from.left, y: from.top, w: from.width, h: from.height, r: 32, pad: 28, str: 0.07 };
    fabricBus.colliders.add(collider);
    fabricBus.busy = true;
    fabricBus.wake();

    const began = performance.now();
    let pushed = false;
    const frame = () => {
      let moving = false;
      for (const s of Object.values(springs)) moving = s.step() || moving;
      Object.assign(sheet.style, {
        left: `${springs.x.v}px`,
        top: `${springs.y.v}px`,
        width: `${springs.w.v}px`,
        height: `${springs.h.v}px`,
        borderRadius: `${springs.r.v}px`,
      });
      Object.assign(collider, { x: springs.x.v, y: springs.y.v, w: springs.w.v, h: springs.h.v, r: springs.r.v });
      // Navigate once the sheet has nearly filled the window; the route is already prefetched.
      if (!pushed && (performance.now() - began > 380 || !moving)) {
        pushed = true;
        router.push(href);
      }
      if (location.pathname === href && (!moving || performance.now() - began > 650)) {
        fabricBus.colliders.delete(collider);
        fabricBus.busy = false;
        fabricBus.calm();
        sheet.style.opacity = "0";
        window.setTimeout(() => sheet.remove(), 360);
        return;
      }
      if (performance.now() - began > 4000) {
        // The navigation never landed: put the page back as it was.
        fabricBus.colliders.delete(collider);
        fabricBus.busy = false;
        sheet.remove();
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  return (
    <Link href={href} className={className} onClick={open}>
      {children}
    </Link>
  );
}
