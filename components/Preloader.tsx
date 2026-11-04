"use client";

import { useEffect, useRef, useState } from "react";
import Walter from "@/components/Walter";

// Shown once per full page load. Client-side navigation back to Home skips it.
let alreadyShown = false;

const MIN_MS = 1800; // long enough to see Walter jump a couple of times
const MAX_MS = 6000; // never block the page longer than this
const MORPH_MS = 1000;
const JUMP_MS = 950;

/** Walter leaps along an arc into his spot in the hero, then sits there. */
function leapTo(el: HTMLElement, target: DOMRect) {
  const from = el.getBoundingClientRect();
  if (!from.width) return;
  const s = target.width / from.width;
  const dx = target.left + target.width / 2 - (from.left + from.width / 2);
  const dy = target.top + target.height / 2 - (from.top + from.height / 2);
  const lift = 160 + Math.max(0, -dy); // peak of the arc above the straight line
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = dx * t;
    const y = dy * t - lift * 4 * t * (1 - t);
    const k = 1 + (s - 1) * t;
    const tilt = (dx < 0 ? -1 : 1) * 14 * Math.sin(Math.PI * t);
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${k}) rotate(${tilt}deg)` });
  }
  el.animate(frames, { duration: JUMP_MS, easing: "cubic-bezier(.3,0,.5,1)", fill: "forwards" });
}

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
  const dogRef = useRef<HTMLDivElement>(null);

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
      const dog = dogRef.current;
      const spot = document.querySelector(".hero-dog .walter");
      if (dog && spot) {
        const target = spot.getBoundingClientRect();
        if (target.bottom > 0 && target.top < window.innerHeight) leapTo(dog, target);
      }
      if (onScreen && from.width > 0) {
        const scale = to.width / from.width;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        logo.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        logo.classList.add("to-mark");
      }
      window.setTimeout(finishUp, Math.max(MORPH_MS, JUMP_MS) + 40);
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
    <div className={`preloader${leaving ? " leaving" : ""}`}>
      <div className="pl-center">
        <div className="pl-stage" aria-hidden="true">
          <span className="pl-ball" />
          <div ref={dogRef} className="pl-walter">
            <Walter />
          </div>
        </div>
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
