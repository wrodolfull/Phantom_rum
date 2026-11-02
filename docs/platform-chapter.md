# Phantom Run — PR #16: Mansão das Almas, fase de plataforma 2D

## Objetivo
Adicionar o terceiro tipo de gameplay à mesma corrida: o Phantom começa em corrida lateral automática (2D), entra na perseguição por trás (3D) aos 800m e, após voltar ao 2D, entra **uma única vez por partida** numa mansão de plataformas com movimento livre.

## Quando acontece
- **800–1300 m:** perseguição 3D existente.
- **~1450 m:** passagem para a Mansão das Almas, somente se o jogador estiver no chão, físico e com espaço seguro à frente.
- **Na mansão:** a distância do runner não é acumulada automaticamente; o jogador explora uma sala fixa de 1480 pixels e procura um portal.
- **Ao escapar:** recebe um bônus único de **70 metros** como distância da seção e regressa ao runner 2D. A Essência recolhida fica na mesma partida.
- A flag `platformDone` preservada em `RunSnapshot` impede reaparecimento da mansão ao retornar ao runner.

## Mecânica
- Controle livre para esquerda e direita; a corrida automática fica suspensa.
- Plataforma em 8 segmentos, com alturas progressivamente superiores e depois descendentes.
- Salto com gravidade, suporte de plataformas e tolerância de salto de borda.
- **Barreira física:** só atravessável no modo intangível; não é vencida por um salto comum.
- **Runa espectral:** somente bloqueia no estado intangível; o jogador deve soltar o poder e passar fisicamente.
- As plataformas permanecem sólidas nas duas formas (segurar fase não causa queda acidental).
- Colecionáveis fixos: **8 Essências e 2 orbes de energia**. Cada item só pode ser coletado uma vez, inclusive após quedas.
- Orbes restauram 25 EP; Essência só é obtida na forma física, como no runner.
- Dois checkpoints intermediários; cair não encerra a partida, volta ao último ponto seguro com pequena penalidade de energia.
- Portal na extremidade final. O retorno ao runner acontece somente ao alcançá-lo no chão, ou pela saída de QA explicitamente habilitada.

## Controles
| Ação | Teclado | Celular |
|---|---|---|
| Movimento | ←/→ ou A/D | Arrastar dedo na metade esquerda da tela na direção desejada e segurar |
| Pular | Espaço ou ↑ | Toque rápido na metade direita |
| Intangível | Segurar Shift | Segurar dedo na metade direita |
| Pausar | Esc | Pequeno botão Ⅱ no canto superior |
| Música / efeitos | M / N | Preferências existentes |

No celular, o dedo esquerdo pode mover enquanto outro dedo pula ou mantém a fase no lado direito. **Não aparecem botões grandes sobre o Phantom.**

## Cenário e linguagem visual
- Mansão noturna em 16-bit pixel art, coerente com o cemitério lateral.
- Corredor de pedras, arcadas e colunas, janelas com vidro em tons azul-violeta, velas e um portal pulsante.
- HUD mostra Essência, EP e distância até a saída. A distância geral da corrida fica congelada durante a exploração.
- Pausa congela física e efeitos, e cancela gestos para evitar movimentos presos.

## Continuidade da partida
`RunSnapshot` preserva:
- distância, Essência, EP e contadores de saltos, fases, paredes e orbes;
- status da perseguição já concluída (`chaseDone`);
- capítulo de plataforma concluído (`platformDone`);
- estado dos cosméticos, que permanece salvo na loja e reaparece na mansão.

Ao voltar ao runner, há um trecho seguro antes de surgirem novos obstáculos. A economia da loja e o registro de recordes permanecem inalterados.

## Validação automatizada
- Trigger seguro da mansão uma única vez.
- Saltar, andar, aterrissar, atravessar uma barreira física e evitar a runa espectral.
- Recuperação de EP, custo da intangibilidade e bloqueio por falta de EP.
- Checkpoints, fim da sala e coleta única de Essência/orbes.
- Teste de percurso completo, percorrendo todos os oito suportes até a porta.
- Multitoque e gestos do controle mobile.
- Playwright abre a fase de QA, move e pula, confirma que não cai imediatamente no runner, força uma saída de QA e verifica a continuidade da partida.
- CI preserva os testes da perseguição 3D real e compatibilidade 2.5D.

```bash
npm install
npm test
npm run build
npm run test:e2e
```

## Teste depois do merge
- Acesse `https://wrodolfull.github.io/Phantom_rum/?test_platform=1&v=0130`.
- Confirme `BUILD 0.13.0-platform-20261102`.
- No desktop, use ←/→ + Espaço + Shift. No celular, arraste no lado esquerdo para mover e toque/segure no direito.
- Suba os três degraus, solte a fase para atravessar a runa e segure para passar o portão físico, até sair da mansão.
- Observe as quedas, os checkpoints, a Essência e o retorno à corrida normal.
- Confirme que não reaparece outra mansão nesta mesma partida.
- Atalho exclusivamente para CI/QA: `?test_platform=1&qa_exit=1` e tecla X para testar o retorno sem completar manualmente a sala.

## Fora do escopo
A incorporação do morcego e o nível aéreo de coleta ficarão numa PR própria, após o playtest da mansão.
