# Arquitetura · LoWa Opportunity Engine

## Princípios

- O site público não muda. O Engine vive em grupos de rotas próprios e não carrega nada nas páginas do site.
- Três camadas separadas: app privado (`/discover`), dados internos (Supabase, só servidor e usuários logados) e proposta pública (`/opportunity/[token]`, lê apenas um snapshot sem dados internos).
- Toda chamada de IA, busca e banco com chave secreta roda no servidor. Nenhuma chave secreta no navegador.
- Fornecedores trocáveis: cada integração implementa uma interface em `lib/engine/providers/`.
- Nada é enviado ou publicado sem o toque de aprovação da fundadora.

## Rotas

| Rota | Tipo | Acesso |
|---|---|---|
| `/discover/login` | página | pública, noindex |
| `/discover` | painel | logado |
| `/discover/new` | captura | logado, abre offline |
| `/discover/o/[id]` | andamento, revisão, mensagens, histórico | logado |
| `/discover/catalog` | catálogo editável | logado |
| `/api/discover/*` | API interna | logado (401 sem sessão) |
| `/opportunity/[token]` | proposta | pública por link, noindex |

Estrutura de pastas nova:

```
app/(discover)/discover/      telas do app (layout próprio, sem Nav/Footer do site)
app/opportunity/[token]/      proposta pública (layout próprio)
app/api/discover/             rotas de API do app
lib/engine/                   pipeline, regras de confiança, preço, prompts
lib/engine/providers/         ai, search, places, reader, vision, storage
supabase/migrations/          SQL versionado
public/discover/              manifest, ícones, service worker
```

## Stack nova

| Item | Escolha | Por quê |
|---|---|---|
| Banco, login, arquivos | Supabase (Postgres, Auth com link mágico, Storage privado) | Um serviço só, RLS por usuário, plano gratuito cobre o volume |
| IA | API do Claude (`@anthropic-ai/sdk`), modelo em `AI_MODEL` | Saída estruturada, visão para fotos, busca na web nativa |
| Busca na web | Ferramenta de busca da API do Claude | Sem segundo fornecedor; resultado vem com URL de origem |
| Perfil do Google | Google Places API (New), Text Search | Fonte oficial: site, telefone, endereço, nota, link do Maps |
| Validação | `zod` | Valida entrada da API e saída da IA |
| Tarefas longas | `after()` do Next na Vercel + etapas salvas no banco | Sem fila externa no MVP; retomável |
| Offline | IndexedDB (fila local) + service worker com escopo `/discover/` | Captura sem internet |

Nenhuma biblioteca pesada de UI. As telas usam CSS próprio com os tokens LoWa.

## Banco (resumo)

| Tabela | Campos principais |
|---|---|
| `team_members` | e-mail, nome (quem pode usar o app) |
| `opportunities` | id, nome, cidade, região/país, site, instagram, categoria, contato, onde encontrou, observação, como conheceu (`in_person` ou `online`), status, confiança, modelo (A, B, C), datas (captura, contato), criado por |
| `opportunity_photos` | id, opportunity_id, caminho no Storage, texto extraído |
| `research_jobs` | id, opportunity_id, etapa, status (`queued`, `running`, `done`, `failed`), tentativas, erro, início, fim |
| `research_findings` | id, opportunity_id, tipo (site, google, instagram, facebook, loja, contato, avaliação, catálogo, concorrente, contexto), achado, URL da fonte, verificação (`verified`, `unverified`, `rejected`), confiança (`high`, `medium`, `low`), checado em, origem (`auto` ou `manual`) |
| `analyses` | id, opportunity_id, versão, dimensões, insights (máx. 3, cada frase com tipo: fato, observação, hipótese, recomendação), serviço sugerido, modelo sugerido, criado em |
| `services` | id, slug, nome, categoria, tipo de preço (`fixed`, `from`, `monthly`, `custom`), valor em centavos (USD), unidade, extra por página, pagamento, inclusões, exclusões, prazo, ativo, ordem |
| `proposals` | id, opportunity_id, versão, conteúdo editável, serviço escolhido, status (`draft`, `published`, `revoked`), aprovado por, aprovado em |
| `proposal_snapshots` | token (único), proposal_id, conteúdo público congelado (JSON só com o que o cliente vê, preço já calculado), publicado em, expira em, revogado em |
| `outreach_messages` | id, opportunity_id, tipo (`personal`, `instagram_dm`, `email`), texto, editado, copiado em |
| `status_history` | id, opportunity_id, de, para, por, em, nota |

RLS: todas as tabelas exigem usuário logado e na lista. A página pública lê `proposal_snapshots` pelo servidor, por token, e só a coluna de conteúdo público.

