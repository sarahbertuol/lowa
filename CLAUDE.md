# LoWa Studio, marketing site

Static marketing site for LoWa Studio, a US-only production studio that sells AI-built websites to small US agencies. Starting offer: US$920 (Small website). Deploy target: Vercel. Stack: Next.js (App Router), TypeScript, no Webflow.

## Current state
- Built in Next.js. `app/page.tsx` is the Home page, `app/globals.css` holds the tokens and styles. `reference/home-v4.html` is the approved static version kept as the visual source of truth.
- Interactions already in place: pointer parallax on the hero frames, scroll-linked process timeline, reveal on scroll, mobile menu, validated briefing form (stub, no submission).
- Run locally: `npm install`, then `npm run dev`.
- Visual direction follows the approved reference: apricot sunset hero, cream ground, butter wordmark, dusty-sky band, brown proof card, blue calls to action (text and borders).
- Fonts (Google Fonts): Instrument Serif (italic accents), Familjen Grotesk (body), Space Mono (labels).

## Tokens (keep in sync if you extract them)
- sunset #EDB08A, cream #F7F0E6, paper #FFFFFF, butter #F4DFA4, brown #4A2415, sky #B5D6DF, ink #3A1E12, muted #7A5A4C, blue #2F6F86, line #E7D6C6.
- Calls to action: blue. Primary is a blue pill with butter sweep on hover. Secondary is a blue outlined pill.
- Light theme only on the main site. Do not add dark mode there without approval. (Exception approved in the proposal brief: /proposal/[slug] follows prefers-color-scheme.)

## Tasks, in order
1. Done: Next.js structure, tokens in `app/globals.css`. Next: review on mobile and tighten spacing.
2. Done: `/about`, `/services`, `/contact` with the briefing form. Next: add real copy review and a styled 404.
3. Contact forms (agency briefing and business owners, on /contact) send to `/api/contato`, which emails them via Resend (env vars RESEND_API_KEY, PROPOSTA_TO=hello@lowa-studio.com, PROPOSTA_FROM, optional PROPOSTA_CC, in Production and Preview). If sending fails, the form opens WhatsApp 5554981490779 with the message ready. Honeypot field `contato_alt`, 5 sends per 10 min per IP.
4. Replace the colour blocks in the hero, cards, case studies and founder tiles with real images once provided. Keep the aspect ratios and rounded frames.
5. SEO and social: titles, descriptions and canonicals are in place. Still missing: an Open Graph image at `public/og.png` (1200x630). Domain: www.lowa-studio.com (set in `app/layout.tsx`).
6. Performance: target PageSpeed 90+ on mobile. No heavy libraries. Preload the Google Fonts used above, with `display=swap`.
7. Accessibility: check contrast of the blue text on cream and on the sky band, visible focus, reduced motion (already set).
8. SITE-01 (26/11/2026, aguardando aprovação do protótipo `docs/referencia/Business.html`): página `/business` para donos de negócio, a do QR das feiras. Fora do menu, noindex, fora do sitemap. Black Friday: Small website a US$ 500 (de US$ 920) para projetos confirmados até 04/12/2026; tirar a promoção no dia 05/12. Usa o DirectForm e os cards reais do WorkGrid. Home passa a dizer que atende agências e donos de negócio, com o mesmo preço público (US$ 920) e link para /contact#direct, nunca para a promoção.

## Copy rules
- No em dashes (—) anywhere in the copy. Use commas, colons or parentheses.
- Keep the lead claims true. "Live in 24 hours" and "Free hosting forever" were removed from the site on 26/11/2026: do not bring them back until Sarah confirms the turnaround and the hosting condition. "2 slots left this month" is a business promise: confirm before publishing and update monthly.
- Prices are fixed: Small website US$920 (Home, About, Contact, CMS panel included). Bigger websites from US$1,200 (4+ pages), US$250 per extra page. Monthly maintenance US$180/month.
- Founders: Sarah Bertuol (projects) and Marco (co-founder). Do not add titles or bios beyond what is here without asking.

