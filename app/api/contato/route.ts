import { NextResponse } from "next/server";

// Receives the two forms on /contact (agency briefing and business owners) and the /business briefing pop-up,
// and sends them by email (Resend).
// Environment variables (Vercel, Production and Preview):
//   RESEND_API_KEY   required
//   PROPOSTA_TO      who receives (hello@lowa-studio.com)
//   PROPOSTA_CC      copy (optional; several separated by commas)
//   PROPOSTA_FROM    sender on a verified domain: "LoWa Studio <forms@lowa-studio.com>"

export const runtime = "nodejs";

const DEFAULT_TO = "hello@lowa-studio.com";
const DEFAULT_FROM = "LoWa Studio <onboarding@resend.dev>"; // only delivers to the Resend account owner; set PROPOSTA_FROM
const TITLES = {
  agency: "New agency briefing",
  direct: "New message from a business owner",
  briefing: "New website briefing",
} as const;
const LABEL_NAME = "Name";
const LABEL_EMAIL = "Email";
const LABEL_SUBJECT_EXTRA = { agency: "Agency", direct: "Business", briefing: "Business" } as const;

// Simple per-IP limit (per instance; stops bursts, not a firewall).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= 5) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return false;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const clean = (v: unknown, max: number) => String(v ?? "").replace(/\r/g, "").trim().slice(0, max);
const split = (v?: string) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
    if (limited(ip)) return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });

    const body = await req.json();

    // Honeypot: bots fill it, people do not. Answer "ok" without sending anything.
    if (body.site) return NextResponse.json({ ok: true });

    const kind: keyof typeof TITLES = body.kind === "direct" || body.kind === "briefing" ? body.kind : "agency";
    const fields: unknown[] = Array.isArray(body.fields) ? body.fields.slice(0, 40) : [];
    const rows = fields
      .map((f) => (Array.isArray(f) ? [clean(f[0], 80), clean(f[1], 3000)] : ["", ""]))
      .filter(([label, value]) => label && value);
    const get = (label: string) => rows.find(([l]) => l === label)?.[1] ?? "";

    const name = get(LABEL_NAME);
    const email = get(LABEL_EMAIL);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Incomplete data." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[form] RESEND_API_KEY is not set");
      return NextResponse.json({ ok: false, error: "Email sending unavailable." }, { status: 500 });
    }

    const title = TITLES[kind];
    const extra = get(LABEL_SUBJECT_EXTRA[kind]);
    const subject = `${title}: ${name}${extra ? ` (${extra})` : ""}`;
    const text = [title, "", ...rows.map(([l, v]) => `${l}: ${v}`)].join("\n");
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3A1E12;max-width:640px">
<h2 style="margin:0 0 16px;font-size:20px">${esc(title)}</h2>
<table style="border-collapse:collapse;width:100%">${rows
      .map(
        ([l, v]) =>
          `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;font-weight:700;white-space:nowrap;border-bottom:1px solid #E7D6C6">${esc(l)}</td><td style="padding:8px 0;vertical-align:top;border-bottom:1px solid #E7D6C6">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join("")}</table>
<p style="margin:20px 0 0;color:#7A5A4C;font-size:13px">Use "Reply" to answer: it goes straight to ${esc(email)}.</p>
</div>`;

    const cc = split(process.env.PROPOSTA_CC);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.PROPOSTA_FROM || DEFAULT_FROM,
        to: split(process.env.PROPOSTA_TO || DEFAULT_TO),
        ...(cc.length ? { cc } : {}),
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      console.error("[form] Resend", res.status, await res.text());
      return NextResponse.json({ ok: false, error: "Could not send the email." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[form]", err);
    return NextResponse.json({ ok: false, error: "Could not process the request." }, { status: 500 });
  }
}
