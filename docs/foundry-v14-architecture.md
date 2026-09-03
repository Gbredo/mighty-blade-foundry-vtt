# 🎲 Arquitetura de Sistemas para Foundry VTT (v14+)
### Guia Definitivo para Criação de Novos Sistemas de RPG no Foundry v14

Este guia documenta os padrões arquiteturais modernos para desenvolvimento de sistemas no **Foundry Virtual Tabletop versão 14+**, servindo de base tanto para a manutenção do **Mighty Blade 3.5** quanto para a criação de novos sistemas de RPG.

---

## 1. 🏗️ Mudanças Fundamentais do Foundry VTT v14

A partir da v12 e consolidado na **v14**, a Foundry API abandonou padrões legados (como `template.json` puro e `ActorSheet` legado) em favor de arquiteturas fortemente tipadas e reativas:

### A. Data Models Tipados (`foundry.abstract.TypeDataModel`)
Não confie apenas no `template.json` para definir atributos. Defina modelos formais com validação de esquema:

```javascript
// module/data/character-data.mjs
export class MightyBladeCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      atributos: new fields.SchemaField({
        forca: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
        agilidade: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
        inteligencia: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
        vontade: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
      }),
      resources: new fields.SchemaField({
        vida: new fields.SchemaField({
          value: new fields.NumberField({ integer: true, initial: 60 }),
          max: new fields.NumberField({ integer: true, initial: 60 }),
        }),
        mana: new fields.SchemaField({
          value: new fields.NumberField({ integer: true, initial: 60 }),
          max: new fields.NumberField({ integer: true, initial: 60 }),
        }),
      }),
      detalhes: new fields.SchemaField({
        nivel: new fields.NumberField({ integer: true, min: 1, initial: 1 }),
        experiencia: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
        dinheiro: new fields.NumberField({ integer: true, min: 0, initial: 500 }),
      }),
    };
  }

  prepareDerivedData() {
    // Cálculo derivado canônico em tempo real
    this.cargaBasica = this.atributos.forca * 5;
    this.cargaMaxima = this.atributos.forca * 10;
  }
}
```

No `module/mighty-blade.mjs`, registre o Data Model:
```javascript
Hooks.once("init", () => {
  CONFIG.Actor.dataModels.character = MightyBladeCharacterData;
  CONFIG.Actor.dataModels.monstro = MightyBladeMonsterData;
});
```

---

## 2. 🖥️ Interface Gráfica com Application V2

A Foundry v14 padroniza a nova API de janelas `ApplicationV2`:

```javascript
// module/sheets/actor-sheet-v2.mjs
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MightyBladeActorSheetV2 extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["mighty-blade", "actor", "sheet"],
    position: { width: 720, height: 800 },
    actions: {
      rolarAtributo: MightyBladeActorSheetV2.#onRolarAtributo,
    },
  };

  static PARTS = {
    header: { template: "systems/mighty-blade/templates/actor/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    combate: { template: "systems/mighty-blade/templates/actor/combate.hbs" },
    inventario: { template: "systems/mighty-blade/templates/actor/inventario.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    return context;
  }

  static async #onRolarAtributo(event, target) {
    const attr = target.dataset.atributo;
    const valor = this.actor.system.atributos[attr];
    const roll = new Roll(`${valor}d6`);
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
  }
}
```

---

## 3. 📦 Gerenciamento e Compilação de Compêndios (LevelDB / Classic Level)

A Foundry v14 utiliza bancos de dados binários rápidos baseados em **Classic Level**.

### Estrutura dos Packs:
```text
packs/
├── racas/
├── classes/
├── habilidades/
├── magias/
└── equipamentos/
```

### CLI Oficial do Foundry (`@foundryvtt/foundryvtt-cli`):
Para empacotar arquivos JSON de desenvolvimento em pastas LevelDB de produção:
```bash
# Extrair leveldb para JSON legível no git
npx fvtt package unpack racas -c ./src/packs/racas

# Compilar JSON para LevelDB de produção do Foundry
npx fvtt package pack racas -c ./src/packs/racas
```

---

## 4. 🔗 Como plugar o `@mighty-blade/rules-core` no Foundry VTT

Para reutilizar o mesmo motor de regras canônicas do site no Foundry VTT sem duplicar código:
1. No `mighty-blade.mjs`, você pode empacotar o `rules-core` via Rollup/esbuild ou importar os módulos compilados ESM.
2. Nas chamadas de `prepareDerivedData()` e rolagens de combate, chame diretamente:
   ```javascript
   import { calcularCarga, calcularAcertoBesta, calcularDanoCorporalBesta } from "./rules-core.mjs";
   ```

---

## 5. 🚀 Checklist para Criar um Novo Sistema no Foundry v14

1. **Manifesto (`system.json`):**
   * Configurar `compatibility.minimum: 14` e `compatibility.verified: "14.359"`.
   * Declarar `esmodules: ["module/system-name.mjs"]`.
   * Declarar fontes de dados de token: `primaryTokenAttribute` e `secondaryTokenAttribute`.
2. **Definição de Tipos (`template.json` + `TypeDataModel`):**
   * Separar tipos de Ator (`character`, `npc`, `monster`, `vehicle`).
   * Separar tipos de Item (`weapon`, `spell`, `feature`, `consumable`).
3. **Handlebars Templates (`templates/`):**
   * Manter templates modulares (`header.hbs`, `stats.hbs`, `inventory.hbs`).
4. **Localização (`lang/pt-BR.json` e `lang/en.json`):**
   * Nunca chumbar textos na interface; use sempre `{{localize "KEY"}}`.
