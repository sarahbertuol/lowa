// data/proposals/gampi.ts
export const proposal = {
  slug: "gampi",

  cliente: {
    nome: "Gampi",
    marca: "Gampi Casa Criativa",
    site: "gampi.com.br",
    logo: "/proposals/gampi/logo.svg",
    corPrimaria: "#F26A1B", // TODO: conferir o laranja exato no site da Gampi
    contato: "TODO: nome do contato na Gampi",
  },

  autora: {
    nome: "Sarah Bertuol",
    empresa: "LoWa Studio",
    whatsapp: "5554981490779",
    mensagemWhatsapp:
      "Oi Sarah, vi a proposta da Gampi e quero conversar sobre os próximos passos!",
    linkAgenda: "", // opcional
  },

  dataMedicao: "05/11/2026",

  pagespeed: {
    mobile: {
      desempenho: 44,
      acessibilidade: 88,
      praticas: 92,
      seo: 85,
      lcp: "", // TODO: preencher do relatório completo
      cls: "",
      tbt: "",
      fcp: "",
    },
    desktop: {
      desempenho: 57,
      acessibilidade: 93,
      praticas: 92,
      seo: 85,
      lcp: "",
      cls: "",
      tbt: "",
      fcp: "",
    },
    prints: {
      mobile: "/proposals/gampi/psi-mobile.png",
      desktop: "/proposals/gampi/psi-desktop.png",
    },
  },

  insights: [
    {
      tipo: "alerta",
      titulo: "Celular abaixo do ideal (44/100)",
      texto:
        "Quem acessa pelo celular espera a página carregar antes de decidir. Nessa faixa, parte dos visitantes sai antes de ver a mensagem da marca, e as campanhas pagas perdem eficiência.",
    },
    {
      tipo: "alerta",
      titulo: "O computador também pode ser mais rápido (57/100)",
      texto:
        "O peso da página (imagens, scripts e fontes) está acima do ideal mesmo no desktop. Isso indica ganho a partir da otimização do carregamento, não de um ajuste pontual.",
    },
    {
      tipo: "ponto-forte",
      titulo: "Base sólida de acessibilidade e boas práticas (88 a 93)",
      texto:
        "A estrutura do site já segue boas práticas. A melhoria é de desempenho, sem precisar refazer o que já funciona.",
    },
    {
      tipo: "oportunidade",
      titulo: "SEO em 85: próximo degrau",
      texto:
        "Há uma boa base. Os próximos ganhos vêm de ajustes técnicos (metadados, dados estruturados, indexação e velocidade), que influenciam a posição no Google.",
    },
  ],

  melhorias: [
    "Otimização de imagens: formatos modernos, dimensões corretas e carregamento preguiçoso",
    "Redução e atraso de scripts de terceiros (chat, pixels e analytics)",
    "Otimização de fontes: menos pesos e carregamento sem bloqueio",
    "Prioridade para o conteúdo acima da dobra, que é o que o visitante vê primeiro",
    "Cache e entrega via CDN",
    "Revisão de SEO técnico",
  ],

  meta: "90+ em desempenho no celular e no computador, medido nas mesmas condições",

  servicos: [
    // Grupo: "site" (Para o seu site)
    { id: "site-institucional", grupo: "site", titulo: "Site institucional em Webflow", descricao: "Entrega rápida, com design sob medida e CMS.", match: false },
    { id: "redesign", grupo: "site", titulo: "Redesign de site existente", descricao: "Refazer estrutura, visual e conteúdo sem perder o que já converte.", match: true },
    { id: "landing-page", grupo: "site", titulo: "Landing page de campanha", descricao: "Página focada em conversão para anúncios e lançamentos.", match: false },
    { id: "cms", grupo: "site", titulo: "Webflow CMS (blog, cases, catálogo)", descricao: "Conteúdo gerenciável pela equipe, sem depender de dev.", match: false },
    { id: "localizacao", grupo: "site", titulo: "Localização multi-idioma", descricao: "Versões do site em outros idiomas com Webflow Localization.", match: false },
    { id: "animacoes", grupo: "site", titulo: "Interações e animações", descricao: "Movimento com propósito, sem pesar a página.", match: false },
    { id: "performance", grupo: "site", titulo: "Auditoria e otimização de performance", descricao: "Core Web Vitals e PageSpeed, com plano de execução.", match: true },
    { id: "seo-tecnico", grupo: "site", titulo: "SEO técnico", descricao: "Metadados, dados estruturados, indexação e migrações sem perda de posição.", match: true },
    { id: "seo-ia", grupo: "site", titulo: "AEO (otimização para buscas com IA)", descricao: "Conteúdo e estrutura para aparecer em respostas de IA.", match: false },
    { id: "migracao", grupo: "site", titulo: "Migração para Webflow", descricao: "Troca de plataforma com redirects e checagem de SEO.", match: false },
    { id: "tracking", grupo: "site", titulo: "Tracking: GTM, pixels e eventos", descricao: "GA4, Meta e eventos de conversão medidos corretamente.", match: true },
    { id: "lgpd", grupo: "site", titulo: "Adequação LGPD e cookies", descricao: "Banner de consentimento e políticas ajustadas.", match: false },
    { id: "manutencao", grupo: "site", titulo: "Manutenção mensal e suporte", descricao: "Atualizações, correções e melhorias contínuas.", match: true },
    { id: "handoff", grupo: "site", titulo: "Treinamento e handoff", descricao: "Sua equipe aprende a editar e publicar sozinha.", match: false },
    { id: "automacao-ia", grupo: "site", titulo: "Automação com IA", descricao: "Fluxos que reduzem trabalho manual de conteúdo e atendimento.", match: false },

    // Grupo: "agencias" (Para vender aos seus clientes)
    { id: "white-label", grupo: "agencias", titulo: "Produção white label", descricao: "Sites para os clientes da agência, com a marca da agência.", match: true },
    { id: "entrega-rapida", grupo: "agencias", titulo: "Entrega rápida para agências", descricao: "Prazos curtos para a agência fechar e entregar sem atraso.", match: true },
    { id: "operacao-webflow", grupo: "agencias", titulo: "Operação técnica Webflow", descricao: "A LoWa Studio executa, a agência mantém o relacionamento com o cliente.", match: true },
    { id: "auditoria-venda", grupo: "agencias", titulo: "Auditoria de performance como ferramenta de venda", descricao: "Um diagnóstico como o desta proposta, aplicado aos clientes da agência.", match: true },
    { id: "automacao-agencia", grupo: "agencias", titulo: "Automações com IA para a agência", descricao: "Processos internos e entregas mais rápidas.", match: false },
  ],

  mostrarNaoIndicados: false,

  oportunidadeAgencia: [
    {
      titulo: "Use a auditoria como abordagem comercial",
      texto: "O diagnóstico desta proposta pode ser aplicado aos clientes da Gampi. Cada cliente com um site lento vira uma oportunidade de venda de otimização.",
    },
    {
      titulo: "Venda sites rápidos com a sua marca",
      texto: "Sites em Webflow produzidos pela LoWa Studio e entregues com a marca da Gampi. Você fica com o cliente, a entrega fica com a gente.",
    },
    {
      titulo: "Ofereça manutenção e performance contínua",
      texto: "Um plano mensal de manutenção e monitoramento transforma um projeto pontual em receita recorrente.",
    },
    {
      titulo: "Entregue resultado mensurável",
      texto: "Tracking, SEO técnico e performance medidos com números. Isso facilita a renovação e a indicação.",
    },
  ],

  // Valores definidos pela Sarah em 10/11/2026. Próxima agência: trocar valores e percentual.
  investimento: [
    {
      titulo: "Site novo da Gampi",
      valor: "R$ 1.800",
      descricao: "",
      nota: "",
    },
    {
      titulo: "Projeto-piloto",
      valor: "Cortesia",
      descricao: "Primeiro site para um cliente da Gampi (até 4 páginas).",
      nota: "",
    },
    {
      titulo: "Sites para os clientes da Gampi",
      valor: "20% para a Gampi",
      descricao:
        "A LoWa contrata e fatura direto com o cliente final; a Gampi recebe 20% do valor total do projeto.",
      nota: "",
    },
  ],

  parceria: {
    passos: [
      "A Gampi apresenta o cliente.",
      "A LoWa faz o briefing com o cliente e apresenta a proposta.",
      "A LoWa conduz o projeto até a entrega final.",
      "Com o projeto pago pelo cliente, a LoWa repassa a comissão de 20% à Gampi.",
    ],
    nota: "A comissão é paga mediante nota fiscal de intermediação emitida pela Gampi.",
  },

  fases: [
    // Opcional. Preencher quando houver escopo e prazo definidos.
    // { titulo: "Diagnóstico e plano", prazo: "Semana 1" },
    // { titulo: "Execução das melhorias", prazo: "Semanas 2 e 3" },
    // { titulo: "Medição final e entrega", prazo: "Semana 4" },
  ],
} as const;
