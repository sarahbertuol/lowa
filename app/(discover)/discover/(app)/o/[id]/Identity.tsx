/**
 * Identity at a glance (OE-14, Oportunidade.html Review): one line per channel, from the saved
 * findings. Only for the team.
 */

type F = { kind: string; verification: string; origin: string; source_url: string | null; data: Record<string, unknown> | null };

const host = (u: string | null) => (u ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");
const state = (f: F) => (f.verification === "verified" ? "verified" : "not verified");

export function identityRows(findings: F[]): [string, string][] {
  const live = findings.filter((f) => f.verification !== "rejected");
  const rows: [string, string][] = [];

  const googles = findings.filter((f) => f.kind === "google" && f.origin === "auto" && f.data?.place);
  const best = live.find((f) => f.kind === "google" && (f.data?.best === true || f.origin === "manual"));
  const place = best?.data?.place as { rating?: number | null; reviews?: number | null } | undefined;
  rows.push(["Google", best
    ? ["Matched", place?.rating != null ? `${place.rating.toFixed(1)} (${place.reviews ?? 0} reviews)` : null].filter(Boolean).join(" · ")
    : googles.length && googles.every((g) => g.verification === "rejected") ? "Set aside by you"
    : googles.length ? `${googles.length} possible profiles, none confirmed` : "Not found"]);

  const site = live.find((f) => f.kind === "website" && f.source_url && f.data?.pages) ?? live.find((f) => f.kind === "website" && f.source_url);
  rows.push(["Website", site ? `${host(site.source_url)} · ${state(site)}` : "None found"]);

  for (const [kind, label, prefix] of [["instagram", "Instagram", "@"], ["facebook", "Facebook", "facebook.com/"]] as const) {
    const s = live.filter((f) => f.kind === kind && typeof f.data?.handle === "string")
      .sort((a, b) => (a.verification === "verified" ? -1 : 0) - (b.verification === "verified" ? -1 : 0))[0];
    if (s) rows.push([label, `${prefix}${s.data!.handle as string} · ${state(s)}`]);
    else if (kind === "instagram") rows.push([label, "None found"]);
  }

  const email = live.filter((f) => f.kind === "contact" && typeof f.data?.email === "string")
    .sort((a, b) => (a.verification === "verified" ? -1 : 0) - (b.verification === "verified" ? -1 : 0))[0];
  rows.push(["Email", email ? `${email.data!.email as string} · ${state(email)}` : "Not found"]);
  return rows;
}

export default function Identity({ rows }: { rows: [string, string][] }) {
  return (
    <section className="dx-group" aria-labelledby="h-identity">
      <h2 id="h-identity" className="dx-h2">Identity</h2>
      <div className="dx-card">
        <dl className="dx-facts">
          {rows.map(([k, v]) => <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}
