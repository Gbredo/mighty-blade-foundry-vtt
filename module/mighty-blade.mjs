// Import document classes.
import { MightyBladeActor } from "./documents/actor.mjs";
import { MightyBladeItem } from "./documents/item.mjs";

// Import sheet classes.
import { MightyBladeActorSheet } from "./sheets/actor-sheet.mjs";
import { MightyBladeItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { MIGHTY_BLADE } from "./helpers/config.mjs";
import { createRaces } from "./helpers/create-races.mjs";

/* -------------------------------------------- */
/* Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log("MIGHTY BLADE: Inicializando o Sistema"); // Log de confirmação

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.mightyBlade = {
    MightyBladeActor,
    MightyBladeItem,
    createRaces,
    // Removi o rollItemMacro daqui por enquanto para não dar erro
  };

  // Add custom constants for configuration.
  CONFIG.MIGHTY_BLADE = MIGHTY_BLADE;

  /**
   * Set an object as the MightyBladeActor class to define our Actor document.
   */
  CONFIG.Actor.documentClass = MightyBladeActor;

  /**
   * Set an object as the MightyBladeItem class to define our Item document.
   */
  CONFIG.Item.documentClass = MightyBladeItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("mighty-blade", MightyBladeActorSheet, {
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mighty-blade", MightyBladeItemSheet, {
    makeDefault: true,
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});
