import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from "../helpers/effects.mjs";
import { MightyBladeCompendiumBrowser } from "../apps/compendium-browser.mjs";
import { rollAttribute } from "../helpers/dice.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MightyBladeActorSheet extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mighty-blade", "sheet", "actor"],
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/mighty-blade/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    const actorData = this.document.toObject(false);

    // Usa os dados "vivos" do ator (inclui campos calculados em prepareDerivedData)
    // em vez da cópia serializada, que só teria os campos salvos no banco.
    context.system = this.actor.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.MIGHTY_BLADE
    context.config = CONFIG.MIGHTY_BLADE;

    // Prepare character data and items.
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography ?? "",
      {
        secrets: this.document.isOwner,
        rollData: this.actor.getRollData(),
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    let raca = null;
    let classe = null;
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (
        i.type === "item" ||
        i.type === "equipamento" ||
        i.type === "arma" ||
        i.type === "armadura"
      ) {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === "feature" || i.type === "habilidade") {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === "spell" || i.type === "magia") {
        if (i.system.circulo != undefined) {
          spells[i.system.circulo].push(i);
        }
      }
      // Identify Race
      else if (i.type === "raca") {
        raca = i;
        // features.push(i); // Removed: Race is displayed in header, linked ability is separate item
      }
      // Identify Class
      else if (i.type === "classe") {
        classe = i;
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.raca = raca;
    context.classe = classe;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on("click", ".item-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Toggle Edit Mode
    html.find(".sheet-config").click(this._onSheetConfig.bind(this));

    // Replace Race/Class
    html.on("click", ".item-replace", this._onItemReplace.bind(this));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on("click", ".item-create", this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on("click", ".item-delete", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities.
    html.on("click", ".rollable", this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle replacing an existing Race or Class
   * @param {Event} event
   * @private
   */
  async _onItemReplace(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    // Open Compendium Browser directly
    new MightyBladeCompendiumBrowser({
      type: type,
      actor: this.actor,
    }).render(true);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;

    // Check for existing Race or Class
    if (type === "raca" || type === "classe") {
      const existing = this.actor.items.find((i) => i.type === type);
      if (existing) {
        return ui.notifications.warn(
          `Você já possui uma ${type}! Remova a atual antes de adicionar outra.`
        );
      }

      // Open Compendium Browser
      new MightyBladeCompendiumBrowser({
        type: type,
        actor: this.actor,
      }).render(true);
      return;
    }

    const itemData = {
      name: `New ${type}`,
      type: type,
      system: {},
    };

    return await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const skipDialog = event.shiftKey;

    // Rolagem de item (arma, habilidade, magia…). Shift pula o diálogo.
    if (dataset.rollType === "item") {
      const itemId = element.closest(".item")?.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item) return item.roll({ skipDialog });
      return;
    }

    // Teste de atributo (Força, Agilidade, Inteligência, Vontade).
    if (dataset.rollType === "attribute") {
      return rollAttribute(this.actor, dataset.attribute, { skipDialog });
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }

  /**
   * Toggle Edit Mode
   * @param {Event} event
   * @private
   */
  async _onSheetConfig(event) {
    event.preventDefault();
    const flag = this.actor.getFlag("mighty-blade", "isEditing");
    await this.actor.setFlag("mighty-blade", "isEditing", !flag);
  }
}
