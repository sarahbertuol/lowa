# Handoff: Tracker Diário de Rotina e Projetos (painel privado LoWa)

## Overview
Painel pessoal de uma gerente de projetos digitais. Ao abrir, mostra o que fazer hoje, o que ficou pendente, a semana e o status dos projetos. Complementa o Google Calendar (não mostra reuniões). Duas áreas: **Profissional** e **Pessoal**.

## Onde implementar
- Dentro do projeto/repositório **LoWa**, como uma página isolada.
- **Rota sugerida:** `/rotina-k7r2q9`
  - Relacionada ao painel ("rotina"), mas o sufixo aleatório impede que clientes cheguem nela digitando algo por acaso.
  - Não linkar em nenhum menu, sitemap ou footer do site.
- **Noindex obrigatório:**
  - `<meta name="robots" content="noindex, nofollow, noarchive">` na página
  - Header `X-Robots-Tag: noindex, nofollow` na rota
  - `Disallow` **não** deve ser adicionado no `robots.txt` (isso expõe a rota publicamente); usar só meta + header.
  - Excluir a rota do `sitemap.xml`.
- **Senha:**
  - Proteção no **servidor**, não só no front (um gate em JS puro pode ser burlado lendo o código-fonte).
  - Sugestão: middleware (ex.: Next.js/Vercel middleware) que verifica um cookie `httpOnly` + `secure` + `sameSite=strict`. Sem cookie válido → tela de login com campo único de senha.
  - Senha guardada como variável de ambiente (`PANEL_PASSWORD` ou hash bcrypt em `PANEL_PASSWORD_HASH`), nunca no código.
  - Rate limit no endpoint de login (ex.: 5 tentativas / 15 min por IP).
  - Sessão de 30 dias; botão "Sair" discreto no footer.
  - Tela de login no mesmo visual (fundo `#FBF7F5`, card branco radius 26px, título "Instrument Serif", botão `#C4525C`).

## About the Design Files
Os arquivos deste pacote são **referências de design em HTML** — protótipos com o visual e o comportamento pretendidos, não código de produção. A tarefa é **recriar o design no ambiente existente do projeto LoWa** (React/Next, Vue, etc.) seguindo seus padrões. `Tracker Diario.dc.html` abre direto no navegador (precisa do `support.js` ao lado) e contém toda a lógica em uma classe JS no próprio arquivo — use como fonte da verdade para regras e textos.

## Fidelity
**High-fidelity.** Cores, tipografia, espaçamentos, textos e interações são finais. Recriar fielmente.

## Screens / Views

### 1. Visão geral (dashboard)
Container: `max-width 1180px`, centralizado, padding `clamp(22px,4vw,52px) clamp(16px,4vw,48px) 40px`, coluna com gap 28px.

**Header** (flex wrap, space-between, align end, gap 20)
- Data: `sábado, 7 de novembro` (pt-BR, weekday long), 12px, 600, uppercase, letter-spacing .14em, `#8C7F82`
- Saudação: "Bom dia, Sarah." / "Boa tarde" (<18h) / "Boa noite". Instrument Serif 400, `clamp(36px,5.4vw,54px)`, line-height 1.05
- Frase do dia (rotaciona por dia do ano): Instrument Serif italic 20px `#8C7F82`. Lista: "Um passo de cada vez.", "Foco no que importa hoje.", "Leveza também é produtividade.", "Menos lista, mais presença.", "Feito é melhor que perfeito.", "O resto pode esperar.", "Comece pelo que destrava o dia."
- Contador: "X para hoje · Y pendentes" (singular "1 pendente"), 14px 600, dots 8px `#C4525C` e `#D98E99`
- Ação principal: botão "+ Nova tarefa" pill, `#C4525C` (hover `#B3474F`), texto branco 15px 600, padding 14×24, min-height 48, sombra `0 10px 24px -10px rgba(196,82,92,.6)`

**Navegação**
- Tabs segmentadas: Profissional / Pessoal. Container `#F3E9E7`, radius 999, padding 4. Ativa: fundo branco, sombra `0 2px 8px -2px rgba(43,35,38,.12)`, texto `#2B2326`; inativa `#8C7F82`. 14px 600, min-height 42.
- Linha de subtabs abaixo (border-bottom `#EFE4E1`). Hoje só "Visão geral" (underline 2px `#D98E99`). **Reservada para subtabs futuras** — estruturar como lista dinâmica.

**Grid principal**: flex wrap gap 24. Coluna esquerda `flex: 1.6 1 440px` (Hoje + Pendentes), direita `flex: 1 1 300px` (Projetos). No mobile empilha.

