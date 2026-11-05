"use client";

import { useEffect, useRef } from "react";

/**
 * A short, silent, decorative loop (a GIF converted to video, far lighter).
 * Nothing loads until it is on screen, it pauses off screen, and it stays on
 * its first frame for reduced motion. Expects `${src}.webm`, `.mp4` and `-poster.jpg`.
 */
export default function LoopClip({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) {
      v.play().catch(() => {});
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={`${src}-poster.jpg`}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
