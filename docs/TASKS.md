# Backlog · LoWa Opportunity Engine

Ferramenta interna da LoWa Studio para descobrir negócios locais pelo celular, pesquisar a presença digital, gerar uma proposta personalizada e preparar a mensagem de abordagem.

Rotas novas (o site público não muda):
- `/discover` · app privado (Sarah e Marco), instalável no celular
- `/opportunity/[token]` · proposta pública por negócio, sem indexação

Arquitetura, banco e variáveis: `docs/ARQUITETURA.md`. Visual: `docs/DESIGN.md` e `docs/referencia/`. Movimento: `docs/INTERACOES.md`.

Regra: uma tarefa por vez, na ordem. Ao terminar cada uma: build, typecheck, teste em 390px e 1440px, commit em português com o código da tarefa, deploy de PREVIEW (`npx vercel`) e o link com resumo curto (o que mudou e o que não foi verificado). Trabalhar sempre em branch `engine/...`: a `main` deste repositório publica em lowa-studio.com.

---

## Fase 0 · Docs

### OE-00 · Docs e protótipos ✅
Aprovado pela Sarah em 22/11/2026.
TASKS, ARQUITETURA, DESIGN, INTERACOES, PENDENCIAS e protótipos em `docs/referencia/`.

---

## Fase 1 · Base: login, banco e captura (Etapa 2 do brief)

