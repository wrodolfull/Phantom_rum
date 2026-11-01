# Correção da perseguição 3D — duração e compatibilidade (versão 0.9.1)

## Sintoma observado

Ao alcançar 800 metros a tela inicia a perseguição 3D, mas retorna ao 2D em menos de um segundo.

## Diagnóstico no código

O percurso 3D anterior tinha uma meta de 1.150 metros, o que corresponderia a aproximadamente 14 segundos de deslocamento efetivo, não a menos de 1 segundo. Entretanto, `ChaseScene.create()` interceptava qualquer falha em `import("three")`, na criação do renderizador WebGL ou da cena, e chamava imediatamente `scene.start("game")`. Em dispositivos com limitação de contexto/WebGL, isso produzia uma volta praticamente instantânea, sem explicação visível.

Sem acesso ao console do aparelho em que o erro aconteceu, não é possível determinar qual erro concreto de WebGL ou import ocorreu. A correção cobre essas alternativas e a perda de contexto durante a partida.

## Ajustes

1. **Somente um renderizador WebGL por vez.** O Phaser (2D, resolução lógica 480×270) agora usa Canvas, reservando o WebGL do dispositivo para o Three.js, quando compatível.
2. **Fallback jogável.** Se o Three.js não carregar, o WebGL não inicializar ou o contexto for perdido, a perseguição continua numa perspectiva de pista **2.5D desenhada no Phaser**, com o caçador, 3 faixas, swipe, salto, intangibilidade, energia, itens e colisões — sem pular silenciosamente a fase.
3. **Duração ampliada e protegida.** A perseguição normal vai de 800 a **1.300 metros**, e só retorna ao 2D depois de pelo menos **18 segundos ativos**; à velocidade de 255 px/s, são aproximadamente 19,6 segundos de jogabilidade, mais a entrada e o retorno.
4. **Pausa respeitada.** Tempo em pausa ou com a aba oculta não conta como tempo ativo.
5. **Progresso preservado.** Ao retornar da perseguição, distância, Essência, EP, estatísticas e cosméticos permanecem na mesma partida, inclusive em modo de compatibilidade.
6. **Sem progresso falso.** Falha em WebGL não deve atribuir instantaneamente uma distância fictícia nem aumentar o recorde.
7. **Diagnóstico.** A ocorrência do fallback é registrada no console com o motivo técnico; no gameplay aparece o indicador `PERSEGUIÇÃO • COMPATIBILIDADE` para distinguir uma perspectiva simulada de uma cena 3D Three.js.

## Testes

```bash
npm install
npm test
npm run build
npm run dev
```

Acesse `?test_chase=1` na URL e pressione **JOGAR** para iniciar diretamente aos 800 metros.

### Manual em navegador desktop e mobile

- [ ] Entrar no 3D em aparelho compatível com WebGL2 e conferir cenário low-poly, caçador e 3 faixas.
- [ ] Permanecer na perseguição por cerca de 20 segundos ativos, até próximo de 1.300 m.
- [ ] Simular perda de contexto/WebGL indisponível: modo 2.5D jogável deve permanecer, em vez de regressar ao 2D imediatamente.
- [ ] Testar toque para pular, segurar para intangibilidade e swipe entre faixas.
- [ ] Verificar se pausa interrompe o relógio e se o retorno preserva Essência e EP.
- [ ] Repetir o percurso, inclusive `?test_chase=1`, para descartar acúmulo de canvas/listeners.
- [ ] Confirmar que Game Over só aparece quando o caçador alcançar Phantom.
- [ ] Confirmar que o jogo volta ao runner 2D normal e não reabre o evento dos 800 m na mesma partida.

O CI checa TypeScript e regras determinísticas de progressão; apenas playtest no aparelho real confirma se o modo Three.js está disponível nele.
