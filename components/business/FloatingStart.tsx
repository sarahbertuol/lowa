"use client";

import { useEffect, useState } from "react";

/**
 * /business: round "Get started" button fixed at the bottom right. Takes the visitor to the
 * Get started section. Shows only once the section after the hero covers that corner
 * (so it never sits on the hero buttons) and steps aside while Get started is on screen.
 */
export default function FloatingStart() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const after = document.querySelector<HTMLElement>(".bz-hero + section");
    const start = document.getElementById("start");
    if (!after || !start) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const h = window.innerHeight;
      const past = after.getBoundingClientRect().top < h - 130;
      const s = start.getBoundingClientRect();
      const atStart = s.top < h * 0.85 && s.bottom > h * 0.15;
      setShow(past && !atStart);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <a
      className={`bz-float${show ? "" : " away"}`}
      href="#start"
      aria-hidden={show ? undefined : true}
      tabIndex={show ? undefined : -1}
    >
      <span className="bz-float-dot">
        <span>
          Get
          <br />
          started
        </span>
      </span>
    </a>
  );
}
