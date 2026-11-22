// npm run test:db
// Runs the Engine migrations on PGlite with a stub of Supabase's auth schema and roles,
// then checks RLS, triggers, constraints and the duplicate finder.
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = process.argv[2] ?? fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite({ extensions: { pg_trgm } });
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`);

for (const f of fs.readdirSync(dir).sort()) {
  if (f.includes("storage")) { console.log("skip " + f + " (storage schema exists only on Supabase)"); continue; }
  await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  console.log("applied " + f);
}

const SARAH = "11111111-1111-1111-1111-111111111111";
const STRANGER = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${SARAH}'), ('${STRANGER}');
  insert into team_members (email, name) values ('sarah@example.com', 'Sarah');`);

async function as(role, claims, fn) {
  await db.exec("begin");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims ?? {})]);
  await db.exec(`set local role ${role}`);
  try { return await fn(); } finally { await db.exec("rollback"); }
}
const team = { sub: SARAH, email: "Sarah@Example.com" };
const stranger = { sub: STRANGER, email: "someone@else.com" };

// Catalog seed
const svc = await db.query("select slug, price_type, price_cents, active from services order by sort_order");
ok(svc.rows.length === 7, "7 services seeded");
ok(svc.rows.find(r => r.slug === "small-website").price_cents === 92000, "small website = $920");
ok(svc.rows.find(r => r.slug === "landing-page").active === false, "landing page inactive until priced");

// anon: nothing readable
for (const t of ["services", "opportunities", "proposal_snapshots", "team_members"]) {
  const r = await as("anon", null, async () => { try { await db.query(`select * from ${t}`); return "read"; } catch (e) { return "denied"; } });
  ok(r === "denied", `anon cannot read ${t}`);
}
// signed in but not on the team: sees nothing, cannot insert
const strangerRows = await as("authenticated", stranger, () => db.query("select * from services"));
ok(strangerRows.rows.length === 0, "non-team user sees no services");
const strangerInsert = await as("authenticated", stranger, async () => {
  try { await db.query("insert into opportunities (name, city) values ('X', 'Y')"); return "inserted"; } catch { return "denied"; }
});
ok(strangerInsert === "denied", "non-team user cannot create opportunities");

// team member: full flow inside one transaction
await as("authenticated", team, async () => {
  ok((await db.query("select * from services")).rows.length === 7, "team sees the catalog (email match is case-insensitive)");
  const { rows: [o] } = await db.query("insert into opportunities (name, city, found_via) values ('Juniper & Clay', 'Asheville, NC', 'in_person') returning id, created_by, status");
  ok(o.created_by === SARAH && o.status === "captured", "created_by and default status set");
  await db.query("update opportunities set status = 'researching' where id = $1", [o.id]);
  await db.query("update opportunities set status = 'contacted' where id = $1", [o.id]);
  const h = await db.query("select from_status, to_status from status_history where opportunity_id = $1 order by id", [o.id]);
  ok(h.rows.map(r => r.to_status).join(",") === "captured,researching,contacted", "status history logged by trigger");
  const c = await db.query("select contacted_at from opportunities where id = $1", [o.id]);
  ok(c.rows[0].contacted_at !== null, "contacted_at stamped on first contact");
  const dup = await db.query("select name, score from similar_opportunities('juniper and clay', 'asheville, nc')");
  ok(dup.rows.length === 1, "duplicate finder flags similar name in same city");
  const other = await db.query("select * from similar_opportunities('juniper and clay', 'Charleston, SC')");
  ok(other.rows.length === 0, "duplicate finder ignores other cities");
  async function attempt(sql, params=[]) { await db.exec("savepoint t"); try { await db.query(sql, params); await db.exec("release savepoint t"); return "ok"; } catch (e) { await db.exec("rollback to savepoint t"); return "rejected"; } }
  ok(await attempt("insert into status_history (opportunity_id, to_status) values ($1, 'won')", [o.id]) === "rejected", "history cannot be written directly");
  ok(await attempt("insert into analyses (opportunity_id, version, dimensions, insights) values ($1, 1, '{}', '[1,2,3,4]')", [o.id]) === "rejected", "more than 3 insights rejected");
  ok(await attempt("insert into analyses (opportunity_id, version, dimensions, insights) values ($1, 1, '{}', '[1,2,3]')", [o.id]) === "ok", "3 insights accepted");
  const { rows: [p] } = await db.query("insert into proposals (opportunity_id, version, template, service_slug, content) values ($1, 1, 'missing_website', 'small-website', '{}') returning id", [o.id]);
  ok(await attempt("insert into proposal_snapshots (token, proposal_id, public_content) values ('short', $1, '{}')", [p.id]) === "rejected", "weak proposal token rejected");
  ok(await attempt("insert into proposal_snapshots (token, proposal_id, public_content) values ('k7Qm2xR9vT4nBw8LpZ3s1A', $1, '{}')", [p.id]) === "ok", "22-char token accepted");
  ok(await attempt("insert into proposals (opportunity_id, version, template, service_slug, content, status) values ($1, 2, 'growth', 'bigger-website', '{}', 'published')", [o.id]) === "rejected", "published proposal requires approval");
  ok(await attempt("update services set active = true where slug = 'landing-page'") === "rejected", "cannot activate a fixed-price service without a price");
  ok(await attempt("delete from team_members") === "ok" && (await db.query("select count(*)::int n from team_members")).rows[0].n === 1, "team list cannot be changed through the API");
});

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
