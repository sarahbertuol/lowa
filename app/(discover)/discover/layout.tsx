import type { Metadata, Viewport } from "next";
import "./discover.css";

/** LoWa Discover (Opportunity Engine). Own chrome: no site header or footer. Never indexed. */

// Every screen depends on the signed-in user: never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "LoWa Discover", template: "%s · LoWa Discover" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F0E6",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <div className="dx">{children}</div>;
}
