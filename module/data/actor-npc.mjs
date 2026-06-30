export default class MightyBladeNpcData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const { SchemaField, NumberField, StringField } = foundry.data.fields;
    const int    = (initial = 0, min = 0) => ({ required: true, nullable: false, integer: true, initial, min });
    const signed = (initial = 0)          => ({ required: true, nullable: false, integer: true, initial });

    return {
      // Atributos do NPC: valor direto (sem raça/classe).
      attributes: new SchemaField({
        forca:        new SchemaField({ value: new NumberField(int()) }),
        agilidade:    new SchemaField({ value: new NumberField(int()) }),
        inteligencia: new SchemaField({ value: new NumberField(int()) }),
        vontade:      new SchemaField({ value: new NumberField(int()) }),
      }),

      // PV/PM nos MESMOS caminhos do personagem (as barras de token apontam pra cá).
      resources: new SchemaField({
        vida: new SchemaField({ value: new NumberField(int(10)), max: new NumberField(int(10)) }),
        mana: new SchemaField({ value: new NumberField(int(0)),  max: new NumberField(int(0)) }),
      }),

      details: new SchemaField({
        tipo:      new StringField({ initial: "", blank: true }), // ex.: Fera, Humanoide, Morto-vivo
        nivel:     new NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 0 }),
        descricao: new StringField({ initial: "", blank: true }),
      }),

      // Ajustes manuais de defesa (stat blocks de monstros podem ter bônus/penalidade).
      defesasBonus: new SchemaField({
        bloqueio:     new NumberField(signed()),
        esquiva:      new NumberField(signed()),
        determinacao: new NumberField(signed()),
      }),

      afinidades: new SchemaField({
        resistencias:     new StringField({ initial: "", blank: true }),
        vulnerabilidades: new StringField({ initial: "", blank: true }),
        imunidades:       new StringField({ initial: "", blank: true }),
      }),

      aflicoes: new SchemaField({
        doencas:      new StringField({ initial: "", blank: true }),
        maldicoes:    new StringField({ initial: "", blank: true }),
        sangramentos: new StringField({ initial: "", blank: true }),
        venenos:      new StringField({ initial: "", blank: true }),
      }),

      biography: new StringField({ initial: "", blank: true }),
    };
  }

  prepareDerivedData() {
    const a = this.attributes;
    const b = this.defesasBonus;

    this.defesas = {
      bloqueio:     { value: 5 + a.forca.value     + b.bloqueio },
      esquiva:      { value: 5 + a.agilidade.value + b.esquiva },
      determinacao: { value: 8 + a.vontade.value   + b.determinacao },
    };

    this.subattributes = {
      iniciativa:   { value: Math.min(a.agilidade.value, a.inteligencia.value) },
      deslocamento: { value: Math.floor(a.agilidade.value / 2) + 4 },
    };
  }
}
