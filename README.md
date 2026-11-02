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
| Pular | Espaço, ↑ ou clique curto | Toque curto no cenário |
| Intangibilidade | Segurar Shift ou mouse | Segurar o dedo sobre o cenário |
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

## Beta mobile e GitHub Pages (MVP 0.7)
- Tela 16:9 responsiva, aviso de orientação com opção de continuar em retrato.
- Botões grandes de pular/atravessar foram removidos na versão 0.8; apenas controles discretos de pausa e áudio permanecem.
- Multitouch por gestos e tratamento de cancelamento/pausa ao alternar apps ou ocultar a aba.
- HUD com atualização de texto otimizada; `?debug=1` mostra FPS local e quadros lentos para avaliação.
- Favicon e manifesto originais, compilação estática com caminhos relativos para hospedagem em subdiretório.
- Workflow para publicar no **GitHub Pages**, após configurar **Settings → Pages → Source → GitHub Actions**.
- Não há modo offline nesta versão e os testes em celulares reais ainda são necessários.

Leia [docs/mobile-beta.md](docs/mobile-beta.md) antes de liberar o link publicamente.

## Gestos, inimigos e velocidade (MVP 0.8)
- Ações sem botões na tela: **toque/clique curto pula; segurar deixa intangível; soltar retorna à forma física**.
- Multitouch para segurar com um dedo e saltar com outro; cancelamentos não geram saltos acidentais.
- Novos inimigos: morcego rasante, caçador de fantasmas e alma perdida; novo obstáculo: espinhos.
- Primeiras aparições após o tutorial, com combinações geradas e validadas em níveis posteriores.
- Aceleração mais rápida e camadas de cemitério próximas que se deslocam com parallax, além de efeitos discretos de movimento.
- Testes para gestos, novas colisões e solvabilidade da geração.

Detalhes e roteiro de testes em [docs/gesture-enemies-speed.md](docs/gesture-enemies-speed.md).

## Perseguição 3D a partir dos 800 metros (MVP 0.9)
- O jogador corre automaticamente até 800 m; ao atingir um trecho seguro, a câmera muda para **atrás do Phantom** e começa uma perseguição low-poly com **Three.js**.
- O caçador fica mais próximo quando há colisões. Três faixas podem ser alternadas por swipe (mobile) ou setas/A/D (desktop).
- Toque curto pula, segurar ativa a intangibilidade; não há botões grandes na tela.
- Lápides, portões, barreiras espirituais, Essência e orbes usam regras de colisão próprias.
- Após a perseguição até 1.150 m, Phantom retorna automaticamente ao modo 2D, mantendo progresso e energia.
- Renderização 3D carregada sob demanda; fallback para 2D se WebGL indisponível.
- Para testar imediatamente o modo 3D, abra a URL com `?test_chase=1` e pressione **Jogar**.
- Testes automatizados cobrem gatilho de transição, persistência do estado, ondas de obstáculos e comandos de swipe.

Detalhes: [docs/3d-chase.md](docs/3d-chase.md).

### Próxima mecânica planejada: incorporação do morcego
Um morcego especial terá janela de captura sincronizada por um anel pulsante. Ao acertar, Phantom voará por um trecho aéreo de coleta de Essência e retornará ao chão. O conceito está em [docs/bat-possession-roadmap.md](docs/bat-possession-roadmap.md). **Ainda não está implementado.**

## Correção da perseguição curta (MVP 0.9.1)
- A fase 3D agora acontece até **1.300 metros**, com pelo menos **18 segundos de jogabilidade ativa** antes do retorno ao 2D.
- O Phaser 2D usa Canvas para reservar WebGL para o Three.js em celulares.
- Se o 3D não puder iniciar, há uma perseguição **2.5D de compatibilidade**, jogável e com os mesmos controles — sem voltar imediatamente ao runner.
- Dados da partida são preservados ao retornar em qualquer modo.
- Use `?test_chase=1` para testar a perseguição sem precisar alcançar 800 metros.

Confira [docs/3d-chase-fix.md](docs/3d-chase-fix.md).

## Spooky Arcade 3D — revisão visual (PR #13)
- Perseguição 3D redesenhada no estilo **cartoon low-poly noturno**, com lua, estrelas, neblina, colinas e iluminação azulada.
- Pista com blocos de pedra estilizados, bordas claras, três faixas legíveis e cenário decorativo em movimento.
- Phantom em 3D com silhueta chibi, olhos, bochechas e caudas, preservando skins e acessórios da loja.
- Caçador com modelagem estilizada, chapéu e lanterna; lápides, portões, barreiras, orbes e Essências com materiais e silhuetas próprios.
- Versão de compatibilidade 2.5D alinhada à nova paleta.
- Modelos geométricos procedurais, sem assets externos, sombras dinâmicas ou pós-processamento pesado.
- Mecânicas, duração da perseguição e correção dos obstáculos que grudavam no personagem preservadas.
- Confira [docs/3d-art-foundation.md](docs/3d-art-foundation.md).

