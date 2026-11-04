"use client";

import { useEffect, useRef, useState } from "react";

// Shown once per full page load. Client-side navigation back to Home skips it.
let alreadyShown = false;

const MIN_MS = 1800; // long enough to see the dog run at least once
const MAX_MS = 6000; // never block the page longer than this
const MORPH_MS = 1000;

/** Return the box of the rendered text itself (not the full-width block). */
function textRect(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

export default function Preloader() {
  const [visible, setVisible] = useState(() => !alreadyShown);
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    alreadyShown = true;
    const html = document.documentElement;
    html.classList.add("pl-lock");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const minMs = reduced ? 400 : MIN_MS;

    // Real readiness signals, each worth a share of the bar.
    let ready = 30; // the app has hydrated (points out of 100)
    document.fonts?.ready.then(() => (ready += 35));
    const onLoad = () => (ready += 35);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    let shown = 0;
    let raf = 0;
    let done = false;

    const finish = () => {
      done = true;
      setPct(100);
      const logo = logoRef.current;
      const mark = document.querySelector(".hero .mark");
      const finishUp = () => {
        html.classList.remove("pl-lock");
        setVisible(false);
      };
      if (!logo || !mark || reduced) {
        setLeaving(true);
        window.setTimeout(finishUp, reduced ? 0 : 450);
        return;
      }
      const from = logo.getBoundingClientRect();
      const to = textRect(mark);
      const onScreen = to.bottom > 0 && to.top < window.innerHeight;
      setLeaving(true);
      if (onScreen && from.width > 0) {
        const scale = to.width / from.width;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        logo.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        logo.classList.add("to-mark");
      }
      window.setTimeout(finishUp, MORPH_MS);
    };

    let last = start;
    const tick = () => {
      const now = performance.now();
      const t = now - start;
      const dt = Math.max(0, now - last);
      last = now;
      const byTime = Math.min(1, t / minMs);
      const goal = t > MAX_MS ? 100 : Math.min(ready, byTime * 100);
      // Time-based easing, so a throttled frame rate does not stall the counter.
      shown += (goal - shown) * (1 - Math.exp(-dt / 90));
      if (goal - shown < 0.6) shown = goal;
      setPct(Math.floor(shown));
      if (shown >= 100 && !done) {
        window.setTimeout(finish, 180);
        return;
      }
      raf = window.setTimeout(tick, 16);
    };
    raf = window.setTimeout(tick, 16);

    return () => {
      window.clearTimeout(raf);
      window.removeEventListener("load", onLoad);
      html.classList.remove("pl-lock");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={rootRef} className={`preloader${leaving ? " leaving" : ""}`}>
      <div className="pl-run" aria-hidden="true">
        <svg className="pl-dog" viewBox="0 0 120 80" width="120" height="80">
          <ellipse className="pl-shadow" cx="56" cy="76" rx="40" ry="3" />
          <g className="pl-body">
            <path className="pl-tail" d="M24 36 C 14 30, 10 22, 6 14" />
            <g className="pl-leg pl-a">
              <rect x="27" y="44" width="7" height="26" rx="3.5" />
            </g>
            <g className="pl-leg pl-b">
              <rect x="36" y="44" width="7" height="26" rx="3.5" />
            </g>
            <g className="pl-leg pl-b">
              <rect x="66" y="44" width="7" height="26" rx="3.5" />
            </g>
            <g className="pl-leg pl-a">
              <rect x="75" y="44" width="7" height="26" rx="3.5" />
            </g>
            <ellipse cx="52" cy="42" rx="31" ry="14" />
            <path d="M72 36 L84 22 L92 30 L80 46 Z" />
            <circle cx="88" cy="24" r="13" />
            <ellipse cx="101" cy="29" rx="10" ry="6.5" />
            <circle className="pl-nose" cx="110" cy="27" r="2.6" />
            <ellipse className="pl-ear" cx="82" cy="22" rx="5" ry="11" transform="rotate(28 82 22)" />
            <circle className="pl-eye" cx="93" cy="20" r="1.9" />
            <rect className="pl-collar" x="74" y="31" width="5" height="14" rx="2" transform="rotate(-38 76 38)" />
          </g>
        </svg>
        <span className="pl-ball-wrap">
          <span className="pl-ball" />
          <span className="pl-ball-shadow" />
        </span>
      </div>

      <div className="pl-center">
        <div
          className="pl-pct"
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          {String(pct).padStart(3, "0")}%
        </div>
        <div ref={logoRef} className="pl-logo" aria-hidden="true">
          LoWa<em>Studio</em>
        </div>
      </div>
    </div>
  );
}
