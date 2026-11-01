# Phantom Run — Diagnóstico da transição 3D (0.9.2)

## Problema
No celular, o usuário reporta que a perseguição iniciada aos 800 metros desaparece e a corrida lateral reaparece quase imediatamente, mesmo após a PR #10.

O código da `main` exige ao menos 18 segundos de jogabilidade em perseguição. Portanto a saída precoce NÃO deveria ser uma conclusão normal. As hipóteses são: versão antiga no Pages/cache, falha na inicialização WebGL, falha no fallback, ou alguma saída inesperada de cena.

## Instrumentação incluída
- **BUILD 0.9.2-debug-20261101**: marca pequena no rodapé de todas as telas. Ajuda a confirmar que o site publicou o código novo, sem depender do cache do navegador.
- `?debug_chase=1`: mostra um pequeno painel com a cena ativa, trocas recentes de modo, tempo efetivo da perseguição e erros capturados.
- `html[data-phantom-mode]`: estado observável pela automação, com os valores `menu`, `runner`, `chase-loading`, `chase-three`, `chase-compat`.
- `html[data-phantom-chase-error]`: última exceção capturada pelo Three.js (local, nenhuma telemetria externa).
- `html[data-phantom-chase-seconds]`: segundos ativos durante o trecho de perseguição.
- `?force_compat=1` junto de `?test_chase=1`: permite testar a perseguição de compatibilidade sem depender da GPU.

## Teste automatizado no GitHub Actions
Além de Vitest e `npm run build`, o CI agora instala Chromium com Playwright e testa:
1. Abrir o menu e entrar no 3D pela opção `?test_chase=1`.
2. Verificar que a cena ativa permanece `chase-three` ou `chase-compat` após seis segundos, e que seu relógio avançou.
3. Forçar o modo de compatibilidade e verificar que ele permanece jogável após quatro segundos.

Os testes capturam screenshots e traces em caso de falha, evitando aprovar novamente uma versão que só passa nos testes de unidades mas sai instantaneamente no browser.

## Como testar a publicação real
Após o merge e a execução bem-sucedida de `Publish Phantom Run beta`:
1. Abrir `https://wrodolfull.github.io/Phantom_rum/?test_chase=1&debug_chase=1&v=092`.
2. Confirmar o texto **BUILD 0.9.2-debug-20261101** no rodapé.
3. Pressionar **JOGAR**, observar a câmera/pista e o painel.
4. Se voltar instantaneamente, anotar/salvar o texto do painel e o erro. O painel continua disponível no runner.
5. Abrir `?test_chase=1&force_compat=1&debug_chase=1&v=092` para distinguir falha WebGL de falha geral na troca de cenas.

**Nota:** o teste de Playwright usa Chromium num ambiente CI e não substitui a reprodução em Android. O controle da versão serve para não confundir uma página antiga com uma versão corrigida.
