import {
  ATRIBUTOS,
  LINHAGENS_DRACONICAS,
  CARACTERISTICAS_DRACONICAS,
} from "../helpers/concessoes.mjs";
import { slugify } from "../helpers/forja-art.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MightyBladeItemSheet extends foundry.appv1.sheets.ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mighty-blade", "sheet", "item"],
      width: 560,
      height: 520,
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
    const knownTypes = [
      "arma",
      "armadura",
      "caminho",
      "classe",
      "equipamento",
      "habilidade",
      "idioma",
      "item",
      "magia",
      "organizacao",
      "raca",
    ];
    if (knownTypes.includes(this.item.type)) {
      return `systems/mighty-blade/templates/item/item-${this.item.type}-sheet.hbs`;
    }
    return `systems/mighty-blade/templates/item/item-sheet.hbs`;
  }

  /** @override */
  async getData() {
    // Recupera os dados básicos
    const context = super.getData();
    const itemData = context.item;

    // Adiciona dados úteis para o Handlebars
    context.rollData = {};
    const actor = this.object?.parent ?? null;
    context.isEmbedded = Boolean(actor);
    if (actor) {
      context.rollData = actor.getRollData();
    }

    context.system = itemData.system;
    context.flags = itemData.flags;

    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedDescription = await TextEditor.enrichHTML(
      context.system.description ?? "",
      { relativeTo: this.item }
    );

    // Para Raça e Classe, resolve a habilidade automática vinculada por UUID
    if ((this.item.type === "raca" || this.item.type === "classe") && context.system.habilidadeUuid) {
      const ability = await fromUuid(context.system.habilidadeUuid);
      if (ability) context.linkedAbility = ability;
    }

    // Constrói os passos de Avanço (D&D 5e Advancement Steps) a partir de system.concessoes
    const concessoes = Array.isArray(context.system?.concessoes) ? context.system.concessoes : [];
    context.advancementSteps = concessoes.map((c) => {
      if (c.tipo === "escolhaAtributo") {
        return {
          icone: "fa-sparkles",
          titulo: c.titulo || "Escolha de Atributo (+1)",
          descricao: c.excluirDeHabilidade
            ? `Concede +${c.valor ?? 1} em 1 atributo à escolha (exceto o atributo já escolhido em ${c.excluirDeHabilidade}).`
            : `Concede +${c.valor ?? 1} em 1 dos 4 atributos básicos à escolha do jogador.`,
        };
      }
      if (c.tipo === "origemDraconica") {
        return {
          icone: "fa-dragon",
          titulo: "Origem Dracônica (Avanço Multi-Passos)",
          descricao:
            "Passo 1: Herança Elemental (1 Resistência + 1 Vulnerabilidade). Passo 2: 3 Características Dracônicas (ou 4 ao sacrificar -1 em um Atributo).",
        };
      }
      if (c.tipo === "escolhaHabilidade") {
        return {
          icone: "fa-list-check",
          titulo: `Escolha de Habilidade (${c.quantidade ?? 1})`,
          descricao: `Opções: ${(c.opcoes || []).join(", ")}`,
        };
      }
      return {
        icone: "fa-award",
        titulo: `Concessão Automática: ${c.ref || "Habilidade"}`,
        descricao: "Adicionada automaticamente à ficha do personagem.",
      };
    });

    // Helper para extrair resumo de escolhas ativas de um item de habilidade
    const populateActiveChoicesFromAbility = (habItem) => {
      if (!habItem) return;
      const mbFlags = habItem.flags?.["mighty-blade"] ?? {};
      const habSlug = slugify(habItem.name || "");
      const hasAdv = Boolean(
        mbFlags.hasAdvancement ||
          mbFlags.chosenAttribute ||
          mbFlags.chosenLineage ||
          (Array.isArray(habItem.system?.concessoes) && habItem.system.concessoes.length > 0) ||
          ["adaptabilidade", "diversidade", "linhagem-draconica"].includes(habSlug)
      );
      if (!hasAdv) return;
      context.hasAdvancement = true;
      context.advancementTargetId = habItem.id || habItem._id;
      if (mbFlags.chosenAttribute) {
        context.activeChoiceSummary = `+1 ${ATRIBUTOS[mbFlags.chosenAttribute] || mbFlags.chosenAttribute}`;
      } else if (mbFlags.chosenLineage) {
        const linObj = LINHAGENS_DRACONICAS.find((l) => l.id === mbFlags.chosenLineage);
        context.activeChoiceSummary = linObj ? linObj.nome : mbFlags.chosenLineage;
        context.activeTraitPills = (mbFlags.chosenTraits || []).map(
          (id) => CARACTERISTICAS_DRACONICAS.find((t) => t.id === id)?.nome || id
        );
        if (mbFlags.chosenSacrificeAttribute) {
          context.activeSacrificeSummary = `-1 ${ATRIBUTOS[mbFlags.chosenSacrificeAttribute] || mbFlags.chosenSacrificeAttribute} (Sacrifício Dracônico • 4ª Característica)`;
        }
      }
    };

    if (this.item.type === "habilidade") {
      context.config = {
        tipos: {
          acao: "Ação",
          reacao: "Reação",
          suporte: "Suporte",
        },
        categorias: {
          tecnica: "Técnica",
          caracteristica: "Característica",
          magia: "Magia",
          antecedente: "Antecedente",
        },
      };
      populateActiveChoicesFromAbility(itemData);
    } else if (this.item.type === "raca" && actor) {
      const racialAdvItem = actor.items.find(
        (i) =>
          i.type === "habilidade" &&
          !i.flags?.["mighty-blade"]?.isSubFeature &&
          (i.flags?.["mighty-blade"]?.sourceRaceId === this.item.id ||
            ["adaptabilidade", "linhagem-draconica"].includes(slugify(i.name)))
      );
      if (racialAdvItem) {
        populateActiveChoicesFromAbility(racialAdvItem);
      }
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Botão para reconfigurar escolha de Avanço diretamente da aba AVANÇO do item
    html.find(".reconfigure-item-advancement-btn").click(async (ev) => {
      ev.preventDefault();
      const actor = this.object?.parent ?? null;
      const targetId = ev.currentTarget.dataset.itemId || this.item.id;
      if (actor && typeof actor.reconfigureAdvancement === "function") {
        await actor.reconfigureAdvancement(targetId);
        this.render(false);
      }
    });

    // Drag and Drop para Raça e Classe (habilidade automática)
    if (this.item.type === "raca" || this.item.type === "classe") {
      const dropZone = html.find(".drop-zone");
      dropZone.on("dragover", (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.add("drag-over");
      });
      dropZone.on("dragleave", (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.remove("drag-over");
      });
      dropZone.on("drop", this._onDropAbility.bind(this));

      html.find(".remove-link").click(async () => {
        await this.item.update({ "system.habilidadeUuid": "" });
      });
    }
  }

  /**
   * Handle dropping an Ability item onto the Race sheet
   * @param {Event} event
   */
  async _onDropAbility(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }

    if (data.type !== "Item") return;

    const item = await Item.fromDropData(data);
    if (!item) return;

    if (item.type !== "habilidade") {
      return ui.notifications.warn(
        "Você só pode vincular itens do tipo Habilidade."
      );
    }

    await this.item.update({ "system.habilidadeUuid": item.uuid });
  }
}
