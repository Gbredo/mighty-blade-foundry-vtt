import { MIGHTY_BLADE } from "../helpers/config.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MightyBladeActor extends Actor {
  // <--- O NOME OBRIGATÓRIO É ESSE

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data.
   */
  prepareDerivedData() {
    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags["mighty-blade"] || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    // Make modifications to data here. For example:
    const system = actorData.system;

    // -------------------------------------------------------
    // 1. Calcular Atributos Finais (Base + Bônus + Raça)
    // -------------------------------------------------------

    // Verificar se existe uma Raça
    const race = this.items.find((i) => i.type === "raca");
    const raceAttrs = race
      ? race.system.atributos
      : { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 };

    // Calcular valor final: Base (Pontos Gastos) + Raça
    // Usamos atribuição direta para garantir que os valores sejam números
    system.attributes.forca.value =
      (Number(system.attributes.forca.base) || 0) +
      (Number(raceAttrs.forca) || 0);
    system.attributes.agilidade.value =
      (Number(system.attributes.agilidade.base) || 0) +
      (Number(raceAttrs.agilidade) || 0);
    system.attributes.inteligencia.value =
      (Number(system.attributes.inteligencia.base) || 0) +
      (Number(raceAttrs.inteligencia) || 0);
    system.attributes.vontade.value =
      (Number(system.attributes.vontade.base) || 0) +
      (Number(raceAttrs.vontade) || 0);

    // -------------------------------------------------------
    // 2. Calcular Defesas Derivadas
    // -------------------------------------------------------

    // Calcular BLOQUEIO
    system.defesas.bloqueio.value = 5 + system.attributes.forca.value;

    // Calcular ESQUIVA
    system.defesas.esquiva.value = 5 + system.attributes.agilidade.value;

    // Calcular DETERMINAÇÃO
    const maiorMental = Math.max(
      system.attributes.inteligencia.value,
      system.attributes.vontade.value
    );
    system.defesas.determinacao.value = 8 + maiorMental;

    // -------------------------------------------------------
    // 3. Calcular Sub-atributos (Carga, Deslocamento, etc)
    // -------------------------------------------------------

    // Carga
    let totalWeight = 0;
    for (let item of this.items) {
      // Check if item has weight and quantity
      const weight = Number(item.system.peso) || 0;
      const qty = Number(item.system.quantidade) || 1;
      totalWeight += weight * qty;
    }
    system.subattributes.carga.value = parseFloat(totalWeight.toFixed(2));

    // Max Load Calculation
    // Regra Padrão: Força x 3 (assumindo kg)
    // Verificar bônus de Raça (Ex: Anão - Coração da Montanha)
    let loadStrength = system.attributes.forca.value;
    const heartOfTheMountain = this.items.find(
      (i) => i.name === "Coração da Montanha"
    );
    if (heartOfTheMountain) {
      loadStrength += 2;
    }
    system.subattributes.carga.max = loadStrength * 3;

    // Deslocamento
    let movement = 6; // Base 6m
    // Verificar bônus de Raça (Ex: Fauno - Patas com Cascos)
    const hooves = this.items.find((i) => i.name === "Patas com Cascos");
    if (hooves) {
      movement += 1;
    }
    system.subattributes.deslocamento.value = movement;

    // Corrida
    // Regra Padrão: Deslocamento x 4
    system.subattributes.corrida.value = movement * 4;

    // Iniciativa
    // Regra Padrão: Igual à Agilidade (o teste é Agilidade + 1d6 ou 2d6 dependendo da regra)
    system.subattributes.iniciativa.value = system.attributes.agilidade.value;
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;
    // Make modifications to data here.
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

    // Check if a Race was created
    const race = documents.find((d) => d.type === "raca");
    if (race) {
      await this._onRaceCreated(race);
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
    await super._onDeleteEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    if (embeddedName !== "Item") return;

    // Check if a Race was deleted
    const race = documents.find((d) => d.type === "raca");
    if (race) {
      await this._onRaceDeleted(race);
    }
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
    // 1. Find and delete the linked Ability
    const ability = this.items.find(
      (i) => i.getFlag("mighty-blade", "sourceRaceId") === race.id
    );

    if (ability) {
      await ability.delete();
      ui.notifications.info(`Habilidade racial ${ability.name} removida.`);
    }
  }
}
