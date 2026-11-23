import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";
import Reveal from "@/components/Reveal";
import { createAdminClient } from "@/lib/engine/supabase/admin";
import { readSnapshot, type PublicProposal } from "@/lib/engine/publish";
import "../opportunity.css";

/**
 * Public proposal (OE-13, docs/referencia/Proposta.html). Reads only the published snapshot by
 * token, never the research. Revoked or expired links answer 410 in the middleware.
 * Always rendered on request, so unpublishing takes effect at once.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

const load = cache(async (token: string) => readSnapshot(createAdminClient(), token));

const TEMPLATE_HERO = { missing_website: "a", growth: "b", seasonal: "c" } as const;

const day = (iso: string, withYear = true) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "America/New_York" }).format(new Date(iso));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const s = await load(token);
  const noindex = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };
  if (s.state !== "ok") return { title: { absolute: "Proposal · LoWa Studio" }, robots: noindex };
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const title = `A proposal for ${s.content.business.name} · LoWa Studio`;
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description: s.content.hero.subline,
    robots: noindex,
    alternates: { canonical: null },
    referrer: "no-referrer",
    openGraph: { title, description: s.content.hero.subline, siteName: "LoWa Studio", type: "website", images: [{ url: "/opportunity/og", width: 1200, height: 630, alt: "LoWa Studio" }] },
    twitter: { card: "summary_large_image", title, images: ["/opportunity/og"] },
  };
}

export const viewport: Viewport = { themeColor: "#F7F0E6" };

/** Puts the voice word in Instrument Serif italic: the last sentence, or the last words. */
function voice(text: string): ReactNode {
  const t = text.trim();
  const m = t.match(/^(.+?[.!?])\s+(\S.*)$/);
  if (m) return <>{m[1]} <em>{m[2]}</em></>;
  const words = t.split(/\s+/);
  const n = words.length >= 7 ? 2 : 1;
  if (words.length < 3) return t;
  return <>{words.slice(0, -n).join(" ")} <em>{words.slice(-n).join(" ")}</em></>;
}

/** "[payment terms]": text still waiting on the founder, shown as pending. */
function pend(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((p, i) => (/^\[.+\]$/.test(p) ? <span key={i} className="pend">{p}</span> : p));
}

const COUNT = ["", "One thing", "Two things", "Three things"];

