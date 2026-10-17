# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-17 — 15:25
- Branch Ativa: main
- Último Commit: baf77b9 (feat(regras): duplicata e limite ao arrastar, habilidades virtuais para automáticas substituídas e aviso em lote de magias)

## Estado Atual
- **801/801 testes passando (0 falhas)** via `npm test` local e CI verde no GitHub Actions (run `39057846224`).
- `packs/` limpo e sincronizado via `git checkout` e `git clean`.
- Prevenção de duplicatas ativa no navegador e ao arrastar itens para a ficha (com remoção da cópia repetida e aviso `warn`).
- Limite de espaços ao arrastar atua informativamente (`warn: Espaços excedidos (X / Y)`), sem bloquear importações de fichas prontas.
- Habilidades Virtuais implementadas em paridade com o site (`removerEmCascata`), somando automáticas substituídas ao limite.
- Aviso consolidado de magias em lote (`N magias adicionadas ao Grimório.`).
- Glossário do Cofre atualizado com `LevelDB.md` e referenciado em `00_Glossario.md`.

## Próximo Passo Imediato
- Pronto para novas tarefas ou validação do usuário.
