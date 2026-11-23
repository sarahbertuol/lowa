# Referência visual · Opportunity Engine

Protótipos em HTML estático. Abrir no navegador (app em 390px; proposta em 390px e 1440px). As telas do app usam `engine.css`; a proposta tem o CSS dentro do próprio arquivo.

Todos os negócios dos protótipos são **fictícios** (Juniper & Clay, Bloom Row Florist, Casa Norte Coffee, Harbor Street Tailors, Saltmarsh Candle Co. e outros). Servem só para mostrar layout e tom. Textos entre `[colchetes]` dependem de `docs/PENDENCIAS.md`.

| Arquivo | Rota | Tarefa |
|---|---|---|
| Login.html | /discover/login | OE-02 |
| Discover.html | /discover | OE-03, OE-05 |
| Nova.html | /discover/new | OE-04 |
| Oportunidade.html#researching | /discover/o/[id] (pesquisando) | OE-06 |
| Oportunidade.html#verify | /discover/o/[id] (precisa verificar) | OE-08 |
| Oportunidade.html#review | /discover/o/[id] (revisão, mensagens, histórico) | OE-14, OE-15 |
| Catalogo.html | /discover/catalog | OE-10 |
| Proposta.html#a, #b, #c | /opportunity/[token], modelos A, B e C | OE-13 |

Observações:

- A barra preta no topo de cada protótipo ("PROTOTYPE") não existe no produto.
- Na proposta, as entradas ao rolar usam `animation-timeline` (só Chrome). No produto, usar o `Reveal` do site conforme `docs/INTERACOES.md`.
- Nenhum print de site de cliente aparece na proposta; a fonte é citada em texto com a data da checagem.
