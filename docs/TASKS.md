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

### OE-02 · Login ✅
Login testado pela Sarah em 22/11/2026 com hello@lowa-studio.com (código por e-mail via SMTP da Resend).
- `/discover/login` com link mágico por e-mail (Supabase Auth). Cadastro público desligado; só e-mails da tabela `team_members` entram.
- `middleware.ts` protege `/discover/*` e `/api/discover/*` (sem sessão: página vai para o login, API responde 401).
- Pronto quando: e-mail fora da lista é recusado com mensagem clara; sessão dura 30 dias no celular.

### OE-03 · Casca do app e PWA (código pronto; falta o teste de instalação no celular)
- Layout `app/(discover)/discover/layout.tsx` sem header e footer do site, tokens LoWa, barra inferior com o botão "New".
- Manifest com `scope: /discover` (sem barra final, para incluir a própria /discover; o service worker usa o cabeçalho `Service-Worker-Allowed`), ícones, `display: standalone`. Service worker só nesse escopo: guarda a casca e a tela de captura para abrir sem internet.
- Indicador de rede (online, offline, sincronizando).
- Pronto quando: instala na tela inicial do iPhone e do Android; abre offline na tela de captura; o site público não registra service worker.

### OE-04 · Nova oportunidade (captura) ✅
Testada no Chrome em 22/11/2026: validação, foto reduzida a 1600px, aviso de duplicado, captura offline na fila e sincronização sozinha. O botão diz "Save" até a pesquisa existir (OE-06), quando volta a ser "Analyze". "Use my location" depende da chave do Google.
- Formulário da referência `Nova.html`: obrigatórios nome e cidade; opcionais em "Add details" (site, Instagram, categoria, contato, onde encontrou, observação, foto). Escolha de um toque "Met in person / Found online".
- Cidade: sugestão pela localização do aparelho (com permissão) e últimas cidades usadas.
- Foto: comprimida no aparelho (máx. 1600px, JPG) e enviada para o bucket privado.
- Salva na hora e já dispara a pesquisa. Sem internet: vai para a fila local (IndexedDB) e sincroniza quando a rede voltar.
- Aviso de possível duplicado (nome parecido na mesma cidade), sem bloquear.
- Pronto quando: captura com só nome e cidade em menos de 30 s em 390px; captura offline aparece no painel como "Waiting for connection" e sincroniza sozinha.

### OE-05 · Painel e histórico ✅
Testado no Chrome em 22/11/2026: grupos, aba All com filtro, status em 1 toque com data de contato e histórico, notas, exclusão com confirmação (apaga também as fotos). Tempo com servidor aquecido: resposta em 0,6 s e tela em 1 s com 3 itens; o teste com 100 itens fica para a OE-17.
- `/discover`: botão grande "New opportunity", grupos Processing, Ready to share, Recent; aba "All" com filtro por status.
- Detalhe com status (lista do brief), datas (captura, contato), notas e histórico de status.
- Pronto quando: troca de status em 1 toque e registra data; lista carrega em menos de 1 s com 100 itens.

---

## Fase 2 · Pesquisa e análise (Etapa 3)

### OE-06 · Fila de pesquisa ✅
Testada no Chrome em 22/11/2026: a captura dispara a pesquisa em segundo plano; falha proposital em "Official website" deixou "Paused" e o Resume concluiu sem repetir "Business identity". As etapas ainda são provisórias (dizem em que tarefa chegam); as reais entram na OE-07 a OE-12. Teste em preview: abrir o detalhe com `?test=fail-website` (nunca funciona em produção).
- Tabela `research_jobs` com etapas (identidade, Google, site, redes, concorrentes e contexto, análise). Cada etapa é idempotente e salva o resultado ao terminar.
- Execução em segundo plano na Vercel (`after()` na rota que cria o job), até 3 tentativas por etapa; botão "Resume" retoma da etapa que falhou.
- Tela de andamento (`Oportunidade.html`, estado Researching) com etapas e resultados parciais.
- Pronto quando: derrubar uma etapa de propósito deixa a oportunidade em "Research paused" e o Resume conclui sem repetir as etapas prontas.

