# Mighty Blade 3e — Foundry VTT System

## Contexto do projeto

Sistema customizado para o RPG brasileiro **Mighty Blade 3ª Edição Revisada** no Foundry VTT.
Projeto pessoal do desenvolvedor Gbredo (github.com/Gbredo).
Repositório: https://github.com/Gbredo/mighty-blade-foundry-vtt

**Não confundir com o projeto universitário** (Mighty Blade Website — Node.js + Express + Prisma + PostgreSQL + React). Este é um projeto separado e pessoal.

Existe também um **projeto paralelo de gerador de ficha** (em outro contexto) que futuramente exportará um arquivo `.json` compatível com este sistema para importação no Foundry.

---

## Ambiente de desenvolvimento

- **OS:** Windows 11
- **Foundry VTT:** V14 Build 359
- **Pasta do projeto (editar aqui):** `C:\Users\g_bre\mighty-blade-foundry-vtt`
- **Symlink ativo para:** `C:\Users\g_bre\AppData\Local\FoundryVTT\Data\systems\mighty-blade`
- **Editar no VS Code** na pasta do repositório — as mudanças refletem automaticamente no Foundry via symlink
- **Para ver mudanças no Foundry:** recarregar a página (F5) ou reiniciar o Foundry dependendo do tipo de mudança

---

## Stack

- Foundry VTT V14 (API ApplicationV2 / DataModel)
- JavaScript ES Modules (`.mjs`)
- Handlebars (`.hbs`) para templates de fichas
- SCSS (compilado para `css/mighty-blade.css`)
- Sem framework frontend (vanilla JS + Foundry API)

---

## Estrutura de arquivos

```
mighty-blade-foundry-vtt/
├── system.json                          ← manifesto do sistema (id: "mighty-blade")
├── template.json                        ← schema legado (referência)
├── module/                              ← TODO o código JS ativo vive aqui
│   ├── mighty-blade.mjs                 ← ENTRY POINT principal
│   ├── data/
│   │   └── actor-character.mjs          ← DataModel do personagem (mecânicas reais do MB, INTEGRADO)
│   ├── documents/
│   │   ├── actor.mjs                    ← classe MightyBladeActor
│   │   └── item.mjs                     ← classe MightyBladeItem
│   ├── sheets/
│   │   ├── actor-sheet.mjs              ← sheet de personagem/NPC
│   │   └── item-sheet.mjs               ← sheet de item
│   ├── helpers/
│   │   ├── config.mjs                   ← constantes MIGHTY_BLADE
│   │   ├── create-races.mjs             ← helper de criação de raças
│   │   ├── effects.mjs                  ← Active Effects
│   │   └── templates.mjs                ← preload de templates Handlebars
│   └── apps/
│       └── compendium-browser.mjs       ← browser de compêndio customizado
├── src/                                 ← APENAS fonte do SCSS (compila para css/)
│   └── scss/
│       ├── mighty-blade.scss
│       ├── components/
│       ├── global/
│       └── utils/
├── templates/
│   ├── actor/
│   │   ├── actor-character-sheet.hbs
│   │   ├── actor-npc-sheet.hbs
│   │   └── parts/
│   │       ├── actor-effects.hbs
│   │       ├── actor-features.hbs
│   │       ├── actor-items.hbs
│   │       └── actor-spells.hbs
│   ├── item/
│   │   ├── item-sheet.hbs
│   │   ├── item-arma-sheet.hbs
│   │   ├── item-classe-sheet.hbs
│   │   ├── item-equipamento-sheet.hbs
│   │   ├── item-feature-sheet.hbs
│   │   ├── item-habilidade-sheet.hbs
│   │   ├── item-item-sheet.hbs
│   │   ├── item-magia-sheet.hbs
│   │   └── item-raca-sheet.hbs
│   │   └── parts/
│   │       └── item-effects.hbs
│   └── apps/
│       └── compendium-browser.hbs
├── assets/
├── css/
│   └── mighty-blade.css                 ← CSS compilado (não editar direto)
├── lang/
│   └── en.json
├── lib/
└── packs/
```

---

## Entry point (module/mighty-blade.mjs)

O `init` hook já registra:
- `MightyBladeActor` como documentClass de Actor
- `MightyBladeItem` como documentClass de Item
- `MightyBladeActorSheet` como sheet padrão de Actor
- `MightyBladeItemSheet` como sheet padrão de Item
- Preload dos templates Handlebars
- `game.mightyBlade` com referências globais
- `CONFIG.MIGHTY_BLADE` com constantes do sistema

