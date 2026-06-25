export class MightyBladeCompendiumBrowser extends Application {
  constructor(options = {}) {
    super(options);
    this.filterType = options.type; // 'raca' or 'classe'
    this.targetActor = options.actor;
    this.selectedId = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "mighty-blade-browser",
      title: "Navegador de Compêndio",
      template: "systems/mighty-blade/templates/apps/compendium-browser.hbs",
      width: 800,
      height: 600,
      resizable: true,
      classes: ["mighty-blade", "browser"],
    });
  }

  async getData() {
    // Prioriza o compêndio do sistema; cai nos itens do mundo se o pack estiver vazio.
    const packName = { raca: "mighty-blade.racas", classe: "mighty-blade.classes" }[this.filterType];
    const pack = packName ? game.packs.get(packName) : null;
    let items = pack ? await pack.getDocuments() : [];
    if (!items.length) items = game.items.filter((i) => i.type === this.filterType);
    items = items.sort((a, b) => a.name.localeCompare(b.name));
    return { items };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const listItems = html.find(".item-list .item");
    const detailsContent = html.find(".details-content");
    const selectButton = html.find(".select-button");
    const searchInput = html.find("input[name='search']");

    // Search Filter
    searchInput.on("keyup", (ev) => {
      const query = ev.target.value.toLowerCase();
      listItems.each((i, el) => {
        const li = $(el);
        const name = li.find(".item-name").text().toLowerCase();
        if (name.includes(query)) {
          li.show();
        } else {
          li.hide();
        }
      });
    });

    // Hover effect to show details
    listItems.hover(async (ev) => {
      const li = $(ev.currentTarget);
      const item = await fromUuid(li.data("item-id"));

      if (!item) return;

      // Render description
      const TextEditor = foundry.applications.ux.TextEditor.implementation;
      const description = await TextEditor.enrichHTML(item.system.description ?? "");

      // Build details HTML
      let detailsHtml = `
                <h2>${item.name}</h2>
                <div class="item-description">${description}</div>
            `;

      // Add specific details based on type
      if (item.type === "raca" && item.system.classesComuns) {
        detailsHtml += `<div class="item-meta"><strong>Classes Comuns:</strong> ${item.system.classesComuns}</div>`;
      }

      detailsContent.html(detailsHtml);
    });

    // Click to select
    listItems.click((ev) => {
      const li = $(ev.currentTarget);
      const radio = li.find("input[type='radio']");

      // Toggle check
      radio.prop("checked", true);

      // Visual selection
      listItems.removeClass("selected");
      li.addClass("selected");

      this.selectedId = li.data("item-id");
      selectButton.prop("disabled", false);
    });

    // Confirm selection
    selectButton.click(async (ev) => {
      if (!this.selectedId) return;
      const item = await fromUuid(this.selectedId);
      if (item && this.targetActor) {
        // Check if actor already has an item of this type
        const existing = this.targetActor.items.find(
          (i) => i.type === this.filterType
        );
        if (existing) {
          // Delete existing item first
          await existing.delete();
        }

        // Create a copy of the item on the actor
        await this.targetActor.createEmbeddedDocuments("Item", [
          item.toObject(),
        ]);
        this.close();
      }
    });
  }
}
