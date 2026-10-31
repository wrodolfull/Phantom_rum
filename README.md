# Phantom Run 👻

Endless runner 2D em pixel art. Phantom corre automaticamente; pule e alterne para a forma intangível para atravessar paredes.

## Executar localmente

Requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite. Para verificar o build: `npm run build`.

## Controles

- **Espaço / seta para cima:** pular.
- **Shift (segurar):** ficar intangível, consumindo energia espiritual.
- **Esc:** pausar.
- **Celular:** toque na metade esquerda para saltar; segure a metade direita para ficar intangível.

## MVP 0.1

- Corrida automática, gravidade e salto com tolerância.
- Intangibilidade, energia e estados de colisão.
- Paredes físicas, barreiras espirituais, abismos, energia e Essência.
- Geração de segmentos, velocidade progressiva, pontuação e recorde local.
- Menu, pausa e Game Over.

Os gráficos são desenhados programaticamente como placeholders pixel art. Os sprites definitivos serão adicionados em etapa posterior. A geração de segmentos nesta versão é experimental e ainda precisa de um validador formal de solvabilidade.

## Próximas etapas

1. Substituir gráficos provisórios por spritesheets originais.
2. Validar todos os trechos procedurais com simulação física/energia.
3. Adicionar parallax, áudio e testes automatizados.
4. Refinar controles touch e tutorial.
