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

### Carga
- Básica = Força × 10 kg (acima disso: Inapto)
- Máxima = Força × 20 kg (acima disso: não consegue se mover)

### Combate
- **Ataque:** 2d6 + Força (ou Agilidade) vs Defesa do alvo
- **Dano corporal:** dano da arma + Força do atacante
- **Dano à distância:** valor fixo da arma ou For+ conforme tabela
- **Iniciativa:** 2d6 + menor entre (Agilidade, Inteligência)
- Ações por turno: livre / padrão / movimento / rodada completa (escolher combinação)
- Força Necessária (FN): se FN da arma > Força do personagem → Inapto para atacar

### Magias
- Feiticeiro usa **Runas Arcanas**; Sacerdote usa **Selos Místicos**
- Teste de conjuração: 2d6 + atributo vs Dificuldade da magia
- **PM só é gasto se a magia for bem-sucedida** (diferente de Habilidades de Ação/Reação, que gastam antes)
- Sucesso Crítico em magia: escolher entre não gastar PM OU dobrar dano/área/duração

### Tipos de Item (chaves em português)
`arma`, `armadura`, `equipamento`, `magia`, `habilidade`, `classe`, `raca`, `feature`

### Raças (Guia para Iniciantes)
Anão, Elfo, Fauno, Humano, Juban, Tailox
- Cada raça: atributos iniciais + 1 Habilidade Automática (Suporte)

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
      atributos base+bônus de raça/classe, PV/PM (60), defesas derivadas (Bloqueio/Esquiva/Determinação),
      carga (Força×10/×20), deslocamento, corrida e iniciativa — **integrado e em uso**
- [x] Sistema de raça com habilidade automática vinculada por UUID + navegador de compêndio
- [x] Arquitetura consolidada: todo o JS ativo em `module/`; `src/` é só SCSS

### Próximos passos (em ordem)
1. **Sistema de rolagem:** 2d6 + atributo com resultado no chat (críticos: 2+ seis = Sucesso Crítico,
   todos 1 = Falha Crítica; inapto = 1d6; habilidades podem somar +1d6). Hoje a ficha chama
   `item.roll()` mas `module/documents/item.mjs` não implementa `roll()` — clicar numa arma quebra.
2. **NPC:** dar um DataModel próprio em pt-BR (hoje usa schema legado do template.json em inglês) e
   alinhar as barras de token do system.json (apontam para `resources.vida`/`resources.mana`, que o NPC não tem).
3. **Localização pt-BR** (`lang/pt-br.json`) e registro no system.json.
4. **Compêndios (packs):** mover raças/classes/habilidades de itens-do-mundo para packs.

### Bugs conhecidos a corrigir
- `module/documents/item.mjs` não tem `roll()`, mas `actor-sheet.mjs` o chama → erro ao clicar em arma.
- `compendium-browser.mjs` usa o `TextEditor` global (removido no V13+) → preview no hover pode quebrar;
  usar `foundry.applications.ux.TextEditor.implementation`.
- `template.json` define `equipamento` duas vezes (a 2ª sobrescreve e perde `custo`).

---

## Notas de desenvolvimento

- O DataModel do personagem já está reescrito com as mecânicas do MB (não é mais boilerplate D&D).
- SCSS em `src/scss/` precisa ser compilado para gerar `css/mighty-blade.css` (`npm run build`).
- Referência de arquitetura de código: `foundryvtt/dnd5e` no GitHub (estrutura, não mecânicas)
- PDFs disponíveis: Guia para Iniciantes (base implementada aqui), Guia Básico, Guia do Herói e Vilão
