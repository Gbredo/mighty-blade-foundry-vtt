import {
  slugify,
  RACAS_FORJA_MAP,
  CLASSES_FORJA_MAP,
  CAMINHOS_FORJA_SLUGS,
  ORGANIZACOES_FORJA_MAP,
  resolveItemImage,
} from "../helpers/forja-art.mjs";

export { resolveItemImage };

export class MightyBladeCompendiumBrowser extends Application {
  constructor(options = {}) {
    super(options);
    this.filterType = options.type || "raca"; // 'raca', 'classe', 'caminho', etc.
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

    items = items.map((i) => {
      const obj = (typeof i.toObject === "function") ? i.toObject() : { ...i };
      obj.img = resolveItemImage(i);
      obj.uuid = i.uuid;
      return obj;
    });

    items = items.sort((a, b) => a.name.localeCompare(b.name));

    const categories = [
      { id: "raca", label: "Raças", active: this.filterType === "raca" },
      { id: "classe", label: "Classes", active: this.filterType === "classe" },
      { id: "caminho", label: "Caminhos", active: this.filterType === "caminho" },
      { id: "organizacao", label: "Organizações", active: this.filterType === "organizacao" },
      { id: "habilidade", label: "Habilidades", active: this.filterType === "habilidade" },
      { id: "magia", label: "Magias", active: this.filterType === "magia" },
      { id: "equipamento", label: "Equipamentos", active: this.filterType === "equipamento" },
    ];

    return { items, categories, activeType: this.filterType };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const listItems = html.find(".item-list .item");
    const detailsContent = html.find(".details-content");
    const selectButton = html.find(".select-button");
    const searchInput = html.find("input[name='search']");
    const syncButton = html.find(".sync-packs-button");

    // Alternar abas de categorias
    html.find(".browser-tab-btn").on("click", (ev) => {
      ev.preventDefault();
      const tab = ev.currentTarget.dataset.tab;
      if (tab && tab !== this.filterType) {
        this.filterType = tab;
        this.render(false);
      }
    });

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

      // Render description com sanitização de lore crua legada
      const TextEditor = foundry.applications.ux.TextEditor.implementation;
      let rawDesc = item.system?.description ?? "";

      // Se a descrição contém faixas etárias até nomes (lore crua que deve ficar no diário)
      if (item.type === "raca" && (rawDesc.includes("Faixas Etárias") || rawDesc.includes("Biologia:") || rawDesc.includes("Dimorfismo Sexual") || rawDesc.includes("Nomes e Tradições"))) {
        const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name);
        rawDesc = `
          <div class="mb-item-summary">
            <p class="mb-lead-lore" style="font-size:0.95rem;color:#cbd5e1;margin-bottom:8px;">
              Raça canônica <strong>${item.name}</strong> de Mighty Blade 3e.
            </p>
            <div class="mb-journal-link-card" style="margin: 12px 0; padding: 12px 14px; background: rgba(217, 119, 6, 0.14); border: 1px solid rgba(217, 119, 6, 0.45); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div>
                <div style="font-weight: 700; color: #f59e0b; font-size: 0.95rem;">
                  <i class="fas fa-book-open"></i> Biologia, Cultura e Nomes
                </div>
                <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">
                  Faixas etárias, anatomia, sociedade e regras de patronímicos.
                </div>
              </div>
              <a class="content-link open-lore-journal-btn" data-slug="${slug}" data-type="JournalEntry" style="background:#d97706;color:#0f172a;padding:6px 14px;border-radius:6px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                <i class="fas fa-book"></i> Abrir Diário
              </a>
            </div>
          </div>
        `;
      }

      const description = await TextEditor.enrichHTML(rawDesc);

