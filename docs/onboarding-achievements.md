# Phantom Run — Tutorial, resultados e conquistas (MVP 0.5)

## Tutorial não bloqueante
A primeira partida apresenta dicas contextuais na parte superior da tela, sem pausar a corrida:
1. O personagem corre sozinho.
2. Antes da primeira parede (x=420): segurar Shift / toque direito para ficar intangível.
3. Após atravessar: soltar para recuperar energia.
4. No orbe (x=640): explicar recuperação de energia.
5. Antes do primeiro abismo (x=860): Espaço / toque esquerdo para saltar.

A conclusão é salva localmente depois de sobreviver ao primeiro abismo.
Se o jogador morrer antes disso, as dicas reaparecem na tentativa seguinte.
O botão **COMO JOGAR** no menu permite repetir o tutorial mesmo após a conclusão.

## Resultados e persistência
Após cada morte, o progresso local recebe exatamente uma atualização:
- Distância e Essência da partida.
- Recordes pessoais e Essência máxima.
- Partidas disputadas, distância total, Essência acumulada.
- Conquistas desbloqueadas, sem duplicações.

Os dados são salvos em `phantom-run-progress-v1`. O recorde do antigo
`phantom-run-best-v1` é migrado na primeira leitura. Se o armazenamento estiver
inacessível, o jogo continua sem persistência (dados apenas da sessão).

A nova tela de resultado mostra distância, recorde, Essência, nova(s) conquista(s),
meta progressiva e botões de reinício e menu. Reiniciar começa uma nova partida
sem recarregar a página.

## Conquistas iniciais (8)
- PRIMEIROS PASSOS: concluir uma partida.
- PULO DO GATO: executar um salto.
- ENTRE MUNDOS: usar intangibilidade.
- ATRAVESSADOR: superar uma parede.
- CAÇA-ESSÊNCIAS: coletar 5 Essências numa partida.
- CEM METROS: alcançar 100 m numa partida.
- INSISTENTE: jogar dez partidas.
- SEM DESCANSO: percorrer 1.000 m acumulados.

Todas são desbloqueáveis apenas por gameplay; não há monetização, contas ou ranking.

## Testes
```bash
npm install
npm test
npm run build
npm run dev
```
Verificar manualmente:
- Primeira partida mostra tutorial; morrer no primeiro muro mantém tutorial.
- Sobreviver ao primeiro abismo esconde dicas nas próximas partidas.
- **COMO JOGAR** reativa dicas sem apagar conquistas.
- Vitória pessoal acima do recorde exibe nova marca.
- Novo desbloqueio aparece no resultado e na galeria.
- Repetir a mesma conquista não aumenta contagem.
- Abrir o jogo com `localStorage` antigo mantém o recorde.
- Botões de reinício/menu e teclas funcionam no desktop e no touch.

## Observações
A interface mantém resolução lógica 480×270 em pixel art. O áudio original,
efeitos de partículas, controles e gerador de segmentos seguem da versão anterior.
Testes automatizados cobrem decisões do tutorial, pontuação, migração e progresso;
o playtest real no browser e no celular continua necessário.
