import {
  slugify,
  RACAS_FORJA_MAP,
  CLASSES_FORJA_MAP,
  CAMINHOS_FORJA_SLUGS,
  ORGANIZACOES_FORJA_MAP,
  resolveItemImage,
} from "../helpers/forja-art.mjs";
import { avaliarRequisitos } from "../helpers/requisitos.mjs";
import {
  validarClasseRaca,
  validarIncompatibilidadePactoMisticismo,
  validarAquisicaoHabilidade,
  validarAcessoMagia,
  enriquecerItemComSSOT,
} from "../helpers/restricoes.mjs";

export { resolveItemImage };

/**
 * Filtra dinamicamente os itens de um compêndio com base nas restrições canônicas e de acesso (habilidades.base) do personagem
 * (esconde magias e habilidades de outras classes/raças/caminhos/organizações, esconde Sacerdote para Nagas/Cultistas,
 * oculta Nanismo e habilidades exclusivas de criação nos Níveis 2+, etc.).
 *
 * @param {Array<object>} items Lista de documentos ou objetos de itens
 * @param {string} filterType Tipo ativo ('raca', 'classe', 'habilidade', 'magia', etc.)
 * @param {object} actor Personagem alvo
 * @returns {Array<object>}
 */
export function filtrarItensCompendioParaAtor(items = [], filterType, actor) {
  if (!actor) return items;

  return items.filter((item) => {
    const type = item.type || filterType;
    if (type === "classe" || filterType === "classe") {
      if (!validarClasseRaca(actor, item.name).permitido) return false;
      if (!validarIncompatibilidadePactoMisticismo(actor, item.name).permitido) return false;
      return true;
    }

    if (type === "habilidade" || filterType === "habilidade") {
      if (item.flags?.["mighty-blade"]?.isSubFeature) return false;
      enriquecerItemComSSOT(item, "habilidade");
      return validarAquisicaoHabilidade(actor, item).permitido;
    }

    if (type === "magia" || filterType === "magia") {
      enriquecerItemComSSOT(item, "magia");
      return validarAcessoMagia(actor, item).permitido;
    }

    return true;
  });
}