### OE-07 · Fornecedores de pesquisa ✅
Testada no Chrome em 23/11/2026 com um negócio real (Buddy Brew Coffee, Tampa; registro apagado depois): site oficial achado pela busca (buddybrew.com), loja Shopify, contatos, Instagram e Facebook candidatos e um concorrente local, cada achado com fonte, data, verificação e confiança (seção "Sources" do detalhe). Custo medido: US$ 0,15 a 0,17 por oportunidade em IA (Sonnet 5.5, 4 a 6 buscas), cerca de 1 minuto. Sem a chave do Google, a etapa "Business identity" é pulada e diz por quê; por isso o site ainda aparece como "Not verified" (a verificação cruzada depende do perfil do Google). Fornecedores em `lib/engine/providers/` (ai, search, places, reader, vision); leitor testado contra IP interno, porta local, metadados de nuvem, Instagram, robots.txt e tempo limite. Com a chave do Google (23/11/2026, segundo teste): 3 perfis da mesma rede em Tampa ficaram como "vários candidatos" (escolha na OE-08), mas como todos apontam o mesmo site, o site, os contatos, o Instagram e o Facebook ficaram verificados (link cruzado). Custo com Google: US$ 0,23 em IA, 1 consulta ao Google. "Use my location" devolveu "Tampa, FL". Falta testar: leitura de foto (sem foto no teste).
- Interfaces em `lib/engine/providers/` (search, places, page reader, vision, ai). Trocar fornecedor = trocar um arquivo.
- Google Places API (perfil, site, telefone, nota, link do Maps), busca na web da API do Claude, leitor de páginas no servidor (tempo limite, tamanho máximo, sem IP interno, respeita robots.txt), leitura de foto (cartão, vitrine) pela visão do Claude.
- Instagram e Facebook: só o link informado ou o que aparecer em resultado público de busca. Nada de login, raspagem ou contorno de bloqueio.
- Pronto quando: cada achado salvo tem fonte, data, status de verificação e confiança.

### OE-08 · Identidade e confiança ✅
Testada no Chrome em 23/11/2026 (registros de teste apagados depois). Teste 6 (identidade ambígua): Buddy Brew Coffee, Tampa, 3 perfis do Google com nome e cidade iguais ficaram LOW e "Verify"; a escolha de um deles refez a pesquisa e terminou em HIGH. Teste 5 (sem site identificável): Speckled Mug Pottery, Asheville, nenhum perfil com o mesmo nome; o site aparece como "No website found. Checked …" (nunca "não tem site"), status "Verify" com os 3 perfis próximos; "Neither of these" mais um @ de teste deixou a identidade confirmada e a nota em MEDIUM ("no website found; no contact found"). Adicionar e remover fonte à mão funcionam. Regras em `lib/engine/research/confidence.ts`; tela em `VerifyIdentity.tsx`, `AddSource.tsx`. O texto do brief com os testes 5 e 6 não está no repositório: os testes seguiram a descrição desta tarefa. Falta: repetir o teste 5 com um negócio real sem site na OE-17; ao remover um @ adicionado à mão, o campo Instagram da oportunidade continua preenchido.
- Regras de `ARQUITETURA.md` (HIGH, MEDIUM, LOW). Homônimo nunca é atribuído sem casar cidade e mais um dado (endereço, telefone, link cruzado).
- LOW vira status "Needs verification": a tela mostra os candidatos e a fundadora escolhe, corrige ou adiciona fontes à mão.
- Pronto quando: os testes 5 e 6 do brief passam (sem site identificável e identidade ambígua).

