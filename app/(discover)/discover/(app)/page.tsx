import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { NetDot } from "@/components/discover/Network";
import SignOut from "@/components/discover/SignOut";
import QueuedList from "@/components/discover/QueuedList";
import SavedToast from "@/components/discover/SavedToast";

/**
 * Home of LoWa Discover. OE-04: big "New" button, captures waiting on the phone and the latest
 * saved ones. The full dashboard (groups, filters, detail) arrives in OE-05.
 */
type Props = { searchParams: Promise<{ view?: string }> };

const VIEWS: Record<string, string> = {
  all: "All opportunities, with a status filter, arrive in OE-05.",
  ready: "Proposals ready to share arrive in OE-05.",
};

const STATUS_LABEL: Record<string, string> = {
  captured: "Captured",
  researching: "Researching",
  needs_verification: "Verify",
  draft_ready: "Draft ready",
  published: "Published",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-up",
  won: "Won",
  lost: "Lost",
};

type Row = { id: string; name: string; city: string; status: string; captured_at: string };

export default async function DiscoverHome({ searchParams }: Props) {
  const { view } = await searchParams;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const { data: recent, error } = await supabase
    .from("opportunities")
    .select("id,name,city,status,captured_at")
    .order("captured_at", { ascending: false })
    .limit(20);

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date());
  const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));

  return (
    <main className="dx-app">
      <header className="dx-top">
        <a className="dx-brand" href="/discover">LoWa<small>Discover</small></a>
        <NetDot />
      </header>

      {view && VIEWS[view] ? (
        <section className="dx-card dx-stack">
          <p className="mono">{view === "all" ? "All" : "Ready to share"}</p>
          <p>{VIEWS[view]}</p>
        </section>
      ) : (
        <>
          <section className="dx-hello">
            <p className="mono">{today}</p>
            <h1>Who did you <em>meet</em> today?</h1>
          </section>
          <a className="dx-big-new" href="/discover/new">
            <span>
              <b>New opportunity</b>
              <small>Name and city are enough</small>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </a>

          <QueuedList />

          <section className="dx-group" aria-labelledby="dx-recent">
            <h2 id="dx-recent" className="mono">Recent</h2>
            {error ? (
              <p className="dx-error" role="alert">Couldn&apos;t load your opportunities. Try again in a moment.</p>
            ) : !recent?.length ? (
              <p className="dx-empty">Nothing captured yet. Tap New when you meet a business.</p>
            ) : (
              <ul className="dx-list">
                {(recent as Row[]).map((o) => (
                  <li key={o.id} className="dx-item">
                    <span className="dx-thumb" aria-hidden="true">{o.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="dx-item-txt">
                      <b>{o.name}</b>
                      <span>{o.city} · {day(o.captured_at)}</span>
                    </span>
                    <span className={`dx-chip s-${o.status}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dx-account">
            <span className="mono">Signed in as {user.email}</span>
            <SignOut />
          </section>
        </>
      )}
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
    </main>
  );
}
