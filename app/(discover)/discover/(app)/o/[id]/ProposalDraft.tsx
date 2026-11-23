"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyCheck, readingTime, type ProposalContent } from "@/lib/engine/proposal";
import { regenerateDraft, saveProposal } from "./proposal-actions";

/**
 * Proposal draft (OE-12): the six sections, editable. Save makes a new version.
 * The copy check runs as you type; Investment comes from the catalog and isn't edited here.
 */

export type VersionRow = { version: number; created_at: string; status: string };

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(iso));

const TEMPLATE: Record<string, string> = { missing_website: "A · Missing website", growth: "B · Growth", seasonal: "C · Seasonal" };

export default function ProposalDraft({ id, version, template, content, versions }: {
  id: string; version: number; template: string; content: ProposalContent; versions: VersionRow[];
}) {
  const [c, setC] = useState<ProposalContent>(content);
  const [base, setBase] = useState(version);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [regenErr, setRegenErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const issues = copyCheck(c);
  const read = readingTime(c);
  const dirty = JSON.stringify(c) !== JSON.stringify(content) || base !== version;

  const up = (f: (x: ProposalContent) => ProposalContent) => { setC((x) => f(structuredClone(x))); setMsg(null); };

  function save() {
    start(async () => {
      const r = await saveProposal(id, base, c);
      if (r.ok) { setBase(r.version); setMsg({ ok: true, text: `Saved as v${r.version}.` }); router.refresh(); }
      else setMsg({ ok: false, text: r.error });
    });
  }
  function regenerate() {
    start(async () => {
      const r = await regenerateDraft(id);
      setRegenErr(r.ok ? null : r.error);
      if (r.ok) router.refresh();
    });
  }

  return (
    <section className="dx-group" aria-labelledby="h-proposal">
      <div className="dx-sec-row">
        <h2 id="h-proposal" className="dx-h2">Proposal draft</h2>
        <button type="button" className="dx-btn ghost small" onClick={regenerate} disabled={pending}>Regenerate draft</button>
      </div>
      <div className="dx-card dx-stack dx-prop">
        <p className="mono dim">v{base} · {TEMPLATE[template] ?? template} · {read.label} to read ({read.words} words)</p>
        <p className="dx-prop-hl">{c.hero.headline}</p>

        {issues.length > 0 ? (
          <div className="dx-issues" role="status">
            <b>{issues.length} copy issue{issues.length > 1 ? "s" : ""} to fix before publishing</b>
            <ul>{issues.map((i, n) => <li key={n}><span className="mono">{i.where}</span> {i.problem}</li>)}</ul>
          </div>
        ) : (
          <p className="dx-saved">Copy check passed: no long dashes, no promises without data, no invented proof.</p>
        )}
        {(read.seconds < 60 || read.seconds > 120) && <p className="dx-why">The brief asks for a 1 to 2 minute read.</p>}

        <details className="dx-prop-ed">
          <summary>Edit the text</summary>
          <div className="dx-stack">
            <fieldset><legend>Hero</legend>
              <Field label="Headline" value={c.hero.headline} onChange={(v) => up((x) => { x.hero.headline = v; return x; })} />
              <Field label="Subline" area value={c.hero.subline} onChange={(v) => up((x) => { x.hero.subline = v; return x; })} />
            </fieldset>
            <fieldset><legend>The opportunity</legend>
              <Field label="Title" value={c.opportunity.title} onChange={(v) => up((x) => { x.opportunity.title = v; return x; })} />
              {c.opportunity.body.map((p, i) => (
                <Field key={i} label={`Paragraph ${i + 1}`} area value={p} onChange={(v) => up((x) => { x.opportunity.body[i] = v; return x; })} />
              ))}
            </fieldset>
            {c.noticed.map((n, i) => (
              <fieldset key={i}><legend>What we noticed {i + 1}</legend>
                <Field label="Title" value={n.title} onChange={(v) => up((x) => { x.noticed[i].title = v; return x; })} />
                <Field label="What we saw" area value={n.saw} onChange={(v) => up((x) => { x.noticed[i].saw = v; return x; })} />
                <Field label="Why it matters" area value={n.why} onChange={(v) => up((x) => { x.noticed[i].why = v; return x; })} />
                <Field label="The opportunity" area value={n.opportunity} onChange={(v) => up((x) => { x.noticed[i].opportunity = v; return x; })} />
              </fieldset>
            ))}
            <fieldset><legend>Our recommendation · {c.recommendation.service}</legend>
              <Field label="Title" value={c.recommendation.title} onChange={(v) => up((x) => { x.recommendation.title = v; return x; })} />
              <Field label="Description" area value={c.recommendation.description} onChange={(v) => up((x) => { x.recommendation.description = v; return x; })} />
              {c.recommendation.bullets.map((b, i) => (
                <Field key={i} label={`Item ${i + 1}`} value={b} onChange={(v) => up((x) => { x.recommendation.bullets[i] = v; return x; })} />
              ))}
            </fieldset>
            <fieldset className="dx-prop-inv"><legend>Investment · from the catalog</legend>
              <p><b>{c.investment.label}</b> {c.investment.unit}</p>
              {c.investment.note && <p>{c.investment.note}</p>}
              <p><span className="mono">Payment</span> {c.investment.payment}</p>
              <p><span className="mono">Delivery</span> {c.investment.delivery}</p>
              {c.investment.notIncluded.length > 0 && <p><span className="mono">Not included</span> {c.investment.notIncluded.join(", ")}</p>}
              {c.investment.care && <p>{c.investment.care}</p>}
              <p className="dx-why">To change it, edit the catalog or change the service, then regenerate the draft.</p>
            </fieldset>
            <fieldset><legend>Next step</legend>
              <Field label="Title" value={c.nextStep.title} onChange={(v) => up((x) => { x.nextStep.title = v; return x; })} />
              <Field label="Text" area value={c.nextStep.body} onChange={(v) => up((x) => { x.nextStep.body = v; return x; })} />
            </fieldset>

            {msg && <p className={msg.ok ? "dx-saved" : "dx-field-err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
            <button type="button" className="dx-btn block" onClick={save} disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save as a new version"}
            </button>
          </div>
        </details>

        {versions.length > 1 && (
          <details className="dx-prop-ver">
            <summary>{versions.length} versions</summary>
            <ol>{versions.map((v) => <li key={v.version}><b>v{v.version}</b> <span className="mono">{when(v.created_at)} · {v.status}</span></li>)}</ol>
          </details>
        )}
        {regenErr && <p className="dx-field-err" role="alert">{regenErr}</p>}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) {
  const [id] = useState(() => `f-${Math.random().toString(36).slice(2, 9)}`);
  return (
    <div className="dx-field">
      <label htmlFor={id}>{label}</label>
      {area
        ? <textarea id={id} className="dx-input" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input id={id} className="dx-input" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
