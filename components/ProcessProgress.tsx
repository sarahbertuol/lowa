"use client";

import { useEffect } from "react";

/** Fills the timeline line and lights each step as the reader scrolls past it. */
export default function ProcessProgress({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>(".step"));
    const track = root.querySelector<HTMLElement>(".steps");
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      steps.forEach((s) => s.classList.add("on"));
      return;
    }
    const update = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      track.style.setProperty("--p", p.toFixed(3));
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle("on", sr.top < vh * 0.7);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [rootId]);
  return null;
}
