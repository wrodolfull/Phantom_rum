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
| Pausar | Esc | Botão II no topo |
| Reiniciar após morte | Espaço | Toque na tela |
| Música | M ou botão ♫ | Botão ♫ |
| Efeitos | N ou botão ♪ | Botão ♪ |

## Mecânicas
- Corrida automática e velocidade progressiva.
- Salto, gravidade, coyote time e jump buffering.
- Intangibilidade com energia que se esgota, recarrega e permite atravessar paredes.
- Barreiras espirituais que exigem a forma física.
- Abismos, Essência, orbes e recorde persistido no navegador.
- Geração de obstáculos e Game Over.

## Visual e áudio 0.3
- Phantom com seis quadros de flutuação por estado, sprite de salto e expressão de impacto.
- Partículas pixeladas na intangibilidade, salto, coleta e colisão; sacudida e flashes sutis.
- Trilha chiptune original sintetizada com Web Audio após interação do usuário.
- Efeitos sonoros de salto, intangibilidade, coleta, perda e novo recorde.
- Botões de música/efeitos com preferências persistentes, botão de pausa para mobile.
- Efeitos leves desenhados com um único Phaser Graphics; nenhum arquivo de áudio externo.

Confira [docs/audio-effects.md](docs/audio-effects.md) para os testes e detalhes de áudio.

## Visual 0.2
- Personagem Phantom desenhado em pixel art, com animação de flutuação e modo intangível.
- Cemitério Esquecido com céu estrelado, lua, capela, árvores e camadas de parallax.
- Texturas originais (Canvas) sem imagens externas e sem dependências gráficas adicionais.
- Chão, paredes, orbes e barreiras em sprites, pixelated scaling.

Veja [docs/visual-design.md](docs/visual-design.md) e [src/art/pixelArt.ts](src/art/pixelArt.ts).

**Em desenvolvimento:** a arte continua sendo o primeiro passe. Há validação numérica conservadora para segmentos procedurais, mas ainda são necessários playtests reais no navegador e no celular.

## Jogabilidade e testes (MVP 0.4)
- Segmentos procedurais em quatro níveis com validação de energia, alcance de salto e tempo de reação.
- Primeira fase guiada; trechos de recuperação gerados quando os desafios futuros não são seguros.
- Muros físicos altos exigem intangibilidade; abismos possuem física de apoio corrigida e barreiras têm colisões varridas.
- Testes automatizados de sementes, soluções e colisões: `npm test`.
- Consulte [docs/course-validation.md](docs/course-validation.md).

## Tutorial, Game Over e conquistas (MVP 0.5)
- Tutorial da primeira partida com avisos contextuais antes dos desafios, sem pausar a corrida.
- Repetição por **COMO JOGAR** no menu; conclusão memorizada após o primeiro abismo.
- Nova tela de resultados com recorde, Essência, meta de distância, conquistas e botões de reinício/menu.
- Galeria com oito conquistas, progresso acumulado e persistência local.
- Migração automática do antigo recorde `phantom-run-best-v1`.
- Regras de progresso e tutorial cobertas por testes automatizados (`npm test`).

Consulte [docs/onboarding-achievements.md](docs/onboarding-achievements.md).

## Loja Espectral (MVP 0.6)
- Acesso à loja pelo menu principal e pelo Game Over.
- Cinco fantasmas originais e quatro opções de acessórios pixel art.
- Essência disponível, compra única, equipar gratuitamente e persistência no navegador.
- Personagens e acessórios são 100% cosméticos, sem vantagens de jogabilidade.
- A aparência equipada é usada no menu, durante a partida e na tela de resultados.
- Migração automática da Essência histórica do save antigo.
- Testes de compra, saldo, inventário e compatibilidade com progresso anterior.

Consulte [docs/shop-cosmetics.md](docs/shop-cosmetics.md).
