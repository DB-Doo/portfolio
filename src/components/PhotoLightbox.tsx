"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

function parsePhotoUrl(combined: string): { url: string; thumb: string } {
  const pipeIdx = combined.indexOf("|data:");
  if (pipeIdx > 0) {
    return { url: combined.substring(0, pipeIdx), thumb: combined.substring(pipeIdx + 1) };
  }
  return { url: combined, thumb: "" };
}

function proxyUrl(url: string): string {
  const match = url.match(/[?&]id=([^&]+)/);
  if (!match) return url;
  return `/api/image?id=${match[1]}&v=2`;
}

interface PhotoThumbProps {
  url: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  gallery?: string[]; // all sibling URLs for swipe navigation
  galleryIndex?: number; // which index this thumb is in the gallery
}

export default function PhotoThumb({ url: rawUrl, size = "md", className, gallery, galleryIndex }: PhotoThumbProps) {
  const { url, thumb } = parsePhotoUrl(rawUrl);
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allUrls = gallery || [rawUrl];
  const hasGallery = allUrls.length > 1;

  function openLightbox() {
    setFullscreen(true);
    setCurrentIndex(galleryIndex ?? 0);
    requestAnimationFrame(() => setVisible(true));
  }

  function closeLightbox() {
    setVisible(false);
    setTimeout(() => setFullscreen(false), 200);
  }

  const goNext = useCallback(() => {
    if (currentIndex < allUrls.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, allUrls.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const currentUrl = parsePhotoUrl(allUrls[currentIndex] || rawUrl).url;

  const sizeClasses = { sm: "w-10 h-10", md: "w-20 h-20", lg: "w-24 h-24" };
  const sizePx = { sm: 40, md: 80, lg: 96 };
  const thumbSrc = thumb || (!thumbFailed ? proxyUrl(url) : "");

  useEffect(() => {
    if (fullscreen) {
      // Simple scroll lock — no position:fixed (causes touch issues on iOS)
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") goNext();
        else if (e.key === "ArrowLeft") goPrev();
        else if (e.key === "Escape") closeLightbox();
      };
      window.addEventListener("keydown", handleKey);

      return () => {
        window.removeEventListener("keydown", handleKey);
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen, goNext, goPrev]);

  // Swipe navigation disabled — use arrow buttons only.
  // Swipe gestures conflict with pinch-to-zoom on mobile.

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openLightbox(); }}
        className={`rounded-lg overflow-hidden border-2 border-gray-200
                   hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer shrink-0
                   ${className || ""}`}
        style={className ? { padding: 0 } : { width: sizePx[size], height: sizePx[size], padding: 0 }}
      >
        {thumbSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbSrc}
            alt="Photo"
            style={{ width: "100%", height: "100%", objectFit: className ? "contain" : "cover", display: "block" }}
            onError={() => setThumbFailed(true)}
            loading="lazy"
          />
        ) : (
          <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#3b82f6" }}>🖼</span>
        )}
      </button>

      {fullscreen && typeof document !== "undefined" && createPortal(
        <div className={`fixed inset-0 z-[100] bg-black transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
             onClick={(e) => e.stopPropagation()}>
          {/* Photo with swipe — touch-action:auto allows pinch zoom */}
          <div
            className={`absolute inset-0 z-10 transition-transform duration-200 ${visible ? "scale-100" : "scale-95"} flex items-center justify-center p-4 pt-16 pb-16`}
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
            onClick={() => closeLightbox()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={currentIndex}
              src={proxyUrl(currentUrl)}
              alt="Photo fullscreen"
              className="max-w-full max-h-full rounded-lg object-contain"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Top gradient + buttons — fixed so they don't scale with zoom */}
          <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 to-transparent pt-3 pb-10 px-3 flex justify-between items-start pointer-events-none">
            <div>
              {hasGallery && (
                <span className="bg-black/60 text-white text-sm font-medium px-3 py-2 rounded-full border border-white/30">
                  {currentIndex + 1} / {allUrls.length}
                </span>
              )}
            </div>
            <button
              onClick={() => closeLightbox()}
              className="w-11 h-11 bg-black/60 text-white rounded-full
                         text-xl font-bold flex items-center justify-center
                         border border-white/30 active:bg-black/80 pointer-events-auto"
            >
              ✕
            </button>
          </div>

          {/* Left/Right arrows — fixed position, won't scale with pinch-zoom */}
          {hasGallery && (
            <div className="fixed inset-0 z-30 pointer-events-none" style={{ touchAction: "none" }}>
              {currentIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full
                             text-2xl flex items-center justify-center border border-white/20 active:bg-black/70"
                  style={{ position: "fixed" }}
                >
                  ‹
                </button>
              )}
              {currentIndex < allUrls.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full
                             text-2xl flex items-center justify-center border border-white/20 active:bg-black/70"
                  style={{ position: "fixed" }}
                >
                  ›
                </button>
              )}
            </div>
          )}

          {/* Bottom gradient + link — fixed so they don't scale with zoom */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/70 to-transparent pb-4 pt-10 flex justify-center pointer-events-none">
            <a href={currentUrl} target="_blank"
               className="bg-black/60 text-white text-sm font-semibold px-5 py-2.5 rounded-full
                          border border-white/30 active:bg-black/80 pointer-events-auto">
              Open full size ↗
            </a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
