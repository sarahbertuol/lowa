"use client";

import { useEffect, useRef } from "react";

/** Black Friday pop-up on /business: opens once per visit, closes on X, "Maybe later", Esc or a tap outside. */
export default function BlackFridayPopup({ price, was }: { price: number; was: number }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d || typeof d.showModal !== "function") return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("bf-seen") === "1";
    } catch {
      /* storage blocked: show it */
    }
    if (seen) return;
    const t = window.setTimeout(() => d.showModal(), 400);
    return () => window.clearTimeout(t);
  }, []);

  function remember() {
    try {
      sessionStorage.setItem("bf-seen", "1");
    } catch {
      /* ignore */
    }
  }
  function close() {
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      className="bz-bf"
      aria-labelledby="bf-title"
      onClose={remember}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bz-bf-card">
        <button className="bz-bf-x" type="button" aria-label="Close" onClick={close}>
          ×
        </button>
        <span className="bz-bf-tag">Black Friday · business owners only</span>
        <h2 id="bf-title">
          Your website,
          <br />
          <em>almost half off.</em>
        </h2>
        <div className="bz-bf-price">
          <b>${price}</b>
          <s>
            <span className="sr-only">Regular price </span>${was}
          </s>
        </div>
        <p>A small website, ready and working, that you edit yourself. Home, About and Contact.</p>
        <div className="bz-bf-until">Confirm your project by December 4, 2026.</div>
        <a className="bz-bf-go" href="#start" onClick={close}>
          Get my website →
        </a>
        <button className="bz-bf-later" type="button" onClick={close}>
          Maybe later
        </button>
      </div>
    </dialog>
  );
}
