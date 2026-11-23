"use client";

import { useId, useState, useTransition } from "react";
import { PRICE_TYPES, PRICE_TYPE_LABEL, centsFrom, priceInput, priceLabel, money, type PriceType, type Service } from "@/lib/engine/catalog";
import { saveService } from "./actions";

/** One service (docs/referencia/Catalogo.html): the summary line opens the editor. */
export default function ServiceCard({ service, open: startOpen = false }: { service: Service; open?: boolean }) {
  const uid = useId();
  const [s, setS] = useState({
    name: service.name,
    priceType: service.price_type,
    price: priceInput(service.price_cents),
    extraPage: priceInput(service.extra_page_cents),
    includedPages: service.included_pages != null ? String(service.included_pages) : "",
    summary: service.summary ?? "",
    payment: service.payment_terms ?? "",
    delivery: service.delivery ?? "",
    notes: service.notes ?? "",
    inclusions: service.inclusions.length ? service.inclusions : [""],
    exclusions: service.exclusions.length ? service.exclusions : [""],
    active: service.active,
  });
  const [updatedAt, setUpdatedAt] = useState(service.updated_at);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; field?: string } | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => { setS((x) => ({ ...x, [k]: v })); setMsg(null); };

  // The summary line shows what is saved plus what is being typed, so the price reads as it will.
  const cents = centsFrom(s.price);
  const shownPrice = priceLabel({ price_type: s.priceType, price_cents: Number.isNaN(cents) ? null : cents });
  const extraCents = centsFrom(s.extraPage);
  const meta = [
    PRICE_TYPE_LABEL[s.priceType],
    s.includedPages && `${s.includedPages} page${s.includedPages === "1" ? "" : "s"}`,
    s.priceType !== "custom" && extraCents != null && !Number.isNaN(extraCents) && `${money(extraCents)} per extra page`,
    s.active ? "active" : "inactive",
  ].filter(Boolean).join(" · ");

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveService({ id: service.id, updatedAt, ...s });
      if (r.ok) { setUpdatedAt(r.updatedAt); setMsg({ ok: true, text: "Saved. New proposals use this from now on." }); }
      else setMsg({ ok: false, text: r.error, field: r.field });
    });
  }

  const f = (name: string) => `${uid}-${name}`;
  const bad = (name: string) => (msg && !msg.ok && msg.field === name ? true : undefined);

  return (
    <details className={`dx-card dx-svc-card${s.active ? "" : " off"}`} open={startOpen}>
      <summary>
        <b>{s.name || "Untitled"}</b>
        <span className="p">{shownPrice}</span>
        <span className="mono">{meta}</span>
      </summary>
      <form className="dx-svc-ed" onSubmit={save} noValidate>
        <div className="dx-field">
          <label htmlFor={f("name")}>Name</label>
          <input id={f("name")} className="dx-input" value={s.name} maxLength={80} onChange={(e) => set("name", e.target.value)} aria-invalid={bad("name")} />
        </div>

        <div className="dx-two">
          <div className="dx-field">
            <label htmlFor={f("type")}>Price type</label>
            <select id={f("type")} className="dx-input" value={s.priceType} onChange={(e) => set("priceType", e.target.value as PriceType)}>
              {PRICE_TYPES.map((t) => <option key={t} value={t}>{PRICE_TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          {s.priceType !== "custom" && (
            <div className="dx-field">
              <label htmlFor={f("price")}>Price (USD){s.priceType === "monthly" ? " per month" : ""}</label>
              <input id={f("price")} className="dx-input" inputMode="decimal" autoComplete="off" value={s.price} placeholder="920"
                onChange={(e) => set("price", e.target.value)} aria-invalid={bad("price")} />
            </div>
          )}
        </div>

        <div className="dx-two">
          <div className="dx-field">
            <label htmlFor={f("pages")}>Pages included</label>
            <input id={f("pages")} className="dx-input" inputMode="numeric" autoComplete="off" value={s.includedPages} placeholder="None"
              onChange={(e) => set("includedPages", e.target.value)} aria-invalid={bad("includedPages")} />
          </div>
          {s.priceType !== "custom" && (
            <div className="dx-field">
              <label htmlFor={f("extra")}>Extra page (USD)</label>
              <input id={f("extra")} className="dx-input" inputMode="decimal" autoComplete="off" value={s.extraPage} placeholder="None"
                onChange={(e) => set("extraPage", e.target.value)} aria-invalid={bad("extraPage")} />
            </div>
          )}
        </div>

        <div className="dx-field">
          <label htmlFor={f("summary")}>Short description</label>
          <input id={f("summary")} className="dx-input" value={s.summary} maxLength={240} onChange={(e) => set("summary", e.target.value)} />
        </div>

        <div className="dx-field">
          <label htmlFor={f("pay")}>Payment</label>
          <input id={f("pay")} className="dx-input" value={s.payment} maxLength={240} placeholder="e.g. 50% to start, 50% at launch" onChange={(e) => set("payment", e.target.value)} />
        </div>

        <ListEditor label="Included" items={s.inclusions} onChange={(v) => set("inclusions", v)} />
        <ListEditor label="Not included" items={s.exclusions} onChange={(v) => set("exclusions", v)} />

        <div className="dx-field">
          <label htmlFor={f("delivery")}>Delivery</label>
          <input id={f("delivery")} className="dx-input" value={s.delivery} maxLength={160} placeholder="e.g. 2 weeks" onChange={(e) => set("delivery", e.target.value)} />
        </div>

        <div className="dx-field">
          <label htmlFor={f("notes")}>Rules for proposals</label>
          <textarea id={f("notes")} className="dx-input" rows={3} value={s.notes} maxLength={600} onChange={(e) => set("notes", e.target.value)} aria-describedby={f("notes-hint")} />
          <span id={f("notes-hint")} className="dx-why">Only for the team and the analysis. Never shown to the client.</span>
        </div>

        <label className="dx-switch">
          <span>Active<span className="dx-why"> · {s.active ? "offered in new proposals" : "not offered"}</span></span>
          <input type="checkbox" role="switch" checked={s.active} onChange={(e) => set("active", e.target.checked)} />
        </label>

        {msg && (
          <p className={msg.ok ? "dx-saved" : "dx-field-err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>
        )}
        <button type="submit" className="dx-btn block" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      </form>
    </details>
  );
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  return (
    <fieldset className="dx-field dx-list-ed" aria-labelledby={id}>
      <legend id={id}>{label}</legend>
      {items.map((it, i) => (
        <div key={i}>
          <input className="dx-input" value={it} maxLength={160} aria-label={`${label} item ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="x" aria-label={`Remove ${label.toLowerCase()} item ${i + 1}`}
            onClick={() => onChange(items.length > 1 ? items.filter((_, j) => j !== i) : [""])}>×</button>
        </div>
      ))}
      {items.length < 20 && (
        <button type="button" className="dx-btn ghost small" onClick={() => onChange([...items, ""])}>Add item</button>
      )}
    </fieldset>
  );
}
