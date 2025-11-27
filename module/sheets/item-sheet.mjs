/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MightyBladeItemSheet extends ItemSheet {
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
    const path = "systems/mighty-blade/templates/item";
    const templateName = `item-${this.item.type}-sheet.hbs`;
    const fullPath = `${path}/${templateName}`;

    // O DETETIVE: Isso vai imprimir no F12 o que o Foundry está tentando ler
    console.log("--- MIGHTY BLADE DEBUG ---");
    console.log("Tentando abrir o item tipo:", this.item.type);
    console.log("Buscando arquivo em:", fullPath);

    return fullPath;
  }

  /** @override */
  getData() {
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

    return context;
  }
}
