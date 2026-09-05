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
    const packMap = {
      raca: "mighty-blade.racas",
      classe: "mighty-blade.classes",
      caminho: "mighty-blade.caminhos",
      organizacao: "mighty-blade.organizacoes",
      habilidade: "mighty-blade.habilidades",
      magia: "mighty-blade.magias",
      equipamento: "mighty-blade.equipamentos",
      arma: "mighty-blade.equipamentos",
      armadura: "mighty-blade.equipamentos",
    };

    const packName = packMap[this.filterType] || "mighty-blade.racas";
    const pack = game.packs.get(packName);
    let items = pack ? await pack.getDocuments() : [];
    if (!items.length) {
      items = game.items.filter((i) => i.type === this.filterType);
    }

    if (this.filterType === "arma" || this.filterType === "armadura") {
      items = items.filter((i) => i.type === this.filterType);
    } else if (this.filterType === "equipamento") {
      items = items.filter((i) => i.type === "equipamento" || i.type === "arma" || i.type === "armadura");
    }

    items = items.sort((a, b) => a.name.localeCompare(b.name));
    return { items };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const listItems = html.find(".item-list .item");
    const detailsContent = html.find(".details-content");
    const selectButton = html.find(".select-button");
    const searchInput = html.find("input[name='search']");
    const syncButton = html.find(".sync-packs-button");

    // Botão de Sincronização direta
    syncButton.on("click", async (ev) => {
      ev.preventDefault();
      if (game.mightyBlade?.buildCompendios) {
        await game.mightyBlade.buildCompendios();
        this.render(true);
      }
    });

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

      // Arte oficial com destaque Dark Obsidian
      const hasForjaImg = item.img && !item.img.includes("mystery-man.svg") && !item.img.includes("item-bag.svg");
      let imgBanner = "";
      if (hasForjaImg) {
        imgBanner = `
          <div class="browser-hero-art" style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;">
            <img src="${item.img}" alt="${item.name}" style="max-height:160px;max-width:100%;object-fit:contain;background:#ffffff;border-radius:4px;padding:6px;box-shadow:0 4px 10px rgba(0,0,0,0.5);display:inline-block;" />
          </div>
        `;
      }

      // Build details HTML
      let detailsHtml = `
        ${imgBanner}
        <h2>${item.name}</h2>
        <div class="item-description">${description}</div>
      `;

      // Specific details based on item type
      if (item.type === "raca") {
        const at = item.system.atributos || {};
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Atributos Iniciais:</b> FOR ${at.forca || 0} | AGI ${at.agilidade || 0} | INT ${at.inteligencia || 0} | VON ${at.vontade || 0}
          </div>`;
        if (item.system.habilidadeAutomatica?.nome) {
          detailsHtml += `
            <div class="item-meta" style="margin-top:4px;">
              <b>Habilidade Automática:</b> ${item.system.habilidadeAutomatica.nome}
            </div>`;
        }
        if (item.system.classesComuns) {
          detailsHtml += `<div class="item-meta" style="margin-top:4px;"><strong>Classes Comuns:</strong> ${item.system.classesComuns}</div>`;
        }
      } else if (item.type === "classe") {
        const at = item.system.atributos || {};
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Bônus de Atributos:</b> FOR +${at.forca || 0} | AGI +${at.agilidade || 0} | INT +${at.inteligencia || 0} | VON +${at.vontade || 0}
          </div>`;
      } else if (item.type === "caminho") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Pré-Requisitos:</b> ${item.system.requisitos || "Nenhum"}
          </div>`;
        if (item.system.racasComuns) {
          detailsHtml += `<div class="item-meta" style="margin-top:4px;"><strong>Raças Comuns:</strong> ${item.system.racasComuns}</div>`;
        }
      } else if (item.type === "organizacao") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Tipo:</b> ${item.system.tipo || "Ordem"} · <b>Sede:</b> ${item.system.sede || "Não especificada"}
          </div>`;
        if (item.system.lideranca) {
          detailsHtml += `<div class="item-meta" style="margin-top:4px;"><b>Liderança:</b> ${item.system.lideranca}</div>`;
        }
      } else if (item.type === "magia") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Círculo:</b> ${item.system.circulo || 1} · <b>Fonte:</b> ${item.system.fonte === "mistica" ? "Mística" : "Arcana"} · <b>Custo:</b> ${item.system.custo || 0} PM · <b>DV:</b> ${item.system.dificuldade || 8}
          </div>`;
      } else if (item.type === "arma") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Dano:</b> ${item.system.dano || "0"} · <b>FN:</b> ${item.system.fn || 0} · <b>Alcance:</b> ${item.system.alcance || "Adjacente (1m)"}
          </div>`;
      } else if (item.type === "armadura") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Defesa:</b> +${item.system.defesa || 0} · <b>FN:</b> ${item.system.fn || 0} · <b>Tipo:</b> ${item.system.subtipo || "armadura"}
          </div>`;
      } else if (item.type === "habilidade") {
        detailsHtml += `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Tipo:</b> ${item.system.tipo || "suporte"} · <b>Categoria:</b> ${item.system.categoria || "tecnica"} · <b>Custo:</b> ${item.system.custo || 0} PM
          </div>`;
      }

      detailsContent.html(detailsHtml);

      // Ouvinte de clique para abrir Diários vinculados
      detailsContent.find(".open-lore-journal-btn, a[data-uuid]").on("click", async (evClick) => {
        evClick.preventDefault();
        evClick.stopPropagation();
        const target = $(evClick.currentTarget);
        const uuid = target.data("uuid") || target.attr("data-uuid");
        if (uuid) {
          const doc = await fromUuid(uuid);
          if (doc) {
            doc.sheet.render(true);
            return;
          }
        }
        // Fallback: buscar pelo slug do item no compêndio de diários
        const slug = target.data("slug") || item.flags?.["mighty-blade"]?.slug;
        if (slug) {
          const diariosPack = game.packs.get("mighty-blade.diarios");
          if (diariosPack) {
            const docs = await diariosPack.getDocuments();
            const match = docs.find((d) => d.flags?.["mighty-blade"]?.slug === slug);
            if (match) {
              match.sheet.render(true);
            }
          }
        }
      });
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
        if (this.filterType === "raca" || this.filterType === "classe") {
          const existing = this.targetActor.items.find(
            (i) => i.type === this.filterType
          );
          if (existing) {
            await existing.delete();
          }
        }

        // Cria uma cópia do item no ator
        await this.targetActor.createEmbeddedDocuments("Item", [
          item.toObject(),
        ]);
        this.close();
      }
    });
  }
}
