# ⚡ Decisões de Implementação, Estruturas de Dados & Algoritmos
### Engenharia de Software Aplicada no Mighty Blade 3e

Este documento técnico detalha as estruturas de controle de repetição, estruturas de dados e padrões algorítmicos utilizados no ecossistema **Mesas do Breder**, explicando o **porquê da escolha**, os **arquivos e linhas onde estão implementados**, alternativas clássicas e trade-offs.

---

## 1. 🔁 Estruturas de Repetição & Iteração

Existem diferentes formas de iterar coleções na programação. Cada uma foi escolhida estrategicamente conforme o domínio do problema:

### A. Programação Funcional Imutável (`.map()`, `.filter()`, `.reduce()`)
* **Onde é usado:**
  * `packages/rules-core/src/rules/condicoes.ts` (linhas 85-115) — consolidação de penalidades de combate.
  * `apps/web/src/pages/Monstros.tsx` (linhas 125-155) — motor de filtragem reativa e multi-seleção de criaturas.
  * `apps/web/src/pages/Equipamentos.tsx` (linhas 150-180) — busca e renderização de itens da forja e alquimia.
* **Exemplo Reduzido de Código:**
  ```typescript
  // Em condicoes.ts: reduzindo 21 condições ativas a um modificador consolidado
  const penalidadeTotal = condicoesAtivas.reduce((acumulador, cond) => {
    return acumulador + (cond.modificadores?.ataque || 0);
  }, 0);
  ```
* **Por que foi feito assim?**
  * **Imutabilidade e Previsibilidade:** O motor de regras (`rules-core`) é uma biblioteca matemática pura. Não há mutação de estado externo (`side-effects`).
  * **Testabilidade com Vitest:** Funções puras que usam `.reduce()` ou `.map()` garantem que a mesma entrada sempre produza a mesma saída, permitindo testes unitários determinísticos em microssegundos.
* **Alternativas Consideradas:**
  * *`for` clássico indexado (`for (let i=0; i<n; i++)`):* Mais rápido em arrays de 1 milhão de elementos, porém mais propenso a erros de índice (*off-by-one errors*) e código verboso. Como lidamos com até ~200 itens em memória, o custo de overhead funcional é desprezível (< 0.1ms).

---

### B. Iteração Sequencial Determinística (`for...of`)
* **Onde é usado:**
  * `packages/rules-core/src/rules/progressao.ts` (linhas 45-75) — cálculo progressivo de Pontos de Evolução (PE) de nível 1 a 20.
* **Exemplo Reduzido de Código:**
  ```typescript
  // Em progressao.ts: cálculo acumulativo de XP para subir de nível
  let xpAcumulado = 0;
  for (const faixa of TABELA_PROGRESSAO) {
    if (xpAtual >= faixa.xpNecessario) {
      nivelAlcancado = faixa.nivel;
    } else {
      break; // Interrupção prematura assim que encontra o teto
    }
  }
  ```
* **Por que foi feito assim?**
  * **Interrupção Prematura com `break`:** Diferente de um `.forEach()` (que percorreria todas as faixas obrigatoriamente até o final), o `for...of` permite `break` imediato assim que o nível atual é determinado, economizando ciclos de processamento.
* **Alternativas Consideradas:**
  * *Busca Binária ($O(\log N)$):* Para uma tabela fixa de 20 níveis, o ganho teórico de uma busca binária é imperceptível frente à simplicidade e legibilidade linear do `for...of`.

---

### C. Laço de Repetição Condicional (`while` / `do...while`)
* **Onde é usado:**
  * `packages/rules-core/src/rules/combat.ts` (linhas 110-140) — motor de rolagem de dados com explosão de críticos e dados adicionais.
* **Exemplo Reduzido de Código:**
  ```typescript
  // Em combat.ts: resolução de dados extras e regras de Inaptidão
  let dadosRestantes = quantidadeDados;
  while (dadosRestantes > 0) {
    const resultado = rolarD6();
    resultados.push(resultado);
    dadosRestantes--;
  }
  ```
* **Por que foi feito assim?**
  * O número exato de iterações pode mudar dinamicamente em tempo de execução quando entram regras como dados bônus por Habilidades de Suporte ou regras de dados adicionais de armas superiores.

---

## 2. 🗄️ Estruturas de Dados & Otimização de Busca

### A. Dicionários Indexados em Hash Table (`Record<string, T>`)
* **Onde é usado:**
  * `packages/rules-core/src/data/bestiario.codex.ts` — 135 criaturas indexadas por slug (`"alce"`, `"aranha-gigante-jovem"`).
  * `packages/rules-core/src/data/equipamentos.ts` — 57 armas, armaduras e ferramentas.
  * `packages/rules-core/src/data/alquimia.ts` — 27 ingredientes canônicos.
* **Exemplo Reduzido de Código:**
  ```typescript
  // Busca direta em tempo constante O(1)
  const criatura = BESTIARIO[slug];
  ```
* **Por que foi feito assim?**
  * **Complexidade Algorítmica $O(1)$ vs $O(N)$:**
    Se guardássemos as 135 criaturas em um array simples `AnimalBase[]`, cada vez que um card ou modal abrisse teríamos que rodar `array.find(m => m.id === slug)` com complexidade linear $O(N)$.
    Com o `Record<string, AnimalBase>`, a busca no motor JavaScript (V8) é resolvida em tempo constante $O(1)$ via tabela hash nativa.

---

## 3. 🛡️ Expressões Regulares & Sanitização de Linguagem Natural (NLP)

* **Onde é usado:**
  * `apps/web/src/components/BestiarioComponents.tsx` (linhas 45-55) — des-hifenização de quebra de linha de PDF.
  * `scripts/fix_hyphenation.py` — pipeline de extração de texto do Codex Monstrorum.
* **Exemplo Reduzido de Código:**
  ```typescript
  export function sanitizarTextoHabilidade(texto?: string): string {
    if (!texto) return "";
    // Cura quebras de coluna dupla do PDF: 're- alizar' -> 'realizar'
    return texto.replace(/([a-zA-ZÀ-ÿ]+)-\s+([a-zA-ZÀ-ÿ]+)/g, "$1$2");
  }
  ```
* **Por que foi feito assim?**
  * Na diagramação em duas colunas estreitas de livros de RPG impressos, palavras longas no fim de linha recebem hífen (`-`) e quebra de linha (`\n`). Ao extrair texto vetorial de PDFs, isso vira espaço em branco (`re- alizar`).
  * A Regex com captura retroativa (`$1$2`) e suporte a todo o alfabeto latino acentuado (`[a-zA-ZÀ-ÿ]`) cura a língua portuguesa instantaneamente sem alterar palavras compostas legítimas que não possuem espaço após o hífen.
