import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Sarah B. and Marco K., the couple behind LoWa Studio, a name made from Lorena, our daughter, and Walter, our dog.",
  alternates: { canonical: "/about" },
};

// Journeys are placeholders until Sarah sends the real milestones (see "Open items" in CLAUDE.md).
const founders = [
  {
    key: "sarah",
    role: "Co-founder · Projects",
    name: "Sarah B.",
    text: "Sarah runs every project, from the first brief to the handoff. Your agency gets one clear point of contact and a fixed price from the start.",
    journey: [
      ["[Ano]", "[Primeiro marco da trajetória]"],
      ["[Ano]", "[Segundo marco da trajetória]"],
      ["Today", "Runs every LoWa Studio project"],
    ],
  },
  {
    key: "marco",
    role: "Co-founder",
    name: "Marco K.",
    text: "Marco is the other half of the studio. Together we build for agencies that need their clients' sites to work as hard as they do.",
    journey: [
      ["[Ano]", "[Primeiro marco da trajetória]"],
      ["[Ano]", "[Segundo marco da trajetória]"],
      ["Today", "Co-founder of LoWa Studio"],
    ],
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="page-head">
        <Reveal>
          <div className="mono">Who we are</div>
          <h1 style={{ marginTop: 14 }}>
            One studio
            <br />
            <em>and a love story.</em>
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="lead" style={{ marginTop: 24 }}>
            LoWa Studio is a production team for US agencies that resell websites. We build fast, fixed
            price sites with AI tools, directed by people who have built websites for clients for years.
          </p>
        </Reveal>
      </section>

      <section className="band founders" style={{ paddingTop: 48 }}>
        {founders.map((f, i) => (
          <Reveal key={f.key} delay={i ? 1 : undefined} as="article" className={`founder${i ? " b" : ""}`}>
            <div className={`person photo ${f.key}`}>
              <small>{f.role}</small>
              <strong>{f.name}</strong>
            </div>
            <p className="founder-text">{f.text}</p>
            <div className="mono" style={{ marginTop: 28 }}>Journey</div>
            <ol className="journey">
              {f.journey.map(([when, what]) => (
                <li key={what}>
                  <span className="when">{when}</span>
                  <span>{what}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        ))}
      </section>

      <section className="story" aria-labelledby="story-title">
        <Reveal>
          <div className="mono">Our story</div>
          <h2 id="story-title" style={{ marginTop: 14 }}>
            A name made <em>at home.</em>
          </h2>
          <p className="story-lead">
            Before it was a studio, it was a family. Two people, one very fluffy dog and a daughter on the
            way. So when we needed a name, we did not look far.
          </p>
        </Reveal>

        <div className="story-chapters">
          <Reveal as="article" className="chapter us">
            <img className="shot" src="/about/two-of-us.webp" alt="Sarah and Marco kissing in a black and white photo booth picture" width={800} height={640} loading="lazy" />
            <span className="num">01</span>
            <h3>
              The two <em>of us.</em>
            </h3>
            <p>Sarah and Marco: seven years together in April 2026, partners at home and at work. LoWa Studio is the thing we build together.</p>
          </Reveal>
          <Reveal as="article" delay={1} className="chapter walter">
            <span className="num">02</span>
            <img src="/walter/scene/run.webp" alt="Illustration of Walter, our fluffy dog, running happily" width={353} height={320} loading="lazy" />
            <h3>
              Walter, <em>our dog.</em>
            </h3>
            <p>He was the first one to get a starring role. You will spot him around this site.</p>
          </Reveal>
          <Reveal as="article" delay={2} className="chapter lorena">
            <img className="shot" src="/about/lorena.webp" alt="Marco and Sarah smiling at Lorena's baby shower brunch, hands on Sarah's belly" width={800} height={640} loading="lazy" />
            <span className="num">03</span>
            <div className="due" aria-hidden="true">
              <span>03</span>
              <span>2027</span>
            </div>
            <h3>
              Lorena, <em>on the way.</em>
            </h3>
            <p>Our daughter is due in March 2027. She already has a studio named after her.</p>
          </Reveal>
        </div>

        <Reveal className="name-math">
          <div className="part">
            <span className="big">Lo</span>
            <span className="mono">from Lorena</span>
          </div>
          <span className="op" aria-hidden="true">+</span>
          <div className="part">
            <span className="big">Wa</span>
            <span className="mono">from Walter</span>
          </div>
          <span className="op" aria-hidden="true">=</span>
          <div className="part result">
            <span className="big">
              LoWa <em>Studio</em>
            </span>
            <span className="mono">our family, on every site we build</span>
          </div>
        </Reveal>

        <Reveal className="story-close">
          <p>
            Family is everything to us. That is why the studio carries their names, and why we treat
            every client site with the same care.
          </p>
          <Link className="btn" href="/contact">
            Start a project <span className="arr">→</span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
