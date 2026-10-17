# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-17 — 13:45
- Branch Ativa: main
- Último Commit: e79527d (fix(ficha): agrupar habilidades pela origem (lista da classe/raca/caminho), nao pela categoria; icone de cadeado na trava de edicao)

## Estado Atual
- **793/793 testes passando (0 falhas)** via `npm test` local e CI verde no GitHub Actions (run `39050656290`).
- Agrupamento de habilidades na ficha refatorado para usar origem (flags explícitas ou listas canônicas de classe/caminho/organização/raça), eliminando dependência de `categoria === "caracteristica"`.
- Navegador de compêndio integrado com sub-abas (Gerais/Raça/Classe/Caminho/Organização) e filtro "Apenas elegíveis".
- Trava de edição atualizada com ícone de cadeado (`fa-lock` / `fa-lock-open`).

## Próximo Passo Imediato
- Pronto para as próximas tarefas do roadmap ou integrações entre Foundry e Website.
