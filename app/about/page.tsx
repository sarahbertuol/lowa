import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description: "Meet Sarah and Marco, the two founders behind LoWa Studio.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-head">
        <Reveal>
          <div className="mono">Who we are</div>
          <h1 style={{ marginTop: 14 }}>
            Two founders,
            <br />
            <em>one studio.</em>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead" style={{ marginTop: 24 }}>
            LoWa Studio is a production team for US agencies that resell websites. We build fast, fixed
            price sites with AI tools, directed by people who have built websites for clients for years.
          </p>
        </Reveal>
      </section>

      <section className="band" style={{ paddingTop: 48 }}>
        <div className="cards" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Reveal className="person">
            <small>Co-founder · Projects</small>
            <strong>Sarah Bertuol</strong>
          </Reveal>
          <Reveal delay={1} className="person b">
            <small>Co-founder</small>
            <strong>Marco</strong>
          </Reveal>
        </div>
        <Reveal style={{ marginTop: 36, maxWidth: 640 }}>
          <p className="lead" style={{ maxWidth: "none" }}>
            Sarah runs every project from the first brief to the handoff. Marco is the other half of the
            studio. Your agency gets one clear point of contact and a fixed price from the start.
          </p>
        </Reveal>
        <Reveal style={{ marginTop: 32 }}>
          <Link className="btn" href="/contact">
            Start a project <span className="arr">→</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
