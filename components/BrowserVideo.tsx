"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Path without extension, e.g. "/work/convitelorena". Expects .webm, .mp4 and -poster.jpg. */
  src: string;
  /** Address shown in the fake browser bar. */
  url: string;
  label: string;
};

/**
 * A small browser window with a looping, muted screen recording.
 * Pauses when off screen, starts paused for reduced motion, and has a pause button (WCAG 2.2.2).
 */
export default function BrowserVideo({ src, url, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      userPaused.current = true;
      v.pause();
      setPaused(true);
    }
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
      setPaused(false);
    } else {
      userPaused.current = true;
      v.pause();
      setPaused(true);
    }
  };

  return (
    <figure className="browser" aria-label={label}>
      <div className="browser-bar">
        <i />
        <i />
        <i />
        <span className="browser-url">{url}</span>
        <button
          type="button"
          className="browser-toggle"
          onClick={toggle}
          aria-label={paused ? "Play recording" : "Pause recording"}
        >
          {paused ? (
            <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true">
              <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true">
              <path d="M2 1 h2.2 v8 H2 Z M5.8 1 H8 v8 H5.8 Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={`${src}-poster.jpg`}
        aria-hidden="true"
      >
        <source src={`${src}.webm`} type="video/webm" />
        <source src={`${src}.mp4`} type="video/mp4" />
      </video>
    </figure>
  );
}
