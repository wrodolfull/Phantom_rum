# Phantom Run — Loja Espectral (MVP 0.6)

## Visão geral
O menu principal ganha **LOJA**. A loja contém duas abas: **Fantasmas** e **Acessórios**. Todos os itens são estritamente cosméticos: mesma gravidade, velocidade, hitbox, força do salto e consumo de intangibilidade.

A moeda é a **Essência**, obtida nas corridas e creditada no Game Over (como já ocorria nas versões anteriores). A loja não utiliza pagamento real, cadastro, anúncios ou serviços externos.

## Catálogo

| Fantasma | Custo (Essência) | Aparência |
| --- | ---: | --- |
| Phantom | Gratuito | Branco, fantasma inicial |
| Spectra | 8 | Rosa suave |
| Wisp | 16 | Verde espectral |
| Boozer | 28 | Âmbar |
| Luna | 45 | Violeta lunar |

| Acessório | Custo (Essência) |
| --- | ---: |
| Nenhum | Gratuito |
| Laço Rubi | 5 |
| Chapéu Místico | 10 |
| Coroa Lunar | 18 |

## Economia e persistência

- `totalEssence` continua significando **Essência obtida em toda a história**, preservando conquistas e estatísticas antigas.
- `spentEssence` registra gastos acumulados.
- Saldo disponível: `max(0, totalEssence - spentEssence)`.
- Compras validam o saldo, o preço e a identidade do item **antes** de alterar a progressão.
- Comprar um item já adquirido não cobra nada.
- Ao comprar, o item é automaticamente equipado.
- Equipar um item anteriormente comprado é gratuito.
- Itens não desbloqueados não podem ser equipados.
- Os dados são guardados na mesma chave `phantom-run-progress-v1`, com migração dos saves anteriores e validação das IDs.
- O inventário segue acessível durante a sessão caso o navegador bloqueie armazenamento; nesse caso, não persiste depois de fechar a aba.

## Experiência do usuário
1. Acesse LOJA no menu principal ou após Game Over.
2. Visualize três cards por página, nome, sprite e preço.
3. Use setas para navegar na coleção.
4. Em COMPRAR, a Essência é debitada e o personagem/acessório é equipado.
5. Em EQUIPAR, um visual comprado é selecionado sem novo pagamento.
6. O menu principal, a corrida e a tela de resultados exibem o visual equipado.
7. Ao alternar para forma intangível, o traje e a cor spectral permanecem reconhecíveis.

## Recursos e limitações
O desenho dos personagens usa texturas 32×32 criadas localmente com Canvas, conforme a estética pixel art do projeto; os sprites são gerados somente para as combinações visualizadas/selecionadas. Nada requer imagens licenciadas ou downloads externos.

A economia ainda é **local e offline**. Não há prevenção antifraude ou sincronização entre aparelhos; esse recurso exigiria uma conta e um backend em versão futura.

## Validação
- `npm test`: compra, saldo insuficiente, compra duplicada, migração, inventário, troca de aparência e atributos cosméticos.
- `npm run build`: checagem TypeScript e compilação.
- Playtest: comprar Spectra, reiniciar, equipar Phantom e acessórios, fechar/abrir a página, verificar saldo e visual.
- Playtest em mobile: botões, paginação, compra e retorno ao menu.
