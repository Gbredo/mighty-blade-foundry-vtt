# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-10-17 — 17:30
- Branch Ativa: main
- Último Commit: a ser aprovado pelo usuário

## Estado Atual
- **807/807 testes passando (0 falhas)** via `npm test` local.
- **Etapa J (Restrições de Raça e Idioma de Habilidades Gerais) implementada**:
  - `export_canonical_content.cjs` repassa `racasExcluidas` e `idiomasRequeridos` no system e flags de habilidades/magias.
  - `validarAquisicaoHabilidade` bloqueia com mensagens idênticas ao site ("Não disponível para <Raça>.", "Requer falar um destes idiomas: …").
  - `compendium-browser.mjs` exibe tag de ineligibilidade específica e oculta com "Apenas elegíveis".
  - Compêndios LevelDB (`packs/`) e JSONs-fonte (`packs/*_src/`) sincronizados e recompilados.

## Próximo Passo Imediato
- Realizar commit e push após aprovação do usuário.
