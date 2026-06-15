export default class MightyBladeCharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const { SchemaField, NumberField, StringField } = foundry.data.fields;

    // Atalho para campos de número inteiro não-nulo
    const int = (initial = 0, min = 0) => ({
      required: true, nullable: false, integer: true, initial, min,
    });

    return {

      // -----------------------------------------------------------------------
      // Atributos — só o valor "base" é salvo; "value" é calculado em runtime
      // -----------------------------------------------------------------------
      attributes: new SchemaField({
        forca:        new SchemaField({ base: new NumberField(int()) }),
        agilidade:    new SchemaField({ base: new NumberField(int()) }),
        inteligencia: new SchemaField({ base: new NumberField(int()) }),
        vontade:      new SchemaField({ base: new NumberField(int()) }),
      }),

      // -----------------------------------------------------------------------
      // Recursos (PV e PM) — valor inicial 60 conforme regras do MB
      // -----------------------------------------------------------------------
      resources: new SchemaField({
        vida: new SchemaField({
          value: new NumberField(int(60)),
          max:   new NumberField(int(60)),
        }),
        mana: new SchemaField({
          value: new NumberField(int(60)),
          max:   new NumberField(int(60)),
        }),
      }),

      // -----------------------------------------------------------------------
      // Detalhes do personagem (texto e números editáveis diretamente)
      // -----------------------------------------------------------------------
      details: new SchemaField({
        nivel:       new NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 1 }),
        experiencia: new NumberField(int(0)),
        aprendiz:    new StringField({ initial: "" }),
        caminho:     new StringField({ initial: "" }),
        organizacao: new StringField({ initial: "" }),
        antecedente: new StringField({ initial: "" }),
        evolucao:    new StringField({ initial: "", blank: true }),
        idiomas:     new StringField({ initial: "", blank: true }),
        motivacao:   new StringField({ initial: "", blank: true }),
        condicao:    new StringField({ initial: "", blank: true }),
        dinheiro:    new NumberField({ required: true, nullable: false, initial: 0, min: 0 }),
      }),

      biography: new StringField({ initial: "", blank: true }),
    };
  }

  // ---------------------------------------------------------------------------
  // prepareDerivedData — roda toda vez que o ator é carregado ou atualizado.
  // Aqui calculamos tudo que NÃO é digitado diretamente pelo usuário.
  // ---------------------------------------------------------------------------
  prepareDerivedData() {
    this._prepareAttributes();
    this._prepareDefesas();
    this._prepareSubattributes();
  }

  // Calcula o valor final de cada atributo: base + bônus da raça + bônus da classe
  _prepareAttributes() {
    const race   = this.parent?.items?.find(i => i.type === "raca");
    const classe = this.parent?.items?.find(i => i.type === "classe");
    const raceAttrs   = race?.system?.atributos   ?? {};
    const classeAttrs = classe?.system?.atributos ?? {};

    for (const key of ["forca", "agilidade", "inteligencia", "vontade"]) {
      this.attributes[key].value =
        (this.attributes[key].base   ?? 0) +
        (Number(raceAttrs[key])   || 0) +
        (Number(classeAttrs[key]) || 0);
    }
  }

  // Bloqueio = 5 + Força | Esquiva = 5 + Agilidade | Determinação = 8 + Vontade
  _prepareDefesas() {
    this.defesas = {
      bloqueio:     { value: 5 + this.attributes.forca.value },
      esquiva:      { value: 5 + this.attributes.agilidade.value },
      determinacao: { value: 8 + this.attributes.vontade.value },
    };
  }

  // Iniciativa, Deslocamento, Corrida e Carga
  _prepareSubattributes() {
    const forca    = this.attributes.forca.value;
    const agilidade = this.attributes.agilidade.value;

    // Deslocamento base 6m; Fauno com "Patas com Cascos" ganha +1m
    let deslocamento = 6;
    if (this.parent?.items?.find(i => i.name === "Patas com Cascos")) deslocamento += 1;

    // Carga atual = soma do peso de todos os itens no inventário
    let cargaAtual = 0;
    for (const item of this.parent?.items ?? []) {
      cargaAtual += (Number(item.system?.peso) || 0) * (Number(item.system?.quantidade) || 1);
    }

    // Carga máxima: Força × 10 (básica) e Força × 20 (absoluta)
    // Anão com "Coração da Montanha" conta como se tivesse Força +2 para carga
    let forcaCarga = forca;
    if (this.parent?.items?.find(i => i.name === "Coração da Montanha")) forcaCarga += 2;

    this.subattributes = {
      iniciativa:   { value: agilidade },
      deslocamento: { value: deslocamento },
      corrida:      { value: deslocamento * 4 },
      carga: {
        value:       parseFloat(cargaAtual.toFixed(2)),
        max:         forcaCarga * 10,
        maxAbsoluto: forcaCarga * 20,
      },
    };
  }
}
