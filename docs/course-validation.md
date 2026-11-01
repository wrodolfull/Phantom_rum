# Phantom Run — geração justa de obstáculos (MVP 0.4)

## Gerador
- `src/world/course.ts` define uma biblioteca de segmentos originais, em quatro níveis.
- Um gerador com semente (xorshift32) embaralha as sequências e evita repetir o mesmo trecho imediatamente sempre que houver alternativa.
- A introdução possui um muro, orbe e abismo separados para aprendizado natural.
- O próximo trecho só é escolhido após testar uma rota segura que inclui os objetos já posicionados à frente.
- Caso nenhum segmento de perigo passe, o algoritmo escolhe um trecho **respiro** com recursos e nenhum obstáculo fatal.

### Contrato de rota segura
É garantida a existência de um caminho para o jogador que:
1. Salta antes do início de cada abismo.
2. Usa intangibilidade apenas durante a travessia do muro.
3. Solta intangibilidade antes de barreiras espirituais.
4. Coleta os orbes encontrados na pista.
5. Não desperdiça energia intencionalmente.

O verificador calcula recuperação em deslocamento físico, gasto energético durante a travessia e uma margem mínima de reação de 0,42 s à velocidade máxima. Abismos devem caber dentro do salto físico com margem de segurança de 0,18 s. Cada rota é testada nas velocidades limite (125 e 230 px/s).

**Limite importante:** o sistema não garante sobrevivência depois que o jogador desperdiça energia ou erra o momento de ativar a habilidade. Isso faz parte do desafio. A validação atual é numérica/conservadora, não um solucionador exaustivo de todas as sequências possíveis de comandos.

## Colisões
- Muro físico possui 66 px de altura, maior que o salto máximo de aproximadamente 60 px — é obrigatório usar intangibilidade.
- Barreira espiritual de 50 px continua fatal apenas quando o fantasma está intangível.
- O corpo usa hitbox de 20 × 21 px e detecção de colisão varrida entre passos físicos fixos.
- Abismos eliminam o apoio quando o centro do Phantom entra na abertura.
- O Phantom só pousa caso alcance o piso vindo de cima, evitando teletransporte ao sair de buracos.

## Ritmo
| Distância | Tier | Velocidade aproximada |
| --- | --- | --- |
| 0 m | 1 | 125 px/s |
| 500 m | 2 | 145 px/s |
| 1.500 m | 3 | 185 px/s |
| 3.000+ m | 4 | 230 px/s (máximo) |

## Testes
Execute `npm test` (Vitest); CI roda testes e compilação. Casos cobertos:
- 120 sementes de geração de até 65 segmentos, validadas nas velocidades extrema mínima e máxima;
- energia insuficiente diante de uma parede;
- abismos grandes demais para o salto;
- duas ameaças sem tempo mínimo de reação;
- objetos sobrepostos;
- colisão varrida com barreira estreita;
- suporte do piso nas bordas dos abismos;
- impossibilidade de voltar automaticamente ao chão depois de cair abaixo do nível do piso.

### Manual
1. Pular a tempo para atravessar cada abismo.
2. Tentar pular por cima do muro: ele deve exigir intangibilidade.
3. Permanecer intangível diante de barreira espiritual: Game Over.
4. Esgotar energia dentro do muro: Game Over.
5. Alternar rapidamente estado antes de uma barreira e verificar ausência de falso positivo.
6. Testar teclado e multitouch, segurando o lado direito e tocando o lado esquerdo.
7. Testar pausa e retorno ao jogo após múltiplas mortes.

## Próximas melhorias
- Simulação automatizada do controlador dentro do Phaser (headless) para avaliar taxa de mortes falsas.
- Testes reais de movimento em aparelhos com taxas variáveis de atualização.
- Feedback visual/sinalização para mudança de tier.
