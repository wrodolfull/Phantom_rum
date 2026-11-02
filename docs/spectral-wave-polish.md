# Phantom Run — PR #21: Onda Espectral visível + continuidade de modos

## Problema
A Onda Espectral estava tecnicamente ativa no runner, porém os obstáculos desapareciam imediatamente ao gastar 3 almas. O efeito visual se limitava a dois círculos minúsculos, difíceis de perceber numa tela de celular. Além disso, a mensagem `RESGATE 3 ALMAS` era exibida **após** uma ativação bem-sucedida, pois era calculada após consumir as almas.

## Corrigido
- A Onda parte do Phantom com raio inicial de **24 pixels** e se expande até **350 pixels** em 1,05 segundo, com três anéis ciano/violeta, partículas distribuídas na frente do raio e forte contraste.
- Os inimigos físicos são destruídos quando o raio os alcança — **não antes**. Cada eliminação tem partículas próprias e fragmentos reutilizados. Não elimina buracos, barreiras espirituais, Essências ou orbes.
- O escudo temporário anterior continua ativo durante 2,7 segundos, preservando as regras de colidir com obstáculos físicos.
- Efeito visual desaparece quando o poder termina; rajadas de fragmentos têm limite de memória.
- Após tocar em `ONDA PRONTA`, a mensagem confirma **ONDA ESPECTRAL! ALMAS EM AÇÃO**, sem pedir para coletar almas novamente. Durante o efeito, tocar no botão informa que a Onda já está ativa.
- Comitiva de até cinco fantasminhas reorganizada em duas fileiras suspensas, reduzindo a sobreposição com o caçador e tornando os seguidores reconhecíveis.

## Agendamento das fases
- Novo indicador discreto no runner: `PRÓXIMO MODO EM N m` com contagem regressiva.
- Quando uma fase está pendente de um trecho seguro, mostra `ANOMALIA NO CAMINHO!`. O aviso é escondido durante mensagens importantes de perigo e encontro de morcego.
- Sem alteração no sorteio justo da PR20: não repete o mesmo modo em sequência.
- Teste de resistência de **960 eventos** simulados (32 partidas x 30 modos), conferindo zero repetições consecutivas, avanços positivos de distância, intervalo seguro de retorno e equilíbrio de frequência.

## Testes automáticos
- Testes puros de raio crescente, bloqueios válidos, efeitos desaparecendo e posicionamento de seguidores.
- Teste mobile Chromium com **toque real** no botão Onda: observa raio maior que 175 e depois maior que 340 pixels, confirmando que a expansão realmente ocorre; verifica término e restauração da UI.
- Regressões existentes de toque, caçador, 3D, mansão, morcego e tela cheia devem continuar verdes.

## Playtest após merge
`https://wrodolfull.github.io/Phantom_rum/?test_hunter=1&v=0180`

1. Confirme no rodapé `BUILD 0.18.0-wave-polish-20261102`.
2. Veja o caçador e o botão **ONDA 0/3** já no 2D.
3. No teste, tecle **J** três vezes, ou no jogo normal resgate 3 Almas Perdidas.
4. Toque no botão Onda. Espere uma expansão grande ciano/violeta para a frente do Phantom; os obstáculos físicos devem explodir **à medida que a onda passa**, não sumir ao tocar no botão.
5. Observe os 5 seguidores quando resgatar almas adicionais; agora ficam em duas fileiras.
6. Confira o texto do próximo modo e jogue uma partida longa, verificando se os modos 3D, mansão e morcego se alternam.
7. Teste rotação do aparelho e tela cheia no Android.

**Limitação:** o teste automatizado em Chromium confirma cálculo do efeito, estado do jogo e execução por toque, mas não substitui avaliação de legibilidade e FPS em um celular Android real.
