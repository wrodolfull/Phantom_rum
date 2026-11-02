# Phantom Run 0.9.3 — Obstáculos grudados durante a perseguição

## Causa identificada

Nos dois modos de perseguição, o motor interrompia o movimento de um obstáculo assim que ele era marcado como `passed=true` após cruzar a posição do jogador. Entretanto, a regra para remover o obstáculo dependia de `z>11`, posição que ele nunca alcançava porque seu `z` ficava congelado em aproximadamente `1.5`. Isso fazia lápides, portões e colecionáveis parecerem grudados ao Phantom e acumularem ao longo da fase.

## Correção
- `advanceChaseHazard()`, compartilhado por Three.js e pela alternativa 2.5D, move os objetos **em todas as atualizações**, inclusive depois do encontro com o fantasma.
- A colisão e a coleta são avaliadas somente no primeiro cruzamento do plano do jogador; `passed` não cancela movimento e nem reativa interações.
- Os obstáculos continuam em direção à câmera e são removidos depois de `z>11`, liberando geometria/material no Three.js.
- A alternativa 2.5D usa a mesma lógica para não congelar e acumular obstáculos.
- Testes unitários percorrem dezenas de obstáculos e verificam que cada um cruza o jogador uma única vez, continua avançando e atinge o ponto de descarte.
- O carimbo de versão muda para `BUILD 0.9.3-hazards-20261101` para confirmar a publicação correta.

## Teste manual após o merge
1. Espere o GitHub Pages concluir o deploy do novo build.
2. Abra `https://wrodolfull.github.io/Phantom_rum/?test_chase=1&v=093` e confirme o carimbo `0.9.3`.
3. Observe lápides, portões e orbes: eles devem se aproximar, passar pelo personagem, seguir para trás dele e desaparecer, sem ficar presos.
4. Confira que cada obstáculo gera **no máximo uma colisão** e cada Essência/Orbe pode ser coletado apenas uma vez.
5. Teste também `?test_chase=1&force_compat=1&v=093` para a perspectiva alternativa.
6. Teste em tela cheia sem `debug_chase=1`; esse parâmetro exibe uma caixa de diagnóstico que cobre parte do jogo.

## Limites
A correção foi testada por regras automatizadas e CI. Testes visuais e de sensação no aparelho móvel continuam necessários para validar a apresentação final.
