# Próximo recurso — Incorporação de Morcego (conceito para PR posterior)

**Status:** documentado e planejado; NÃO implementado nesta PR #9.

## Intenção

Phantom encontra um **morcego especial** voando, diferente do inimigo comum. Se acertar a janela de aproximação, incorpora temporariamente o morcego e passa para uma **rota aérea** com colecionáveis posicionados acima do mapa normal. Depois de alguns segundos, desincorpora, cai com animação e aterrissa no percurso lateral 2D original.

## Alvo e janela de captura

- Morcego especial com contorno e pequenas partículas diferentes dos morcegos inimigos.
- Um círculo pulsante aparece ao redor dele quando se aproxima. O anel diminui de raio de ~24 px até ~8 px.
- A captura acontece com **E** no teclado ou **toque direto no alvo** no celular durante uma janela de aproximadamente 180–250 ms.
- A área de toque deve ser maior que o sprite visível, para evitar frustração no celular.
- Tocar fora do alvo continua sendo o comando normal de salto, sem ativar possessão por engano.
- Caso a janela seja perdida, o jogo continua normalmente; não acontece Game Over.

## Nova modalidade de voo

- Duração alvo: 8–12 segundos (ajustável em playtest).
- Phantom adquire asas ou assume silhueta de morcego; colisão passa a usar corpo aéreo.
- Câmera sobe suavemente para revelar um **nível vertical superior**.
- Movimento horizontal continua automático. Deslizar para cima/baixo permite corrigir altitude (ou teclado ↑/↓).
- Foco em coletar Essência; sem lutas nesta primeira versão.
- Máximo sugerido de **18 a 22 unidades de Essência** por incorporação bem aproveitada. Isso torna a mecânica valiosa sem quebrar a economia da loja.
- O tempo de voo e a quantidade de Essência não dependem de pagamentos nem de personagens cosméticos.

## Retorno seguro

Aos 0,8–1,2 segundos finais, asas desaparecem, o fantasma cai em arco com animação própria, e uma área segura no chão aguarda o pouso. A velocidade normal e a energia remanescente são preservadas.

## Restrições de geração e acessibilidade

- Spawn especial raro e programado em trecho seguro; nunca sobre um abismo obrigatório ou barreira espiritual.
- Sinal visual distinto do morcego inimigo.
- Possibilidade de repetir a mecânica em partidas longas, com cooldown de distância.
- Captura e pouso testados com pausa, troca de aplicativo, teclado e celular.

Esse sistema será desenvolvido em uma PR própria após validar a perseguição 3D e o primeiro trecho de plataforma.
