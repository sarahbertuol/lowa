import fs from "node:fs";
import path from "node:path";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import WalterScene from "@/components/proposal/WalterScene";
import PsiTabs from "@/components/proposal/PsiTabs";
import { getProposal, proposalSlugs } from "@/data/proposals";
import type { InsightTipo, Servico } from "@/data/proposals/types";
import { accentPalette } from "@/lib/proposal-color";
import "../proposal.css";

/** Only the slugs that have a data file exist. Anything else is a 404. */
export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return proposalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProposal(slug);
  if (!p) return {};
  return {
    title: { absolute: `Proposta para ${p.cliente.nome} · ${p.autora.empresa}` },
    description: `Diagnóstico e proposta da ${p.autora.empresa} para ${p.cliente.marca}.`,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}

export async function generateViewport({ params }: Params): Promise<Viewport> {
  const { slug } = await params;
  const p = await getProposal(slug);
  return { themeColor: p ? accentPalette(p.cliente.corPrimaria).accent : undefined };
}

/** Assets are optional: a missing file renders a placeholder instead of a broken image. */
function publicAsset(src: string): string | null {
  if (!src) return null;
  const file = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
  return fs.existsSync(file) ? src : null;
}

function formatWhatsapp(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const num = d.slice(4);
    return `+55 (${ddd}) ${num.slice(0, num.length - 4)}-${num.slice(-4)}`;
  }
  return `+${d}`;
}

