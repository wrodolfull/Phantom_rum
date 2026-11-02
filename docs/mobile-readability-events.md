# Phantom Run — PR #20: legibilidade mobile, modos recorrentes e novos sprites

## Problemas observados no celular
- O caçador na corrida 2D parecia ausente ou pequeno.
- A Onda Espectral não era descoberta: seu botão só aparecia quando já havia três almas e as almas estavam muito espaçadas.
- Perseguição 3D, Mansão e morcego eram eventos únicos, com longos trechos sem mudança de gameplay.
- Inimigos e obstáculos não eram reconhecíveis visualmente.

## 1. Caçador 2D legível
- Caçador escala 1,48, dentro da tela ao fundo, sempre visível (perigo 0–100).
- Aura de lanterna e contorno laranja/vermelho conforme a ameaça.
- Painel ampliado com `CAÇADOR N/100  ALMAS N/5` e barra de perigo maior.
- Não muda valores de dano/HP: quatro impactos comuns continuam levando ao máximo.
- Partícula do hunter e sprites de aliados são visuais, não hitboxes.

## 2. Onda Espectral e almas mais acessíveis
- Primeira alma disponível perto dos 25m; novas oportunidades aproximadamente a cada 51m, realocadas se há perigo perto.
- Botão `✦ ONDA 0/3` **sempre aparece** no lado inferior direito, desde o começo.
- Cada alma resgatada atualiza o contador. Após três, o botão mostra `✦ ONDA PRONTA!`, aumenta levemente e pulsa em ciano.
- Ao tocar no botão sem almas suficientes, surge um recado do que falta.
- Q continua funcionando no PC; toque diretamente no botão funciona no celular.
- O efeito da onda e o consumo de três almas continuam limitados a 2,7s e 3 companheiros.

## 3. Sorteio controlado de modos especiais
Motor puro em `src/game/specialEvents.ts`:
- Primeira oportunidade entre **260–350m**, após o tutorial inicial.
- Eventos posteriores com **175–265m de 2D** entre oportunidades, contando a partir do gatilho. Quando uma cena adiciona muita distância bônus, a volta à corrida reserva ao menos 175m de novo trecho 2D.
- Três modalidades possíveis: perseguição 3D, mansão de plataformas e encontro com o morcego.
- Sorteio pseudoaleatório com seed da partida, reproduzível em testes.
- **Sem duas modalidades iguais seguidas**; preferência automática pelas modalidades menos vistas. A cada três escolhas todas as modalidades aparecem ao menos uma vez.
- Só abre um evento quando o Phantom está no chão, na forma física e há 190px livres de ameaça à frente.
- O scheduler, a seed, as contagens e o próximo evento são preservados no `RunSnapshot` durante as transições.
- O novo 3D também pode ocorrer várias vezes: cada ocorrência termina após **500m de distância de perseguição e no mínimo 18s ativos**, sem voltar a 1300m/sem diminuir a distância da run.
- A mansão pode ser reaberta, mas cada visita continua garantindo recompensa limitada à própria passagem.
- O morcego pode reaparecer quando sorteado novamente; se o jogador perder a captura, não prende o scheduler.
- Atalhos de QA `test_chase`, `test_platform`, `test_bat`, `test_flight` continuam disponíveis.

## 4. Silhuetas e sinalização
Sprites 2D originais redesenhados diretamente no Canvas:
- Morcego perigoso: duas asas abertas, olhos rosa-vermelhos e presas brancas.
- Guardião de chão: uniforme vermelho, chapéu e lanterna contrastante, distinto do caçador em perseguição.
- Espectro: corpo flutuante, braços abertos e olhos vermelhos.
- Lápide: forma clara com símbolo central.
- Espinhos: estacas de ossos com faixa vermelha de alerta.
- Muro físico: bloco cinza com runa azul/ciano indicando uso de intangibilidade.
- Barreira espiritual: pilar violeta com símbolos claros.
- Avisos de ação sobre obstáculos à frente: `FASE`, `FÍSICO`, `PULAR`, com cores distintas.
- Os avisos são quatro objetos Phaser Text e um Graphics reciclados, **sem criar um novo texto a cada frame**.
- Materiais/sprites não alteram as caixas de colisão.

## Performance e regressão
- No máximo um caçador 2D, cinco fantasminhas acompanhantes, quatro avisos e um Graphics de pistas.
- Os eventos usam cenas existentes. O 3D continua sob demanda; não roda Three.js durante a corrida 2D.
- A repetição de modos não cria cenas novas ou múltiplas cópias do mesmo renderer.
- Tests: escolha de eventos, distribuição justa, restauração de estado, início seguro e término 3D sem retroceder.
- Playwright em viewport landscape com suporte a touch, verificando presença do caçador, botão Onda desde 0/3 e toque direto para ativar após resgatar três almas.
- Testes anteriores da perseguição, plataforma, morcego e fullscreen precisam permanecer verdes.

## Playtest após merge
- Abra `https://wrodolfull.github.io/Phantom_rum/?v=0170` e confira `BUILD 0.17.0-mobile-events-20261102`.
- Já no início do 2D: visualize caçador, sua lanterna, a barra `N/100` e botão `ONDA 0/3`.
- Resgate as primeiras três almas; confirme contador, animação do botão e a Onda funcionando por toque.
- Veja a primeira mudança de modalidade antes de 350m (salvo se houver obstáculos ou o personagem estiver no ar).
- Faça uma corrida longa e confirme mudanças de modo, sem duas iguais seguidas nem retorno da distância para trás.
- Veja se cada novo inimigo é distinguível e se o rótulo de ação concorda com a colisão.
- Compare desempenho Android Chrome antes/depois e confirme que o fullscreen não esconde HUD ou botão Onda.

**Não incluído:** novo modo de formação de horda com combate próprio; o objetivo desta PR é clareza, frequência e visual.
