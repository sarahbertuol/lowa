"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIND_LABEL, KINDS, dmFollowUp, fill, messageIssues, splitEmail, unfill, type Kind } from "@/lib/engine/messages";
import { addEmail, generateMessages, markContacted, markCopied, saveMessage } from "./message-actions";

/**
 * Outreach (OE-15, Oportunidade.html Review): three messages, edit, copy, share, WhatsApp and
 * email shortcuts. Nothing is sent by the app: the founder copies or shares it herself.
 */

export type MessageRow = { kind: Kind; body: string; edited: boolean; copied_at: string | null };

export default function Outreach({ id, messages, url, metInPerson, email, contacted, hasDraft }: {
  id: string; messages: MessageRow[]; url: string | null; metInPerson: boolean; email: string | null; contacted: boolean; hasDraft: boolean;
}) {
  const [tab, setTab] = useState<Kind>(metInPerson ? "personal" : "instagram_dm");
  const [err, setErr] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const router = useRouter();

  if (!messages.length) {
    return (
      <Shell>
        <p className="dx-why">{hasDraft ? "No messages yet for this draft." : "The messages are written with the proposal draft."}</p>
        {hasDraft && (
          <div><button type="button" className="dx-btn small" disabled={busy} onClick={() => start(async () => {
            const r = await generateMessages(id);
            if (r.ok) router.refresh(); else setErr(r.error);
          })}>{busy ? "Writing…" : "Write the messages"}</button></div>
        )}
        {err && <p className="dx-field-err" role="alert">{err}</p>}
      </Shell>
    );
  }

  const row = messages.find((m) => m.kind === tab);
  return (
    <Shell>
      <div className="dx-pills" role="group" aria-label="Message type">
        {KINDS.map((k) => (
          <button key={k} type="button" className="dx-pill" aria-pressed={tab === k} onClick={() => setTab(k)}>{KIND_LABEL[k]}</button>
        ))}
      </div>
      {tab === "personal" && !metInPerson ? (
        <p className="dx-empty">Only for businesses you met in person. This one was found online: use the Instagram DM or the email.</p>
      ) : tab === "email" && !email ? (
        <AddEmail id={id} />
      ) : row ? (
        <Message key={tab} id={id} row={row} url={url} email={email} contacted={contacted} />
      ) : (
        <p className="dx-empty">No {KIND_LABEL[tab]} message yet. Regenerate the draft to write it.</p>
      )}
      <p className="mono dim">Nothing is sent automatically</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="dx-group" aria-labelledby="h-outreach">
      <h2 id="h-outreach" className="dx-h2">Outreach</h2>
      <div className="dx-card dx-stack dx-msg">{children}</div>
    </section>
  );
}

/** Copies with the Clipboard API, or by selecting the text where it isn't available. */
async function copyText(text: string, fallback: HTMLTextAreaElement | null) {
  try {
    // Some browsers leave the permission pending: give up after a moment and select instead.
    if (navigator.clipboard?.writeText) {
      const ok = await Promise.race([navigator.clipboard.writeText(text).then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 1500))]);
      if (ok) return true;
    }
  } catch { /* falls through */ }
  if (fallback) {
    fallback.focus();
    fallback.select();
    fallback.setSelectionRange(0, fallback.value.length);
    try { if (document.execCommand("copy")) return true; } catch { /* manual copy */ }
  }
  return false;
}

