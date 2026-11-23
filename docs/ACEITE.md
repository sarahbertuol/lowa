# Testes de aceite do Opportunity Engine (OE-17)

Rodados em 23/11/2026 no preview `lowa-discover-sarah-b-s-projects.vercel.app` (deploy lowa-f1pf3wwcq), no Chrome logado como Sarah.

O texto do brief com os 18 testes não está no repositório. Esta lista foi remontada a partir dos critérios "Pronto quando" de cada tarefa e dos números citados no TASKS (5, 6, 12 a 14, 16 a 18). **Sarah: conferir com o brief original** e apontar o que faltar.

Legenda: ✅ passou hoje · ☑️ passou na tarefa de origem, não repetido hoje · ⏳ falta, precisa da Sarah ou de um celular

| # | Teste | Resultado |
|---|---|---|
| | **Base** | |
| | Banco: chave anônima não lê nenhuma tabela; quem não é da equipe não vê nem cria nada (OE-01) | ✅ `npm run test:db`, todos passam |
| | Login: e-mail fora da lista é recusado com mensagem clara; sessão de 30 dias (OE-02) | ☑️ OE-02 (hoje eu já estava logado) |
| | App instala na tela inicial do iPhone e do Android e abre offline na captura (OE-03) | ⏳ celular |
| | Captura com nome e cidade em menos de 30 s (OE-04) | ✅ Buddy Brew Coffee, Tampa: digitar o nome, um toque e Analyze, uns 10 s |
| | Captura offline fica "Waiting for connection" e sincroniza sozinha (OE-04) | ☑️ OE-04 |
| | Troca de status em 1 toque, lista rápida (OE-05) | ✅ painel em 0,5 a 1 s com 9 itens (não testado com 100) |
| | **Pesquisa** | |
| | Etapa derrubada pausa a pesquisa e o Resume conclui sem repetir etapas (OE-06) | ☑️ OE-06 |
| | Cada achado tem fonte, data, verificação e confiança (OE-07) | ✅ Buddy Brew |
| 5 | Negócio real sem site identificável: "No website found", nunca "não tem site" | ⏳ testado na OE-08 com um nome de teste; falta um negócio real sem site (preciso de uma sugestão sua) |
| 6 | Identidade ambígua vai para Verify e a escolha refaz a pesquisa | ✅ Buddy Brew: 3 perfis com nome e telefone iguais, LOW e Verify; escolhido o da Kennedy Blvd, terminou HIGH com rascunho e mensagens (US$ 0,27 de IA) |
| | Insights específicos, nada genérico (OE-09) | ✅ Buddy Brew: assinatura de café no Shopify, página para o Gasparilla, roteamento de contato |
| | **Oferta e proposta** | |
| | Preço só do catálogo: serviço local com Small website a US$ 920; loja com serviço sob consulta (OE-11) | ✅ Tampa Property Care US$ 920; Buddy Brew "Digital presence and growth", Custom quote sem valor. ☑️ e-commerce na OE-11 |
| | Novo preço do catálogo vale para a próxima proposta e não muda a publicada (OE-10) | ✅ Small website mudado para US$ 930: prévia mostrou 930, a proposta publicada continuou 920; preço voltou para 920 |
| | Copy sem travessão, sem preço no texto da IA, sem depoimento ou logo inventado (OE-12) | ✅ páginas públicas da Buddy Brew e da Tampa Property Care sem travessão; só os valores do bloco Investment |
| | Nada é publicado sem o segundo toque de aprovação (OE-14) | ✅ "Publish proposal" pede "Yes, publish" |
| | Página pública abre em menos de 2 s e não contém pesquisa, notas nem confiança (OE-13) | ✅ 200 em 1,3 s (wi-fi, não 4G), 30 KB, noindex, nenhum termo interno, telefone ou nota |
| | Revogar responde 410 | ✅ Buddy Brew e Tampa Property Care revogadas, 410 |
| 12 a 14 | Mensagens Personal, Instagram DM e Email: editar, copiar, compartilhar, marcar contato | ✅ no Chrome (OE-15); ⏳ iPhone e Android reais |
| | **Segurança** | |
| 16 e 17 | Sem login nada abre; fora da equipe nada roda; nenhuma chave no navegador; limite de uso | ✅ chaves (varredura dos arquivos do navegador) e cabeçalhos; ⏳ sem login e fora da equipe (a Vercel pede login no preview: testar em produção ou com chave de bypass) |
| | **Telas e site** | |
| | 390px: painel, nova oportunidade, catálogo, oportunidade, prévia, sem rolagem lateral, alvos de 44px | ✅ (interruptores do catálogo ficam dentro de linhas de 48px) |
| | 1440px | ✅ nas OE-14 e OE-15 (a janela de teste ficou maior, 1920px, mesmo layout de duas colunas) |
| 18 | Site institucional intacto | ✅ nenhum arquivo do site mudou em relação à `main` (só robots.txt ganhou 3 linhas bloqueando /opportunity, /discover e /api); /, /about, /services e /contact em 200 com os títulos de sempre; o service worker só existe em /discover |

## Achados para decidir

- **Calendário do modelo C (sazonal):** mostra o mês atual, de hoje até o fim do mês, como no protótipo. Na Buddy Brew o título fala do Gasparilla (janeiro), o calendário mostra novembro e a legenda é de outro insight (assinatura no Shopify). Opções: legenda passar a ser o insight sazonal, ou o calendário mostrar o mês do evento. Não mudei sem você.
- **Mudança feita no teste:** `X-Frame-Options` passou de DENY para SAMEORIGIN (mais `frame-ancestors 'self'`). Outros sites continuam sem poder embutir o app; o próprio domínio pode, o que permite os testes em 390px.

## Registros de teste no banco

Buddy Brew Coffee (nova), Tampa Property Care (agora com Small website escolhido e rascunho v1), Colleen Crafthouse (Contacted, e-mail de teste owner@example.com), Black Trumpet Farm, Wildgoods, Spicewalla, Oxford Exchange, French Broad Chocolates. CAVA é da Sarah. Nenhuma proposta publicada. Apagados em 23/11/2026 com a confirmação da Sarah; só a CAVA ficou.
