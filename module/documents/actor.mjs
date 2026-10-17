import { MIGHTY_BLADE } from "../helpers/config.mjs";
import {
  getConcessoes,
  escolherAtributo,
  escolherOrigemDraconica,
  escolherHabilidades,
  resolveOpcoes,
  resolveRef,
  obterAtributoEscolhidoDeHabilidade,
  aplicarEscolhaAtributoNoItem,
  construirItensOrigemDraconica,
} from "../helpers/concessoes.mjs";
import { norm, avaliarRequisitos, validarCaminhoPrestigio } from "../helpers/requisitos.mjs";
import {
  validarClasseRaca,
  validarIncompatibilidadePactoMisticismo,
  validarAquisicaoHabilidade,
  validarAcessoMagia,
  enriquecerItemComSSOT,
} from "../helpers/restricoes.mjs";
import {
  validarAumentoAtributos,
  NIVEIS_COM_AUMENTO_ATRIBUTO,
  normalizarPontoEvolucao,
  resolverClasseCanonica,
} from "../helpers/progressao.mjs";
import {
  calcularDano,
  aplicarDano,
  consumirMana,
  temCondicao,
  isActorInapto,
} from "../helpers/danos-condicoes.mjs";
import {
  atualizarEstadoSaude,
  aplicarCondicao,
  removerCondicao,
  obterEstadoSaude,
  definirEstadoSaude,
  falharTesteSobrevivencia,
  passarTesteSobrevivencia,
  isMorto,
  isPorUmFio,
  isSaudavel,
  podeRealizarAcoes,
  podeRealizarReacoes,
  isAtaqueInapto,
  isPercepcaoVisualInapta,
  obterPenalidadeDefesa,
  obterPenalidadeTestes,
  obterFonteMedo,
  podeAproximarFonteMedo,
} from "../helpers/estados-saude.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MightyBladeActor extends (typeof Actor !== "undefined" ? Actor : class Actor {}) {

  /**
   * Dados disponíveis em fórmulas de rolagem (ex.: "2d6 + @for", "2d6 + @init").
   * Expõe atalhos curtos para os atributos e a iniciativa do Mighty Blade.
   * @override
   */
  getRollData() {
    const data = { ...super.getRollData() };
    const attrs = this.system?.attributes;
    const agi = attrs?.agilidade?.value ?? 0;
    const int = attrs?.inteligencia?.value ?? 0;
    if (attrs) {
      data.for = attrs.forca?.value ?? 0;
      data.agi = agi;
      data.int = int;
      data.von = attrs.vontade?.value ?? 0;
    }
    // Iniciativa = 2d6 + maior entre Agilidade e Inteligência.
    data.init = Math.max(agi, int);
    data.nivel = this.system?.details?.nivel ?? 1;
    return data;
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);

    // Clampa vida (PV) e mana (PM) automaticamente para não exceder o máximo nem ser menor que zero
    const vidaVal = foundry.utils.getProperty(changed, "system.resources.vida.value");
    const vidaMax = foundry.utils.getProperty(changed, "system.resources.vida.max") ?? this.system?.resources?.vida?.max ?? 60;
    if (vidaVal !== undefined) {
      const clamped = Math.min(Math.max(Number(vidaVal) || 0, 0), Number(vidaMax) || 60);
      foundry.utils.setProperty(changed, "system.resources.vida.value", clamped);
    }

    const manaVal = foundry.utils.getProperty(changed, "system.resources.mana.value");
    const manaMax = foundry.utils.getProperty(changed, "system.resources.mana.max") ?? this.system?.resources?.mana?.max ?? 60;
    if (manaVal !== undefined) {
      const clamped = Math.min(Math.max(Number(manaVal) || 0, 0), Number(manaMax) || 60);
      foundry.utils.setProperty(changed, "system.resources.mana.value", clamped);
    }
  }

  /**
   * Foundry VTT v13/v14 lifecycle hook disparado após documentos filhos (ex.: Items) serem criados no Ator.
   * No Foundry v14, `_onCreateEmbeddedDocuments` foi substituído por `_onCreateDescendantDocuments`.
   * @override
   */
  _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onCreateDescendantDocuments?.(parent, collection, documents, data, options, userId);
    if (parent !== this || (collection !== "items" && collection !== "Item")) return;
    if (typeof game !== "undefined" && game?.user?.id && userId && userId !== game.user.id) return;
    void this._onCreateEmbeddedDocuments("Item", documents, data, options, userId);
  }

  /**
   * Foundry VTT v13/v14 lifecycle hook disparado após documentos filhos (ex.: Items) serem removidos do Ator.
   * @override
   */
  _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    super._onDeleteDescendantDocuments?.(parent, collection, documents, ids, options, userId);
    if (parent !== this || (collection !== "items" && collection !== "Item")) return;
    if (typeof game !== "undefined" && game?.user?.id && userId && userId !== game.user.id) return;
    void this._onDeleteEmbeddedDocuments("Item", documents, ids, options, userId);
  }

  /**
   * Foundry VTT v13/v14 lifecycle hook disparado após documentos filhos (ex.: Items) serem atualizados no Ator.
   * @override
   */
  _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
    super._onUpdateDescendantDocuments?.(parent, collection, documents, changes, options, userId);
    if (parent !== this || (collection !== "items" && collection !== "Item")) return;
    if (typeof game !== "undefined" && game?.user?.id && userId && userId !== game.user.id) return;
    void this._onUpdateEmbeddedDocuments("Item", documents, changes, options, userId);
  }

  /** @override */
  async _onCreateEmbeddedDocuments(
    embeddedName,
    documents,
    result,
    options,
    userId
  ) {
    await super._onCreateEmbeddedDocuments?.(
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    if (embeddedName !== "Item") return;
    // Durante a importação de uma ficha pronta, as habilidades escolhidas já vêm
    // embutidas — não reprocessar as concessões (evita duplicar / re-perguntar).
    if (MightyBladeActor._suppressConcessoes) return;

    const race = documents.find((d) => d.type === "raca");
    if (race) await this._onRaceCreated(race);

    const classe = documents.find((d) => d.type === "classe");
    if (classe) await this._onClassCreated(classe);

    const caminho = documents.find((d) => d.type === "caminho");
    if (caminho) await this._onCaminhoCreated(caminho);

    const org = documents.find((d) => d.type === "organizacao");
    if (org) await this._onOrganizacaoCreated(org);

    const habilidades = documents.filter((d) => d.type === "habilidade");
    for (const hab of habilidades) {
      await this._onHabilidadeCreated(hab);
    }

    const magias = documents.filter((d) => d.type === "magia");
    for (const magia of magias) {
      await this._onMagiaCreated(magia);
    }
  }

  /** @override */
  async _onDeleteEmbeddedDocuments(
    embeddedName,
    documents,
    result,
    options,
    userId
  ) {
    await super._onDeleteEmbeddedDocuments?.(
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    if (embeddedName !== "Item") return;

    const race = documents.find((d) => d.type === "raca");
    if (race) await this._onRaceDeleted(race);

    const classe = documents.find((d) => d.type === "classe");
    if (classe) await this._onClassDeleted(classe);

    const caminho = documents.find((d) => d.type === "caminho");
    if (caminho) await this._onCaminhoDeleted(caminho);

    const org = documents.find((d) => d.type === "organizacao");
    if (org) await this._onOrganizacaoDeleted(org);

    const deletedHabIds = documents
      .filter((d) => d.type === "habilidade")
      .map((d) => d.id || d._id)
      .filter(Boolean);
    if (deletedHabIds.length) {
      const childIds = this.items
        .filter((i) => deletedHabIds.includes(i.getFlag?.("mighty-blade", "parentAbilityId") ?? i.flags?.["mighty-blade"]?.parentAbilityId))
        .map((i) => i.id || i._id)
        .filter(Boolean);
      if (childIds.length) {
        await this.deleteEmbeddedDocuments("Item", childIds);
      }
    }
  }

  /**
   * Aplica as concessões de uma raça quando ela é adicionada à ficha.
   * @param {Item} race
   */
  async _onRaceCreated(race) {
    // Se já houver uma classe incompatível com a nova raça (ex: Naga + Sacerdote), revoga a classe incompatível
    const existingClass = this.items.find((i) => i.type === "classe");
    if (existingClass) {
      const check = validarClasseRaca(this, existingClass.name);
      if (!check.permitido) {
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(check.motivo);
        }
        await this.deleteEmbeddedDocuments("Item", [existingClass.id]);
        if (this.system?.details?.classe === existingClass.name) {
          await this.update({ "system.details.classe": "" });
        }
      }
    }

    const concessoes = getConcessoes(race);
    if (concessoes.length) {
      await this._processConcessoes(race, "sourceRaceId");
      if (typeof ui !== "undefined" && ui?.notifications?.info) {
        ui.notifications.info(`Raça ${race.name} aplicada.`);
      }
      return;
    }

    // Fallback legado: habilidade automática embutida como texto (sem UUID).
    const auto = race.system?.habilidadeAutomatica;
    if (auto?.nome) {
      await this.createEmbeddedDocuments("Item", [
        {
          name: auto.nome,
          type: "habilidade",
          img: race.img,
          system: {
            description: auto.descricao,
            tipo: auto.tipo || "suporte",
            categoria: auto.categoria || "caracteristica",
            custo: auto.custo || 0,
            requisitos: `Raça: ${race.name}`,
          },
          flags: { "mighty-blade": { sourceRaceId: race.id } },
        },
      ]);
      if (typeof ui !== "undefined" && ui?.notifications?.info) {
        ui.notifications.info(`Raça ${race.name} aplicada (Legado).`);
      }
    }
  }

  /** Remove todas as habilidades concedidas por uma raça quando ela é removida. */
  async _onRaceDeleted(race) {
    await this._removeConcessoes("sourceRaceId", race.id);
  }

  /**
   * Valida e aplica as concessões de uma classe quando ela é adicionada à ficha.
   * @param {Item} classe
   * @returns {Promise<boolean>}
   */
  async _onClassCreated(classe) {
    const racaCheck = validarClasseRaca(this, classe.name);
    if (!racaCheck.permitido) {
      if (typeof ui !== "undefined" && ui?.notifications?.error) {
        ui.notifications.error(racaCheck.motivo);
      }
      await this.deleteEmbeddedDocuments("Item", [classe.id]);
      if (this.system?.details?.classe === classe.name) {
        await this.update({ "system.details.classe": "" });
      }
      return false;
    }

    const pactoCheck = validarIncompatibilidadePactoMisticismo(this, classe.name);
    if (!pactoCheck.permitido) {
      if (typeof ui !== "undefined" && ui?.notifications?.error) {
        ui.notifications.error(pactoCheck.motivo);
      }
      await this.deleteEmbeddedDocuments("Item", [classe.id]);
      if (this.system?.details?.classe === classe.name) {
        await this.update({ "system.details.classe": "" });
      }
      return false;
    }

    if (!getConcessoes(classe).length) return true;
    await this._processConcessoes(classe, "sourceClasseId");
    if (typeof ui !== "undefined" && ui?.notifications?.info) {
      ui.notifications.info(`Classe ${classe.name} aplicada.`);
    }
    return true;
  }

  /** Remove todas as habilidades concedidas por uma classe quando ela é removida. */
  async _onClassDeleted(classe) {
    await this._removeConcessoes("sourceClasseId", classe.id);
  }

  /**
   * Valida uma habilidade recém-adicionada à ficha e aplica regras de revogação (Pacto vs Misticismo)
   * e escolhas de Avanço (como Diversidade do Humano e Linhagem Dracônica 2 do Dragano).
   * @param {Item} hab
   * @returns {Promise<boolean>}
   */
  async _onHabilidadeCreated(hab) {
    const isAutoGrant = Boolean(
      hab.flags?.["mighty-blade"]?.sourceRaceId ||
      hab.flags?.["mighty-blade"]?.sourceClasseId ||
      hab.flags?.["mighty-blade"]?.sourceAprendiz
    );

    if (!isAutoGrant) {
      const check = validarAquisicaoHabilidade(this, hab);
      if (!check.permitido) {
        if (typeof ui !== "undefined" && ui?.notifications?.error) {
          ui.notifications.error(check.motivo);
        }
        await this.deleteEmbeddedDocuments("Item", [hab.id]);
        return false;
      }

      if (hab.system?.requisitos) {
        const evalResult = avaliarRequisitos(hab.system.requisitos, this);
        if (!evalResult.atende) {
          const msg = `Pré-requisitos não atendidos para "${hab.name}": ${evalResult.falhas.join(", ")}`;
          if (typeof ui !== "undefined" && ui?.notifications?.error) {
            ui.notifications.error(msg);
          }
          await this.deleteEmbeddedDocuments("Item", [hab.id]);
          return false;
        }
      }
    }

    const nHab = norm(hab.name);
    const slugHab = hab.flags?.["mighty-blade"]?.slug || "";

    // Automação da Habilidade Racial "Diversidade" (Humano): +1 em atributo diferente de Adaptabilidade
    if (!isAutoGrant && (nHab === "diversidade" || slugHab === "diversidade")) {
      const attrAdapt = obterAtributoEscolhidoDeHabilidade(this, "Adaptabilidade");
      const existingEfeito = (hab.system?.efeitos || []).find((e) => e.tipo === "bonusAtributo");
      let chosenAttr = existingEfeito?.atributo || hab.system?.bonusAtributo?.atributo || null;

      if (chosenAttr && attrAdapt && chosenAttr === attrAdapt) {
        const msg = `Diversidade exige um Atributo diferente do escolhido em Adaptabilidade (${attrAdapt}).`;
        if (typeof ui !== "undefined" && ui?.notifications?.error) {
          ui.notifications.error(msg);
        }
        await this.deleteEmbeddedDocuments("Item", [hab.id || hab._id]);
        throw new Error(msg);
      }

      if (!chosenAttr && typeof foundry !== "undefined" && foundry?.applications?.api?.DialogV2?.wait) {
        chosenAttr = await escolherAtributo({
          titulo: "Diversidade (Humano)",
          subtitulo: "Escolha um Atributo diferente do selecionado em Adaptabilidade para receber +1 permanente.",
          valor: 1,
          actor: this,
          atributosExcluidos: attrAdapt ? [attrAdapt] : [],
          motivoExclusao: "Adaptabilidade",
        });
      }

      if (chosenAttr) {
        const cloned = typeof hab.toObject === "function" ? hab.toObject() : foundry.utils.deepClone(hab);
        aplicarEscolhaAtributoNoItem(cloned, chosenAttr, 1, {
          excluirAtributo: attrAdapt,
          excluirMotivo: "Adaptabilidade",
        });
        if (typeof hab.update === "function") {
          await hab.update({
            "system.bonusAtributo": cloned.system.bonusAtributo,
            "system.efeitos": cloned.system.efeitos,
            "flags.mighty-blade": cloned.flags["mighty-blade"],
          });
        } else {
          hab.system = cloned.system;
          hab.flags = cloned.flags;
          this.prepareDerivedData?.();
        }
      }
    }

    // Automação de "Linhagem Dracônica 2": Converte a Resistência da Linhagem Dracônica em Imunidade
    if (nHab === "linhagem draconica 2" || slugHab === "linhagem-draconica-2") {
      const rawItems = Array.isArray(this.items) ? this.items : Array.from(this.items.values());
      const linhagem1 = rawItems.find(
        (i) => norm(i.name) === "linhagem draconica" || i.flags?.["mighty-blade"]?.slug === "linhagem-draconica"
      );
      const resEf = (linhagem1?.system?.efeitos || []).find(
        (e) => e.tipo === "resistencia" && (!e.grau || e.grau === "resistente")
      );
      const elemRes = resEf?.dano || linhagem1?.flags?.["mighty-blade"]?.advancementChoices?.resistencia;
      if (elemRes) {
        const novosEfeitos = [
          ...(hab.system?.efeitos || []).filter((e) => e.tipo !== "imunidade"),
          { tipo: "imunidade", dano: elemRes, grau: "imune" },
        ];
        if (typeof hab.update === "function") {
          await hab.update({
            "system.efeitos": novosEfeitos,
            "flags.mighty-blade.advancementSummary": `Imunidade: ${elemRes.charAt(0).toUpperCase() + elemRes.slice(1)}`,
          });
        } else {
          hab.system = hab.system || {};
          hab.system.efeitos = novosEfeitos;
          hab.flags = hab.flags || {};
          hab.flags["mighty-blade"] = hab.flags["mighty-blade"] || {};
          hab.flags["mighty-blade"].advancementSummary = `Imunidade: ${elemRes.charAt(0).toUpperCase() + elemRes.slice(1)}`;
        }
      }
    }

    // Regra 3.2.2: Adquirir um Pacto revoga automaticamente Dogma e Conhecimento Místico
    if (nHab === "pacto" || nHab.startsWith("pacto ")) {
      const rawItems = Array.isArray(this.items) ? this.items : Array.from(this.items.values());
      const conflitantes = rawItems.filter((i) => {
        if ((i.id || i._id) === (hab.id || hab._id)) return false;
        const n = norm(i.name);
        return n.includes("conhecimento mistico") || n.includes("dogma");
      });
      if (conflitantes.length > 0) {
        const ids = conflitantes.map((i) => i.id || i._id).filter(Boolean);
        const nomes = conflitantes.map((i) => i.name);
        await this.deleteEmbeddedDocuments("Item", ids);
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(
            `Ao firmar "${hab.name}", as habilidades místicas (${nomes.join(", ")}) foram revogadas automaticamente.`
          );
        }
      }
    }

    return true;
  }

  /**
   * Valida o acesso canônico (classe/raça/caminho/organização/Naga) e pré-requisitos de uma magia recém-adicionada.
   * @param {Item} magia
   * @returns {Promise<boolean>}
   */
  async _onMagiaCreated(magia) {
    enriquecerItemComSSOT(magia, "magia");
    const check = validarAcessoMagia(this, magia);
    if (!check.permitido) {
      if (typeof ui !== "undefined" && ui?.notifications?.error) {
        ui.notifications.error(check.motivo);
      }
      await this.deleteEmbeddedDocuments("Item", [magia.id || magia._id]);
      return false;
    }

    if (magia.system?.requisitos) {
      const evalResult = avaliarRequisitos(magia.system.requisitos, this);
      if (!evalResult.atende) {
        const msg = `Pré-requisitos não atendidos para "${magia.name}": ${evalResult.falhas.join(", ")}`;
        if (typeof ui !== "undefined" && ui?.notifications?.error) {
          ui.notifications.error(msg);
        }
        await this.deleteEmbeddedDocuments("Item", [magia.id || magia._id]);
        return false;
      }
    }

    if (typeof ui !== "undefined" && ui?.notifications?.info) {
      ui.notifications.info(`${magia.name} foi adicionada ao Grimório (aba Magias).`);
    }

    return true;
  }

  /**
   * Valida e aplica um Caminho Heroico adicionado ao personagem (via Compêndio ou Drag-and-Drop).
   * Regras canônicas de Mighty Blade 3e:
   * - O personagem deve cumprir todos os pré-requisitos mecânicos (atributos, nível, habilidades).
   * - Se não cumprir, a inclusão é bloqueada/revertida e o usuário é notificado com as pendências.
   * - Um personagem só pode ter 1 Caminho Heroico ativo por vez.
   * @param {Item} caminho
   */
  async _onCaminhoCreated(caminho) {
    const evalResult = validarCaminhoPrestigio(caminho, this);

    if (!evalResult.atende) {
      ui.notifications.error(
        `O herói "${this.name}" não atende aos pré-requisitos para o Caminho "${caminho.name}":\n• ${evalResult.falhas.join("\n• ")}`
      );
      // Remove o item inválido
      await this.deleteEmbeddedDocuments("Item", [caminho.id]);
      if (this.system?.details?.caminho === caminho.name) {
        await this.update({ "system.details.caminho": "" });
      }
      return false;
    }

    // Regra canônica: apenas 1 Caminho Heroico ativo
    const oldCaminhos = this.items.filter((i) => i.type === "caminho" && i.id !== caminho.id);
    if (oldCaminhos.length) {
      await this.deleteEmbeddedDocuments("Item", oldCaminhos.map((i) => i.id));
    }

    if (this.system?.details?.caminho !== caminho.name) {
      await this.update({ "system.details.caminho": caminho.name });
    }
    ui.notifications.info(`Caminho Heroico "${caminho.name}" adotado com sucesso!`);
    return true;
  }

  /**
   * Limpa ou sincroniza a referência do caminho no sistema quando o item for removido.
   * @param {Item} caminho
   */
  async _onCaminhoDeleted(caminho) {
    const remaining = this.items.find((i) => i.type === "caminho" && i.id !== caminho.id);
    await this.update({ "system.details.caminho": remaining ? remaining.name : "" });
  }

  /**
   * Sincroniza e garante apenas 1 Organização ativa por vez.
   * @param {Item} org
   */
  async _onOrganizacaoCreated(org) {
    const oldOrgs = this.items.filter((i) => i.type === "organizacao" && i.id !== org.id);
    if (oldOrgs.length) {
      await this.deleteEmbeddedDocuments("Item", oldOrgs.map((i) => i.id));
    }
    if (this.system?.details?.organizacao !== org.name) {
      await this.update({ "system.details.organizacao": org.name });
    }
    ui.notifications.info(`Organização "${org.name}" associada com sucesso!`);
  }

  /**
   * Limpa ou sincroniza a referência da organização no sistema quando o item for removido.
   * @param {Item} org
   */
  async _onOrganizacaoDeleted(org) {
    const remaining = this.items.find((i) => i.type === "organizacao" && i.id !== org.id);
    await this.update({ "system.details.organizacao": remaining ? remaining.name : "" });
  }

  /* -------------------------------------------- */
  /*  Motor de concessões e Avanço (Advancement)  */
  /* -------------------------------------------- */

  /**
   * Percorre as concessões de um item (raça/classe), pedindo escolhas ao
   * jogador quando necessário, e cria as habilidades resultantes na ficha.
   * @param {Item} item       Raça ou classe de origem.
   * @param {string} sourceKey Flag de vínculo ("sourceRaceId" | "sourceClasseId").
   * @param {object} [opts={}] Opções extras (ex: { presetChoices })
   */
  async _processConcessoes(item, sourceKey, opts = {}) {
    const toCreate = [];

    for (const c of getConcessoes(item)) {
      switch (c.tipo) {
        case "escolhaAtributo": {
          const data = await this._prepareGrantedAbility(c.ref ?? c.uuid, item, sourceKey);
          if (!data) break;
          const attrExcluido = c.excluirDeHabilidade
            ? obterAtributoEscolhidoDeHabilidade(this, c.excluirDeHabilidade)
            : null;
          const attr =
            opts.presetChoices?.atributo ||
            (await escolherAtributo({
              titulo: c.titulo || `${item.name} — ${data.name}`,
              subtitulo: c.descricao || `Escolha 1 Atributo para receber +${c.valor ?? 1} de bônus.`,
              valor: c.valor ?? 1,
              actor: this,
              atributosExcluidos: attrExcluido ? [attrExcluido] : [],
              motivoExclusao: c.excluirDeHabilidade || "Adaptabilidade",
            }));
          if (attr) {
            aplicarEscolhaAtributoNoItem(data, attr, c.valor ?? 1, {
              excluirAtributo: attrExcluido,
              excluirMotivo: c.excluirDeHabilidade,
            });
          } else {
            data.flags = data.flags || {};
            data.flags["mighty-blade"] = data.flags["mighty-blade"] || {};
            data.flags["mighty-blade"].hasAdvancement = true;
            data.flags["mighty-blade"].advancementType = "escolhaAtributo";
          }
          toCreate.push(data);
          break;
        }
        case "origemDraconica": {
          const baseParent = await this._prepareGrantedAbility(c.ref ?? "linhagem-draconica", item, sourceKey);
          const escolhas =
            opts.presetChoices?.linhagemId
              ? opts.presetChoices
              : await escolherOrigemDraconica({
                  titulo: item.name || "Dragano",
                  actor: this,
                });

          if (escolhas) {
            const { parentItem, subFeatureItems } = construirItensOrigemDraconica(escolhas, {
              parentItemData: baseParent,
              raceId: item.id || item._id,
            });
            parentItem.flags["mighty-blade"][sourceKey] = item.id || item._id;
            const [createdParent] = await this.createEmbeddedDocuments("Item", [parentItem]);
            const parentId = createdParent?.id || createdParent?._id;
            for (const sub of subFeatureItems) {
              sub.flags["mighty-blade"][sourceKey] = item.id || item._id;
              if (parentId) sub.flags["mighty-blade"].parentAbilityId = parentId;
            }
            if (subFeatureItems.length) {
              await this.createEmbeddedDocuments("Item", subFeatureItems);
            }
          } else if (baseParent) {
            baseParent.flags = baseParent.flags || {};
            baseParent.flags["mighty-blade"] = baseParent.flags["mighty-blade"] || {};
            baseParent.flags["mighty-blade"].hasAdvancement = true;
            baseParent.flags["mighty-blade"].advancementType = "origemDraconica";
            toCreate.push(baseParent);
          }
          break;
        }
        case "escolhaHabilidade": {
          const opcoes = await resolveOpcoes(c.opcoes ?? []);
          const escolhidas = await escolherHabilidades({
            titulo: item.name,
            opcoes,
            quantidade: c.quantidade ?? 1,
            actor: this,
          });
          for (const uuid of escolhidas ?? []) {
            const data = await this._prepareGrantedAbility(uuid, item, sourceKey);
            if (data) toCreate.push(data);
          }
          break;
        }
        case "habilidade":
        default: {
          const data = await this._prepareGrantedAbility(c.ref ?? c.uuid, item, sourceKey);
          if (data) toCreate.push(data);
          break;
        }
      }
    }

    if (toCreate.length) await this.createEmbeddedDocuments("Item", toCreate);
  }

  /**
   * Reabre o Wizard de Avanço (Advancement) para reconfigurar uma habilidade com escolhas
   * (Adaptabilidade, Diversidade ou Linhagem Dracônica) sem precisar excluir a Raça.
   *
   * @param {string} itemId ID da habilidade ou da raça no ator
   * @param {object|null} [presetChoices=null] Escolhas diretas (para uso em testes ou macros)
   * @returns {Promise<boolean>}
   */
  async reconfigureAdvancement(itemId, presetChoices = null) {
    const rawItems = Array.isArray(this.items) ? this.items : Array.from(this.items.values());
    let targetItem = rawItems.find((i) => (i.id || i._id) === itemId);
    if (!targetItem) return false;

    // Se o usuário clicou em Reconfigurar na própria Raça, redireciona para a habilidade automática vinculada
    // (ou, se a habilidade ainda não tiver sido criada na ficha, processa a concessão diretamente)
    if (targetItem.type === "raca") {
      const linked = rawItems.find(
        (i) =>
          i.type === "habilidade" &&
          !i.flags?.["mighty-blade"]?.isSubFeature &&
          (i.flags?.["mighty-blade"]?.sourceRaceId === (targetItem.id || targetItem._id) ||
            norm(i.name) === "adaptabilidade" ||
            norm(i.name) === "linhagem draconica")
      );
      if (linked) {
        targetItem = linked;
      } else {
        await this._processConcessoes(targetItem, "sourceRaceId", { presetChoices });
        return true;
      }
    }

    const slug = targetItem.flags?.["mighty-blade"]?.slug || "";
    const nName = norm(targetItem.name);
    const advType =
      targetItem.flags?.["mighty-blade"]?.advancementType ||
      (nName === "linhagem draconica" || slug === "linhagem-draconica"
        ? "origemDraconica"
        : nName === "adaptabilidade" || nName === "diversidade" || slug === "adaptabilidade" || slug === "diversidade"
        ? "escolhaAtributo"
        : null);

    if (advType === "escolhaAtributo") {
      const isDiversidade = nName === "diversidade" || slug === "diversidade";
      const attrAdapt = isDiversidade ? obterAtributoEscolhidoDeHabilidade(this, "Adaptabilidade") : null;
      const curAttr =
        targetItem.flags?.["mighty-blade"]?.advancementChoices?.atributo ||
        (targetItem.system?.efeitos || []).find((e) => e.tipo === "bonusAtributo")?.atributo ||
        null;

      const novoAttr =
        presetChoices?.atributo ||
        (await escolherAtributo({
          titulo: `${targetItem.name} — Reconfigurar Avanço`,
          subtitulo: isDiversidade
            ? "Escolha um Atributo diferente do selecionado em Adaptabilidade (+1)."
            : "Escolha o Atributo que receberá +1 de bônus racial.",
          valor: 1,
          actor: this,
          atributosExcluidos: attrAdapt ? [attrAdapt] : [],
          motivoExclusao: "Adaptabilidade",
          atributoInicial: curAttr,
        }));

      if (!novoAttr) return false;

      const cloned = typeof targetItem.toObject === "function" ? targetItem.toObject() : foundry.utils.deepClone(targetItem);
      aplicarEscolhaAtributoNoItem(cloned, novoAttr, 1, {
        excluirAtributo: attrAdapt,
        excluirMotivo: "Adaptabilidade",
      });

      if (typeof targetItem.update === "function") {
        await targetItem.update({
          "system.bonusAtributo": cloned.system.bonusAtributo,
          "system.efeitos": cloned.system.efeitos,
          "flags.mighty-blade": cloned.flags["mighty-blade"],
        });
      } else {
        targetItem.system = cloned.system;
        targetItem.flags = cloned.flags;
        this.prepareDerivedData?.();
      }

      if (typeof ui !== "undefined" && ui?.notifications?.info) {
        ui.notifications.info(`${targetItem.name} atualizada (${cloned.flags["mighty-blade"].advancementSummary}).`);
      }
      return true;
    }

    if (advType === "origemDraconica") {
      const currentChoices = targetItem.flags?.["mighty-blade"]?.advancementChoices || null;
      const escolhas =
        presetChoices?.linhagemId
          ? presetChoices
          : await escolherOrigemDraconica({
              titulo: "Dragano — Origem Dracônica",
              actor: this,
              estadoInicial: currentChoices,
            });

      if (!escolhas) return false;

      const parentId = targetItem.id || targetItem._id;
      const raceDoc = rawItems.find((i) => i.type === "raca");
      const sourceRaceId =
        targetItem.flags?.["mighty-blade"]?.sourceRaceId || raceDoc?.id || raceDoc?._id || null;

      // Remove sub-features antigas vinculadas à Linhagem Dracônica
      const oldSubIds = rawItems
        .filter(
          (i) =>
            i.flags?.["mighty-blade"]?.parentAbilityId === parentId ||
            (i.flags?.["mighty-blade"]?.isSubFeature &&
              i.flags?.["mighty-blade"]?.parentSlug === "linhagem-draconica")
        )
        .map((i) => i.id || i._id)
        .filter(Boolean);

      if (oldSubIds.length) {
        await this.deleteEmbeddedDocuments("Item", oldSubIds);
      }

      const baseObj = typeof targetItem.toObject === "function" ? targetItem.toObject() : foundry.utils.deepClone(targetItem);
      const { parentItem, subFeatureItems } = construirItensOrigemDraconica(escolhas, {
        parentItemData: baseObj,
        raceId: sourceRaceId,
        parentAbilityId: parentId,
      });

      if (typeof targetItem.update === "function") {
        await targetItem.update({
          "system.efeitos": parentItem.system.efeitos,
          "system.description": parentItem.system.description,
          "flags.mighty-blade": parentItem.flags["mighty-blade"],
        });
      } else {
        targetItem.system = parentItem.system;
        targetItem.flags = parentItem.flags;
        this.prepareDerivedData?.();
      }

      if (subFeatureItems.length) {
        await this.createEmbeddedDocuments("Item", subFeatureItems);
      }

      if (typeof ui !== "undefined" && ui?.notifications?.info) {
        ui.notifications.info(
          `Origem Dracônica atualizada (${parentItem.flags["mighty-blade"].advancementSummary}).`
        );
      }
      return true;
    }

    return false;
  }

  /**
   * Carrega uma habilidade por UUID e a prepara para virar item embutido,
   * com a flag de origem que permite removê-la junto da raça/classe.
   * @returns {Promise<object|null>}
   */
  async _prepareGrantedAbility(ref, source, sourceKey) {
    if (!ref) return null;
    const src = await resolveRef(ref);
    if (!src) return null;
    const data = src.toObject();
    data.flags = data.flags ?? {};
    data.flags["mighty-blade"] = data.flags["mighty-blade"] ?? {};
    data.flags["mighty-blade"][sourceKey] = source.id;
    return data;
  }

  /** Remove todos os itens cuja flag de origem aponte para `sourceId`. */
  async _removeConcessoes(sourceKey, sourceId) {
    const ids = this.items
      .filter((i) => i.getFlag("mighty-blade", sourceKey) === sourceId)
      .map((i) => i.id);
    if (ids.length) await this.deleteEmbeddedDocuments("Item", ids);
  }

  /** @override */
  async _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    await super._onUpdateEmbeddedDocuments?.(embeddedName, documents, result, options, userId);
    if (embeddedName !== "Item") return;

    for (const update of result) {
      // O Foundry salva updates com chave textual pontuada: {"system.habilidadeUuid": "..."}
      // então acessamos com colchetes, não com getProperty (que esperaria objeto aninhado)
      const newUuid = update["system.habilidadeUuid"] ?? update.system?.habilidadeUuid;
      if (newUuid === undefined) continue;

      const doc = this.items.get(update._id);
      if (!doc) continue;

      if (doc.type === "raca") {
        // Remove as habilidades antigas vinculadas a esta raça e reaplica.
        await this._removeConcessoes("sourceRaceId", doc.id);
        if (newUuid) await this._onRaceCreated(doc);
      }
      else if (doc.type === "classe") {
        await this._removeConcessoes("sourceClasseId", doc.id);
        if (newUuid) await this._onClassCreated(doc);
      }
    }
  }

  /* -------------------------------------------- */
  /* Métodos de Domínio e Progressão (Clean Code) */
  /* -------------------------------------------- */

  /**
   * Aplica a evolução de nível e o benefício canônico escolhido ao personagem.
   * Regras canônicas de Mighty Blade 3e:
   * - Aprendiz de Classe só pode ser escolhido a partir do nível 2.
   * - É um benefício ÚNICO (não é possível acumular múltiplas classes de aprendiz).
   * - Concede a habilidade automática da classe secundária, sem somar atributos adicionais.
   * @param {object} params
   * @param {object} params
   * @param {number} params.nextLevel Nível alvo da evolução
   * @param {string} params.benefit Tipo de benefício ('aprendiz', 'vida', 'mana', 'misto')
   * @param {string} [params.aprendizClass] Classe escolhida para aprendiz (se benefit === 'aprendiz')
   * @param {object} [params.newAbility] Nova habilidade escolhida para o nível ganho
   * @param {string[]} [params.attributeIncreases] Lista com 2 atributos para incremento nos níveis 4, 7 e 10
   * @returns {Promise<Actor>}
   */
  async applyLevelUp(params = {}) {
    const {
      nextLevel,
      targetLevel: targetLvlOpt,
      benefit,
      evolutionPoint,
      pontoEvolucao,
      aprendizClass,
      newAbility,
      novaHabilidade,
      newAbilities,
      attributeIncreases,
    } = params;

    const curLevel = Number(this.system?.details?.nivel) || 1;
    const targetLevel = nextLevel ?? targetLvlOpt ?? (curLevel + 1);

    // Regra Canônica (Caso 39 / 7.4): Teto de Nível - O nível máximo de evolução padrão é o Nível 10
    if (curLevel >= 10 || targetLevel > 10) {
      const msg =
        "Teto de Nível atingido: O nível máximo de evolução padrão no Mighty Blade 3e é o Nível 10 — Nível máximo alcançado (10).";
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }

    const rawBenefit = benefit ?? evolutionPoint ?? pontoEvolucao;
    const parsedBenefit = normalizarPontoEvolucao(rawBenefit, aprendizClass);

    // Regra Canônica (Caso 38 / 7.3.1): Aprendiz de Classe só a partir do Nível 2
    if (parsedBenefit.tipo === "aprendiz" && targetLevel < 2) {
      const msg = "Aprendiz de Classe bloqueado no Nível 1: Aprendiz de Classe só pode ser adquirido a partir do Nível 2.";
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }

    if (targetLevel <= curLevel) {
      const msg = `Nível alvo (${targetLevel}) deve ser estritamente maior que o nível atual (${curLevel}).`;
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }

    // Regra Canônica (Caso 38 / 7.2): Distribuição do Ponto de Evolução - Exige exatamente 1 dos benefícios
    if (!parsedBenefit.valido) {
      const msg = parsedBenefit.erro;
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }

    // Regra Canônica (7.1.1): Ganho de exatamente 1 nova habilidade por nível
    const abilityInput = newAbility ?? novaHabilidade ?? newAbilities;
    if (Array.isArray(abilityInput) && abilityInput.length > 1) {
      const msg = `Ganho de Habilidade por Nível: O personagem recebe exatamente 1 nova habilidade por nível alcançado (foram informadas ${abilityInput.length}).`;
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }
    const singleNewAbility = Array.isArray(abilityInput) ? abilityInput[0] : abilityInput;

    const updates = { "system.details.nivel": targetLevel };
    let benefitText = "";

    const currentAprendiz = this.system?.details?.aprendiz?.trim();
    const alreadyHasAprendiz = Boolean(currentAprendiz);
    const resolvedAprendizClass = parsedBenefit.tipo === "aprendiz"
      ? (resolverClasseCanonica(parsedBenefit.aprendizClass) || parsedBenefit.aprendizClass)
      : "";

    if (parsedBenefit.tipo === "aprendiz") {
      if (!resolvedAprendizClass) {
        const msg = "Uma classe secundária deve ser informada para o benefício Aprendiz de Classe.";
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(msg);
        }
        throw new Error(msg);
      }
      if (targetLevel < 2) {
        const msg = "Aprendiz de Classe bloqueado no Nível 1: Aprendiz de Classe só pode ser adquirido a partir do Nível 2.";
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(msg);
        }
        throw new Error(msg);
      }
      if (alreadyHasAprendiz) {
        const msg = `O personagem já possui uma classe de Aprendiz (${currentAprendiz}). O herói já é Aprendiz de ${currentAprendiz}. As regras do Mighty Blade não permitem acumular múltiplos aprendizes de classe.`;
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(msg);
        }
        throw new Error(msg);
      }

      const primaryClass = (this.system?.details?.classe || "").trim();
      if (primaryClass && norm(primaryClass) === norm(resolvedAprendizClass)) {
        const msg = `O personagem já pertence à classe principal ${primaryClass} e não pode escolher a mesma classe como Aprendiz.`;
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(msg);
        }
        throw new Error(msg);
      }

      const racaCheck = validarClasseRaca(this, resolvedAprendizClass);
      if (!racaCheck.permitido) {
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(racaCheck.motivo);
        }
        throw new Error(racaCheck.motivo);
      }

      const pactoCheck = validarIncompatibilidadePactoMisticismo(this, { tipo: "aprendiz", nome: resolvedAprendizClass });
      if (!pactoCheck.permitido) {
        if (typeof ui !== "undefined" && ui?.notifications?.warn) {
          ui.notifications.warn(pactoCheck.motivo);
        }
        throw new Error(pactoCheck.motivo);
      }

      updates["system.details.aprendiz"] = resolvedAprendizClass;
      updates["system.details.evolucao"] = `Aprendiz de ${resolvedAprendizClass}`;
      benefitText = `Tornou-se Aprendiz de ${resolvedAprendizClass}`;

      // Concede a habilidade automática da classe secundária (sem atributos adicionais)
      const granted = await this._grantAprendizAbility(resolvedAprendizClass);
      if (granted) {
        benefitText += ` (Habilidade: ${granted.name})`;
      }
    } else if (parsedBenefit.tipo === "caminho") {
      if (parsedBenefit.caminhoNome) {
        updates["system.details.caminho"] = parsedBenefit.caminhoNome;
        updates["system.details.evolucao"] = `Caminho: ${parsedBenefit.caminhoNome}`;
        benefitText = `Ingressou no Caminho ${parsedBenefit.caminhoNome}`;
      } else {
        benefitText = "Caminho Heroico";
      }
    } else if (parsedBenefit.tipo === "vida") {
      const curMax = Number(this.system?.resources?.vida?.baseMax ?? this.system?.resources?.vida?.max) || 60;
      const curVal = Number(this.system?.resources?.vida?.value) || 60;
      updates["system.resources.vida.baseMax"] = curMax + 10;
      updates["system.resources.vida.max"] = curMax + 10;
      updates["system.resources.vida.value"] = curVal + 10;
      benefitText = "+10 PV Máximo";
    } else if (parsedBenefit.tipo === "mana") {
      const curMax = Number(this.system?.resources?.mana?.baseMax ?? this.system?.resources?.mana?.max) || 60;
      const curVal = Number(this.system?.resources?.mana?.value) || 60;
      updates["system.resources.mana.baseMax"] = curMax + 10;
      updates["system.resources.mana.max"] = curMax + 10;
      updates["system.resources.mana.value"] = curVal + 10;
      benefitText = "+10 PM Máximo";
    } else if (parsedBenefit.tipo === "misto") {
      const curVidaMax = Number(this.system?.resources?.vida?.baseMax ?? this.system?.resources?.vida?.max) || 60;
      const curVidaVal = Number(this.system?.resources?.vida?.value) || 60;
      const curManaMax = Number(this.system?.resources?.mana?.baseMax ?? this.system?.resources?.mana?.max) || 60;
      const curManaVal = Number(this.system?.resources?.mana?.value) || 60;
      updates["system.resources.vida.baseMax"] = curVidaMax + 5;
      updates["system.resources.vida.max"] = curVidaMax + 5;
      updates["system.resources.vida.value"] = curVidaVal + 5;
      updates["system.resources.mana.baseMax"] = curManaMax + 5;
      updates["system.resources.mana.max"] = curManaMax + 5;
      updates["system.resources.mana.value"] = curManaVal + 5;
      benefitText = "+5 PV e +5 PM Máximos";
    }

    // Regra Canônica (Caso 5): Aumento de Atributos nos Níveis 4, 7 e 10 (e 16 épico)
    if (NIVEIS_COM_AUMENTO_ATRIBUTO.includes(targetLevel)) {
      if (attributeIncreases) {
        const val = validarAumentoAtributos(targetLevel, attributeIncreases);
        if (!val.valido) {
          if (typeof ui !== "undefined" && ui?.notifications?.warn) {
            ui.notifications.warn(val.erro);
          }
          throw new Error(val.erro);
        }
        const [a1, a2] = attributeIncreases;
        const cur1 = Number(this.system?.attributes?.[a1]?.base) || 0;
        const cur2 = Number(this.system?.attributes?.[a2]?.base) || 0;
        updates[`system.attributes.${a1}.base`] = cur1 + 1;
        updates[`system.attributes.${a2}.base`] = cur2 + 1;
        benefitText += ` | +1 ${a1}, +1 ${a2}`;
      }
    } else if (attributeIncreases && attributeIncreases.length > 0) {
      const msg = `O nível ${targetLevel} não concede aumento de atributos. Níveis permitidos: ${NIVEIS_COM_AUMENTO_ATRIBUTO.join(", ")}.`;
      if (typeof ui !== "undefined" && ui?.notifications?.warn) {
        ui.notifications.warn(msg);
      }
      throw new Error(msg);
    }

    await this.update(updates);

    // Regra Canônica (Caso 37 / 7.1): Se uma nova Habilidade foi indicada para este nível ganho
    if (singleNewAbility) {
      const addedHab = await this.addLevelAbility(singleNewAbility);
      if (addedHab) {
        benefitText += ` | Nova Habilidade: ${addedHab.name}`;
      }
    }

    if (typeof ui !== "undefined" && ui?.notifications?.info) {
      ui.notifications.info(`${this.name} evoluiu para o Nível ${targetLevel}!`);
    }

    // Notificação temática no chat do Foundry
    if (typeof ChatMessage !== "undefined" && ChatMessage?.create) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker ? ChatMessage.getSpeaker({ actor: this }) : { alias: this.name },
        content: `
          <div style="padding: 10px; background: rgba(15, 23, 42, 0.95); border: 1px solid #fbbf24; border-radius: 8px;">
            <h3 style="margin: 0 0 6px 0; color: #fbbf24; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-crown"></i> Evolução Heroica!
            </h3>
            <p style="margin: 0; color: #f1f5f9; font-size: 0.9rem;">
              <strong>${this.name}</strong> alcançou o <strong>Nível ${targetLevel}</strong>!
            </p>
            <p style="margin: 4px 0 0 0; color: #38bdf8; font-size: 0.82rem;">
              <strong>Benefício escolhido:</strong> ${benefitText}
            </p>
          </div>
        `,
      });
    }

    return this;
  }

  /**
   * Adiciona e valida 1 nova habilidade adquirida na subida de nível.
   * Regras canônicas (Caso 37 / 7.1):
   * - 1 nova Habilidade a cada Nível ganho.
   * - Respeita a Raça do herói, Classe do herói (ou Aprendiz) e Habilidades Gerais.
   * - Valida e exige todos os pré-requisitos (atributos, nível, raça, habilidades anteriores).
   * @param {object|string} abilityInput Dados do item de habilidade ou seu nome
   * @returns {Promise<Item>}
   */
  async addLevelAbility(abilityInput) {
    const abilityData =
      typeof abilityInput === "string"
        ? { name: abilityInput.trim(), type: "habilidade", system: {} }
        : abilityInput;

    if (!abilityData || !abilityData.name) {
      throw new Error("Dados da habilidade inválidos.");
    }

    // 1. Não duplica habilidade já possuída
    const rawItems = this.items
      ? (Array.isArray(this.items) ? this.items : Array.from(this.items.values()))
      : [];
    const alreadyHas = rawItems.some(
      (i) => i.name.toLowerCase() === abilityData.name.toLowerCase()
    );
    if (alreadyHas) {
      throw new Error(`O herói já possui a habilidade "${abilityData.name}".`);
    }

    // 2. Valida compatibilidade de Raça e Classe se declaradas no item
    const heroRace = (this.system?.details?.raca || "").toLowerCase();
    const heroClass = (this.system?.details?.classe || "").toLowerCase();
    const heroAprendiz = (this.system?.details?.aprendiz || "").toLowerCase();

    const habRace = (abilityData.system?.raca || abilityData.flags?.["mighty-blade"]?.raca || "").toLowerCase();
    if (habRace && heroRace && habRace !== heroRace) {
      throw new Error(
        `Habilidade racial restrita à raça "${abilityData.system?.raca || abilityData.flags?.["mighty-blade"]?.raca}". O herói é "${this.system?.details?.raca}".`
      );
    }

    const habClass = (abilityData.system?.classe || abilityData.flags?.["mighty-blade"]?.classe || "").toLowerCase();
    if (habClass && heroClass && habClass !== heroClass && habClass !== heroAprendiz) {
      throw new Error(
        `Habilidade de classe restrita à classe "${abilityData.system?.classe || abilityData.flags?.["mighty-blade"]?.classe}". O herói é "${this.system?.details?.classe}".`
      );
    }

    // 3. Avaliação das restrições raciais, de nível de criação e de Pacto (restricoes.mjs)
    const restCheck = validarAquisicaoHabilidade(this, abilityData);
    if (!restCheck.permitido) {
      throw new Error(restCheck.motivo);
    }

    // 4. Avaliação estrita de pré-requisitos via avaliarRequisitos
    const reqStr = abilityData.system?.requisitos || "";
    if (reqStr) {
      const evalResult = avaliarRequisitos(reqStr, this);
      if (!evalResult.atende) {
        throw new Error(
          `Pré-requisitos não atendidos para "${abilityData.name}": ${evalResult.falhas.join(", ")}`
        );
      }
    }

    // 5. Criação do item embutido e revogação se for Pacto
    const [created] = await this.createEmbeddedDocuments("Item", [abilityData]);
    await this._onHabilidadeCreated(created);
    if (typeof ui !== "undefined" && ui?.notifications?.info) {
      ui.notifications.info(`Nova Habilidade adquirida: "${abilityData.name}"!`);
    }
    return created;
  }

  /**
   * Concede a habilidade automática de uma classe secundária para o herói aprendiz,
   * sem somar atributos adicionais ao personagem.
   * @param {string} className Nome da classe (ex.: "Bardo", "Guerreiro")
   * @returns {Promise<Item|null>}
   */
  async _grantAprendizAbility(className) {
    if (!className) return null;
    const resolvedClassName = resolverClasseCanonica(className) || className;

    let abilityData = null;
    let habRef = null;

    // 1. Tenta carregar do compêndio de classes instalado
    const classesPack = game.packs.get("mighty-blade.classes");
    if (classesPack) {
      const index = await classesPack.getIndex({ fields: ["name", "system.concessoes"] });
      const entry = index.find((e) => norm(e.name) === norm(resolvedClassName));
      if (entry) {
        const classDoc = await classesPack.getDocument(entry._id);
        const concessoes = classDoc?.system?.concessoes || [];
        const habConcessao = concessoes.find((c) => c.tipo === "habilidade");
        habRef = habConcessao?.ref ?? habConcessao?.uuid;
      }
    }

    // Fallback: dados canônicos em canonical-packs-data.mjs
    const { CANONICAL_CLASSES, CANONICAL_HABILIDADES } = await import("../data/canonical-packs-data.mjs");
    if (!habRef) {
      const canonicalClass = CANONICAL_CLASSES.find((c) => norm(c.name) === norm(resolvedClassName));
      const concessoes = canonicalClass?.system?.concessoes || [];
      const habConcessao = concessoes.find((c) => c.tipo === "habilidade");
      habRef = habConcessao?.ref ?? habConcessao?.uuid;
    }

    if (habRef) {
      const resolved = await resolveRef(habRef);
      if (resolved) {
        abilityData = resolved.toObject();
      }
    }

    if (!abilityData && habRef) {
      const canonicalHab = CANONICAL_HABILIDADES.find(
        (h) => h.flags?.["mighty-blade"]?.slug === habRef || norm(h.name) === norm(habRef)
      );
      if (canonicalHab) {
        abilityData = foundry.utils.deepClone(canonicalHab);
      }
    }

    if (!abilityData) {
      console.warn(`[Mighty Blade] Habilidade automática não encontrada para a classe ${resolvedClassName}`);
      return null;
    }

    // Não duplica se o herói já possuir a habilidade com esse mesmo nome
    const alreadyHas = this.items.some(
      (i) => i.name.toLowerCase() === abilityData.name.toLowerCase()
    );
    if (alreadyHas) {
      if (typeof ui !== "undefined" && ui?.notifications?.info) {
        ui.notifications.info(`O herói já possui a habilidade "${abilityData.name}".`);
      }
      return this.items.find((i) => i.name.toLowerCase() === abilityData.name.toLowerCase());
    }

    abilityData.flags = abilityData.flags ?? {};
    abilityData.flags["mighty-blade"] = abilityData.flags["mighty-blade"] ?? {};
    abilityData.flags["mighty-blade"].sourceAprendiz = true;
    abilityData.flags["mighty-blade"].sourceAprendizClass = resolvedClassName;

    const [created] = await this.createEmbeddedDocuments("Item", [abilityData]);
    if (typeof ui !== "undefined" && ui?.notifications?.info) {
      ui.notifications.info(`Habilidade automática "${abilityData.name}" adquirida por ser Aprendiz de ${resolvedClassName}!`);
    }
    return created;
  }

  /**
   * Define ou altera a classe secundária de Aprendiz.
   * @param {string} className
   * @returns {Promise<Actor>}
   */
  async setAprendiz(className) {
    if (!className) return this.clearDetail("aprendiz");
    if (this.system?.details?.aprendiz?.toLowerCase() === className.toLowerCase()) {
      return this;
    }

    const racaCheck = validarClasseRaca(this, className);
    if (!racaCheck.permitido) {
      if (typeof ui !== "undefined" && ui?.notifications?.error) {
        ui.notifications.error(racaCheck.motivo);
      }
      throw new Error(racaCheck.motivo);
    }

    const pactoCheck = validarIncompatibilidadePactoMisticismo(this, { tipo: "aprendiz", nome: className });
    if (!pactoCheck.permitido) {
      if (typeof ui !== "undefined" && ui?.notifications?.error) {
        ui.notifications.error(pactoCheck.motivo);
      }
      throw new Error(pactoCheck.motivo);
    }

    // Remove qualquer habilidade de aprendiz anterior para evitar acúmulo
    const oldIds = this.items
      .filter((i) => i.getFlag("mighty-blade", "sourceAprendiz"))
      .map((i) => i.id);
    if (oldIds.length) await this.deleteEmbeddedDocuments("Item", oldIds);

    await this.update({
      "system.details.aprendiz": className,
      "system.details.evolucao": `Aprendiz de ${className}`,
    });
    await this._grantAprendizAbility(className);
    return this;
  }

  /**
   * Define ou altera o Antecedente do personagem.
   * @param {string} antecedenteName
   * @returns {Promise<Actor>}
   */
  async setAntecedente(antecedenteName) {
    return this.update({ "system.details.antecedente": antecedenteName || "" });
  }

  /**
   * Limpa um detalhe e remove documento embutido se for caminho, organizacao ou aprendiz.
   * @param {string} detailKey
   * @returns {Promise<Actor>}
   */
  async clearDetail(detailKey) {
    const updates = {};
    updates[`system.details.${detailKey}`] = "";
    await this.update(updates);

    if (detailKey === "aprendiz") {
      const toDelete = this.items
        .filter((i) => i.getFlag("mighty-blade", "sourceAprendiz"))
        .map((i) => i.id);
      if (toDelete.length) await this.deleteEmbeddedDocuments("Item", toDelete);
    } else if (["caminho", "organizacao"].includes(detailKey)) {
      const embedded = this.items.find((i) => i.type === detailKey);
      if (embedded) await embedded.delete();
    }
    return this;
  }

  /* -------------------------------------------- */
  /*  Danos, Imunidades, Condições e Recursos     */
  /* -------------------------------------------- */

  /**
   * Calcula o dano final após imunidades, resistências e vulnerabilidades.
   * @param {number} dano
   * @param {string} elemento
   * @returns {number}
   */
  calcularDano(dano, elemento) {
    return calcularDano(dano, elemento, this);
  }

  /**
   * Aplica dano elemental aos Pontos de Vida (PV) do personagem.
   * @param {number} dano
   * @param {string} elemento
   * @returns {Promise<{ danoOriginal: number, danoFinal: number, elemento: string, vidaRestante: number }>}
   */
  async aplicarDano(dano, elemento) {
    const res = aplicarDano(this, dano, elemento);
    await this.update({ "system.resources.vida.value": res.vidaRestante });
    return res;
  }

  /**
   * Consome ou perde Mana (PM). Ao chegar a 0 PM, o personagem fica Exausto (Inapto).
   * Perdas adicionais ou excedentes são descontadas diretamente de PV.
   * @param {number} quantidade
   * @returns {Promise<{ manaGasta: number, danoEmVida: number, manaRestante: number, vidaRestante: number, exausto: boolean }>}
   */
  async consumirMana(quantidade) {
    const res = consumirMana(this, quantidade);
    await this.update({
      "system.resources.mana.value": res.manaRestante,
      "system.resources.vida.value": res.vidaRestante,
      "system.details.condicao": this.system?.details?.condicao || "",
    });
    return res;
  }

  /**
   * Verifica se o personagem possui determinada condição ativa.
   * @param {string} condicao
   * @returns {boolean}
   */
  temCondicao(condicao) {
    return temCondicao(this, condicao);
  }

  /**
   * Verifica se o personagem está Exausto.
   * @returns {boolean}
   */
  isExausto() {
    return temCondicao(this, "exausto");
  }

  /**
   * Verifica se o personagem está Inapto para testes (Exausto, 0 PM, armadura pesada, ou condição Inapto).
   * @returns {boolean}
   */
  isInapto() {
    return isActorInapto(this);
  }

  /**
   * Atualiza o estado de saúde do personagem (Saudável, Por um Fio, Morto).
   */
  async atualizarEstadoSaude(deltaPV, opcoes = {}) {
    const res = atualizarEstadoSaude(this, deltaPV, opcoes);
    await this.update({
      "system.resources.vida.value": res.vidaAtual,
      "system.details.estadoSaude": res.novoEstado,
      "system.details.condicao": this.system?.details?.condicao || "",
    });
    return res;
  }

  /**
   * Aplica uma condição ao personagem.
   */
  async aplicarCondicao(condicaoNome, opcoes = {}) {
    const res = aplicarCondicao(this, condicaoNome, opcoes);
    await this.update({
      "system.details.condicao": this.system?.details?.condicao || "",
      "system.details.aflicoes": this.system?.details?.aflicoes || [],
    });
    return res;
  }

  /**
   * Remove uma condição do personagem.
   */
  async removerCondicao(condicaoNome) {
    const res = removerCondicao(this, condicaoNome);
    await this.update({
      "system.details.condicao": this.system?.details?.condicao || "",
      "system.details.aflicoes": this.system?.details?.aflicoes || [],
    });
    return res;
  }

  obterEstadoSaude() {
    return obterEstadoSaude(this);
  }

  definirEstadoSaude(novoEstado) {
    return definirEstadoSaude(this, novoEstado);
  }

  falharTesteSobrevivencia() {
    return falharTesteSobrevivencia(this);
  }

  passarTesteSobrevivencia() {
    return passarTesteSobrevivencia(this);
  }

  podeRealizarAcoes() {
    return podeRealizarAcoes(this);
  }

  podeRealizarReacoes() {
    return podeRealizarReacoes(this);
  }

  isMorto() {
    return isMorto(this);
  }

  isPorUmFio() {
    return isPorUmFio(this);
  }

  isSaudavel() {
    return isSaudavel(this);
  }

  isAtaqueInapto(opcoes = {}) {
    return isAtaqueInapto(this, opcoes);
  }

  isPercepcaoVisualInapta() {
    return isPercepcaoVisualInapta(this);
  }

  obterPenalidadeDefesa(tipo = "todas") {
    return obterPenalidadeDefesa(this, tipo);
  }

  obterPenalidadeTestes(contexto = {}) {
    return obterPenalidadeTestes(this, contexto);
  }

  podeAproximarFonteMedo(fonte = null) {
    return podeAproximarFonteMedo(this, fonte);
  }

  obterFonteMedo() {
    return obterFonteMedo(this);
  }
}

