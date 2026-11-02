# Phantom Run — PR #13: Spooky Arcade 3D (direção artística e execução)

## Objetivo
Substituir a aparência de protótipo da perseguição 3D por um cemitério noturno estilizado, de baixa complexidade geométrica, preservando FPS mobile e a jogabilidade introduzida nas PRs #9–#12.

**Arte aprovada:** *Spooky Arcade 3D*: cartoon low-poly, personagem chibi, noite roxo-azulada, luz de luar, névoa em profundidade e objetos mágicos com leitura forte.

## Paleta principal

| Elemento | Cor |
|---|---|
| Céu noturno | `#191933` |
| Neblina | `#423d70` |
| Lua | `#F2E7C9` |
| Luz lunar | `#D7D1FF` |
| Piso de pedra | `#4F536B` |
| Lápides | `#68708B` |
| Vegetação | `#2F4E52` |
| Barreiras espirituais | `#AA7CFF` |
| Orbes | `#7CF1FF` |
| Essência | `#FFD46B` |

O arquivo `src/scenes/chaseArt.ts` concentra a paleta e todos os modelos criados com Three.js.

## O que foi implementado nesta PR

### Cenário
- Céu noturno com estrelas geométricas, lua volumétrica de baixo número de segmentos e halo de transparência simples.
- Neblina atmosférica calculada pelo motor 3D, colinas e montanhas estilizadas.
- Pista dividida em três faixas com pavimento de blocos em quatro tonalidades, bordas claras e marcações visíveis.
- Lápides, árvores, cercas, mausoléus e lanternas em grupos de baixa complexidade.
- Movimento contínuo do pavimento e dos elementos decorativos para reforçar a sensação de deslocamento; nenhum desses objetos altera a hitbox.

### Phantom 3D
- Silhueta chibi arredondada, corpo mais definido, base com caudas, olhos expressivos, bochechas e boca.
- Halo ciano, movimento de flutuação e transparência visual na intangibilidade.
- As cinco paletas dos fantasmas e os acessórios comprados no jogo seguem funcionais.
- Não foram alterados salto, hitbox, velocidade, economia ou duração da perseguição.

### Caçador
- Corpo e roupa mais elaborados, chapéu com faixa, silhueta maior, lanterninha e luz quente.
- Movimento e aproximação herdados da perseguição anterior.

### Obstáculos
- Lápide com topo arredondado, placa, fissura e musgo.
- Portão de pedra com blocos, colunas, molduras e sinalização visual.
- Barreira espiritual semiptransparente com aro, runa e laterais.
- Orbes e Essências geométricos com núcleo claro e halo — sem pós-processamento pesado.

### Câmera e iluminação
- Visão de trás levemente mais próxima, girando a partir do ângulo lateral existente.
- Hemispheric ambient + moon directional + subtle cyan rim light.
- Tonemapping ACES e limite de pixel ratio de 1,3; sem sombras dinâmicas ou efeito bloom custoso.
- Perspectiva alternativa 2.5D mantém a mecânica e recebeu uma versão coerente da paleta/contraste.

## Restrições técnicas preservadas
- Nenhuma textura externa, nenhuma foto, modelo GLB ou fonte adicional; geometria simples criada programaticamente.
- Three.js continua carregado sob demanda apenas durante a perseguição.
- Atualização do pavimento é por reciclagem de objetos (sem criar/destruir meshes a cada quadro).
- Recursos geométricos e materiais são liberados no fim da cena, usando o descarte já existente.
- `advanceChaseHazard()` continua responsável por colisões únicas e descarte de obstáculos depois de cruzarem o personagem.
- A duração da perseguição, os 800 metros para entrar e o retorno perto de 1.300 metros continuam inalterados.

## Definição de pronto

- [x] Módulo de arte separado de controle/colisões.
- [x] Paleta, céu, pista, iluminação e personagens redesenhados.
- [x] Testes unitários para presença de elementos, skins, geometria, limites de objetos e reciclagem.
- [ ] Playtest visual do Three.js em Android Chrome.
- [ ] Playtest visual da perspectiva compatível no Android.
- [ ] Avaliar se as três faixas são distinguíveis mesmo com aumento da velocidade.
- [ ] Confirmar que o FPS é adequado no dispositivo real, com `?debug=1`.
- [ ] Conferir se o painel de diagnóstico está oculto ao remover `debug_chase=1`.
- [ ] Verificar se as interações e o retorno 2D continuam funcionando.

## Como testar
```bash
npm install
npm test
npm run build
npm run dev
```

Após o merge e o deploy do GitHub Pages, usar `?test_chase=1&v=0100` para entrar diretamente na perseguição. Conferir `BUILD 0.10.0-art-20261102` no canto inferior.

### Próximas PRs planejadas
- **PR #14:** variações de cenário, formas de árvores e mausoléus, composições ambientais por região.
- **PR #15:** rastros, partículas de chão, FX de colisão, pulsos animados em barreiras, polimento cinematográfico.

Esta PR é uma reformulação visual; não tenta incluir a fase de plataforma nem a incorporação do morcego.
