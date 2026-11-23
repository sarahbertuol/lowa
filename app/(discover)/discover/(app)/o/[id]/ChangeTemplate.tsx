"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_LABEL, type Template } from "@/lib/engine/research/insights";
import { chooseTemplate } from "./identity-actions";

/** Template picker (OE-14). Picking one writes the draft again for that template. */
export default function ChangeTemplate({ id, current, rule, chosen }: { id: string; current: Template; rule: Template | null; chosen: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState(current);
  const router = useRouter();

  function pick(t: Template) {
    if (t === picked || pending) return;
    setPicked(t);
    setError(null);
    start(async () => {
      const r = await chooseTemplate(id, t);
      if (r.ok) router.refresh(); else { setError(r.error); setPicked(current); }
    });
  }

  return (
    <div className="dx-stack">
      <div className="dx-pills" role="group" aria-label="Proposal template">
        {(Object.keys(TEMPLATE_LABEL) as Template[]).map((t) => (
          <button key={t} type="button" className="dx-pill" aria-pressed={picked === t} onClick={() => pick(t)} disabled={pending}>
            {TEMPLATE_LABEL[t]}
          </button>
        ))}
      </div>
      <p className="dx-why">
        {pending ? "Writing the draft again for this template…"
          : rule && rule !== picked ? `You chose this template. The rule suggested ${TEMPLATE_LABEL[rule]}.`
          : chosen && !rule ? "You chose this template."
          : "Changing the template writes the draft again."}
      </p>
      {error && <p className="dx-field-err" role="alert">{error}</p>}
    </div>
  );
}