### OE-01 · Infra e banco ✅
Migrações aplicadas no Supabase (supabase-alizarin-yacht) em 22/11/2026 pelo SQL Editor: 7 serviços, 1 pessoa na equipe.
- Projeto Supabase (criado pela Sarah), dependências `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
- Migrações SQL em `supabase/migrations/` com as tabelas de `ARQUITETURA.md`, RLS ligada em todas e seed do catálogo com os preços do site. Teste: `npm run test:db` (Postgres em memória, sem Supabase).
- `robots.txt` e `next.config.mjs`: `Disallow` e `X-Robots-Tag: noindex, nofollow` para `/discover` e `/opportunity`.
- Pronto quando: migração roda do zero; com a chave anônima nenhuma tabela é legível; o site público continua idêntico (comparar as 4 páginas antes e depois).

### OE-02 · Login
- `/discover/login` com link mágico por e-mail (Supabase Auth). Cadastro público desligado; só e-mails da tabela `team_members` entram.
- `middleware.ts` protege `/discover/*` e `/api/discover/*` (sem sessão: página vai para o login, API responde 401).
- Pronto quando: e-mail fora da lista é recusado com mensagem clara; sessão dura 30 dias no celular.

### OE-03 · Casca do app e PWA
- Layout `app/(discover)/discover/layout.tsx` sem header e footer do site, tokens LoWa, barra inferior com o botão "New".
- Manifest com `scope: /discover/`, ícones, `display: standalone`. Service worker só nesse escopo: guarda a casca e a tela de captura para abrir sem internet.
- Indicador de rede (online, offline, sincronizando).
- Pronto quando: instala na tela inicial do iPhone e do Android; abre offline na tela de captura; o site público não registra service worker.

### OE-04 · Nova oportunidade (captura)
- Formulário da referência `Nova.html`: obrigatórios nome e cidade; opcionais em "Add details" (site, Instagram, categoria, contato, onde encontrou, observação, foto). Escolha de um toque "Met in person / Found online".
- Cidade: sugestão pela localização do aparelho (com permissão) e últimas cidades usadas.
- Foto: comprimida no aparelho (máx. 1600px, JPG) e enviada para o bucket privado.
- Salva na hora e já dispara a pesquisa. Sem internet: vai para a fila local (IndexedDB) e sincroniza quando a rede voltar.
- Aviso de possível duplicado (nome parecido na mesma cidade), sem bloquear.
- Pronto quando: captura com só nome e cidade em menos de 30 s em 390px; captura offline aparece no painel como "Waiting for connection" e sincroniza sozinha.

### OE-05 · Painel e histórico
- `/discover`: botão grande "New opportunity", grupos Processing, Ready to share, Recent; aba "All" com filtro por status.
- Detalhe com status (lista do brief), datas (captura, contato), notas e histórico de status.
- Pronto quando: troca de status em 1 toque e registra data; lista carrega em menos de 1 s com 100 itens.

---

## Fase 2 · Pesquisa e análise (Etapa 3)

### OE-06 · Fila de pesquisa
- Tabela `research_jobs` com etapas (identidade, Google, site, redes, concorrentes e contexto, análise). Cada etapa é idempotente e salva o resultado ao terminar.
- Execução em segundo plano na Vercel (`after()` na rota que cria o job), até 3 tentativas por etapa; botão "Resume" retoma da etapa que falhou.
- Tela de andamento (`Oportunidade.html`, estado Researching) com etapas e resultados parciais.
- Pronto quando: derrubar uma etapa de propósito deixa a oportunidade em "Research paused" e o Resume conclui sem repetir as etapas prontas.

### OE-07 · Fornecedores de pesquisa
- Interfaces em `lib/engine/providers/` (search, places, page reader, vision, ai). Trocar fornecedor = trocar um arquivo.
- Google Places API (perfil, site, telefone, nota, link do Maps), busca na web da API do Claude, leitor de páginas no servidor (tempo limite, tamanho máximo, sem IP interno, respeita robots.txt), leitura de foto (cartão, vitrine) pela visão do Claude.
- Instagram e Facebook: só o link informado ou o que aparecer em resultado público de busca. Nada de login, raspagem ou contorno de bloqueio.
- Pronto quando: cada achado salvo tem fonte, data, status de verificação e confiança.

### OE-08 · Identidade e confiança
- Regras de `ARQUITETURA.md` (HIGH, MEDIUM, LOW). Homônimo nunca é atribuído sem casar cidade e mais um dado (endereço, telefone, link cruzado).
- LOW vira status "Needs verification": a tela mostra os candidatos e a fundadora escolhe, corrige ou adiciona fontes à mão.
- Pronto quando: os testes 5 e 6 do brief passam (sem site identificável e identidade ambígua).

### OE-09 · Análise de oportunidades
- Seis dimensões (descoberta, apresentação, experiência, conversão, retenção, sazonalidade). Saída estruturada com no máximo 3 insights, cada um com observado, por que importa, o que a LoWa faria e benefício qualitativo.
- Cada frase marcada como fato verificado, observação, hipótese ou recomendação. Sem números de receita ou conversão sem dado.
- Escolha automática do modelo de proposta (A, B ou C) e do serviço (só o id do catálogo).
- Pronto quando: 3 negócios reais de teste geram insights específicos (nenhum "your website could be better").

---

## Fase 3 · Catálogo e proposta (Etapa 4)

### OE-10 · Catálogo editável
- `/discover/catalog` (`Catalogo.html`): nome, tipo de preço (fixo, a partir de, mensal, sob consulta), valor, pagamento, inclusões, exclusões, prazo, ativo.
- Pronto quando: a Sarah muda um preço pelo celular e a próxima proposta já usa o novo valor; propostas publicadas não mudam.

### OE-11 · Serviço e preço
- O preço vem só do catálogo. A IA indica o id do serviço e páginas extras sugeridas; o servidor calcula. "Custom quote" aparece como tal, sem valor.
- E-commerce nunca é apresentado como o pacote de US$920.
- Pronto quando: teste com loja online recomenda e-commerce sob consulta; teste de serviço local recomenda o Small website com US$920.

### OE-12 · Conteúdo da proposta e versões
- Gera as 6 seções do brief em inglês americano, curtas (leitura de 1 a 2 min). Cada edição salva nova versão.
- Pronto quando: texto passa nas regras de copy (sem travessão, sem promessa sem dado, sem depoimento ou logo inventado).

### OE-13 · Página pública
- `/opportunity/[token]` (`Proposta.html`, modelos A, B e C). Lê só o snapshot publicado, nunca a pesquisa interna.
- Token aleatório de 128 bits, `noindex`, Open Graph com nome do negócio e imagem LoWa, expiração e revogação (revogada responde 410).
- Pronto quando: abre em menos de 2 s no 4G; o HTML não contém nada de `research_findings`, notas ou confiança.

---

## Fase 4 · Revisão, abordagem e compartilhamento (Etapa 5)

### OE-14 · Revisão e publicação
- `Oportunidade.html`, estado Review: identidade, fontes, confiança, achados, serviço, preço, prévia da proposta, do e-mail e da DM.
- Ações: editar, regenerar insights, trocar serviço, trocar modelo, publicar (com confirmação), despublicar.
- LOW bloqueia publicar até a identidade ser confirmada.
- Pronto quando: nada é publicado sem o toque de aprovação.

### OE-15 · Mensagens e compartilhamento
- Três opções: Personal (só se "Met in person"), Instagram DM pedindo permissão, Email (só com e-mail verificado). Link da proposta inserido sozinho.
- Editar, copiar (com reserva para navegadores sem clipboard), compartilhar (Web Share), atalhos para WhatsApp e e-mail. Nada é enviado automaticamente.
- Copiar ou compartilhar oferece marcar como "Contacted" com data.
- Pronto quando: testes 12, 13 e 14 do brief passam num iPhone e num Android.

---

## Fase 5 · QA e entrega (Etapa 6)

### OE-16 · Segurança
- Auditoria de RLS, rotas de API, payload público e chaves (nenhuma chave secreta no bundle do cliente). Limite de uso nas rotas de pesquisa.
- Pronto quando: os testes 16 e 17 do brief passam.

### OE-17 · Testes de aceite
- Os 18 testes do brief, com negócios reais de teste, sem publicar nenhuma proposta de teste como oferta real (propostas de teste ficam revogadas).
- Mobile em 390px, desktop em 1440px, e o site institucional intacto (teste 18).

### OE-18 · Entrega
- Preview final com variáveis configuradas, guia curto de uso para a Sarah e o Marco.
- Produção só quando a Sarah disser "publish".
