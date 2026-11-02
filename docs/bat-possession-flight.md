# Phantom Run — PR #17: incorporação do morcego e voo espectral

## Objetivo
Depois da corrida 2D, da perseguição 3D e da Mansão das Almas, o Phantom encontra um **morcego luminoso diferente dos inimigos normais**. Um anel se fecha à medida que ele se aproxima; quando o anel fica pequeno e verde, o jogador pode tocar no morcego ou pressionar E. Isso transfere o Phantom para um voo bônus de coleta e, após 10 segundos ativos, ele desincorpora e volta ao runner com animação de queda e aterrissagem.

## Progressão e limites
- Primeira oportunidade por volta de **1.700 metros**, somente se a mansão já tiver sido concluída.
- O encontro usa um trecho curto e seguro, com leve desaceleração apenas enquanto o morcego está próximo.
- A captura é possível por uma janela de **±48 pixels em torno do ponto de aproximação**; anel cintila e diminui de raio.
- No **PC**, pressione **E** enquanto o anel estiver verde; no **celular**, toque no próprio morcego durante essa janela. Não há novo botão grande sobre o jogo.
- Se não acertar, o morcego vai embora e reaparece cerca de **650 metros depois**.
- Apenas uma incorporação bem-sucedida por corrida. A flag `batDone` viaja no `RunSnapshot` e impede exploração de recompensas repetidas ao retornar ao 2D.
- O voo dura **10 segundos ativos**, em três alturas (alto, centro e baixo), com moedas de Essência distribuídas em sequências.
- **Recompensa máxima: 10 Essências extras e 135 metros** no total do voo. Colecionáveis só contam uma vez; o bônus de distância é aplicado somente na saída.
- EP e estatísticas da partida permanecem na mesma corrida e os cosméticos escolhidos reaparecem após a transformação.
- No fim: o morcego se desfaz, Phantom reaparece caindo, aterrissa e retorna ao runner por fade. O corredor 2D retoma com zona segura de entrada.

## Controles do voo
| Ação | PC | Celular |
|---|---|---|
| Capturar o morcego | E no momento certo | Toque diretamente no morcego quando o anel estiver verde |
| Subir no voo | ↑, W ou Espaço | Toque ou arraste para a faixa alta |
| Descer no voo | ↓ ou S | Toque ou arraste para a faixa baixa |
| Pausar | Esc | Botão pequeno Ⅱ no topo |

As 3 alturas são discretas para facilitar a coleta sem um joystick gigante. Durante o voo não há colisões letais: o desafio é alcançar o máximo de Essências dentro do tempo, sem perder a partida principal.

## Identidade visual
- Morcego raro com asas lilás, olhos expressivos e pontos luminosos dourados; distinto do morcego roxo inimigo.
- Morcego incorporado com corpo branco-azulado, asas ciano e halo espectral, com animação de voo.
- Cenário noturno em 16-bit com lua, nuvens passando e trilhas de velocidade.
- Arco verde de captura com aviso **AGORA!** e animação de transformação.
- Texturas pixel art geradas proceduralmente, sem downloads nem novos assets pesados.

## Implementação técnica
- `src/game/batFlight.ts`: regras puras, janela de captura, distância de reaparição, moedas em três alturas, limite de recompensas e término por tempo ativo + tempo real.
- `src/art/batArt.ts`: duas texturas pequenas geradas uma vez no canvas.
- `src/scenes/BatFlightScene.ts`: voo temporário no Phaser, coleta, gestos, relógio real, pausa, animação de retorno e continuidade da partida.
- `src/main.ts`: oportunidade segura de incorporação, indicador de proximidade, tecla E e toque direto, handoff e flag de uma vez por corrida.
- `src/game/modes.ts`: `RunSnapshot.batDone` opcional para compatibilidade com dados existentes.
- `src/game/diagnostics.ts`: versionamento e modos `bat-captured`, `bat-flight` e `bat-landing`.

## Testes
- Regra de aparição apenas após a mansão e com espaço livre.
- Indicador encolhe e a captura só é aceita na janela válida, sem duplicar.
- Limites de 10 Essências / 135m e coletas por colisão varrida de cada faixa.
- Duração protegida pelo relógio real.
- Playwright Chromium: atalho `?test_bat=1` para o encontro, captura E e entrada no voo.
- Playwright Chromium: `?test_flight=1&qa_exit=1` para iniciar o voo e testar a aterrissagem/continuidade. O atalho X só existe quando ambos os parâmetros estão presentes.
- Testes existentes do 3D e da mansão precisam continuar verdes.

## Teste manual depois do merge e do GitHub Pages
1. Abra `https://wrodolfull.github.io/Phantom_rum/?test_bat=1&v=0140`.
2. Confirme a marca `BUILD 0.14.0-batflight-20261102` no rodapé.
3. Espere o morcego luminoso se aproximar. Observe o anel diminuir até mudar para verde.
4. Toque nele no celular ou pressione E no desktop quando aparecer **AGORA!**.
5. Alterne as alturas no voo para coletar Essências. No máximo 10 podem ser creditadas.
6. Observe a desincorporação e a queda animada do Phantom, voltando ao runner com distância e Essência preservadas.
7. Deixe o morcego escapar em outro teste e confirme que a partida continua normalmente.
8. Compare resposta ao toque e FPS no Android, inclusive modo paisagem e pausas.

**Fora do escopo:** outras incorporações (coruja, aranha, etc.) e novos mapas aéreos; o núcleo de transformação poderá receber esses casos depois de um playtest aprovado.