function Message({ id, row, url, email, contacted }: { id: string; row: MessageRow; url: string | null; email: string | null; contacted: boolean }) {
  const isEmail = row.kind === "email";
  const parts = isEmail ? splitEmail(row.body) : { subject: "", text: row.body };
  const [subject, setSubject] = useState(fill(parts.subject, url));
  const [text, setText] = useState(fill(parts.text, url));
  const [follow, setFollow] = useState(dmFollowUp(url));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [askContacted, setAskContacted] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [busy, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const followRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  // A new draft rewrites the message: show it, unless it is what was just saved here.
  const seen = useRef(row.body);
  useEffect(() => {
    if (row.body === seen.current) return;
    seen.current = row.body;
    const p = isEmail ? splitEmail(row.body) : { subject: "", text: row.body };
    setSubject(fill(p.subject, url));
    setText(fill(p.text, url));
  }, [row.body, isEmail, url]);
  // Published or unpublished meanwhile: swap the link, keep the edits.
  const lastUrl = useRef(url);
  useEffect(() => {
    if (url === lastUrl.current) return;
    const prev = lastUrl.current;
    lastUrl.current = url;
    setSubject((t) => fill(unfill(t, prev), url));
    setText((t) => fill(unfill(t, prev), url));
    setFollow(dmFollowUp(url));
  }, [url]);

  const stored = isEmail ? `Subject: ${unfill(subject, url)}\n\n${unfill(text, url)}` : unfill(text, url);
  const dirty = stored !== row.body;
  const issues = messageIssues(row.kind, `${subject}\n${text}`, !!url);
  const linkMissing = row.kind !== "instagram_dm" && (!url || issues.some((i) => i.includes("link")));
  const full = isEmail ? `${subject}\n\n${text}` : text;

  function save() {
    start(async () => {
      seen.current = stored;
      const r = await saveMessage(id, row.kind, stored);
      setNote(r.ok ? { ok: true, text: "Saved. It stays when the draft is written again." } : { ok: false, text: r.error });
    });
  }
  async function done(what: string, k = row.kind) {
    setNote({ ok: true, text: what });
    if (!contacted) setAskContacted(true);
    await markCopied(id, k);
  }
  async function copy(value: string, el: HTMLTextAreaElement | null) {
    const ok = await copyText(value, el);
    if (ok) await done("Copied.");
    else setNote({ ok: false, text: "Your browser didn't allow copying. The text is selected: copy it from the menu." });
  }
  async function share() {
    try {
      await navigator.share(isEmail ? { title: subject, text } : { text: full });
      await done("Shared.");
    } catch { /* cancelled */ }
  }

  return (
    <div className="dx-stack">
      {isEmail && (
        <>
          <p className="mono dim">To {email}</p>
          <div className="dx-field">
            <label htmlFor={`subj-${id}`}>Subject</label>
            <input id={`subj-${id}`} className="dx-input" value={subject} onChange={(e) => { setSubject(e.target.value); setNote(null); }} />
          </div>
        </>
      )}
      <div className="dx-field">
        <label htmlFor={`msg-${row.kind}-${id}`}>{row.kind === "instagram_dm" ? "First DM (asks before sending the link)" : `${KIND_LABEL[row.kind]} message`}</label>
        <textarea ref={ref} id={`msg-${row.kind}-${id}`} className="dx-input dx-msg-text" value={text} onChange={(e) => { setText(e.target.value); setNote(null); }} />
      </div>
      {issues.length > 0 && <ul className="dx-msg-issues">{issues.map((i) => <li key={i}>{i}</li>)}</ul>}
      {dirty && <div><button type="button" className="dx-btn ghost small" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>}

      <div className="dx-row-btns">
        <button type="button" className="dx-btn small" onClick={() => copy(full, ref.current)} disabled={linkMissing}>Copy</button>
        {canShare && <button type="button" className="dx-btn ghost small" onClick={share} disabled={linkMissing}>Share</button>}
        {!isEmail && (
          <a className={`dx-btn ghost small${linkMissing ? " off" : ""}`} aria-disabled={linkMissing} href={linkMissing ? undefined : `https://wa.me/?text=${encodeURIComponent(full)}`}
            target="_blank" rel="noopener noreferrer" onClick={() => !linkMissing && done("Opened in WhatsApp.")}>WhatsApp</a>
        )}
        {isEmail && email && (
          <a className={`dx-btn ghost small${linkMissing ? " off" : ""}`} aria-disabled={linkMissing}
            href={linkMissing ? undefined : `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
            onClick={() => !linkMissing && done("Opened in your email app.")}>Open in email</a>
        )}
      </div>

      {row.kind === "instagram_dm" && (
        <div className="dx-field">
          <label htmlFor={`follow-${id}`}>After they say yes</label>
          <textarea ref={followRef} id={`follow-${id}`} className="dx-input" rows={3} value={follow} onChange={(e) => setFollow(e.target.value)} />
          <div className="dx-row-btns">
            <button type="button" className="dx-btn ghost small" disabled={!url} onClick={() => copy(follow, followRef.current)}>Copy follow-up</button>
          </div>
          {!url && <p className="dx-why">Publish the proposal to add its link here.</p>}
        </div>
      )}

      {note && <p className={note.ok ? "dx-saved" : "dx-field-err"} role={note.ok ? "status" : "alert"}>{note.text}</p>}
      {askContacted && (
        <div className="dx-confirm">
          <p>Did you send it? Mark this business as <b>Contacted</b> with today&apos;s date.</p>
          <div className="dx-row-btns">
            <button type="button" className="dx-btn small" disabled={busy} onClick={() => start(async () => {
              const r = await markContacted(id);
              if (r.ok) { setAskContacted(false); router.refresh(); } else setNote({ ok: false, text: r.error });
            })}>Mark as contacted</button>
            <button type="button" className="dx-btn ghost small" onClick={() => setAskContacted(false)}>Not yet</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddEmail({ id }: { id: string }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const router = useRouter();
  return (
    <form className="dx-stack" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await addEmail(id, value);
        if (r.ok) router.refresh(); else setErr(r.error);
      });
    }}>
      <p className="dx-empty">No business email we can trust yet. Add one you got from them (a card, a conversation) to use this message.</p>
      <div className="dx-field">
        <label htmlFor={`em-${id}`}>Business email</label>
        <input id={`em-${id}`} className="dx-input" type="email" inputMode="email" autoComplete="off" placeholder="name@business.com"
          value={value} onChange={(e) => { setValue(e.target.value); setErr(null); }} aria-invalid={!!err} />
      </div>
      {err && <p className="dx-field-err" role="alert">{err}</p>}
      <div><button type="submit" className="dx-btn small" disabled={busy || !value}>{busy ? "Saving…" : "Use this email"}</button></div>
    </form>
  );
}
