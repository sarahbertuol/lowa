"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateAnalysis } from "./identity-actions";

/** Regenerate (OE-09): a new analysis version. The research shows its progress again. */
export default function Regenerate({ id, label = "Regenerate" }: { id: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="dx-regen">
      <button
        type="button" className="dx-btn ghost small" disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          const r = await regenerateAnalysis(id);
          if (r.ok) router.refresh(); else setError(r.error);
        })}
      >
        {pending ? "Starting…" : label}
      </button>
      {error && <p className="dx-field-err" role="alert">{error}</p>}
    </div>
  );
}
