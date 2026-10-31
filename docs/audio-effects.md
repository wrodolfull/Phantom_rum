# Phantom Run — Polimento audiovisual (MVP 0.3)

## Efeitos
- Alternância de estados: partículas ciano na ativação e claras ao retornar ao físico; pequenas partículas acompanham o Phantom intangível.
- Salto: pequena emissão de poeira pixelada, animação aérea própria.
- Coleta: explosão de pixels dourados (Essência) ou azuis (orbes).
- Morte: explosão, vibração curta da câmera e retorno ao Game Over.
- Auras são desenhadas via um único objeto Phaser Graphics, com limite de 110 partículas e atualização dependente de delta-time.
- Seis quadros de flutuação por estado, mais sprites para salto e impacto.

## Áudio
Música chiptune **original gerada no navegador** com Web Audio API (sem arquivos externos ou amostras licenciadas). Melodia curta em loop, baixo triangular e percussão sintetizada, com efeitos para salto, transformação, coleta, colisão e recorde.

### Restrições do navegador
- Áudio só é inicializado após interação do usuário com botão ou teclado.
- Não há autoplay na página inicial.
- Jogo sem suporte a Web Audio continua jogável e silencioso.
- Pausar interrompe o agendamento de novas notas; retornar reinicia o relógio da sequência.
- M para ligar/desligar música e N para efeitos; preferências persistem via localStorage quando disponível.
- Botões de som e pausa ficam acessíveis na interface.

## Testes manuais
1. Iniciar e conferir se a música só toca após clicar JOGAR.
2. Ativar e soltar Shift: partículas e dois efeitos sonoros distintos.
3. Pular, pegar orbe e Essência: animação + SFX + energia/pontos atualizados.
4. M / N desligam individualmente e persistem após atualização da página.
5. Pausar no Esc e no botão touch: jogo e música param; retomar sem áudio acumulado.
6. Testar tela touch e estado após perder/reiniciar três vezes.
7. Verificar partida em navegador sem suporte a áudio (sem exceção fatal).

O gerador procedural continua experimental e requer validação formal de solvabilidade.
