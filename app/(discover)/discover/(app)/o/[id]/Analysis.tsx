import {
  DIMENSION_LABEL, SENTENCE_LABEL, TEMPLATE_LABEL,
  type DimensionRow, type Insight, type Sentence, type Template,
} from "@/lib/engine/research/insights";
import Regenerate from "./Regenerate";

/** What we noticed and the suggestion (docs/referencia/Oportunidade.html, OE-09). Only for the team. */

export type AnalysisRow = {
  version: number;
  created_at: string;
  insights: Insight[];
  dimensions: { items?: DimensionRow[]; serviceReason?: string } | null;
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

export default function Analysis({ id, analysis, service, sourceLabel }: {
  id: string;
  analysis: AnalysisRow;
  service: { name: string; summary: string | null } | null;
  sourceLabel: Record<string, string>;
}) {
  const dims = analysis.dimensions?.items ?? [];
  return (
    <>
      <section className="dx-group" aria-labelledby="h-noticed">
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
      </section>

      <section className="dx-group" aria-labelledby="h-reco">
        <h2 id="h-reco" className="dx-h2">Recommendation</h2>
        <div className="dx-card dx-stack">
          {service ? (
            <div>
              <b className="dx-svc">{service.name}{analysis.extra_pages > 0 ? ` + ${analysis.extra_pages} extra page${analysis.extra_pages > 1 ? "s" : ""}` : ""}</b>
              {service.summary && <p className="dx-why">{service.summary}</p>}
              {analysis.dimensions?.serviceReason && <p>{analysis.dimensions.serviceReason}</p>}
              <p className="mono dim">Price comes from the catalog (OE-11)</p>
            </div>
          ) : (
            <p className="dx-empty">The suggested service is no longer in the catalog.</p>
          )}
          {analysis.template && (
            <div>
              <p className="mono dim">Proposal template</p>
              <p><b>{TEMPLATE_LABEL[analysis.template]}</b> <span className="dx-why">{TEMPLATE_WHY[analysis.template]} You can change it in the review.</span></p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