### OE-09 · Análise de oportunidades ✅
Testada no Chrome em 23/11/2026 com 3 negócios reais: Oxford Exchange (Tampa), French Broad Chocolates e Spicewalla (Asheville). Os três geraram 3 insights específicos cada (ex.: página de presentes ligada ao Holly Jolly Holidays e à loja Shopify; título do site que destaca o varejo quando o Google lista um restaurante; concorrente Kilwins no centro), cada frase marcada (fato verificado, observação, hipótese, recomendação) e com "Based on" das fontes. Modelos escolhidos: C, C e B. Serviço sugerido nos três: "Digital presence and growth" (já têm site e loja). Custo total da pesquisa com análise: US$ 0,17 a 0,27. "Regenerate" cria nova versão (v2 testada) e guarda as anteriores. Código em `lib/engine/research/analysis.ts` (etapa) e `insights.ts` (formatos); tela em `Analysis.tsx`. Guardas no servidor: insight sem fonte citada sai; "fato" só com fonte verificada; ausência ("não vimos") nunca é fato; número com % ou US$ que não está na fonte derruba o insight; jargão ("findings", "search results") e frases genéricas derrubam o insight; travessão vira vírgula. Com identidade em LOW, a análise espera a escolha da fundadora. Correção achada no teste: plural agora casa no nome ("Chocolates" e "Chocolate Lounge"). Preço do serviço fica para a OE-11; troca de modelo, para a revisão. Falta testar: negócio sem site (modelo A), que fica para a OE-17.
- Seis dimensões (descoberta, apresentação, experiência, conversão, retenção, sazonalidade). Saída estruturada com no máximo 3 insights, cada um com observado, por que importa, o que a LoWa faria e benefício qualitativo.
- Cada frase marcada como fato verificado, observação, hipótese ou recomendação. Sem números de receita ou conversão sem dado.
- Escolha automática do modelo de proposta (A, B ou C) e do serviço (só o id do catálogo).
- Pronto quando: 3 negócios reais de teste geram insights específicos (nenhum "your website could be better").

---

## Fase 3 · Catálogo e proposta (Etapa 4)

### OE-10 · Catálogo editável ✅
Testada no Chrome em 23/11/2026: o Small website foi de US$ 920 para 950, salvo e conferido depois de recarregar, e voltou para 920 (catálogo igual ao do início). Ativar a Landing page sem preço é bloqueado com "Add a price, or turn the service off until it has one." Tela em 390px e 1440px sem rolagem lateral, alvos de 44px. Código: `lib/engine/catalog.ts` (rótulos e formato do preço, usados também na OE-11), `catalog/actions.ts`, `ServiceCard.tsx`. O id (slug) de um serviço nunca muda e serviço não se apaga, só desativa. Duas pessoas editando o mesmo serviço: o segundo a salvar recebe aviso para recarregar, em vez de apagar a edição do outro. Travessão no texto é recusado. O campo "Rules for proposals" (notas internas) orienta a análise e nunca aparece para o cliente. A análise (OE-09) já lê o catálogo na hora em que roda. Que proposta publicada não muda fica garantido pelo snapshot da OE-13. Não testado: "Add service" (cada teste deixaria um serviço inativo que não se apaga pelo app) e o aviso de edição simultânea.
- `/discover/catalog` (`Catalogo.html`): nome, tipo de preço (fixo, a partir de, mensal, sob consulta), valor, pagamento, inclusões, exclusões, prazo, ativo.
- Pronto quando: a Sarah muda um preço pelo celular e a próxima proposta já usa o novo valor; propostas publicadas não mudam.

