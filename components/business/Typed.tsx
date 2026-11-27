"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * /business: italic words typed key by key, with a blinking cursor (opacity only).
 * `when="load"`: the hero, typed on page load in CSS (waits while the Black Friday pop-up is open).
 * `when="view"`: typed the first time it scrolls into view; JS arms it, so without JS the text just shows.
 * Screen readers get the whole text once; the letters are decorative copies.
 */
export default function Typed({ text, when = "view" }: { text: string; when?: "load" | "view" }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (when !== "view") return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.go = "";
        io.disconnect();
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [when]);

  const chars = [...text];
  return (
    <em ref={ref} className={`bz-type bz-type--${when}`} style={{ "--n": chars.length } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((c, i) => (
          <span key={i} className={i === chars.length - 1 ? "c last" : "c"} style={{ "--i": i } as CSSProperties}>
            {c}
          </span>
        ))}
      </span>
    </em>
  );
}
