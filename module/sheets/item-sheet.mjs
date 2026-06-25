/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MightyBladeItemSheet extends foundry.appv1.sheets.ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mighty-blade", "sheet", "item"], // Aqui já mudamos para mighty-blade
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/mighty-blade/templates/item/item-${this.item.type}-sheet.hbs`;
  }

  /** @override */
  async getData() {
    // Recupera os dados básicos
    const context = super.getData();
    const itemData = context.item;

    // Adiciona dados úteis para o Handlebars
    context.rollData = {};
    const actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    context.system = itemData.system;
    context.flags = itemData.flags;

    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedDescription = await TextEditor.enrichHTML(
      context.system.description ?? "",
      { relativeTo: this.item }
    );

    // Para Raça e Classe, resolve a habilidade automática vinculada por UUID
    if ((this.item.type === "raca" || this.item.type === "classe") && context.system.habilidadeUuid) {
      const ability = await fromUuid(context.system.habilidadeUuid);
      if (ability) context.linkedAbility = ability;
    }

    // Add config data for Habilidade sheet
    if (this.item.type === "habilidade") {
      context.config = {
        tipos: {
          acao: "Ação",
          reacao: "Reação",
          suporte: "Suporte",
        },
        categorias: {
          tecnica: "Técnica",
          caracteristica: "Característica",
          magia: "Magia",
          antecedente: "Antecedente",
        },
      };
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Drag and Drop para Raça e Classe (habilidade automática)
    if (this.item.type === "raca" || this.item.type === "classe") {
      const dropZone = html.find(".drop-zone");
      dropZone.on("dragover", (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.add("drag-over");
      });
      dropZone.on("dragleave", (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.remove("drag-over");
      });
      dropZone.on("drop", this._onDropAbility.bind(this));

      html.find(".remove-link").click(async () => {
        await this.item.update({ "system.habilidadeUuid": "" });
      });
    }
  }

  /**
   * Handle dropping an Ability item onto the Race sheet
   * @param {Event} event
   */
  async _onDropAbility(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }

    if (data.type !== "Item") return;

    const item = await Item.fromDropData(data);
    if (!item) return;

    if (item.type !== "habilidade") {
      return ui.notifications.warn(
        "Você só pode vincular itens do tipo Habilidade."
      );
    }

    await this.item.update({ "system.habilidadeUuid": item.uuid });
  }
}
