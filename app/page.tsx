import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import HeroParallax from "@/components/HeroParallax";
import ProcessProgress from "@/components/ProcessProgress";
import Preloader from "@/components/Preloader";
import Walter from "@/components/Walter";
import BrowserVideo from "@/components/BrowserVideo";

export default function HomePage() {
  return (
    <main id="top">
      <Preloader />
      <section className="hero">
        <HeroParallax />
        <div className="hero-inner">
          <Reveal>
            <h1>
              We built.
              <br />
              <em>You sell.</em>
            </h1>
          </Reveal>
          <Reveal delay={1}>
            <p className="lead">
              LoWa Studio is a production team behind US agencies that resell AI-built websites. Fast
              delivery, great price, happy clients.
            </p>
          </Reveal>
          <Reveal delay={2} className="cta-row">
            <Link className="btn" href="#what-we-do">
              What we deliver <span className="arr">→</span>
            </Link>
            <Link className="btn-ghost" href="/services">
              <i className="dot" />
              See the work
            </Link>
          </Reveal>
        </div>
        <div className="hero-photos" aria-hidden="true">
          <div className="hp hp1">
            <small>Client site · Home</small>
            <small>24h to live</small>
          </div>
          <div className="hp hp2">
            <small>Client site · About</small>
            <small>Fixed price</small>
          </div>
        </div>
        <div className="mark" aria-hidden="true">
          LoWa<em>Studio</em>
        </div>
        <div className="hero-dog" aria-hidden="true">
          <Walter className="idle" />
        </div>
      </section>

      <Ticker />

      <section className="band" id="what-we-do">
        <div className="intro">
          <Reveal className="frame">
            <BrowserVideo
              src="/work/convitelorena"
              url="convitelorena.vercel.app"
              label="Screen recording of convitelorena.vercel.app loading, a site built by LoWa Studio"
            />
            <div className="inner">
              <strong>Live in 24 hours</strong>
              <span>From brief to a live site on your agency&apos;s domain.</span>
            </div>
            <div className="stamp" aria-hidden="true">
              <div>
                <b>24h</b>
                <small>Human-directed</small>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <div className="mono">What we do</div>
              <h2 style={{ marginTop: 14 }}>
                AI-built websites
                <br />
                <em>with no AI look.</em>
              </h2>
            </Reveal>
            <Reveal delay={1} className="copy">
              <p className="lead">
                We build websites with AI tools, directed by a senior designer and a project manager
                who knows web businesses. Your client gets a fast, beautiful page that is ready to
                convert, and you get it in a day.
              </p>
              <div className="cta-row">
                <Link className="btn-ghost" href="/services">
                  <i className="dot" />
                  See pricing
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band" id="pricing" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="mono">Pricing</div>
          <h2 style={{ marginTop: 14, maxWidth: 820 }}>
            Fixed prices.
            <br />
            <em>One process behind all of them.</em>
          </h2>
        </Reveal>
        <div className="cards" style={{ marginTop: 48 }}>
          <Reveal className="card-img">
            <article className="white">
              <span className="mono">Small website</span>
              <div className="price">
                $920<small>one time</small>
              </div>
              <h3>
                Home, About <em>and</em> Contact
              </h3>
              <ul>
                <li>Three pages, built to sell</li>
                <li>CMS panel included, so your client edits their own content</li>
                <li>Mobile and PageSpeed-first build</li>
                <li>Live in 24 hours</li>
              </ul>
              <Link className="btn" href="/contact">
                Start this project <span className="arr">→</span>
              </Link>
            </article>
          </Reveal>
          <Reveal delay={1} className="card-img warm">
            <article className="white">
              <span className="mono">Bigger websites</span>
              <div className="price">
                $1,200<small>starting at 4 pages</small>
              </div>
              <h3>
                US$ 250 for each <em>extra page</em>
              </h3>
              <ul>
                <li>Starting at 4 pages</li>
                <li>CMS panel included</li>
                <li>Fixed scope, agreed before the build</li>
              </ul>
              <Link className="btn-ghost" href="/contact">
                <i className="dot" />
                Start the 2-minute briefing
              </Link>
            </article>
          </Reveal>
        </div>
        <Reveal className="maint">
          <div>
            <div className="mono">Monthly maintenance</div>
            <p>
              Hosting, updates, backups and small edits, so the site stays fast. CMS editing is
              included in the build, so maintenance covers the care, not basic changes.
            </p>
          </div>
          <div className="amount">
            $180
            <small> / month</small>
          </div>
        </Reveal>
        <div className="svc-list">
          {[
            ["Design and build", "Layout, colour and type made for the client's market."],
            ["Copy structure", "Page outline and headlines that say what the client sells."],
            ["CMS panel", "Text, images and new pages edited without touching code."],
            ["Performance and SEO", "Fast pages, clean markup and the basics search needs."],
            ["Forms and tracking", "Forms and analytics set up and tested before launch."],
            ["Launch and handoff", "Domain, checks and a short walkthrough for your client."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) as 1 | 2 | 3} className="svc">
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="proof">
        <Reveal className="proof-card">
          <div>
            <div className="mono" style={{ color: "var(--butter)" }}>
              Why agencies choose us
            </div>
            <h2 style={{ marginTop: 14 }}>
              Fast, fair and <em>easy to resell.</em>
            </h2>
            <p>
              You keep the client relationship. We handle the build, the speed and the details, and we
              stay on the project until it goes live.
            </p>
          </div>
          <div className="stats">
            <div className="stat">
              <b>24h</b>
              <span>from brief to a live site</span>
            </div>
            <div className="stat">
              <b>$920</b>
              <span>fixed price to start, no hourly surprises</span>
            </div>
            <div className="stat">
              <b>1 team</b>
              <span>a senior designer and a project manager on every site</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="band" id="process" style={{ paddingTop: 0 }}>
        <div className="split">
          <Reveal className="side-frame">
            <div className="card">
              <span className="mono">Live</span>
              <strong>Your site, on the domain.</strong>
              <span>With a short handoff for your client.</span>
            </div>
          </Reveal>
          <div id="process-root">
            <Reveal>
              <div className="mono">Process</div>
              <h2 style={{ marginTop: 14 }}>
                From brief to live,
                <br />
                <em>step by step.</em>
              </h2>
            </Reveal>
            <ProcessProgress rootId="process-root" />
            <div className="steps">
              <span className="progress" aria-hidden="true" />
              {[
                ["0 h", "Brief", "A short form tells us the goal, the audience and the deadline."],
                ["2 h", "Structure", "We send the page outline, timeline and fixed price."],
                ["8 h", "Design", "Layout and copy come together, reviewed by a senior designer."],
                ["16 h", "Build and check", "Pages built, forms tested, speed and SEO checked."],
                ["24 h", "Live", "Site on the domain, with a short handoff for your client."],
              ].map(([hr, h, p], i) => (
                <div key={hr} className={`step${i === 4 ? " live" : ""}`}>
                  <div className="hr">{hr}</div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="work" style={{ paddingTop: 0 }}>
        <div className="work-head">
          <Reveal>
            <div className="mono">Selected work</div>
            <h2 style={{ marginTop: 14 }}>
              Built to <em>convert.</em>
            </h2>
          </Reveal>
          <p className="lead" style={{ maxWidth: 380 }}>
            Sites for finance, legal and personal brands, each made to fit the business behind it.
          </p>
        </div>
        <div className="cases">
          {[
            { tag: "Legal", name: "Wottrich Advocacia", cls: "", text: "A calm, credible site that puts the practice's expertise first." },
            { tag: "Finance", name: "Simplifique Capital", cls: " b", text: "A clear, trustworthy page for a finance team with a lot to explain." },
            { tag: "Personal brand", name: "Fabiana Campos", cls: " c", text: "A personal site with warmth, built to bring in new clients." },
          ].map((c, i) => (
            <Reveal key={c.name} delay={(i + 1) as 1 | 2 | 3} as="article" className="case">
              <div className={`shot${c.cls}`}>
                <span className="mono">{c.tag}</span>
                <strong>{c.name}</strong>
              </div>
              <div className="body">
                <span className="mono">{c.tag}</span>
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="closing" id="about">
        <div className="about">
          <Reveal>
            <div className="mono">Who we are</div>
            <h2 style={{ marginTop: 14 }}>
              Two founders,
              <br />
              <em>one studio.</em>
            </h2>
            <p>
              Sarah runs every project, from the first brief to the handoff, and Marco is the other
              half of the studio. We build for clients who need their site to work as hard as they do.
            </p>
            <div className="cta-row" style={{ marginTop: 28 }}>
              <Link className="btn" href="/about">
                Read our story <span className="arr">→</span>
              </Link>
            </div>
          </Reveal>
          <div className="people">
            <Reveal className="person">
              <small>Co-founder</small>
              <strong>Sarah Bertuol</strong>
            </Reveal>
            <Reveal delay={1} className="person b">
              <small>Co-founder</small>
              <strong>Marco</strong>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band" id="contact" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <Reveal className="contact">
          <div className="contact-grid">
            <div>
              <div className="mono">Start here</div>
              <h2 style={{ marginTop: 14 }}>
                Ready to sell <em>websites?</em>
              </h2>
              <p>
                Fill in our 3-minute briefing and we reply within 5 hours with the structure, timeline
                and fixed price.
              </p>
              <div className="cta-row" style={{ marginTop: 28 }}>
                <Link className="btn" href="/contact">
                  Start the 3-minute briefing <span className="arr">→</span>
                </Link>
              </div>
            </div>
            <div className="side">
              <span className="mono">Or write to us</span>
              <a className="copy-mail" href="mailto:hello@lowastudio.com">
                hello@lowastudio.com
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
