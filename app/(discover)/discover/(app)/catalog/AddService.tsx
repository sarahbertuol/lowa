"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addService } from "./actions";

/** "Add service": creates an inactive service and opens it. */
export default function AddService() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="dx-regen">
      <button type="button" className="dx-btn ghost small" disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          const r = await addService();
          if (r.ok) router.replace(`/discover/catalog?open=${r.slug}#${r.slug}`);
          else setError(r.error);
        })}>
        {pending ? "Adding…" : "Add service"}
      </button>
      {error && <p className="dx-field-err" role="alert">{error}</p>}
    </div>
  );
}
