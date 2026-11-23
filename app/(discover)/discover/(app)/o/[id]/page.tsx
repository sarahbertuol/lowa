import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { STATUS_LABEL, type Status } from "@/lib/engine/status";
import { NetDot } from "@/components/discover/Network";
import StatusPicker from "./StatusPicker";
import Notes from "./Notes";
import DeleteOpportunity from "./DeleteOpportunity";

export const metadata: Metadata = { title: "Opportunity" };

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmt = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/New_York",
  }).format(new Date(iso));

/** Opportunity detail (OE-05): status in one tap, dates, what was captured, notes and history. */
export default async function OpportunityDetail({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const [{ data: o }, { data: history }, { data: photos }] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle(),
    supabase.from("status_history").select("id,from_status,to_status,changed_at").eq("opportunity_id", id).order("changed_at", { ascending: false }).limit(50),
    supabase.from("opportunity_photos").select("id,storage_path").eq("opportunity_id", id),
  ]);
  if (!o) notFound();

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
        <span className={`dx-chip s-${o.status}`}>{STATUS_LABEL[o.status as Status]}</span>
        <h1>{o.name}</h1>
        <p>{o.city}</p>
      </section>

      <dl className="dx-dates">
        <div><dt className="mono">Captured</dt><dd>{fmt(o.captured_at)}</dd></div>
        <div><dt className="mono">Contacted</dt><dd>{o.contacted_at ? fmt(o.contacted_at) : "Not yet"}</dd></div>
      </dl>

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
