import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { FILTERS, FOLLOWING, PROCESSING, READY } from "@/lib/engine/status";
import { NetDot } from "@/components/discover/Network";
import SignOut from "@/components/discover/SignOut";
import QueuedList from "@/components/discover/QueuedList";
import SavedToast from "@/components/discover/SavedToast";
import OppList, { type OppRow } from "@/components/discover/OppList";

/**
 * Home of LoWa Discover (docs/referencia/Discover.html, OE-05).
 * Home: New, counts, Processing, Ready to share, Recent. ?view=all: every opportunity with a
 * status filter (?status=). ?view=ready: only what is ready to share.
 */
type Props = { searchParams: Promise<{ view?: string; status?: string }> };

const LIMIT = 300;

export default async function DiscoverHome({ searchParams }: Props) {
  const { view, status } = await searchParams;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const { data, error, count } = await supabase
    .from("opportunities")
    .select("id,name,city,status,captured_at,contacted_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(LIMIT);
  const rows = (data ?? []) as OppRow[];

  const processing = rows.filter((r) => PROCESSING.includes(r.status));
  const ready = rows.filter((r) => READY.includes(r.status));
  const following = rows.filter((r) => FOLLOWING.includes(r.status));

  const header = (
    <header className="dx-top">
      <a className="dx-brand" href="/discover">LoWa<small>Discover</small></a>
      <NetDot />
    </header>
  );
  const loadError = error ? (
    <p className="dx-error" role="alert">Couldn&apos;t load your opportunities. Try again in a moment.</p>
  ) : null;

  if (view === "all") {
    const filter = FILTERS.find((f) => f.key === status) ?? FILTERS[0];
    const list = filter.statuses ? rows.filter((r) => filter.statuses!.includes(r.status)) : rows;
    return (
      <main className="dx-app">
        {header}
        <h1 className="dx-title">All <em>opportunities</em></h1>
        <nav className="dx-filter" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const n = f.statuses ? rows.filter((r) => f.statuses!.includes(r.status)).length : rows.length;
            return (
              <Link
                key={f.key}
                className="dx-pill"
                href={f.key === "all" ? "/discover?view=all" : `/discover?view=all&status=${f.key}`}
                aria-current={f.key === filter.key ? "page" : undefined}
                replace
                scroll={false}
              >
                {f.label} <span className="dx-count">{n}</span>
              </Link>
            );
          })}
        </nav>
        <QueuedList />
        <section className="dx-group" aria-label={`${filter.label} opportunities`}>
          {loadError ?? (list.length ? <OppList rows={list} /> : <p className="dx-empty">Nothing here yet.</p>)}
          {(count ?? 0) > LIMIT && <p className="mono">Showing the latest {LIMIT} of {count}</p>}
        </section>
      </main>
    );
  }

  if (view === "ready") {
    return (
      <main className="dx-app">
        {header}
        <h1 className="dx-title">Ready to <em>share</em></h1>
        <section className="dx-group" aria-label="Ready to share">
          {loadError ?? (ready.length ? <OppList rows={ready} /> : (
            <p className="dx-empty">No proposals ready yet. They appear here once research and the draft are done.</p>
          ))}
        </section>
      </main>
    );
  }

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date());

  return (
    <main className="dx-app">
      {header}
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

      {!error && (
        <nav className="dx-counts" aria-label="Summary">
          <a href="#processing"><b>{processing.length}</b><span>Processing</span></a>
          <Link href="/discover?view=ready"><b>{ready.length}</b><span>Ready to share</span></Link>
          <Link href="/discover?view=all"><b>{count ?? rows.length}</b><span>All time</span></Link>
        </nav>
      )}

      <QueuedList />
      {loadError}

      {!error && rows.length === 0 && (
        <p className="dx-empty" style={{ marginTop: 24 }}>Nothing captured yet. Tap New when you meet a business.</p>
      )}

      {processing.length > 0 && (
        <section className="dx-group" id="processing" aria-labelledby="h-proc">
          <h2 id="h-proc" className="dx-h2">Processing</h2>
          <OppList rows={processing.slice(0, 10)} />
          {processing.length > 10 && <Link className="dx-link" href="/discover?view=all&status=processing">See all {processing.length}</Link>}
        </section>
      )}

      {ready.length > 0 && (
        <section className="dx-group" aria-labelledby="h-ready">
          <h2 id="h-ready" className="dx-h2">Ready to share</h2>
          <OppList rows={ready.slice(0, 10)} />
          {ready.length > 10 && <Link className="dx-link" href="/discover?view=ready">See all {ready.length}</Link>}
        </section>
      )}

      {following.length > 0 && (
        <section className="dx-group" aria-labelledby="h-recent">
          <h2 id="h-recent" className="dx-h2">Recent</h2>
          <OppList rows={following.slice(0, 10)} />
          {following.length > 10 && <Link className="dx-link" href="/discover?view=all">See all</Link>}
        </section>
      )}

      <section className="dx-account">
        <span className="mono">Signed in as {user.email}</span>
        <SignOut />
      </section>
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
    </main>
  );
}
