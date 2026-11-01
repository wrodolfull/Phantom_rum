# Phantom Run — Perseguição 3D (PR #9)

## Objetivo da integração

Aos **800 metros** da mesma partida (8.000 px do mundo 2D), Phantom atravessa um portal e a câmera passa para trás do personagem. O cenário é o mesmo Cemitério Esquecido, agora representado com formas **3D low-poly** (lápides, árvores, pista de pedra e névoa). Um caçador de fantasmas passa a persegui-lo.

A primeira perseguição termina aos **1.150 metros** (11.500 px) e Phantom retorna ao 2D. Futuras fases de plataforma e futuras perseguições ficam para PRs posteriores.

## Arquitetura

- Phaser 3 permanece responsável por menu, 2D, recordes, loja, som e ciclo das cenas.
- Three.js é carregado **somente quando a perseguição começa**, por `import("three")`.
- A cena `ChaseScene` renderiza o 3D em um segundo Canvas WebGL, sobreposto à área do Phaser. O HUD 3D é HTML discreto, sem botões grandes de pulo ou intangibilidade.
- O canvas extra, todos os meshes e listeners são removidos ao retornar para o 2D ou após Game Over. O jogo não cria sessões WebGL acumuladas.
- `RunSnapshot` preserva distância, energia, Essência, saltos, intangibilidade e contadores de conquistas entre os dois modos.
- `chaseDone` impede que uma mesma partida reative a perseguição de 800 m depois de voltar ao 2D.
- Se WebGL não estiver disponível, há fallback para o 2D, preservando o progresso.
- Não há servidor, conta ou telemetria externa.

## Direção e transições

1. Aos 800 m, o modo 2D espera uma região segura: Phantom deve estar no chão, em forma física e sem perigo imediato à frente.
2. Uma saída cinematográfica de aproximadamente 550 ms prepara a troca de cenas.
3. A câmera 3D parte de uma posição oblíqua lateral e gira gradualmente até ficar **atrás de Phantom** em 1,8 s.
4. Uma introdução segura avisa que o caçador está se aproximando.
5. O trecho 3D ocupa aproximadamente 350 metros, com 3 faixas, colecionáveis e obstáculos.
6. Uma saída para o portal faz a visão 3D desaparecer; Phaser retorna à corrida 2D com espaço seguro antes dos primeiros obstáculos.

## Controles

| Ação | Celular | Desktop |
|---|---|---|
| Pular | Toque rápido no cenário | Toque/clique rápido, Espaço ou ↑ |
| Intangível | Pressionar e segurar no cenário | Segurar mouse ou Shift |
| Mudar de faixa | Deslizar esquerda/direita | ←/→ ou A/D |
| Pausar | Botão discreto Ⅱ no HUD | Esc |
| Música e efeitos | Preferências do menu | M / N |

Os mesmos gestos do 2D continuam válidos; a perseguição adiciona apenas o desvio lateral. O HUD mostra distância, Essência, energia e proximidade do caçador.

## Obstáculos e regras

- **Lápide baixa:** pular, mudar de faixa ou atravessar intangível.
- **Portão de pedra:** mudar de faixa ou atravessar intangível (não pode saltar por cima).
- **Barreira espiritual:** segura no físico; perigosa no intangível.
- **Orbe azul:** recupera 25 EP, inclusive no modo intangível.
- **Essência:** acrescenta uma unidade ao saldo da corrida, apenas quando físico.

Cada onda ocupa no máximo duas das três faixas com perigos; existe pelo menos uma faixa livre. As ondas têm progressão determinística e tempo de aviso visual.

## Sistema do caçador

- O caçador começa atrás do Phantom com 16% de proximidade.
- Uma colisão aumenta a aproximação em 36 pontos percentuais.
- Superar sequências sem erros reduz a aproximação lentamente.
- Atingir 100% termina a partida em captura, gerando a tela de Game Over existente.
- Não são utilizadas vidas, armas ou combate.

## Testes

```bash
npm install
npm test
npm run build
npm run dev
```

Para **testar o 3D diretamente** sem precisar correr 800 metros, acrescente `?test_chase=1` à URL e pressione Jogar no menu. Este atalho não muda a experiência normal nem desbloqueia conteúdo.

Checklist manual:
- [ ] Chegar aos 800 m em uma partida normal; nenhuma transição ocorre durante salto/parede.
- [ ] A câmera vira e o caçador fica visível atrás de Phantom.
- [ ] Setas e A/D alternam entre três faixas sem sobreposição.
- [ ] Swipe para esquerda/direita muda de faixa no celular; toque curto pula e segurar ativa intangibilidade.
- [ ] Pular uma lápide baixa evita impacto; portão exige desvio ou intangibilidade.
- [ ] Barreira espiritual só penaliza quando intangível.
- [ ] Bater 3 vezes aproxima o caçador até uma captura; a tela de Game Over mantém recorde.
- [ ] Coletar orbes e Essência e completar o trecho conserva os recursos ao voltar para o 2D.
- [ ] Fechar/abrir a aba, pausar, reiniciar partidas e entrar novamente em 3D não acumulam canvases ou som.
- [ ] Simular falha no WebGL confirma fallback ao 2D.
- [ ] Avaliar FPS e leitura visual em Android/iOS reais, especialmente aparelhos modestos.

**Observação:** testes unitários provam transições e regras de colisão, não substituem um playtest visual de Three.js em navegadores móveis.
