import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from "../helpers/effects.mjs";
import {
  MightyBladeCompendiumBrowser,
  calcularEspacosHabilidades,
} from "../apps/compendium-browser.mjs";
import {
  resolveItemImage,
  slugify,
  CAMINHOS_FORJA_SLUGS,
  CLASSES_FORJA_MAP,
  ORGANIZACOES_FORJA_MAP,
} from "../helpers/forja-art.mjs";
import {
  CANONICAL_ANTECEDENTES,
} from "../helpers/config.mjs";
import {
  CANONICAL_CLASSES,
  CANONICAL_CAMINHOS,
  CANONICAL_ORGANIZACOES,
} from "../data/canonical-packs-data.mjs";
import { norm } from "../helpers/requisitos.mjs";
import { LevelUpDialog } from "../apps/dialogs/level-up-dialog.mjs";
import { SelectionDialog } from "../apps/dialogs/selection-dialog.mjs";
import {
  ATRIBUTOS,
  LINHAGENS_DRACONICAS,
} from "../helpers/concessoes.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MightyBladeActorSheet extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mighty-blade", "sheet", "actor", "dnd5e-theme-sheet"],
      width: 900,
      height: 880,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/mighty-blade/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    const actorData = this.document.toObject(false);

    // Usa os dados "vivos" do ator (inclui campos calculados em prepareDerivedData)
    // em vez da cópia serializada, que só teria os campos salvos no banco.
    context.system = this.actor.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.MIGHTY_BLADE
    context.config = CONFIG.MIGHTY_BLADE;

    // Prepare character data and items.
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography ?? "",
      {
        secrets: this.document.isOwner,
        rollData: this.actor.getRollData(),
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // Cálculo de porcentagem de recursos para barras de progresso visual
    const vidaVal = Number(context.system?.resources?.vida?.value) || 0;
    const vidaMax = Number(context.system?.resources?.vida?.max) || 1;
    context.vidaPct = Math.min(Math.max(Math.round((vidaVal / vidaMax) * 100), 0), 100);

    const manaVal = Number(context.system?.resources?.mana?.value) || 0;
    const manaMax = Number(context.system?.resources?.mana?.max) || 1;
    context.manaPct = Math.min(Math.max(Math.round((manaVal / manaMax) * 100), 0), 100);

    // Cálculo de XP e progresso para o próximo nível (estilo D&D 5e)
    const nivelNum = Number(context.system?.details?.nivel) || 1;
    const xpAtual = Number(context.system?.details?.experiencia) || 0;
    const xpMeta = Math.max(nivelNum * 10, 10);
    context.xpMeta = xpMeta;
    context.xpPct = Math.min(Math.max(Math.round((xpAtual / xpMeta) * 100), 0), 100);

    // Moedas (Prata é a moeda padrão do Mighty Blade)
    const totalPrata = Number(context.system?.details?.dinheiro) || 0;
    context.moedas = {
      ouro: Math.floor(totalPrata / 10),
      prata: totalPrata % 10,
      cobre: 0,
      totalPrata: totalPrata,
    };

    // Capacidade de Carga visual (Encumbrance Bar)
    const cargaVal = Number(context.system?.subattributes?.carga?.value) || 0;
    const cargaMax = Number(context.system?.subattributes?.carga?.max) || 15;
    const cargaAbs = Number(context.system?.subattributes?.carga?.maxAbsoluto) || 30;
    context.cargaPct = Math.min(Math.max(Math.round((cargaVal / cargaMax) * 100), 0), 100);
    context.isOverloaded = cargaVal > cargaMax;
    context.isEncumberedMax = cargaVal > cargaAbs;

    // Formatação amigável de slugs para exibição nobre
    const formatSlug = (val) => {
      if (!val || typeof val !== "string") return "";
      return val
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    };
    context.formattedOrganizacao = formatSlug(context.system?.details?.organizacao);
    context.formattedCaminho = formatSlug(context.system?.details?.caminho);
    context.formattedAprendiz = formatSlug(context.system?.details?.aprendiz);

    // Flag de nível 2+ para elegibilidade e design de Aprendiz de Classe
    context.isLevel2Plus = nivelNum >= 2;

    // Resolução de arte oficial e sincronização para Caminho e Organização
    if (context.caminho) {
      context.caminhoImg = context.caminho.img;
      if (!context.system?.details?.caminho) {
        context.system.details.caminho = context.caminho.name;
        context.formattedCaminho = context.caminho.name;
      }
    } else if (context.system?.details?.caminho) {
      const cSlug = slugify(context.system.details.caminho);
      const cFile = CAMINHOS_FORJA_SLUGS.has(cSlug) ? `${cSlug}.png` : (CLASSES_FORJA_MAP[cSlug] || "caminho.png");
      context.caminhoImg = `systems/mighty-blade/assets/forja/${cFile}`;
    }

    if (context.organizacao) {
      context.organizacaoImg = context.organizacao.img;
      if (!context.system?.details?.organizacao) {
        context.system.details.organizacao = context.organizacao.name;
        context.formattedOrganizacao = context.organizacao.name;
      }
    } else if (context.system?.details?.organizacao) {
      const oSlug = slugify(context.system.details.organizacao);
      const oFile = ORGANIZACOES_FORJA_MAP[oSlug] || `org_${oSlug}.png`;
      context.organizacaoImg = `systems/mighty-blade/assets/forja/${oFile}`;
    }
  }

  /**
   * Organize and classify Items for Actor sheets in D&D 5e inspired categories.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Containers estruturados
    const gear = [];
    const weapons = [];
    const armors = [];
    const consumables = [];
    const equipmentList = [];
    const favorites = [];

    const features = [];
    const racialFeatures = [];
    const classFeatures = [];
    const pathFeatures = [];
    const generalFeatures = [];

    const antecedentes = [];
    const magias = [];
    let raca = null;
    let classe = null;
    let caminho = null;
    let organizacao = null;
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iteração e classificação detalhada dos itens
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      // Detectar se o item está favoritado
      if (i.flags?.["mighty-blade"]?.isFavorite) {
        favorites.push(i);
      }

      // 1. Armas
      if (i.type === "arma") {
        gear.push(i);
        weapons.push(i);
      }
      // 2. Armaduras & Escudos
      else if (i.type === "armadura") {
        gear.push(i);
        armors.push(i);
      }
      // 3. Consumíveis / Poções / Elixires
      else if (i.type === "item" || i.system?.subtipo === "consumivel") {
        gear.push(i);
        consumables.push(i);
      }
      // 4. Equipamentos gerais
      else if (i.type === "equipamento") {
        gear.push(i);
        equipmentList.push(i);
      }
      // 5. Habilidades & Features
      else if (i.type === "feature" || i.type === "habilidade") {
        const mbFlags = i.flags?.["mighty-blade"] ?? {};
        const itemSlug = slugify(i.name);
        i.isSubFeature = Boolean(mbFlags.isSubFeature || mbFlags.parentAbilityId);
        i.originLabel = mbFlags.originLabel || "";
        i.hasAdvancement = Boolean(
          mbFlags.hasAdvancement ||
          mbFlags.chosenAttribute ||
          mbFlags.chosenLineage ||
          (Array.isArray(i.system?.concessoes) && i.system.concessoes.length > 0) ||
          ["adaptabilidade", "diversidade", "linhagem-draconica"].includes(itemSlug)
        );

        if (mbFlags.chosenAttribute) {
          const attrLabel = ATRIBUTOS[mbFlags.chosenAttribute] || mbFlags.chosenAttribute;
          i.advancementSummary = `+1 ${attrLabel}`;
        } else if (mbFlags.chosenLineage) {
          const linObj = LINHAGENS_DRACONICAS.find((l) => l.id === mbFlags.chosenLineage);
          const linShort = linObj ? linObj.curto : mbFlags.chosenLineage;
          const sacAttr = mbFlags.chosenSacrificeAttribute
            ? ` • -1 ${ATRIBUTOS[mbFlags.chosenSacrificeAttribute] || mbFlags.chosenSacrificeAttribute}`
            : "";
          i.advancementSummary = `${linShort}${sacAttr}`;
        } else if (i.hasAdvancement) {
          // Tenta extrair de system.efeitos se já possuir bonusAtributo
          const bonusEf = (i.system?.efeitos || []).find(
            (e) => e.tipo === "bonusAtributo" && Number(e.valor) > 0 && e.atributo
          );
          if (bonusEf) {
            i.advancementSummary = `+${bonusEf.valor} ${ATRIBUTOS[bonusEf.atributo] || bonusEf.atributo}`;
          }
        }

        if (i.system?.categoria === "antecedente") {
          antecedentes.push(i);
        } else {
          features.push(i);
        }
      }
      // 6. Magias
      else if (i.type === "spell" || i.type === "magia") {
        const difStr = String(i.system?.dificuldade ?? "").trim();
        const isNum = difStr !== "" && !isNaN(Number(difStr));
        i.displayDificuldade = isNum ? `DV ${difStr}` : (difStr || "—");
        magias.push(i);
        if (spells[i.system?.circulo] !== undefined) {
          spells[i.system.circulo].push(i);
        }
      }
      // 7. Identidade Heroica (Raça, Classe, Caminho, Organização)
      else if (i.type === "raca") {
        i.img = resolveItemImage(i);
        raca = i;
      } else if (i.type === "classe") {
        i.img = resolveItemImage(i);
        classe = i;
      } else if (i.type === "caminho") {
        i.img = resolveItemImage(i);
        caminho = i;
      } else if (i.type === "organizacao") {
        i.img = resolveItemImage(i);
        organizacao = i;
      }
    }

    // Classificação de Habilidades pela Origem (Flags explícitas ou listas de Classe/Caminho/Organização/Raça)
    const classeNome = classe?.name || context.system?.details?.classe || this.actor?.system?.details?.classe || "";
    const canonicalClass = CANONICAL_CLASSES.find(
      (c) => norm(c.name) === norm(classeNome) || c.flags?.["mighty-blade"]?.slug === slugify(classeNome)
    );
    const classeLista = (classe?.system?.listaHabilidades && classe.system.listaHabilidades.length > 0)
      ? classe.system.listaHabilidades
      : (canonicalClass?.system?.listaHabilidades || []);

    const caminhoNome = caminho?.name || context.system?.details?.caminho || this.actor?.system?.details?.caminho || "";
    const canonicalCaminho = CANONICAL_CAMINHOS.find(
      (c) => norm(c.name) === norm(caminhoNome) || c.flags?.["mighty-blade"]?.slug === slugify(caminhoNome)
    );
    const caminhoLista = (caminho?.system?.listaHabilidades && caminho.system.listaHabilidades.length > 0)
      ? caminho.system.listaHabilidades
      : (canonicalCaminho?.system?.listaHabilidades || []);

    const orgNome = organizacao?.name || context.system?.details?.organizacao || this.actor?.system?.details?.organizacao || "";
    const canonicalOrg = CANONICAL_ORGANIZACOES.find(
      (o) => norm(o.name) === norm(orgNome) || o.flags?.["mighty-blade"]?.slug === slugify(orgNome)
    );
    const orgLista = (organizacao?.system?.listaHabilidades && organizacao.system.listaHabilidades.length > 0)
      ? organizacao.system.listaHabilidades
      : (canonicalOrg?.system?.listaHabilidades || []);

    const racaNome = raca?.name || context.system?.details?.raca || this.actor?.system?.details?.raca || "";

    for (const feat of features) {
      const mbFlags = feat.flags?.["mighty-blade"] || {};
      const slug = mbFlags.slug || slugify(feat.name || "");

      // a) Flags de origem explícitas
      if (mbFlags.sourceRaceId || mbFlags.isSubFeature || mbFlags.parentAbilityId) {
        racialFeatures.push(feat);
      } else if (mbFlags.sourceClasseId) {
        classFeatures.push(feat);
      } else if (mbFlags.sourceCaminhoId) {
        pathFeatures.push(feat);
      } else if (mbFlags.sourceOrganizacaoId) {
        // Se houver grupo de organização no futuro; atualmente aloca em Gerais
        generalFeatures.push(feat);
      } else if (mbFlags.origem === "geral") {
        generalFeatures.push(feat);
      } else {
        // b) Sem flag (itens antigos): dedução canônica
        const reqStr = String(feat.system?.requisitos || "");
        const acessoList = Array.isArray(feat.system?.acesso) ? feat.system.acesso : [];
        const isRacial = Boolean(
          racaNome && (
            norm(reqStr).includes(norm(racaNome)) ||
            ((feat.system?.tipoAcesso === "Raça" || mbFlags.tipoAcesso === "Raça") &&
              acessoList.some((a) => norm(a) === norm(racaNome)))
          )
        );

        if (classeLista.some((id) => slugify(id) === slug)) {
          classFeatures.push(feat);
        } else if (caminhoLista.some((id) => slugify(id) === slug)) {
          pathFeatures.push(feat);
        } else if (orgLista.some((id) => slugify(id) === slug)) {
          generalFeatures.push(feat);
        } else if (isRacial) {
          racialFeatures.push(feat);
        } else {
          generalFeatures.push(feat);
        }
      }
    }

    // Agrupamento Hierárquico (Opção C - Estilo D&D 5e):
    // Sub-features (ex.: Asas, Escamas, Cauda) ficam aninhadas logo abaixo da habilidade-mãe (Linhagem Dracônica)
    const primaryRacial = [];
    const subFeaturesList = [];
    for (const feat of racialFeatures) {
      if (feat.isSubFeature) subFeaturesList.push(feat);
      else primaryRacial.push(feat);
    }

    const childrenByParentId = new Map();
    const orphanSubFeatures = [];
    for (const sub of subFeaturesList) {
      const parentId = sub.flags?.["mighty-blade"]?.parentAbilityId;
      const parentSlug = sub.flags?.["mighty-blade"]?.parentSlug || "linhagem-draconica";
      const parentItem = primaryRacial.find(
        (p) => (parentId && p._id === parentId) || slugify(p.name) === parentSlug
      );
      if (parentItem) {
        if (!childrenByParentId.has(parentItem._id)) {
          childrenByParentId.set(parentItem._id, []);
        }
        childrenByParentId.get(parentItem._id).push(sub);
      } else {
        orphanSubFeatures.push(sub);
      }
    }

    const orderedRacialFeatures = [];
    for (const parent of primaryRacial) {
      const children = childrenByParentId.get(parent._id) || [];
      if (children.length > 0) {
        parent.hasChildren = true;
        parent.childrenCount = children.length;
      }
      orderedRacialFeatures.push(parent);
      children.forEach((child, idx) => {
        child.isLastSubFeature = idx === children.length - 1;
        orderedRacialFeatures.push(child);
      });
    }
    for (const orphan of orphanSubFeatures) {
      orderedRacialFeatures.push(orphan);
    }

    // Se a Raça tiver uma habilidade de avanço vinculada (Adaptabilidade / Linhagem Dracônica) ou for Humano/Dragano, expõe no card de Raça
    if (raca) {
      const racaSlug = slugify(raca.name);
      const advAbility = primaryRacial.find((f) => f.hasAdvancement);
      if (advAbility) {
        raca.advancementTargetId = advAbility._id;
        raca.advancementSummary = advAbility.advancementSummary || "";
      } else if (
        racaSlug === "humano" ||
        racaSlug === "dragano" ||
        (Array.isArray(raca.system?.concessoes) &&
          raca.system.concessoes.some((c) => c.tipo === "escolhaAtributo" || c.tipo === "origemDraconica"))
      ) {
        raca.advancementTargetId = raca._id;
      }
    }

    // Exportação para o contexto Handlebars
    context.gear = gear;
    context.weapons = weapons;
    context.armors = armors;
    context.consumables = consumables;
    context.equipmentList = equipmentList;
    context.favorites = favorites;

    context.features = features;
    context.racialFeatures = orderedRacialFeatures;
    context.racialPrimaryCount = primaryRacial.length;
    context.racialSubFeaturesCount = subFeaturesList.length;
    context.classFeatures = classFeatures;
    context.pathFeatures = pathFeatures;
    context.generalFeatures = generalFeatures;

    context.antecedentes = antecedentes;
    context.spells = spells;
    context.magias = magias;
    context.raca = raca;
    context.classe = classe;
    context.caminho = caminho;
    context.organizacao = organizacao;
    context.equippedWeapons = weapons.filter((w) => w.system?.equipado);

    // Cálculo de espaços de habilidades e magias do nível
    if (this.actor) {
      const espacos = calcularEspacosHabilidades(this.actor);
      context.espacosEscolhidas = espacos.escolhidas;
      context.espacosLimite = espacos.limite;
      context.espacosEsgotado = espacos.esgotado;
      context.espacosTexto = `${espacos.escolhidas} / ${espacos.limite}`;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Navegar diretamente para a aba Magias a partir da lista resumida de magias
    html.on("click", ".open-spells-tab", (ev) => {
      ev.preventDefault();
      if (this._tabs?.[0]) {
        this._tabs[0].activate("spells");
      } else {
        html.find('.sheet-tabs a[data-tab="spells"]').trigger("click");
      }
    });

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on("click", ".item-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Toggle Edit Mode
    html.find(".sheet-config").click(this._onSheetConfig.bind(this));

    // Replace Race/Class/Caminho/Organizacao
    html.on("click", ".item-replace", this._onItemReplace.bind(this));

    // Reconfigurar escolha de Avanço (Adaptabilidade, Diversidade, Origem Dracônica)
    html.on("click", ".reconfigure-advancement-btn", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.isEditable) return;
      const itemId =
        ev.currentTarget.dataset.itemId ||
        ev.currentTarget.closest(".item")?.dataset.itemId;
      if (itemId) {
        await this.actor.reconfigureAdvancement(itemId);
      }
    });

    // Navegador de Compêndio direto da ficha
    html.on("click", ".open-compendium-browser", (ev) => {
      ev.preventDefault();
      const type = ev.currentTarget.dataset.type || null;
      new MightyBladeCompendiumBrowser({
        type: type,
        actor: this.actor,
      }).render(true);
    });

    // Subir de Nível / Evolução de Personagem
    html.on("click", ".level-up-trigger", this._onLevelUp.bind(this));

    // Escolha e Troca de Aprendiz de Classe
    html.on("click", ".choose-aprendiz-btn", this._onChooseAprendiz.bind(this));

    // Escolha e Troca de Antecedente
    html.on("click", ".choose-antecedente-btn", this._onChooseAntecedente.bind(this));

    // Limpar detalhe rápido (caminho, organização, antecedente, aprendiz)
    html.on("click", ".clear-detail-btn", async (ev) => {
      ev.preventDefault();
      const detail = ev.currentTarget.dataset.detail;
      if (detail) await this.actor.clearDetail(detail);
    });

    // Rolagens (atributos, armas, habilidades): disponíveis antes da trava de
    // edição — um observador/jogador pode rolar mesmo sem o modo de edição ligado.
    html.on("click", ".rollable", this._onRoll.bind(this));

    // Descanso Curto / Recuperação Rápida
    html.on("click", ".rest-short-btn", this._onShortRest.bind(this));

    // Descanso Longo / Descanso Completo
    html.on("click", ".rest-long-btn", this._onLongRest.bind(this));

    // Alternar Favorito
    html.on("click", ".item-favorite-toggle", this._onToggleFavorite.bind(this));

    // Quantidade (+ / -) de itens
    html.on("click", ".item-qty-plus", async (ev) => {
      ev.preventDefault();
      const li = ev.currentTarget.closest(".item");
      const item = this.actor.items.get(li?.dataset.itemId);
      if (item) {
        const currentQty = Number(item.system?.quantidade) || 1;
        await item.update({ "system.quantidade": currentQty + 1 });
      }
    });

    html.on("click", ".item-qty-minus", async (ev) => {
      ev.preventDefault();
      const li = ev.currentTarget.closest(".item");
      const item = this.actor.items.get(li?.dataset.itemId);
      if (item) {
        const currentQty = Number(item.system?.quantidade) || 1;
        if (currentQty > 1) {
          await item.update({ "system.quantidade": currentQty - 1 });
        }
      }
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on("click", ".item-create", this._onItemCreate.bind(this));

    // Equipar / desequipar item (atualiza defesas, mãos, etc.)
    html.on("click", ".item-equip", async (ev) => {
      const li = ev.currentTarget.closest(".item");
      const item = this.actor.items.get(li?.dataset.itemId);
      if (!item) return;

      const isEquipping = !item.system?.equipado;
      if (isEquipping) {
        const { validarLimiteArmaduras, validarLimiteMaos, obterUsoMaosItem } = await import("../helpers/equipamento.mjs");
        if (item.type === "armadura" && (item.system?.subtipo ?? "armadura") !== "escudo") {
          const check = validarLimiteArmaduras(this.actor, item);
          if (!check.valido) {
            ui.notifications.warn(check.erro);
            return;
          }
        }
        if (obterUsoMaosItem(item) > 0) {
          const checkMaos = validarLimiteMaos(this.actor, item);
          if (!checkMaos.valido) {
            ui.notifications.warn(checkMaos.erro);
            return;
          }
        }
      }

      await item.update({ "system.equipado": isEquipping });
    });

    // Delete Inventory Item
    html.on("click", ".item-delete", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) {
        item.delete();
        li.slideUp(200, () => this.render(false));
      }
    });

    // Active Effect management
    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle replacing an existing Race, Class, Caminho, or Organizacao
   * @param {Event} event
   * @private
   */
  async _onItemReplace(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    // Open Compendium Browser directly
    new MightyBladeCompendiumBrowser({
      type: type,
      actor: this.actor,
    }).render(true);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    // Compêndios principais abrem o navegador em vez de criar item vazio
    if (["raca", "classe", "caminho", "organizacao"].includes(type)) {
      new MightyBladeCompendiumBrowser({
        type: type,
        actor: this.actor,
      }).render(true);
      return;
    }

    const itemData = {
      name: `New ${type}`,
      type: type,
      system: {},
    };

    return await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Diálogo Interativo de Evolução / Subida de Nível (Canônico Mighty Blade 3e)
   * @param {Event} event
   * @private
   */
  _onLevelUp(event) {
    event.preventDefault();
    return LevelUpDialog.show(this.actor);
  }

  /**
   * Diálogo para escolha direta de Aprendiz de Classe
   * @param {Event} event
   * @private
   */
  _onChooseAprendiz(event) {
    event.preventDefault();
    return SelectionDialog.chooseAprendiz(this.actor);
  }

  /**
   * Diálogo para escolha canônica de Antecedente
   * @param {Event} event
   * @private
   */
  _onChooseAntecedente(event) {
    event.preventDefault();
    return SelectionDialog.chooseAntecedente(this.actor);
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const skipDialog = event.shiftKey;

    // Rolagem de item (arma, habilidade, magia…). Shift pula o diálogo.
    if (dataset.rollType === "item") {
      const itemId = element.closest(".item")?.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item) return item.roll({ skipDialog });
      return;
    }

    // Teste de atributo (Força, Agilidade, Inteligência, Vontade).
    if (dataset.rollType === "attribute") {
      return rollAttribute(this.actor, dataset.attribute, { skipDialog });
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }

  /**
   * Toggle Edit Mode
   * @param {Event} event
   * @private
   */
  async _onSheetConfig(event) {
    event.preventDefault();
    const flag = this.actor.getFlag("mighty-blade", "isEditing");
    await this.actor.setFlag("mighty-blade", "isEditing", !flag);
  }

  /**
   * Recuperação Rápida / Descanso Curto (recupera 50% de PV e PM)
   * @param {Event} event
   */
  async _onShortRest(event) {
    event.preventDefault();
    const vida = this.actor.system?.resources?.vida;
    const mana = this.actor.system?.resources?.mana;
    if (!vida || !mana) return;

    const vidaRecuperada = Math.ceil((vida.max || 60) / 2);
    const manaRecuperada = Math.ceil((mana.max || 60) / 2);

    const novaVida = Math.min((vida.value || 0) + vidaRecuperada, vida.max || 60);
    const novaMana = Math.min((mana.value || 0) + manaRecuperada, mana.max || 60);

    await this.actor.update({
      "system.resources.vida.value": novaVida,
      "system.resources.mana.value": novaMana,
    });

    ui.notifications.info(`Recuperação Rápida: +${vidaRecuperada} PV e +${manaRecuperada} PM.`);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: "🥪 <b>Recuperação Rápida (Descanso Curto)</b>",
      content: `<p><b>${this.actor.name}</b> realizou uma pausa para descanso breve, recuperando <b>+${vidaRecuperada} PV</b> e <b>+${manaRecuperada} PM</b>.</p>`,
    });
  }

  /**
   * Descanso Completo / Descanso Longo (recupera 100% de PV e PM)
   * @param {Event} event
   */
  async _onLongRest(event) {
    event.preventDefault();
    const vida = this.actor.system?.resources?.vida;
    const mana = this.actor.system?.resources?.mana;
    if (!vida || !mana) return;

    await this.actor.update({
      "system.resources.vida.value": vida.max || 60,
      "system.resources.mana.value": mana.max || 60,
    });

    ui.notifications.info(`Descanso Completo: PV e PM restaurados.`);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: "⛺ <b>Descanso Completo (Descanso Longo)</b>",
      content: `<p><b>${this.actor.name}</b> completou um descanso longo revigorante. <b>Pontos de Vida e Mana totalmente restabelecidos</b>!</p>`,
    });
  }

  /**
   * Alternar estado de favorito em um item
   * @param {Event} event
   */
  async _onToggleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);
    if (!item) return;

    const current = Boolean(item.flags?.["mighty-blade"]?.isFavorite);
    await item.setFlag("mighty-blade", "isFavorite", !current);
  }
}
