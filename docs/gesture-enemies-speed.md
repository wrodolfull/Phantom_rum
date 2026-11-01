# Phantom Run — Jogabilidade 0.8: gestos, movimento e inimigos

## Feedback incorporado
A interface mobile anterior colocava botões de ação sobre a área do jogo, atrapalhando a visualização do Phantom. A sensação de velocidade era baixa porque o cenário distante se movimentava lentamente e a aceleração demorava a ficar perceptível. Havia pouca diversidade de inimigos e obstáculos.

## Controles universais (sem botões de ação na tela)
- **Toque/clique curto (menos de 145 ms)** em qualquer região livre do cenário: **pular**.
- **Pressionar e segurar (145 ms ou mais)**: **ficar intangível**, consumindo EP enquanto estiver pressionado.
- **Soltar**: retornar à forma física; um hold nunca também dispara um pulo.
- Um segundo dedo pode dar um toque curto para pular enquanto o primeiro mantém a intangibilidade.
- Deslizar mais de 18 px cancela o tap (evita salto por arraste acidental).
- Cancelamento do toque, mudança de aba e perda de foco limpam os estados dos ponteiros.
- **Teclado** continua disponível: Espaço/↑ para pular, Shift para atravessar, Esc para pausar.
- **Pausa, música e efeitos** continuam como pequenos controles no topo da interface, não como botões grandes sobre o fantasma.
- O começo de cada partida ensina essa regra de controle pelo tutorial contextual.

**Decisão de UX:** como toque e hold compartilham a mesma superfície, o salto ocorre ao **soltar o toque curto**; isso introduz até 145 ms de atraso para distinguir intenção. O tempo de reação dos obstáculos é validado considerando uma margem conservadora. A alternativa com teclado não possui esse atraso.

## Cenário e velocidade
- Velocidade inicial sobe de 125 px/s para **160 px/s**.
- Velocidade máxima muda de 230 para **260 px/s**.
- Aceleração de `+1 px/s` a cada 90 px percorridos; alcança o máximo após cerca de **9.000 px** (900 metros no contador).
- Montanhas `0,16×`, floresta `0,37×`, lápides próximas `0,78×` e detalhes de primeiro plano `1,3×`; o terreno se move `1,0×`.
- Elementos rápidos perto do jogador e linhas de movimento suaves reforçam a velocidade, sem reduzir a visibilidade dos obstáculos.
- A cor do plano próximo muda levemente a cada 2.200 px para criar sensação de novas áreas no mesmo cemitério. **Biomas completos continuam fora desta etapa**.

## Novos inimigos e obstáculos

| Elemento | Regra | Característica |
| --- | --- | --- |
| Morcego rasante | Perigoso na forma física, atravessável intangível | Oscila verticalmente, com hitbox que acompanha o mergulho |
| Caçador de fantasmas | Perigoso na forma física, atravessável intangível | Personagem de sobretudo/lanterna, sólido |
| Alma perdida | Perigosa durante intangibilidade | Aparência violeta; ensina a soltar o comando |
| Espinhos | Perigosos na forma física | Puláveis ou atravessáveis |

Os obstáculos já existentes (muros, abismos, barreiras espirituais) continuam. Os quatro novos tipos são apresentados em segmentos próximos ao início, **após o tutorial de muro/orbe/abismo**, antes de introduzir combinações mais complexas.

## Regras de geração e colisão
- Os segmentos novos usam a mesma validação de energia e janelas mínimas de reação da versão 0.4.
- Uma rota conservadora utiliza intangibilidade somente ao atravessar perigos físicos, mantém forma física diante de ameaças espirituais e pula os abismos.
- As verificações ocorrem nas velocidades mínima e máxima.
- As colisões varridas incluem alturas apropriadas de morcego, caçador, alma perdida e espinhos.
- Nenhuma mudança nos atributos dos personagens comprados: todas as skins permanecem cosméticas.

## Teste manual obrigatório
1. Abrir no Android e confirmar que **não existem botões grandes** de pulo/atravessar cobrindo o fantasma.
2. Toque breve em posições variadas do cenário: Phantom pula ao soltar.
3. Manter o dedo: intangibilidade liga; soltar: desliga sem pulo adicional.
4. Segurar com um dedo e tocar com outro para saltar.
5. Arrastar, cancelar o toque ou trocar de aplicativo: nenhuma fase presa e nenhum pulo acidental.
6. Avançar após o tutorial e encontrar morcegos, almas perdidas, espinhos e caçadores.
7. Verificar que atravessar a alma perdida na forma física não causa morte.
8. Verificar que atravessar o morcego na forma intangível não causa morte.
9. Verificar que a velocidade do primeiro minuto é perceptivelmente maior e que o fundo move em várias camadas.
10. Testar loja/skins, game over, conquistas, música, pausa e controles do teclado.
11. Testar `?debug=1` e conferir desempenho em celular físico.

## Publicação
A PR passa por `npm test` e `npm run build`. Depois do merge, o GitHub Pages publica automaticamente pela rotina `Publish Phantom Run beta` se o Pages estiver habilitado. Evite fazer merge antes de confirmar CI e testar manualmente os gestos.
