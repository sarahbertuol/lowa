# Interações · LoWa Opportunity Engine

O app é ferramenta de trabalho: movimento curto, só para dar retorno. A proposta pode ter um pouco mais de intenção, sem atrasar a leitura.

## Regras globais

1. Animar só `transform` e `opacity`. Sem bibliotecas de animação: CSS e o `Reveal` que já existe no site.
2. `prefers-reduced-motion: reduce`: tudo desliga, conteúdo aparece completo. Progresso continua legível por texto.
3. Sem `overflow: hidden` em `body` ou wrappers; usar `overflow-x: clip`.
4. Nenhuma animação bloqueia um toque: o botão responde na hora e a animação acontece por cima.

Easings: `--ease: cubic-bezier(.2,.8,.2,1)` (entradas), `cubic-bezier(.4,0,.2,1)` (saídas).

## App `/discover`

| Elemento | Gatilho | Animação | Duração e easing | Mobile | Reduced motion |
|---|---|---|---|---|---|
| Botões e cards tocáveis | toque | scale 1 a .97 e volta | .12s, ease | igual | sem escala |
| Botão primário (desktop) | hover | sweep butter da esquerda, seta x 0 a 4px | .5s, `--ease` | sem hover | sem sweep |
| Tela nova (navegação) | troca de rota | opacity 0 a 1, y 8px a 0 | .22s, `--ease` | igual | sem animação |
| Folha inferior | abrir / fechar | y 100% a 0, fundo opacity 0 a .4 | .28s `--ease` / .2s saída | arrastar para baixo fecha | aparece direto |
| "Add details" | toque | campos opcionais abrem (opacity e y 6px), altura sem animação | .2s | igual | direto |
| Analyze | toque | texto troca para "Saved", ícone check entra com scale .6 a 1 | .25s | vibração curta (`navigator.vibrate(10)`) se houver | sem escala |
| Etapas da pesquisa | etapa conclui | ponto vira check (scale .6 a 1), linha seguinte opacity .4 a 1 | .3s | igual | troca direta |
| Etapa em andamento | enquanto roda | ponto pulsa opacity 1 a .4 | 1.2s loop | igual | sem pulso, texto "running" |
| Esqueleto de carregamento | dados chegando | opacity .5 a 1 em loop | 1.4s | igual | estático |
| Toast (Copied, Saved offline) | ação | y 16px a 0 + opacity, some após 2.4s | .2s | acima da barra inferior | aparece e some sem movimento |
| Indicador de rede | muda o estado | faixa fina no topo, opacity 0 a 1 | .2s | igual | direto |
| Status chip | troca de status | cor troca, chip scale .9 a 1 | .2s | igual | troca direta |

## Proposta `/opportunity/[token]`

| Seção | Elemento | Gatilho | Animação | Duração e easing | Reduced motion |
|---|---|---|---|---|---|
| Hero | marca LoWa, título, subtítulo | carregou | y 24px a 0 + opacity, stagger .08s | .9s, `--ease` | estático |
| Hero A | moldura de navegador | carregou, depois do título | y 32px a 0 + opacity, rotate -2deg fixo | .9s, atraso .25s | estático |
| Hero C | marcador da data no calendário | carregou | scale .8 a 1 + opacity | .5s, atraso .4s | estático |
| The opportunity | parágrafo | entra na tela (`Reveal`) | y 24px a 0 + opacity | .8s | estático |
| What we noticed | cada insight | entra na tela | y 24px a 0 + opacity, número antes do texto (.1s) | .8s | estático |
| Our recommendation | card do serviço | entra na tela | y 24px a 0 + opacity | .8s | estático |
| Investment | valor | entra na tela | opacity 0 a 1 (sem contador animado no número) | .6s | estático |
| Next step | botão | hover | sweep butter, seta x 0 a 4px | .5s | sem sweep |

Mobile: mesmas entradas, distância de 16px em vez de 24px.