      // Arte oficial com destaque Dark Obsidian
      const itemImg = resolveItemImage(item);
      const hasForjaImg = itemImg && !itemImg.includes("mystery-man.svg") && !itemImg.includes("item-bag.svg");
      let imgBanner = "";
      if (hasForjaImg) {
        imgBanner = `
          <div class="browser-hero-art" style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;">
            <img src="${itemImg}" alt="${item.name}" style="max-height:170px;max-width:100%;object-fit:contain;background:#ffffff;border-radius:6px;padding:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:inline-block;" />
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
        const slug = target.data("slug") || item.flags?.["mighty-blade"]?.slug || slugify(item.name);
        const nameLower = item.name.toLowerCase();

        // 1. Prioridade: Buscar no Diário do mundo (ex: "bio e cultura" ou "Biologia e Cultura das Raças")
        const worldJournal = game.journal.getName("bio e cultura") ||
          game.journal.getName("Biologia e Cultura das Raças") ||
          game.journal.find((j) => {
            const jName = j.name.toLowerCase();
            return jName.includes("bio") || jName.includes("cultura");
          });

        if (worldJournal) {
          const page = worldJournal.pages.find((p) => {
            const pName = p.name.toLowerCase();
            return pName === nameLower || pName === slug || p.flags?.["mighty-blade"]?.slug === slug;
          });
          if (page) {
            worldJournal.sheet.render(true, { pageId: page.id });
            return;
          }
        }

        // 2. Tentar UUID direto fornecido
        const uuid = target.data("uuid") || target.attr("data-uuid");
        if (uuid) {
          const doc = await fromUuid(uuid);
          if (doc) {
            doc.sheet.render(true);
            return;
          }
        }

        // 3. Fallback: buscar no compêndio de diários (mighty-blade.diarios)
        const diariosPack = game.packs.get("mighty-blade.diarios");
        if (diariosPack) {
          const docs = await diariosPack.getDocuments();
          // A) Procurar diário individual
          const match = docs.find((d) => d.flags?.["mighty-blade"]?.slug === slug || d.name.toLowerCase().includes(nameLower));
          if (match) {
            match.sheet.render(true);
            return;
          }
          // B) Procurar página dentro do master journal consolidado
          const masterDoc = docs.find((d) => d.flags?.["mighty-blade"]?.master || d.name.toLowerCase().includes("bio"));
          if (masterDoc) {
            const page = masterDoc.pages.find((p) => {
              const pName = p.name.toLowerCase();
              return pName === nameLower || pName === slug;
            });
            if (page) {
              masterDoc.sheet.render(true, { pageId: page.id });
              return;
            }
            masterDoc.sheet.render(true);
            return;
          }
        }

        // 4. Fallback absoluto: Criar diário no mundo na hora com a lore canônica
        if (item.type === "raca") {
          const lore = item.flags?.["mighty-blade"]?.lore;
          let content = `<div style="text-align:center;margin-bottom:16px;"><img src="${resolveItemImage(item)}" alt="${item.name}" style="max-height:260px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);" /></div>`;
          if (lore?.faixasEtarias) {
            const f = lore.faixasEtarias;
            content += `<h2>Faixas Etárias & Ciclo de Vida</h2><ul><li><strong>Filhote:</strong> ${f.filhote} anos</li><li><strong>Adulto:</strong> ${f.adulto} anos</li><li><strong>Idoso:</strong> ${f.idoso} anos</li><li><strong>Ancião:</strong> ${f.anciao} anos</li></ul><hr>`;
          }
          if (lore?.biologia) {
            content += `<h2>Biologia & Fisiologia</h2><p>${lore.biologia.replace(/\n/g, '<br>')}</p><hr>`;
          }
          if (lore?.cultura) {
            content += `<h2>Cultura & Sociedade</h2><p>${lore.cultura.replace(/\n/g, '<br>')}</p><hr>`;
          }
          if (lore?.nomes) {
            content += `<h2>Nomes & Tradições</h2>`;
            if (lore.nomes.lore) content += `<p>${lore.nomes.lore}</p>`;
            if (lore.nomes.masculinos?.length) content += `<h4>Masculinos:</h4><p>${lore.nomes.masculinos.join(", ")}</p>`;
            if (lore.nomes.femininos?.length) content += `<h4>Femininos:</h4><p>${lore.nomes.femininos.join(", ")}</p>`;
          }

          try {
            const newDoc = await JournalEntry.create({
              name: `Diário: ${item.name}`,
              pages: [{
                name: `${item.name} — Biologia, Cultura e Nomes`,
                type: "text",
                text: { content, format: 1 }
              }]
            });
            if (newDoc) {
              newDoc.sheet.render(true);
            }
          } catch (e) {
            console.error("MIGHTY BLADE: Erro ao criar diário sob demanda:", e);
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
