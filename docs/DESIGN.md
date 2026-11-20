# Design · LoWa Opportunity Engine

Fonte visual: o site LoWa Studio (`app/globals.css`, `reference/home-v4.html`) e as propostas de agência (`app/proposal/proposal.css`).
Protótipos: `docs/referencia/` (abrir no navegador; app em 390px, proposta em 390px e 1440px).

## Tokens (os mesmos do site, sem cores novas de marca)

| Token | Hex | Uso no Engine |
|---|---|---|
| `--cream` | #F7F0E6 | Fundo do app e da proposta |
| `--paper` | #FFFFFF | Cards, campos, folhas |
| `--ink` | #3A1E12 | Texto |
| `--muted` | #7A5A4C | Texto secundário, rótulos mono |
| `--line` | #E7D6C6 | Bordas e divisórias |
| `--blue` | #2F6F86 | Toda ação: botão primário, links, foco |
| `--butter` | #F4DFA4 | Sweep do botão, status Ready |
| `--sunset` | #EDB08A | Hero da proposta, destaques |
| `--sky` | #B5D6DF | Status Processing, faixa da proposta |
| `--brown` | #4A2415 | Faixa escura da proposta (Investment) |

### Status (só no app, todos AA sobre o próprio fundo)

| Status | Fundo | Texto |
|---|---|---|
| Captured, Waiting for connection | `--line` | `--ink` |
| Researching | `--sky` | `--ink` |
| Needs verification | #F6D3BE | #7A2E0B |
| Draft ready | `--butter` | `--ink` |
| Published, Contacted | `--blue` | #FFFFFF |
| Interested, Follow-up | #DCEAF0 | #1F4F61 |
| Won | #DDEBDC | #24562E |
| Lost | #EFE7DE | `--muted` |

Confiança (só interna): HIGH, MEDIUM, LOW em rótulo mono com ponto colorido (#24562E, #8A5A00, #7A2E0B). Nunca aparece na proposta.

## Tipografia

| Família | Uso |
|---|---|
| Familjen Grotesk 300 a 700 | Texto, botões, campos (campos em 17px: evita zoom no iPhone) |
| Instrument Serif itálico | A palavra de voz nos títulos ("New *opportunity*", títulos da proposta) |
| Space Mono | Rótulos, status, fontes e datas da pesquisa |

## App (`/discover`)

- Mobile primeiro, uma mão: ações principais na metade de baixo da tela, barra inferior fixa com "New" no centro (64px).
- Alvos de toque de 48px (mínimo 44px). Campos com 56px de altura.
- Botão primário: pílula azul com sweep butter no hover (igual ao site). Secundário: pílula com contorno azul.
- Cards brancos com borda `--line` e raio 20px, sem sombra difusa.
- Folha inferior (bottom sheet) para ações rápidas: trocar status, copiar mensagem.
- Desktop (1440px): mesma coluna centralizada com até 720px; a revisão abre em duas colunas (dados à esquerda, prévia à direita).
- Light only, como o site.

## Proposta (`/opportunity/[token]`)

- Uma página editorial, leitura de 1 a 2 minutos: Hero, The opportunity, What we noticed (até 3), Our recommendation, Investment, Next step.
- Marca LoWa Studio no topo e no rodapé. Light only (diferente das propostas de agência, que seguem o tema do sistema).
- Coluna de texto com até 680px; títulos grandes em Familjen 400 com uma palavra em Instrument Serif itálico.
- Cada modelo tem uma marca visual própria:

| Modelo | Hero | Detalhe |
|---|---|---|
| A, The missing website | `--sunset` com grão | Moldura de navegador vazia com o nome do negócio, "a site that doesn't exist yet" |
| B, The growth opportunity | `--sky` | Insights numerados com a página do cliente citada como fonte em texto (sem print) |
| C, The seasonal opportunity | `--butter` | Calendário com a data ou estação da oportunidade |

### Direção de arte por categoria (acento secundário e tipo de imagem)

| Categoria | Acento | Imagem |
|---|---|---|
| Artesanato, produtos feitos à mão | `--sunset` | Foto real do produto, se verificada e permitida |
| Restaurante, café, comida | #C9823F (texto em `--ink`) | Foto real do prato ou do cardápio |
| Boutique, moda | `--sky` | Foto real da vitrine ou produto |
| Serviços profissionais | `--brown` | Tipográfico, sem foto |
| Agências | `--blue` | Tipográfico, grade limpa |

### Imagens

- Prioridade: foto real do negócio, de fonte verificada, marcada pela fundadora como "OK to use". Crédito com a fonte em mono pequeno.
- Sem foto verificada: layout tipográfico. Nunca imagem de banco apresentada como produto do cliente.
- Nunca: depoimento, logo, prêmio, resultado ou métrica inventados.

## Para não parecer IA (checar em toda tela)

- Nada de "Unlock your potential", "In today's digital world", emojis, ícones genéricos de biblioteca.
- Insights sempre citam algo concreto do negócio (o produto, a página, o canal). Se não há algo concreto, o insight sai.
- Sem cards iguais em grade de 3 com ícone em cima. Os insights da proposta são uma lista editorial numerada.
- Sem gradiente genérico; só a textura de grão já usada no site.
- Copy em inglês americano, frases curtas, sem travessão.