### OE-11 · Serviço e preço ✅
Testada no Chrome em 23/11/2026. Serviço local: Tampa Property Care (Tampa, faz-tudo e jardinagem, sem perfil no Google; a fonte foi a página dela no Thumbtack) recebeu o Small website por US$ 920 e o modelo A. Loja: Colleen Crafthouse (Tampa, arte em lã vendida na Mezzo Market, pedidos por mensagem no Instagram, segundo matéria do The Minaret de 20/04/2026) recebeu E-commerce, "Custom quote", sem valor. Na primeira rodada a IA sugeriu o Small website de US$ 920 para ela; por isso a guarda não depende só da IA: categoria Handmade ou Boutique sem loja online encontrada também conta como quem vende produtos, e quem vende produtos nunca recebe pacote de site com preço. "Change service" para Bigger website com 2 páginas extras mostrou "from $1,700" com a conta (4 páginas: $1,200; 2 extras a $250: $500). Quem já tem loja Shopify (Oxford Exchange, French Broad, Spicewalla) recebe "Digital presence and growth", sob consulta. Código: `lib/engine/pricing.ts` (o preço é calculado só ali, a partir da linha do catálogo; a IA dá só o id e as páginas extras). A escolha da fundadora fica salva e é mantida quando a análise roda de novo. Serviço desativado ou sem preço mostra aviso na tela. Correção achada no teste: um link adicionado à mão só vira o site do negócio quando é uma página inicial ou o domínio leva o nome do negócio; matéria ou página de terceiros fica como "Link".
- O preço vem só do catálogo. A IA indica o id do serviço e páginas extras sugeridas; o servidor calcula. "Custom quote" aparece como tal, sem valor.
- E-commerce nunca é apresentado como o pacote de US$920.
- Pronto quando: teste com loja online recomenda e-commerce sob consulta; teste de serviço local recomenda o Small website com US$920.

### OE-12 · Conteúdo da proposta e versões ✅
Testada no Chrome em 23/11/2026 com a Colleen Crafthouse (Tampa, sem site, vende por Instagram): a etapa "Proposal and messages" agora escreve o rascunho e deixa a oportunidade em "Draft ready". v1 saiu com 437 palavras (mais de 2 min); o pedido à IA foi encurtado e a v2 ("Regenerate draft") ficou com 331 palavras, cerca de 2 min, falando de loja online (serviço E-commerce). A IA escreve só as palavras: o bloco Investment vem do catálogo (aqui "Custom quote" com a nota de escopo, prazo e pagamento entre [colchetes] porque o catálogo ainda não tem, e o plano de manutenção de US$ 180/mês). Verificação de copy ao vivo no editor: travessão, "guarantee", "trusted by", porcentagem, "#1", prazo em horas, prêmio, emoji, palavras de hype e US$ fora do Investment. Teste: título com travessão, "Guaranteed" e "trusted by 500 clients" mostrou 3 problemas; corrigido, passou e salvou como v3 (versões anteriores guardadas, lista "3 versions"). Edição de duas pessoas: quem salva sobre versão velha recebe aviso para recarregar. Tela em 390px e 1440px sem rolagem lateral. Código: `lib/engine/proposal.ts` (formato, verificação de copy, tempo de leitura), `research/draft.ts` (etapa), `proposal-actions.ts` e `ProposalDraft.tsx`. Não testado: modelos B e C com o texto novo; oportunidade antiga com análise e sem rascunho só ganha rascunho pelo "Regenerate" da análise.
- Gera as 6 seções do brief em inglês americano, curtas (leitura de 1 a 2 min). Cada edição salva nova versão.
- Pronto quando: texto passa nas regras de copy (sem travessão, sem promessa sem dado, sem depoimento ou logo inventado).

