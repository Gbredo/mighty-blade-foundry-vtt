# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-16 — 13:01
- Branch Ativa: main
- Último Commit: eaa97e5 (chore(test): add npm test script to package.json)

## Estado Atual
- **789/789 testes passando (0 falhas)** via `npm test`.
- Gap de 12 habilidades refutado em 2026-10-16 (todas as 721 notas estão nos JSONs-fonte do Foundry; pendente: confirmar 727 itens (563 + 164) nos compêndios dentro do Foundry).
- Perfil de Regras GB 2023 documentado no `AGENTS.md`.

## O Que Foi Feito
1. Site: consertado teste do "Pacto da Ambição" em `packages/rules-core/src/rules/requisitos.test.ts` (`153/153` testes verdes).
2. Foundry: adicionado `"test": "node --test tests/*.test.mjs"` ao `package.json` (`789/789` passando).
3. Site: ignorado `LIVROS MB ATUALIZADOS/` e `*.pdf` no `.gitignore`.

## Próximo Passo Recomendado
- Fazer `git push` e conferir a CI.

## Backlog (pausado pelo congelamento)
- Importar compêndio de monstros (154 criaturas do Obsidian para o Foundry).
- Avaliar o status histórico de "Força Interior" no Obsidian (GB 2017 vs GB 2023).
