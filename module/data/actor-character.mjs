import { calcularEquipamento } from "../helpers/equipamento.mjs";

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

    const pvBonus = this._efeitos?.pv ?? 0;
    const pmBonus = this._efeitos?.pm ?? 0;

    if (this.resources?.vida) {
      const baseVida = Number(this.resources.vida.baseMax) || Number(this.resources.vida.max) || 60;
      this.resources.vida.baseMax = baseVida;
      this.resources.vida.max = baseVida + pvBonus;
      this.resources.vida.value = Math.min(
        Math.max(Number(this.resources.vida.value) || 0, 0),
        Number(this.resources.vida.max) || 60
      );
    }
    if (this.resources?.mana) {
      const baseMana = Number(this.resources.mana.baseMax) || Number(this.resources.mana.max) || 60;
      this.resources.mana.baseMax = baseMana;
      this.resources.mana.max = baseMana + pmBonus;
      this.resources.mana.value = Math.min(
        Math.max(Number(this.resources.mana.value) || 0, 0),
        Number(this.resources.mana.max) || 60
      );
    }
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
      pv: 0,
      pm: 0,
      defesaBase: 5,
      rd: 0,
    };

    const items = this.parent?.items ?? [];
    for (const item of items) {
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
          case "bonusPV":
            acc.pv += Number(ef.valor) || 0;
            break;
          case "bonusPM":
            acc.pm += Number(ef.valor) || 0;
            break;
          case "defesaBase":
            if (Number(ef.valor) > acc.defesaBase) acc.defesaBase = Number(ef.valor);
            break;
          case "reducaoDano":
          case "bonusRD":
            acc.rd += Number(ef.valor) || 0;
            break;
        }
      }

      // Reconhecimento de habilidades canônicas por nome
      const nome = String(item.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const slug = String(item.flags?.["mighty-blade"]?.slug || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      if (nome === "durao") {
        acc.pv += 5;
        acc.defesa.determinacao += 2;
      } else if (nome === "sangue orc") {
        acc.pv += 10;
      } else if (nome === "vitalidade de gigante" || nome === "vitalidade") {
        acc.pv += 10;
      } else if (
        nome === "reserva mistica" ||
        nome === "foco arcano" ||
        nome === "dom arcano"
      ) {
        // Fallback apenas se o item não declarou bonusPM como efeito (evita dupla contagem)
        const jaTemEfeitoPM = (item.system?.efeitos || []).some((e) => e.tipo === "bonusPM");
        if (!jaTemEfeitoPM) acc.pm += 10; // GB: +10 PM
      } else if (
        nome === "heranca feerica" ||
        nome === "intelecto elfico"
      ) {
        // GB p.52: +5 PM cada (não +10)
        const jaTemEfeitoPM = (item.system?.efeitos || []).some((e) => e.tipo === "bonusPM");
        if (!jaTemEfeitoPM) acc.pm += 5;
      } else if (nome === "cabeca dura") {
        if (!item.system?.efeitos?.some((e) => e.tipo === "bonusDefesa" && e.defesa === "determinacao")) {
          acc.defesa.determinacao += 2;
        }
      } else if (nome === "pacto da loucura" || nome === "espelhar loucura") {
        acc.defesa.determinacao += 2;
      } else if (nome === "dancarino do ar") {
        acc.defesa.esquiva += 1;
      } else if (nome === "nanismo" || slug === "nanismo") {
        acc.defesaBase = Math.max(acc.defesaBase, 6);
      } else if (nome === "forma da raposa" || slug === "forma-da-raposa" || nome.includes("forma da raposa")) {
        acc.defesaBase = Math.max(acc.defesaBase, 7);
      } else if (nome === "patas com cascos" || nome === "pernas vulpinas" || nome === "salteador" || nome === "passo das planicies" || nome === "passo veloz") {
        acc.deslocamento += 1;
      } else if (nome === "coracao da montanha") {
        acc.cargaForca += 2;
      }
    }

    // Bônus racial de deslocamento caso a raça seja Fauno, Tailox ou Gnoll
    const racaNome = String(this.parent?.system?.details?.raca || this.details?.raca || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const racaDoc = items.find((i) => i.type === "raca");
    const racaDocNome = racaDoc ? String(racaDoc.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    if (racaNome === "fauno" || racaDocNome === "fauno" || racaNome === "tailox" || racaDocNome === "tailox" || racaNome === "gnoll" || racaDocNome === "gnoll") {
      const jaTemHabDesl = items.some((i) => {
        const n = String(i.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        return n === "patas com cascos" || n === "pernas vulpinas" || n === "salteador";
      });
      if (!jaTemHabDesl) {
        acc.deslocamento += 1;
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
    const faixa = String(this.parent?.system?.details?.faixaEtaria || this.details?.faixaEtaria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // Filhotes: Todos os atributos são estritamente 1 e sem benefícios raciais
    if (faixa === "filhote") {
      if (!this.attributes) {
        this.attributes = {
          forca: { base: 1, value: 1 },
          agilidade: { base: 1, value: 1 },
          inteligencia: { base: 1, value: 1 },
          vontade: { base: 1, value: 1 },
        };
      }
      for (const key of ["forca", "agilidade", "inteligencia", "vontade"]) {
        if (!this.attributes[key]) this.attributes[key] = { base: 1, value: 1 };
        this.attributes[key].base = 1;
        this.attributes[key].value = 1;
      }
      return;
    }

    const semBeneficiosRaciais = this.details?.beneficiosRaciais === false || this.parent?.system?.details?.beneficiosRaciais === false || faixa === "crianca";
    const race   = semBeneficiosRaciais ? null : this.parent?.items?.find(i => i.type === "raca");
    const classe = this.parent?.items?.find(i => i.type === "classe");
    const raceAttrs   = race?.system?.atributos   ?? {};
    const classeAttrs = classe?.system?.atributos ?? {};
    const bonus = this._efeitos?.atributo ?? { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 };

    if (!this.attributes) {
      this.attributes = {
        forca: { base: 0, value: 0 },
        agilidade: { base: 0, value: 0 },
        inteligencia: { base: 0, value: 0 },
        vontade: { base: 0, value: 0 },
      };
    }

    for (const key of ["forca", "agilidade", "inteligencia", "vontade"]) {
      if (!this.attributes[key]) {
        this.attributes[key] = { base: 0, value: 0 };
      }
      this.attributes[key].value =
        (this.attributes[key].base   ?? this.attributes[key].value ?? 0) +
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
    this.equipamento = calcularEquipamento(this.parent);
  }

  // Bloqueio = Defesa Base + Força + Armadura + Escudo + Bônus
  // Esquiva = Defesa Base + Agilidade + Armadura + Bônus
  // Determinação = Vontade + Bônus de Habilidades (ex: Durão +2, Cabeça Dura +2, Pacto da Loucura +2)
  _prepareDefesas() {
    const eq = this.equipamento ?? { bonusArmadura: 0, bonusEscudo: 0, rd: 0 };
    const ef = this._efeitos?.defesa ?? { bloqueio: 0, esquiva: 0, determinacao: 0 };
    const base = this._efeitos?.defesaBase ?? 5;
    const forca = this.attributes.forca.value;
    const agilidade = this.attributes.agilidade.value;
    const inteligencia = this.attributes.inteligencia.value;
    const vontade = this.attributes.vontade.value;

    const bonusDet = ef.determinacao;
    const detValue = 8 + Math.max(inteligencia, vontade) + bonusDet; // GB p.36: 8 + maior(VON, INT) + bônus

    const eqTextBloq = (eq.bonusArmadura + eq.bonusEscudo) > 0 ? ` + <span title="Armadura/Escudo" style="text-decoration: underline dotted; cursor: help;">${eq.bonusArmadura + eq.bonusEscudo}</span>` : "";
    const efTextBloq = ef.bloqueio > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${ef.bloqueio}</span>` : "";
    const formulaBloq = `${base} + <span title="Força" style="text-decoration: underline dotted; cursor: help;">${forca}</span>${eqTextBloq}${efTextBloq}`;

    const eqTextEsq = eq.bonusArmadura > 0 ? ` + <span title="Armadura" style="text-decoration: underline dotted; cursor: help;">${eq.bonusArmadura}</span>` : "";
    const efTextEsq = ef.esquiva > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${ef.esquiva}</span>` : "";
    const formulaEsq = `${base} + <span title="Agilidade" style="text-decoration: underline dotted; cursor: help;">${agilidade}</span>${eqTextEsq}${efTextEsq}`;

    // Penalidades de condições ativas (ex: Cego sofre penalidade de -2 na Defesa)
    const condTexto = String(this.parent?.system?.details?.condicao || this.details?.condicao || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const aflicoes = this.parent?.system?.details?.aflicoes || this.details?.aflicoes || [];
    const isCego = condTexto.includes("cego") || aflicoes.some((a) => String(a.id || a.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("cego"));
    const penalidadeCondicao = isCego ? -2 : 0;

    const efTextDet = bonusDet > 0 ? ` + <span title="Efeitos" style="text-decoration: underline dotted; cursor: help;">${bonusDet}</span>` : "";
    const formulaDet = `8 + <span title="maior(VON, INT)" style="text-decoration: underline dotted; cursor: help;">${Math.max(inteligencia, vontade)}</span>${efTextDet}`;

    const bonusCanalizacao = this.canalizacaoApostata?.tipo === "rd"
      ? (Number(this.canalizacaoApostata.valor) || 0)
      : (this.parent?.system?.canalizacaoApostata?.tipo === "rd"
        ? (Number(this.parent.system.canalizacaoApostata.valor) || 0)
        : 0);

    const bonusRD = (this._efeitos?.rd ?? 0) + bonusCanalizacao;

    this.defesas = {
      defesaBase:   base,
      bloqueio:     { value: base + forca + eq.bonusArmadura + eq.bonusEscudo + ef.bloqueio + penalidadeCondicao, baseValor: forca, baseName: "Força", defesaBase: base, bonusArmadura: eq.bonusArmadura, bonusEscudo: eq.bonusEscudo, bonusBloqueio: ef.bloqueio, penalidadeCondicao, formulaVisual: formulaBloq },
      esquiva:      { value: base + agilidade + eq.bonusArmadura + ef.esquiva + penalidadeCondicao, baseValor: agilidade, baseName: "Agilidade", defesaBase: base, bonusArmadura: eq.bonusArmadura, bonusEsquiva: ef.esquiva, penalidadeCondicao, formulaVisual: formulaEsq },
      determinacao: { value: detValue, baseValor: Math.max(inteligencia, vontade), baseName: "maior(VON, INT)", vontade, inteligencia, bonus: bonusDet, estatica: detValue, formulaVisual: formulaDet },
      rd:           { value: (eq.rd ?? 0) + bonusRD },
      penalidadeCondicoes: penalidadeCondicao,
    };
  }

  // Iniciativa, Deslocamento, Corrida e Carga
  _prepareSubattributes() {
    const forca        = this.attributes.forca.value;
    const agilidade    = this.attributes.agilidade.value;
    const inteligencia = this.attributes.inteligencia.value;

    const bonusDesl = this._efeitos?.deslocamento ?? 0;
    const deslocamento = Math.floor(agilidade / 2) + 5 + bonusDesl; // GB p.19: ⌊AGI/2⌋ + 5

    const efTextDesl = bonusDesl > 0 ? ` + <span title="Bônus/Efeitos" style="text-decoration: underline dotted; cursor: help;">${bonusDesl}</span>` : "";
    const formulaDeslocamento = `5 + <span title="Agilidade" style="text-decoration: underline dotted; cursor: help;">${Math.floor(agilidade / 2)}</span>${efTextDesl}`;

    // Carga atual = soma do peso de todos os itens no inventário
    let cargaAtual = 0;
    for (const item of this.parent?.items ?? []) {
      cargaAtual += (Number(item.system?.peso) || 0) * (Number(item.system?.quantidade) || 1);
    }

    let forcaCarga = forca + (this._efeitos?.cargaForca ?? 0);
    // GB p.21: Básica = FOR×7 kg; Pesada = até FOR×35 kg (5× básica); Máxima = até FOR×70 kg (10× básica)
    // Manual do Combatente (expansão, não sobrepõe GB core): Básica = FOR×20 kg, Máxima = FOR×40 kg
    const basicaPadrao = forcaCarga * 7;         // GB: FOR×7 kg
    const pesadaPadrao = forcaCarga * 35;        // GB: FOR×35 kg (5× básica) — sobrecarga parcial
    const maximaPadrao = forcaCarga * 70;        // GB: FOR×70 kg (10× básica) — imobilizado
    const basicaCombatente = forcaCarga * 20;    // Combatente (expansão)

    const fatorCorrida = this.equipamento?.fatorCorrida ?? (this.equipamento?.pesadaEquipada ? 3 : 4);

    this.subattributes = {
      iniciativa:   { value: Math.max(agilidade, inteligencia) },
      deslocamento: { value: deslocamento, baseName: "Agilidade", baseValor: agilidade, base: Math.floor(agilidade / 2) + 5, bonus: bonusDesl, formulaVisual: formulaDeslocamento },
      corrida:      { value: deslocamento * fatorCorrida },
      carga: {
        value:            parseFloat(cargaAtual.toFixed(2)),
        basica:           basicaPadrao,       // GB: FOR×7 kg — sem penalidade
        basicaPadrao:     basicaPadrao,
        pesadaPadrao:     pesadaPadrao,       // GB: FOR×35 kg (5× básica) — metade deslocamento + inapto
        maximaPadrao:     maximaPadrao,       // GB: FOR×70 kg (10× básica) — imobilizado
        basicaCombatente: basicaCombatente,   // Combatente (expansão)
        max:              basicaPadrao,
        maxima:           maximaPadrao,
        maximaCombatente: forcaCarga * 40,
        maxAbsoluto:      maximaPadrao,
        forcaEfetiva:     forcaCarga,
      },
    };
  }
}
