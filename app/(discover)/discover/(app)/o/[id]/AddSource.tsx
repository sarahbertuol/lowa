"use client";

import { useState, useTransition } from "react";
import { addSource, removeSource } from "./identity-actions";

/** Add a source by hand (OE-08): website, Instagram, Facebook or Google link. It counts as verified. */
export default function AddSource({ id }: { id: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!value.trim()) { setError("Paste a link or an @handle."); return; }
    start(async () => {
      const r = await addSource(id, value);
      if (r.ok) { setValue(""); setDone(true); } else setError(r.error);
    });
  }

  return (
    <form className="dx-add" onSubmit={submit}>
      <div className="dx-field">
        <label htmlFor="add-src">Add a source</label>
        <input
          id="add-src" className="dx-input" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false}
          placeholder="Website, Instagram or Google link" value={value} onChange={(e) => setValue(e.target.value)}
          aria-describedby={error ? "add-src-err" : done ? "add-src-ok" : undefined}
        />
      </div>
      <button type="submit" className="dx-btn small" disabled={pending}>{pending ? "Adding…" : "Add"}</button>
      {error && <p id="add-src-err" className="dx-field-err" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
      {done && <p id="add-src-ok" className="dx-why" role="status" style={{ gridColumn: "1 / -1" }}>Added. If it changes the website or Instagram, the research updates in a moment.</p>}
    </form>
  );
}

export function RemoveSource({ id, findingId }: { id: string; findingId: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="rm" disabled={pending} onClick={() => start(async () => { await removeSource(id, findingId); })}>
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
