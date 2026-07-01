export default class MightyBladeCharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField } = foundry.data.fields;

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
        nivel:       new NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 0 }),
        experiencia: new NumberField(int(0)),
        aprendiz:    new StringField({ initial: "" }),
        caminho:     new StringField({ initial: "" }),
        organizacao: new StringField({ initial: "" }),
        antecedente: new StringField({ initial: "" }),
        evolucao:    new StringField({ initial: "", blank: true }),
        idiomas:     new StringField({ initial: "", blank: true }),
        motivacao:   new StringField({ initial: "", blank: true }),
        condicao:    new StringField({ initial: "", blank: true }),
        idade:       new StringField({ initial: "", blank: true }),
        dinheiro:    new NumberField({ required: true, nullable: false, initial: 0, min: 0 }),
        aflicoes:    new ArrayField(new SchemaField({
          id:      new StringField({ required: true }),
          nome:    new StringField({ initial: "" }),
          efeito:  new StringField({ initial: "" }),
          duracao: new StringField({ initial: "" })
        })),
      }),

      biography: new StringField({ initial: "", blank: true }),
    };
  }

  // ---------------------------------------------------------------------------
  // prepareDerivedData — roda toda vez que o ator é carregado ou atualizado.
  // Aqui calculamos tudo que NÃO é digitado diretamente pelo usuário.
  // ---------------------------------------------------------------------------
  prepareDerivedData() {
    this._prepareEfeitos();
    this._prepareAttributes();
    this._prepareEquipamento();
    this._prepareDefesas();
    this._prepareSubattributes();
  }

  // ---------------------------------------------------------------------------
  // Coleta os efeitos declarativos (system.efeitos[]) de todas as habilidades/
  // itens. Vocabulário compartilhado com o gerador de fichas. Auto-aplicados:
  // bonusAtributo, bonusDefesa, bonusDeslocamento, cargaComoForca. Os demais
  // tipos ficam reservados (armazenados/exibidos, não aplicados).
  // ---------------------------------------------------------------------------
  _prepareEfeitos() {
    const acc = {
      atributo: { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 },
      defesa:   { bloqueio: 0, esquiva: 0, determinacao: 0 },
      deslocamento: 0,
      cargaForca: 0,
    };

    for (const item of this.parent?.items ?? []) {
      for (const ef of this._normalizeEfeitos(item)) {
        switch (ef.tipo) {
          case "bonusAtributo":
            if (acc.atributo[ef.atributo] !== undefined) acc.atributo[ef.atributo] += Number(ef.valor) || 0;
            break;
          case "bonusDefesa":
            if (acc.defesa[ef.defesa] !== undefined) acc.defesa[ef.defesa] += Number(ef.valor) || 0;
            break;
          case "bonusDeslocamento":
            acc.deslocamento += Number(ef.valor) || 0;
            break;
          case "cargaComoForca":
            acc.cargaForca += Number(ef.valor) || 0;
            break;
          // outros tipos (reduzCustoMana, reducaoDano, resistencia…) são reservados.
        }
      }
    }

    this._efeitos = acc;
  }

  // Retorna os efeitos de um item: prioriza system.efeitos[]; cai no campo
  // legado system.bonusAtributo se o array não existir.
  _normalizeEfeitos(item) {
    const list = item.system?.efeitos;
    if (Array.isArray(list) && list.length) return list;
    const b = item.system?.bonusAtributo;
    if (b?.atributo) return [{ tipo: "bonusAtributo", atributo: b.atributo, valor: b.valor }];
    return [];
  }

  // Calcula o valor final de cada atributo: base + bônus da raça + bônus da classe
  _prepareAttributes() {
    const race   = this.parent?.items?.find(i => i.type === "raca");
    const classe = this.parent?.items?.find(i => i.type === "classe");
    const raceAttrs   = race?.system?.atributos   ?? {};
    const classeAttrs = classe?.system?.atributos ?? {};
    const bonus = this._efeitos?.atributo ?? { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 };

    for (const key of ["forca", "agilidade", "inteligencia", "vontade"]) {
      this.attributes[key].value =
        (this.attributes[key].base   ?? 0) +
        (Number(raceAttrs[key])   || 0) +
        (Number(classeAttrs[key]) || 0) +
        (bonus[key] ?? 0);
    }
  }

  // -------------------------------------------------------------------------
  // Equipamento equipado: bônus de defesa (armadura/escudo), mãos e Inaptidão.
  // Regra: bônus de mesmo tipo NÃO acumulam — vale só o maior. Armadura soma em
  // Bloqueio e Esquiva; escudo só no Bloqueio (e perde o bônus se FN > Força).
  // Armadura com FN > Força não perde bônus, mas deixa o personagem Inapto.
  // -------------------------------------------------------------------------
  _prepareEquipamento() {
    const forca = this.attributes.forca.value;
    let bonusArmadura = 0;
    let bonusEscudo = 0;
    let maosOcupadas = 0;
    let temCanalizador = false;
    let inaptoArmadura = false;
    let pesadaEquipada = false;

    for (const item of this.parent?.items ?? []) {
      const s = item.system ?? {};
      if (!s.equipado) continue;

      if (item.type === "armadura") {
        const fn = Number(s.fn) || 0;
        const defesa = Number(s.defesa) || 0;
        if ((s.subtipo ?? "armadura") === "escudo") {
          maosOcupadas += 1;
          if (fn <= forca) bonusEscudo = Math.max(bonusEscudo, defesa);
        } else {
          bonusArmadura = Math.max(bonusArmadura, defesa);
          if (fn > forca) inaptoArmadura = true;
          if (s.pesada || s.rigida) pesadaEquipada = true;
        }
      } else if (item.type === "arma") {
        const props = Array.isArray(s.propriedades) ? s.propriedades : [];
        if (props.includes("DuasMaos")) maosOcupadas += 2;
        else maosOcupadas += 1;
        
        if (props.includes("Canalizador") || s.canalizador) temCanalizador = true;
      } else if (item.type === "equipamento") {
        const props = Array.isArray(s.propriedades) ? s.propriedades : [];
        if (props.includes("Canalizador") || s.canalizador) temCanalizador = true;
      }
    }

    this.equipamento = {
      bonusArmadura,
      bonusEscudo,
      maosOcupadas,
      maosLivres: Math.max(0, 2 - maosOcupadas),
      temCanalizador,
      inaptoArmadura,
      pesadaEquipada,
    };
  }

  // Bloqueio = 5 + Força + Armadura + Escudo | Esquiva = 5 + Agilidade + Armadura
  // Determinação = 8 + MAX(Inteligência, Vontade)
  _prepareDefesas() {
    const eq = this.equipamento ?? { bonusArmadura: 0, bonusEscudo: 0 };
    const ef = this._efeitos?.defesa ?? { bloqueio: 0, esquiva: 0, determinacao: 0 };
    const forca = this.attributes.forca.value;
    const agilidade = this.attributes.agilidade.value;
    const inteligencia = this.attributes.inteligencia.value;
    const vontade = this.attributes.vontade.value;

    const baseDeterminacao = Math.max(inteligencia, vontade);
    const baseDeterminacaoNome = inteligencia > vontade ? "Inteligência" : "Vontade";

    const eqTextBloq = (eq.bonusArmadura + eq.bonusEscudo) > 0 ? ` + <span title="Armadura/Escudo" style="text-decoration: underline dotted; cursor: help;">${eq.bonusArmadura + eq.bonusEscudo}</span>` : "";
    const efTextBloq = ef.bloqueio > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${ef.bloqueio}</span>` : "";
    const formulaBloq = `5 + <span title="Força" style="text-decoration: underline dotted; cursor: help;">${forca}</span>${eqTextBloq}${efTextBloq}`;

    const eqTextEsq = eq.bonusArmadura > 0 ? ` + <span title="Armadura" style="text-decoration: underline dotted; cursor: help;">${eq.bonusArmadura}</span>` : "";
    const efTextEsq = ef.esquiva > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${ef.esquiva}</span>` : "";
    const formulaEsq = `5 + <span title="Agilidade" style="text-decoration: underline dotted; cursor: help;">${agilidade}</span>${eqTextEsq}${efTextEsq}`;

    const efTextDet = ef.determinacao > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${ef.determinacao}</span>` : "";
    const formulaDet = `8 + <span title="${baseDeterminacaoNome}" style="text-decoration: underline dotted; cursor: help;">${baseDeterminacao}</span>${efTextDet}`;

    this.defesas = {
      bloqueio:     { value: 5 + forca + eq.bonusArmadura + eq.bonusEscudo + ef.bloqueio, baseValor: forca, baseName: "Força", formulaVisual: formulaBloq },
      esquiva:      { value: 5 + agilidade + eq.bonusArmadura + ef.esquiva, baseValor: agilidade, baseName: "Agilidade", formulaVisual: formulaEsq },
      determinacao: { value: 8 + baseDeterminacao + ef.determinacao, baseValor: baseDeterminacao, baseName: baseDeterminacaoNome, formulaVisual: formulaDet },
    };
  }

  // Iniciativa, Deslocamento, Corrida e Carga
  _prepareSubattributes() {
    const forca        = this.attributes.forca.value;
    const agilidade    = this.attributes.agilidade.value;
    const inteligencia = this.attributes.inteligencia.value;

    // Deslocamento = floor(Agilidade / 2) + 4, mais efeitos (bonusDeslocamento).
    // Fallback legado por nome: Fauno ("Patas com Cascos") / Tailox ("Pernas Vulpinas").
    let deslocamento = Math.floor(agilidade / 2) + 4 + (this._efeitos?.deslocamento ?? 0);
    const items = this.parent?.items;
    let bonusItemsDesl = 0;
    if (items?.find(i => i.name === "Patas com Cascos")) { deslocamento += 1; bonusItemsDesl += 1; }
    if (items?.find(i => i.name === "Pernas Vulpinas")) { deslocamento += 1; bonusItemsDesl += 1; }

    const totalBonusDesl = (this._efeitos?.deslocamento ?? 0) + bonusItemsDesl;
    const efTextDesl = totalBonusDesl > 0 ? ` + <span title="Bônus/Efeitos" style="text-decoration: underline dotted; cursor: help;">${totalBonusDesl}</span>` : "";
    const formulaDeslocamento = `4 + <span title="Agilidade" style="text-decoration: underline dotted; cursor: help;">${Math.floor(agilidade / 2)}</span>${efTextDesl}`;

    // Carga atual = soma do peso de todos os itens no inventário
    let cargaAtual = 0;
    for (const item of this.parent?.items ?? []) {
      cargaAtual += (Number(item.system?.peso) || 0) * (Number(item.system?.quantidade) || 1);
    }

    // Carga: Força × 5 (básica) e Força × 10 (máxima) — Errata/Manual do Combatente.
    // Efeito cargaComoForca soma na Força usada; fallback legado: "Coração da Montanha" (+2).
    let forcaCarga = forca + (this._efeitos?.cargaForca ?? 0);
    if (this.parent?.items?.find(i => i.name === "Coração da Montanha")) forcaCarga += 2;

    this.subattributes = {
      iniciativa:   { value: Math.max(agilidade, inteligencia) },
      deslocamento: { value: deslocamento, baseName: "Agilidade", baseValor: agilidade, formulaVisual: formulaDeslocamento },
      corrida:      { value: deslocamento * (this.equipamento?.pesadaEquipada ? 2 : 4) },
      carga: {
        value:       parseFloat(cargaAtual.toFixed(2)),
        max:         forcaCarga * 5,
        maxAbsoluto: forcaCarga * 10,
      },
    };
  }
}
