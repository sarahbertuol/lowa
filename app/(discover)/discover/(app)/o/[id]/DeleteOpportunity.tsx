"use client";

import { useState, useTransition } from "react";
import { deleteOpportunity } from "./actions";

/** Delete with a second, explicit confirmation. Cannot be undone. */
export default function DeleteOpportunity({ id, name }: { id: string; name: string }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      const res = await deleteOpportunity(id).catch(() => ({ ok: false as const, error: "No connection. Try again when you're online." }));
      if (res.ok) window.location.href = "/discover?saved=deleted";
      else setError(res.error);
    });
  }

  return (
    <section className="dx-danger">
      {!asking ? (
        <button type="button" className="dx-link dx-link-danger" onClick={() => setAsking(true)}>Delete this opportunity</button>
      ) : (
        <div className="dx-card dx-stack" role="alertdialog" aria-labelledby="del-q">
          <p id="del-q"><b>Delete {name}?</b> Its photos, notes and history go too. This can&apos;t be undone.</p>
          <div className="dx-row">
            <button type="button" className="dx-btn small danger" onClick={confirm} disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </button>
            <button type="button" className="dx-btn small ghost" onClick={() => setAsking(false)} disabled={pending}>Keep it</button>
          </div>
          {error && <p className="dx-error" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
