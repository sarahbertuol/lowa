import { redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { NetDot } from "@/components/discover/Network";
import SignOut from "@/components/discover/SignOut";

/**
 * Home of LoWa Discover. Until OE-05 (dashboard) it shows who is signed in and checks,
 * through row level security, that this account really reaches the team data.
 */
type Props = { searchParams: Promise<{ view?: string }> };

const VIEWS: Record<string, string> = {
  all: "All opportunities, with a status filter, arrive in OE-05.",
  ready: "Proposals ready to share arrive in OE-05.",
};

export default async function DiscoverHome({ searchParams }: Props) {
  const { view } = await searchParams;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const [team, services] = await Promise.all([
    supabase.from("team_members").select("email", { count: "exact", head: true }),
    supabase.from("services").select("slug", { count: "exact", head: true }).eq("active", true),
  ]);
  const hasAccess = !team.error && (team.count ?? 0) > 0;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(new Date());

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
          <section className="dx-card dx-stack" style={{ marginTop: 16 }}>
            <p className="mono">Signed in</p>
            <p>{user.email}</p>
            <p className={hasAccess ? "dx-note" : "dx-error"} role="status">
              {hasAccess
                ? `Team access verified · ${services.count ?? 0} active services in the catalog`
                : "This account can't read team data. Check the team_members table in Supabase."}
            </p>
            <div className="dx-row">
              <SignOut />
              <span className="mono">The dashboard arrives in OE-05</span>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