Duplicados: `pg_trgm` no nome normalizado + cidade; similaridade alta mostra aviso antes de salvar, sem bloquear.

## Pipeline de pesquisa

Etapas, em ordem, cada uma salva ao terminar:

1. **Foto** (se houver): extrai nome, site, Instagram, telefone do cartão ou vitrine. Resultado entra como sugestão, não como fato.
2. **Identidade**: Places Text Search com nome + cidade. Guarda até 3 candidatos.
3. **Site oficial**: o informado, ou o do perfil do Google, ou candidato da busca. O leitor abre a home e até 3 páginas internas.
4. **Redes e loja**: busca na web por Instagram, Facebook e loja online. Perfil só conta como verificado com link cruzado (site aponta para ele, ou ele aponta para o site, ou bate com o informado).
5. **Contexto**: até 3 concorrentes locais relevantes e contexto sazonal ou de mercado da cidade.
6. **Análise**: IA gera dimensões, insights, serviço e modelo, com base só nos achados salvos.
7. **Rascunho**: proposta e as três mensagens.

Falha numa etapa: até 3 tentativas com espera crescente; depois a oportunidade mostra "Research paused" e o botão Resume. Etapas prontas nunca rodam de novo, salvo em "Regenerate".

## Confiança

| Nível | Regra |
|---|---|
| HIGH | Identidade confirmada (nome + cidade + um dado extra: endereço, telefone ou link cruzado) e canais relevantes verificados |
| MEDIUM | Identidade confirmada, mas falta informação importante (sem site, redes não confirmadas, sem contato) |
| LOW | Mais de um candidato plausível, nenhum candidato, ou nome sem cidade compatível |

LOW: status "Needs verification", publicação bloqueada até a fundadora escolher o candidato certo ou adicionar uma fonte. Ausência de resultado nunca vira "o negócio não tem site": vira "no website found" com a busca feita e a data.

## Escolha do modelo de proposta

- **A, The missing website**: nenhum site oficial verificado.
- **B, The growth opportunity**: site oficial verificado.
- **C, The seasonal opportunity**: a análise marca sazonalidade forte (produto de presente, data comemorativa próxima, evento local) e ela é um dos 3 insights.
- A fundadora pode trocar na revisão.

## Preço

- A IA devolve apenas `service_slug` e, se for o caso, número de páginas extras sugeridas.
- O servidor calcula o valor a partir de `services`. Tipo `custom` mostra "Custom quote" sem valor.
- O snapshot publicado congela o serviço e o valor. Mudar o catálogo não altera propostas já publicadas.

## Segurança e privacidade

- Login só para e-mails da tabela `team_members` (a Sarah edita no painel do Supabase); cadastro público desligado. A mesma tabela alimenta a RLS (`is_team()`).
- Token da proposta: 128 bits aleatórios em base64url (22 caracteres). Expira em 60 dias por padrão; revogar responde 410.
- Página pública: `noindex, nofollow`, sem pesquisa, notas, confiança, contato pessoal ou observação da fundadora.
- Leitor de páginas: só `http`/`https`, bloqueia IPs privados e locais, tempo limite de 8 s, máximo de 2 MB, respeita robots.txt.
- Sem raspagem do Instagram, sem login em plataformas, sem envio automático, sem disparo em massa.
- Dados pessoais: só o necessário (nome do contato e e-mail comercial). Botão para apagar uma oportunidade com tudo que é dela.
- E-mail: o app só prepara o texto. Se um dia enviar e-mail pelo sistema, incluir identificação do remetente, endereço físico e opção de descadastro (CAN-SPAM).

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente e servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente e servidor | chave pública (protegida pela RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | só servidor | pipeline e leitura do snapshot público |
| `ANTHROPIC_API_KEY` | só servidor | IA, visão e busca na web |
| `AI_MODEL` | só servidor | modelo padrão (`claude-sonnet-5-5`) |
| `GOOGLE_PLACES_API_KEY` | só servidor | perfil do Google |
| `PUBLIC_BASE_URL` | só servidor | domínio usado nos links das propostas |

Ficam na Vercel (Preview e Production), criadas pela integração do Supabase. A Vercel não libera essas chaves para Development, então o Engine é testado nos deploys de preview, não em `npm run dev`. Nunca no código.

### Migrações novas

Cada arquivo novo em `supabase/migrations/` é testado com `npm run test:db` e aplicado colando o conteúdo no SQL Editor do Supabase, terminando com `insert into supabase_migrations.schema_migrations (version, name) values (...)`. Se um dia houver acesso direto ao banco, `npm run db:migrate` faz o mesmo e pula o que já foi aplicado.
