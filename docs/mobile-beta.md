# Phantom Run — Beta para navegador e celular (0.7)

Esta etapa prepara uma versão estática para testes públicos, **não publica o jogo automaticamente antes do merge**.

## Navegação e controles
- Resolução lógica preservada em **480 × 270** (16:9), ajustada ao espaço da tela.
- Telas em retrato em celulares pequenos recebem recomendação para girar o aparelho; o jogador pode optar por continuar em retrato.
- No celular, durante a partida, três botões HTML com grandes áreas de toque: **PULAR**, **ATRAVESSAR** (segurar) e **PAUSAR/CONTINUAR**.
- O antigo toque nas metades do canvas continua como alternativa; teclado desktop permanece (Espaço/↑, Shift, Esc).
- O controle de intangibilidade permite dois dedos ao mesmo tempo. Soltar um dedo não cancela outro ainda pressionado.
- Eventos `pointercancel`, perda de captura, perda de foco e troca de aplicativo liberam a intangibilidade.
- Ao sair da tela do jogo, todos os handlers de touch são liberados.
- O jogo pausa automaticamente ao perder foco/ficar oculto e **não retoma sozinho**; o usuário decide quando continuar.
- Texturas do placar e do nível não são recriadas todos os quadros quando o conteúdo está inalterado.

## Como executar e verificar
```bash
npm install
npm test
npm run build
npm run preview
```
Abra a URL indicada pelo Vite.

Para exibir o diagnóstico simples de desempenho: acrescente `?debug=1` à URL. A sobreposição mostra FPS aproximado e proporção de quadros acima de 33,4 ms, com janela móvel de até 120 frames. **Não é telemetria**: os números ficam apenas no aparelho.

## Checklist de aceite manual
- [ ] Android Chrome em paisagem: menu, tutorial, corrida, pausa, Game Over, loja, conquistas.
- [ ] Android Chrome em retrato: aviso para girar, botão de exceção, sem página arrastável.
- [ ] iPhone Safari em paisagem e retrato: as mesmas telas e controles.
- [ ] Toque simultâneo: segurar ATRAVESSAR e pressionar PULAR.
- [ ] Manter intangibilidade e abrir outra aba/app: o fantasma para e o botão libera corretamente.
- [ ] Teclas Espaço/Shift/Esc/M/N continuam funcionais no computador.
- [ ] Trilha começa somente após interação, e pausa não produz notas acumuladas.
- [ ] Loja: comprar, equipar, persistir e voltar a jogar com a mesma skin.
- [ ] Recorde e conquistas permanecem após recarregar a página.
- [ ] `?debug=1`: observar comportamento durante 2–5 minutos em um aparelho real.
- [ ] Conferir zoom/legibilidade dos textos, área de toque e recortes em aparelhos estreitos.
- [ ] Testar conexão lenta e recarregamento (sem prometer funcionamento offline).

O objetivo de projeto é **60 FPS em dispositivos compatíveis**; métricas observadas em dispositivos reais ainda não foram obtidas.

## GitHub Pages: instruções de publicação
O workflow `.github/workflows/pages.yml` instala as dependências, roda testes e build e publica os arquivos estáticos de `dist` a cada push para `main` ou execução manual.

Após aprovar e mesclar a PR:
1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Abra a aba **Actions → Publish Phantom Run beta** e confira o resultado da execução (ou rode `Run workflow`).
4. O endereço esperado para uma publicação padrão é `https://wrodolfull.github.io/Phantom_rum/`; confirme o endereço efetivo na saída do deployment/Settings Pages.

A publicação só estará realmente disponível quando o site do Pages estiver habilitado e o job de deploy concluir com sucesso. Não alteramos a visibilidade do repositório ou de suas permissões.

## Restrições e transparência
- O Vite usa `base: "./"` para funcionar tanto em domínio próprio quanto num subdiretório do GitHub Pages.
- Inclui um manifesto e ícone SVG originais para apresentar a marca no navegador; **não há service worker nem cache offline** nesta versão.
- Os saves, compras e conquistas permanecem no `localStorage` do navegador. Não há login, sincronização entre aparelhos ou analytics externos no código do jogo.
- É uma beta: performance, controles touch, layout e física ainda requerem testes manuais em dispositivos físicos.
