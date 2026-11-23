import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { STATUS_LABEL, type Status } from "@/lib/engine/status";
import { NetDot } from "@/components/discover/Network";
import StatusPicker from "./StatusPicker";
import Notes from "./Notes";
import DeleteOpportunity from "./DeleteOpportunity";
import ResearchProgress from "./ResearchProgress";
import { STEPS, isActive, isPaused, slimJob, type Job } from "@/lib/engine/research/steps";
import Sources, { type FindingRow } from "./Sources";
import VerifyIdentity, { type Candidate } from "./VerifyIdentity";
import { assess, type FindingLite } from "@/lib/engine/research/confidence";
import Analysis, { type AnalysisRow } from "./Analysis";
import { SERVICE_COLUMNS, type Service } from "@/lib/engine/catalog";
import Regenerate from "./Regenerate";

export const maxDuration = 300; // confirming an identity starts the research again in the background

export const metadata: Metadata = { title: "Opportunity" };

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmt = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/New_York",
  }).format(new Date(iso));

/** Opportunity detail (OE-05, OE-07, OE-09): status in one tap, dates, research, analysis and sources, what was captured, notes and history. */
export default async function OpportunityDetail({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const [{ data: o }, { data: history }, { data: photos }, { data: jobRows }, { data: findingRows }, { data: analysisRow }] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle(),
    supabase.from("status_history").select("id,from_status,to_status,changed_at").eq("opportunity_id", id).order("changed_at", { ascending: false }).limit(50),
    supabase.from("opportunity_photos").select("id,storage_path").eq("opportunity_id", id),
    supabase.from("research_jobs").select("step,status,attempts,error,result,finished_at").eq("opportunity_id", id),
    supabase.from("research_findings")
      .select("id,kind,finding,source_url,verification,confidence,checked_at,origin,data")
      .eq("opportunity_id", id).order("checked_at").limit(80),
    supabase.from("analyses").select("version,created_at,insights,dimensions,service_slug,extra_pages,template")
      .eq("opportunity_id", id).order("version", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!o) notFound();
  const analysis = analysisRow as AnalysisRow | null;
  const { data: serviceRows } = analysis
    ? await supabase.from("services").select(SERVICE_COLUMNS).order("sort_order")
    : { data: null };
  const services = (serviceRows ?? []) as Service[];
  const jobs = ((jobRows ?? []) as Job[]).map(slimJob).sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  const paused = o.status === "researching" && isPaused(jobs);

  type RawFinding = Omit<FindingRow, "source" | "why"> & { data: Record<string, unknown> | null };
  const raw = (findingRows ?? []) as RawFinding[];
  const findings: FindingRow[] = raw.map(({ data, ...f }) => ({
    ...f,
    source: typeof data?.source === "string" ? data.source : null,
    why: typeof data?.why === "string" ? data.why : null,
  }));
  const assessment = raw.length ? assess({ identityConfirmed: o.identity_confirmed, findings: raw as FindingLite[] }) : null;
  const KIND_LABEL: Record<string, string> = {
    website: "website", google: "Google profile", instagram: "Instagram", facebook: "Facebook", store: "online store",
    contact: "contact details", review: "reviews", catalog: "catalog", competitor: "competitors", context: "local context", photo: "your photo", note: "your source",
  };
  const sourceLabel = Object.fromEntries(raw.map((f) => [f.id, KIND_LABEL[f.kind] ?? f.kind]));
  const level = (o.confidence ?? assessment?.level ?? null) as "high" | "medium" | "low" | null;
  const short = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));
  const candidates: Candidate[] = o.status !== "needs_verification" ? [] : raw
    .filter((f) => f.kind === "google" && f.origin === "auto" && typeof f.data?.candidate === "number" && f.verification !== "rejected")
    .map((f) => {
      const p = f.data!.place as { name: string; address: string | null; type: string | null; rating: number | null; reviews: number | null; phone: string | null; nameMatch?: boolean; cityMatch?: boolean };
      return {
        index: f.data!.candidate as number,
        plausible: !!p.nameMatch && !!p.cityMatch,
        // Google sometimes repeats the name at the start of the address: show the street part.
        name: [p.name, p.address?.split(",").map((s) => s.trim()).find((s) => /\d/.test(s))].filter(Boolean).join(" · "),
        detail: ["Google profile", p.type, p.rating != null ? `${p.rating.toFixed(1)} (${p.reviews ?? 0} reviews)` : null, p.phone].filter(Boolean).join(" · "),
        url: f.source_url,
        checked: short(f.checked_at),
      };
    })
    .sort((a, b) => a.index - b.index);

  const signed = photos?.length
    ? (await supabase.storage.from("opportunity-photos").createSignedUrls(photos.map((p) => p.storage_path), 3600)).data ?? []
    : [];

  const facts: [string, React.ReactNode][] = [];
  if (o.found_via) facts.push(["How", o.found_via === "in_person" ? "Met in person" : "Found online"]);
  if (o.found_at) facts.push(["Where", o.found_at]);
  if (o.contact_name) facts.push(["Contact", o.contact_name]);
  if (o.category) facts.push(["Category", o.category]);
  if (o.website) facts.push(["Website", <a key="w" className="dx-link" href={o.website} target="_blank" rel="noopener noreferrer">{o.website.replace(/^https?:\/\//, "")}</a>]);
  if (o.instagram) facts.push(["Instagram", <a key="i" className="dx-link" href={`https://instagram.com/${o.instagram}`} target="_blank" rel="noopener noreferrer">@{o.instagram}</a>]);

  return (
    <main className="dx-app">
      <header className="dx-top">
        <a className="dx-back" href="/discover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Back
        </a>
        <NetDot />
      </header>

      <section className="dx-opp-head">
        <span className={`dx-chip s-${paused ? "paused" : o.status}`}>{paused ? "Paused" : STATUS_LABEL[o.status as Status]}</span>
        <h1>{o.name}</h1>
        <p>{o.city}</p>
        {level && <span className={`dx-conf c-${level}`}><i aria-hidden="true" />{level} confidence</span>}
        {assessment && assessment.reasons.length > 0 && level !== "high" && o.status !== "needs_verification" && (
          <p className="dx-why">Why {level}: {assessment.reasons.join("; ")}.</p>
        )}
      </section>

      {o.status === "needs_verification" && (
        <VerifyIdentity id={o.id} candidates={candidates} reasons={assessment?.reasons ?? []} />
      )}

      <dl className="dx-dates">
        <div><dt className="mono">Captured</dt><dd>{fmt(o.captured_at)}</dd></div>
        <div><dt className="mono">Contacted</dt><dd>{o.contacted_at ? fmt(o.contacted_at) : "Not yet"}</dd></div>
      </dl>

      <ResearchProgress id={o.id} initial={jobs} hasPhoto={(photos?.length ?? 0) > 0} />

      {analysis && <Analysis id={o.id} analysis={analysis} services={services} sourceLabel={sourceLabel} />}
      {!analysis && jobs.length > 0 && !isActive(jobs) && !paused && level !== "low" && (
        <section className="dx-group" aria-labelledby="h-noticed">
          <h2 id="h-noticed" className="dx-h2">What we noticed</h2>
          <div className="dx-card dx-stack">
            <p className="dx-why">No analysis yet for this opportunity.</p>
            <div><Regenerate id={o.id} label="Run the analysis" /></div>
          </div>
        </section>
      )}

      <Sources id={o.id} findings={findings} />

      <StatusPicker id={o.id} status={o.status as Status} />

      {(facts.length > 0 || o.observation || signed.length > 0) && (
        <section className="dx-group" aria-labelledby="h-captured">
          <h2 id="h-captured" className="dx-h2">What you captured</h2>
          <div className="dx-card dx-stack">
            {facts.length > 0 && (
              <dl className="dx-facts">
                {facts.map(([k, v]) => (
                  <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
            {o.observation && <p className="dx-obs">{o.observation}</p>}
            {signed.length > 0 && (
              <div className="dx-photos">
                {signed.map((s, i) => s.signedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={i} href={s.signedUrl} target="_blank" rel="noopener noreferrer"><img src={s.signedUrl} alt={`Photo captured for ${o.name}`} /></a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Notes id={o.id} initial={o.notes ?? ""} />

      <section className="dx-group" aria-labelledby="h-history">
        <h2 id="h-history" className="dx-h2">History</h2>
        <ol className="dx-history">
          {(history ?? []).map((h) => (
            <li key={h.id}>
              <span className={`dx-dot s-${h.to_status}`} aria-hidden="true" />
              <span>
                <b>{STATUS_LABEL[h.to_status as Status]}</b>
                <span className="mono">{fmt(h.changed_at, true)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <DeleteOpportunity id={o.id} name={o.name} />
    </main>
  );
}
