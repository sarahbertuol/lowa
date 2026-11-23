import type { Metadata } from "next";
import { NetDot } from "@/components/discover/Network";

export const metadata: Metadata = { title: "New opportunity" };

/**
 * Capture screen. The service worker keeps a copy so it opens without internet.
 * The form itself (docs/referencia/Nova.html) arrives in OE-04.
 */
export default function NewOpportunity() {
  return (
    <main className="dx-app">
      <header className="dx-top">
        <a className="dx-back" href="/discover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Cancel
        </a>
        <NetDot />
      </header>
      <h1 className="dx-title">New <em>opportunity</em></h1>
      <section className="dx-card dx-stack">
        <p className="mono">Coming in OE-04</p>
        <p>The capture form (name, city and optional details) goes here. This screen already opens without internet.</p>
      </section>
    </main>
  );
}
