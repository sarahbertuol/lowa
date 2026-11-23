"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishProposal, unpublishProposal } from "./proposal-actions";

/**
 * Public link (OE-13). Publishing asks for a second tap: that tap is the founder's approval.
 * The full review screen (template, previews of the messages) comes in OE-14.
 */

export type LiveLink = { token: string; publishedAt: string; expiresAt: string; version: number | null };

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(iso));

export default function PublishBox({ id, version, live, blocked, pending: waiting }: {
  id: string; version: number; live: LiveLink | null; blocked: string | null; pending: string[];
}) {
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [busy, start] = useTransition();
  const router = useRouter();
  useEffect(() => setOrigin(window.location.origin), []);

  const url = live ? `${origin}/opportunity/${live.token}` : "";
  const outdated = live && live.version !== null && live.version !== version;

  function publish() {
    start(async () => {
      const r = await publishProposal(id, version);
      if (r.ok) { setConfirm(false); setErr(null); router.refresh(); } else setErr(r.error);
    });
  }
  function unpublish() {
    start(async () => {
      const r = await unpublishProposal(id);
      if (r.ok) { setErr(null); router.refresh(); } else setErr(r.error);
    });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2400); } catch { setErr("Couldn't copy. Select the link and copy it."); }
  }

  return (
    <section className="dx-group" aria-labelledby="h-public">
      <h2 id="h-public" className="dx-h2">Public link</h2>
      <div className="dx-card dx-stack">
        {live ? (
          <>
            <p className="mono dim">Published {day(live.publishedAt)}{live.version ? ` · v${live.version}` : ""} · works until {day(live.expiresAt)}</p>
            <a className="dx-link dx-pub-url" href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^https?:\/\//, "")}</a>
            {outdated && <p className="dx-why">The link shows v{live.version}. Publish again to show v{version}; the link stays the same.</p>}
            <div className="dx-row-btns">
              <button type="button" className="dx-btn small" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
              {outdated && <button type="button" className="dx-btn ghost small" onClick={() => setConfirm(true)} disabled={busy || !!blocked}>Publish v{version}</button>}
              <button type="button" className="dx-btn ghost small" onClick={unpublish} disabled={busy}>Unpublish</button>
            </div>
          </>
        ) : (
          <>
            <p className="dx-why">Nobody can see this proposal until you publish it. Publishing makes v{version} public to anyone with the link, for 60 days.</p>
            {!confirm && <div><button type="button" className="dx-btn small" onClick={() => setConfirm(true)} disabled={busy || !!blocked}>Publish…</button></div>}
          </>
        )}
        {blocked && <p className="dx-field-err">{blocked}</p>}
        {confirm && !blocked && (
          <div className="dx-confirm" role="group" aria-label="Confirm publishing">
            <p><b>Publish v{version}?</b> Anyone with the link will see it. Nothing is sent: you share the link yourself.</p>
            {waiting.length > 0 && <p className="dx-why">Still pending and shown as pending: {waiting.join(", ")}.</p>}
            <div className="dx-row-btns">
              <button type="button" className="dx-btn small" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Yes, publish"}</button>
              <button type="button" className="dx-btn ghost small" onClick={() => setConfirm(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}
        {err && <p className="dx-field-err" role="alert">{err}</p>}
      </div>
    </section>
  );
}