const TIPO: Record<InsightTipo, { label: string; icon: ReactNode }> = {
  alerta: {
    label: "Alerta",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 10v4.2M12 16.8v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  oportunidade: {
    label: "Oportunidade",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 17 10 11l4 4 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 8h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  "ponto-forte": {
    label: "Ponto forte",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8.2 12.3 2.6 2.6 5-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const GRUPOS: { id: Servico["grupo"]; titulo: string }[] = [
  { id: "site", titulo: "Para o seu site" },
  { id: "agencias", titulo: "Para vender aos seus clientes" },
];

function Check({ on }: { on: boolean }) {
  return (
    <svg className="pp-check" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" className="pp-check-bg" />
      {on && <path d="m7.4 12.4 3 3 6.2-6.6" fill="none" className="pp-check-mark" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function Eyebrow({ n, children }: { n: string; children: string }) {
  return (
    <p className="pp-eyebrow mono">
      <span>{n}</span> {children}
    </p>
  );
}

export default async function ProposalPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProposal(slug);
  if (!p) notFound();

  const cores = accentPalette(p.cliente.corPrimaria);
  const vars = {
    "--accent": cores.accent,
    "--on-accent": cores.onAccent,
    "--accent-text-l": cores.textLight,
    "--accent-text-d": cores.textDark,
    "--accent-line-l": cores.lineLight,
  } as CSSProperties;

  const logo = publicAsset(p.cliente.logo);
  const whatsappHref = `https://wa.me/${p.autora.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(p.autora.mensagemWhatsapp)}`;
  const agenda = (p.autora.linkAgenda ?? "").trim();

  return (
    <div className="pp" lang="pt-BR" style={vars}>
      <header className="pp-hero">
        <p className="pp-brand" aria-label="LoWa Studio">
          LoWa <em>Studio</em>
        </p>
        <WalterScene />
        <div className="pp-hero-inner">
          <div className="pp-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={p.cliente.marca} width={160} height={48} />
            ) : (
              <span className="pp-logo-text">{p.cliente.nome}</span>
            )}
          </div>
          <h1>
            Proposta para <em>{p.cliente.nome}</em>
          </h1>
          <p className="pp-hero-sub">
            Preparada por {p.autora.nome} · {p.autora.empresa}
          </p>
          <p className="pp-hero-meta mono">
            <span>Medição em {p.dataMedicao}</span>
            <span>{p.cliente.site}</span>
          </p>
        </div>
      </header>

      <main>
        <section className="pp-sec" aria-labelledby="sec-psi">
          <Reveal className="pp-head">
            <Eyebrow n="01">Diagnóstico</Eyebrow>
            <h2 id="sec-psi">
              Diagnóstico <em>PageSpeed</em>
            </h2>
          </Reveal>
          <PsiTabs mobile={p.pagespeed.mobile} desktop={p.pagespeed.desktop} dataMedicao={p.dataMedicao} site={p.cliente.site} />
        </section>

        <section className="pp-sec" aria-labelledby="sec-insights">
          <Reveal className="pp-head">
            <Eyebrow n="02">Experiência atual</Eyebrow>
            <h2 id="sec-insights">
              Insights da experiência <em>atual</em>
            </h2>
          </Reveal>
          <ul className="pp-insights" role="list">
            {p.insights.map((it, i) => (
              <Reveal as="li" key={it.titulo} delay={((i % 3) + 1) as 1 | 2 | 3} className={`pp-insight is-${it.tipo}`}>
                <p className="pp-insight-tag mono">
                  {TIPO[it.tipo].icon}
                  {TIPO[it.tipo].label}
                </p>
                <h3>{it.titulo}</h3>
                <p>{it.texto}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <section className="pp-sec" aria-labelledby="sec-plano">
          <Reveal className="pp-head">
            <Eyebrow n="03">Plano</Eyebrow>
            <h2 id="sec-plano">
              Plano de <em>melhorias</em>
            </h2>
          </Reveal>
          <div className="pp-plan">
            <ul className="pp-plan-list" role="list">
              {p.melhorias.map((m) => (
                <li key={m}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M13 2.8 5 13.4h6.2L10.6 21 19 10.4h-6.2L13 2.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <Reveal className="pp-goal">
              <p className="mono">Objetivo</p>
              <p className="pp-goal-text">{p.meta}</p>
              <p className="pp-goal-note">
                Meta, não garantia. A pontuação depende de scripts de terceiros e é recalculada a cada medição.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="pp-sec" aria-labelledby="sec-servicos">
          <Reveal className="pp-head">
            <Eyebrow n="04">Serviços</Eyebrow>
            <h2 id="sec-servicos">
              Como trabalhamos <em>juntos</em>
            </h2>
            <p className="pp-intro pp-legend">
              <Check on /> Indicado para a {p.cliente.nome}
            </p>
          </Reveal>
          <div className="pp-groups">
            {GRUPOS.map((g) => {
              const itens = p.servicos.filter((s) => s.grupo === g.id && (s.match || p.mostrarNaoIndicados));
              if (itens.length === 0) return null;
              return (
                <div key={g.id} className="pp-group">
                  <h3 className="pp-group-title">{g.titulo}</h3>
                  <ul className="pp-services" role="list">
                    {itens.map((s) => (
                      <li key={s.id} className={s.match ? "is-match" : "is-off"}>
                        <Check on={s.match} />
                        <div>
                          <p className="pp-service-title">
                            {s.titulo}
                            <span className="sr-only">{s.match ? ", indicado" : ", não indicado agora"}</span>
                          </p>
                          <p className="pp-service-desc">{s.descricao}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pp-sec pp-band" aria-labelledby="sec-vendas">
          <Reveal className="pp-head">
            <Eyebrow n="05">Para a agência</Eyebrow>
            <h2 id="sec-vendas">
              Como isso vira vendas para os seus <em>clientes</em>
            </h2>
          </Reveal>
          <ol className="pp-steps" role="list">
            {p.oportunidadeAgencia.map((o, i) => (
              <Reveal as="li" key={o.titulo} delay={((i % 3) + 1) as 1 | 2 | 3} className="pp-step">
                <span className="pp-step-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{o.titulo}</h3>
                <p>{o.texto}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="pp-sec pp-next" aria-labelledby="sec-proximos">
          <Reveal className="pp-head">
            <Eyebrow n="06">Próximos passos</Eyebrow>
            <h2 id="sec-proximos">
              Próximos <em>passos</em>
            </h2>
          </Reveal>
          {p.fases.length > 0 && (
            <ol className="pp-fases" role="list">
              {p.fases.map((f) => (
                <li key={f.titulo}>
                  <span className="mono">{f.prazo}</span>
                  <span>{f.titulo}</span>
                </li>
              ))}
            </ol>
          )}
          <Reveal className="pp-cta">
            <a className="pp-btn" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              Vamos conversar
              <span className="sr-only"> (abre o WhatsApp em uma nova aba)</span>
              <span aria-hidden="true" className="arr">→</span>
            </a>
            {agenda && (
              <a className="pp-btn-ghost" href={agenda} target="_blank" rel="noopener noreferrer">
                Agendar uma conversa
                <span className="sr-only"> (abre em uma nova aba)</span>
              </a>
            )}
          </Reveal>
        </section>
      </main>

      <footer className="pp-foot">
        <p>
          {p.autora.empresa} · {p.autora.nome} · <span className="pp-nowrap">{formatWhatsapp(p.autora.whatsapp)}</span>
        </p>
      </footer>
    </div>
  );
}