---

## Mecânicas do Mighty Blade 3e

> Base: Guia para Iniciantes 3.5. Mecânicas avançadas (Caminhos, Aprendiz de Classe) no Guia Básico e Guia do Herói/Vilão.

### Atributos (4 no total)
| Atributo | Usos principais |
|---|---|
| **Força** | combate corpo a corpo, Bloqueio, Carga, resistência física |
| **Agilidade** | Esquiva, ataques à distância, furtividade, iniciativa |
| **Inteligência** | percepção, conhecimento, magias arcanas |
| **Vontade** | interações sociais, Determinação, magias místicas, concentração |

- Valores definidos por **Raça + Classe** (sem roll de atributos)
- Sem modificadores derivados — o valor do atributo é usado diretamente nos testes

### Sistema de dados
- **Somente d6** — nunca d4, d8, d10, d12, d20
- Teste padrão: **2d6 + atributo** vs dificuldade (ou confronto entre personagens)
- Inapto (sem habilidade ou em condição adversa): rola **1d6** ao invés de 2d6
- Habilidades podem adicionar **+1d6** extras ao teste (acumuláveis)
- **Sucesso Crítico:** 2 ou mais dados mostram 6 simultaneamente
- **Falha Crítica:** todos os dados mostram 1

### Recursos
- **Nível 1:** 60 PV e 60 PM (fixo, independente de raça/classe)
- A cada nível, o jogador gasta 1 **Ponto de Evolução** em UMA opção:
  - +10 PV
  - +10 PM
  - +5 PV e +5 PM
  - Aprender idioma (máx de idiomas = valor de Inteligência)
  - Adquirir um Caminho (especialização — requer pré-requisitos, ver Guia do Herói/Vilão)
  - Tornar-se Aprendiz de outra Classe (acesso às habilidades da classe extra, sem somar atributos; máximo de 1 classe extra)
- **Nível 4:** +1 em 2 atributos diferentes (bônus fixo de progressão)
- A cada nível: +1 Habilidade nova da lista da Classe

### Defesas
```
Bloqueio      = 5 + Força     + Bônus de Armadura + Bônus de Bloqueio
Esquiva       = 5 + Agilidade + Bônus de Armadura + Bônus de Esquiva
Determinação  = 8 + Vontade   + Bônus de Determinação
```
- Em combate físico, o alvo usa sua **maior** Defesa (Bloqueio ou Esquiva)
- **Determinação** é usada contra efeitos mágicos que afetam a mente
- Bônus de Armadura soma em ambas as defesas físicas; bônus de Escudo soma só no Bloqueio
- **Empilhamento:** bônus do **mesmo tipo NÃO acumulam** — usando 2 armaduras, vale só a de
  maior Defesa; com 2 escudos, idem. (Exceção: a característica **Túnica** — Gambeson/Aramida —
  pode ser usada por baixo de outra armadura; soma as FNs, mas pra Defesa mantém só a maior RD.)
- Bônus vindos de **Habilidades/Caminhos** (Aparar, Movimentos Evasivos, etc.) **acumulam**
  livremente entre si e com armadura/escudo (são os "Bônus de Bloqueio/Esquiva/Determinação").

### Carga
- Básica = Força × 5 kg (acima disso: Inapto)
- Máxima = Força × 10 kg (acima disso: não consegue se mover)
- A **FN de tudo que está equipado/vestido** também ocupa Carga. Se a soma dessas FN passar
  da Carga Básica (Força × 5), o Deslocamento cai para **2 m**, sem correr/saltar, e o
  personagem fica **Inapto em todos os testes de Agilidade**.
- ⚠️ Código antigo usava ×10/×20 — corrigido para ×5/×10 (confere com a Forja e a errata).

### Combate
- **Ataque:** 2d6 + Força (ou Agilidade) vs Defesa do alvo
- **Dano corporal:** dano da arma + Força do atacante
- **Dano à distância:** valor fixo da arma ou For+ conforme tabela
- **Iniciativa:** 2d6 + menor entre (Agilidade, Inteligência)
- **Deslocamento:** `floor(Agilidade / 2) + 4` m (NotebookLM). ⚠️ A Forja usa `+5`; o código antigo
  usa base fixa 6. **Pendente confirmar +4 vs +5 antes de mexer no código.** Bônus raciais
  (Fauno/Tailox +1) somam em cima.
