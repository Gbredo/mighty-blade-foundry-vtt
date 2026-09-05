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
import { MightyBladeCompendiumBrowser, resolveItemImage } from "./apps/compendium-browser.mjs";

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
    // Compêndios e Navegador Visual
    buildCompendios,
    CompendiumBrowser: MightyBladeCompendiumBrowser,
    openCompendiumBrowser: (options = {}) => new MightyBladeCompendiumBrowser(options).render(true),
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

/* -------------------------------------------- */
/* Botão "Compêndio de Itens" na aba de Itens   */
/* -------------------------------------------- */
Hooks.on("renderItemDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const header = root.querySelector(".directory-header") ?? root.querySelector("header");
  if (!header || header.querySelector(".mb-open-item-browser")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mb-open-item-browser";
  btn.style.cssText = "flex:0 0 auto;margin-top:4px;background:rgba(217,119,6,0.2);border:1px solid #d97706;color:#f59e0b;cursor:pointer;";
  btn.innerHTML = `<i class="fas fa-book-sparkles"></i> Compêndio de Itens & Equipamentos`;
  btn.title = "Abre o navegador de compêndios com todas as armas, armaduras e equipamentos oficiais";
  btn.addEventListener("click", () => new MightyBladeCompendiumBrowser({ type: "equipamento" }).render(true));
  header.appendChild(btn);
});

/* -------------------------------------------- */
/* Botões na aba de Compêndios (Navegador e Sync)*/
/* -------------------------------------------- */
Hooks.on("renderCompendiumDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const header = root.querySelector(".directory-header") ?? root.querySelector("header");
  if (!header) return;

  if (!header.querySelector(".mb-open-browser")) {
    const browserBtn = document.createElement("button");
    browserBtn.type = "button";
    browserBtn.className = "mb-open-browser";
    browserBtn.style.cssText = "flex:0 0 auto;margin-top:4px;background:rgba(124,58,237,0.25);border:1px solid #7c3aed;color:#c084fc;cursor:pointer;";
    browserBtn.innerHTML = `<i class="fas fa-book-sparkles"></i> Navegador Mighty Blade`;
    browserBtn.title = "Abre o navegador visual ilustrado de Raças, Classes, Caminhos e Itens";
    browserBtn.addEventListener("click", () => new MightyBladeCompendiumBrowser().render(true));
    header.appendChild(browserBtn);
  }

  if (game.user.isGM && !header.querySelector(".mb-sync-compendiums")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mb-sync-compendiums";
    btn.style.cssText = "flex:0 0 auto;margin-top:4px;background:rgba(217,119,6,0.2);border:1px solid #d97706;color:#f59e0b;cursor:pointer;";
    btn.innerHTML = `<i class="fas fa-arrows-rotate"></i> Sincronizar Compêndios`;
    btn.title = "Reconstrói os compêndios canônicos com dados oficiais e diários de Lore";
    btn.addEventListener("click", () => buildCompendios());
    header.appendChild(btn);
  }
});

/* -------------------------------------------- */
/* Interceptores de Interface: Arte Oficial     */
/* -------------------------------------------- */
Hooks.on("renderCompendium", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  root.querySelectorAll(".directory-item, .entry").forEach((el) => {
    const img = el.querySelector("img");
    if (!img) return;
    if (img.src && (img.src.includes("mystery-man") || img.src.includes("item-bag"))) {
      const name = el.querySelector(".entry-name, .document-name, h4")?.textContent?.trim();
      if (name) {
        const resolved = resolveItemImage({ name, type: app.metadata?.type || app.metadata?.name });
        if (resolved && !resolved.includes("mystery-man") && !resolved.includes("item-bag")) {
          img.src = resolved;
        }
      }
    }
  });
});

Hooks.on("renderItemDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  root.querySelectorAll(".directory-item").forEach((el) => {
    const img = el.querySelector("img");
    if (!img) return;
    if (img.src && (img.src.includes("mystery-man") || img.src.includes("item-bag"))) {
      const name = el.querySelector(".document-name, .entry-name, h4")?.textContent?.trim();
      if (name) {
        const resolved = resolveItemImage({ name, type: "raca" });
        if (resolved && !resolved.includes("mystery-man") && !resolved.includes("item-bag")) {
          img.src = resolved;
        }
      }
    }
  });
});

/* -------------------------------------------- */
/* Verificação Inicial no hook 'ready'          */
/* -------------------------------------------- */
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  const LAST_PACKS_VERSION = "2.3.0-clean-lore";
  const racasPack = game.packs.get("mighty-blade.racas");
  if (racasPack) {
    const index = await racasPack.getIndex();
    const storedVersion = localStorage.getItem("mb_packs_version");

    // Verificar se o compêndio está vazio, se a versão mudou ou se possui mystery-man
    let needsUpdate = index.size === 0 || storedVersion !== LAST_PACKS_VERSION;
    if (!needsUpdate && index.size > 0) {
      const firstEntry = index.contents[0];
      if (firstEntry && (firstEntry.img?.includes("mystery-man") || !firstEntry.img?.includes("forja"))) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log("MIGHTY BLADE: Atualizando compêndios para versão com ilustrações da Forja e Diários de Lore...");
      ui.notifications.info("Sincronizando 1.150+ itens canônicos e 68 diários de Lore com ilustrações da Forja...");
      await buildCompendios();
      localStorage.setItem("mb_packs_version", LAST_PACKS_VERSION);
    }
  }
});

