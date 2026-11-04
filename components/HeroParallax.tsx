"use client";

import { useEffect } from "react";

/** Gently moves the two tilted hero frames with the pointer. Respects reduced motion. */
export default function HeroParallax() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frames = hero.querySelectorAll<HTMLElement>(".hp");
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frames.forEach((f, i) => {
        const depth = i === 0 ? -1 : 1;
        f.style.translate = `${x * 22 * depth}px ${y * 16 * depth}px`;
      });
    };
    const onLeave = () => frames.forEach((f) => (f.style.translate = "0px 0px"));
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
