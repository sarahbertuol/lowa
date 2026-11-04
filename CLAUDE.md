# LoWa Studio, marketing site

Static marketing site for LoWa Studio, a US-only production studio that sells AI-built websites to small US agencies. Starting offer: US$920 (Small website). Deploy target: Vercel. Do not use Webflow.

## Current state
- `index.html` is the finished Home page, self-contained (inline CSS, no build step). It is the visual source of truth.
- Visual direction follows the approved reference: apricot sunset hero, cream ground, butter wordmark, dusty-sky band, brown proof card, blue calls to action (text and borders).
- Fonts (Google Fonts): Instrument Serif (italic accents), Familjen Grotesk (body), Space Mono (labels).

## Tokens (keep in sync if you extract them)
- sunset #EDB08A, cream #F7F0E6, paper #FFFFFF, butter #F4DFA4, brown #4A2415, sky #B5D6DF, ink #3A1E12, muted #7A5A4C, blue #2F6F86, line #E7D6C6.
- Calls to action: blue. Primary is a blue pill with butter sweep on hover. Secondary is a blue outlined pill.
- Light theme only. Do not add dark mode without approval.

## Tasks, in order
1. Split `index.html` into a proper structure (Vercel static, or Next.js if you prefer), keeping the look identical. Move tokens into CSS variables in one file.
2. Build the pages linked from the nav and footer: `/about`, `/services` (aligned with the Pricing section), `/contact` with the 3-minute briefing form.
3. Briefing form: fields for name, agency, email, website goal, audience, deadline, and a short "what you need" select. No submission endpoint is decided yet, so keep the form handler as a stub that shows a clear thank you state and logs nothing to third parties.
4. Replace the colour blocks in the hero, cards, case studies and founder tiles with real images once provided. Keep the aspect ratios and rounded frames.
5. SEO and social: unique `<title>`, meta description, Open Graph image, canonical URL, favicon. Language `en`.
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
