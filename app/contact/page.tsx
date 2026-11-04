import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import BriefingForm from "@/components/BriefingForm";

export const metadata: Metadata = {
  title: "Start the briefing",
  description: "Fill in our 3-minute briefing. We reply within 5 hours with the structure, timeline and fixed price.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-head">
        <Reveal>
          <div className="mono">Start here</div>
          <h1 style={{ marginTop: 14 }}>
            Ready to sell <em>websites?</em>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead" style={{ marginTop: 24 }}>
            Fill in our 3-minute briefing and we reply within 5 hours with the structure, timeline and fixed
            price.
          </p>
        </Reveal>
      </section>

      <section className="band" style={{ paddingTop: 40 }}>
        <Reveal>
          <BriefingForm />
        </Reveal>
        <p className="hint" style={{ marginTop: 20 }}>
          Or write to us at{" "}
          <a href="mailto:hello@lowastudio.com" style={{ color: "var(--blue)" }}>
            hello@lowastudio.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
