import { SOURCE_LABEL, type SourceKind } from "@/lib/engine/research/findings";
import AddSource, { RemoveSource } from "./AddSource";

/** Sources (docs/referencia/Oportunidade.html): add a source by hand (OE-08), and every finding with verification, confidence, date and source. */

export type FindingRow = {
  id: string;
  kind: string;
  finding: string;
  source_url: string | null;
  verification: "verified" | "unverified" | "rejected";
  confidence: "high" | "medium" | "low";
  checked_at: string;
  origin: "auto" | "manual";
  source: string | null;
  why: string | null;
};

const ORDER = ["google", "website", "contact", "instagram", "facebook", "store", "catalog", "review", "photo", "competitor", "context", "note"];
const TAG = { verified: ["fact", "Verified"], unverified: ["hyp", "Not verified"], rejected: ["no", "Rejected"] } as const;

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(iso));

const shortUrl = (u: string) => {
  try {
    const x = new URL(u);
    const path = x.pathname === "/" ? "" : x.pathname.replace(/\/$/, "");
    const s = x.hostname.replace(/^www\./, "") + path;
    return s.length > 48 ? `${s.slice(0, 47)}…` : s;
  } catch { return u; }
};

export default function Sources({ id, findings }: { id: string; findings: FindingRow[] }) {
  const sorted = [...findings].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return (
    <section className="dx-group" aria-labelledby="h-sources">
      <h2 id="h-sources" className="dx-h2">Sources</h2>
      <div className="dx-card dx-findings">
        {sorted.map((f) => {
          const [cls, label] = TAG[f.verification];
          const src = f.source && f.source in SOURCE_LABEL ? SOURCE_LABEL[f.source as SourceKind] : null;
          return (
            <div key={f.id} className="dx-finding">
              <div className="meta">
                <span className={`dx-tag ${cls}`}>{label}</span>
                <span className={`dx-conf c-${f.confidence}`}><i aria-hidden="true" />{f.confidence}<span className="sr"> confidence</span></span>
                <span className="mono"><time dateTime={f.checked_at}>{when(f.checked_at)}</time></span>
              </div>
              <p>{f.finding}</p>
              {f.why && <span className="why">{f.why}</span>}
              {f.source_url ? (
                <a className="src" href={f.source_url} target="_blank" rel="noopener noreferrer nofollow">
                  {src ? `${src}: ` : ""}{shortUrl(f.source_url)}
                </a>
              ) : (
                src && <span className="src-label">Source: {src}</span>
              )}
              {f.origin === "manual" && <RemoveSource id={id} findingId={f.id} />}
            </div>
          );
        })}
        <AddSource id={id} />
      </div>
    </section>
  );
}
