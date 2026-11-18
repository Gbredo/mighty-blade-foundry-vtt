# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-11-18 — 04:30
- Branch Ativa: fase4-ida-e-volta (em cima da main = 5534c47)
- Agente Atual: Opus (Fase 4) / Antigravity (Windows)

## Estado Atual
- **848/848 testes passando** (`npm test`), com os novos 34 (contrato), 35 (ida e volta) e 36 (paridade de números com as fixtures do site).
- **Fase 4 (ida e volta com o site):**
  - `module/helpers/ida-e-volta.mjs`: import (mochila vira Items, campos só do site na flag) e export para o site (contrato v1.2).
  - "Exportar para o site": clique direito no personagem (formato nativo v14: `label`/`visible`/`onClick`) e botão no cabeçalho da ficha.
  - TypeDataModel com `condicoesAtivas`, afinidades temporárias e `progressao`.
  - Paridade de números (Lote 4.4) corrigiu: RD da armadura (Pesada 1, 2 com Guerreiro de Aço 1, + Rígida 2), Defesa por qualidade e material, Pernas Vulpinas em dobro, opção do Manual do Combatente no Deslocamento e na Iniciativa, PV/PM em dobro no import, `condicoesAtivas` em `temCondicao`.
- Fase 2 + 2B: mergeadas na `main` (`5534c47`).

## Próximo Passo Imediato
- Rodar o roteiro da seção 7 de `docs/fase4-plano.md` do site (fixtures sem diff, `npm test`).
- Esperar o "merge" do Bredo para `fase4-ida-e-volta`. Sem push automático.
