import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Services and pricing",
  description: "Fixed prices for AI-built websites: Small website from US$920, bigger websites from US$1,200, maintenance US$180 per month.",
  alternates: { canonical: "/services" },
};

const included = [
  ["Design and build", "Layout, colour and type made for the client's market."],
  ["Copy structure", "Page outline and headlines that say what the client sells."],
  ["CMS panel", "Text, images and new pages edited without touching code."],
  ["Performance and SEO", "Fast pages, clean markup and the basics search needs."],
  ["Forms and tracking", "Forms and analytics set up and tested before launch."],
  ["Launch and handoff", "Domain, checks and a short walkthrough for your client."],
];

export default function ServicesPage() {
  return (
    <main>
      <section className="page-head">
        <Reveal>
          <div className="mono">Services</div>
          <h1 style={{ marginTop: 14 }}>
            Fixed prices.
            <br />
            <em>One process behind all of them.</em>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead" style={{ marginTop: 24 }}>
            Pick the size that fits your client. The price is set before we start and does not move.
          </p>
        </Reveal>
      </section>

      <section className="band" style={{ paddingTop: 48 }}>
        <div className="price-table">
          <Reveal className="plan feat">
            <span className="mono">Small website</span>
            <div className="amount">
              $920
            </div>
            <p>Home, About and Contact, built to sell and easy for your client to edit.</p>
            <ul>
              <li>Three pages: Home, About and Contact</li>
              <li>CMS panel included</li>
              <li>Mobile and PageSpeed-first build</li>
              <li>Live in 24 hours</li>
            </ul>
            <Link className="btn" href="/contact">
              Start this project <span className="arr">→</span>
            </Link>
          </Reveal>
          <Reveal delay={1} className="plan">
            <span className="mono">Bigger websites</span>
            <div className="amount">$1,200</div>
            <p>Starting at 4 pages. US$ 250 for each extra page.</p>
            <ul>
              <li>Starting at 4 pages</li>
              <li>CMS panel included</li>
              <li>Fixed scope, agreed before the build</li>
            </ul>
            <Link className="btn-ghost" href="/contact">
              <i className="dot" />
              Start the 2-minute briefing
            </Link>
          </Reveal>
        </div>

        <Reveal className="maint">
          <div>
            <div className="mono">Monthly maintenance</div>
            <p>
              Hosting, updates, backups and small edits, so the site stays fast. CMS editing is included in
              the build, so maintenance covers the care, not basic changes.
            </p>
          </div>
          <div className="amount">
            $180
            <small> / month</small>
          </div>
        </Reveal>

        <div className="svc-list">
          {included.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) as 1 | 2 | 3} className="svc">
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
