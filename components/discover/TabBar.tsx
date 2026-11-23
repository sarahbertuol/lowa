"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Fixed bottom bar of LoWa Discover (docs/referencia/Discover.html), "New" in the middle. */
export default function TabBar() {
  const path = usePathname();
  const view = useSearchParams().get("view");
  const current = (href: string) => {
    const [p, q] = href.split("?view=");
    const here = path === p && (q ? view === q : !view);
    return here ? ("page" as const) : undefined;
  };

  return (
    <nav className="dx-bar" aria-label="App">
      <div className="dx-tabbar">
        <Link href="/discover" aria-current={current("/discover")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 11 12 4l8 7v9H4z" /></svg>
          Home
        </Link>
        <Link href="/discover?view=all" aria-current={current("/discover?view=all")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" /></svg>
          All
        </Link>
        {/* Plain link: opens even offline, served by the service worker. */}
        <a className="new" href="/discover/new" aria-label="New opportunity" aria-current={current("/discover/new")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </a>
        <Link href="/discover?view=ready" aria-current={current("/discover?view=ready")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-7z" /></svg>
          Share
        </Link>
        <Link href="/discover/catalog" aria-current={current("/discover/catalog")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
          Catalog
        </Link>
      </div>
    </nav>
  );
}