**Card padrão**: branco, radius 26px, padding `clamp(18px,3vw,30px)`, sombra `0 1px 2px rgba(43,35,38,.04), 0 14px 34px -18px rgba(43,35,38,.12)`. Títulos de card em Instrument Serif 28–32px.

**Hoje**
- Título "Hoje" + à direita "N de M feitas".
- Linha de tarefa: min-height 56, padding 12×10, radius 16, hover `#FBF4F3`, clique abre edição.
  - Checkbox 26×26, radius 9, borda 1.5px `#E2CFD2`; marcado: fundo e borda `#D98E99`, "✓" branco.
  - Título 15px 500 (concluída: `#B4A8AB` + line-through). Meta 13px `#8C7F82`: "horário · projeto".
  - Prioridade à direita: dot 7px + label 12px 600. Alta `#C4525C`/texto `#A8434C`; Média `#D98E99`/`#8C7F82`; Baixa `#D6CACC`/`#A79A9D`.
- Ordenação: não concluídas primeiro → horário → prioridade.
- Vazio: "Nada agendado para hoje. Aproveite o respiro."
- **Tarefa especial "Responder e-mails pendentes"** (`kind: 'email'`): meta vira "X de Y respondidos · N urgentes"; botão ▴/▾ recolhe a lista. Abaixo, lista de e-mails (indent 50px):
  - Card de e-mail: borda `#F1E7E5`, radius 16, padding 12×14. Checkbox 22px (marcar respondido), remetente 13px 600 `#6F6366`, horário 12px `#B4A8AB`, assunto 14px 500, chip de urgência: Urgente (`#B0444E` / `#F6DEDF`), Hoje (`#A0606B` / `#F8E7E9`), Pode esperar (`#8C7F82` / `#F3EEED`).
  - "Ver sugestão de resposta" expande bloco `#FBF7F5` radius 12 com label "SUGESTÃO" + texto; ações "Copiar resposta" (clipboard), "Abrir no Gmail ↗" (thread ou busca), "Fechar".
  - Quando todos respondidos, a tarefa é marcada como concluída automaticamente.

**Pendentes** (só aparece se houver)
- Card fundo `#FCF2F1`, sem sombra. Subtítulo sem tom de culpa: "Ficaram de dias anteriores e já seguem com você hoje. Conclua quando puder ou escolha outro dia."
- Linha: checkbox (borda `#E2B3B9`), título, meta "de qua, 5 nov · Projeto", botão pill "Reagendar" (borda `#EBCFD2`, texto `#A8434C`).
- Regra: tarefa com data < hoje e não concluída aparece aqui automaticamente (não muta a data; é derivado).

**Projetos**
- Lista com divisórias `#F5EDEB`. Nome 15px 600, próxima entrega 12.5px ("Entrega X · até 12 nov" ou "Sem próxima entrega definida" em `#B4A8AB`), chip de status: No prazo (`#5E8269`/`#E8F0EA`), Atenção (`#A0606B`/`#F8E7E9`), Atrasado (`#B0444E`/`#F6DEDF`).
- "+ Projeto" no topo. Clique em projeto abre a tela de projeto.

**Semana**
- Título "Semana" + intervalo "2 nov – 8 nov"; setas ‹ › (38px circulares) e "Esta semana" quando fora da atual.
- Grid 7 colunas `minmax(128px,1fr)`, gap 10, scroll horizontal no mobile.
- Coluna: radius 18, padding 14, min-height 170, borda `#F1E7E5`; hoje: fundo `#FCF2F1`, borda `#EBC6CB`, label `#A8434C`. Label seg…dom 11px uppercase + número do dia Instrument Serif 24px. Barra de progresso 4px (`#D98E99`, 100% = `#8FAE98`), "N de M" ou "Livre", até 4 tarefas (dot por prioridade; dias passados não feitos `#D98E99`), "+N".

**Footer**: "Salvo neste navegador. O Google Calendar segue com suas reuniões." + "Exportar JSON" / "Importar JSON".

### 2. Tela de projeto
- "← Visão geral" (volta). Header: label "Projeto · Profissional", nome em serif grande, chip de status, próxima entrega, "Editar projeto". Ação principal "+ Nova tarefa" (pré-seleciona o projeto).
- Card de progresso: % em Instrument Serif 44px, "N de M tarefas concluídas", barra 6px.
- Dois cards lado a lado (flex `1 1 360px`):
  - **Para hoje**: tarefas do projeto com data ≤ hoje não concluídas. Vazio: "Nada deste projeto para hoje."
  - **Agendado**: data > hoje, ordenadas por data; abaixo seção "Pendentes · sem data" com checkbox tracejado, título (quebra linha), chip de responsável (LoWa `#A8434C`/`#F8E7E9`; Cliente `#6F6366`/`#F3EEED`) e link "Agendar".
