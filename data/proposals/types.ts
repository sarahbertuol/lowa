/** Shape of an agency proposal. One file per client in data/proposals/[slug].ts. */

export type PsiScores = {
  readonly desempenho: number;
  readonly acessibilidade: number;
  readonly praticas: number;
  readonly seo: number;
  /** Optional lab metrics: rendered only when filled in. */
  readonly lcp?: string;
  readonly cls?: string;
  readonly tbt?: string;
  readonly fcp?: string;
};

export type InsightTipo = "alerta" | "oportunidade" | "ponto-forte";

export type Servico = {
  readonly id: string;
  readonly grupo: "site" | "agencias";
  readonly titulo: string;
  readonly descricao: string;
  readonly match: boolean;
};

export type Proposal = {
  readonly slug: string;
  readonly cliente: {
    readonly nome: string;
    readonly marca: string;
    readonly site: string;
    readonly logo: string;
    readonly corPrimaria: string;
    readonly contato: string;
  };
  readonly autora: {
    readonly nome: string;
    readonly empresa: string;
    readonly whatsapp: string;
    readonly mensagemWhatsapp: string;
    readonly linkAgenda?: string;
  };
  readonly dataMedicao: string;
  readonly pagespeed: {
    readonly mobile: PsiScores;
    readonly desktop: PsiScores;
    /** Kept in the data for reference; not shown on the page. */
    readonly prints?: { readonly mobile: string; readonly desktop: string };
  };
  readonly insights: readonly { readonly tipo: InsightTipo; readonly titulo: string; readonly texto: string }[];
  readonly melhorias: readonly string[];
  readonly meta: string;
  readonly servicos: readonly Servico[];
  readonly mostrarNaoIndicados: boolean;
  readonly oportunidadeAgencia: readonly { readonly titulo: string; readonly texto: string }[];
  /** Optional: each section renders only when filled in. Empty descricao/nota are skipped. */
  readonly investimento?: readonly {
    readonly titulo: string;
    readonly valor: string;
    readonly descricao?: string;
    readonly nota?: string;
  }[];
  readonly parceria?: { readonly passos: readonly string[]; readonly nota?: string };
  readonly fases: readonly { readonly titulo: string; readonly prazo: string }[];
};
