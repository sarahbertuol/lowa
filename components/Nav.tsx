"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/#what-we-do", label: "What we do", match: "/" },
  { href: "/services", label: "Services", match: "/services" },
  { href: "/#process", label: "Process", match: "/" },
  { href: "/#work", label: "Work", match: "/" },
  { href: "/about", label: "About", match: "/about" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main">
        <Link className="logo" href="/">
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
