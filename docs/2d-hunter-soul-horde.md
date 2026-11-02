# Phantom Run — PR #19: caçador persistente no 2D e comitiva de almas

## Mudança central: não existe mais morte com um único erro no runner 2D

O caçador passa a correr atrás do Phantom também na visão lateral, como durante a perseguição 3D. A cada erro ele se aproxima. O **Game Over só acontece quando o medidor de perigo chega a 100**.

| Evento | Perigo gerado |
|---|---:|
| Obstáculo físico ou espiritual, sem proteção | +25 |
| Cair num abismo, sem proteção | +36 |
| Obstáculo com Alma protetora | +12, consome 1 Alma |
| Abismo com Alma protetora | +17, consome 1 Alma |
| Resgatar Alma Perdida | -5 |
| Ativar Onda Espectral (gasta 3 Almas) | -18 |
| Sobreviver sem novos erros por 3,5s | -1,4/s |

Começa em **16/100**. São necessários cerca de **quatro erros seguidos** sem proteção para o caçador capturar. Há 1,35 s de imunidade após cada impacto, evitando dano em todos os frames de contato. Cair num abismo agora reposiciona o Phantom depois da borda, sem Game Over imediato.

## Mecânica inspirada em grupos de Zombie Tsunami: a Comitiva Espectral

- Ao longo da corrida aparecem Almas Perdidas douradas em posições seguras, afastadas de obstáculos.
- Passe sobre uma Alma na forma física, no chão, para resgatá-la.
- Até **cinco fantasminhas seguem Phantom**, formando uma comitiva visível. Eles não são apenas cosméticos: cada um pode absorver um impacto e reduzir a quantidade de perigo gerado.
- Quando há **três almas**, aparece um botão discreto **ONDA [Q]**; no teclado, aperte Q.
- A Onda Espectral consome três almas, reduz o medidor em 18 e destrói ameaças físicas à frente por **2,7 segundos**, com efeito visual circular.
- A onda **não elimina buracos nem barreiras espectrais**: o jogador ainda precisa saltar e alternar entre físico/intangível.
- Não copia personagens, cenários ou interface de Zombie Tsunami. Usa a progressão por grupo como inspiração para uma mecânica própria.

## Visuais e feedback
- Caçador em pixel art original, usando duas poses de corrida e lanterna, visível atrás do Phantom durante toda a fase 2D.
- A distância física entre o caçador e Phantom diminui quando o perigo cresce.
- Barra do caçador no canto superior esquerdo: `CAÇADOR XX/100 · ALMAS N`, com cor variando conforme o risco.
- Fantasminhas amigos acompanham o personagem em posições levemente diferentes para transmitir movimento de grupo.
- Ao sofrer dano: flash, efeito de impacto e mensagem de aproximação. Com proteção, a mensagem informa a perda de uma Alma.
- Em 100/100 o caçador corre o último trecho para pegar Phantom antes da tela de resultados.

## Continuidade entre modos
- `RunSnapshot.hunterDanger` e `RunSnapshot.soulCompanions` são campos opcionais, compatíveis com os dados anteriores.
- O medidor de perigo é preservado nas passagens 2D→3D e 3D→2D, inclusive fallback sem WebGL.
- A comitiva de almas é preservada ao entrar/sair da perseguição 3D, Mansão das Almas e fase do morcego. Ela não é exibida dentro da mansão e do voo bônus; reaparece quando Phantom volta ao runner.
- A lógica de colisões, gravidade, pontuação, Essência e energia de outros modos não foi alterada.

## Performance
- Texturas de caçador e almas geradas uma vez no Canvas, sem sprites externos nem chamadas WebGL.
- No máximo cinco imagens de almas acompanhantes.
- Onda desenhada em um único Graphics reutilizado.
- Geração de pickups controlada por distância e filtro para descartar itens fora do campo.

## QA e validação
```bash
npm install
npm test
npm run build
npm run test:e2e
```

Após merge/Pages, conferir `BUILD 0.16.0-hunter-20261102` e usar:

- `https://wrodolfull.github.io/Phantom_rum/?v=0160` — jogar normalmente.
- `?test_hunter=1&v=0160` — QA: tecla H simula um impacto, J resgata uma alma e Q ativa a onda (atalhos somente nesta URL).
- Testar um muro sem fase: recebe dano, mas segue correndo; após 4 erros, medidor 100, animação do caçador e resultados.
- Cair no buraco: retorna ao chão com aumento de perigo, sem morrer no primeiro erro.
- Verificar a imunidade de 1,35 segundos; mesmo parado no contato, não deve somar dano a cada quadro.
- Resgatar três almas e ativar a onda no Android por botão na tela; verificar que as almas são consumidas e as ameaças físicas próximas desaparecem.
- Verificar que o caçador e o medidor continuam coerentes após ida e volta do 3D.

## Fora do escopo
- Horde com combate complexo, novas evoluções de poderes, físicas de todos os aliados ou duplicação de efeitos de moedas da loja.
- Novos obstáculos específicos que exigiriam 3 ou 5 almas serão avaliados apenas depois de observar o equilíbrio dessa primeira versão.
