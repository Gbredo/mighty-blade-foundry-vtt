import { MIGHTY_BLADE } from "../helpers/config.mjs";
import {
  getConcessoes,
  escolherAtributo,
  escolherHabilidades,
  resolveOpcoes,
  resolveRef,
} from "../helpers/concessoes.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MightyBladeActor extends Actor {

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
  async _onCreateEmbeddedDocuments(
    embeddedName,
    documents,
    result,
    options,
    userId
  ) {
    await super._onCreateEmbeddedDocuments(
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
  }

  /** @override */
  async _onDeleteEmbeddedDocuments(
    embeddedName,
    documents,
    result,
    options,
    userId
  ) {
    await super._onDeleteEmbeddedDocuments(
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
  }

  /**
   * Aplica as concessões de uma raça quando ela é adicionada à ficha.
   * @param {Item} race
   */
  async _onRaceCreated(race) {
    const concessoes = getConcessoes(race);
    if (concessoes.length) {
      await this._processConcessoes(race, "sourceRaceId");
      ui.notifications.info(`Raça ${race.name} aplicada.`);
      return;
    }

    // Fallback legado: habilidade automática embutida como texto (sem UUID).
    const auto = race.system.habilidadeAutomatica;
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
      ui.notifications.info(`Raça ${race.name} aplicada (Legado).`);
    }
  }

  /** Remove todas as habilidades concedidas por uma raça quando ela é removida. */
  async _onRaceDeleted(race) {
    await this._removeConcessoes("sourceRaceId", race.id);
  }

  /**
   * Aplica as concessões de uma classe quando ela é adicionada à ficha.
   * @param {Item} classe
   */
  async _onClassCreated(classe) {
    if (!getConcessoes(classe).length) return;
    await this._processConcessoes(classe, "sourceClasseId");
    ui.notifications.info(`Classe ${classe.name} aplicada.`);
  }

  /** Remove todas as habilidades concedidas por uma classe quando ela é removida. */
  async _onClassDeleted(classe) {
    await this._removeConcessoes("sourceClasseId", classe.id);
  }

  /* -------------------------------------------- */
  /*  Motor de concessões                         */
  /* -------------------------------------------- */

  /**
   * Percorre as concessões de um item (raça/classe), pedindo escolhas ao
   * jogador quando necessário, e cria as habilidades resultantes na ficha.
   * @param {Item} item       Raça ou classe de origem.
   * @param {string} sourceKey Flag de vínculo ("sourceRaceId" | "sourceClasseId").
   */
  async _processConcessoes(item, sourceKey) {
    const toCreate = [];

    for (const c of getConcessoes(item)) {
      switch (c.tipo) {
        case "escolhaAtributo": {
          const data = await this._prepareGrantedAbility(c.ref ?? c.uuid, item, sourceKey);
          if (!data) break;
          const attr = await escolherAtributo({ titulo: item.name, valor: c.valor ?? 1 });
          if (attr) {
            data.system = data.system || {};
            data.system.efeitos = [{ tipo: "bonusAtributo", atributo: attr, valor: c.valor ?? 1 }];
          }
          toCreate.push(data);
          break;
        }
        case "escolhaHabilidade": {
          const opcoes = await resolveOpcoes(c.opcoes ?? []);
          const escolhidas = await escolherHabilidades({
            titulo: item.name,
            opcoes,
            quantidade: c.quantidade ?? 1,
            actor: this
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
    await super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
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
}
