import { MIGHTY_BLADE } from "../helpers/config.mjs";

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
    // Iniciativa = 2d6 + menor entre Agilidade e Inteligência.
    data.init = Math.min(agi, int);
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
   * Handle logic when a Race item is added to the actor
   * @param {Item} race The race item created
   */
  async _onRaceCreated(race) {
    // 1. Try to find a linked Ability via UUID (New System)
    const abilityUuid = race.system.habilidadeUuid;
    if (abilityUuid) {
      const sourceAbility = await fromUuid(abilityUuid);
      if (sourceAbility) {
        const abilityData = sourceAbility.toObject();

        // Prepare flags to link back to the race
        abilityData.flags = abilityData.flags || {};
        abilityData.flags["mighty-blade"] =
          abilityData.flags["mighty-blade"] || {};
        abilityData.flags["mighty-blade"].sourceRaceId = race.id;

        // Optional: Update requirements to show origin
        // abilityData.system.requisitos = `Raça: ${race.name}`;

        await this.createEmbeddedDocuments("Item", [abilityData]);
        ui.notifications.info(
          `Raça ${race.name} aplicada! Habilidade ${abilityData.name} adicionada.`
        );
        return;
      }
    }

    // 2. Fallback: Create from embedded text data (Old System)
    if (
      race.system.habilidadeAutomatica &&
      race.system.habilidadeAutomatica.nome
    ) {
      const abilityData = {
        name: race.system.habilidadeAutomatica.nome,
        type: "habilidade",
        img: race.img,
        system: {
          description: race.system.habilidadeAutomatica.descricao,
          tipo: race.system.habilidadeAutomatica.tipo || "suporte",
          categoria:
            race.system.habilidadeAutomatica.categoria || "caracteristica",
          custo: race.system.habilidadeAutomatica.custo || 0,
          requisitos: `Raça: ${race.name}`,
        },
        flags: {
          "mighty-blade": {
            sourceRaceId: race.id, // Link to the race item
          },
        },
      };

      // Create the item
      await this.createEmbeddedDocuments("Item", [abilityData]);

      // Notify user
      ui.notifications.info(
        `Raça ${race.name} aplicada! Habilidade ${abilityData.name} adicionada (Legado).`
      );
    }
  }

  /**
   * Handle logic when a Race item is removed from the actor
   * @param {Item} race The race item deleted
   */
  async _onRaceDeleted(race) {
    const ability = this.items.find(
      (i) => i.getFlag("mighty-blade", "sourceRaceId") === race.id
    );
    if (ability) {
      await ability.delete();
      ui.notifications.info(`Habilidade racial ${ability.name} removida.`);
    }
  }

  async _onClassCreated(classe) {
    const abilityUuid = classe.system.habilidadeUuid;
    if (!abilityUuid) return;

    const sourceAbility = await fromUuid(abilityUuid);
    if (!sourceAbility) return;

    const abilityData = sourceAbility.toObject();
    abilityData.flags = abilityData.flags || {};
    abilityData.flags["mighty-blade"] = abilityData.flags["mighty-blade"] || {};
    abilityData.flags["mighty-blade"].sourceClasseId = classe.id;

    await this.createEmbeddedDocuments("Item", [abilityData]);
    ui.notifications.info(`Classe ${classe.name} aplicada! Habilidade ${abilityData.name} adicionada.`);
  }

  async _onClassDeleted(classe) {
    const ability = this.items.find(
      (i) => i.getFlag("mighty-blade", "sourceClasseId") === classe.id
    );
    if (ability) {
      await ability.delete();
      ui.notifications.info(`Habilidade de classe ${ability.name} removida.`);
    }
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
        // Remove habilidade antiga vinculada a esta raça, se existir
        const old = this.items.find(i => i.getFlag("mighty-blade", "sourceRaceId") === doc.id);
        if (old) await old.delete();
        // Adiciona a nova habilidade se o UUID foi preenchido
        if (newUuid) await this._onRaceCreated(doc);
      }
      else if (doc.type === "classe") {
        const old = this.items.find(i => i.getFlag("mighty-blade", "sourceClasseId") === doc.id);
        if (old) await old.delete();
        if (newUuid) await this._onClassCreated(doc);
      }
    }
  }
}