- **Corrida:** Deslocamento × 4 (cai pra × 2 com armadura **Pesada** ou **Rígida**).
- Ações por turno: livre / padrão / movimento / rodada completa (escolher combinação)
- Força Necessária (FN): se FN da arma > Força do personagem → aquele ataque é Inapto

### Magias
- Feiticeiro usa **Runas Arcanas**; Sacerdote usa **Selos Místicos**
- Teste de conjuração: 2d6 + atributo vs Dificuldade da magia
- **PM só é gasto se a magia for bem-sucedida** (diferente de Habilidades de Ação/Reação, que gastam antes)
- Sucesso Crítico em magia: escolher entre não gastar PM OU dobrar dano/área/duração

### Equipamento, Defesas e Mãos (regras detalhadas — base do próximo sistema)
- **Equipar:** itens têm estado **equipado** (booleano). Só os equipados contam nas defesas/mãos.
- **Armadura:** Defesa soma em Bloqueio **e** Esquiva. Só uma armadura "vale" (a de maior Defesa);
  exceção Túnica (ver acima).
- **Escudo:** "Ocupa uma mão"; Defesa soma **só no Bloqueio**; com 2 escudos vale só o maior.
- **Propriedade "Pesada":** RD 1 (reduz todo dano sofrido em 1); −1 m de salto; Corrida vira × 2.
  NÃO reduz o andar base nem causa Inaptidão em Agilidade por si só.
- **Propriedade "Rígida"** (Guia Básico): RD 2 (cumulativo com Pesada); Corrida × 2; montado reduz
  a FN da armadura em 1. No Manual do Combatente virou **"Restritiva"**: percepção e furtividade
  feitas como Inapto.
- **FN (Força Necessária):**
  - Armadura com FN > Força → **todos** os testes como Inapto (Força, Agilidade **e conjuração**).
  - Escudo com FN > Força → segura mas **não recebe bônus** de defesa.
  - Arma com FN > Força → aquele ataque como Inapto.
- **Mãos:** 2 por padrão. Arma "Duas Mãos" precisa das duas (senão ataca Inapto). "Mão-e-Meia"
  pode 1 ou 2 mãos (com 2: FN cai pela metade e ganha bônus de dano). Escudo ocupa 1 mão fixa.
- **Conjuração e mãos:** precisa de **1 mão totalmente livre** OU de um item **Canalizador**
  (cajado, cetro, varinha, orbe, adaga runada) empunhado. Mão com escudo/espada comum não conjura.
  Canalizador com FN > Força → conjura como Inapto.

### Afinidades e Aflições
- **Afinidades:** 6 tipos base de dano (Elementais: Fogo, Frio, Eletricidade; Físicos: Corte, Contusão, Perfuração). Um ator pode ter Resistência, Vulnerabilidade ou Imunidade a cada um. **Afinidades permanentes são puramente derivadas** a partir dos Efeitos do Ator, não sendo armazenadas no DataModel (alinhado com o princípio de que valores derivados não devem ser armazenados). Afinidades temporárias deverão ser modeladas através de Active Effects no Foundry.
- **Cânone das Aflições (Condições Contínuas):** Modelado estruturalmente para suportar Doenças (Naturais e Mágicas), Maldições, Sangramentos e Venenos Contínuos. Armazenado como um array de objetos rico (`system.details.aflicoes: [{ id, nome, efeito, duracao }]`), idêntico à Forja.

### Progressão avançada (em andamento)
- **Nível 0:** *Aspirantes* (40 PV/PM, +1 em 1 atributo de classe, 1 habilidade) e *Desclassificados*
  (30 PV/PM, sem classe). Sugerido booleano `isAspirante`. Aos 10 XP viram nível 1.
- **Nível Máximo:** 20.
- **Aprendiz de Classe / Caminhos:** custam **Ponto de Evolução** (ganho por nível a partir do 2).
  Caminhos têm **Pré-Requisitos** e habilidades (Básicas/Avançadas/Finais). Só 1 classe extra OU 1 Caminho na carreira.