export class MightyBladeCompendiumBrowser extends (typeof Application !== "undefined" ? Application : class Application {}) {
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
      width: 930,
      height: 560,
      resizable: true,
      classes: ["mighty-blade", "browser"],
    });
  }

  /**
   * Avalia restrições de raça, classe/acesso, nível, pacto e pré-requisitos para um item específico.
   * @param {object} item
   * @returns {{ permitido: boolean, falhas: string[] }}
   */
  _evaluateItemForActor(item) {
    if (!item || !this.targetActor) return { permitido: true, falhas: [] };
    const falhas = [];
    const type = item.type || this.filterType;

    if (type === "habilidade" || type === "magia") {
      enriquecerItemComSSOT(item, type);
    }

    if (type === "classe") {
      const rCheck = validarClasseRaca(this.targetActor, item.name);
      if (!rCheck.permitido) falhas.push(rCheck.motivo);
      const pCheck = validarIncompatibilidadePactoMisticismo(this.targetActor, item.name);
      if (!pCheck.permitido) falhas.push(pCheck.motivo);
    } else if (type === "habilidade") {
      const hCheck = validarAquisicaoHabilidade(this.targetActor, item);
      if (!hCheck.permitido) falhas.push(hCheck.motivo);
    } else if (type === "magia") {
      const mCheck = validarAcessoMagia(this.targetActor, item);
      if (!mCheck.permitido) falhas.push(mCheck.motivo);
    }

    if (item.system?.requisitos) {
      const evalResult = avaliarRequisitos(item.system.requisitos, this.targetActor);
      if (!evalResult.atende) {
        falhas.push(...evalResult.falhas);
      }
    }

    return { permitido: falhas.length === 0, falhas };
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

    // Filtra dinamicamente opções incompatíveis para o ator (esconde Sacerdote para Nagas, magias de outras classes, Nanismo Nv 2+, etc.)
    if (this.targetActor) {
      items = filtrarItensCompendioParaAtor(items, this.filterType, this.targetActor);
    }

    items = items.map((i) => {
      const obj = (typeof i.toObject === "function") ? i.toObject() : { ...i };
      if (obj.type === "habilidade" || obj.type === "magia") {
        enriquecerItemComSSOT(obj, obj.type);
      }
      obj.img = resolveItemImage(i);
      obj.uuid = i.uuid;

      if (this.targetActor) {
        const reqStr = obj.system?.requisitos || "";
        const evalResult = avaliarRequisitos(reqStr, this.targetActor);
        const restEval = this._evaluateItemForActor(obj);
        obj.meetsPrereq = evalResult.atende && restEval.permitido;
        obj.prereqEval = evalResult;
      } else {
        obj.meetsPrereq = true;
        obj.prereqEval = { atende: true, itens: [], falhas: [] };
      }

      return obj;
    });

    items = items.sort((a, b) => a.name.localeCompare(b.name));

    const categories = [
      { id: "raca", label: "Raças", icon: "fas fa-users", active: this.filterType === "raca" },
      { id: "classe", label: "Classes", icon: "fas fa-shield-halved", active: this.filterType === "classe" },
      { id: "caminho", label: "Caminhos", icon: "fas fa-signs-post", active: this.filterType === "caminho" },
      { id: "organizacao", label: "Organizações", icon: "fas fa-landmark", active: this.filterType === "organizacao" },
      { id: "habilidade", label: "Habilidades", icon: "fas fa-bolt", active: this.filterType === "habilidade" },
      { id: "magia", label: "Magias", icon: "fas fa-wand-sparkles", active: this.filterType === "magia" },
      { id: "equipamento", label: "Equipamentos", icon: "fas fa-sack-dollar", active: this.filterType === "equipamento" },
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

    // Exibe detalhes tanto ao passar o mouse quanto ao focar/clicar
    listItems.hover(async (ev) => {
      const li = $(ev.currentTarget);
      const item = await fromUuid(li.data("item-id"));
      if (item) await this._renderDetails(item, detailsContent);
    });

    // Clique para selecionar (ou inspecionar)
    listItems.click(async (ev) => {
      const li = $(ev.currentTarget);
      const radio = li.find("input[type='radio']");
      const itemId = li.data("item-id");
      const item = await fromUuid(itemId);

      if (item) {
        await this._renderDetails(item, detailsContent);
      }

      // Validação estrita de restrições e pré-requisitos para este herói
      if (item && this.targetActor) {
        const check = this._evaluateItemForActor(item);
        if (!check.permitido) {
          // Bloqueia a seleção imediata
          radio.prop("checked", false);
          this.selectedId = null;
          selectButton.prop("disabled", true);
          listItems.removeClass("selected");
          li.addClass("prereq-blocked");

          html.find(".selection-status").html(
            `<span style="color:#ef4444;"><i class="fas fa-lock"></i> <strong>${item.name}:</strong> Bloqueado (${check.falhas.length} pendência${check.falhas.length > 1 ? "s" : ""})</span>`
          );

          ui.notifications.warn(
            `O personagem ${this.targetActor.name} não pode selecionar "${item.name}": ${check.falhas.join(", ")}`
          );
          return;
        }
      }

      // Atende aos requisitos ou é item sem restrições
      listItems.removeClass("prereq-blocked");
      radio.prop("checked", true);

      listItems.removeClass("selected");
      li.addClass("selected");

      this.selectedId = itemId;
      selectButton.prop("disabled", false);

      html.find(".selection-status").html(
        `<span style="color:#22c55e;"><i class="fas fa-check-circle"></i> Selecionado: <strong>${item ? item.name : ""}</strong></span>`
      );
    });

    // Confirm selection com salvaguarda estrita
    selectButton.click(async (ev) => {
      if (!this.selectedId) return;
      const item = await fromUuid(this.selectedId);
      if (!item || !this.targetActor) return;

      // Salvaguarda final contra bypass
      const check = this._evaluateItemForActor(item);
      if (!check.permitido) {
        ui.notifications.error(
          `Não é possível adotar "${item.name}". Restrições/Pré-requisitos não atendidos:\n${check.falhas.join("\n")}`
        );
        return;
      }

      // Fecha o navegador imediatamente para que modais de Avanço (Humano/Dragano/etc.) abram em destaque no centro da tela
      this.close();

      if (["raca", "classe", "caminho", "organizacao"].includes(this.filterType)) {
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

      // Sincroniza metadados no ator para caminhos e organizações
      if (this.filterType === "caminho") {
        await this.targetActor.update({ "system.details.caminho": item.name });
      } else if (this.filterType === "organizacao") {
        await this.targetActor.update({ "system.details.organizacao": item.name });
      }
    });
  }

  /**
   * Renderiza os detalhes do item selecionado ou sob foco, incluindo arte oficial
   * e o painel de verificação tátil de pré-requisitos do Mighty Blade 3e.
   * @param {Item} item
   * @param {JQuery} detailsContent
   */
  async _renderDetails(item, detailsContent) {
    if (!item) return;
    if (item.type === "habilidade" || item.type === "magia") {
      enriquecerItemComSSOT(item, item.type);
    }

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

    // Arte oficial com destaque Dark Obsidian (ilustrações grandes da Forja vs ícones compactos)
    const itemImg = resolveItemImage(item);
    const isForjaIllustration = Boolean(itemImg && itemImg.includes("assets/forja/"));
    let imgBanner = "";
    if (isForjaIllustration) {
      imgBanner = `
        <div class="browser-hero-art" style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;">
          <img src="${itemImg}" alt="${item.name}" onerror="this.onerror=null;this.src='systems/mighty-blade/assets/icons/gear.svg';" style="max-height:170px;max-width:100%;object-fit:contain;background:#ffffff;border-radius:6px;padding:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:inline-block;" />
        </div>
      `;
    }

    // Painel de Pré-Requisitos interativo com status claro
    let prereqHtml = "";
    if (item.system?.requisitos) {
      if (this.targetActor) {
        const evalResult = avaliarRequisitos(item.system.requisitos, this.targetActor);
        const statusHeader = evalResult.atende
          ? `<div style="color:#22c55e;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:6px;"><i class="fas fa-check-circle"></i> Todos os pré-requisitos atendidos</div>`
          : `<div style="color:#ef4444;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:6px;"><i class="fas fa-times-circle"></i> Pré-requisitos não atendidos (${evalResult.falhas.length} pendência${evalResult.falhas.length > 1 ? "s" : ""})</div>`;

        const itemsList = evalResult.itens
          .map((it) => {
            const icon = it.atende
              ? `<i class="fas fa-check" style="color:#22c55e;margin-top:2px;"></i>`
              : `<i class="fas fa-xmark" style="color:#ef4444;margin-top:2px;"></i>`;
            const color = it.atende ? "#86efac" : "#fca5a5";
            return `<li style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;font-size:0.83rem;color:${color};">${icon} <div><strong>${it.texto}:</strong> ${it.detalhe}</div></li>`;
          })
          .join("");

        prereqHtml = `
          <div class="prereq-card" style="margin-top:10px;padding:10px 12px;background:rgba(0,0,0,0.4);border:1px solid ${evalResult.atende ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.4)"};border-radius:6px;">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;font-weight:700;">Pré-Requisitos — ${this.targetActor.name}</div>
            ${statusHeader}
            <ul style="list-style:none;margin:0;padding:0;">${itemsList}</ul>
          </div>
        `;
      } else {
        prereqHtml = `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Pré-Requisitos:</b> ${item.system.requisitos}
          </div>`;
      }
    }

    const titleHeaderHtml = isForjaIllustration
      ? `<h2>${item.name}</h2>`
      : `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(245,158,11,0.25);">
          <img src="${itemImg}" alt="${item.name}" width="38" height="38" onerror="this.onerror=null;this.src='systems/mighty-blade/assets/icons/gear.svg';" style="width:38px !important;height:38px !important;object-fit:contain;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(15,23,42,0.7);" />
          <h2 style="margin:0;border:none;padding:0;">${item.name}</h2>
        </div>`;

    // Build details HTML
    let detailsHtml = `
      ${imgBanner}
      ${titleHeaderHtml}
      <div class="item-description">${description}</div>
    `;

    // Metadados específicos por tipo de item
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
      if (prereqHtml) detailsHtml += prereqHtml;
      if (item.system.racasComuns) {
        detailsHtml += `<div class="item-meta" style="margin-top:6px;"><strong>Raças Comuns:</strong> ${item.system.racasComuns}</div>`;
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
      const acessosStr = Array.isArray(item.system?.acesso) && item.system.acesso.length ? item.system.acesso.join(", ") : "Geral";
      const difLabel = item.system?.dificuldadeTexto || item.system?.dificuldade || "N/A";
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Círculo:</b> ${item.system.circulo || 1} (${item.system.nivel || "Nv1"}) · <b>Fonte:</b> ${item.system.fonte === "mistica" ? "Mística" : "Arcana"} · <b>Custo:</b> ${item.system.custo || 0} PM · <b>DV:</b> ${difLabel}
        </div>
        <div class="item-meta" style="margin-top:4px;">
          <b>Acesso Canônico:</b> ${acessosStr}${item.system?.fonteLivro ? ` · <b>Livro:</b> ${item.system.fonteLivro}` : ""}
        </div>`;
      if (prereqHtml) detailsHtml += prereqHtml;
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
      const acessosStr = Array.isArray(item.system?.acesso) && item.system.acesso.length ? item.system.acesso.join(", ") : "Geral";
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Tipo:</b> ${item.system.tipo || "suporte"} · <b>Categoria:</b> ${item.system.categoria || "tecnica"} · <b>Custo:</b> ${item.system.custo || 0} PM
        </div>
        <div class="item-meta" style="margin-top:4px;">
          <b>Acesso Canônico:</b> ${acessosStr}${item.system?.fonteLivro ? ` · <b>Livro:</b> ${item.system.fonteLivro}` : ""}
        </div>`;
      if (prereqHtml) detailsHtml += prereqHtml;
    }

    detailsContent.html(detailsHtml);
    this._activateJournalLinks(item, detailsContent);
  }

  /**
   * Conecta os botões e links de abertura de diários da Lore oficial.
   * @param {Item} item
   * @param {JQuery} detailsContent
   */
  _activateJournalLinks(item, detailsContent) {
    detailsContent.find(".open-lore-journal-btn, a[data-uuid]").on("click", async (evClick) => {
      evClick.preventDefault();
      evClick.stopPropagation();
      const target = $(evClick.currentTarget);
      const slug = target.data("slug") || item.flags?.["mighty-blade"]?.slug || slugify(item.name);
      const nameLower = item.name.toLowerCase();

      // 1. Prioridade: Buscar no Diário do mundo
      const worldJournal =
        game.journal.getName("bio e cultura") ||
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

      // 3. Fallback: compêndio de diários (mighty-blade.diarios)
      const diariosPack = game.packs.get("mighty-blade.diarios");
      if (diariosPack) {
        const docs = await diariosPack.getDocuments();
        const match = docs.find((d) => d.flags?.["mighty-blade"]?.slug === slug || d.name.toLowerCase().includes(nameLower));
        if (match) {
          match.sheet.render(true);
          return;
        }
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

      // 4. Fallback absoluto: Criar diário no mundo sob demanda
      if (item.type === "raca") {
        const lore = item.flags?.["mighty-blade"]?.lore;
        let content = `<div style="text-align:center;margin-bottom:16px;"><img src="${resolveItemImage(item)}" alt="${item.name}" style="max-height:260px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);" /></div>`;
        if (lore?.faixasEtarias) {
          const f = lore.faixasEtarias;
          content += `<h2>Faixas Etárias & Ciclo de Vida</h2><ul><li><strong>Filhote:</strong> ${f.filhote} anos</li><li><strong>Adulto:</strong> ${f.adulto} anos</li><li><strong>Idoso:</strong> ${f.idoso} anos</li><li><strong>Ancião:</strong> ${f.anciao} anos</li></ul><hr>`;
        }
        if (lore?.biologia) {
          content += `<h2>Biologia & Fisiologia</h2><p>${lore.biologia.replace(/\n/g, "<br>")}</p><hr>`;
        }
        if (lore?.cultura) {
          content += `<h2>Cultura & Sociedade</h2><p>${lore.cultura.replace(/\n/g, "<br>")}</p><hr>`;
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
              text: { content, format: 1 },
            }],
          });
          if (newDoc) {
            newDoc.sheet.render(true);
          }
        } catch (e) {
          console.error("MIGHTY BLADE: Erro ao criar diário sob demanda:", e);
        }
      }
    });
  }
}