## Do not
- Do not publish to a custom production domain without explicit approval from Sarah. Deploy previews to Vercel first.
- Do not invent client testimonials, logos or results. The three case cards (Wottrich Advocacia, Simplifique Capital, Fabiana Campos) are placeholders in copy: confirm the wording with the client before going live.
- Do not change the palette or fonts without asking.

## Open items for Sarah
- Real photos (hero frames, intro frame, founders, case shots).
- About: the short journey of Sarah B. and Marco K. (two milestones each; the Journey list was removed from the page until they arrive). Copy of the "Our story" section to review (Walter, Lorena due March 2027, LoWa = Lorena + Walter).
- Free hosting condition and the real turnaround (both removed from the site until confirmed).
- Email: hello@lowa-studio.com should forward to Sarah's Gmail (Cloudflare Email Routing; the DNS is on GoDaddy today). Resend domain lowa-studio.com to verify, then the env vars on Vercel.
- Trademark search for LoWa Studio (US classes 35 and 42) before launch.

## Opportunity Engine (`/discover` e `/opportunity/[token]`)

App interno para captar negócios e gerar propostas. Antes de qualquer código dele, leia: `docs/TASKS.md` (uma tarefa por vez, códigos OE-xx), `docs/ARQUITETURA.md`, `docs/DESIGN.md`, `docs/INTERACOES.md`, `docs/PENDENCIAS.md` e só o protótipo da tarefa em `docs/referencia/`.
- Não altera o site público nem as propostas de agência em `/proposal/[slug]`.
- Trabalhar em branch `engine/...`; a `main` publica em lowa-studio.com. Deploy só de preview.
- Preço vem só do catálogo (tabela `services`), nunca da IA. Nada é publicado ou enviado sem aprovação da fundadora.
- Interface e propostas em inglês americano; docs e commits em português.

## Contexto de negócio

- Foco do site: AGÊNCIAS e DONOS DE NEGÓCIO (decisão de 26/11/2026). A agência parceira usa a LoWa Studio para criar sites para os clientes dela; o dono de negócio contrata direto.
- Preço público igual para os dois (Small website US$ 920). Desconto para dono de negócio só em página fora do menu e com noindex (ex.: /business no Black Friday) ou na proposta, nunca na home: a agência não pode ver preço direto menor que o dela.
- A proposta mostra primeiro o que já foi feito no site da agência (ex.: Gampi) e depois as soluções que a agência pode vender aos próprios clientes.
- Propostas ficam em /proposal/[slug]. Não aparecem no menu, não têm links de entrada, usam noindex/nofollow e são excluídas do robots.txt.
- Novo cliente = novo arquivo em data/proposals/[slug].ts. Nunca criar uma página nova por cliente.
- A lista "servicos" com o campo "match" decide o que é destacado para cada cliente.
- Nunca usar travessão (—) em nenhum texto da interface. Usar vírgula, dois-pontos ou parênteses.
- Textos em português com acentuação correta.

## Propostas: como funciona no código

- Página: `app/proposal/[slug]/page.tsx` (fora do grupo `app/(site)`, por isso sem header e footer do site). Estilos em `app/proposal/proposal.css`.
- Dados: `data/proposals/[slug].ts` exporta `proposal` (formato em `data/proposals/types.ts`). As páginas são geradas a partir dos arquivos dessa pasta, então basta duplicar `gampi.ts` e trocar o `slug`.
- Logo do cliente em `public/proposals/[slug]/logo.svg`. Se faltar, a página mostra o nome do cliente no lugar.
- A cor primária do cliente vira acento; `lib/proposal-color.ts` ajusta os tons para manter contraste AA.
- Marca: tudo é LoWa Studio (não usar Walter Web Works nem WWW).
- Os prints do PSI não aparecem na página: no lugar, um aviso com a data da medição.
- Pendências da Gampi: logo, laranja exato, nome do contato, métricas LCP/CLS/TBT/FCP.
- Hero das propostas: cena do Walter brincando com a bolinha (`components/proposal/WalterScene.tsx`, CSS "Walter scene" em `proposal.css`). Quadros em `public/walter/scene/`: watch = pose 03 do pacote, run e mouth = poses novas enviadas pela Sarah em 05/11/2026, todas espelhadas para olhar para a esquerda.
