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
3. Briefing form: fields for name, agency, email, website goal, audience, deadline, and a short "what you need" select. No submission endpoint is decided yet, so keep the form handler as a stub that shows a clear thank you state and logs nothing to third parties.
4. Replace the colour blocks in the hero, cards, case studies and founder tiles with real images once provided. Keep the aspect ratios and rounded frames.
5. SEO and social: titles, descriptions and canonicals are in place. Still missing: an Open Graph image at `public/og.png` (1200x630), and the final domain in `app/layout.tsx` (currently www.lowastudio.com, unconfirmed).
6. Performance: target PageSpeed 90+ on mobile. No heavy libraries. Preload the Google Fonts used above, with `display=swap`.
7. Accessibility: check contrast of the blue text on cream and on the sky band, visible focus, reduced motion (already set).

## Copy rules
- No em dashes (—) anywhere in the copy. Use commas, colons or parentheses.
- Keep the lead claims true. "Live in 24 hours" and "2 slots left this month" are business promises: confirm before publishing and update monthly.
- "Free hosting forever*" needs a footnote with the real condition, which is still pending from Sarah. Do not invent it.
- Prices are fixed: Small website US$920 (Home, About, Contact, CMS panel included). Bigger websites from US$1,200 (4+ pages), US$250 per extra page. Monthly maintenance US$180/month.
- Founders: Sarah Bertuol (projects) and Marco (co-founder). Do not add titles or bios beyond what is here without asking.

## Do not
- Do not publish to a custom production domain without explicit approval from Sarah. Deploy previews to Vercel first.
- Do not invent client testimonials, logos or results. The three case cards (Wottrich Advocacia, Simplifique Capital, Fabiana Campos) are placeholders in copy: confirm the wording with the client before going live.
- Do not change the palette or fonts without asking.

## Open items for Sarah
- Real photos (hero frames, intro frame, founders, case shots).
- Free hosting condition (for the footnote).
- Briefing form destination (email, CRM or form service).
- Domain: lowastudio.com availability (to check manually) and trademark search for LoWa Studio (US classes 35 and 42) before launch.

## Contexto de negócio

- Foco do site: vender para AGÊNCIAS. A agência parceira usa a LoWa Studio para criar sites para os clientes dela.
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
