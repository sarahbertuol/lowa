import { redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";

/**
 * Temporary home until OE-03/OE-05 (dashboard). Shows who is signed in and checks, through
 * row level security, that this account really reaches the team data.
 */
export default async function DiscoverHome() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const [team, services] = await Promise.all([
    supabase.from("team_members").select("email", { count: "exact", head: true }),
    supabase.from("services").select("slug", { count: "exact", head: true }).eq("active", true),
  ]);
  const hasAccess = !team.error && (team.count ?? 0) > 0;

  return (
    <main className="dx-app">
      <header className="dx-top">
        <span className="dx-brand">LoWa<small>Discover</small></span>
        <form action="/discover/auth/signout" method="post">
          <button className="dx-btn small ghost" type="submit">Sign out</button>
        </form>
      </header>
      <section className="dx-card" style={{ display: "grid", gap: 12, marginTop: 8 }}>
        <p className="mono">Signed in</p>
        <h1 style={{ fontSize: "clamp(30px,8vw,44px)", lineHeight: 1.05 }}>Hi, <em>you&apos;re in.</em></h1>
        <p>{user.email}</p>
        <p className={hasAccess ? "dx-note" : "dx-error"} role="status">
          {hasAccess
            ? `Team access verified · ${services.count ?? 0} active services in the catalog`
            : "This account can't read team data. Check the team_members table in Supabase."}
        </p>
        <p className="mono">The dashboard arrives in the next tasks</p>
      </section>
    </main>
  );
}
