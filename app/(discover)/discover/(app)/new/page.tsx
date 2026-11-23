import type { Metadata } from "next";
import { NetDot } from "@/components/discover/Network";
import CaptureForm from "./CaptureForm";

export const metadata: Metadata = { title: "New opportunity" };

/** Capture screen (docs/referencia/Nova.html). The service worker keeps a copy so it opens offline. */
export default function NewOpportunity() {
  return (
    <main className="dx-app dx-app-form">
      <header className="dx-top">
        <a className="dx-back" href="/discover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Cancel
        </a>
        <NetDot />
      </header>
      <h1 className="dx-title">New <em>opportunity</em></h1>
      <CaptureForm />
    </main>
  );
}
