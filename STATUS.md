# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-16 — 13:28
- Branch Ativa: main
- Último Commit: 3ab728f (docs(status): close ability gap item after confirming 727 packed items)

## Estado Atual
- **789/789 testes passando (0 falhas)** via `npm test` e CI configurada em `.github/workflows/ci.yml` (Node 22).
- Gap de 12 habilidades refutado e encerrado em 2026-10-16 (`727` itens — `563` habilidades + `164` magias — confirmados nos compêndios LevelDB e validados via `npm run parity` no site).
- Perfil de Regras GB 2023 documentado no `AGENTS.md`.

## O Que Foi Feito
1. Confirmados `727` itens (`563` em `packs/habilidades` + `164` em `packs/magias`) extraídos via `@foundryvtt/foundryvtt-cli` e encerrado o item do gap.
2. Criado `.github/workflows/ci.yml` rodando `npm ci` e `npm test` em Node 22 a cada push e PR na `main`.

## Próximo Passo Recomendado
- No repositório do site (`MightyBlade3eWebsite`), refinar `scripts/report-divergencias.ts` (Tarefa 8) para classificar as divergências entre `habilidades-*.ts` e `generated/habilidades.json`.

## Backlog (pausado pelo congelamento)
- Importar compêndio de monstros (154 criaturas do Obsidian para o Foundry).
- Avaliar o status histórico de "Força Interior" no Obsidian (GB 2017 vs GB 2023).
