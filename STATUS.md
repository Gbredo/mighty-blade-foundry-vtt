# STATUS TÁTICO — mighty-blade-foundry-vtt

- Data/Hora: 2026-11-18 — 05:30
- Branch Ativa: fase4-ida-e-volta (em cima da main = 5534c47)
- Agente Atual: Opus (Fase 4) / Antigravity (Windows)

## Estado Atual
- **877/877 testes passando** (`npm test`), com os novos 34 (contrato), 35 (ida e volta), 36 (paridade de números com as fixtures do site) e 37 (ida e volta mexendo no Foundry, Lote 4.5).
- **Fase 4 (ida e volta com o site):**
  - `module/helpers/ida-e-volta.mjs`: import (mochila vira Items, campos só do site na flag) e export para o site (contrato v1.2).
  - "Exportar para o site": clique direito no personagem (formato nativo v14: `label`/`visible`/`onClick`) e botão no cabeçalho da ficha.
  - TypeDataModel com `condicoesAtivas`, afinidades temporárias e `progressao`.
  - Paridade de números (Lote 4.4) corrigiu: RD da armadura (Pesada 1, 2 com Guerreiro de Aço 1, + Rígida 2), Defesa por qualidade e material, Pernas Vulpinas em dobro, opção do Manual do Combatente no Deslocamento e na Iniciativa, PV/PM em dobro no import, `condicoesAtivas` em `temCondicao`.
  - Lote 4.5: atributos dos níveis 4/7/10 vindos do site (`progressao`) e débito de atributo do Antecedente entram nos atributos; Corpo Equino (Deslocamento com 2× AGI, Carga com 2× FOR).
  - Ficha: tooltip das defesas sem HTML vazando; rótulo da Carga FOR × 7 / × 35 / × 70.
  - Pendência: penalidade de movimento por condição ainda não existe no Foundry (o site tem).
- Fase 2 + 2B: mergeadas na `main` (`5534c47`).

## Próximo Passo Imediato
- Rodar o roteiro da seção 7 de `docs/fase4-plano.md` do site (fixtures sem diff, `npm test`).
- Esperar o "merge" do Bredo para `fase4-ida-e-volta`. Sem push automático.
