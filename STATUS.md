# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-17 — 15:10
- Branch Ativa: main
- Último Commit: f8a18a7 (feat(ficha): bloquear habilidade repetida, limite de espaços por nível (regra do rules-core) e aviso/grupo de magias na aba Habilidades)

## Estado Atual
- **797/797 testes passando (0 falhas)** via `npm test` local e CI verde no GitHub Actions (run `39056784149`).
- Navegador de compêndio e Ficha do Ator atualizados com cálculo estrito de espaços de habilidades por nível (`CANONICAL_HABILIDADES_POR_NIVEL` do `rules-core`).
- Prevenção de duplicatas ativa no navegador com badge `Já possui` e bloqueio de re-aquisição via `ui.notifications.warn`.
- UX de Magias aprimorada: exibição de grupo resumido "Magias (N)" com atalho para o Grimório na aba de habilidades, notificação `ui.notifications.info` ao aprender magias, e renderização limpa de dificuldades não-numéricas (sem prefixo `DV 0`).

## Próximo Passo Imediato
- Pronto para as próximas tarefas do roadmap ou novas especificações canônicas.
