import type { Metadata } from "next";
import { FolderLaunchLoop } from "@/components/ux/loops/FolderLaunchLoop";

/*
A private bench for the Doto before / after loops while they are being made. Not linked from
anywhere and kept out of search; each loop moves into the Doto case study once Dan signs off,
and this page goes with the last of them.
*/

export const metadata: Metadata = {
  title: "Loops bench",
  robots: { index: false, follow: false },
};

export default function LoopsBench() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-20 font-sans text-neutral-200">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">Doto · before and after</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">1. One touch instead of two</h1>
        <p className="mt-4 text-[17px] leading-8 text-neutral-300">
          Opening an app from a folder. Before: tap the folder, look for the app, tap it. After, with Quick
          launch on: press the folder, slide onto the app, and let go.
        </p>
        <div className="mt-12">
          <FolderLaunchLoop />
        </div>

        {/* The same loop framed 4:5 for LinkedIn; the export script films this box. */}
        <p className="mt-24 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">Video frame</p>
        <div
          id="video-frame"
          className="mt-4 flex aspect-[4/5] w-[540px] max-w-full flex-col justify-between bg-neutral-950 px-10 pb-8 pt-10"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Before and after · 1</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">Launching an app from a folder</p>
          </div>
          <FolderLaunchLoop />
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Doto Launcher · dbdoo.dev
          </p>
        </div>
      </div>
    </main>
  );
}
