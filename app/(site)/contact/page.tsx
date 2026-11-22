import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import BriefingForm from "@/components/BriefingForm";
import DirectForm from "@/components/DirectForm";

export const metadata: Metadata = {
  title: "Start the briefing",
  description:
    "Agencies: fill in our 3-minute briefing and we reply within 5 hours. Business owners who found our work can write to us directly.",
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
        <Reveal delay={2} className="cta-row" style={{ marginTop: 28 }}>
          <a className="btn" href="#briefing">
            I&apos;m an agency <span className="arr">→</span>
          </a>
          <a className="btn-ghost" href="#direct">
            <i className="dot" />
            I want a site for my business
          </a>
        </Reveal>
      </section>

      <section className="band" id="briefing" style={{ paddingTop: 40 }}>
        <Reveal>
          <div className="mono">For agencies</div>
          <h2 className="contact-title">
            The agency <em>briefing.</em>
          </h2>
        </Reveal>
        <Reveal>
          <BriefingForm />
        </Reveal>
        <p className="hint" style={{ marginTop: 20 }}>
          Or write to us at{" "}
          <a href="mailto:hello@lowa-studio.com" style={{ color: "var(--blue)" }}>
            hello@lowa-studio.com
          </a>
          .
        </p>
      </section>

      <section className="band direct" id="direct">
        <Reveal>
          <div className="mono">For business owners</div>
          <h2 className="contact-title">
            Found us through <em>our work?</em>
          </h2>
          <p className="lead" style={{ marginTop: 18, maxWidth: 520 }}>
            Not an agency? No problem. If you saw a site we built and want one for your own business, tell us
            about it here and we will get back to you by email.
          </p>
        </Reveal>
        <Reveal>
          <DirectForm />
        </Reveal>
      </section>
    </main>
  );
}
