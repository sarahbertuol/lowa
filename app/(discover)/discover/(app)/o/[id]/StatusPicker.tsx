"use client";

import { useOptimistic, useState, useTransition } from "react";
import { MANUAL_STATUSES, STATUS_LABEL, type Status } from "@/lib/engine/status";
import { setStatus } from "./actions";

/** One tap changes the status (optimistic). The database records the change in History. */
export default function StatusPicker({ id, status }: { id: string; status: Status }) {
  const [current, setCurrent] = useOptimistic(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(next: Status) {
    if (next === current || pending) return;
    setError(null);
    start(async () => {
      setCurrent(next);
      if ("vibrate" in navigator) navigator.vibrate?.(10);
      const res = await setStatus(id, next).catch(() => ({ ok: false as const, error: "No connection. Try again when you're online." }));
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="dx-group" aria-labelledby="h-status">
      <h2 id="h-status" className="dx-h2">Status</h2>
      <div className="dx-pills" role="group" aria-labelledby="h-status">
        {MANUAL_STATUSES.map((s) => (
          <button key={s} type="button" className="dx-pill" aria-pressed={current === s} onClick={() => pick(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error && <p className="dx-error" role="alert">{error}</p>}
      {!MANUAL_STATUSES.includes(current) && (
        <span className="dx-hint">Now: {STATUS_LABEL[current]}. Research and publishing set the earlier steps.</span>
      )}
    </section>
  );
}