Para testar o visual diretamente após o deploy, acesse `?test_chase=1&v=0100` e confira a marca `BUILD 0.10.0-art-20261102`.

## Três ambientes 3D na mesma perseguição (PR #14)
- **Cemitério Esquecido (800–959 m):** lápides, ciprestes e lanternas sob luz roxa noturna.
- **Bosque das Almas (960–1129 m):** árvores tortas, salgueiros e pequenas luzes fantasmagóricas, com céu verde-azulado.
- **Ruínas Lunares (1130–1300 m):** portões quebrados, obeliscos rúnicos, memoriais e criptas, com céu violeta.
- O céu, a neblina, a iluminação e as pedras mudam suavemente. A decoração só troca de aparência quando recicla fora do primeiro plano.
- Nenhuma mudança na colisão, energia, caçador, controles ou tempo do modo 3D.
- Detalhes, testes e critérios de aceite: [docs/3d-regions.md](docs/3d-regions.md).

Após o deploy: `?test_chase=1&v=0110` com a marca `BUILD 0.11.0-regions-20261102`.

## Efeitos e polimento da perseguição (PR #15)
- Phantom deixa um rastro de partículas discretas, mais intenso quando intangível.
- Saltos, mudança de faixa, coleta de Essência e orbes, colisão e troca de fase ganharam feedback visual.
- Barreiras espirituais pulsam com runas animadas; orbes e Essências têm núcleo/halo em movimento.
- A câmera reage suavemente a impactos e desvios sem modificar física ou obstáculos.
- Caçador possui oscilação de corrida e a saída do 3D tem partículas de transição.
- O 3D usa **uma única pool de até 64 partículas**. O modo 2.5D compatível tem até 40 faíscas desenhadas em Phaser Graphics.
- Não foram alterados os thresholds de 800/1300 m, tempos, colisões, loja ou modo 2D.
- Para comparar fluidez, abra a perseguição com `?test_chase=1&no_fx=1` (desliga apenas o pool de partículas do Three.js).
- Critérios e checklist em [docs/3d-vfx-polish.md](docs/3d-vfx-polish.md).

Versão da página após merge: `BUILD 0.12.0-vfx-20261102`.

## Terceiro modo — Mansão das Almas (PR #16)
O Phantom Run agora alterna entre corrida lateral 2D, perseguição low-poly 3D (800–1300 metros) e uma **fase de plataforma 2D aos ~1450 m**. A troca acontece no trecho seguro seguinte, sem perder o progresso.

- Ao entrar na mansão, o movimento passa a ser livre (não há corrida automática). Use esquerda/direita, pule entre plataformas e procure a saída.
- Controles desktop: A/D ou setas para mover; Espaço/↑ para pular; Shift para fase; Esc para pausar.
- Controles mobile sem botões grandes: **arraste o polegar na metade esquerda para mover; toque ou segure na metade direita para pular ou ficar intangível**. Multitoque funciona.
- Corredor em pixel art com 8 suportes, uma runa que exige forma física, um portão que exige intangibilidade, **8 Essências**, **2 orbes** e dois checkpoints.
- A sala conserva EP, Essência, contadores e cosméticos. Ao escapar, o runner retoma com uma recompensa de **70 metros** e a mansão não se repete na mesma partida.
- A entrada usa um gatilho seguro, e uma queda devolve ao último checkpoint sem obrigar o jogador a reiniciar a corrida.
- Acesse diretamente a mansão com `?test_platform=1&v=0130`.
- Guia e critérios de aceite: [docs/platform-chapter.md](docs/platform-chapter.md).

## Incorporação de morcego e fase de voo (PR #17)
Depois de concluir a mansão, aos ~1700m, surge um morcego luminoso especial com um círculo que diminui conforme se aproxima.
- Acerte a janela verde: **E** no PC ou toque diretamente no morcego no celular.
- Phantom incorpora o morcego e voa por ~10 segundos, mudando entre três alturas para coletar Essência.
- O voo concede **até 10 Essências extras e 135m**, sem risco de Game Over. No final Phantom desincorpora, cai suavemente e volta ao runner 2D.
- Se perder a captura, outra oportunidade pode aparecer cerca de 650m depois. Uma incorporação bem-sucedida por corrida.
- A partida mantém EP, cosméticos, pontos, estatísticas e a conclusão da perseguição 3D e da mansão; não há recompensa duplicada.
- QA do encontro: `?test_bat=1&v=0140`; QA do voo: `?test_flight=1&v=0140`.
- Manual em [docs/bat-possession-flight.md](docs/bat-possession-flight.md).

Versão de verificação: `BUILD 0.14.0-batflight-20261102`.