- Card "Concluídas · N" (se houver), itens riscados, clique no check desfaz.

### 3. Modais (overlay `rgba(43,35,38,.28)` + blur 3px; card max 460px, radius 26, padding 28; Esc/clique fora fecha)
- **Nova/Editar tarefa**: Tarefa (obrigatório, erro "Dê um nome para a tarefa."), Projeto/cliente (select + "Sem projeto"), Dia (date, opcional), Horário (opcional), Prioridade (3 botões). Enter salva. "Excluir" na edição.
- **Reagendar/Agendar**: atalhos Hoje / Amanhã / Segunda + "Outro dia" (date) + "Mover". Toast "Movida para qui, 12 nov".
- **Projeto**: Nome, Status (3 botões), Próxima entrega (texto), Data da entrega. "Arquivar". Renomear atualiza as tarefas vinculadas.
- Toast: pill `#2B2326`, branco, bottom 28px, 2.4s.

## State / Dados
```ts
Task    { id, title, project: string /*nome*/, area: 'pro'|'pes', date: 'YYYY-MM-DD'|'' , time: 'HH:MM'|'', priority: 'alta'|'media'|'baixa', done, doneAt?, kind?: 'email'|'milestone', owner?: 'Cliente'|'LoWa' }
Project { id, name, area, status: 'prazo'|'atencao'|'atrasado', next, nextDate, defaults?: number }
Email   { id, threadId, from, address, subject, urgency: 'alta'|'media'|'baixa', received, suggestion, answered }
```
- Persistência atual: `localStorage` chave `tracker-rotina-v1`. Export/Import JSON `{ version, exportedAt, tasks, projects, emails }`.
- **Recomendado na implementação:** como a página terá login, considerar salvar no servidor (ex.: KV/DB simples) para sincronizar celular e desktop. Manter export/import JSON.
- **Tarefas padrão** em todo projeto Profissional (inclusive novos), sem data, como pendentes:
  - Pagamento entrada — Cliente
  - Pagamento entrega — Cliente
  - Entrega design — LoWa
  - Entrega desenvolvimento — LoWa
  - Entrega conteúdo — Cliente
  - Entrega assets — Cliente
- Projetos iniciais — Profissional: Oclusal, Suzano SEO, VAIRIX, Topiaris, Fabiana Campos, Documentall, Preto Kayser, Seatru, Edu Kayser, DP6. Pessoal: Lorena, Viagem Florida.
- Re-render a cada minuto (virada do dia).

## Integração Gmail (próxima etapa)
- Hoje os e-mails são exemplos (`example: true`, aviso abaixo da lista).
- Implementar OAuth Google (escopo `gmail.readonly`) no servidor; buscar não lidos/importantes; classificar urgência e gerar sugestão de resposta (ex.: via API Claude); preencher `Email[]`. `threadId` → link `https://mail.google.com/mail/u/0/#inbox/{threadId}`.
- Tokens apenas no servidor.

## Design Tokens
- Fundo `#FBF7F5` · Card `#FFFFFF` · Texto `#2B2326` · Secundário `#8C7F82` · Terciário `#B4A8AB` / `#A79A9D` · Linhas `#EFE4E1` `#F1E7E5` `#EADFDC`
- Destaques (máx. 3): Vermelho suave `#C4525C` (ação/alta), Rosa `#D98E99` (média/progresso), Sálvia `#7FA08A`/`#8FAE98`/`#5E8269` (no prazo/completo)
- Fundos rosados: `#FCF2F1`, `#F8E7E9`, `#FBF4F3` (hover)
- Tipografia: **Instrument Serif** 400 (títulos, números) + **Manrope** 400/500/600/700 (UI), Google Fonts. Base 15px / 1.45.
- Radius: 26 (cards), 18 (dias), 16 (linhas), 14 (inputs), 12, 9 (checkbox), 999 (pills)
- Inputs: padding 13×14, borda `#EADFDC`, fundo `#FDFBFA`, foco borda `#D98E99`.
- Alvos de toque ≥ 44px no mobile.

## Assets
Nenhuma imagem. Ícones são caracteres (✓ ‹ › ▴ ▾ ↗ ←).

## Files
- `Tracker Diario.dc.html` — protótipo completo (template + lógica)
- `support.js` — runtime necessário para abrir o protótipo localmente
