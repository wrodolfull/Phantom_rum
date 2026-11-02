# Phantom Run — PR #15: Spooky Arcade 3D VFX & Polimento

## Objetivo
Melhorar a sensação de impacto e velocidade da perseguição em 3D sem sacrificar FPS mobile, a clareza das três faixas ou o cronômetro/colisões corrigidos nas PRs anteriores.

## Efeitos adicionados ao Three.js
- **Rastro espectral:** pontos ciano que surgem atrás do Phantom em movimento. Intensifica quando está intangível.
- **Salto:** partículas curtas de impulso no chão, acionadas somente em saltos válidos.
- **Troca de faixa:** faíscas violeta discretas, sem cobrir obstáculos.
- **Intangibilidade:** pequena explosão de partículas ao entrar ou sair da forma intangível.
- **Essência:** feedback dourado na coleta; **orbe:** feedback azul-ciano.
- **Impacto:** partículas rosadas e pequena reação da câmera, sem alterar posição física, hitbox nem o cálculo da colisão.
- **Perseguidor:** leve oscilação vertical da corrida.
- **Barreiras espirituais:** runas girando e brilho pulsante. **Orbes/Essências:** núcleo e halo animados sem alterar a geometria de colisão.
- **Câmera:** inclinação e deslocamento sutis durante mudanças de faixa e impactos; a perspectiva continua atrás do personagem.
- **Retorno ao 2D:** partículas discretas no início da saída cinematográfica.

## Política de performance
- Um **único objeto THREE.Points**, uma geometria e um material para todos os efeitos de partículas.
- Pool circular com **capacidade máxima de 64 partículas ativas**; não criamos meshes/geométricas ou materiais a cada colisão nem em cada quadro.
- Partículas com tempo de vida entre 0,24 e 0,58 s, sem sombras e com transparência simples.
- Geometria e material de partículas são explicitamente descartados ao sair da cena.
- O sistema visual não toca `CHASE_IMPACT_Z`, `advanceChaseHazard()`, o cronômetro real ou o saldo da partida.
- Permite comparação de desempenho com `?test_chase=1&no_fx=1` (somente o efeito de partículas Three.js é desligado; câmera e pulsações continuam).

## Compatibilidade 2.5D
- O fallback de Phaser, usado quando Three.js/WebGL não funciona, ganha faíscas de salto, fase, coleta, colisão e mudança de faixa.
- Pool de até **40 pontos** desenhados em `Graphics`, sem criar objetos do Phaser a cada frame.
- O gameplay 2.5D continua idêntico; não afeta a decisão de fallback.

## Testes automatizados
- Capacidade máxima da pool e reaproveitamento durante centenas de eventos.
- Descarte do objeto Three.js e ausência de novos eventos após `destroy()`.
- Partículas expiram com o tempo, inclusive quando a forma intangível é mantida.
- Animação cosmética de orbes/barreiras **não altera a posição do obstáculo**.
- Deslocamentos da câmera permanecem limitados.
- Pool de faíscas no fallback também limitada.
- Testes de regressão de perseguição Chromium, modos, persistência e colisões.

```bash
npm install
npm test
npm run build
npm run test:e2e
```

## Aceite manual após merge e GitHub Pages
1. Abra `https://wrodolfull.github.io/Phantom_rum/?test_chase=1&v=0120`.
2. Confirme `BUILD 0.12.0-vfx-20261102`.
3. Faça saltos, deslizes laterais e intangibilidade, observando feedback imediato e discreto.
4. Colete Essência/orbe e confira um único efeito, um único crédito de item e nenhuma colisão duplicada.
5. Deixe uma barreira espiritual aproximar-se: ela deve pulsar sem perder a silhueta nem ficar grudada no Phantom.
6. Compare desempenho com `?test_chase=1&no_fx=1&v=0120` no mesmo aparelho.
7. Verifique pelo menos uma corrida 3D completa e retorno ao 2D, incluindo pausa e troca de abas.
8. Em `?test_chase=1&force_compat=1`, valide a alternativa 2.5D e os efeitos simples.
9. Teste em celular real: nenhuma partícula deve obscurecer o personagem/obstáculos ou diminuir perceptivelmente a fluidez.

## Próximas mecânicas planejadas (fora desta PR)
- Trecho de plataforma 2D com movimento livre, salto em níveis e retorno ao runner.
- Incorporação temporária de morcego especial com janela de captura, voo de coleta e aterrissagem.
