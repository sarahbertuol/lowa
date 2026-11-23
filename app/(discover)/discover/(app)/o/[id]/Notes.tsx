"use client";

import { useState, useTransition } from "react";
import { saveNotes } from "./actions";

/** Private notes for the team (never shown in a proposal). */
export default function Notes({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = value !== saved;

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveNotes(id, value).catch(() => ({ ok: false as const, error: "No connection. Try again when you're online." }));
      if (res.ok) { setSaved(value); setMsg({ ok: true, text: "Saved" }); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <section className="dx-group" aria-labelledby="h-notes">
      <h2 id="h-notes" className="dx-h2">Notes</h2>
      <label className="sr" htmlFor="notes">Notes, only for the team</label>
      <textarea
        id="notes" className="dx-input dx-textarea" maxLength={4000} value={value}
        placeholder="Only for you and Marco. Never shown in a proposal."
        onChange={(e) => { setValue(e.target.value); setMsg(null); }}
      />
      <div className="dx-row">
        <button type="button" className="dx-btn small" onClick={save} disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save notes"}
        </button>
        {msg && <span className={msg.ok ? "dx-hint" : "dx-field-err"} role="status">{msg.text}</span>}
      </div>
    </section>
  );
}
