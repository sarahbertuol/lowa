/**
 * Sends a /contact form to /api/contato (email via Resend).
 * If sending fails (API down, or no answer in 20 s), opens WhatsApp with the same message,
 * so the lead is never lost. Returns "email" or "whatsapp".
 */
const WHATSAPP = "5554981490779";

export type Pairs = [label: string, value: string][];

export async function sendForm(kind: "agency" | "direct", form: HTMLFormElement, pairs: Pairs) {
  const fields = pairs.map(([l, v]) => [l, v.trim()] as [string, string]).filter(([, v]) => v);
  const honeypot = (form.elements.namedItem("contato_alt") as HTMLInputElement | null)?.value ?? "";

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, fields, site: honeypot }),
      signal: ctrl.signal,
    });
    if (res.ok) return "email" as const;
  } catch {
    // network error or timeout: fall through to WhatsApp
  } finally {
    window.clearTimeout(timer);
  }

  const intro = kind === "agency" ? "Hi LoWa Studio! Agency briefing:" : "Hi LoWa Studio! I would like a website:";
  const text = [intro, "", ...fields.map(([l, v]) => `${l}: ${v}`)].join("\n");
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  // After an await, popup blockers may refuse a new tab: then go there in this tab.
  const w = window.open(url, "_blank");
  if (w) w.opener = null;
  else window.location.href = url;
  return "whatsapp" as const;
}

/** Hidden field that only bots fill in. */
export const honeypotProps = {
  name: "contato_alt",
  tabIndex: -1,
  autoComplete: "off",
  "aria-hidden": true,
  style: { position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 },
} as const;
