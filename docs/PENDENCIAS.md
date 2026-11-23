# Pendências · LoWa Opportunity Engine

Itens que dependem da Sarah ou do Marco. No código aparecem como `[colchetes]`.

## Contas e chaves (só a Sarah pode criar)

- [x] Projeto no Supabase criado pela Vercel (22/11/2026), chaves só em Preview e Production
- [ ] Chave da API da Anthropic (console.anthropic.com), com limite de gasto mensal definido
- [ ] Chave do Google Places API (New) no Google Cloud, restrita ao Places, com limite diário
- [x] Login do app: hello@lowa-studio.com (conta única da Sarah e do Marco), cadastrado em `team_members`
- [ ] Vercel: confirmar se a `main` deste repositório publica direto em lowa-studio.com

## Marca e contato

- [x] Domínio oficial das propostas: lowa-studio.com (decisão de 22/11/2026, a partir do e-mail hello@lowa-studio.com). O `layout.tsx` do site ainda usa lowastudio.com
- [x] E-mail de contato das propostas: hello@lowa-studio.com (o site ainda mostra hello@lowastudio.com)
- [ ] WhatsApp e link de agenda para o "Next step" da proposta (opcionais)
- [ ] Ícone do app para a tela inicial. Provisório desde a OE-03: "LoWa" em Instrument Serif butter sobre sunset (`lib/engine/app-icon.tsx`). Trocar quando a Sarah mandar o definitivo

## Comercial

- [ ] Confirmar se "Live in 24 hours" pode aparecer nas propostas e em que condições
- [ ] Condição do "Free hosting forever*". Até lá, propostas não mencionam hospedagem grátis
- [ ] Forma de pagamento padrão por serviço (ex.: 50% na entrada e 50% na entrega)
- [ ] Preço e escopo do Landing page
- [ ] Texto e condições da oferta para agências (white label, gestão de projetos Webflow)
- [ ] Moeda: propostas só em USD ou também em outra moeda quando o negócio for de fora dos EUA

## Configuração do login no Supabase (OE-02)

- [x] Authentication > URL Configuration: Site URL `https://www.lowa-studio.com`; Redirect URLs `https://www.lowa-studio.com/discover/**` e `https://*-sarah-b-s-projects.vercel.app/discover/**`
- [x] Authentication > Emails > Magic Link: assunto e corpo de `docs/supabase/email-magic-link.html` (código de 8 dígitos, como o Supabase está configurado, + link)
- [x] Authentication > Sign In / Providers: desligar "Allow new users to sign up" (o app cria a conta da equipe sozinho)
- [x] SMTP próprio (Resend) configurado em Authentication > Emails > SMTP

## Produto

- [ ] Idioma da interface do app (`/discover`): inglês, como o brief e o site, ou português
- [ ] Prazo padrão de expiração das propostas (sugestão: 60 dias)
- [ ] Usar foto real do negócio na proposta só com permissão: confirmar a regra (marcar "OK to use" basta, ou pedir ao dono)

## Testes e endereços (OE-04)

- Preview fixo para testes e para o app instalado: https://lowa-discover-sarah-b-s-projects.vercel.app/discover (aponta para o último deploy de preview do Engine)
- [ ] "Use my location": a chave do Google precisa ter também a Geocoding API ligada (além da Places API)
- [x] Registros de teste da OE-04 apagados pelo próprio app em 22/11/2026