## Modo tela cheia (PR #18)
- O botão **⛶** no canto inferior direito entra em tela cheia em qualquer modo: menu, corrida 2D, perseguição Three.js/2.5D, Mansão das Almas e voo do morcego.
- No PC, a tecla **F** alterna entre tela cheia e janela. Para sair, também é possível usar **Esc** quando o navegador estiver em tela cheia nativa.
- Em Android Chrome, o sistema usa a **Fullscreen API** para ocultar barras do navegador e tenta bloquear a orientação na horizontal. O bloqueio pode ser recusado pelas preferências do dispositivo.
- Em navegadores que não suportam fullscreen em elementos HTML (algumas versões de Safari/iOS), utiliza uma **visualização alternativa que preenche o espaço disponível da página**, sem prometer ocultar os controles do sistema.
- Ao sair do modo cheio, o jogo continua na cena atual sem reiniciar a partida.
- Para manter a geometria do jogo e do 3D fiel, o palco é centralizado em **16:9**, com barras laterais discretas quando o display tem proporção diferente. O HUD do Three.js acompanha o mesmo palco.
- Botão tem acessibilidade por leitor de tela (aria-label, aria-pressed); não depende do Phaser e funciona também durante as transições.
- Versão de teste: `BUILD 0.15.0-fullscreen-20261102`. Após merge/deploy, confira `?v=0150`.

## Caçador no 2D e Comitiva Espectral (PR #19)

No runner lateral, o caçador agora **corre visualmente atrás do Phantom**, com uma barra de perigo **0–100**. Acabou a morte por um único contato: cada erro aumenta a perseguição e só quando ela chegar a 100 o caçador alcança Phantom. Quedas em abismos também geram perigo e devolvem o personagem a um trecho seguro. Após ser atingido há um pequeno período de proteção para não sofrer dano várias vezes no mesmo obstáculo.

Mecânica original inspirada em corridas de grupo:
- **Resgate Almas Perdidas** douradas durante a corrida. Até cinco pequenos fantasmas seguem o Phantom.
- Cada alma acompanhante pode ser consumida ao receber um golpe, **reduzindo o perigo causado**.
- Junte **3 almas** e ative a **Onda Espectral** com **Q** (desktop) ou pelo botão **ONDA** (celular). Ela consome 3 almas, afasta o caçador e abre caminho por obstáculos físicos durante alguns segundos.
- A onda não permite atravessar abismos sem saltar nem remove runas espirituais; trocar entre formas ainda é necessário.
- O perigo e a comitiva são preservados ao entrar e sair da perseguição 3D, Mansão das Almas e voo do morcego.
- O caçador tem duas poses originais em pixel art e animação de captura ao chegar a 100.

Ver [docs/2d-hunter-soul-horde.md](docs/2d-hunter-soul-horde.md) para regras, balanceamento e testes.

**Teste:** após merge e publicação, entre em `?test_hunter=1&v=0160`, confira **BUILD 0.16.0-hunter-20261102**. Nessa URL de QA, H simula erro, J resgata alma e Q ativa onda. Para testar o fluxo real, use o jogo normalmente.

## PR #20 — Inimigos legíveis, Onda mobile e eventos aleatórios recorrentes
- **Caçador 2D maior e sempre visível**, com brilho de lanterna e barra de perigo ampliada.
- **Onda Espectral sempre visível** (`0/3 → 1/3 → 2/3 → PRONTA`) em botão adequado para toque; as primeiras almas aparecem cedo.
- **Perseguição 3D, Mansão e morcego se repetem** em intervalos de corrida com aleatoriedade controlada: sem duas modalidades iguais seguidas e preferência por formatos menos vistos.
- Primeira oportunidade especial a partir de ~260–350m, próximas oportunidades separadas por trechos 2D de pelo menos ~175m.
- Perseguições 3D repetidas têm término próprio, evitando reduzir o contador de metros ou ficar presas aos 1300m originais.
- Sprite original redesenhado para morcego, guardião, espectro, espinhos, lápides, muros e barreiras, com rótulos `PULAR`, `FASE` ou `FÍSICO` próximos dos perigos.
- QA e critérios em [docs/mobile-readability-events.md](docs/mobile-readability-events.md).

Após o merge e publicação, abra `?v=0170` e confira `BUILD 0.17.0-mobile-events-20261102`.

## PR #21 — Onda Espectral expansiva e melhor continuidade
- A Onda agora faz um **anel de energia ciano/violeta se expandir pelo cenário**, em vez de um círculo pequeno ao redor do Phantom.
- Inimigos físicos explodem com partículas quando a Onda os alcança. Buracos e obstáculos espirituais continuam perigosos.
- Corrigido o aviso equivocado que pedia resgatar 3 Almas após ativar a Onda.
- Os fantasminhas da Comitiva ficam em duas fileiras visíveis, menos sobrepostos ao Caçador.
- Indicador **PRÓXIMO MODO EM N m** torna a recorrência de 3D, mansão e morcego mais fácil de acompanhar.
- Teste de resistência com 960 eventos aleatórios simulados, além do teste de expansão no Chromium móvel.
- [Guia e QA da PR21](docs/spectral-wave-polish.md). Build esperado: `0.18.0-wave-polish-20261102`.
