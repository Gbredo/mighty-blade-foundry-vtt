/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Caminhos parciais de Ator (Mantenha ou atualize se tiver renomeado)
    "systems/mighty-blade/templates/actor/parts/actor-features.hbs",
    "systems/mighty-blade/templates/actor/parts/actor-items.hbs",
    "systems/mighty-blade/templates/actor/parts/actor-spells.hbs",
    "systems/mighty-blade/templates/actor/parts/actor-effects.hbs",

    // --- AQUI ESTÁ O SEGREDO ---
    // Adicione os caminhos completos das fichas de item que criamos:
    "systems/mighty-blade/templates/item/item-arma-sheet.hbs",
    "systems/mighty-blade/templates/item/item-raca-sheet.hbs",
    "systems/mighty-blade/templates/item/item-classe-sheet.hbs",
    "systems/mighty-blade/templates/item/item-magia-sheet.hbs",
    "systems/mighty-blade/templates/item/item-equipamento-sheet.hbs",
  ]);
};
