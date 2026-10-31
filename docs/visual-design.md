# Phantom Run — Guia visual do Cemitério Esquecido

## Direção de arte
Pixel art 2D em resolução nativa, inspirada na linguagem de aventuras de portáteis 16-bit. Estética original: nenhuma arte, personagem ou marca licenciada.

## Paleta
- Céu noturno: `#171633`
- Noite violeta: `#24234d`
- Contornos: `#31305e`
- Branco do Phantom: `#fcf7ff`
- Brilho intangível: `#60d8f8`
- Grama: `#90d1a6`
- Essência: `#ffd676`

## Componentes visuais
Os sprites são gerados em Canvas por `src/art/pixelArt.ts` e registrados como texturas do Phaser, com filtragem sem suavização.
- Phantom físico: 32×32, três quadros de flutuação.
- Phantom intangível: 32×32, três quadros azuis/translúcidos.
- Lápide: 24×32; parede: 26×40; barreira espectral: 18×50.
- Essência e orbe: 16×16.
- Chão: tile 16×16.
- Árvore: 68×88; lampião: 20×50.
- Céu: 480×270, lua 52×52, montanhas e floresta em camadas repetíveis.

## Profundidade
1. Céu fixo e lua.
2. Montanhas e capela distantes: 8% da velocidade de corrida.
3. Floresta: 23% da velocidade.
4. Árvores e lápides decorativas.
5. Terreno e obstáculos (100% da velocidade).
6. Phantom e HUD.

## Aprovação visual
O visual atual é o primeiro passe artístico jogável, não uma folha de sprites final. Próxima etapa: refinar sprites e efeitos após captura e avaliação do jogo rodando em navegador, sem alterar as regras da física.

## Atenção
A geração de obstáculos permanece experimental e requer um validador de solvabilidade e testes de navegação/colisão em mobile antes do lançamento público.
