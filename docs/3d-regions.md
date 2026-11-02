# Phantom Run — PR #14: ambientação 3D e regiões do cemitério

## Objetivo
Complementar a base visual *Spooky Arcade 3D* da PR #13 com um mundo mais variado, sem transformar o jogo em um projeto pesado ou alterar controles, física, colisões e progressão.

## Regiões da perseguição 3D

| Distância | Região | Identidade |
|---|---|---|
| 800–959 m | Cemitério Esquecido | Tons roxos, lápides, ciprestes, lanternas e mausoléus |
| 960–1129 m | Bosque das Almas | Céu verde-azulado, árvores tortas, salgueiros sombrios e cogumelos luminosos |
| 1130–1300 m | Ruínas Lunares | Céu violeta profundo, portões partidos, pilares rúnicos, memoriais e criptas |

**Importante:** as regiões são partes de um único trecho 3D, não novas fases com pontuação independente. O caçador, as três faixas, os objetos coletáveis e o retorno ao 2D continuam funcionando exatamente como antes.

## Melhorias implementadas
- Adicionados **seis novos tipos de cenário low-poly**: árvore retorcida, salgueiro, pilar com runas, portão antigo quebrado, fungos luminosos e memorial.
- Cada posição de decoração lateral possui três variações regionais pré-construídas, com somente uma ativa.
- A mudança visual de cada decoração ocorre **quando ela passa da câmera e retorna ao fundo**, evitando alterações bruscas de objetos perto de Phantom.
- Céu, neblina, luar, iluminação de contorno e tonalidade das pedras mudam suavemente entre as regiões.
- Um aviso discreto `NOVA REGIÃO: ...` aparece quando se alcançam 960 m e 1130 m.
- As faixas e os obstáculos mantêm cores legíveis sobre cada novo piso.
- Não há carregamento de texturas externas, modelos GLB, shaders próprios ou sombras dinâmicas.

## Performance e segurança
- Os modelos decorativos ficam prontos ao entrar no Three.js; **nenhum novo mesh ou geometria é criado a cada quadro ou troca de região**.
- O sistema usa os mesmos **26 slots** de decoração lateral e recicla sua posição em profundidade.
- Apenas um dos três desenhos de cada slot fica visível. Os demais permanecem ocultos.
- As cores dos materiais são interpoladas usando objetos `THREE.Color` existentes, sem alocação de material a cada frame.
- O tempo do modo 3D, o gatilho de 800 m, a saída perto de 1.300 m, os controles e a economia não mudam.
- As animações e regras de `advanceChaseHazard()` não são alteradas.

## Testes automatizados
- Identificação correta das três regiões por distância.
- Paletas e transições suaves.
- Alternância das decorações apenas após a reciclagem de um slot.
- Quantidade constante de elementos de cena após a atualização visual.
- Testes existentes de personagens, obstáculos e passagens 3D/2D.

```bash
npm install
npm test
npm run build
npm run test:e2e
```

## Checklist visual após o merge
1. Acesse o jogo com `?test_chase=1&v=0110` e confirme `BUILD 0.11.0-regions-20261102`.
2. Observe os cenários e personagens em um Android real, sem `debug_chase=1`.
3. Percorra os 20 segundos da perseguição: perceba a mudança do cemitério para bosque e depois para ruínas.
4. Confira que a pista e os perigos continuam fáceis de distinguir, inclusive sobre o piso de tonalidades diferentes.
5. Observe se árvores, portões e criptas passam pela câmera sem travar na frente de Phantom.
6. Valide que os controles por gestos, a câmera, o caçador, as colisões e o retorno à visão 2D continuam operando.
7. Teste também `?test_chase=1&force_compat=1`: o modo 2.5D deve continuar jogável, embora sem a troca de geometrias Three.js.
8. Compare o FPS do celular com a PR #13. Se o desempenho cair, reduzir quantidade de decorações ativas antes de introduzir novos efeitos na PR #15.

## Próxima etapa
**PR #15 — efeitos e polimento:** trilha de partículas do Phantom, brilho rúnico, efeitos de coleta, impacto e movimento de câmera; priorizar impactos perceptíveis com baixo custo em GPU mobile.

Esta PR é visual e não inclui a fase de plataforma ou incorporação do morcego.
