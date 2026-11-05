"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PsiScores } from "@/data/proposals/types";

type Tab = "mobile" | "desktop";

type Props = {
  mobile: PsiScores;
  desktop: PsiScores;
  dataMedicao: string;
  site: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "mobile", label: "Celular" },
  { id: "desktop", label: "Computador" },
];

const CATEGORIAS: { key: "desempenho" | "acessibilidade" | "praticas" | "seo"; label: string }[] = [
  { key: "desempenho", label: "Desempenho" },
  { key: "acessibilidade", label: "Acessibilidade" },
  { key: "praticas", label: "Práticas recomendadas" },
  { key: "seo", label: "SEO" },
];

const METRICAS: { key: "lcp" | "cls" | "tbt" | "fcp"; label: string }[] = [
  { key: "fcp", label: "First Contentful Paint (FCP)" },
  { key: "lcp", label: "Largest Contentful Paint (LCP)" },
  { key: "tbt", label: "Total Blocking Time (TBT)" },
  { key: "cls", label: "Cumulative Layout Shift (CLS)" },
];

/** PSI scale: 0 to 49 red, 50 to 89 orange, 90 to 100 green. */
function faixa(score: number): "ruim" | "medio" | "bom" {
  if (score >= 90) return "bom";
  if (score >= 50) return "medio";
  return "ruim";
}

function Ring({ score, label }: { score: number; label: string }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <figure className={`pp-ring is-${faixa(s)}`} style={{ ["--p" as string]: s }}>
      <div className="pp-ring-dial">
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle className="pp-ring-track" cx="60" cy="60" r="52" pathLength={100} />
          <circle className="pp-ring-arc" cx="60" cy="60" r="52" pathLength={100} />
        </svg>
        <span className="pp-ring-num">
          {s}
          <span className="sr-only"> de 100</span>
        </span>
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function PsiTabs({ mobile, desktop, dataMedicao, site }: Props) {
  const [active, setActive] = useState<Tab>("mobile");
  const [animated, setAnimated] = useState<Tab[]>([]);
  const [seen, setSeen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ mobile: null, desktop: null });

  // Animate the rings once, when the block first enters the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A panel that was hidden needs one painted frame at zero before the arcs can fill.
  useEffect(() => {
    if (!seen || animated.includes(active)) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setAnimated((a) => (a.includes(active) ? a : [...a, active])));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [seen, active, animated]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === active);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    const id = TABS[next].id;
    setActive(id);
    tabRefs.current[id]?.focus();
  }

  const data: Record<Tab, PsiScores> = { mobile, desktop };

  return (
    <div className="pp-psi" ref={rootRef}>
      <div className="pp-tabs" role="tablist" aria-label="Dispositivo da medição">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`psi-tab-${t.id}`}
            aria-controls={`psi-panel-${t.id}`}
            aria-selected={active === t.id}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={onKey}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) => {
        const d = data[t.id];
        const metricas = METRICAS.filter((m) => (d[m.key] ?? "").trim() !== "");
        return (
          <div
            key={t.id}
            role="tabpanel"
            id={`psi-panel-${t.id}`}
            aria-labelledby={`psi-tab-${t.id}`}
            hidden={active !== t.id}
            className={`pp-psi-panel${animated.includes(t.id) ? " is-on" : ""}`}
          >
            <div className="pp-psi-scores">
              <div className="pp-rings">
                {CATEGORIAS.map((c) => (
                  <Ring key={c.key} score={d[c.key]} label={c.label} />
                ))}
              </div>
              {metricas.length > 0 && (
                <dl className="pp-metrics">
                  {metricas.map((m) => (
                    <div key={m.key}>
                      <dt>{m.label}</dt>
                      <dd>{d[m.key]}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="pp-scale" aria-label="Escala do PageSpeed">
                <span className="is-ruim">0 a 49</span>
                <span className="is-medio">50 a 89</span>
                <span className="is-bom">90 a 100</span>
              </p>
            </div>
            <aside className="pp-source">
              <p className="mono">Fonte</p>
              <p>
                Dados extraídos do Google PageSpeed Insights para {site} em {dataMedicao}, versão{" "}
                {t.id === "mobile" ? "celular" : "computador"}.
              </p>
            </aside>
          </div>
        );
      })}
    </div>
  );
}
