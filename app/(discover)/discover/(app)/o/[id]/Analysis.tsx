import {
  DIMENSION_LABEL, SENTENCE_LABEL,
  type DimensionRow, type Insight, type Sentence, type Template,
} from "@/lib/engine/research/insights";
import Regenerate from "./Regenerate";
import ChangeService from "./ChangeService";
import ChangeTemplate from "./ChangeTemplate";
import { quote } from "@/lib/engine/pricing";
import type { Service } from "@/lib/engine/catalog";

/** What we noticed and the suggestion (docs/referencia/Oportunidade.html, OE-09). Only for the team. */

export type AnalysisRow = {
  version: number;
  created_at: string;
  insights: Insight[];
  dimensions: { items?: DimensionRow[]; serviceReason?: string; ruleTemplate?: Template; templateByFounder?: Template } | null;
  service_slug: string | null;
  extra_pages: number;
  template: Template | null;
};

const TAG: Record<Sentence["kind"], string> = { fact: "fact", observation: "", hypothesis: "hyp", recommendation: "rec" };
const ROLE = [["observed", "Observed"], ["why", "Why it matters"], ["action", "What we'd do"], ["benefit", "Benefit"]] as const;
const RATING: Record<string, string> = { strong: "Strong", fair: "Fair", weak: "Weak", unknown: "No evidence" };
const TEMPLATE_WHY: Record<Template, string> = {
  missing_website: "No verified website.",
  growth: "Verified website.",
  seasonal: "Strong seasonal timing among the insights.",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(iso));

export default function Analysis({ id, analysis, services, sourceLabel, part }: {
  id: string;
  /** The review splits in two columns on desktop (OE-14): the findings, then the offer. */
  part: "noticed" | "offer";
  analysis: AnalysisRow;
  services: Service[];
  sourceLabel: Record<string, string>;
}) {
  const dims = analysis.dimensions?.items ?? [];
  const rule = analysis.dimensions?.ruleTemplate ?? (analysis.dimensions?.templateByFounder ? null : analysis.template);
  const service = services.find((s) => s.slug === analysis.service_slug) ?? null;
  // The price is always computed here from the catalog row, never stored from the AI.
  const q = service ? quote(service, analysis.extra_pages) : null;
  return (
    <>
      {part === "noticed" && <section className="dx-group" aria-labelledby="h-noticed">
        <div className="dx-sec-row">
          <h2 id="h-noticed" className="dx-h2">What we noticed</h2>
          <Regenerate id={id} />
        </div>
        <div className="dx-card dx-stack">
          {analysis.insights.length === 0 && (
            <p className="dx-empty">Nothing specific enough to say yet. Add a source you trust, then regenerate.</p>
          )}
          {analysis.insights.map((ins, n) => {
            const based = [...new Set(ins.sources.map((s) => sourceLabel[s]).filter(Boolean)), ...(ins.usesNote ? ["your note"] : [])];
            return (
              <article key={n} className="dx-ins">
                <span className="n" aria-hidden="true">{String(n + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{ins.title}</h3>
                  <span className="mono dim">{DIMENSION_LABEL[ins.dimension]}</span>
                  <dl>
                    {ROLE.map(([key, label]) => {
                      const s = ins[key];
                      return (
                        <div key={key}>
                          <dt className="mono">{label}</dt>
                          <dd>{s.text} <span className={`dx-tag ${TAG[s.kind]}`}>{SENTENCE_LABEL[s.kind]}</span></dd>
                        </div>
                      );
                    })}
                  </dl>
                  {based.length > 0 && <p className="mono src">Based on: {based.join(", ")}</p>}
                </div>
              </article>
            );
          })}
          {dims.length > 0 && (
            <details className="dx-dims">
              <summary>All six dimensions</summary>
              <dl>
                {dims.map((d) => (
                  <div key={d.dimension}>
                    <dt>{DIMENSION_LABEL[d.dimension]} <span className={`r r-${d.rating}`}>{RATING[d.rating]}</span></dt>
                    {d.note && <dd>{d.note}</dd>}
                  </div>
                ))}
              </dl>
            </details>
          )}
          <p className="mono dim">Version {analysis.version} · {when(analysis.created_at)}</p>
        </div>
      </section>}

      {part === "offer" && <section className="dx-group" aria-labelledby="h-reco">
        <h2 id="h-reco" className="dx-h2">Recommendation</h2>
        <div className="dx-card dx-stack">
          {service && q ? (
            <div className="dx-quote">
              <div className="row">
                <b className="dx-svc">{service.name}</b>
                <span className="price">{q.label}</span>
              </div>
              {q.lines.length > 0 && <ul className="lines">{q.lines.map((l) => <li key={l}>{l}</li>)}</ul>}
              {service.summary && <p className="dx-why">{service.summary}</p>}
              {analysis.dimensions?.serviceReason && <p>{analysis.dimensions.serviceReason}</p>}
              {!service.active && <p className="dx-field-err">This service is turned off in the catalog. Choose another one.</p>}
              {service.active && service.price_type !== "custom" && service.price_cents == null && (
                <p className="dx-field-err">This service has no price yet. Set it in the catalog.</p>
              )}
              <p className="mono dim">Price from the catalog{service.updated_at ? `, updated ${when(service.updated_at)}` : ""}</p>
            </div>
          ) : (
            <p className="dx-empty">The suggested service is no longer in the catalog. Choose another one.</p>
          )}
          <ChangeService
            id={id}
            current={analysis.service_slug}
            extraPages={analysis.extra_pages}
            options={services.filter((s) => s.active).map((s) => ({ slug: s.slug, name: s.name, label: quote(s).label, perPage: s.extra_page_cents != null && s.price_type !== "custom" }))}
          />
          <a className="dx-link" href="/discover/catalog">Edit catalog</a>
          {analysis.template && (
            <div>
              <p className="mono dim">Proposal template</p>
              {rule && <p className="dx-why">Rule: {TEMPLATE_WHY[rule]}</p>}
              <ChangeTemplate key={analysis.template} id={id} current={analysis.template} rule={rule} chosen={!!analysis.dimensions?.templateByFounder} />
            </div>
          )}
        </div>
      </section>}
    </>
  );
}
