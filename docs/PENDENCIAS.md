# Pendências · LoWa Opportunity Engine

Itens que dependem da Sarah ou do Marco. No código aparecem como `[colchetes]`.

## Contas e chaves (só a Sarah pode criar)

- [ ] Confirmar o limite de uso do Engine (OE-16): hoje 20 pesquisas por hora e 60 por dia para a equipe (cerca de US$ 9 por dia no máximo). Mudar em `lib/engine/limits.ts` se quiser outro número
- [x] Teste sem login (testes 16 e 17): feito em produção em 23/11/2026, tudo fechado

- [x] Projeto no Supabase criado pela Vercel (22/11/2026), chaves só em Preview e Production
- [x] Chave da API da Anthropic na Vercel (`ANTHROPIC_API_KEY`, Preview e Production, Secret) em 23/11/2026. Custo medido na OE-07: cerca de US$ 0,15 por oportunidade (US$ 10 dão umas 60 pesquisas). Conferir: limite de gasto mensal no console e, se a chave usada for a de usuário que expira em 22/12/2026, trocar por uma de service account sem validade antes disso
- [x] Chave do Google (projeto lowa-discover) com Places API (New) e Geocoding API, restrita a essas duas, na Vercel como `GOOGLE_PLACES_API_KEY` (Preview e Production) em 23/11/2026. Conferir: limite diário em Quotas (sugestão: 200 por dia)
- [x] Login do app: hello@lowa-studio.com (conta única da Sarah e do Marco), cadastrado em `team_members`
- [ ] Vercel: confirmar se a `main` deste repositório publica direto em lowa-studio.com

## Marca e contato

- [x] Domínio oficial das propostas: lowa-studio.com (decisão de 22/11/2026, a partir do e-mail hello@lowa-studio.com). O `layout.tsx` do site ainda usa lowastudio.com
- [x] E-mail de contato das propostas: hello@lowa-studio.com (o site ainda mostra hello@lowastudio.com)
- [ ] WhatsApp e link de agenda para o "Next step" da proposta (opcionais)
- [ ] Ícone do app para a tela inicial. Provisório desde a OE-03: "LoWa" em Instrument Serif butter sobre sunset (`lib/engine/app-icon.tsx`). Trocar quando a Sarah mandar o definitivo

## Comercial

- [ ] /business (SITE-01): prazo real de entrega, forma de pagamento, quem é dono do site e do domínio, e onde o site fica hospedado sem o plano mensal. Até lá, aparecem entre [colchetes] no protótipo
- [ ] Black Friday a US$ 500: confirmar que cobre o custo. Para propostas do Engine, criar o item no catálogo e apagar em 05/12/2026
- [ ] "We reply within 5 hours" (home, /contact e mensagem do formulário): confirmar se vale
- [ ] "Live in 24 hours" e "Free hosting forever" saíram do site em 26/11/2026 (decisão da Sarah). Só voltam com prazo e condição confirmados. Hospedagem de cliente na Vercel exige o plano Pro (o Hobby é só para uso não comercial)
- [ ] /business: a pedido da Sarah (26/11/2026), o pop-up diz "live in just a few days" e o FAQ diz "Hosting is free". Confirmar quantos dias são "a few", e em qual conta e plano fica a hospedagem grátis (Vercel Pro da LoWa?) e até quando, antes de publicar
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
- [x] "Use my location": Geocoding API ligada e testada em 23/11/2026
- [x] Registros de teste da OE-04 apagados pelo próprio app em 22/11/2026