### OE-13 · Página pública ✅
Testada no Chrome em 23/11/2026 com a Colleen Crafthouse (modelo A, E-commerce, Custom quote): publicada, aberta, despublicada. Link de 22 caracteres (128 bits); a página lê só `proposal_snapshots.public_content` (cópia congelada com nome, cidade, as 6 seções e o preço já calculado). No HTML publicado não aparece nada de `research_findings`, notas, confiança, verificação nem o id interno. Token desconhecido ou malformado: 404. Despublicar: 410 na hora, com página curta e o e-mail hello@lowa-studio.com (expirado também responde 410). Cabeçalhos: `noindex, nofollow` e `Referrer-Policy: no-referrer`; `/opportunity/` já estava fora do robots.txt. Open Graph: título "A proposal for [negócio] · LoWa Studio", descrição do hero e imagem LoWa única em `/opportunity/og` (sem nome do cliente). Texto entre [colchetes] aparece marcado como pendente (aqui pagamento e prazo, que faltam no catálogo). Para testar foi preciso publicar: entrou um quadro "Public link" no detalhe com Publish (segundo toque confirma), Copy link e Unpublish; um link por oportunidade, e publicar de novo troca o conteúdo sem mudar o link. A tela completa de revisão continua na OE-14. Tempo: resposta do servidor em cerca de 0,5 s e 26 KB de HTML; não medido em 4G real nem no PageSpeed (a preview pede login da Vercel). 390px e 1440px sem rolagem lateral. Código: `lib/engine/publish.ts`, `lib/engine/gone.ts`, `middleware.ts` (410), `app/opportunity/[token]/page.tsx`, `app/opportunity/opportunity.css`, `app/opportunity/og/route.tsx`, `PublishBox.tsx`. Não testado: modelos B e C na página (sem rascunho B ou C novo), acento por categoria do DESIGN.md (não feito), fonte serifada na imagem de compartilhamento (usa a fonte padrão). A linha "Source: ..." sob cada insight só aparece quando a fonte é um canal do negócio (site, Google, Instagram, loja); na Colleen as fontes eram nota e artigo, então não apareceu.
- `/opportunity/[token]` (`Proposta.html`, modelos A, B e C). Lê só o snapshot publicado, nunca a pesquisa interna.
- Token aleatório de 128 bits, `noindex`, Open Graph com nome do negócio e imagem LoWa, expiração e revogação (revogada responde 410).
- Pronto quando: abre em menos de 2 s no 4G; o HTML não contém nada de `research_findings`, notas ou confiança.

---

## Fase 4 · Revisão, abordagem e compartilhamento (Etapa 5)

### OE-14 · Revisão e publicação ✅
Testada no Chrome em 23/11/2026 com a Colleen Crafthouse. O detalhe virou a tela de revisão: no celular, uma coluna na ordem do trabalho (pesquisa, identidade, achados, recomendação, publicar, rascunho, fontes, status, captura, notas, histórico); a partir de 1100px, duas colunas (dados à esquerda; oferta, publicação e rascunho à direita). Novo quadro "Identity" (Google, site, Instagram, Facebook, e-mail, cada um com o estado). Troca de modelo A, B ou C reescreve o rascunho (testado A para B, v5, e de volta para A, v6); a escolha da fundadora fica quando a análise roda de novo. "Preview" abre `/discover/preview/[id]` com a página exatamente como seria publicada, com o preço do catálogo daquele momento (e cada versão tem seu Preview). Publicar pede o segundo toque e só libera quando a lista "Before publishing" está vazia; as mesmas regras rodam no servidor (`lib/engine/publish-check.ts`): identidade LOW ou em Verify, serviço desligado ou sem preço, rascunho que oferece outro serviço ou foi escrito para outro modelo, e problemas de copy. Testado: trocar o serviço sem regenerar bloqueou com "The draft offers E-commerce, but the recommendation is now Small business website" e o botão ficou desligado; voltar o serviço liberou. Publicado (v6), página pública 200, despublicado, 410. Negócio em Verify (Black Trumpet Farm) não tem rascunho nem botão de publicar. Correções achadas no teste: a linha "Source: ..." da OE-13 nunca era gravada; agora é, mas só para achado verificado com endereço real (o teste mostrou "Source: your website" numa empresa sem site, por citar o achado "No website found"). Análises antigas não guardavam a regra do modelo, então nelas a tela diz só "You chose this template" até a próxima análise. Telas em 390px e 1440px sem rolagem lateral. Fica para a OE-15: prévia do e-mail e da DM (as mensagens nascem lá). Não testado: bloqueio LOW de um negócio que já tenha rascunho (só pelo código), barra fixa de Publicar no rodapé do protótipo (no app a barra de abas ocupa esse lugar; o botão fica no quadro Publish).
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
