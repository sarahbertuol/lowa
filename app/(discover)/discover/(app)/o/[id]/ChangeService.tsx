"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseService } from "./identity-actions";

type Option = { slug: string; name: string; label: string; perPage: boolean };

/** "Change service" (OE-11): the founder picks another catalog service; the price follows the catalog. */
export default function ChangeService({ id, current, extraPages, options }: {
  id: string; current: string | null; extraPages: number; options: Option[];
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(current && options.some((o) => o.slug === current) ? current : options[0]?.slug ?? "");
  const [pages, setPages] = useState(String(extraPages));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const perPage = options.find((o) => o.slug === slug)?.perPage ?? false;

  if (!open) {
    return <button type="button" className="dx-btn ghost small" onClick={() => setOpen(true)}>Change service</button>;
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = perPage ? Number(pages || "0") : 0;
    if (!Number.isInteger(n) || n < 0 || n > 20) { setError("Extra pages: a whole number from 0 to 20."); return; }
    start(async () => {
      const r = await chooseService(id, slug, n);
      if (r.ok) { setOpen(false); router.refresh(); } else setError(r.error);
    });
  }

  return (
    <form className="dx-stack" onSubmit={save} noValidate>
      <div className="dx-field">
        <label htmlFor={`${uid}-svc`}>Service</label>
        <select id={`${uid}-svc`} className="dx-input" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {options.map((o) => <option key={o.slug} value={o.slug}>{o.name} · {o.label}</option>)}
        </select>
      </div>
      {perPage && (
        <div className="dx-field">
          <label htmlFor={`${uid}-pages`}>Extra pages</label>
          <input id={`${uid}-pages`} className="dx-input" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} aria-invalid={error ? true : undefined} />
        </div>
      )}
      {error && <p className="dx-field-err" role="alert">{error}</p>}
      <div className="dx-row-btns">
        <button type="submit" className="dx-btn small" disabled={pending}>{pending ? "Saving…" : "Use this service"}</button>
        <button type="button" className="dx-btn ghost small" onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
      </div>
    </form>
  );
}
