"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/#what-we-do", label: "What we do", match: "/" },
  { href: "/services", label: "Services", match: "/services" },
  { href: "/#process", label: "Process", match: "/" },
  { href: "/#work", label: "Work", match: "/" },
  { href: "/about", label: "About", match: "/about" },
];

const BUTTER = [244, 223, 164];
const BROWN = [74, 36, 21];

/** Box of the rendered text itself (not the full-width block). */
function textRect(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2; // gentle in and out
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  openRef.current = open;

  useEffect(() => {
    const header = headerRef.current;
    const logo = logoRef.current;
    if (!header || !logo) return;
    const mark = document.querySelector<HTMLElement>(".hero .mark");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Geometry of the hero wordmark (page coordinates) and of the nav logo (viewport), without transforms.
    let range = 0;
    let from = { cx: 0, cy: 0, w: 0 };
    let to = { cx: 0, cy: 0, w: 0 };
    const measure = () => {
      // A long stretch of scroll for the flight, but it must land while the hero (which clips it) is on screen.
      const hero = mark?.closest(".hero") as HTMLElement | null;
      const room = hero ? hero.offsetHeight - 120 : 420;
      range = Math.max(220, Math.min(window.innerHeight * 0.9, room));
      if (!mark) return;
      const prevMark = mark.style.transform;
      const prevHeader = header.style.transform;
      mark.style.transform = "none";
      header.style.transition = "none";
      header.style.transform = "none";
      const box = mark.getBoundingClientRect();
      const t = textRect(mark);
      const l = textRect(logo);
      from = { cx: t.left + t.width / 2, cy: t.top + t.height / 2 + window.scrollY, w: t.width };
      to = { cx: l.left + l.width / 2, cy: l.top + l.height / 2, w: l.width };
      mark.style.transformOrigin = `${from.cx - box.left}px ${t.top + t.height / 2 - box.top}px`;
      mark.style.transform = prevMark;
      header.style.transform = prevHeader;
      void header.offsetWidth; // apply without animating
      header.style.transition = "";
    };

    let lastY = window.scrollY;
    let frame = 0;
    let smooth = -1; // eased copy of the scroll progress, so the logo glides instead of snapping
    let lastT = 0;
    const update = (now = performance.now()) => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      const dt = lastT ? Math.min(64, now - lastT) : 16;
      lastT = now;

      // 1. On Home, the giant wordmark shrinks into the nav logo over the first scroll.
      if (mark && from.w > 0) {
        const target = clamp01(y / range);
        smooth = smooth < 0 || reduced ? target : smooth + (target - smooth) * (1 - Math.exp(-dt / 180));
        if (Math.abs(target - smooth) < 0.0015) smooth = target;
        else if (!frame) frame = requestAnimationFrame(update);
        const p = smooth;
        const fade = clamp01((p - 0.9) / 0.1); // short cross-fade once they overlap
        logo.style.opacity = String(fade);
        logo.style.visibility = fade > 0 ? "visible" : "hidden";
        mark.style.opacity = String(1 - fade);
        if (reduced) {
          mark.style.transform = "";
        } else {
          const e = ease(p);
          const cx = from.cx;
          const cy = from.cy - y; // where the wordmark naturally is right now
          const dx = (to.cx - cx) * e;
          const dyy = (to.cy - cy) * e;
          const s = 1 + (to.w / from.w - 1) * e;
          mark.style.transform = p > 0 ? `translate(${dx}px, ${dyy}px) scale(${s})` : "";
          const c = BUTTER.map((b, i) => Math.round(b + (BROWN[i] - b) * e));
          mark.style.color = p > 0 ? `rgb(${c.join(",")})` : "";
        }
      }

      // 2. Header: transparent at the top, hides on the way down, comes back blurred on the way up.
      const top = mark ? range : 80;
      if (y <= top || openRef.current) {
        header.classList.remove("is-hidden");
        header.classList.toggle("is-solid", y > top);
      } else if (dy > 4) {
        header.classList.add("is-hidden");
      } else if (dy < -4) {
        header.classList.remove("is-hidden");
        header.classList.add("is-solid");
      }
    };
    const onScroll = () => {
      if (!frame) {
        lastT = performance.now();
        frame = requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    document.fonts?.ready.then(onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      header.classList.remove("is-hidden", "is-solid");
      logo.style.opacity = "";
      logo.style.visibility = "";
      if (mark) {
        mark.style.transform = "";
        mark.style.opacity = "";
        mark.style.color = "";
      }
    };
  }, [pathname]);

  // Opening the menu always brings the header back.
  useEffect(() => {
    if (open) headerRef.current?.classList.remove("is-hidden");
  }, [open]);

  return (
    <header ref={headerRef} className="site-header">
      <nav className="nav" aria-label="Main">
        <Link ref={logoRef} className="logo" href="/">
          LoWa <em>Studio</em>
        </Link>
        <div className="pill-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.match && l.match !== "/" ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link className="btn" href="/contact">
          Book a call <span className="arr">→</span>
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>
      <div id="mobile-menu" className={`mobile-menu${open ? " open" : ""}`}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link href="/contact" onClick={() => setOpen(false)}>
          Book a call
        </Link>
      </div>
    </header>
  );
}