export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params;
  const s = await load(token);
  if (s.state !== "ok") notFound();
  const c = s.content;
  const t = TEMPLATE_HERO[c.template] ?? "b";
  const where = `${c.business.name}, ${c.business.city}`;
  const mail = `mailto:${c.contactEmail}?subject=${encodeURIComponent(`${c.business.name} proposal`)}`;

  return (
    <article className="op">
      <header className={`op-hero op-hero-${t}`}>
        <div className="op-top">
          <span className="op-lowa">LoWa <em>Studio</em></span>
          <span className="mono">Prepared {day(s.publishedAt)}</span>
        </div>
        <div className="op-hero-grid">
          <div>
            <h1 className="op-in">{voice(c.hero.headline)}</h1>
            <p className="op-for op-in d1">{c.hero.subline}</p>
            <p className="op-who op-in d2">For <b>{where}</b></p>
          </div>
          {t === "a" && <SiteFrame name={c.business.name} />}
          {t === "b" && c.noticed.length > 0 && <ReadCard items={c.noticed.map((n) => n.title)} />}
          {t === "c" && <Season iso={s.publishedAt} caption={c.noticed[0]?.title} />}
        </div>
      </header>

      <section className="op-sec op-two" aria-labelledby="op-opp">
        <div><span className="op-label mono">The opportunity</span><h2 id="op-opp">{voice(c.opportunity.title)}</h2></div>
        <Reveal className="op-prose">{c.opportunity.body.map((p, i) => <p key={i}>{p}</p>)}</Reveal>
      </section>

      {c.noticed.length > 0 && (
        <section className="op-sec" aria-labelledby="op-noticed">
          <span className="op-label mono">What we noticed</span>
          <h2 id="op-noticed">{COUNT[c.noticed.length] ?? "A few things"}, <em>specific to you.</em></h2>
          <ol className="op-noticed">
            {c.noticed.map((n, i) => (
              <Reveal as="li" key={i}>
                <span className="n" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{n.title}</h3>
                  <dl>
                    <div><dt>What we saw</dt><dd>{n.saw}</dd></div>
                    <div><dt>Why it matters</dt><dd>{n.why}</dd></div>
                    <div><dt>The opportunity</dt><dd>{n.opportunity}</dd></div>
                  </dl>
                  {n.source && <span className="op-src">{n.source}</span>}
                </div>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      <section className="op-sec" aria-labelledby="op-rec">
        <span className="op-label mono">Our recommendation</span>
        <h2 id="op-rec">{voice(c.recommendation.title)}</h2>
        <Reveal className="op-rec">
          <div><h3>{c.recommendation.service}</h3><p>{c.recommendation.description}</p></div>
          {c.recommendation.bullets.length > 0 && (
            <ul>
              {c.recommendation.bullets.map((b, i) => (
                <li key={i}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>{b}</li>
              ))}
            </ul>
          )}
        </Reveal>
      </section>

      <Investment c={c} />

      <section className="op-sec op-next" aria-labelledby="op-next">
        <span className="op-label mono">Next step</span>
        <h2 id="op-next">{voice(c.nextStep.title)}</h2>
        <p className="op-prose">{c.nextStep.body}</p>
        <div className="op-ctas">
          <a className="op-btn" href={mail}>Email LoWa Studio <span className="arr" aria-hidden="true">&rarr;</span></a>
        </div>
      </section>

      <footer className="op-foot">
        <span className="op-lowa">LoWa <em>Studio</em></span>
        <span className="mono">Prepared for {c.business.name} · valid until {day(s.expiresAt)}</span>
      </footer>
    </article>
  );
}

function Investment({ c }: { c: PublicProposal }) {
  const inv = c.investment;
  const from = inv.label.startsWith("from ");
  const price = from ? inv.label.slice(5) : inv.label;
  const rows: [string, string][] = [["Payment", inv.payment], ["Delivery", inv.delivery]];
  if (inv.notIncluded.length) rows.push(["Not included", inv.notIncluded.join("; ")]);
  return (
    <section className="op-sec op-invest" aria-labelledby="op-inv">
      <span className="op-label mono" id="op-inv">Investment</span>
      <div className="op-invest-grid">
        <Reveal className="op-price-wrap">
          <p className={`op-price${/\d/.test(price) ? "" : " words"}`}>
            {from && <small className="pre">from</small>}{price}{inv.unit && <small>{inv.unit}</small>}
          </p>
          {inv.note && <p className="op-inv-note">{pend(inv.note)}</p>}
          {inv.care && <p className="op-inv-note">{pend(inv.care)}</p>}
        </Reveal>
        <dl>
          {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{pend(v)}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}

/** Template A: a site that doesn't exist yet. */
function SiteFrame({ name }: { name: string }) {
  return (
    <div className="op-frame op-in d3" aria-hidden="true">
      <div className="chrome"><i /><i /><i /><span className="url">a site that doesn&apos;t exist yet</span></div>
      <div className="body">
        <span className="cap">Not live yet</span>
        <b>{name}</b>
        <span className="ph" /><span className="ph s" />
        <div className="tiles"><span /><span /><span /></div>
      </div>
    </div>
  );
}

/** Template B: the insights, as read on their own channels. */
function ReadCard({ items }: { items: string[] }) {
  return (
    <div className="op-read op-in d3">
      <span className="mono">What we read</span>
      {items.map((x, i) => <div className="row" key={i}><em>{i + 1}</em><p>{x}</p></div>)}
    </div>
  );
}

/** Template C: this month, from the day the proposal was prepared to the end of the month. */
function Season({ iso, caption }: { iso: string; caption?: string }) {
  const tz = "America/New_York";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: tz })
    .formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  const y = Number(parts.year), m = Number(parts.month), today = Number(parts.day);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return (
    <div className="op-cal op-in d3" role="img" aria-label={`${month} ${y}: from ${month} ${today} to the end of the month`}>
      <div className="cal-h"><b>{month}</b><span className="mono">{y}</span></div>
      <div className="cal-g" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span className="w" key={`w${i}`}>{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
          <span key={d} className={d === today ? "key" : d > today ? "on" : undefined}>{d}</span>
        ))}
      </div>
      {caption && <p>{caption}</p>}
    </div>
  );
}