- **Antecedentes:** custam **1 ponto de atributo da Classe** (Gating); dão habilidade/bônus + equipamento extra.
- **Entidades separadas no banco:** `Classe`, `Caminho` e `Antecedente` consomem recursos diferentes.
- **Economia:** dinheiro inicial de nível 1 = **500 moedas**. Materiais brutos (½ preço, 3–7 dias pra
  processar) e qualidade (Baixa/Mediana/Alta/Obra-Prima).

### Tipos de Item (chaves em português)
`arma`, `armadura`, `equipamento`, `magia`, `habilidade`, `classe`, `raca`, `feature`

### Raças (19 oficiais)
- **Guia Básico (11):** Aesir, Anão, Elfo, Faen, Fauno, Fira, Humano, Juban, Levent, Mahok, Tailox
- **Guia do Herói (3):** Astérios Parbani, Centauros, Metadílios
- **Guia do Vilão (5):** Draganos, Gnolls, Hamelins, Naga, Orcs das Terras Secas
- Cada raça: atributos iniciais + 1 Habilidade Automática + **lista de habilidades raciais extras**
  selecionáveis (ex.: "Nanismo" do Anão) — modeláveis como concessão `escolhaHabilidade`.
- O `create-races.mjs` já tem as 11 do Guia Básico.

### Classes (Guia para Iniciantes)
Feiticeiro, Guerreiro, Ladino, Paladino, Patrulheiro, Sacerdote
- Cada classe: bônus de atributo + 1 Habilidade Automática + lista de habilidades selecionáveis (3 na criação)

---

## Estado atual e próximos passos

### O que já existe
- [x] system.json configurado e reconhecido pelo Foundry V14
- [x] Entry point registrando Actor, Item, Sheets
- [x] Templates HBS para personagem, NPC e todos os tipos de item
- [x] DataModel do personagem (`module/data/actor-character.mjs`) com mecânicas reais do MB:
      atributos base+bônus de raça/classe + bônus de habilidades, PV/PM (60), defesas derivadas,
      carga (Força×5/×10), deslocamento, corrida e iniciativa (menor de Agi/Int) — **integrado e em uso**
- [x] **Sistema de rolagem** (`module/helpers/dice.mjs`): 2d6+atributo, críticos, Inapto (1d6 +
      conversão de dado extra em +2), diálogo de opções, cards no chat, ataque de arma, iniciativa.
- [x] **Conjuração de magias** (`castSpell`): Arcana→INT / Mística→VON, PM só no sucesso, modal de
      Sucesso Crítico (4 efeitos), Inapto manual; pronta pra mods (`difficultyMod`/`costMod`).
- [x] **Motor de concessões** (`module/helpers/concessoes.mjs`): habilidade fixa / escolhaAtributo
      (Humano/Adaptabilidade) / escolhaHabilidade (Dogma, Pacto…). Bônus de atributo via `bonusAtributo`.
- [x] Sistema de raça com habilidade automática vinculada por UUID + navegador de compêndio
- [x] Arquitetura consolidada: todo o JS ativo em `module/`; `src/` é só SCSS
- [x] **Equipamento:** estado `equipado`; armadura→Bloqueio+Esquiva e escudo→Bloqueio (só a de maior valor);
      mãos livres + Canalizador (destrava conjuração); FN > Força → Inapto; Pesada/Rígida → Corrida ×2.
- [x] **NPC:** DataModel pt-BR (`module/data/actor-npc.mjs`) + ficha (atributos/PV/PM/defesas/iniciativa/
      deslocamento); barras de token alinhadas em `resources.vida`/`resources.mana`.
- [x] **Importação do JSON canônico** (`module/helpers/import.mjs`): `efeitos[]` lidos no DataModel,
      concessões suprimidas no import, botão "Importar Ficha" na aba de Atores.
- [x] **Compêndios (packs):** 4 packs declarados (racas/classes/habilidades/magias) + pasta "Mighty Blade".
      `game.mightyBlade.buildCompendios()` popula racas+habilidades com `flags.mighty-blade.slug`. Concessões
      resolvem `ref`(slug)→Item via packs (`resolveRef`). Navegador lê dos packs (fallback p/ itens-do-mundo).

- [x] **DataModels (Afinidades e Aflições):** `aflicoes` (doenças, maldições, sangramentos, venenos) armazenado nativamente em Actors e NPCs como um array de objetos em `details` (sincronizado com Forja v1.0). Afinidades (resistências, imunidades, vulnerabilidades) não são armazenadas, devendo ser derivadas a partir dos Efeitos.

