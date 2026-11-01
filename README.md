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
