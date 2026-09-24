import Image from "next/image";
import type { Figure } from "@/content/work";

/*
Device frames drawn in CSS, so screenshots read as products rather than loose images.
Phones get a bezel, a camera dot and a soft reflection; wide shots get a browser window.
*/

export function PhoneFrame({
  figure,
  priority = false,
  sizes = "300px",
  className = "",
}: {
  figure: Figure;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-[2.4rem] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-800 p-[7px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] ${className}`}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-black">
        <Image
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          priority={priority}
          sizes={sizes}
          className="block h-auto w-full"
        />
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2.5 size-2.5 -translate-x-1/2 rounded-full bg-neutral-900 ring-1 ring-neutral-700"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
        />
      </div>
    </div>
  );
}

export function BrowserFrame({
  figure,
  priority = false,
  sizes = "(min-width: 1024px) 800px, 100vw",
  className = "",
  url = "dbdoo.dev",
}: {
  figure: Figure;
  priority?: boolean;
  sizes?: string;
  className?: string;
  url?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-neutral-900/90 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-neutral-700" />
        <span className="size-2.5 rounded-full bg-neutral-700" />
        <span className="size-2.5 rounded-full bg-neutral-700" />
        <span className="ml-3 truncate rounded-md bg-neutral-800 px-3 py-0.5 font-mono text-[10px] text-neutral-500">
          {url}
        </span>
      </div>
      <Image
        src={figure.src}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        priority={priority}
        sizes={sizes}
        className="block h-auto w-full"
      />
    </div>
  );
}

export function Device(props: { figure: Figure; priority?: boolean; sizes?: string; className?: string }) {
  return props.figure.shape === "phone" ? <PhoneFrame {...props} /> : <BrowserFrame {...props} />;
}
