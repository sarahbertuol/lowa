/**
 * The page a revoked or expired proposal link shows, with status 410 (OE-13). Plain HTML so the
 * middleware can answer before any page code runs. No dependencies.
 */
export function goneHtml(why: "revoked" | "expired", email: string) {
  const line = why === "expired"
    ? "This proposal has expired. Write to us and we'll send you a fresh one."
    : "This proposal is no longer available. Write to us if you'd like to talk.";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Proposal unavailable · LoWa Studio</title>
<style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#F7F0E6;color:#3A1E12;font:18px/1.6 system-ui,sans-serif;padding:24px}
main{max-width:520px}b{font:400 32px/1 Georgia,serif;display:block;margin-bottom:20px}a{color:#2F6F86;display:inline-flex;align-items:center;min-height:44px}</style></head>
<body><main><b>LoWa Studio</b><p>${line}</p><p><a href="mailto:${email}">${email}</a></p></main></body></html>`;
}
