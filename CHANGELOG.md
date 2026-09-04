# CHANGELOG — Mighty Blade 3e (Foundry VTT System)

## [1.4.0] — 2026-09-03
### Adicionado
- **Sincronização com `@mighty-blade/rules-core` v0.1.0 (Build Canônico)**:
  - Campos de schema canônico: `karma` (range -100 a +100), `relacionamentos` (array de `RelacionamentoItem`), `pastaId`, `ordem` e `visibilidade`.
  - Matriz de afinidade e posturas táticas canônicas (`aliado`, `neutro`, `inimigo`) para tokens e fichas de atores.
  - Suporte à formatação de história e anotações com Markdown e chips bidirecionais de Wikilinks (`[[Nome]]`).
  - Prevenção contra registros de relacionamento duplicados ou contraditórios com o mesmo alvo.

## [1.3.0] — 2026-08-30
### Adicionado
- Integração do motor *Build-a-Beast* para geração procedural de monstros do *Codex Monstrorum*.
- Tabela de materiais (Aço, Prata, Mithril, Madeira Nobre) e qualidades para cálculo automático de dano e defesas.

## [1.2.0] — 2026-08-20
### Adicionado
- Suporte inicial para Foundry v10 e v11.