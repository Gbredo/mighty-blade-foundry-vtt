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
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;
    // Make modifications to data here.
  }
}
