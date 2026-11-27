"use client";

import { useEffect } from "react";

/**
 * /business: feeds two sizes to the CSS so the hero fills the first screen and stays put
 * while the next section slides over it. --bz-above = strip + header height,
 * --bz-hero-h = hero height (a hero taller than the screen sticks only once its end is visible).
 * Without JS the CSS falls back to plain values and the page still works.
 */
export default function HeroStick() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".bz-hero");
    const top = document.querySelector<HTMLElement>(".bz-top");
    if (!hero || !top) return;
    const set = () => {
      // measured from the header, since a sticky hero reports its stuck offset
      hero.style.setProperty("--bz-above", `${top.offsetTop + top.offsetHeight}px`);
      hero.style.setProperty("--bz-hero-h", `${hero.offsetHeight}px`);
    };
    set();
    const care = document.querySelector<HTMLElement>(".bz-care");
    const setCare = () => care?.style.setProperty("--bz-care-h", `${care.offsetHeight}px`);
    setCare();
    const ro = new ResizeObserver(() => {
      set();
      setCare();
    });
    ro.observe(hero);
    if (care) ro.observe(care);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);
  return null;
}
