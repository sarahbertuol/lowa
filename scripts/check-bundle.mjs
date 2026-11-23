// npm run test:bundle (after npm run build)
// OE-16: nothing secret in what the browser downloads (.next/static). Looks for secret variable
// names, key formats (Anthropic, Google) and Supabase keys with the service role. Prints only the
// file and what kind of thing it found, never the value itself.
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), ".next", "static");
if (!fs.existsSync(root)) {
  console.error("No .next/static: run npm run build first.");
  process.exit(2);
}

const NAMES = ["SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "GOOGLE_PLACES_API_KEY", "AI_MODEL", "PUBLIC_BASE_URL"];
const FORMATS = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["Google key", /AIza[0-9A-Za-z_-]{35}/],
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{10,}/],
];
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|css|json|txt|map)$/.test(e.name)) files.push(p);
  }
})(root);

let problems = 0;
let anonKeys = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const rel = path.relative(process.cwd(), f);
  for (const n of NAMES) if (text.includes(n)) { console.log(`FAIL ${rel}: mentions ${n}`); problems++; }
  for (const [label, re] of FORMATS) if (re.test(text)) { console.log(`FAIL ${rel}: looks like a ${label}`); problems++; }
  for (const m of text.matchAll(JWT)) {
    let role = "unknown";
    try { role = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")).role ?? "unknown"; } catch { /* not a JWT */ }
    if (role === "anon") anonKeys++;
    else { console.log(`FAIL ${rel}: token with role "${role}"`); problems++; }
  }
}

console.log(`${files.length} files checked. Public (anon) Supabase key found ${anonKeys} time(s): expected, it is protected by RLS.`);
console.log(problems ? `\n${problems} PROBLEM(S)` : "\nNO SECRETS IN THE BROWSER BUNDLE");
process.exit(problems ? 1 : 0);
