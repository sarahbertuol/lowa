import type { Metadata } from "next";
import Link from "next/link";
import DirectForm from "@/components/DirectForm";
import BlackFridayPopup from "@/components/business/BlackFridayPopup";
import HeroStick from "@/components/business/HeroStick";
import { cases } from "@/data/cases";
import "./business.css";

/**
 * /business (SITE-01): the page behind the QR code at markets, for business owners.
 * Not in the menu, noindex, out of robots.txt. Prototype: docs/referencia/Business.html.
 * The Black Friday price ends by itself after December 4, 2026 (US Eastern), checked every hour.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Websites for business owners",
  description:
    "A small, fast website for your business, done for you, with a panel to edit it yourself. Fixed price.",
  robots: { index: false, follow: false },
};

const PROMO_END = new Date("2026-12-05T05:00:00Z"); // end of December 4 in New York
const PRICE = 920;
const PROMO_PRICE = 500;
const WHATSAPP = "5554981490779";

const SHOWCASE = [
  "gampi-site.vercel.app",
  "convitelorena.vercel.app",
  "geraldoburigo.com",
  "leti-pieruccini.vercel.app",
  "fabianacampos.com.br",
];

const faq: [string, string][] = [
  ["Can I edit the site myself?", "Yes. The editing panel is included, so you change text and photos on your own, any time."],
  [
    "Do I have to sign up for the monthly plan?",
    "No. Your site goes live ready and working without it. The plan is there if you want new pages, new sections or us making the changes for you.",
  ],
  [
    "What if I already have a website?",
    "We can redesign it. Tell us what you have and we send you an idea with the price.",
  ],
  [
    "Is the domain included?",
    "No. The price covers the design and build of your site. You buy your domain (the address, like yourbusiness.com) in your own name, so it is always yours, and we connect it to the site for you.",
  ],
  ["Do you build online stores?", "Yes. We quote them after a quick look at your products, so the price fits what you sell."],
];

export default function BusinessPage() {
  const promo = Date.now() < PROMO_END.getTime();
  const work = SHOWCASE.map((host) => cases.find((c) => c.site?.host === host)).filter(
    (c): c is (typeof cases)[number] & { site: NonNullable<(typeof cases)[number]["site"]> } => !!c?.site,
  );
  const strip = promo
    ? ["Start 2027 with a strong online presence", `Black Friday: $${PROMO_PRICE} until December 4`, "Ready, working and yours to edit"]
    : ["Start 2027 with a strong online presence", "Ready, working and yours to edit", "Fixed price, no hourly surprises"];
  const run = [...strip, ...strip];
  const track = (
    <div className="bz-strip-track" aria-hidden="true">
      {[0, 1].map((g) => (
        <div key={g} className="bz-strip-group">
          {run.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bz">
      <div className="bz-strip">
        <p className="sr-only">{strip.join(". ")}.</p>
        {track}
      </div>

      <header className="bz-top">
        <Link className="logo" href="/">
          LoWa <em>Studio</em>
        </Link>
        <a className="btn-ghost" href="#start">
          Get started
        </a>
      </header>

      <main>
        <section className="bz-hero">
          <div>
            <div className="mono">For business owners</div>
            <h1>
              A website for your business, <em>done for you.</em>
            </h1>
            <p className="bz-lead">
              We design and build a small, fast website for your business, with a simple panel so you can edit it
              yourself. Fixed price, no hourly surprises.
            </p>
            <div className="bz-row">
              <a className="btn" href="#start">
                Tell us about your business <span className="arr">→</span>
              </a>
              <a className="btn-ghost" href="#work">
                See sites we built
              </a>
            </div>
          </div>
          <aside className="bz-deal" aria-label={promo ? "Black Friday price" : "Price"}>
            <div className="mono">{promo ? "Black Friday price" : "Small website"}</div>
            {promo && (
              <div className="bz-was">
                <span className="sr-only">Regular price </span>${PRICE}
              </div>
            )}
            <div className="bz-now">
              ${promo ? PROMO_PRICE : PRICE}
              <small>one time</small>
            </div>
            <p>Design and build of your Small website: Home, About and Contact, with the editing panel included.</p>
            <p className="bz-fine">Your domain (yourbusiness.com) is bought separately, in your name.</p>
            {promo && <div className="bz-until">For projects confirmed by December 4, 2026.</div>}
          </aside>
        </section>

        <section className="bz-two">
          <div>
            <div className="mono">What you get</div>
            <h2>
              Three pages that
              <br />
              <em>do the work.</em>
            </h2>
            <ul className="bz-get">
              <li>
                <b>Home, About and Contact</b>
                <span>Who you are, what you sell and how to reach you, written to turn visitors into customers.</span>
              </li>
              <li>
                <b>A panel to edit it yourself</b>
                <span>Change text and photos without calling anyone.</span>
              </li>
              <li>
                <b>Fast on phones</b>
                <span>Built mobile first and checked for speed and Google.</span>
              </li>
              <li>
                <b>A contact form that reaches you</b>
                <span>Messages land in your email.</span>
              </li>
            </ul>
          </div>
          <div className="bz-how">
            <div className="mono">How it works</div>
            <h2>
              Three steps,
              <br />
              <em>one price.</em>
            </h2>
            <ol className="bz-steps">
              <li>
                <b>Tell us about your business</b>
                <span>The short form below, or a message to Sarah.</span>
              </li>
              <li>
                <b>Get a one-page idea</b>
                <span>What we noticed, what your site would do, and the fixed price.</span>
              </li>
              <li>
                <b>We build, you review, it goes live</b>
                <span>You see it before launch and ask for changes.</span>
              </li>
            </ol>
            <p className="bz-note">
              The price covers design and build. Your domain is bought separately, in your name, and we connect it
              for you. Online store? We quote it after a quick look at your products.
            </p>
          </div>
        </section>

        <section className="bz-care">
          <div>
            <div className="mono">After launch, only if you want</div>
            <h2>
              Need more? <em>We&apos;ve got you.</em>
            </h2>
            <p>
              Your site goes live ready and working, and you edit the text yourself. If you want more, like new pages,
              new sections, or us making the text and photo changes for you, the monthly plan covers 5 hours of our
              work every month.
            </p>
          </div>
          <div className="bz-amount">
            $180<small> / month</small>
          </div>
        </section>

        <section className="bz-band" id="work">
          <div className="mono">Our work</div>
          <h2>
            Sites we <em>built.</em>
          </h2>
          <div className="bz-works">
            {work.map((c) => (
              <article key={c.site.host} className="bz-work">
                {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot, sized by CSS */}
                <img src={c.site.img} alt={`Screenshot of the ${c.name} website`} width={1120} height={700} loading="lazy" />
                <div>
                  <h3>{c.name}</h3>
                  <a href={c.site.url} target="_blank" rel="noopener noreferrer">
                    Visit {c.site.host} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bz-band">
          <div className="mono">Good to know</div>
          <h2>
            Questions? <em>We love those.</em>
          </h2>
          <div className="bz-faq">
            {faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bz-band bz-two bz-start" id="start">
          <div>
            <div className="mono">Get started</div>
            <h2>
              Tell us about <em>your business.</em>
            </h2>
            <div className="bz-talk">
              <p>Or talk to Sarah directly:</p>
              <p>
                <b>WhatsApp</b>{" "}
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                  +55 54 98149-0779
                </a>
              </p>
              <p>
                <b>Email</b> <a href="mailto:hello@lowa-studio.com">hello@lowa-studio.com</a>
              </p>
            </div>
          </div>
          <DirectForm source={promo ? "Business page (Black Friday)" : "Business page"} />
        </section>
      </main>

      <footer className="bz-foot">
        <Link className="logo" href="/">
          LoWa <em>Studio</em>
        </Link>
        <span>Websites for agencies and business owners</span>
      </footer>

      {/* Same strip at the very bottom; screen readers already heard it at the top */}
      <div className="bz-strip" aria-hidden="true">
        {track}
      </div>

      <HeroStick />

      {promo && <BlackFridayPopup price={PROMO_PRICE} was={PRICE} />}
    </div>
  );
}
