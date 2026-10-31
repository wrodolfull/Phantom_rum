# Phantom Run

Endless runner de navegador em pixel art original. O fantasma corre automaticamente, salta e usa **intangibilidade temporária** para atravessar obstáculos.

## Executar
Node.js 20+.

```bash
npm install
npm run dev
```

Abra a URL impressa pelo Vite. Para build de produção, execute `npm run build`.

## Controles

| Ação | Desktop | Mobile |
| --- | --- | --- |
| Pular | Espaço ou ↑ | Toque na metade esquerda |
| Intangibilidade | Segurar Shift | Segurar a metade direita |
| Pausar | Esc | Disponível via teclado (botão touch planejado) |
| Reiniciar após morte | Espaço | Toque na tela |

## Mecânicas
- Corrida automática e velocidade progressiva.
- Salto, gravidade, coyote time e jump buffering.
- Intangibilidade com energia que se esgota, recarrega e permite atravessar paredes.
- Barreiras espirituais que exigem a forma física.
- Abismos, Essência, orbes e recorde persistido no navegador.
- Geração de obstáculos e Game Over.

## Visual 0.2
- Personagem Phantom desenhado em pixel art, com animação de flutuação e modo intangível.
- Cemitério Esquecido com céu estrelado, lua, capela, árvores e camadas de parallax.
- Texturas originais (Canvas) sem imagens externas e sem dependências gráficas adicionais.
- Chão, paredes, orbes e barreiras em sprites, pixelated scaling.

Veja [docs/visual-design.md](docs/visual-design.md) e [src/art/pixelArt.ts](src/art/pixelArt.ts).

**Em desenvolvimento:** os sprites ainda são um primeiro passe e o gerador procedural não possui validador formal; recomenda-se playtest e checagem do CI antes de produção.