### Próximos passos (em ordem)
1. **Conteúdo dos packs:** semear classes e magias (e habilidades de classe p/ `escolhaHabilidade`/Dogma);
   consumir o conteúdo exportado pelo site. (racas+habilidades já populadas via `buildCompendios`.)
2. **Localização pt-BR** (`lang/pt-br.json`) e registro no system.json.
3. **Progressão avançada:** Nível 0 (Aspirantes/Desclassificados), Gating em UI, Pontos de Evolução e bloqueios de Caminhos/Antecedentes.
4. **Fichas e UI:** Atualizar os templates HBS para renderizar as novas Afinidades e Aflições.
5. **Nuances adiadas:** sistema de dano/RD (Pesada/Rígida), Túnica, Mão-e-Meia, mods mágicos
   (Asseste/Foco/Cerne); FN somada > Carga Básica → Deslocamento 2 m.

### Bugs conhecidos
- (resolvidos) `item.roll()` implementado; `equipamento` duplicado no `template.json` unificado;
  `compendium-browser.mjs` migrado para `foundry.applications.ux.TextEditor.implementation`.

---

## Integração com o gerador de fichas (JSON canônico — contrato compartilhado)

Projeto-irmão (site/Forja, monorepo TS) e este módulo compartilham **só o formato de dados** (sem código). O site (`rules-core`) é a **fonte da verdade do conteúdo**; o Foundry é **consumidor + comportamento** (fórmulas derivadas, sheets, concessões, rolagens). Importador: `game.mightyBlade.importCharacter(obj)` / `importCharacterFromJSON(texto)` e `openImportDialog()` (botão "Importar Ficha" na aba de Atores) — `module/helpers/import.mjs`.

**Contrato v1.0 ESTÁVEL (jun/2026).** Workflow: o contrato é o trilho; cada projeto anda no seu ritmo; só re-sincronizar quando o formato mudar (com **bump de `schemaVersion`** se for breaking).

- **Envelope:** `{ schemaVersion:"1.0", slug, name, type:"character", img, system:{...}, items:[...], flags }`. O `slug` (raiz e de cada item) vai para `flags["mighty-blade"].slug`.
- **Identidade por slug, nunca UUID.** Concessões referenciam por `ref` (slug); o importador resolve slug→UUID via índice. (`uuid` ainda aceito como legado.)
- **Atributos — só enviar `base`.** ⚠️ **`base` deve ser 0 no nível 1**: a raça é quem fornece o valor inicial (via `raca.system.atributos`). Fórmula: `value = base + raça + classe + Σefeitos`. (Se `base` vier com o valor racial, dobra — ver simulação.) Reservar `base` para bônus manuais/progressão (nível 4, Aspirante, homebrew).
- **Efeitos declarativos** em `system.efeitos[]` (habilidade/item), formato `{ tipo, ...params }`. Vocabulário v1.0 (congelado): `bonusAtributo`, `bonusDefesa`, `bonusDeslocamento`, `cargaComoForca`, `bonusDadoTeste`, `reduzCustoMana`, `reduzDificuldadeMagia`, `bonusDanoMagia`, `reducaoDano`, `resistencia`. **Auto-aplicados hoje:** os 4 primeiros. Demais = reservados (armazenados/exibidos, não aplicados). `tipo` desconhecido é tolerado (forward-compatible).
- **Concessões na importação NÃO são reprocessadas** (`MightyBladeActor._suppressConcessoes`): a ficha já vem montada, com as habilidades escolhidas embutidas em `items[]`.
- **Não enviar campos derivados** (recalculados): `attributes.*.value`, `defesas.*`, `subattributes.*` (incl. `carga.max/maxAbsoluto`), `equipamento.*`.
- **Fórmulas derivadas** são reimplementadas dos dois lados; este CLAUDE.md (seção de mecânicas) é a **spec canônica** — mudou aqui, avisar o site.

## Notas de desenvolvimento

- O DataModel do personagem já está reescrito com as mecânicas do MB (não é mais boilerplate D&D).
- SCSS em `src/scss/` precisa ser compilado para gerar `css/mighty-blade.css` (`npm run build`).
- Referência de arquitetura de código: `foundryvtt/dnd5e` no GitHub (estrutura, não mecânicas)
- PDFs disponíveis: Guia para Iniciantes (base implementada aqui), Guia Básico, Guia do Herói e Vilão
