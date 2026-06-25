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
import { rollTest, rollAttribute, requestTestOptions, castSpell } from "./helpers/dice.mjs";
import { importCharacter, importCharacterFromJSON, openImportDialog } from "./helpers/import.mjs";
import { buildCompendios } from "./helpers/packs.mjs";

// Import DataModels
import MightyBladeCharacterData from "./data/actor-character.mjs";
import MightyBladeNpcData from "./data/actor-npc.mjs";

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
    // API de rolagem (útil também em macros)
    rollTest,
    rollAttribute,
    requestTestOptions,
    castSpell,
    // Importação de fichas do gerador (JSON canônico)
    importCharacter,
    importCharacterFromJSON,
    openImportDialog,
    // Compêndios de conteúdo
    buildCompendios,
  };

  // Add custom constants for configuration.
  CONFIG.MIGHTY_BLADE = MIGHTY_BLADE;

  // Iniciativa do Mighty Blade: 2d6 + menor entre Agilidade e Inteligência (@init).
  CONFIG.Combat.initiative = { formula: "2d6 + @init", decimals: 0 };

  // Registrar DataModels por tipo de ator
  CONFIG.Actor.dataModels = {
    character: MightyBladeCharacterData,
    npc: MightyBladeNpcData,
  };

  /**
   * Set an object as the MightyBladeActor class to define our Actor document.
   */
  CONFIG.Actor.documentClass = MightyBladeActor;

  /**
   * Set an object as the MightyBladeItem class to define our Item document.
   */
  CONFIG.Item.documentClass = MightyBladeItem;

  // Register sheet application classes
  const ActorSheetV1 = foundry.appv1.sheets.ActorSheet;
  const ItemSheetV1  = foundry.appv1.sheets.ItemSheet;
  const ActorsCol    = foundry.documents.collections.Actors;
  const ItemsCol     = foundry.documents.collections.Items;

  ActorsCol.unregisterSheet("core", ActorSheetV1);
  ActorsCol.registerSheet("mighty-blade", MightyBladeActorSheet, {
    makeDefault: true,
  });

  ItemsCol.unregisterSheet("core", ItemSheetV1);
  ItemsCol.registerSheet("mighty-blade", MightyBladeItemSheet, {
    makeDefault: true,
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/* Botão "Importar Ficha" na aba de Atores      */
/* -------------------------------------------- */
Hooks.on("renderActorDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const header = root.querySelector(".directory-header") ?? root.querySelector("header");
  if (!header || header.querySelector(".mb-import-character")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mb-import-character";
  btn.style.cssText = "flex:0 0 auto;margin-top:4px;";
  btn.innerHTML = `<i class="fas fa-file-import"></i> Importar Ficha`;
  btn.addEventListener("click", () => openImportDialog());
  header.appendChild(btn);
});
