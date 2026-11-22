// Applies supabase/migrations/*.sql to the Supabase database, in order, once each.
// Usage: npm run db:migrate            (reads POSTGRES_URL_NON_POOLING from .env.local)
//        npm run db:migrate -- --dry   (lists what would run)
// Tracks versions in supabase_migrations.schema_migrations, the same table the Supabase CLI uses.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }),
  );
}
const env = { ...readEnv(path.join(root, ".env.local")), ...process.env };
const url = env.POSTGRES_URL_NON_POOLING;
if (!url || url.includes("[SENSITIVE]")) {
  console.error("POSTGRES_URL_NON_POOLING is missing or hidden. Run: vercel env pull .env.local --environment=development");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(`create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)`);
const done = new Set((await client.query("select version from supabase_migrations.schema_migrations")).rows.map((r) => r.version));

const dir = path.join(root, "supabase", "migrations");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
  if (done.has(version)) { console.log(`skip  ${file} (already applied)`); continue; }
  if (dry) { console.log(`would apply ${file}`); continue; }
  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)", [version, rest.join("_"), [sql]]);
    await client.query("commit");
    console.log(`apply ${file}`);
  } catch (e) {
    await client.query("rollback");
    console.error(`FAILED ${file}: ${e.message}`);
    await client.end();
    process.exit(1);
  }
}
await client.end();
